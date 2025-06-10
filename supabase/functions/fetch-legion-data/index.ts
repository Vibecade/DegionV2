import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Environment variables will be available in production
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const legionBearerToken = Deno.env.get("LEGION_BEARER_TOKEN") || "";

// Types for Legion API data
interface LegionProject {
  name: string;
  chain: string;
  contract: string;
  stage: string;
  asset: string;
  fdv: string;
  target: string;
  tge: string;
  vest: number;
  cliff: number;
  lock: number;
  requested: string;
  description?: string;
}

interface ProjectUpdate {
  id: string;
  name: string;
  status: string;
  launchDate: string;
  seedPrice: string;
  description: string;
  vestingEnd?: string;
}

// Constants
const API_URL = "https://legion.cc/api/v1/rounds";

// Updated KNOWN_TOKENS array with all expected tokens
const KNOWN_TOKENS = [
  "fuel", "silencio", "almanak", "pulse", "enclave", "enclavemoney", 
  "fragmetric", "corn", "giza", "nil", "eoracle", "intuition", 
  "inferencelabs", "hyperlane", "electron", "litprotocol", "skate", 
  "session", "resolv", "arcium"
];

// Convert Legion stage to our status format
function mapStageToStatus(stage: string): string {
  switch (stage.toLowerCase()) {
    case "live":
      return "Live";
    case "closed":
    case "upcoming":
      return "Pending TGE";
    case "open":
      return "ICO Soon";
    default:
      return "ICO Soon";
  }
}

// Format numbers for display
function formatPrice(value: string | number): string {
  if (typeof value === "string") {
    // If value is already formatted like "$0.02", return it
    if (value.startsWith("$")) return value;
    
    // Try to parse the number
    const number = parseFloat(value);
    if (isNaN(number)) return "$TBD";
    
    return `$${number.toFixed(6)}`;
  } else {
    return `$${value.toFixed(6)}`;
  }
}

// Helper function to convert TGE string to a formal date
function formatTGE(tge: string): string {
  // If it's already a quarter format like "Q1 2025"
  if (/Q[1-4]\s+\d{4}/.test(tge)) return tge;
  
  // If it's a quarter range like "Q1/Q2 2025"
  if (/Q[1-4]\/Q[1-4]\s+\d{4}/.test(tge)) return tge;
  
  // If it's just a year
  if (/^\d{4}$/.test(tge)) return tge;
  
  // Default to TBD if format is unknown
  return "TBD";
}

// Enhanced vesting logic to construct descriptive string
function formatVestingEnd(vest: number, cliff: number, lock: number): string {
  const vestingMonths = Math.ceil(vest / 30);
  const cliffMonths = Math.ceil(cliff / 30);
  const lockMonths = Math.ceil(lock / 30);
  
  let vestingDescription = "";
  
  // Handle different vesting scenarios
  if (lockMonths > 0 && vestingMonths > 0) {
    vestingDescription = `${lockMonths}-month lockup, then ${vestingMonths}-month linear vest`;
  } else if (lockMonths > 0) {
    vestingDescription = `${lockMonths}-month lockup`;
  } else if (vestingMonths > 0 && cliffMonths > 0) {
    vestingDescription = `${cliffMonths}-month cliff, then ${vestingMonths}-month linear vest`;
  } else if (vestingMonths > 0) {
    vestingDescription = `${vestingMonths}-month linear vest`;
  } else {
    vestingDescription = "100% at TGE";
  }
  
  return vestingDescription;
}

// Map chain names to standardized network names
function mapChainToNetwork(chain: string): string {
  switch (chain.toLowerCase()) {
    case "ethereum":
    case "eth":
      return "ethereum";
    case "arbitrum":
    case "arb":
      return "arbitrum";
    case "polygon":
    case "matic":
      return "polygon";
    case "base":
      return "base";
    case "optimism":
    case "op":
      return "optimism";
    default:
      return chain.toLowerCase();
  }
}

// Parse funds raised from requested field
function parseFundsRaised(requested: string): number {
  if (!requested) return 0;
  
  // Remove currency symbols and commas
  const cleanValue = requested.replace(/[$,]/g, '');
  
  // Handle different formats like "1M", "1.5K", etc.
  const multipliers: { [key: string]: number } = {
    'k': 1000,
    'm': 1000000,
    'b': 1000000000
  };
  
  const match = cleanValue.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);
  if (match) {
    const value = parseFloat(match[1]);
    const multiplier = match[2] ? multipliers[match[2].toLowerCase()] || 1 : 1;
    return value * multiplier;
  }
  
  // Try direct parsing
  const directValue = parseFloat(cleanValue);
  return isNaN(directValue) ? 0 : directValue;
}

// Get current UTC date in ISO format
function getCurrentUTCDate(): string {
  return new Date().toISOString();
}

// Main function to fetch and process Legion data
async function fetchLegionData(): Promise<LegionProject[]> {
  try {
    if (!legionBearerToken) {
      throw new Error("Legion bearer token is not configured");
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${legionBearerToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process the data into our format
    const projects: LegionProject[] = [];
    
    for (const project of data) {
      // Extract relevant fields
      const processedProject: LegionProject = {
        name: project.name || "",
        chain: project.chain || "",
        contract: project.contract || "",
        stage: project.stage || "",
        asset: project.asset || "USDC",
        fdv: project.fdv || "",
        target: project.target || "",
        tge: project.tge || "TBD",
        vest: parseInt(project.vest) || 0,
        cliff: parseInt(project.cliff) || 0,
        lock: parseInt(project.lock) || 0,
        requested: project.requested || "",
        description: project.description || ""
      };
      
      projects.push(processedProject);
    }
    
    return projects;
  } catch (error) {
    console.error("Error fetching Legion data:", error);
    throw error;
  }
}

// Update Supabase with the fetched data
async function updateDatabase(projects: LegionProject[]): Promise<void> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials are not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Track updates for logging
  const updates: { tokenId: string, updated: boolean, error?: string }[] = [];
  
  for (const project of projects) {
    try {
      // Try to find a matching token in our known list
      // First try exact match, then case-insensitive
      const tokenId = KNOWN_TOKENS.find(id => 
        id.toLowerCase() === project.name.toLowerCase()
      );
      
      if (!tokenId) {
        updates.push({ tokenId: project.name, updated: false, error: "Token not in known list" });
        continue;
      }
      
      // Prepare the vesting description
      const vestingEnd = formatVestingEnd(project.vest, project.cliff, project.lock);
      
      // Prepare the update for token_info with new columns
      const tokenInfoData: ProjectUpdate = {
        id: tokenId,
        name: project.name,
        status: mapStageToStatus(project.stage),
        launchDate: formatTGE(project.tge),
        seedPrice: formatPrice(project.target),
        description: project.description || "",
        vestingEnd: vestingEnd
      };

      // Prepare links object (empty for now, can be populated later)
      const links = {
        website: "",
        twitter: ""
      };
      
      // Update token_info table with new column structure
      const { error: tokenInfoError } = await supabase
        .from('token_info')
        .upsert({
          token_id: tokenId,
          name: project.name,
          status: mapStageToStatus(project.stage),
          launch_date: formatTGE(project.tge),
          seed_price: formatPrice(project.target),
          vesting_end: vestingEnd,
          description: project.description || "",
          links: links,
          data: tokenInfoData, // Keep the full object in JSONB for flexibility
          updated_at: getCurrentUTCDate()
        }, { onConflict: 'token_id' });
      
      if (tokenInfoError) {
        throw new Error(`Error updating token info: ${tokenInfoError.message}`);
      }
      
      // Update token_sales_details table if we have contract and chain info
      if (project.contract && project.chain) {
        const fundsRaised = parseFundsRaised(project.requested);
        
        const { error: salesError } = await supabase
          .from('token_sales_details')
          .upsert({
            token_id: tokenId,
            address: project.contract,
            network: mapChainToNetwork(project.chain),
            funds_raised_usdc: fundsRaised,
            participants: 0, // Not available from Legion API - to be populated from other sources
            transactions: 0, // Not available from Legion API - to be populated from other sources
            updated_at: getCurrentUTCDate()
          }, { onConflict: 'token_id' });
        
        if (salesError) {
          console.warn(`Warning: Could not update sales details for ${tokenId}: ${salesError.message}`);
          // Don't throw error here as token_info update was successful
        }
      }
      
      updates.push({ tokenId, updated: true });
    } catch (error) {
      console.error(`Error updating ${project.name}:`, error);
      updates.push({ tokenId: project.name, updated: false, error: error.message });
    }
  }
  
  // Log update results to a log table for monitoring
  try {
    const { error: logError } = await supabase
      .from('legion_api_logs')
      .insert({
        timestamp: getCurrentUTCDate(),
        projects_count: projects.length,
        updates: updates,
        success: updates.filter(u => u.updated).length,
        errors: updates.filter(u => !u.updated).length
      });
    
    if (logError) {
      console.error("Error logging API results:", logError);
    }
  } catch (error) {
    console.error("Error writing to log table:", error);
  }
}

// CORS headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Serve the edge function
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  // Check for authorization
  const url = new URL(req.url);
  const adminKey = url.searchParams.get('admin_key');
  const isAuthorized = adminKey === Deno.env.get("LEGION_ADMIN_KEY");
  
  if (!isAuthorized) {
    return new Response(JSON.stringify({
      error: "Unauthorized. Admin key required.",
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
  
  try {
    // Fetch data from Legion API
    const projects = await fetchLegionData();
    
    // Update database with fetched data
    await updateDatabase(projects);
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Legion data fetched and updated successfully",
      count: projects.length,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in edge function:", error);
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
});
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Environment variables will be available in production
const duneApiKey = Deno.env.get("DUNE_API_KEY") || "";
const duneHoldersQueryId = Deno.env.get("DUNE_HOLDERS_QUERY_ID") || "";
const duneVolumeQueryId = Deno.env.get("DUNE_VOLUME_QUERY_ID") || "";
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
  holdersCount?: number;
  volume24h?: number;
}

// Constants
const API_URL = "https://legion.cc/api/v1/rounds";
const DUNE_API_BASE_URL = "https://api.dune.com/api/v1/query";

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

// Helper function to execute a Dune query
async function executeDuneQuery(queryId: string, params: Record<string, any>): Promise<any[] | null> {
  if (!duneApiKey || !queryId) {
    console.warn("Dune API key or query ID not configured");
    return null;
  }

  const headers = {
    "X-Dune-Api-Key": duneApiKey,
    "Content-Type": "application/json",
  };

  try {
    console.log(`🔄 Executing Dune query ${queryId} with params:`, params);
    
    // Step 1: Execute the query
    const executeResponse = await fetch(`${DUNE_API_BASE_URL}/${queryId}/execute`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query_parameters: params }),
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      throw new Error(`Dune query execution failed: ${executeResponse.status} ${errorText}`);
    }

    const executeData = await executeResponse.json();
    const executionId = executeData.execution_id;

    if (!executionId) {
      throw new Error("Failed to get Dune execution ID");
    }

    console.log(`⏳ Polling for Dune query results (execution ID: ${executionId})`);

    // Step 2: Poll for results
    let status = "pending";
    let resultData: any = null;
    const MAX_POLLING_ATTEMPTS = 15; // Increased attempts for longer queries
    let attempts = 0;

    while (status !== "completed" && status !== "failed" && attempts < MAX_POLLING_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
      
      const statusResponse = await fetch(`${DUNE_API_BASE_URL}/${queryId}/results/${executionId}`, {
        headers: headers,
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Dune query status check failed: ${statusResponse.status} ${errorText}`);
      }

      const statusJson = await statusResponse.json();
      status = statusJson.state;
      
      if (status === "completed") {
        resultData = statusJson.result?.rows;
      }
      
      attempts++;
      console.log(`📊 Dune query ${queryId} status: ${status} (attempt ${attempts}/${MAX_POLLING_ATTEMPTS})`);
    }

    if (status === "completed" && resultData) {
      console.log(`✅ Dune query ${queryId} completed successfully with ${resultData.length} rows`);
      return resultData;
    } else if (status === "failed") {
      console.error(`❌ Dune query ${queryId} failed`);
      return null;
    } else {
      console.warn(`⏰ Dune query ${queryId} timed out. Status: ${status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error executing Dune query ${queryId}:`, error);
    return null;
  }
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
      
      // Initialize Dune data variables
      let holdersCount = 0;
      let volume24h = 0;

      // Fetch Dune data if contract address is available
      if (project.contract && duneHoldersQueryId && duneVolumeQueryId) {
        console.log(`🔍 Fetching Dune data for ${tokenId} (contract: ${project.contract})`);
        
        const duneParams = { 
          contract_address: project.contract.toLowerCase() // Ensure lowercase for consistency
        };
        
        // Fetch token holders count
        try {
          const holdersResult = await executeDuneQuery(duneHoldersQueryId, duneParams);
          if (holdersResult && holdersResult.length > 0) {
            // Assuming the Dune query returns a row with a 'holders' or 'holder_count' column
            holdersCount = holdersResult[0].holders || holdersResult[0].holder_count || 0;
            console.log(`👥 Holders count for ${tokenId}: ${holdersCount}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch holders data for ${tokenId}:`, error);
        }

        // Fetch 24h trading volume
        try {
          const volumeResult = await executeDuneQuery(duneVolumeQueryId, duneParams);
          if (volumeResult && volumeResult.length > 0) {
            // Assuming the Dune query returns a row with a 'volume' or 'volume_24h' column
            volume24h = volumeResult[0].volume || volumeResult[0].volume_24h || 0;
            console.log(`📊 24h volume for ${tokenId}: $${volume24h}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch volume data for ${tokenId}:`, error);
        }
      } else {
        console.warn(`⚠️ Skipping Dune data fetch for ${tokenId}: Missing contract address or Dune query IDs`);
      }

      // Prepare the update for token_info with new columns
      const tokenInfoData: ProjectUpdate = {
        id: tokenId,
        name: project.name,
        status: mapStageToStatus(project.stage),
        launchDate: formatTGE(project.tge),
        seedPrice: formatPrice(project.target),
        description: project.description || "",
        vestingEnd: vestingEnd,
        holdersCount: holdersCount,
        volume24h: volume24h
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
        errors: updates.filter(u => !u.updated).length,
        dune_enabled: !!(duneApiKey && duneHoldersQueryId && duneVolumeQueryId)
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
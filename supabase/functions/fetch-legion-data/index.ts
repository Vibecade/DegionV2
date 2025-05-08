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
const KNOWN_TOKENS = [
  "fuel", "silencio", "almanak", "pulse", "enclave", "corn", 
  "giza", "nil", "eoracle", "hyperlane", "electron", "litprotocol", 
  "skate", "resolv"
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
      
      // Prepare the update
      const update: ProjectUpdate = {
        id: tokenId,
        name: project.name,
        status: mapStageToStatus(project.stage),
        launchDate: formatTGE(project.tge),
        seedPrice: formatPrice(project.target),
        description: project.description || "",
      };
      
      // Add vesting information if available
      if (project.vest > 0) {
        // Convert days to months roughly
        const vestingMonths = Math.ceil(project.vest / 30);
        update.vestingEnd = `${vestingMonths} Months`;
      }
      
      // Update token_info table
      // First check if we have this table in our schema
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('token_info')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        // Table doesn't exist, create it
        const { error: createError } = await supabase.rpc('create_token_info_table');
        if (createError) {
          throw new Error(`Error creating token_info table: ${createError.message}`);
        }
      }
      
      // Insert or update the token info
      const { error: upsertError } = await supabase
        .from('token_info')
        .upsert({
          token_id: tokenId,
          data: update,
          updated_at: getCurrentUTCDate()
        }, { onConflict: 'token_id' });
      
      if (upsertError) {
        throw new Error(`Error updating token info: ${upsertError.message}`);
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
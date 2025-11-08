import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('n8n dashboard upload request received');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      html_content, 
      dashboard_name = 'Smart Dashboard', 
      workflow_id,
      created_by_workflow,
      metadata = {} 
    } = await req.json();

    if (!html_content) {
      return new Response(JSON.stringify({ error: 'html_content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Uploading dashboard: ${dashboard_name}, workflow: ${workflow_id}`);

    // Deactivate existing dashboards first
    const { error: deactivateError } = await supabase
      .from('n8n_dashboards')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating existing dashboards:', deactivateError);
    }

    // Get the next version number
    const { data: latestVersion } = await supabase
      .from('n8n_dashboards')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Insert new dashboard
    const { data, error } = await supabase
      .from('n8n_dashboards')
      .insert([{
        dashboard_name,
        html_content,
        workflow_id,
        version: nextVersion,
        is_active: true,
        metadata,
        created_by_workflow
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting dashboard:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Dashboard uploaded successfully: ID ${data.id}, Version ${nextVersion}`);

    return new Response(JSON.stringify({ 
      success: true, 
      dashboard: data,
      message: `Dashboard uploaded successfully as version ${nextVersion}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in n8n-dashboard-upload function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
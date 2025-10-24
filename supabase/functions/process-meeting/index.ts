import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meeting_id, recording_url, meeting_type, user_id } = await req.json();

    console.log('Processing meeting:', { meeting_id, recording_url, meeting_type, user_id });

    // Send to webhook
    const webhookResponse = await fetch('https://primary-production-245af.up.railway.app/webhook-test/PEmeeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_id,
        recording_url,
        meeting_type,
        user_id,
      }),
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook response data:', webhookData);

    // If webhook returns HTML summary, update the database
    if (webhookData.summary_html) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: updateError } = await supabase
        .from('meeting_summaries')
        .update({ summary_html: webhookData.summary_html })
        .eq('id', meeting_id);

      if (updateError) {
        console.error('Error updating meeting summary:', updateError);
        throw updateError;
      }

      console.log('Meeting summary updated successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Meeting processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing meeting:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

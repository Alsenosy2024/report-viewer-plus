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

    // Download the video file from storage
    console.log('Downloading video from storage...');
    const videoResponse = await fetch(recording_url);
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.blob();
    console.log('Video downloaded, size:', videoBlob.size, 'bytes');

    // Create form data with the video file
    const formData = new FormData();
    formData.append('video', videoBlob, `${meeting_id}.webm`);
    formData.append('meeting_id', meeting_id);
    formData.append('meeting_type', meeting_type);
    formData.append('user_id', user_id);

    // Send video file to webhook
    console.log('Sending video to webhook...');
    const webhookResponse = await fetch('https://primary-production-245af.up.railway.app/webhook-test/PEmeeting', {
      method: 'POST',
      body: formData,
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

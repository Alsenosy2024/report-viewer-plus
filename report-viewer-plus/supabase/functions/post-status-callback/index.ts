import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallbackPayload {
  post_id: string;
  status: 'posted' | 'failed';
  external_post_id?: string;
  error_message?: string;
  posted_at?: string;
  platform_response?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming callback payload
    const payload: CallbackPayload = await req.json();
    console.log('Received callback payload:', payload);

    // Validate required fields
    if (!payload.post_id || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: post_id and status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status value
    if (payload.status !== 'posted' && payload.status !== 'failed') {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be "posted" or "failed"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if post exists and is in posting status
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', payload.post_id)
      .single();

    if (fetchError || !post) {
      console.error('Post not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data based on status
    const updateData: any = {
      posting_status: payload.status,
    };

    if (payload.status === 'posted') {
      updateData.posted_at = payload.posted_at || new Date().toISOString();
      if (payload.external_post_id) {
        updateData.external_post_id = payload.external_post_id;
      }
      // Clear any previous error
      updateData.posting_error = null;
    } else if (payload.status === 'failed') {
      updateData.posting_error = payload.error_message || 'Unknown error occurred';
    }

    // Store platform response in metadata if provided
    if (payload.platform_response) {
      const currentMetadata = post.metadata || {};
      updateData.metadata = {
        ...currentMetadata,
        platform_response: payload.platform_response,
        last_callback_at: new Date().toISOString(),
      };
    }

    // Update the post in the database
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', payload.post_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update post', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Post updated successfully:', updatedPost);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post status updated to ${payload.status}`,
        post: updatedPost,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in post-status-callback function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

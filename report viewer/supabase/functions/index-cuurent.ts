import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from "npm:livekit-server-sdk@2.14.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    // Create Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Get the user from the auth token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    // Parse request body
    const { participantName } = await req.json();
    // Generate UNIQUE room name every time
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uniqueRoomName = `voice-${timestamp}-${random}`;
    console.log(`🎯 Creating token for UNIQUE room: ${uniqueRoomName}`);
    // Get LiveKit credentials from environment
    const livekitUrl = Deno.env.get('LIVEKIT_URL');
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    if (!livekitUrl || !apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }
    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName || user.id,
      name: participantName || user.email || 'User'
    });
    // Grant permissions to join the room
    at.addGrant({
      roomJoin: true,
      room: uniqueRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    // Generate JWT token
    const token = await at.toJwt();
    // Notify Railway agent to join the room
    const railwayUrl = Deno.env.get('RAILWAY_AGENT_URL');
    if (railwayUrl) {
      try {
        const agentResponse = await fetch(`${railwayUrl}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            room_name: uniqueRoomName,
            participant_identity: participantName || user.id
          })
        });
        if (!agentResponse.ok) {
          console.warn('Failed to notify agent:', await agentResponse.text());
        } else {
          console.log('Agent notified successfully');
        }
      } catch (agentError) {
        console.warn('Error notifying agent:', agentError);
      // Don't fail the token generation if agent notification fails
      }
    }
    return new Response(JSON.stringify({
      token,
      url: livekitUrl,
      roomName: uniqueRoomName
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});

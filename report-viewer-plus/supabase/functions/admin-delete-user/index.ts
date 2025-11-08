// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Missing Supabase environment variables" }, 500);
    }

    // Authenticate caller and ensure admin role
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: roleData, error: roleError } = await supabaseUser.rpc("get_user_role", {
      user_id: userData.user.id,
    });
    if (roleError || roleData !== "admin") {
      return jsonResponse({ error: "Forbidden: admin only" }, 403);
    }

    const body = await req.json();
    const userId: string | undefined = body?.userId;
    if (!userId) return jsonResponse({ error: "Missing userId" }, 400);

    if (userId === userData.user.id) {
      return jsonResponse({ error: "You cannot delete your own account" }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Clean related rows first
    const { error: permErr } = await supabaseAdmin.from("section_permissions").delete().eq("user_id", userId);
    if (permErr) {
      return jsonResponse({ error: `Failed to delete permissions: ${permErr.message}` }, 400);
    }

    const { error: profErr } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profErr) {
      return jsonResponse({ error: `Failed to delete profile: ${profErr.message}` }, 400);
    }

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) {
      return jsonResponse({ error: delErr.message }, 400);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("admin-delete-user error", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

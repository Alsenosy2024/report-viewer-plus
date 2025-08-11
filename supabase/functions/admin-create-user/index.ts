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

function randomPassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Missing Supabase environment variables" }, 500);
    }

    // AuthN the caller to ensure only admins can use this function
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Check role via security definer function
    const { data: roleData, error: roleError } = await supabaseUser.rpc("get_user_role", {
      user_id: userData.user.id,
    });
    if (roleError || roleData !== "admin") {
      return jsonResponse({ error: "Forbidden: admin only" }, 403);
    }

    const body = await req.json();
    const email: string | undefined = body?.email;
    const full_name: string | undefined = body?.full_name;
    const role: "admin" | "user" | undefined = body?.role;
    const approved: boolean = Boolean(body?.approved);

    if (!email || !role) {
      return jsonResponse({ error: "Missing required fields: email, role" }, 400);
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user with a temporary password
    const tempPassword = randomPassword();
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? email },
    });

    if (createErr || !createdUser?.user) {
      return jsonResponse({ error: createErr?.message ?? "Failed to create user" }, 400);
    }

    // Upsert profile with chosen role and approval
    const profileRow = {
      id: createdUser.user.id,
      email,
      full_name: full_name ?? email,
      role,
      is_approved: approved,
      approved_at: approved ? new Date().toISOString() : null,
      approved_by: approved ? userData.user.id : null,
    } as const;

    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(profileRow, { onConflict: "id" });

    if (upsertErr) {
      return jsonResponse({ error: upsertErr.message }, 400);
    }

    return jsonResponse({
      ok: true,
      userId: createdUser.user.id,
      tempPassword, // Display to admin in UI to share securely
    });
  } catch (e) {
    console.error("admin-create-user error", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

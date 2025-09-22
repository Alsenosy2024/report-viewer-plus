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
    const email: string | undefined = body?.email;
    const full_name: string | undefined = body?.full_name;
    const role: "admin" | "user" | undefined = body?.role;
    const approved: boolean = Boolean(body?.approved);
    const password: string | undefined = body?.password;

    if (!email || !role || !password) {
      return jsonResponse({ error: "Missing required fields: email, role, password" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user with provided password
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? email },
    });

    if (createErr || !createdUser?.user) {
      console.error("User creation error:", createErr);
      let errorMessage = createErr?.message ?? "Failed to create user";
      
      // Handle specific error cases
      if (createErr?.message?.includes("already been registered")) {
        errorMessage = `A user with email ${email} already exists`;
      }
      
      return jsonResponse({ error: errorMessage }, 400);
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

    return jsonResponse({ ok: true, userId: createdUser.user.id });
  } catch (e) {
    console.error("admin-create-user error", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

import { createClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Map RevenueCat entitlement IDs to our subscription tier. */
function mapTier(entitlements: string[]): SubscriptionTier {
  if (entitlements.includes("premium")) return "PREMIUM";
  if (entitlements.includes("basic")) return "BASIC";
  return "FREE";
}

export async function POST(request: Request) {
  // 1. Authenticate via Supabase
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing token" }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  // 2. Read current tier from user_metadata
  const currentTier = user.user_metadata?.subscription_tier ?? "FREE";

  // 3. Fetch entitlements from RevenueCat REST API
  const rcApiKey = process.env.REVENUECAT_API_KEY;
  if (!rcApiKey) {
    // No API key configured — return current tier without syncing
    return Response.json({
      tier: currentTier,
      expiry: user.user_metadata?.subscription_expiry ?? null,
      synced: false,
    }, { headers: corsHeaders });
  }

  let rcTier: SubscriptionTier = "FREE";
  let rcExpiry: string | null = null;

  try {
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${user.id}`,
      { headers: { Authorization: `Bearer ${rcApiKey}` } },
    );

    if (rcResponse.ok) {
      const rcData = await rcResponse.json();
      const entitlements = rcData.subscriber?.entitlements ?? {};

      const activeEntitlements = Object.keys(entitlements).filter((key) => {
        const ent = entitlements[key];
        return ent.expires_date === null || new Date(ent.expires_date) > new Date();
      });

      rcTier = mapTier(activeEntitlements);

      // Find latest expiry
      for (const key of activeEntitlements) {
        const ent = entitlements[key];
        if (ent.expires_date && (!rcExpiry || ent.expires_date > rcExpiry)) {
          rcExpiry = ent.expires_date;
        }
      }
    }
  } catch {
    // RevenueCat API unreachable — return current tier
    return Response.json({
      tier: currentTier,
      expiry: user.user_metadata?.subscription_expiry ?? null,
      synced: false,
    }, { headers: corsHeaders });
  }

  // 4. Update Supabase if tier differs
  if (rcTier !== currentTier) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        subscription_tier: rcTier,
        subscription_expiry: rcExpiry,
      },
    });
  }

  return Response.json({
    tier: rcTier,
    expiry: rcExpiry,
    synced: rcTier !== currentTier,
  }, { headers: corsHeaders });
}

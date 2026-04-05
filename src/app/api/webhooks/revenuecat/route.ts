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
  // 1. Validate webhook signature
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Invalid signature" }, { status: 401, headers: corsHeaders });
    }
  }

  // 2. Parse event
  const body = await request.json();
  const event = body.event;
  if (!event) {
    return Response.json({ error: "No event" }, { status: 400, headers: corsHeaders });
  }

  const eventType: string = event.type;
  const appUserId: string | undefined = event.app_user_id;

  if (!appUserId) {
    return Response.json({ ok: true }, { headers: corsHeaders });
  }

  // 3. Determine new tier from entitlements
  const activeEntitlements: string[] = Object.keys(event.subscriber?.entitlements ?? {})
    .filter((key) => {
      const ent = event.subscriber.entitlements[key];
      return ent.expires_date === null || new Date(ent.expires_date) > new Date();
    });

  const tier = mapTier(activeEntitlements);

  // 4. Determine expiry (use latest expiry across active entitlements)
  let latestExpiry: string | null = null;
  for (const key of activeEntitlements) {
    const ent = event.subscriber.entitlements[key];
    if (ent.expires_date && (!latestExpiry || ent.expires_date > latestExpiry)) {
      latestExpiry = ent.expires_date;
    }
  }

  // 5. Determine product ID
  const productId: string | null = event.product_id ?? null;

  // 6. Check for billing issue
  const isBillingIssue = eventType === "BILLING_ISSUE";

  // 7. Update Supabase user_metadata via service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.updateUserById(appUserId, {
    user_metadata: {
      subscription_tier: tier,
      subscription_expiry: latestExpiry,
      subscription_product: productId,
      has_billing_issue: isBillingIssue ? true : undefined,
    },
  });

  if (error) {
    console.error("Failed to update user metadata:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ ok: true, tier }, { headers: corsHeaders });
}

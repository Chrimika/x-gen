import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { DEFAULT_PRICING } from "@/lib/pricing";

const ADMIN_EMAIL = "mbachristian58@gmail.com";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    if (decoded.email === ADMIN_EMAIL) return decoded;

    const adminDoc = await adminDb.collection("admins").doc(decoded.email!).get();
    return adminDoc.exists ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/config
 *
 * Returns the current pricing configuration.
 */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configSnap = await adminDb.collection("config").doc("pricing").get();
    const config = configSnap.exists ? configSnap.data() : DEFAULT_PRICING;

    // Also fetch admin PIN status (not the PIN itself)
    const adminConfigSnap = await adminDb.collection("config").doc("admin").get();
    const hasPin = adminConfigSnap.exists && !!adminConfigSnap.data()?.adminPin;

    return Response.json({ config, hasPin });
  } catch (error) {
    console.error("[Admin Config] Error fetching config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/config
 *
 * Update pricing config or admin PIN.
 * Body: { baseCostFCFA?, marginFCFA?, notchPayFeePercent?, adminPin?, currentPin? }
 */
export async function PUT(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle PIN update
    if (body.adminPin !== undefined) {
      const { adminPin, currentPin } = body;

      // Verify current PIN if one exists
      const adminConfigSnap = await adminDb.collection("config").doc("admin").get();
      if (adminConfigSnap.exists) {
        const existingPin = adminConfigSnap.data()?.adminPin;
        if (existingPin && existingPin !== currentPin) {
          return Response.json(
            { error: "Current PIN is incorrect" },
            { status: 403 }
          );
        }
      }

      await adminDb.collection("config").doc("admin").set(
        { adminPin, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      return Response.json({ success: true, message: "PIN updated" });
    }

    // Handle pricing update
    const { baseCostFCFA, marginFCFA, notchPayFeePercent } = body;

    const base = baseCostFCFA !== undefined ? Number(baseCostFCFA) : DEFAULT_PRICING.baseCostFCFA;
    const margin = marginFCFA !== undefined ? Number(marginFCFA) : DEFAULT_PRICING.marginFCFA;
    const fee =
      notchPayFeePercent !== undefined
        ? Number(notchPayFeePercent)
        : DEFAULT_PRICING.notchPayFeePercent;

    // Compute the full price: (base + margin) * (1 + fee), rounded to nearest 500
    const rawFullPrice = (base + margin) * (1 + fee);
    const fullPriceFCFA = Math.round(rawFullPrice / 500) * 500;

    const pricingData = {
      baseCostFCFA: base,
      marginFCFA: margin,
      notchPayFeePercent: fee,
      fullPriceFCFA,
      currency: "XAF",
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("config").doc("pricing").set(pricingData);

    return Response.json({ success: true, config: pricingData });
  } catch (error) {
    console.error("[Admin Config] Error updating config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

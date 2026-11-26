import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
 * POST /api/admin/plans
 *
 * Create a new plan.
 * Body: { name, startDate, endDate, totalSeats, priceUSD? }
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, startDate, endDate, totalSeats, priceUSD } = body;

    if (!name || !startDate || !endDate || !totalSeats) {
      return Response.json(
        { error: "Missing required fields: name, startDate, endDate, totalSeats" },
        { status: 400 }
      );
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    let status: "active" | "expired" | "upcoming" = "upcoming";
    if (now >= start && now <= end) status = "active";
    else if (now > end) status = "expired";

    const planRef = adminDb.collection("plans").doc();
    const planData = {
      id: planRef.id,
      name,
      startDate,
      endDate,
      totalSeats: Number(totalSeats),
      occupiedSeats: 0,
      priceUSD: priceUSD ? Number(priceUSD) : 0,
      status,
      createdAt: now.toISOString(),
    };

    await planRef.set(planData);

    return Response.json({ success: true, plan: planData }, { status: 201 });
  } catch (error) {
    console.error("[Admin Plans] Error creating plan:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/plans
 *
 * Update an existing plan.
 * Body: { id, ...fieldsToUpdate }
 */
export async function PUT(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json({ error: "Missing plan id" }, { status: 400 });
    }

    const planRef = adminDb.collection("plans").doc(id);
    const planSnap = await planRef.get();

    if (!planSnap.exists) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    // Recalculate status if dates changed
    if (updates.startDate || updates.endDate) {
      const existing = planSnap.data()!;
      const start = new Date(updates.startDate || existing.startDate);
      const end = new Date(updates.endDate || existing.endDate);
      const now = new Date();

      if (now >= start && now <= end) updates.status = "active";
      else if (now > end) updates.status = "expired";
      else updates.status = "upcoming";
    }

    if (updates.totalSeats) {
      updates.totalSeats = Number(updates.totalSeats);
    }

    updates.updatedAt = new Date().toISOString();
    await planRef.update(updates);

    const updated = await planRef.get();
    return Response.json({
      success: true,
      plan: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("[Admin Plans] Error updating plan:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

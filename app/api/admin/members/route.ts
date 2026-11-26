import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
 * POST /api/admin/members
 *
 * Register a previous member (not through the app flow).
 * Body: { email, displayName, planId, emailToAdd?, joinDate?, expiryDate?, heardAboutUs? }
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, displayName, planId, emailToAdd, joinDate, expiryDate, heardAboutUs } =
      body;

    if (!email || !displayName || !planId) {
      return Response.json(
        { error: "Missing required fields: email, displayName, planId" },
        { status: 400 }
      );
    }

    // Get plan info
    const planSnap = await adminDb.collection("plans").doc(planId).get();
    if (!planSnap.exists) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }
    const planData = planSnap.data()!;

    const now = new Date().toISOString();
    const memberRef = adminDb.collection("members").doc(email);

    const memberData = {
      id: email,
      uid: "",
      email,
      displayName,
      planId,
      planName: planData.name || "",
      joinDate: joinDate || now,
      expiryDate: expiryDate || planData.endDate || "",
      status: "active" as const,
      heardAboutUs: heardAboutUs || "admin-added",
      emailToAdd: emailToAdd || email,
      payments: [],
      createdAt: now,
    };

    await memberRef.set(memberData);

    // Increment occupied seats on the plan
    await adminDb.collection("plans").doc(planId).update({
      occupiedSeats: FieldValue.increment(1),
    });

    return Response.json({ success: true, member: memberData }, { status: 201 });
  } catch (error) {
    console.error("[Admin Members] Error creating member:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/members
 *
 * Update member data.
 * Body: { id (email), ...fieldsToUpdate }
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
      return Response.json({ error: "Missing member id (email)" }, { status: 400 });
    }

    const memberRef = adminDb.collection("members").doc(id);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    updates.updatedAt = new Date().toISOString();
    await memberRef.update(updates);

    const updated = await memberRef.get();
    return Response.json({
      success: true,
      member: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("[Admin Members] Error updating member:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members
 *
 * Remove a member. Decrements the plan's occupied seats.
 * Body: { id (email), planId }
 */
export async function DELETE(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, planId } = body;

    if (!id) {
      return Response.json({ error: "Missing member id (email)" }, { status: 400 });
    }

    const memberRef = adminDb.collection("members").doc(id);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    const memberData = memberSnap.data()!;
    const memberPlanId = planId || memberData.planId;

    await memberRef.delete();

    // Decrement occupied seats on the plan
    if (memberPlanId) {
      const planRef = adminDb.collection("plans").doc(memberPlanId);
      const planSnap = await planRef.get();
      if (planSnap.exists) {
        await planRef.update({
          occupiedSeats: FieldValue.increment(-1),
        });
      }
    }

    return Response.json({ success: true, deleted: id });
  } catch (error) {
    console.error("[Admin Members] Error deleting member:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "mbachristian58@gmail.com";

/**
 * Verify that the request comes from an authenticated admin user.
 * Returns the decoded token if valid, or null otherwise.
 */
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // Check admin status: either the hardcoded admin email or an entry in the admins collection
    if (decoded.email === ADMIN_EMAIL) {
      return decoded;
    }

    const adminDoc = await adminDb.collection("admins").doc(decoded.email!).get();
    if (adminDoc.exists) {
      return decoded;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin
 *
 * Returns all plans, members, payments, waiting list, and config.
 * Requires admin authentication.
 */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [plansSnap, membersSnap, paymentsSnap, waitingSnap, configSnap] =
      await Promise.all([
        adminDb.collection("plans").orderBy("createdAt", "desc").get(),
        adminDb.collection("members").orderBy("createdAt", "desc").get(),
        adminDb.collection("payments").orderBy("createdAt", "desc").get(),
        adminDb.collection("waiting").orderBy("createdAt", "desc").get(),
        adminDb.collection("config").doc("pricing").get(),
      ]);

    const plans = plansSnap.docs.map((doc: { id: string; data: () => Record<string, unknown> }) => ({ id: doc.id, ...doc.data() }));
    const members = membersSnap.docs.map((doc: { id: string; data: () => Record<string, unknown> }) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const payments = paymentsSnap.docs.map((doc: { id: string; data: () => Record<string, unknown> }) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const waiting = waitingSnap.docs.map((doc: { id: string; data: () => Record<string, unknown> }) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const config = configSnap.exists ? configSnap.data() : null;

    return Response.json({
      plans,
      members,
      payments,
      waiting,
      config,
    });
  } catch (error) {
    console.error("[Admin API] Error fetching data:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

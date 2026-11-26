import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * NotchPay webhook handler.
 *
 * Receives POST callbacks when a payment status changes.
 * Always returns 200 to avoid NotchPay retrying the webhook.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { event, data } = payload;

    // We only care about payment completion events
    if (!data?.reference) {
      return Response.json({ received: true });
    }

    const reference: string = data.reference;
    const status: string = data.status;

    console.log(
      `[NotchPay Webhook] event=${event} reference=${reference} status=${status}`
    );

    // Verify the payment with NotchPay API
    // TODO: Use NOTCHPAY_PRIVATE_KEY once available; falling back to public key for now
    const apiKey =
      process.env.NOTCHPAY_PRIVATE_KEY || process.env.NEXT_PUBLIC_NOTCHPAY_PUBLIC_KEY;

    if (!apiKey) {
      console.error("[NotchPay Webhook] No API key configured");
      return Response.json({ received: true });
    }

    const verifyResponse = await fetch(
      `https://api.notchpay.co/payments/${reference}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: apiKey,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error(
        `[NotchPay Webhook] Verification failed: ${verifyResponse.status}`
      );
      return Response.json({ received: true });
    }

    const verification = await verifyResponse.json();
    const verifiedStatus: string =
      verification.transaction?.status ?? verification.status;

    console.log(
      `[NotchPay Webhook] Verified status for ${reference}: ${verifiedStatus}`
    );

    if (verifiedStatus !== "complete") {
      // Update payment doc with the current non-complete status
      const paymentRef = adminDb.collection("payments").doc(reference);
      const paymentSnap = await paymentRef.get();

      if (paymentSnap.exists) {
        await paymentRef.update({
          status: verifiedStatus,
          webhookVerified: true,
          updatedAt: new Date().toISOString(),
        });
      }

      return Response.json({ received: true });
    }

    // --- Payment is complete: process it ---
    const paymentRef = adminDb.collection("payments").doc(reference);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      console.error(`[NotchPay Webhook] Payment doc not found: ${reference}`);
      return Response.json({ received: true });
    }

    const paymentData = paymentSnap.data()!;

    // 1. Update payment status
    await paymentRef.update({
      status: "complete",
      webhookVerified: true,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Create or update member doc
    const memberEmail = paymentData.memberEmail;
    const planId = paymentData.planId;

    if (memberEmail && planId) {
      const memberRef = adminDb.collection("members").doc(memberEmail);
      const memberSnap = await memberRef.get();

      // Look up the plan to get end date
      const planSnap = await adminDb.collection("plans").doc(planId).get();
      const planData = planSnap.data();

      const paymentRefEntry = {
        paymentId: reference,
        amount: paymentData.amount,
        date: new Date().toISOString(),
        type: paymentData.type || "join",
      };

      if (memberSnap.exists) {
        // Update existing member
        await memberRef.update({
          planId,
          planName: planData?.name || "",
          expiryDate: planData?.endDate || "",
          status: "active",
          payments: FieldValue.arrayUnion(paymentRefEntry),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new member
        await memberRef.set({
          id: memberEmail,
          uid: paymentData.memberUid || "",
          email: memberEmail,
          displayName: paymentData.displayName || "",
          planId,
          planName: planData?.name || "",
          joinDate: new Date().toISOString(),
          expiryDate: planData?.endDate || "",
          status: "active",
          heardAboutUs: paymentData.heardAboutUs || "",
          emailToAdd: paymentData.emailToAdd || memberEmail,
          payments: [paymentRefEntry],
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Increment plan occupied seats
      if (paymentData.type === "join" || paymentData.type === "new_plan") {
        const planRef = adminDb.collection("plans").doc(planId);
        await planRef.update({
          occupiedSeats: FieldValue.increment(1),
        });
      }
    }

    console.log(`[NotchPay Webhook] Payment ${reference} processed successfully`);
    return Response.json({ received: true, processed: true });
  } catch (error) {
    console.error("[NotchPay Webhook] Error:", error);
    // Always return 200 to prevent retries
    return Response.json({ received: true, error: "Internal processing error" });
  }
}

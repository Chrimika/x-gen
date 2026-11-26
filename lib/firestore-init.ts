/**
 * Firestore initialization script using Admin SDK (bypasses security rules).
 * Run once to set up the initial data structure.
 * Usage: npx tsx lib/firestore-init.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

async function initializeFirestore() {
  console.log("Initializing Firestore...\n");

  // 1. Pricing config
  await db.collection("config").doc("pricing").set({
    baseCostFCFA: 18500,
    marginFCFA: 2000,
    notchPayFeePercent: 0.02,
    fullPriceFCFA: 21000,
    currency: "XAF",
    updatedAt: new Date().toISOString(),
  });
  console.log("Config/pricing created");

  // 2. Admin config
  await db.collection("config").doc("admin").set({
    adminPin: "000000",
    updatedAt: new Date().toISOString(),
  });
  console.log("Config/admin created");

  // 3. Admin user
  await db.collection("admins").doc("mbachristian58@gmail.com").set({
    email: "mbachristian58@gmail.com",
    role: "superadmin",
    createdAt: new Date().toISOString(),
  });
  console.log("Admin user created");

  // 4. Plans
  const plans = [
    {
      id: "xgen1",
      name: "X-Gen 1",
      startDate: "2026-10-27",
      endDate: "2026-11-27",
      totalSeats: 9,
      occupiedSeats: 9,
      priceUSD: 225,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: "xgen2",
      name: "X-Gen 2",
      startDate: "2026-11-10",
      endDate: "2026-12-10",
      totalSeats: 13,
      occupiedSeats: 13,
      priceUSD: 325,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: "xgen3",
      name: "X-Gen 3",
      startDate: "2026-11-17",
      endDate: "2026-12-17",
      totalSeats: 11,
      occupiedSeats: 11,
      priceUSD: 275,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const plan of plans) {
    await db.collection("plans").doc(plan.id).set(plan);
    console.log(`Plan ${plan.name} created`);
  }

  // 5. Community stats
  await db.collection("config").doc("community").set({
    whatsappMembers: 274,
    totalSubscribers: 33,
    updatedAt: new Date().toISOString(),
  });
  console.log("Community stats created");

  console.log("\nFirestore initialized successfully!");
  console.log("IMPORTANT: Change the default admin PIN (000000) immediately!");
  process.exit(0);
}

initializeFirestore().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

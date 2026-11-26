"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Plan, Member, Payment, PricingConfig } from "./types";
import { DEFAULT_PRICING } from "./pricing";

/**
 * Hook to subscribe to all active plans in real-time.
 */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "plans"), orderBy("startDate", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Plan[];
        setPlans(data);
        setLoading(false);
      },
      (err) => {
        console.error("Plans subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { plans, loading, error };
}

/**
 * Hook to get a single plan by ID.
 */
export function usePlan(planId: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;

    const unsubscribe = onSnapshot(doc(db, "plans", planId), (snapshot) => {
      if (snapshot.exists()) {
        setPlan({ id: snapshot.id, ...snapshot.data() } as Plan);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [planId]);

  return { plan, loading };
}

/**
 * Hook to get current user's member record.
 */
export function useMember(uid: string | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "members"), where("uid", "==", uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setMember({ id: doc.id, ...doc.data() } as Member);
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { member, loading };
}

/**
 * Hook to get pricing config.
 */
export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "pricing"), (snapshot) => {
      if (snapshot.exists()) {
        setPricing(snapshot.data() as PricingConfig);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { pricing, loading };
}

/**
 * Hook for all members (admin).
 */
export function useAllMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "members"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { members, loading };
}

/**
 * Hook for all payments (admin).
 */
export function useAllPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];
      setPayments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { payments, loading };
}

/**
 * Hook for community stats.
 */
export function useCommunityStats() {
  const [stats, setStats] = useState({
    whatsappMembers: 274,
    totalSubscribers: 33,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "config", "community"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setStats({
            whatsappMembers: data.whatsappMembers ?? 274,
            totalSubscribers: data.totalSubscribers ?? 33,
          });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}

/**
 * Hook for waiting list entries.
 */
export function useWaitingList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "waitingList"),
      where("status", "==", "waiting"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { entries, loading };
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useMember, usePlan } from "@/lib/hooks";
import {
  getDaysRemaining,
  formatDate,
  getCountdownLabel,
  getCycleDays,
  getDaysElapsed,
} from "@/lib/pricing";
import type { Plan } from "@/lib/types";

function getStatusBadge(status: string, daysRemaining: number) {
  if (status === "expired" || daysRemaining <= 0) {
    return {
      label: "Expiré",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      dotClass: "bg-red-500",
    };
  }
  if (daysRemaining <= 5) {
    return {
      label: "Expire bientôt",
      bgClass: "bg-orange-50 text-orange-700 border-orange-200",
      dotClass: "bg-orange-500",
    };
  }
  return {
    label: "Actif",
    bgClass: "bg-green-50 text-green-700 border-green-200",
    dotClass: "bg-green-500",
  };
}

function TimelineDots({ plan }: { plan: Plan }) {
  const totalDays = getCycleDays(plan);
  const elapsed = getDaysElapsed(plan);
  const maxDots = Math.min(totalDays, 30);
  const scale = totalDays / maxDots;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: maxDots }, (_, i) => {
        const dayIndex = Math.round(i * scale);
        const isElapsed = dayIndex < elapsed;
        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isElapsed ? "bg-[#E8622C]" : "bg-gray-200"
            }`}
            title={`Jour ${dayIndex + 1}`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { member, loading: memberLoading } = useMember(user?.uid);
  const { plan, loading: planLoading } = usePlan(member?.planId || "");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || memberLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#E8622C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasSub = !!member && member.status !== "expired";
  const daysRemaining = plan ? getDaysRemaining(plan) : 0;
  const countdown = plan ? getCountdownLabel(plan) : "";
  const badge = member ? getStatusBadge(member.status, daysRemaining) : null;
  const showRenewal = hasSub && daysRemaining <= 2;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="8" y="4" width="32" height="24" rx="4" fill="#E8622C" />
              <rect x="14" y="12" width="6" height="6" rx="1" fill="white" />
              <rect x="28" y="12" width="6" height="6" rx="1" fill="white" />
              <rect x="17" y="14" width="2" height="2" fill="#1a1a1a" />
              <rect x="31" y="14" width="2" height="2" fill="#1a1a1a" />
              <rect x="22" y="0" width="4" height="6" rx="2" fill="#E8622C" />
              <rect x="18" y="22" width="12" height="2" rx="1" fill="white" />
              <rect x="14" y="30" width="20" height="12" rx="3" fill="#E8622C" />
              <rect x="20" y="33" width="8" height="3" rx="1" fill="white" opacity="0.6" />
              <rect x="6" y="32" width="6" height="3" rx="1.5" fill="#E8622C" />
              <rect x="36" y="32" width="6" height="3" rx="1.5" fill="#E8622C" />
              <rect x="18" y="42" width="4" height="6" rx="2" fill="#E8622C" />
              <rect x="26" y="42" width="4" height="6" rx="2" fill="#E8622C" />
            </svg>
            <span className="text-lg font-bold text-[#1a1a1a]">X-Gen</span>
          </Link>
          <div className="flex items-center gap-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-sm text-[#666] hidden sm:inline">
              {user.displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors cursor-pointer"
            >
              D&eacute;connexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="w-14 h-14 rounded-full ring-2 ring-[#E8622C]/20"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Mon Espace</h1>
            <p className="text-[#666] text-sm">{user.displayName || user.email}</p>
          </div>
        </div>

        {hasSub && member && badge ? (
          <>
            {/* Subscription Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#1a1a1a]">{member.planName}</h2>
                  <p className="text-sm text-[#666] mt-1">Votre abonnement actuel</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.bgClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Timeline Visualization */}
              {plan && !planLoading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#666]">Progression du cycle</span>
                    <span className="text-xs font-semibold text-[#E8622C]">{countdown}</span>
                  </div>
                  <TimelineDots plan={plan} />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#f5f5f5] rounded-xl p-4">
                  <p className="text-xs text-[#666] mb-1">Date de d&eacute;but</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {formatDate(member.joinDate)}
                  </p>
                </div>
                <div className="bg-[#f5f5f5] rounded-xl p-4">
                  <p className="text-xs text-[#666] mb-1">Date d&apos;&eacute;ch&eacute;ance</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {formatDate(member.expiryDate)}
                  </p>
                </div>
                <div className="bg-[#f5f5f5] rounded-xl p-4">
                  <p className="text-xs text-[#666] mb-1">Email ajout&eacute; au plan</p>
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">
                    {member.emailToAdd}
                  </p>
                </div>
              </div>

              {/* Renewal Button */}
              {showRenewal && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <p className="text-sm text-orange-600 font-medium">
                      Votre abonnement expire bient&ocirc;t
                    </p>
                  </div>
                  <Link
                    href={`/checkout/${member.planId}?type=renewal`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#E8622C] text-white font-medium rounded-xl hover:bg-[#d4561f] transition-colors text-sm"
                  >
                    Renouveler mon abonnement
                  </Link>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
                Historique des paiements
              </h2>
              {member.payments && member.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#666] border-b border-gray-100">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Montant</th>
                        <th className="pb-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {member.payments.map((p, i) => (
                        <tr key={i}>
                          <td className="py-2 text-[#1a1a1a]">{formatDate(p.date)}</td>
                          <td className="py-2 text-[#1a1a1a] font-medium">
                            {p.amount.toLocaleString("fr-FR")} FCFA
                          </td>
                          <td className="py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.type === "join" ? "bg-blue-100 text-blue-800" :
                              p.type === "renewal" ? "bg-purple-100 text-purple-800" :
                              "bg-orange-100 text-orange-800"
                            }`}>
                              {p.type === "join" ? "Adhésion" :
                               p.type === "renewal" ? "Renouvellement" : "Nouveau plan"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#999"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#666]">
                    Aucun paiement enregistr&eacute; pour le moment.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Subscription */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="8" y="4" width="32" height="24" rx="4" fill="#E8622C" opacity="0.3" />
                <rect x="14" y="12" width="6" height="6" rx="1" fill="#E8622C" opacity="0.5" />
                <rect x="28" y="12" width="6" height="6" rx="1" fill="#E8622C" opacity="0.5" />
                <rect x="14" y="30" width="20" height="12" rx="3" fill="#E8622C" opacity="0.3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">
              Aucun abonnement actif
            </h2>
            <p className="text-sm text-[#666] mb-6">
              Parcourez nos plans pour rejoindre une &eacute;quipe Claude AI.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#E8622C] text-white font-medium rounded-xl hover:bg-[#d4561f] transition-colors text-sm"
            >
              Voir les plans disponibles
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

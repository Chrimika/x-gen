"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import Header from "@/components/header";
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
    return { label: "Expiré", chipClass: "bg-red-200", dotClass: "bg-red-500" };
  }
  if (daysRemaining <= 5) {
    return { label: "Expire bientôt", chipClass: "bg-sun", dotClass: "bg-brand" };
  }
  return { label: "Actif", chipClass: "bg-green-200", dotClass: "bg-green-600" };
}

const PAYMENT_TYPES: Record<string, { label: string; chipClass: string }> = {
  join: { label: "Adhésion", chipClass: "bg-peach" },
  renewal: { label: "Renouvellement", chipClass: "bg-sun" },
  new_plan: { label: "Nouveau plan", chipClass: "bg-white" },
};

function paymentType(type: string) {
  return PAYMENT_TYPES[type] ?? PAYMENT_TYPES.new_plan;
}

function TimelineDots({ plan }: { plan: Plan }) {
  const totalDays = getCycleDays(plan);
  const elapsed = getDaysElapsed(plan);
  const maxDots = Math.min(totalDays, 30);
  const scale = totalDays / maxDots;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Array.from({ length: maxDots }, (_, i) => {
        const dayIndex = Math.round(i * scale);
        const isElapsed = dayIndex < elapsed;
        return (
          <div
            key={i}
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-ink ${
              isElapsed ? "bg-brand" : "bg-white"
            }`}
            title={`Jour ${dayIndex + 1}`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
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
      <div className="flex flex-1 items-center justify-center min-h-screen bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted">Chargement...</p>
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
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8 animate-rise">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="w-14 h-14 rounded-full border-[2.5px] border-ink shadow-[3px_3px_0_var(--ink)] flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-none">
              Mon Espace
            </h1>
            <p className="text-muted text-sm mt-1.5 truncate">
              {user.displayName || user.email}
            </p>
          </div>
        </div>

        {hasSub && member && badge ? (
          <>
            {/* Subscription Card */}
            <div className="brut-card p-5 sm:p-8 mb-6 animate-rise">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                    Votre abonnement actuel
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight break-words">
                    {member.planName}
                  </h2>
                </div>
                <span className={`chip ${badge.chipClass}`}>
                  <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
                  {badge.label}
                </span>
              </div>

              {/* Timeline Visualization */}
              {plan && !planLoading && (
                <div className="mb-6 p-4 rounded-2xl border-2 border-ink bg-white">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Progression du cycle
                    </span>
                    <span className="chip bg-brand text-white">{countdown}</span>
                  </div>
                  <TimelineDots plan={plan} />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border-2 border-ink bg-peach p-4">
                  <p className="text-xs font-semibold text-muted mb-1">Date de d&eacute;but</p>
                  <p className="text-base font-bold text-ink">{formatDate(member.joinDate)}</p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-peach p-4">
                  <p className="text-xs font-semibold text-muted mb-1">
                    Date d&apos;&eacute;ch&eacute;ance
                  </p>
                  <p className="text-base font-bold text-ink">{formatDate(member.expiryDate)}</p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-white p-4 min-w-0">
                  <p className="text-xs font-semibold text-muted mb-1">Email ajout&eacute; au plan</p>
                  <p className="text-base font-bold text-ink truncate">{member.emailToAdd}</p>
                </div>
              </div>

              {/* Renewal */}
              {showRenewal && (
                <div className="mt-6 bg-sun rounded-3xl brut p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand border-2 border-ink animate-pulse-dot" />
                    <p className="text-sm font-bold text-ink">Votre abonnement expire bient&ocirc;t</p>
                  </div>
                  <p className="text-sm text-ink/80 mb-4">
                    Renouvelez maintenant pour garder votre acc&egrave;s au prochain cycle.
                  </p>
                  <Link
                    href={`/checkout/${member.planId}?type=renewal`}
                    className="btn bg-brand text-white w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renouveler mon abonnement
                  </Link>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="brut-card p-5 sm:p-8 animate-rise">
              <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-5">
                Historique des paiements
              </h2>
              {member.payments && member.payments.length > 0 ? (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="sm:hidden space-y-3">
                    {member.payments.map((p, i) => {
                      const t = paymentType(p.type);
                      return (
                        <div
                          key={i}
                          className="rounded-2xl border-2 border-ink bg-white p-4 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-lg font-extrabold text-ink">
                              {p.amount.toLocaleString("fr-FR")} FCFA
                            </p>
                            <p className="text-xs text-muted mt-0.5">{formatDate(p.date)}</p>
                          </div>
                          <span className={`chip ${t.chipClass}`}>{t.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden sm:block overflow-x-auto rounded-2xl border-2 border-ink">
                    <table className="w-full text-sm">
                      <thead className="bg-peach">
                        <tr className="text-left text-ink border-b-2 border-ink">
                          <th className="px-4 py-3 font-bold">Date</th>
                          <th className="px-4 py-3 font-bold">Montant</th>
                          <th className="px-4 py-3 font-bold">Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y-2 divide-ink/10">
                        {member.payments.map((p, i) => {
                          const t = paymentType(p.type);
                          return (
                            <tr key={i}>
                              <td className="px-4 py-3 text-ink">{formatDate(p.date)}</td>
                              <td className="px-4 py-3 text-ink font-bold">
                                {p.amount.toLocaleString("fr-FR")} FCFA
                              </td>
                              <td className="px-4 py-3">
                                <span className={`chip ${t.chipClass}`}>{t.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-peach border-2 border-ink rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-ink" />
                  </div>
                  <p className="text-sm text-muted">Aucun paiement enregistr&eacute; pour le moment.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Subscription */
          <div className="brut-card p-6 sm:p-10 text-center animate-rise">
            <div className="w-16 h-16 bg-sun border-[2.5px] border-ink rounded-full flex items-center justify-center mx-auto mb-5 shadow-[3px_3px_0_var(--ink)]">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="4" width="32" height="24" rx="4" fill="#E8622C" />
                <rect x="14" y="12" width="6" height="6" rx="1" fill="white" />
                <rect x="28" y="12" width="6" height="6" rx="1" fill="white" />
                <rect x="14" y="30" width="20" height="12" rx="3" fill="#E8622C" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-2">
              Aucun abonnement actif
            </h2>
            <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
              Parcourez nos plans pour rejoindre une &eacute;quipe Claude AI.
            </p>
            <Link href="/#plans" className="btn bg-brand text-white w-full sm:w-auto">
              Voir les plans disponibles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

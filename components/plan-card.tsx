"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flag, User, UserPlus, RefreshCw, ArrowRight } from "lucide-react";
import type { Plan } from "@/lib/types";
import {
  getCycleDays,
  getDaysElapsed,
  getDaysRemaining,
  getCycleProgress,
  getProratedPrice,
  getAvailableSeats,
  formatPrice,
  formatDate,
  DEFAULT_PRICING,
} from "@/lib/pricing";

interface PlanCardProps {
  plan: Plan;
  totalGroupSeats?: number;
}

function urgency(daysRemaining: number) {
  if (daysRemaining > 15) return { bg: "bg-[#7ee0a1]", bar: "bg-[#22c55e]", text: "text-[#16a34a]" };
  if (daysRemaining >= 5) return { bg: "bg-sun", bar: "bg-sun", text: "text-[#d97706]" };
  return { bg: "bg-[#ff8a80]", bar: "bg-[#ef4444]", text: "text-[#ef4444]" };
}

export default function PlanCard({ plan, totalGroupSeats }: PlanCardProps) {
  const now = useMemo(() => new Date(), []);

  const cycleDays = getCycleDays(plan);
  const daysElapsed = getDaysElapsed(plan, now);
  const daysRemaining = getDaysRemaining(plan, now);
  const progress = getCycleProgress(plan, now);
  const proratedPrice = getProratedPrice(plan, DEFAULT_PRICING, now);
  const availableSeats = getAvailableSeats(plan);
  const groupPercentage = totalGroupSeats
    ? Math.round((plan.occupiedSeats / totalGroupSeats) * 100)
    : null;
  const tone = urgency(daysRemaining);
  const isRenewalWindow = plan.status === "active" && daysRemaining <= 2;

  const timelineDots = useMemo(() => {
    const maxDots = Math.min(cycleDays, 31);
    const scale = cycleDays / maxDots;
    return Array.from({ length: maxDots }, (_, i) => {
      const dayIndex = Math.round(i * scale);
      if (dayIndex < daysElapsed) return "passed" as const;
      if (dayIndex === daysElapsed) return "today" as const;
      return "remaining" as const;
    });
  }, [cycleDays, daysElapsed]);

  return (
    <article className="brut-card pop overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{plan.name}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip bg-white">D&eacute;but {formatDate(plan.startDate)}</span>
            <span className="chip bg-peach">Fin {formatDate(plan.endDate)}</span>
          </div>
        </div>
        <div
          className={`shrink-0 grid place-items-center w-[68px] h-[68px] sm:w-20 sm:h-20 rounded-full ${tone.bg} border-[2.5px] border-ink shadow-[3px_3px_0_var(--ink)] rotate-[8deg]`}
        >
          <div className="text-center leading-none">
            <span className="block text-[10px] font-bold uppercase tracking-wider">reste</span>
            <span className="block text-xl sm:text-2xl font-extrabold">J-{daysRemaining}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 sm:px-6">
        <div className="flex items-center gap-[3px] flex-wrap">
          {timelineDots.map((type, i) => (
            <span
              key={i}
              className={
                type === "passed"
                  ? "w-2 h-2 rounded-full bg-ink"
                  : type === "today"
                    ? "w-3 h-3 rounded-full bg-brand border-2 border-ink"
                    : "w-2 h-2 rounded-full bg-white border border-ink/40"
              }
            />
          ))}
          <Flag className={`w-4 h-4 ml-0.5 ${tone.text}`} fill="currentColor" strokeWidth={2.5} />
        </div>

        <div className="mt-3 h-4 rounded-full border-2 border-ink bg-white overflow-hidden">
          <div
            className={`h-full ${tone.bar} border-r-2 border-ink transition-[width] duration-700`}
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs font-semibold text-muted">
          <span>Jour {daysElapsed}/{cycleDays}</span>
          <span>{progress}% du cycle</span>
        </div>
      </div>

      {/* Seats */}
      <div className="px-5 sm:px-6 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: plan.totalSeats }).map((_, i) => {
            const taken = i < plan.occupiedSeats;
            return (
              <span
                key={i}
                className={`grid place-items-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 border-ink ${
                  taken ? "bg-brand text-white" : "bg-white text-ink/25"
                }`}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <Stat label="Places" value={`${plan.occupiedSeats}/${plan.totalSeats}`} />
          <Stat label="Prix" value={`$${plan.priceUSD}`} />
          <Stat label="Collecté" value={formatPrice(plan.occupiedSeats * DEFAULT_PRICING.fullPriceFCFA)} />
          <Stat label="% groupe" value={groupPercentage !== null ? `${groupPercentage}%` : "—"} />
        </div>
      </div>

      <div className="flex-1" />

      {/* Action */}
      <div className="p-4 sm:p-5 mt-5">
        {isRenewalWindow ? (
          <ActionBox
            tone="bg-sun"
            eyebrow="Prochain cycle"
            price={DEFAULT_PRICING.fullPriceFCFA}
            unit="FCFA / mois"
            note={`Renouvellement dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`}
            href={`/checkout/${plan.id}?type=renewal`}
            cta="Renouveler"
            icon={<RefreshCw className="w-4 h-4" strokeWidth={2.5} />}
          />
        ) : availableSeats > 0 && plan.status === "active" ? (
          <ActionBox
            tone="bg-peach"
            eyebrow="Rejoindre maintenant"
            price={proratedPrice}
            unit="FCFA"
            note={`Prix ajusté — ${daysRemaining} jours restants`}
            href={`/checkout/${plan.id}`}
            cta="Rejoindre"
            icon={<UserPlus className="w-4 h-4" strokeWidth={2.5} />}
          />
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-ink/50 p-4 text-center font-bold text-muted">
            Ce plan est complet
          </div>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white px-2.5 py-2">
      <p className="text-lg font-extrabold leading-tight truncate">{value}</p>
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ActionBox({
  tone,
  eyebrow,
  price,
  unit,
  note,
  href,
  cta,
  icon,
}: {
  tone: string;
  eyebrow: string;
  price: number;
  unit: string;
  note: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`${tone} rounded-3xl border-[2.5px] border-ink p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide">{eyebrow}</p>
        <p className="text-3xl font-extrabold tracking-tight leading-tight">
          {formatPrice(price)} <span className="text-sm font-bold">{unit}</span>
        </p>
        <p className="text-xs font-semibold text-ink/70">{note}</p>
      </div>
      <Link href={href} className="btn bg-brand text-white w-full sm:w-auto">
        {icon}
        {cta}
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

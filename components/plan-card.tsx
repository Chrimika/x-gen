"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flag, User, UserPlus, Clock, Calendar, DollarSign, Users } from "lucide-react";
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
  getCountdownLabel,
  DEFAULT_PRICING,
} from "@/lib/pricing";

interface PlanCardProps {
  plan: Plan;
  totalGroupSeats?: number;
}

function getCountdownColor(daysRemaining: number): string {
  if (daysRemaining > 15) return "bg-[#22c55e]";
  if (daysRemaining >= 5) return "bg-[#f59e0b]";
  return "bg-[#ef4444]";
}

function getCountdownTextColor(daysRemaining: number): string {
  if (daysRemaining > 15) return "text-[#22c55e]";
  if (daysRemaining >= 5) return "text-[#f59e0b]";
  return "text-[#ef4444]";
}

export default function PlanCard({ plan, totalGroupSeats }: PlanCardProps) {
  const now = useMemo(() => new Date(), []);

  const cycleDays = getCycleDays(plan);
  const daysElapsed = getDaysElapsed(plan, now);
  const daysRemaining = getDaysRemaining(plan, now);
  const progress = getCycleProgress(plan, now);
  const proratedPrice = getProratedPrice(plan, DEFAULT_PRICING, now);
  const availableSeats = getAvailableSeats(plan);
  const countdownLabel = getCountdownLabel(plan, now);
  const amountCollectedFCFA = plan.occupiedSeats * DEFAULT_PRICING.fullPriceFCFA;
  const groupPercentage = totalGroupSeats
    ? Math.round((plan.occupiedSeats / totalGroupSeats) * 100)
    : null;

  // Build timeline dots: we show up to ~31 dots for a typical month
  const timelineDots = useMemo(() => {
    const dots: Array<"passed" | "today" | "remaining" | "flag"> = [];
    // Cap displayed dots to keep the UI manageable
    const maxDots = Math.min(cycleDays, 31);
    const scale = cycleDays / maxDots;

    for (let i = 0; i < maxDots; i++) {
      const dayIndex = Math.round(i * scale);
      if (dayIndex < daysElapsed) {
        dots.push("passed");
      } else if (dayIndex === daysElapsed) {
        dots.push("today");
      } else {
        dots.push("remaining");
      }
    }
    dots.push("flag");
    return dots;
  }, [cycleDays, daysElapsed]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-xl font-bold text-[#1a1a1a]">{plan.name}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-[#666]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Achat: {formatDate(plan.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Renouvellement: {formatDate(plan.endDate)}
              </span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-white ${getCountdownColor(daysRemaining)}`}
          >
            {countdownLabel}
          </span>
        </div>
      </div>

      {/* Timeline dots */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-[3px] flex-wrap">
          {timelineDots.map((type, i) => {
            if (type === "flag") {
              return (
                <Flag
                  key={i}
                  className={`w-3.5 h-3.5 ml-0.5 ${getCountdownTextColor(daysRemaining)}`}
                  fill="currentColor"
                />
              );
            }
            if (type === "passed") {
              return (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0"
                />
              );
            }
            if (type === "today") {
              return (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border-2 border-[#3b82f6] bg-white flex-shrink-0"
                />
              );
            }
            // remaining
            return (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0"
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background:
                daysRemaining > 15
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : daysRemaining >= 5
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-[#666]">
          <span>Jour {daysElapsed}/{cycleDays}</span>
          <span>{progress}% du cycle</span>
        </div>
      </div>

      {/* Seats visualization */}
      <div className="px-6 py-4 border-t border-gray-50">
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: plan.totalSeats }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-7 h-7 rounded-lg ${
                i < plan.occupiedSeats
                  ? "bg-[#E8622C]/10"
                  : "bg-gray-100"
              }`}
            >
              <User
                className={`w-4 h-4 ${
                  i < plan.occupiedSeats
                    ? "text-[#E8622C]"
                    : "text-gray-300"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-[#666]" />
            <span className="text-[#666]">Places:</span>
            <span className="font-semibold text-[#1a1a1a]">
              {plan.occupiedSeats}/{plan.totalSeats}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-[#666]" />
            <span className="text-[#666]">Prix:</span>
            <span className="font-semibold text-[#1a1a1a]">
              ${plan.priceUSD}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#666]">Collect&eacute;:</span>
            <span className="font-semibold text-[#1a1a1a]">
              {formatPrice(amountCollectedFCFA)} FCFA
            </span>
          </div>
          {groupPercentage !== null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#666]">% du groupe:</span>
              <span className="font-semibold text-[#1a1a1a]">
                {groupPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Join section */}
      {availableSeats > 0 && plan.status === "active" && (
        <div className="px-6 py-4 bg-gradient-to-r from-[#FFF7F3] to-[#FFF0E8] border-t border-[#E8622C]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#666] mb-0.5">
                Rejoindre maintenant
              </p>
              <p className="text-2xl font-bold text-[#E8622C]">
                {formatPrice(proratedPrice)}{" "}
                <span className="text-sm font-normal text-[#666]">FCFA</span>
              </p>
              <p className="text-xs text-[#666] mt-0.5">
                Prix ajust&eacute; &mdash; {daysRemaining} jours restants
              </p>
            </div>
            <Link
              href={`/checkout/${plan.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8622C] text-white font-semibold rounded-xl hover:bg-[#d4561f] active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Rejoindre
            </Link>
          </div>
        </div>
      )}

      {/* Full indicator */}
      {availableSeats === 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-center text-[#666] font-medium">
            Ce plan est complet
          </p>
        </div>
      )}
    </div>
  );
}

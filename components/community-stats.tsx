"use client";

import { useMemo } from "react";
import { Users, TrendingUp, UserCheck, Percent } from "lucide-react";
import type { Plan } from "@/lib/types";

interface CommunityStatsProps {
  plans: Plan[];
}

const TOTAL_COMMUNITY_MEMBERS = 274;

export default function CommunityStats({ plans }: CommunityStatsProps) {
  const activeSubscribers = useMemo(
    () => plans.reduce((sum, p) => sum + p.occupiedSeats, 0),
    [plans],
  );

  const conversionRate = useMemo(
    () => ((activeSubscribers / TOTAL_COMMUNITY_MEMBERS) * 100).toFixed(1),
    [activeSubscribers],
  );

  // Recent additions (seats filled in the last plan created)
  const recentAdditions = useMemo(() => {
    if (plans.length === 0) return 0;
    const sorted = [...plans].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted[0].occupiedSeats;
  }, [plans]);

  const nonSubscribers =
    TOTAL_COMMUNITY_MEMBERS - activeSubscribers;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#E8622C]" />
          Communaut&eacute; WhatsApp
        </h2>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Membres"
            value={TOTAL_COMMUNITY_MEMBERS.toString()}
            color="#6366f1"
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5" />}
            label="Abonn&eacute;s actifs"
            value={activeSubscribers.toString()}
            color="#22c55e"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="R&eacute;cents"
            value={`+${recentAdditions}`}
            color="#ef4444"
          />
          <StatCard
            icon={<Percent className="w-5 h-5" />}
            label="Conversion"
            value={`${conversionRate}%`}
            color="#E8622C"
          />
        </div>

        {/* Dot grid visualization */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap gap-[5px]">
            {Array.from({ length: TOTAL_COMMUNITY_MEMBERS }).map((_, i) => {
              let colorClass: string;
              if (i < activeSubscribers - recentAdditions) {
                // Existing subscribers - green
                colorClass = "bg-[#22c55e]";
              } else if (i < activeSubscribers) {
                // Recent additions - red/orange
                colorClass = "bg-[#ef4444]";
              } else {
                // Non-subscribers - grey
                colorClass = "bg-gray-300";
              }
              return (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${colorClass} flex-shrink-0`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#666]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              Abonn&eacute;s ({activeSubscribers - recentAdditions})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              Ajouts r&eacute;cents (+{recentAdditions})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              Non-abonn&eacute;s ({nonSubscribers})
            </span>
          </div>
        </div>

        {/* Summary text */}
        <p className="mt-4 text-sm text-[#666] leading-relaxed">
          <span className="font-semibold text-[#1a1a1a]">
            {activeSubscribers}
          </span>{" "}
          membres sur{" "}
          <span className="font-semibold text-[#1a1a1a]">
            {TOTAL_COMMUNITY_MEMBERS}
          </span>{" "}
          utilisent Claude Code Team via X-Gen. Rejoignez un plan existant ou
          cr&eacute;ez le v&ocirc;tre avec un minimum de 2 personnes.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
      <p className="text-xs text-[#666] mt-0.5">{label}</p>
    </div>
  );
}

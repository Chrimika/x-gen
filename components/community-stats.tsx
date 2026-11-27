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

  const conversionRate = ((activeSubscribers / TOTAL_COMMUNITY_MEMBERS) * 100).toFixed(1);

  const recentAdditions = useMemo(() => {
    if (plans.length === 0) return 0;
    const sorted = [...plans].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted[0].occupiedSeats;
  }, [plans]);

  const nonSubscribers = TOTAL_COMMUNITY_MEMBERS - activeSubscribers;

  return (
    <div className="brut-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          La communaut&eacute;
        </h2>
        <span className="chip bg-[#25D366]">WhatsApp</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Users className="w-5 h-5" />} label="Membres" value={String(TOTAL_COMMUNITY_MEMBERS)} tone="bg-white" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="Abonnés actifs" value={String(activeSubscribers)} tone="bg-[#bdf2cf]" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Récents" value={`+${recentAdditions}`} tone="bg-sun" />
        <StatCard icon={<Percent className="w-5 h-5" />} label="Conversion" value={`${conversionRate}%`} tone="bg-peach" />
      </div>

      <div className="rounded-3xl border-2 border-ink bg-cream p-4">
        <div className="flex flex-wrap gap-[5px]">
          {Array.from({ length: TOTAL_COMMUNITY_MEMBERS }).map((_, i) => {
            const color =
              i < activeSubscribers - recentAdditions
                ? "bg-ink"
                : i < activeSubscribers
                  ? "bg-brand"
                  : "bg-ink/15";
            return <span key={i} className={`w-2 h-2 rounded-full ${color}`} />;
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="chip bg-white"><span className="w-2.5 h-2.5 rounded-full bg-ink" />Abonn&eacute;s ({activeSubscribers - recentAdditions})</span>
          <span className="chip bg-white"><span className="w-2.5 h-2.5 rounded-full bg-brand" />R&eacute;cents (+{recentAdditions})</span>
          <span className="chip bg-white"><span className="w-2.5 h-2.5 rounded-full bg-ink/15" />Non-abonn&eacute;s ({nonSubscribers})</span>
        </div>
      </div>

      <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
        <span className="font-extrabold text-ink">{activeSubscribers}</span> membres sur{" "}
        <span className="font-extrabold text-ink">{TOTAL_COMMUNITY_MEMBERS}</span> utilisent Claude Code
        Team via X-Gen. Rejoignez un plan existant ou cr&eacute;ez le v&ocirc;tre d&egrave;s 2 personnes.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`${tone} rounded-2xl border-2 border-ink p-3 shadow-[3px_3px_0_var(--ink)]`}>
      {icon}
      <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-ink/70">{label}</p>
    </div>
  );
}

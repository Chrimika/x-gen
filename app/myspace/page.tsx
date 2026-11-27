"use client";

import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  Users,
  CreditCard,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  Check,
} from "lucide-react";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth-context";
import { usePlans, useAllMembers, useAllPayments, usePricing } from "@/lib/hooks";
import { DEFAULT_PRICING, formatPrice } from "@/lib/pricing";
import type { Plan, Member, Payment, PricingConfig } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers & shared UI
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Actif", tone: "bg-[#bdf2cf]" },
  expired: { label: "Expiré", tone: "bg-ink/10" },
  upcoming: { label: "À venir", tone: "bg-[#c7dcff]" },
  pending: { label: "En attente", tone: "bg-sun" },
  complete: { label: "Payé", tone: "bg-[#bdf2cf]" },
  failed: { label: "Échoué", tone: "bg-[#ffb4ae]" },
  cancelled: { label: "Annulé", tone: "bg-ink/10" },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "bg-white" };
  return <span className={`chip ${s.tone}`}>{s.label}</span>;
}

const PAYMENT_TYPE: Record<string, { label: string; tone: string }> = {
  join: { label: "Adhésion", tone: "bg-[#c7dcff]" },
  renewal: { label: "Renouvellement", tone: "bg-[#e3d1ff]" },
  new_plan: { label: "Nouveau plan", tone: "bg-peach" },
};

function TypeChip({ type }: { type: string }) {
  const t = PAYMENT_TYPE[type] ?? PAYMENT_TYPE.new_plan;
  return <span className={`chip ${t.tone}`}>{t.label}</span>;
}

type TabId = "overview" | "plans" | "members" | "payments" | "config";

function useAdminToken() {
  const { user } = useAuth();
  return useCallback(async () => {
    if (!user) return "";
    return user.getIdToken();
  }, [user]);
}

function StatCard({
  label,
  value,
  sub,
  tone = "bg-white",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className={`${tone} rounded-3xl border-[2.5px] border-ink p-4 sm:p-5 shadow-[4px_4px_0_var(--ink)]`}>
      <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink/70">{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{value}</p>
      {sub && <p className="text-xs font-semibold text-ink/60 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs font-semibold text-muted mt-1.5">{hint}</span>}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="brut-card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 animate-rise">
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="btn !p-0 w-10 h-10 bg-white !shadow-[2px_2px_0_var(--ink)] shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        {children}
        <div className="grid grid-cols-2 gap-3 mt-6">{footer}</div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-2xl border-2 border-ink bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="hidden md:block brut-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-peach text-left border-b-[2.5px] border-ink">
              {head.map((h) => (
                <th key={h} className="px-5 py-3.5 font-extrabold uppercase text-xs tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function MobileCard({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border-[2.5px] border-ink bg-white p-4 shadow-[4px_4px_0_var(--ink)]">{children}</div>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/40 p-8 text-center font-bold text-muted">
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PIN Modal
// ---------------------------------------------------------------------------

function PinModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  if (!open) return null;

  return (
    <Modal
      title="Vérification PIN"
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="btn bg-white">
            Annuler
          </button>
          <button onClick={() => onConfirm(pin)} disabled={pin.length !== 6} className="btn bg-brand text-white">
            Confirmer
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-sun border-2 border-ink shrink-0">
          <Lock className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <p className="text-sm text-muted">Entrez le PIN administrateur pour confirmer cette action.</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        className="field text-center !text-2xl tracking-[0.5em] font-extrabold"
        placeholder="••••••"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && pin.length === 6) onConfirm(pin);
        }}
        autoFocus
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({
  plans,
  members,
  payments,
}: {
  plans: Plan[];
  members: Member[];
  payments: Payment[];
}) {
  const totalSeats = plans.reduce((s, p) => s + p.totalSeats, 0);
  const occupiedSeats = plans.reduce((s, p) => s + p.occupiedSeats, 0);
  const completedPayments = payments.filter((p) => p.status === "complete");
  const totalRevenue = completedPayments.reduce((s, p) => s + p.amount, 0);
  const activeMembers = members.filter((m) => m.status === "active").length;
  const activePlan = plans.find((p) => p.status === "active");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Places"
          value={`${occupiedSeats}/${totalSeats}`}
          sub={activePlan ? `Actif : ${activePlan.name}` : "Aucun plan actif"}
          tone="bg-brand text-white [&_p]:!text-white"
        />
        <StatCard
          label="Revenu"
          value={formatPrice(totalRevenue)}
          sub={`FCFA · ${completedPayments.length} paiements`}
          tone="bg-[#bdf2cf]"
        />
        <StatCard
          label="Marge estimée"
          value={formatPrice(activeMembers * 2000)}
          sub="FCFA · ~2 000 / membre actif"
          tone="bg-sun"
        />
        <StatCard label="Membres actifs" value={activeMembers} sub={`${members.length} au total`} tone="bg-peach" />
      </div>

      {activePlan && (
        <div className="brut-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Plan actif</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{activePlan.name}</h3>
            </div>
            <StatusChip status={activePlan.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip bg-white">
              {formatDate(activePlan.startDate)} → {formatDate(activePlan.endDate)}
            </span>
            <span className="chip bg-peach">
              {activePlan.occupiedSeats}/{activePlan.totalSeats} places
            </span>
          </div>
          <div className="mt-5 h-5 rounded-full border-2 border-ink bg-white overflow-hidden">
            <div
              className="h-full bg-brand border-r-2 border-ink transition-[width]"
              style={{
                width: `${Math.max(4, Math.min(100, (activePlan.occupiedSeats / activePlan.totalSeats) * 100))}%`,
              }}
            />
          </div>
          <p className="text-xs font-bold text-muted mt-2">
            {activePlan.totalSeats - activePlan.occupiedSeats} places disponibles
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-2xl font-extrabold tracking-tight">Historique des plans</h3>
        {plans.length === 0 && <EmptyState text="Aucun plan pour le moment." />}
        <Table head={["Nom", "Période", "Places", "Statut"]}>
          {plans.map((plan) => (
            <tr key={plan.id} className="hover:bg-cream">
              <td className="px-5 py-3.5 font-extrabold">{plan.name}</td>
              <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">
                {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
              </td>
              <td className="px-5 py-3.5 font-bold">
                {plan.occupiedSeats}/{plan.totalSeats}
              </td>
              <td className="px-5 py-3.5">
                <StatusChip status={plan.status} />
              </td>
            </tr>
          ))}
        </Table>
        <div className="md:hidden space-y-3">
          {plans.map((plan) => (
            <MobileCard key={plan.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-extrabold truncate">{plan.name}</p>
                <StatusChip status={plan.status} />
              </div>
              <p className="mt-1 text-sm font-semibold text-muted">
                {formatDate(plan.startDate)} → {formatDate(plan.endDate)} · {plan.occupiedSeats}/{plan.totalSeats} places
              </p>
            </MobileCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plans Tab
// ---------------------------------------------------------------------------

function PlansTab({ plans }: { plans: Plan[] }) {
  const getToken = useAdminToken();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    totalSeats: "",
  });

  function openCreate() {
    setEditingPlan(null);
    setForm({ name: "", startDate: "", endDate: "", totalSeats: "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      startDate: plan.startDate,
      endDate: plan.endDate,
      totalSeats: String(plan.totalSeats),
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      const url = "/api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";
      const body = editingPlan
        ? { id: editingPlan.id, ...form, totalSeats: Number(form.totalSeats) }
        : { ...form, totalSeats: Number(form.totalSeats) };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }

      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        action={
          <button onClick={openCreate} className="btn bg-brand text-white w-full sm:w-auto">
            <Plus className="w-4 h-4" strokeWidth={3} /> Nouveau plan
          </button>
        }
      >
        Plans
      </SectionTitle>

      {showForm && (
        <Modal
          title={editingPlan ? "Modifier le plan" : "Nouveau plan"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button onClick={() => setShowForm(false)} className="btn bg-white">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving} className="btn bg-brand text-white">
                {saving ? "…" : editingPlan ? "Mettre à jour" : "Créer"}
              </button>
            </>
          }
        >
          <ErrorBox message={error} />
          <div className="space-y-4">
            <Field label="Nom">
              <input
                type="text"
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="X-Gen 4"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date de début">
                <input
                  type="date"
                  className="field"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </Field>
              <Field label="Date de fin">
                <input
                  type="date"
                  className="field"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Nombre de places">
              <input
                type="number"
                min="1"
                className="field"
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                placeholder="15"
              />
            </Field>
          </div>
        </Modal>
      )}

      {plans.length === 0 && <EmptyState text="Aucun plan. Créez le premier !" />}

      <Table head={["Nom", "Début", "Fin", "Places", "Statut", ""]}>
        {plans.map((plan) => (
          <tr key={plan.id} className="hover:bg-cream">
            <td className="px-5 py-3.5 font-extrabold">{plan.name}</td>
            <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">{formatDate(plan.startDate)}</td>
            <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">{formatDate(plan.endDate)}</td>
            <td className="px-5 py-3.5 font-bold">
              {plan.occupiedSeats}/{plan.totalSeats}
            </td>
            <td className="px-5 py-3.5">
              <StatusChip status={plan.status} />
            </td>
            <td className="px-5 py-3.5 text-right">
              <button onClick={() => openEdit(plan)} className="btn !py-1.5 !px-3.5 text-sm bg-white !shadow-[2px_2px_0_var(--ink)]">
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} /> Modifier
              </button>
            </td>
          </tr>
        ))}
      </Table>

      <div className="md:hidden space-y-3">
        {plans.map((plan) => (
          <MobileCard key={plan.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-extrabold truncate">{plan.name}</p>
              <StatusChip status={plan.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-muted">
              {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="chip bg-peach">
                {plan.occupiedSeats}/{plan.totalSeats} places
              </span>
              <button onClick={() => openEdit(plan)} className="btn !py-2 !px-4 text-sm bg-white !shadow-[2px_2px_0_var(--ink)]">
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} /> Modifier
              </button>
            </div>
          </MobileCard>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------

function MembersTab({
  members,
  plans,
}: {
  members: Member[];
  plans: Plan[];
}) {
  const getToken = useAdminToken();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    planId: "",
    emailToAdd: "",
    heardAboutUs: "",
  });

  function openAddMember() {
    setEditingMember(null);
    setForm({ email: "", displayName: "", planId: "", emailToAdd: "", heardAboutUs: "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(member: Member) {
    setEditingMember(member);
    setForm({
      email: member.email,
      displayName: member.displayName,
      planId: member.planId,
      emailToAdd: member.emailToAdd,
      heardAboutUs: member.heardAboutUs,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      const url = "/api/admin/members";
      const method = editingMember ? "PUT" : "POST";
      const body = editingMember
        ? { id: editingMember.id, ...form }
        : form;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }

      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(memberId: string) {
    setPendingDeleteId(memberId);
    setShowPinModal(true);
  }

  async function confirmDelete(_pin: string) {
    if (!pendingDeleteId) return;
    try {
      const token = await getToken();
      const member = members.find((m) => m.id === pendingDeleteId);
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: pendingDeleteId, planId: member?.planId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShowPinModal(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PinModal
        open={showPinModal}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowPinModal(false);
          setPendingDeleteId(null);
        }}
      />

      <SectionTitle
        action={
          <button onClick={openAddMember} className="btn bg-brand text-white w-full sm:w-auto">
            <Plus className="w-4 h-4" strokeWidth={3} /> Ajouter un ancien membre
          </button>
        }
      >
        Membres <span className="text-brand">{members.length}</span>
      </SectionTitle>

      {showForm && (
        <Modal
          title={editingMember ? "Modifier le membre" : "Ajouter un ancien membre"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button onClick={() => setShowForm(false)} className="btn bg-white">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving} className="btn bg-brand text-white">
                {saving ? "…" : editingMember ? "Mettre à jour" : "Ajouter"}
              </button>
            </>
          }
        >
          <ErrorBox message={error} />
          <div className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                className="field disabled:bg-cream disabled:text-muted"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editingMember}
              />
            </Field>
            <Field label="Nom complet">
              <input
                type="text"
                className="field"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </Field>
            <Field label="Plan">
              <select
                className="field appearance-none cursor-pointer"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
              >
                <option value="">Sélectionner un plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Email à ajouter au plan Claude">
              <input
                type="email"
                className="field"
                value={form.emailToAdd}
                onChange={(e) => setForm({ ...form, emailToAdd: e.target.value })}
              />
            </Field>
            <Field label="Comment a-t-il connu X-Gen ?">
              <input
                type="text"
                className="field"
                value={form.heardAboutUs}
                onChange={(e) => setForm({ ...form, heardAboutUs: e.target.value })}
                placeholder="WhatsApp, TikTok, Ami..."
              />
            </Field>
          </div>
        </Modal>
      )}

      {members.length === 0 && <EmptyState text="Aucun membre pour le moment." />}

      <Table head={["Nom", "Email", "Plan", "Statut", "Inscription", "Expiration", ""]}>
        {members.map((member) => (
          <tr key={member.id} className="hover:bg-cream">
            <td className="px-5 py-3.5 font-extrabold whitespace-nowrap">{member.displayName}</td>
            <td className="px-5 py-3.5 font-semibold text-muted">{member.email}</td>
            <td className="px-5 py-3.5 font-bold whitespace-nowrap">{member.planName}</td>
            <td className="px-5 py-3.5">
              <StatusChip status={member.status} />
            </td>
            <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">{formatDate(member.joinDate)}</td>
            <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">{formatDate(member.expiryDate)}</td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(member)}
                  aria-label="Modifier"
                  className="btn !p-0 w-9 h-9 bg-white !shadow-[2px_2px_0_var(--ink)]"
                >
                  <Pencil className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => requestDelete(member.id)}
                  aria-label="Supprimer"
                  className="btn !p-0 w-9 h-9 bg-[#ffb4ae] !shadow-[2px_2px_0_var(--ink)]"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <MobileCard key={member.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-extrabold truncate">{member.displayName}</p>
                <p className="text-sm font-semibold text-muted truncate">{member.email}</p>
              </div>
              <StatusChip status={member.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip bg-peach">{member.planName}</span>
              <span className="chip bg-white">
                {formatDate(member.joinDate)} → {formatDate(member.expiryDate)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => openEdit(member)} className="btn !py-2 text-sm bg-white !shadow-[2px_2px_0_var(--ink)]">
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} /> Modifier
              </button>
              <button
                onClick={() => requestDelete(member.id)}
                className="btn !py-2 text-sm bg-[#ffb4ae] !shadow-[2px_2px_0_var(--ink)]"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Supprimer
              </button>
            </div>
          </MobileCard>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------

function PaymentsTab({ payments }: { payments: Payment[] }) {
  return (
    <div className="space-y-5">
      <SectionTitle>
        Paiements <span className="text-brand">{payments.length}</span>
      </SectionTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Encaissé"
          value={formatPrice(payments.filter((p) => p.status === "complete").reduce((s, p) => s + p.amount, 0))}
          sub="FCFA"
          tone="bg-[#bdf2cf]"
        />
        <StatCard label="En attente" value={payments.filter((p) => p.status === "pending").length} tone="bg-sun" />
        <StatCard label="Payés" value={payments.filter((p) => p.status === "complete").length} tone="bg-white" />
        <StatCard label="Échoués" value={payments.filter((p) => p.status === "failed").length} tone="bg-[#ffb4ae]" />
      </div>

      {payments.length === 0 && <EmptyState text="Aucun paiement pour le moment." />}

      <Table head={["Référence", "Membre", "Montant", "Type", "Statut", "Date", "Vérifié"]}>
        {payments.map((payment) => (
          <tr key={payment.id} className="hover:bg-cream">
            <td className="px-5 py-3.5 font-mono text-xs">{payment.reference}</td>
            <td className="px-5 py-3.5 font-semibold">{payment.displayName || payment.memberEmail}</td>
            <td className="px-5 py-3.5 font-extrabold whitespace-nowrap">{formatPrice(payment.amount)} FCFA</td>
            <td className="px-5 py-3.5">
              <TypeChip type={payment.type} />
            </td>
            <td className="px-5 py-3.5">
              <StatusChip status={payment.status} />
            </td>
            <td className="px-5 py-3.5 font-semibold text-muted whitespace-nowrap">
              {formatDate(payment.paidAt || payment.createdAt)}
            </td>
            <td className="px-5 py-3.5">
              {payment.webhookVerified ? (
                <span className="grid place-items-center w-7 h-7 rounded-full bg-[#bdf2cf] border-2 border-ink">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
              ) : (
                <span className="text-muted font-bold">Non</span>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <div className="md:hidden space-y-3">
        {payments.map((payment) => (
          <MobileCard key={payment.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-2xl font-extrabold tracking-tight">
                  {formatPrice(payment.amount)} <span className="text-sm">FCFA</span>
                </p>
                <p className="text-sm font-semibold text-muted truncate">{payment.displayName || payment.memberEmail}</p>
              </div>
              <StatusChip status={payment.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TypeChip type={payment.type} />
              <span className="chip bg-white">{formatDate(payment.paidAt || payment.createdAt)}</span>
              {payment.webhookVerified && (
                <span className="chip bg-[#bdf2cf]">
                  <Check className="w-3 h-3" strokeWidth={3} /> Vérifié
                </span>
              )}
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted break-all">{payment.reference}</p>
          </MobileCard>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config Tab
// ---------------------------------------------------------------------------

function ConfigTab() {
  const getToken = useAdminToken();
  const { pricing: livePricing, loading: pricingLoading } = usePricing();
  const [pricing, setPricing] = useState<PricingConfig>({ ...DEFAULT_PRICING });
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [saved, setSaved] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [pinError, setPinError] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (!pricingLoading && livePricing) {
      setPricing(livePricing);
    }
  }, [livePricing, pricingLoading]);

  const computedFullPrice = useMemo(() => {
    const raw =
      (pricing.baseCostFCFA + pricing.marginFCFA) * (1 + pricing.notchPayFeePercent);
    return Math.round(raw / 500) * 500;
  }, [pricing.baseCostFCFA, pricing.marginFCFA, pricing.notchPayFeePercent]);

  async function handleSavePricing() {
    setSavingPricing(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseCostFCFA: pricing.baseCostFCFA,
          marginFCFA: pricing.marginFCFA,
          notchPayFeePercent: pricing.notchPayFeePercent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPricing(false);
    }
  }

  async function handleSavePin() {
    setPinError("");
    if (pinForm.newPin.length !== 6) {
      setPinError("Le PIN doit contenir 6 chiffres");
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError("Les PINs ne correspondent pas");
      return;
    }

    setSavingPin(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminPin: pinForm.newPin,
          currentPin: pinForm.currentPin,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }

      setPinSaved(true);
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      setTimeout(() => setPinSaved(false), 2000);
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setSavingPin(false);
    }
  }

  const pinInput = (key: keyof typeof pinForm) => (
    <input
      type="password"
      inputMode="numeric"
      maxLength={6}
      className="field tracking-[0.4em] font-extrabold"
      value={pinForm[key]}
      onChange={(e) => setPinForm({ ...pinForm, [key]: e.target.value.replace(/\D/g, "") })}
      placeholder="••••••"
    />
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionTitle>Configuration</SectionTitle>

      <div className="brut-card p-5 sm:p-6">
        <h3 className="text-2xl font-extrabold tracking-tight mb-5">Prix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Coût de base (FCFA)" hint="Coût Anthropic en équivalent FCFA">
            <input
              type="number"
              className="field"
              value={pricing.baseCostFCFA}
              onChange={(e) => setPricing({ ...pricing, baseCostFCFA: Number(e.target.value) })}
            />
          </Field>
          <Field label="Marge (FCFA)">
            <input
              type="number"
              className="field"
              value={pricing.marginFCFA}
              onChange={(e) => setPricing({ ...pricing, marginFCFA: Number(e.target.value) })}
            />
          </Field>
          <Field label="Frais NotchPay" hint="Ex : 0.02 = 2 %">
            <input
              type="number"
              step="0.01"
              className="field"
              value={pricing.notchPayFeePercent}
              onChange={(e) => setPricing({ ...pricing, notchPayFeePercent: Number(e.target.value) })}
            />
          </Field>
        </div>

        <div className="mt-6 rounded-3xl bg-sun border-[2.5px] border-ink p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide">Prix final calculé</p>
            <p className="text-4xl font-extrabold tracking-tight">
              {formatPrice(computedFullPrice)} <span className="text-base">FCFA</span>
            </p>
            <p className="text-xs font-semibold text-ink/70 mt-1 break-words">
              ({formatPrice(pricing.baseCostFCFA)} + {formatPrice(pricing.marginFCFA)}) × (1 +{" "}
              {pricing.notchPayFeePercent}), arrondi à 500
            </p>
          </div>
          <button onClick={handleSavePricing} disabled={savingPricing} className="btn bg-brand text-white w-full sm:w-auto">
            {saved ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} /> Enregistré !
              </>
            ) : savingPricing ? (
              "…"
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </div>

      <div className="brut-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-peach border-2 border-ink shrink-0">
            <Lock className="w-5 h-5" strokeWidth={2.5} />
          </span>
          <h3 className="text-2xl font-extrabold tracking-tight">PIN administrateur</h3>
        </div>
        <p className="text-sm text-muted mb-5">
          Requis pour les actions critiques (suppression de membres, etc.). PIN par défaut : 000000.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="PIN actuel">{pinInput("currentPin")}</Field>
          <Field label="Nouveau PIN">{pinInput("newPin")}</Field>
          <Field label="Confirmer le PIN">{pinInput("confirmPin")}</Field>
        </div>
        {pinError && (
          <p className="mt-4 rounded-2xl border-2 border-ink bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
            {pinError}
          </p>
        )}
        <button onClick={handleSavePin} disabled={savingPin} className="btn bg-ink text-white mt-5 w-full sm:w-auto">
          {pinSaved ? (
            <>
              <Check className="w-4 h-4" strokeWidth={3} /> PIN mis à jour !
            </>
          ) : savingPin ? (
            "…"
          ) : (
            "Changer le PIN"
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Dashboard Page
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: <LayoutGrid className="w-4 h-4" strokeWidth={2.5} /> },
  { id: "plans", label: "Plans", icon: <Layers className="w-4 h-4" strokeWidth={2.5} /> },
  { id: "members", label: "Membres", icon: <Users className="w-4 h-4" strokeWidth={2.5} /> },
  { id: "payments", label: "Paiements", icon: <CreditCard className="w-4 h-4" strokeWidth={2.5} /> },
  { id: "config", label: "Configuration", icon: <Settings className="w-4 h-4" strokeWidth={2.5} /> },
];

export default function MyspacePage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { plans, loading: plansLoading } = usePlans();
  const { members, loading: membersLoading } = useAllMembers();
  const { payments, loading: paymentsLoading } = useAllPayments();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [authLoading, user, isAdmin, router]);

  const dataLoading = plansLoading || membersLoading || paymentsLoading;

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand border-[2.5px] border-ink shadow-[3px_3px_0_var(--ink)] animate-spin-slow" />
          <p className="font-bold text-muted">Chargement des données…</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <section className="relative rounded-[32px] bg-ink text-white border-[2.5px] border-ink shadow-[6px_6px_0_var(--brand)] px-5 py-6 sm:px-8 sm:py-8 mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="chip bg-brand text-white !border-white">Admin</span>
            <span className="chip bg-white text-ink max-w-full truncate">{user.email}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none">
            Tableau de <span className="text-sun">bord</span>
          </h1>
        </section>

        <nav className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-6 sm:mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 w-max pb-2 pr-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn !py-2.5 !px-4 text-sm !shadow-[3px_3px_0_var(--ink)] ${
                    active ? "bg-brand text-white" : "bg-white text-ink"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div key={activeTab} className="animate-rise">
          {activeTab === "overview" && <OverviewTab plans={plans} members={members} payments={payments} />}
          {activeTab === "plans" && <PlansTab plans={plans} />}
          {activeTab === "members" && <MembersTab members={members} plans={plans} />}
          {activeTab === "payments" && <PaymentsTab payments={payments} />}
          {activeTab === "config" && <ConfigTab />}
        </div>
      </main>
    </div>
  );
}

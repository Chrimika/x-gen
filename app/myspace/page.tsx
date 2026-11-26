"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { usePlans, useAllMembers, useAllPayments, usePricing } from "@/lib/hooks";
import { DEFAULT_PRICING } from "@/lib/pricing";
import type { Plan, Member, Payment, PricingConfig } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-600",
    upcoming: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    complete: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

type TabId = "overview" | "plans" | "members" | "payments" | "config";

function useAdminToken() {
  const { user } = useAuth();
  return useCallback(async () => {
    if (!user) return "";
    return user.getIdToken();
  }, [user]);
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold mb-3">Verification PIN</h3>
        <p className="text-sm text-gray-500 mb-4">
          Entrez le PIN administrateur pour confirmer cette action.
        </p>
        <input
          type="password"
          maxLength={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
          placeholder="------"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pin.length === 6) onConfirm(pin);
          }}
          autoFocus
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(pin)}
            disabled={pin.length !== 6}
            className="flex-1 px-4 py-2 rounded-lg bg-[#E8622C] text-white hover:bg-[#d4561f] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Places totales"
          value={`${occupiedSeats}/${totalSeats}`}
          sub={activePlan ? `Plan actif: ${activePlan.name}` : "Aucun plan actif"}
          color="text-[#E8622C]"
        />
        <StatCard
          label="Revenu total"
          value={`${formatPrice(totalRevenue)} FCFA`}
          sub={`${completedPayments.length} paiements`}
          color="text-green-600"
        />
        <StatCard
          label="Marge estimee"
          value={`${formatPrice(activeMembers * 2000)} FCFA`}
          sub={`~2 000 FCFA/membre actif`}
        />
        <StatCard
          label="Membres actifs"
          value={activeMembers}
          sub={`${members.length} total`}
        />
      </div>

      {activePlan && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Plan actif</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nom</p>
              <p className="font-medium">{activePlan.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Periode</p>
              <p className="font-medium">
                {formatDate(activePlan.startDate)} - {formatDate(activePlan.endDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Places</p>
              <p className="font-medium">
                {activePlan.occupiedSeats}/{activePlan.totalSeats}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              {statusBadge(activePlan.status)}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-[#E8622C] h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (activePlan.occupiedSeats / activePlan.totalSeats) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {activePlan.totalSeats - activePlan.occupiedSeats} places disponibles
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historique des plans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Periode</th>
                <th className="px-5 py-3 font-medium">Places</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{plan.name}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {plan.occupiedSeats}/{plan.totalSeats}
                  </td>
                  <td className="px-5 py-3">{statusBadge(plan.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Plans</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-[#E8622C] text-white text-sm font-medium hover:bg-[#d4561f]"
        >
          + Nouveau plan
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingPlan ? "Modifier le plan" : "Nouveau plan"}
            </h3>
            {error && (
              <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Claude Team - Fev 2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date debut</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date fin</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre de places</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.totalSeats}
                  onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-[#E8622C] text-white hover:bg-[#d4561f] disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "..." : editingPlan ? "Mettre a jour" : "Creer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Debut</th>
                <th className="px-5 py-3 font-medium">Fin</th>
                <th className="px-5 py-3 font-medium">Places</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{plan.name}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(plan.startDate)}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(plan.endDate)}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {plan.occupiedSeats}/{plan.totalSeats}
                  </td>
                  <td className="px-5 py-3">{statusBadge(plan.status)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openEdit(plan)}
                      className="text-[#E8622C] hover:underline text-sm font-medium"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div className="space-y-4">
      <PinModal
        open={showPinModal}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowPinModal(false);
          setPendingDeleteId(null);
        }}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Membres ({members.length})
        </h2>
        <button
          onClick={openAddMember}
          className="px-4 py-2 rounded-lg bg-[#E8622C] text-white text-sm font-medium hover:bg-[#d4561f]"
        >
          + Ajouter un ancien membre
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingMember ? "Modifier le membre" : "Ajouter un ancien membre"}
            </h3>
            {error && (
              <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingMember}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom complet</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plan</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                >
                  <option value="">Selectionner un plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Email a ajouter au plan Claude
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.emailToAdd}
                  onChange={(e) => setForm({ ...form, emailToAdd: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Comment a-t-il connu X-Gen ?
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
                  value={form.heardAboutUs}
                  onChange={(e) => setForm({ ...form, heardAboutUs: e.target.value })}
                  placeholder="WhatsApp, TikTok, Ami..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-[#E8622C] text-white hover:bg-[#d4561f] disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "..." : editingMember ? "Mettre a jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Inscription</th>
                <th className="px-5 py-3 font-medium">Expiration</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {member.displayName}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{member.email}</td>
                  <td className="px-5 py-3 text-gray-600">{member.planName}</td>
                  <td className="px-5 py-3">{statusBadge(member.status)}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(member.joinDate)}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(member.expiryDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        className="text-[#E8622C] hover:underline text-sm font-medium"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => requestDelete(member.id)}
                        className="text-red-500 hover:underline text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------

function PaymentsTab({ payments }: { payments: Payment[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Paiements ({payments.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total encaisse"
          value={`${formatPrice(payments.filter((p) => p.status === "complete").reduce((s, p) => s + p.amount, 0))} FCFA`}
          color="text-green-600"
        />
        <StatCard
          label="En attente"
          value={payments.filter((p) => p.status === "pending").length}
          color="text-yellow-600"
        />
        <StatCard
          label="Completes"
          value={payments.filter((p) => p.status === "complete").length}
          color="text-green-600"
        />
        <StatCard
          label="Echoues"
          value={payments.filter((p) => p.status === "failed").length}
          color="text-red-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Membre</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Verifie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-900">
                    {payment.reference}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {payment.displayName || payment.memberEmail}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {formatPrice(payment.amount)} FCFA
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.type === "join"
                          ? "bg-blue-100 text-blue-800"
                          : payment.type === "renewal"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {payment.type === "join"
                        ? "Adhesion"
                        : payment.type === "renewal"
                          ? "Renouvellement"
                          : "Nouveau plan"}
                    </span>
                  </td>
                  <td className="px-5 py-3">{statusBadge(payment.status)}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {payment.webhookVerified ? (
                      <span className="text-green-600 font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-400">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Configuration des prix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Cout de base (FCFA)
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pricing.baseCostFCFA}
              onChange={(e) =>
                setPricing({ ...pricing, baseCostFCFA: Number(e.target.value) })
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              Cout Anthropic en equivalent FCFA
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Marge (FCFA)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pricing.marginFCFA}
              onChange={(e) =>
                setPricing({ ...pricing, marginFCFA: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Frais NotchPay (%)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pricing.notchPayFeePercent}
              onChange={(e) =>
                setPricing({
                  ...pricing,
                  notchPayFeePercent: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-400 mt-1">Ex: 0.02 = 2%</p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Prix final calcule</p>
              <p className="text-2xl font-bold text-[#E8622C]">
                {formatPrice(computedFullPrice)} FCFA
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ({formatPrice(pricing.baseCostFCFA)} + {formatPrice(pricing.marginFCFA)}) x
                (1 + {pricing.notchPayFeePercent}) = {formatPrice(computedFullPrice)} FCFA
                (arrondi a 500)
              </p>
            </div>
            <button
              onClick={handleSavePricing}
              disabled={savingPricing}
              className="px-5 py-2 rounded-lg bg-[#E8622C] text-white text-sm font-medium hover:bg-[#d4561f] disabled:opacity-50"
            >
              {saved ? "Enregistre !" : savingPricing ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Gestion du PIN</h3>
        <p className="text-sm text-gray-500 mb-4">
          Le PIN est requis pour les actions critiques (suppression de membres, etc.).
          PIN par defaut: 000000
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">PIN actuel</label>
            <input
              type="password"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pinForm.currentPin}
              onChange={(e) =>
                setPinForm({
                  ...pinForm,
                  currentPin: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="------"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nouveau PIN</label>
            <input
              type="password"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pinForm.newPin}
              onChange={(e) =>
                setPinForm({
                  ...pinForm,
                  newPin: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="------"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Confirmer le PIN
            </label>
            <input
              type="password"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/50 focus:border-[#E8622C]"
              value={pinForm.confirmPin}
              onChange={(e) =>
                setPinForm({
                  ...pinForm,
                  confirmPin: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="------"
            />
          </div>
        </div>
        {pinError && <p className="text-sm text-red-500 mt-2">{pinError}</p>}
        <div className="mt-4">
          <button
            onClick={handleSavePin}
            disabled={savingPin}
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {pinSaved ? "PIN mis a jour !" : savingPin ? "..." : "Changer le PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Dashboard Page
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "plans", label: "Plans" },
  { id: "members", label: "Membres" },
  { id: "payments", label: "Paiements" },
  { id: "config", label: "Configuration" },
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-[#E8622C] border-t-transparent rounded-full" />
          <p className="text-sm text-[#666]">Chargement des donnees...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8622C] flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">X-Gen Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8622C]/10 text-[#E8622C]">
                Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#E8622C] text-[#E8622C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <OverviewTab plans={plans} members={members} payments={payments} />
        )}
        {activeTab === "plans" && <PlansTab plans={plans} />}
        {activeTab === "members" && <MembersTab members={members} plans={plans} />}
        {activeTab === "payments" && <PaymentsTab payments={payments} />}
        {activeTab === "config" && <ConfigTab />}
      </main>
    </div>
  );
}

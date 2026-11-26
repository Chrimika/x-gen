"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/hooks";
import {
  getProratedPrice,
  getDaysRemaining,
  formatPrice,
  formatDate,
  getCountdownLabel,
  getAvailableSeats,
  DEFAULT_PRICING,
} from "@/lib/pricing";

const SURVEY_OPTIONS = [
  "Groupe WhatsApp",
  "Bouche à oreille / Ami",
  "TikTok",
  "Autre",
];

const IS_NEW_PLAN_ID = "new-plan";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const isNewPlan = planId === IS_NEW_PLAN_ID;

  const [emailToAdd, setEmailToAdd] = useState("");
  const [heardAboutUs, setHeardAboutUs] = useState("");
  const [otherSource, setOtherSource] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const isSuccess = searchParams.get("success") === "true";
  const isRenewal = searchParams.get("type") === "renewal";
  const { plan, loading: planLoading } = usePlan(isNewPlan ? "" : planId);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading || (!isNewPlan && planLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="animate-pulse text-[#666]">Chargement...</div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          {isNewPlan ? (
            <>
              <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Paiement re&ccedil;u !</h1>
              <p className="text-[#666] text-sm mb-6">
                Vous &ecirc;tes maintenant en <span className="font-semibold text-[#E8622C]">liste d&apos;attente</span>.
                D&egrave;s qu&apos;un deuxi&egrave;me membre aura &eacute;galement pay&eacute;, le plan sera cr&eacute;&eacute;
                et votre acc&egrave;s sera activ&eacute;. Vous serez notifi&eacute; par email.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Paiement r&eacute;ussi !</h1>
              <p className="text-[#666] text-sm mb-6">
                Votre paiement a &eacute;t&eacute; re&ccedil;u avec succ&egrave;s. Vous recevrez un
                email de confirmation sous peu. Votre acc&egrave;s sera activ&eacute; dans les
                prochaines heures.
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#E8622C] text-white font-medium rounded-xl hover:bg-[#d4561f] transition-colors text-sm"
            >
              Aller au tableau de bord
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-[#1a1a1a] font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              Retour &agrave; l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8622C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Connexion requise</h1>
          <p className="text-[#666] text-sm mb-6">
            Vous devez vous connecter avant de proc&eacute;der au paiement.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#E8622C] text-white font-medium rounded-xl hover:bg-[#d4561f] transition-colors text-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // Plan not found (only for existing plans)
  if (!isNewPlan && !plan) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Plan introuvable</h1>
          <p className="text-[#666] text-sm mb-6">
            Le plan demand&eacute; n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#E8622C] text-white font-medium rounded-xl hover:bg-[#d4561f] transition-colors text-sm"
          >
            Voir les plans disponibles
          </Link>
        </div>
      </div>
    );
  }

  const price = isNewPlan
    ? DEFAULT_PRICING.fullPriceFCFA
    : getProratedPrice(plan!, undefined, now);
  const daysRemaining = isNewPlan ? 30 : getDaysRemaining(plan!, now);
  const availableSeats = isNewPlan ? 99 : getAvailableSeats(plan!);
  const countdown = isNewPlan ? "" : getCountdownLabel(plan!, now);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailToAdd.trim()) {
      setError("Veuillez entrer l'email à ajouter au plan.");
      return;
    }
    if (!heardAboutUs) {
      setError("Veuillez indiquer où vous avez entendu parler de nous.");
      return;
    }
    if (heardAboutUs === "Autre" && !otherSource.trim()) {
      setError("Veuillez préciser où vous avez entendu parler de nous.");
      return;
    }

    setIsProcessing(true);

    const reference = `xgen_${planId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const source = heardAboutUs === "Autre" ? otherSource : heardAboutUs;

    try {
      const notchPayKey = process.env.NEXT_PUBLIC_NOTCHPAY_PUBLIC_KEY;
      if (!notchPayKey) {
        setError("Clé de paiement non configurée. Contactez le support.");
        setIsProcessing(false);
        return;
      }

      if (isNewPlan) {
        // Save to waiting list + payment
        await setDoc(doc(db, "payments", reference), {
          id: reference,
          reference,
          memberEmail: user!.email,
          memberUid: user!.uid,
          planId: "new-plan",
          amount: price,
          type: "new_plan",
          status: "pending",
          heardAboutUs: source,
          emailToAdd: emailToAdd.trim(),
          displayName: user!.displayName || "",
          webhookVerified: false,
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, "waitingList"), {
          email: user!.email,
          displayName: user!.displayName || "",
          uid: user!.uid,
          amount: price,
          paymentRef: reference,
          emailToAdd: emailToAdd.trim(),
          heardAboutUs: source,
          status: "waiting",
          createdAt: new Date().toISOString(),
        });
      } else {
        await setDoc(doc(db, "payments", reference), {
          id: reference,
          reference,
          memberEmail: user!.email,
          memberUid: user!.uid,
          planId,
          amount: price,
          type: isRenewal ? "renewal" : "join",
          status: "pending",
          heardAboutUs: source,
          emailToAdd: emailToAdd.trim(),
          displayName: user!.displayName || "",
          webhookVerified: false,
          createdAt: new Date().toISOString(),
        });
      }

      const description = isNewPlan
        ? "Nouveau plan Claude AI Team - Liste d'attente"
        : `${isRenewal ? "Renouvellement" : "Abonnement"} ${plan!.name} - Claude AI Team`;

      const response = await fetch("https://api.notchpay.co/payments/initialize", {
        method: "POST",
        headers: {
          Authorization: notchPayKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user!.email,
          amount: price,
          currency: "XAF",
          description,
          reference,
          callback: `${window.location.origin}/checkout/${planId}?success=true`,
          metadata: {
            planId,
            planName: isNewPlan ? "Nouveau plan (liste d'attente)" : plan!.name,
            emailToAdd: emailToAdd.trim(),
            heardAboutUs: source,
            displayName: user!.displayName || "",
            uid: user!.uid,
            type: isNewPlan ? "new_plan" : isRenewal ? "renewal" : "join",
          },
        }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (data.transaction?.authorization_url) {
        window.location.href = data.transaction.authorization_url;
      } else {
        setError("Erreur lors de l'initialisation du paiement. Veuillez réessayer.");
        setIsProcessing(false);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
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
          <Link href="/" className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">
            &larr; Retour aux plans
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          {isNewPlan ? "Nouveau plan — Liste d'attente" : isRenewal ? "Renouvellement" : "Paiement"}
        </h1>
        <p className="text-[#666] text-sm mb-8">
          {isNewPlan
            ? "Payez maintenant et patientez. Dès qu'un 2e membre paie, le plan est créé et vous bénéficiez de l'accès."
            : isRenewal
              ? "Renouvelez votre abonnement pour continuer à utiliser Claude AI."
              : "Finalisez votre inscription pour rejoindre une équipe Claude AI."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Summary */}
          <div className="lg:col-span-2 order-first lg:order-last">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">R&eacute;capitulatif</h2>

              <div className="space-y-4">
                {isNewPlan ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Type</span>
                      <span className="text-sm font-medium text-[#E8622C]">Nouveau plan</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Dur&eacute;e</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">1 mois complet</span>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-700">
                        Vous serez plac&eacute; en liste d&apos;attente. Le plan d&eacute;marre d&egrave;s qu&apos;au moins
                        2 personnes ont pay&eacute;.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Plan</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">{plan!.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Jours restants</span>
                      <span className="text-sm font-medium text-[#E8622C]">
                        {daysRemaining} jours ({countdown})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Places disponibles</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {availableSeats} / {plan!.totalSeats}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">P&eacute;riode</span>
                      <span className="text-sm text-[#1a1a1a]">
                        {formatDate(plan!.startDate)} &mdash; {formatDate(plan!.endDate)}
                      </span>
                    </div>
                  </>
                )}

                <hr className="border-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-[#1a1a1a]">
                    {isNewPlan ? "Prix" : "Prix proraté"}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#E8622C]">
                      {formatPrice(price)}
                    </span>
                    <span className="text-sm text-[#666] ml-1">FCFA</span>
                  </div>
                </div>

                <p className="text-xs text-[#999]">
                  {isNewPlan
                    ? "Prix pour un mois complet d'accès à Claude AI Team."
                    : `Prix calculé au prorata des ${daysRemaining} jours restants dans le cycle.`}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Vos informations</h2>

              <form onSubmit={handlePayment} className="space-y-5">
                <div className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-10 h-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {user.displayName || "Utilisateur"}
                    </p>
                    <p className="text-xs text-[#666]">{user.email}</p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="emailToAdd"
                    className="block text-sm font-medium text-[#1a1a1a] mb-2"
                  >
                    Email &agrave; ajouter au plan Claude
                  </label>
                  <input
                    type="email"
                    id="emailToAdd"
                    value={emailToAdd}
                    onChange={(e) => setEmailToAdd(e.target.value)}
                    placeholder="votre-email@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1a1a] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/30 focus:border-[#E8622C] transition-colors"
                    required
                  />
                  <p className="text-xs text-[#999] mt-1.5">
                    C&apos;est l&apos;adresse email qui sera ajout&eacute;e &agrave;
                    l&apos;&eacute;quipe Claude AI.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="heardAboutUs"
                    className="block text-sm font-medium text-[#1a1a1a] mb-2"
                  >
                    O&ugrave; avez-vous entendu parler de nous ?
                  </label>
                  <select
                    id="heardAboutUs"
                    value={heardAboutUs}
                    onChange={(e) => setHeardAboutUs(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8622C]/30 focus:border-[#E8622C] transition-colors appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      S&eacute;lectionnez une option
                    </option>
                    {SURVEY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {heardAboutUs === "Autre" && (
                  <div>
                    <label
                      htmlFor="otherSource"
                      className="block text-sm font-medium text-[#1a1a1a] mb-2"
                    >
                      Pr&eacute;cisez
                    </label>
                    <input
                      type="text"
                      id="otherSource"
                      value={otherSource}
                      onChange={(e) => setOtherSource(e.target.value)}
                      placeholder="Comment nous avez-vous découvert ?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1a1a] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/30 focus:border-[#E8622C] transition-colors"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || (!isNewPlan && availableSeats <= 0)}
                  className="w-full py-3.5 bg-[#E8622C] text-white font-semibold rounded-xl hover:bg-[#d4561f] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Traitement en cours...
                    </span>
                  ) : !isNewPlan && availableSeats <= 0 ? (
                    "Plan complet"
                  ) : (
                    `Payer ${formatPrice(price)} FCFA`
                  )}
                </button>

                <p className="text-xs text-center text-[#999]">
                  Paiement s&eacute;curis&eacute; via NotchPay. Vous serez redirig&eacute; pour
                  finaliser le paiement.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

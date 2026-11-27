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
      <div className="flex flex-1 items-center justify-center min-h-screen bg-cream">
        <div className="chip bg-white animate-pulse">Chargement...</div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-cream px-4 py-10">
        <div className="w-full max-w-md brut-card p-6 sm:p-8 text-center animate-rise">
          <div className="w-16 h-16 bg-[#bbf7d0] border-2 border-ink rounded-2xl flex items-center justify-center mx-auto mb-5 brut-sm">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#141414"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          {isNewPlan ? (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Paiement re&ccedil;u !</h1>
              <p className="text-muted text-sm mb-6">
                Vous &ecirc;tes maintenant en <span className="font-bold text-brand">liste d&apos;attente</span>.
                D&egrave;s qu&apos;un deuxi&egrave;me membre aura &eacute;galement pay&eacute;, le plan sera cr&eacute;&eacute;
                et votre acc&egrave;s sera activ&eacute;. Vous serez notifi&eacute; par email.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Paiement r&eacute;ussi !</h1>
              <p className="text-muted text-sm mb-6">
                Votre paiement a &eacute;t&eacute; re&ccedil;u avec succ&egrave;s. Vous recevrez un
                email de confirmation sous peu. Votre acc&egrave;s sera activ&eacute; dans les
                prochaines heures.
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn bg-brand text-white w-full sm:w-auto">
              Aller au tableau de bord
            </Link>
            <Link href="/" className="btn bg-white text-ink w-full sm:w-auto">
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
      <div className="flex flex-1 items-center justify-center min-h-screen bg-cream px-4 py-10">
        <div className="w-full max-w-md brut-card p-6 sm:p-8 text-center animate-rise">
          <div className="w-16 h-16 bg-peach border-2 border-ink rounded-2xl flex items-center justify-center mx-auto mb-5 brut-sm">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#141414"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Connexion requise</h1>
          <p className="text-muted text-sm mb-6">
            Vous devez vous connecter avant de proc&eacute;der au paiement.
          </p>
          <Link
            href={`/login?redirect=/checkout/${planId}`}
            className="btn bg-brand text-white w-full sm:w-auto"
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
      <div className="flex flex-1 items-center justify-center min-h-screen bg-cream px-4 py-10">
        <div className="w-full max-w-md brut-card p-6 sm:p-8 text-center animate-rise">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Plan introuvable</h1>
          <p className="text-muted text-sm mb-6">
            Le plan demand&eacute; n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link href="/" className="btn bg-brand text-white w-full sm:w-auto">
            Voir les plans disponibles
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = isNewPlan ? 30 : getDaysRemaining(plan!, now);
  const price = isNewPlan || isRenewal
    ? DEFAULT_PRICING.fullPriceFCFA
    : getProratedPrice(plan!, undefined, now);
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
    <div className="min-h-screen bg-cream">
      <header className="px-4 sm:px-6 pt-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 bg-white brut rounded-full px-3 sm:px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand border-2 border-ink text-white text-lg font-extrabold">
              X
            </span>
            <span className="text-xl font-extrabold tracking-tight text-ink">X-Gen</span>
          </Link>
          <Link href="/" className="chip bg-white hover:bg-peach transition-colors">
            &larr; Retour aux plans
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`chip ${isNewPlan ? "bg-sun" : isRenewal ? "bg-peach" : "bg-white"}`}>
            {isNewPlan ? "Liste d'attente" : isRenewal ? "Renouvellement" : "Nouvel abonnement"}
          </span>
          <span className="chip bg-white">NotchPay</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-tight mb-3">
          {isNewPlan ? "Nouveau plan — Liste d'attente" : isRenewal ? "Renouvellement" : "Paiement"}
        </h1>
        <p className="text-muted text-base mb-8 max-w-2xl">
          {isNewPlan
            ? "Payez maintenant et patientez. Dès qu'un 2e membre paie, le plan est créé et vous bénéficiez de l'accès."
            : isRenewal
              ? "Renouvelez votre abonnement pour continuer à utiliser Claude AI."
              : "Finalisez votre inscription pour rejoindre une équipe Claude AI."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* Summary */}
          <div className="lg:col-span-2 order-first lg:order-last lg:sticky lg:top-6">
            <div className="brut-card p-5 sm:p-6 animate-rise">
              <h2 className="text-xl font-extrabold tracking-tight text-ink mb-4">R&eacute;capitulatif</h2>

              <div className="space-y-3">
                {isNewPlan ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Type</span>
                      <span className="text-sm font-bold text-brand">Nouveau plan</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Dur&eacute;e</span>
                      <span className="text-sm font-bold text-ink">1 mois complet</span>
                    </div>
                    <div className="rounded-2xl border-2 border-ink bg-peach p-3">
                      <p className="text-xs font-medium text-ink">
                        Vous serez plac&eacute; en liste d&apos;attente. Le plan d&eacute;marre d&egrave;s qu&apos;au moins
                        2 personnes ont pay&eacute;.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Plan</span>
                      <span className="text-sm font-bold text-ink truncate">{plan!.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Jours restants</span>
                      <span className="chip bg-sun !text-xs">
                        {daysRemaining} jours ({countdown})
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Places disponibles</span>
                      <span className="text-sm font-bold text-ink">
                        {availableSeats} / {plan!.totalSeats}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-muted shrink-0">P&eacute;riode</span>
                      <span className="text-sm font-medium text-ink text-right">
                        {formatDate(plan!.startDate)} &mdash; {formatDate(plan!.endDate)}
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t-2 border-dashed border-ink/30 my-2" />

                <div className="rounded-2xl border-2 border-ink bg-brand text-white p-4 brut-sm">
                  <span className="text-sm font-bold opacity-90">
                    {isNewPlan || isRenewal ? "Prix" : "Prix proraté"}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formatPrice(price)}
                    </span>
                    <span className="text-base font-bold">FCFA</span>
                  </div>
                </div>

                <p className="text-xs text-muted">
                  {isNewPlan
                    ? "Prix pour un mois complet d'accès à Claude AI Team."
                    : isRenewal
                      ? "Prix pour le prochain cycle complet (1 mois) de Claude AI Team."
                      : `Prix calculé au prorata des ${daysRemaining} jours restants dans le cycle.`}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="brut-card p-5 sm:p-8 animate-rise">
              <h2 className="text-xl font-extrabold tracking-tight text-ink mb-6">Vos informations</h2>

              <form onSubmit={handlePayment} className="space-y-5">
                <div className="rounded-2xl border-2 border-ink bg-cream p-3 sm:p-4 flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-ink shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {user.displayName || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="emailToAdd"
                    className="block text-sm font-bold text-ink mb-2"
                  >
                    Email &agrave; ajouter au plan Claude
                  </label>
                  <input
                    type="email"
                    id="emailToAdd"
                    value={emailToAdd}
                    onChange={(e) => setEmailToAdd(e.target.value)}
                    placeholder="votre-email@exemple.com"
                    className="field"
                    required
                  />
                  <p className="text-xs text-muted mt-2">
                    C&apos;est l&apos;adresse email qui sera ajout&eacute;e &agrave;
                    l&apos;&eacute;quipe Claude AI.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="heardAboutUs"
                    className="block text-sm font-bold text-ink mb-2"
                  >
                    O&ugrave; avez-vous entendu parler de nous ?
                  </label>
                  <div className="relative">
                    <select
                      id="heardAboutUs"
                      value={heardAboutUs}
                      onChange={(e) => setHeardAboutUs(e.target.value)}
                      className="field appearance-none cursor-pointer pr-11"
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
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#141414"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {heardAboutUs === "Autre" && (
                  <div>
                    <label
                      htmlFor="otherSource"
                      className="block text-sm font-bold text-ink mb-2"
                    >
                      Pr&eacute;cisez
                    </label>
                    <input
                      type="text"
                      id="otherSource"
                      value={otherSource}
                      onChange={(e) => setOtherSource(e.target.value)}
                      placeholder="Comment nous avez-vous découvert ?"
                      className="field"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border-2 border-ink bg-red-100 p-3">
                    <p className="text-sm font-medium text-ink">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || (!isNewPlan && !isRenewal && availableSeats <= 0)}
                  className="btn bg-brand text-white w-full text-base"
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
                  ) : !isNewPlan && !isRenewal && availableSeats <= 0 ? (
                    "Plan complet"
                  ) : (
                    `Payer ${formatPrice(price)} FCFA`
                  )}
                </button>

                <p className="text-xs text-center text-muted">
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

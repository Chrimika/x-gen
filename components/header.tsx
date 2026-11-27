"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, MessageCircle, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "w-8 h-8 text-base rounded-lg" : "w-10 h-10 text-xl rounded-xl";
  return (
    <span className="flex items-center gap-2">
      <span
        className={`${box} grid place-items-center bg-brand text-white font-extrabold border-2 border-ink shadow-[2px_2px_0_var(--ink)]`}
      >
        X
      </span>
      <span className={`${size === "sm" ? "text-xl" : "text-2xl"} font-extrabold tracking-tight text-ink`}>
        X-Gen
      </span>
    </span>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Header() {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[72px] gap-3">
          <Link href="/" aria-label="Accueil X-Gen">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-1 font-semibold">
            <Link href="/#plans" className="px-4 py-2 rounded-full hover:bg-peach transition-colors">
              Plans
            </Link>
            <Link href="/#create" className="px-4 py-2 rounded-full hover:bg-peach transition-colors">
              Cr&eacute;er un plan
            </Link>
            {isAdmin && (
              <Link href="/myspace" className="px-4 py-2 rounded-full hover:bg-peach transition-colors">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://chat.whatsapp.com/JcN64bbs3bYAfdi9EcqoMf"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Groupe WhatsApp"
              className="btn !p-0 w-11 h-11 bg-[#25D366] text-ink !shadow-[3px_3px_0_var(--ink)]"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            </a>

            {loading ? (
              <div className="w-28 h-11 rounded-full border-2 border-ink bg-white animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="btn !py-2 !px-2 sm:!pr-4 bg-brand text-white !shadow-[3px_3px_0_var(--ink)]"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-ink"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <LayoutDashboard className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Mon espace</span>
                </Link>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  className="btn !p-0 w-11 h-11 bg-white text-ink !shadow-[3px_3px_0_var(--ink)]"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="btn !py-2.5 !px-5 bg-brand text-white !shadow-[3px_3px_0_var(--ink)]"
              >
                <span className="grid place-items-center w-5 h-5 rounded-full bg-white">
                  <GoogleIcon className="w-3.5 h-3.5" />
                </span>
                Connexion
              </button>
            )}
          </div>
        </div>

        {menuOpen && user && (
          <div className="brut-card !rounded-3xl p-3 mb-3 animate-rise">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="text-sm text-muted truncate">{user.displayName || user.email}</span>
            </div>
            <div className="grid gap-1 font-semibold">
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl hover:bg-peach">
                <LayoutDashboard className="w-4 h-4" /> Mon espace
              </Link>
              <Link href="/#plans" onClick={() => setMenuOpen(false)} className="md:hidden px-3 py-2.5 rounded-2xl hover:bg-peach">
                Plans
              </Link>
              <Link href="/#create" onClick={() => setMenuOpen(false)} className="md:hidden px-3 py-2.5 rounded-2xl hover:bg-peach">
                Cr&eacute;er un plan
              </Link>
              {isAdmin && (
                <Link href="/myspace" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl hover:bg-peach">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> D&eacute;connexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

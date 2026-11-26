"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/** Pixel-art orange robot SVG (32x32) used as the X-Gen brand mark. */
function RobotLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antenna */}
      <rect x="15" y="1" width="2" height="4" rx="1" fill="#E8622C" />
      <circle cx="16" cy="1" r="1.5" fill="#E8622C" />
      {/* Head */}
      <rect x="8" y="5" width="16" height="12" rx="3" fill="#E8622C" />
      {/* Eyes */}
      <rect x="11" y="9" width="3" height="3" rx="1" fill="white" />
      <rect x="18" y="9" width="3" height="3" rx="1" fill="white" />
      {/* Pupils */}
      <rect x="12" y="10" width="1.5" height="1.5" rx="0.5" fill="#1a1a1a" />
      <rect x="19" y="10" width="1.5" height="1.5" rx="0.5" fill="#1a1a1a" />
      {/* Mouth */}
      <rect x="12" y="14" width="8" height="1.5" rx="0.75" fill="white" />
      {/* Body */}
      <rect x="10" y="18" width="12" height="8" rx="2" fill="#E8622C" />
      {/* Body detail */}
      <rect x="14" y="20" width="4" height="4" rx="1" fill="white" opacity="0.4" />
      {/* Arms */}
      <rect x="6" y="19" width="3" height="6" rx="1.5" fill="#E8622C" />
      <rect x="23" y="19" width="3" height="6" rx="1.5" fill="#E8622C" />
      {/* Legs */}
      <rect x="12" y="26" width="3" height="4" rx="1" fill="#E8622C" />
      <rect x="17" y="26" width="3" height="4" rx="1" fill="#E8622C" />
      {/* Feet */}
      <rect x="11" y="29" width="5" height="2" rx="1" fill="#d4561f" />
      <rect x="16" y="29" width="5" height="2" rx="1" fill="#d4561f" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Header() {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Plans", href: "/#plans" },
    ...(user ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    ...(isAdmin ? [{ label: "Admin", href: "/myspace" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <RobotLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold text-[#1a1a1a]">
              X-Gen
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-[#666] hover:text-[#1a1a1a] hover:bg-gray-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth button (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-full border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-sm text-[#666] max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#666] hover:text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">D&eacute;connexion</span>
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              >
                <GoogleIcon />
                Connexion
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#666] hover:text-[#1a1a1a] hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-[#666] hover:text-[#1a1a1a] hover:bg-gray-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 px-4 border-t border-gray-100 mt-2">
              {loading ? (
                <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-7 h-7 rounded-full border border-gray-200"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="text-sm text-[#666] truncate">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    D&eacute;connexion
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    signIn();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <GoogleIcon />
                  Connexion avec Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

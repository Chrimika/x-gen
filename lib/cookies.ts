"use client";

/**
 * Sets auth cookies after successful Firebase login.
 * These are read by proxy.ts (Next.js 16 proxy) for route protection.
 */
export function setAuthCookies(isAdmin: boolean = false) {
  // Set auth cookie (expires in 30 days)
  document.cookie = `xgen-auth=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

  if (isAdmin) {
    document.cookie = `xgen-admin=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }
}

/**
 * Clears auth cookies on logout.
 */
export function clearAuthCookies() {
  document.cookie = "xgen-auth=; path=/; max-age=0";
  document.cookie = "xgen-admin=; path=/; max-age=0";
}

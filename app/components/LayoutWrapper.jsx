"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Folder is "sitewide", not "site": .gitignore ignores every **/site/ directory
import SiteHeader from "./sitewide/SiteHeader";
import SiteFooter from "./sitewide/SiteFooter";
import MobileTabBar from "./sitewide/MobileTabBar";

export default function LayoutWrapper({ children, directory }) {

  const pathname = usePathname();

  // Invite links (mmmiles.com/?ref=CODE): remember the code for 30 days; the login API links a
  // brand-new account to the friend who invited it (see lib/referrals.js)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Za-z0-9]{6,12}$/.test(ref)) {
      document.cookie = `mm_ref=${ref.toUpperCase()}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`;
    }
  }, [pathname]);

  const hideNavbar =
    pathname.startsWith("/host-registration") ||
    pathname.startsWith("/host-registration-form");

  const hideFooter =

    pathname.startsWith("/dashboard");

  return (
    <>
      {!hideNavbar && <SiteHeader />}

      {children}

      {!hideFooter && <SiteFooter directory={directory} />}

      <MobileTabBar />
    </>
  );
}

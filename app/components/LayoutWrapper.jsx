"use client";

import { usePathname } from "next/navigation";

// Folder is "sitewide", not "site": .gitignore ignores every **/site/ directory
import SiteHeader from "./sitewide/SiteHeader";
import SiteFooter from "./sitewide/SiteFooter";
import MobileTabBar from "./sitewide/MobileTabBar";

export default function LayoutWrapper({ children }) {

  const pathname = usePathname();

  const hideNavbar =
    pathname.startsWith("/host-registration") ||
    pathname.startsWith("/host-registration-form");

  const hideFooter =

    pathname.startsWith("/dashboard");

  return (
    <>
      {!hideNavbar && <SiteHeader />}

      {children}

      {!hideFooter && <SiteFooter />}

      <MobileTabBar />
    </>
  );
}

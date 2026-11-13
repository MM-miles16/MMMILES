"use client";
import { useEffect, useState } from "react";

// Shared login state for the header and the mobile tab bar: one /api/auth/session
// request per page load, refreshed when login/logout fire "auth-change".
let current = null; // Promise<boolean>
const subscribers = new Set();
let wired = false;

function refreshSession() {
  current = fetch("/api/auth/session")
    .then((res) => (res.ok ? res.json() : { authenticated: false }))
    .then((data) => !!data.authenticated)
    .catch(() => false);
  current.then((loggedIn) => subscribers.forEach((set) => set(loggedIn)));
  return current;
}

export function useSession() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    subscribers.add(setLoggedIn);
    (current || refreshSession()).then(setLoggedIn);
    if (!wired) {
      wired = true;
      window.addEventListener("auth-change", refreshSession);
      window.addEventListener("storage", refreshSession);
    }
    return () => subscribers.delete(setLoggedIn);
  }, []);

  return loggedIn;
}

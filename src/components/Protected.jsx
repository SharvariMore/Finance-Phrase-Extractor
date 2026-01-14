import React from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export default function Protected({ children }) {
  // ✅ Cypress + optional env bypass for E2E
  const isCypress = typeof window !== "undefined" && !!window.Cypress;
  const bypassAuth =
    isCypress || process.env.REACT_APP_E2E_BYPASS_AUTH === "true";

  if (bypassAuth) return <>{children}</>;

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

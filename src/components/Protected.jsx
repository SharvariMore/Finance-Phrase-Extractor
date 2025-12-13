import React from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export default function Protected({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

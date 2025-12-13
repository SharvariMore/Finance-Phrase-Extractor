import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-white text-emerald-700 shadow-md"
        : "text-white/90 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">

          {/* Top Row */}
          <div className="flex items-center justify-between">
            {/* App Name */}
            <div className="text-white font-bold text-2xl drop-shadow-sm">
              Finance Phrase Extractor
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/history" className={linkClass}>
                History
              </NavLink>
              <NavLink to="/analytics" className={linkClass}>
                Analytics
              </NavLink>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-md text-sm">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-md text-sm font-semibold">
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-white focus:outline-none"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {open && (
            <div className="md:hidden mt-4 rounded-xl bg-emerald-700/95 shadow-lg p-4 space-y-2">
              <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/history" className={linkClass} onClick={() => setOpen(false)}>
                History
              </NavLink>
              <NavLink to="/analytics" className={linkClass} onClick={() => setOpen(false)}>
                Analytics
              </NavLink>

              <div className="border-t border-white/20 pt-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      onClick={() => setOpen(false)}
                      className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-white/10"
                    >
                      Sign in
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button
                      onClick={() => setOpen(false)}
                      className="block w-full text-left px-3 py-2 rounded-md bg-white text-emerald-700 font-semibold"
                    >
                      Sign up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserButton afterSignOutUrl="/" />
                    <span className="text-white text-sm">Account</span>
                  </div>
                </SignedIn>
              </div>
            </div>
          )}

        </div>
      </nav>
    </header>
  );
}

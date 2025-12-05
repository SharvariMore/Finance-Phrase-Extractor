import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path) =>
    `px-4 py-2 rounded-md font-semibold transition ${
      location.pathname === path
        ? "bg-white text-emerald-700 shadow"
        : "text-white hover:bg-emerald-600/40"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="text-2xl font-bold text-white drop-shadow-sm">
          Finance Phrase Extraction
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4">
          <Link to="/" className={linkClass("/")}>
            Home
          </Link>

          <Link to="/history" className={linkClass("/history")}>
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}

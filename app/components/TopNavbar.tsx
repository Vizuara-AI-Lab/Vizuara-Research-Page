// app/components/TopNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { label: "Overview", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Research Areas", href: "/research-areas" },
  { label: "Impact", href: "/impact" },
  { label: "Publications", href: "/publications" },
  { label: "Junior Research", href: "/junior-research" },
  { label: "Bootcamps", href: "/bootcamps" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logOut } = useAuth();
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-300 z-50">
      <div className="h-full mx-auto w-full max-w-7xl px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Vizuara Logo" className="h-10" />
          <span className="text-xl font-normal text-gray-900">
            Vizuara AI Labs
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-6">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-sm transition-colors ${
                      active
                        ? "text-[#2596be]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop Auth Button */}
          {user ? (
            <button
              onClick={logOut}
              className="ml-4 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(300 100% 50%), hsl(198 75% 52%))",
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="ml-4 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(300 100% 50%), hsl(198 75% 52%))",
              }}
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 border border-gray-300 rounded hover:bg-gray-50"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={open ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden border-t border-gray-200 bg-white overflow-hidden transition-[max-height] duration-200 ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-2 py-2 text-sm ${
                  active
                    ? "text-[#2596be]"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          
          {/* Mobile Auth Button */}
          {user ? (
            <button
              onClick={() => {
                logOut();
                setOpen(false);
              }}
              className="mt-2 w-full px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{
                background: "linear-gradient(135deg, hsl(300 100% 50%), hsl(198 75% 52%))",
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                router.push("/auth");
                setOpen(false);
              }}
              className="mt-2 w-full px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{
                background: "linear-gradient(135deg, hsl(300 100% 50%), hsl(198 75% 52%))",
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
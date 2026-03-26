import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DemoBanner } from "@/features/auth/components/DemoBanner";
import { useEntriesData } from "@/hooks/useEntriesData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/entries", label: "Entries", icon: "📝" },
  { to: "/practice", label: "Practice", icon: "🎯" },
  { to: "/about", label: "About", icon: "ℹ️" },
];

const APPS = [
  {
    name: "FlashMinds",
    desc: "Collections & flashcards",
    href: "https://flashcards.learnapp.pro",
    current: false,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    name: "LearnFast",
    desc: "90-second method",
    href: "https://phrases.learnapp.pro",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#7c3aed",
  },
  {
    name: "Tracker",
    desc: "Progress & vocabulary",
    href: "https://tracker.learnapp.pro",
    current: true,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
] as const;

export function Layout() {
  const { isAuthenticated, mode, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [appsOpen, setAppsOpen] = useState(false);

  useEffect(() => {
    if (!appsOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("apps-dropdown-root");
      if (el && !el.contains(e.target as Node)) setAppsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [appsOpen]);

  // Orchestrate data source — populates useEntriesStore based on auth mode
  useEntriesData();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="sm:hidden text-xl font-bold text-indigo-600">LP</span>
          <span className="hidden sm:inline text-xl font-bold text-indigo-600 tracking-tight">Language Progress</span>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  [
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  ].join(" ")
                }>
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div id="apps-dropdown-root" className="relative">
            <button
              onClick={() => setAppsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-colors ${
                appsOpen
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="5" height="5" rx="1.5" />
                <rect x="10" y="1" width="5" height="5" rx="1.5" />
                <rect x="1" y="10" width="5" height="5" rx="1.5" />
                <rect x="10" y="10" width="5" height="5" rx="1.5" />
              </svg>
              <span className="hidden sm:inline">Apps</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="hidden sm:block"
                style={{ transform: appsOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <path d="M2 3l3 3 3-3" />
              </svg>
            </button>

            {appsOpen && (
              <div className="absolute right-0 top-10 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                  learnapp.pro — all tools
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {APPS.map((app) =>
                    app.current ? (
                      <div
                        key={app.name}
                        className="flex flex-col gap-1 p-2.5 rounded-xl border-2 border-green-500 bg-green-50 cursor-default">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                          style={{ background: app.iconBg }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8M12 17v4" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-green-800">{app.name}</span>
                        <span className="text-xs text-green-500 leading-tight">{app.desc}</span>
                        <span className="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5 w-fit mt-0.5">
                          current
                        </span>
                      </div>
                    ) : (
                      <a
                        key={app.name}
                        href={app.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors no-underline cursor-pointer">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                          style={{ background: app.iconBg }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8M12 17v4" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{app.name}</span>
                        <span className="text-xs text-gray-400 leading-tight">{app.desc}</span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3 ml-3">
              {mode === "authenticated" && user?.name && (
                <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[120px]">{user.name}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                {mode === "demo" ? "Exit demo" : "Logout"}
              </button>
            </div>
          )}
        </div>
      </header>

      <DemoBanner />

      <main className="flex-1 py-2 max-w-5xl w-full mx-auto px-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        Language Progress — keep learning every day
      </footer>
    </div>
  );
}

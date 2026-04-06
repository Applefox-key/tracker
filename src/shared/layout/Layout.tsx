import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DemoBanner } from "@/features/auth/components/DemoBanner";
import { DarkModeToggle } from "@/shared/ui/DarkModeToggle";
import { useEntriesData } from "@/hooks/useEntriesData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊", mobileLabel: true },
  { to: "/entries", label: "Entries", icon: "📝", mobileLabel: true },
  { to: "/practice", label: "Practice", icon: "🎯", mobileLabel: true },
  { to: "/tags", label: "Tags", icon: "🏷️", mobileLabel: false },
  { to: "/about", label: "About", icon: "ℹ️", mobileLabel: false },
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
    name: "Phrasely",
    desc: "90-second method",
    href: "https://phrasely.learnapp.pro",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#0d9488",
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
  const [burgerOpen, setBurgerOpen] = useState(false);

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

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-1.5 px-1 text-lg sm:px-3 py-2 rounded-lg sm:text-sm font-medium transition-colors",
      isActive
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
    ].join(" ");

  const mobileNavLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
      isActive
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
    ].join(" ");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        {/* ── Row 1: logo | nav (desktop) | right controls ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {/* Burger — mobile only */}
            <button
              onClick={() => setBurgerOpen((v) => !v)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Menu">
              {burgerOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            <span className="inline text-xl font-bold text-emerald-600 tracking-tight">Language Progress</span>
          </div>

          {/* Nav — desktop only in row 1 */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end className={navLinkCls}>
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex justify-end items-center gap-1">
            <DarkModeToggle />

            <div id="apps-dropdown-root" className="relative">
              <button
                onClick={() => setAppsOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-colors ${
                  appsOpen
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
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
                <div className="fixed right-4 sm:absolute sm:right-0 top-[68px] sm:top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                    learnapp.pro — all tools
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {APPS.map((app) =>
                      app.current ? (
                        <div
                          key={app.name}
                          className="flex flex-col gap-1 p-2.5 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-green-800 dark:text-green-400">{app.name}</span>
                          <span className="text-xs text-green-500 dark:text-green-500 leading-tight">{app.desc}</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-1.5 py-0.5 w-fit mt-0.5">
                            current
                          </span>
                        </div>
                      ) : (
                        <a
                          key={app.name}
                          href={app.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors no-underline cursor-pointer">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{app.desc}</span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2 ml-1">
                {mode === "authenticated" && user?.name && (
                  <Link to="/profile" title="Profile">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-emerald-400 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </Link>
                )}
                {/* Logout — desktop only in row 1 */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  {mode === "demo" ? "Exit demo" : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: mobile only — nav links + logout ── */}
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-700/60">
          <div className="max-w-5xl mx-auto px-2 flex items-center justify-between h-11">
            <nav className="flex items-center gap-0.5">
              {navItems
                .filter((el) => el.mobileLabel)
                .map(({ to, label, icon, mobileLabel }) => (
                  <NavLink key={to} to={to} end className={mobileNavLinkCls}>
                    <span>{icon}</span>
                    {mobileLabel && <span>{label}</span>}
                  </NavLink>
                ))}
            </nav>
            <div className="flex">
              <NavLink key={""} to={"/about"} end className={mobileNavLinkCls}>
                <span>{"ℹ️"}</span>
              </NavLink>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  title={mode === "demo" ? "Exit demo" : "Logout"}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              )}{" "}
            </div>
          </div>
        </div>
      </header>

      {/* ── Burger menu overlay — mobile only ── */}
      {burgerOpen && (
        <>
          {/* backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-20 bg-black/40"
            onClick={() => setBurgerOpen(false)}
          />
          {/* drawer */}
          <div className="sm:hidden fixed top-0 left-0 bottom-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <span className="text-base font-bold text-emerald-600">Language Progress</span>
              <button
                onClick={() => setBurgerOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setBurgerOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    ].join(" ")
                  }>
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            {isAuthenticated && (
              <div className="px-3 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
                <button
                  onClick={() => { setBurgerOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {mode === "demo" ? "Exit demo" : "Logout"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <DemoBanner />

      <main className="flex-1 py-2 max-w-5xl w-full mx-auto px-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Language Progress — keep learning every day
      </footer>
    </div>
  );
}

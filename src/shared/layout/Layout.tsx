import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DemoBanner } from "@/features/auth/components/DemoBanner";
import { DarkModeToggle } from "@/shared/ui/DarkModeToggle";
import { useEntriesData } from "@/hooks/useEntriesData";
import { getAvatarUrl } from "@/api/api";
import { ImStatsBars } from "react-icons/im";
import { PiCardsThree } from "react-icons/pi";
import { TbTargetArrow } from "react-icons/tb";
import { IoPricetagsOutline } from "react-icons/io5";
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <ImStatsBars /> },
  { to: "/entries", label: "Entries", icon: <PiCardsThree /> },
  { to: "/practice", label: "Practice", icon: <TbTargetArrow /> },
  { to: "/tags", label: "Tags", icon: <IoPricetagsOutline /> },
  { to: "/about", label: "About", icon: "ℹ️" },
];

const APPS = [
  {
    name: "FlashMinds",
    desc: "Collections & flashcards",
    href: "https://flashcards.learnypie.com",
    current: false,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    name: "Phrasely",
    desc: "90-second method",
    href: "https://phrasely.learnypie.com",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#0d9488",
  },
  {
    name: "Tracker",
    desc: "Progress & vocabulary",
    href: "https://tracker.learnypie.com",
    current: true,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
] as const;

export function Layout() {
  const { isAuthenticated, mode, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isGameRoute = ["/flashcards", "/practice/quiz", "/practice/match", "/practice/puzzle"].includes(
    location.pathname,
  );
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

  useEntriesData();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
    ].join(" ");

  const bottomNavLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium transition-colors min-w-[52px]",
      isActive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
    ].join(" ");

  const AppCard = ({ app }: { app: (typeof APPS)[number] }) =>
    app.current ? (
      <div className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: app.iconBg }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-green-800 dark:text-green-400">{app.name}</p>
          <p className="text-xs text-green-500 leading-tight truncate">{app.desc}</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-1.5 py-0.5 shrink-0">
          now
        </span>
      </div>
    ) : (
      <a
        href={app.href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors no-underline">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: app.iconBg }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight truncate">{app.desc}</p>
        </div>
      </a>
    );

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10${isGameRoute ? " hidden sm:block" : ""}`}>
        {/* ── Row 1 ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative flex items-center justify-between h-16">
          {/* Left: burger (mobile) | logo (desktop) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBurgerOpen((v) => !v)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Menu">
              {burgerOpen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            {/* Logo - desktop only */}
            <span className="hidden sm:inline text-xl font-bold text-emerald-600 tracking-tight">
              Language Progress
            </span>
          </div>

          {/* Title - mobile only, absolutely centered */}
          <span className="sm:hidden absolute left-1/2 -translate-x-1/2 text-xl font-bold text-emerald-600 tracking-tight whitespace-nowrap pointer-events-none">
            Language Progress
          </span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end className={navLinkCls}>
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle - desktop only; on mobile it lives inside the burger menu */}
            <div className="hidden sm:block">
              <DarkModeToggle />
            </div>

            {/* Apps dropdown - desktop only */}
            <div id="apps-dropdown-root" className="relative hidden sm:block">
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
                <span>Apps</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ transform: appsOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M2 3l3 3 3-3" />
                </svg>
              </button>
              {appsOpen && (
                <div className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                    learnypie.com — all tools
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
              <div className="flex items-center gap-1 ml-1">
                {mode === "authenticated" && user?.name && (
                  <Link to="/profile" title="Profile">
                    {user?.img ? (
                      <img
                        src={getAvatarUrl(user.img, user.id) ?? undefined}
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
                {/* Logout - desktop only */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  {mode === "demo" ? "Exit demo" : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Burger menu overlay — mobile only ── */}
      {!isGameRoute && burgerOpen && (
        <>
          <div className="sm:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setBurgerOpen(false)} />
          <div className="sm:hidden fixed top-0 left-0 bottom-0 z-30 w-72 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <span className="text-base font-bold text-emerald-600">Language Progress</span>
              <button
                onClick={() => setBurgerOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
              {/* Theme toggle */}
              <div className="flex items-center justify-between px-3 py-2 mb-1 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <DarkModeToggle />
              </div>

              {/* Nav items */}
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

              {/* Apps section */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  learnypie.com — all tools
                </p>
                <div className="flex flex-col gap-1.5">
                  {APPS.map((app) => (
                    <AppCard key={app.name} app={app} />
                  ))}
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="px-3 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
                <button
                  onClick={() => {
                    setBurgerOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
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

      <main
        className={`flex-1 py-2 max-w-5xl w-full mx-auto px-4 sm:px-6 sm:py-8 sm:pb-0${isGameRoute ? "" : " pb-20"}`}>
        <Outlet />
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden sm:block border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Language Progress — keep learning every day
      </footer>

      {/* ── Bottom navigation bar — mobile only ── */}
      <nav
        className={`${isGameRoute ? "hidden" : "sm:hidden"} fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-around h-14 px-1">
          {navItems
            .filter(({ to }) => to !== "/tags" && to !== "/about")
            .map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end className={bottomNavLinkCls}>
                <span className="text-xl leading-none">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
        </div>
      </nav>
    </div>
  );
}

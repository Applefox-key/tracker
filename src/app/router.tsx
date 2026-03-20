import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/shared/layout/Layout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DashboardPage } from "@/pages/DashboardPage";
import { EntriesPage } from "@/pages/EntriesPage";
import { FlashcardsPage } from "@/pages/FlashcardsPage";
import { AboutPage } from "@/pages/AboutPage";
import { LoginPage } from "@/pages/LoginPage";

/** Redirects / → /dashboard (authenticated) or /about (guest) */
function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? "/dashboard" : "/about"} replace />;
}

export const router = createBrowserRouter([
  // Public — no layout wrapper
  { path: "/login", element: <LoginPage /> },

  // App shell (shared Layout)
  {
    path: "/",
    element: <Layout />,
    children: [
      // Root: smart redirect based on auth state
      { index: true, element: <RootRedirect /> },

      // Public
      { path: "about", element: <AboutPage /> },

      // Protected
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "entries", element: <EntriesPage /> },
          { path: "flashcards", element: <FlashcardsPage /> },
        ],
      },
    ],
  },
]);

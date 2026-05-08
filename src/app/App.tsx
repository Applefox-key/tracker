import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { useAuthStore } from "@/features/auth/store/authStore";
import { authApi } from "@/api/api";
import { TOKEN_KEY } from "@/api/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx errors (auth failures, not-found, etc.)
      retry: (failureCount, error) => {
        if (error instanceof Error && /4\d\d/.test(error.message)) return false;
        return failureCount < 2;
      },
    },
  },
});

export function App() {
  useEffect(() => {
    const { mode, setInitializing } = useAuthStore.getState();

    // Google OAuth callback: server appends ?token=<jwt> to the redirect URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get("token");
    if (oauthToken) {
      localStorage.setItem(TOKEN_KEY, oauthToken);
      localStorage.setItem("Auth", "true");
      window.history.replaceState({}, "", window.location.pathname);
      authApi
        .getUser()
        .then((user) => {
          if (!user?.id || !user?.email) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.setItem("Auth", "false");
            return;
          }
          useAuthStore.setState({ mode: "authenticated", isAuthenticated: true, user });
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.setItem("Auth", "false");
        })
        .finally(() => setInitializing(false));
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (mode === "demo") {
      // Demo mode has no server session — nothing to fetch.
      setInitializing(false);
      return;
    }

    if (token && mode === "authenticated") {
      // Already authenticated: let the app open immediately with cached data,
      // then refresh user in the background so avatar/profile stay up to date.
      setInitializing(false);
      authApi
        .getUser()
        .then((user) => {
          if (!user?.id && !user?.email) return;
          useAuthStore.setState({ user });
        })
        .catch(() => {});
      return;
    }

    // No token or unauthenticated: try JWT or cookie session.
    authApi
      .getUser()
      .then((user) => {
        if (!user?.id && !user?.email) return;
        useAuthStore.setState({ mode: "authenticated", isAuthenticated: true, user });
      })
      .catch(() => {
        // No valid session — stay unauthenticated
      })
      .finally(() => setInitializing(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

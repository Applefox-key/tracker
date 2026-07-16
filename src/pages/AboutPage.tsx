import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/store/authStore";

const FEATURE_KEYS = [
  { icon: "📝", key: "entries" },
  { icon: "🎯", key: "practice" },
  { icon: "📊", key: "stats" },
] as const;

export function AboutPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex flex-col gap-2 sm:gap-10 lg:gap-10 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("about.heroTitle")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
          {t("about.heroSubtitle")}
        </p>
      </div>

      {!isAuthenticated && (
        <div className="flex flex-col items-center gap-2 py-4 px-6 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{t("about.readyPrompt")}</p>
          <Link
            to="/login"
            className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
            {t("about.signIn")}
          </Link>
        </div>
      )}

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Features */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t("about.featuresTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURE_KEYS.map(({ icon, key }) => (
            <div
              key={key}
              className="flex flex-col gap-2 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <span className="hidden sm:block text-2xl">{icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                <span className="inline-block sm:hidden text-2xl">{icon}</span> {t(`about.features.${key}.title`)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t(`about.features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* About the app */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t("about.aboutTitle")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {t("about.aboutText")}
        </p>
      </section>
    </div>
  );
}

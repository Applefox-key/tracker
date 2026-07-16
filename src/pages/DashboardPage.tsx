import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { Entry, EntryCategory } from "@/features/entries/types";
import { FaPlus } from "react-icons/fa6";

// ── Helpers ───────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Category config ───────────────────────────────────────────────────────

const CATEGORY_STYLES: Array<{
  key: EntryCategory;
  color: string;
  colorWrap: string;
  mobileClasses: string;
}> = [
  {
    key: "word",
    color: "bg-blue-500",
    colorWrap: "bg-blue-200",
    mobileClasses: "max-sm:bg-blue-200 max-sm:border-l-2 max-sm:border-blue-500",
  },
  {
    key: "phrase",
    color: "bg-green-500",
    colorWrap: "bg-green-200",
    mobileClasses: "max-sm:bg-green-200 max-sm:border-l-2 max-sm:border-green-500",
  },
  {
    key: "grammar",
    color: "bg-purple-500",
    colorWrap: "bg-purple-200",
    mobileClasses: "max-sm:bg-purple-200 max-sm:border-l-2 max-sm:border-purple-500",
  },
  {
    key: "idiom",
    color: "bg-orange-500",
    colorWrap: "bg-orange-200",
    mobileClasses: "max-sm:bg-orange-200 max-sm:border-l-2 max-sm:border-orange-500",
  },
  {
    key: "note",
    color: "bg-teal-500",
    colorWrap: "bg-teal-200",
    mobileClasses: "max-sm:bg-teal-200 max-sm:border-l-2 max-sm:border-teal-500",
  },
];

// ── Weekly activity chip ──────────────────────────────────────────────────

function WeeklyActivityChip({ entries }: { entries: Entry[] }) {
  const { t } = useTranslation();

  const { days, streak } = useMemo(() => {
    const arr = Array.from({ length: 7 }, (_, i) => {
      const from = daysAgo(6 - i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return entries.filter((e) => {
        const time = new Date(e.createdAt).getTime();
        return time >= from.getTime() && time < to.getTime();
      }).length;
    });

    let s = 0;
    for (let i = 6; i >= 0; i--) {
      if (arr[i] > 0) s++;
      else if (i === 6) continue;
      else break;
    }

    return { days: arr, streak: s };
  }, [entries]);

  const max = Math.max(...days, 1);

  const streakMsg =
    streak === 0
      ? null
      : streak === 1
        ? t("dashboard.streak1")
        : streak >= 7
          ? t("dashboard.streakLegendary", { count: streak })
          : t("dashboard.streakKeepUp", { count: streak });

  return (
    <div className=" flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm">
      <div className="flex-1 min-w-0">
        {streakMsg ? (
          <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 truncate">{streakMsg}</p>
        ) : (
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
            {t("dashboard.noStreak")}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          <span className="text-gray-900 dark:text-white font-bold">{entries.length}</span>{" "}
          {t("dashboard.totalEntriesLabel", { count: entries.length })}
        </p>
      </div>
      <div className="flex flex-col gap-[3px] shrink-0">
        <div className="flex items-end gap-[3px] h-8">
          {days.map((count, i) => {
            const heightPct = count > 0 ? Math.max((count / max) * 100, 22) : 0;
            return (
              <div
                key={i}
                className={`w-3 rounded-lg transition-all duration-300 ${count > 0 ? "bg-emerald-400 dark:bg-emerald-400" : "bg-gray-300 dark:bg-gray-600/40"}`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
        <div className="flex gap-[3px]">
          {days.map((count, i) => (
            <div key={i} className="w-3 flex justify-center">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i === 6
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : count > 0
                      ? "bg-emerald-400 dark:bg-emerald-400"
                      : "bg-gray-300 dark:bg-gray-600/40"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
  to?: string;
  toState?: object;
}

function StatCard({ label, value, color, sub, to, toState }: StatCardProps) {
  const card = (
    <Card
      padding="sm"
      className={`max-sm:p-1 h-full sm:p-6 flex flex-col items-center gap-0.5 sm:gap-1 min-w-0${to ? " hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
      <p className={`text-xl sm:text-3xl font-extrabold ${color} truncate`}>{value}</p>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-tight text-center">
        {label}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">{sub}</p>}
    </Card>
  );
  if (to)
    return (
      <Link to={to} state={toState} className="block">
        {card}
      </Link>
    );
  return card;
}

interface CategoryRowProps {
  label: string;
  count: number;
  total: number;
  barColor: string;
  colorWrap: string;
  mobileClasses: string;
}

function CategoryRow({ label, count, total, barColor, mobileClasses }: CategoryRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={`flex flex-col gap-0.5 sm:gap-1.5 rounded-xl max-sm:px-2 max-sm:py-1.5  max-sm:min-w-[60px] ${mobileClasses}`}>
      <div className="flex items-center justify-between text-xs sm:text-sm flex-col sm:flex-row">
        <span className="font-medium text-gray-700 dark:text-gray-300 max-sm:dark:text-gray-800">{label}</span>
        <span className="text-gray-400 dark:text-gray-500 max-sm:dark:text-gray-700 tabular-nums">
          {count} <span className="text-gray-300 dark:text-gray-600 max-sm:dark:text-gray-500">·</span> {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { t } = useTranslation();
  const entries = useEntriesStore((s) => s.entries);

  const stats = useMemo(() => {
    const today = startOfToday();
    const weekStart = daysAgo(7);

    const todayCount = entries.filter((e) => new Date(e.createdAt) >= today).length;
    const weekCount = entries.filter((e) => new Date(e.createdAt) >= weekStart).length;
    const flashCount = entries.filter((e) => e.includeInPractice).length;
    const avgRating =
      entries.length > 0 ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1) : "—";

    return { todayCount, weekCount, flashCount, avgRating };
  }, [entries]);

  const categoryCounts = useMemo(() => {
    return entries.reduce<Partial<Record<EntryCategory, number>>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  const recentEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [entries],
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      {/* ── Title row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden sm:block text-2xl font-bold text-gray-900 dark:text-gray-100">{t("dashboard.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">{t("dashboard.subtitle")}</p>
        </div>
        {/* Quick actions — desktop */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <Link to="/entries" state={{ openCreateForm: true }}>
            <Button>{t("dashboard.addEntry")}</Button>
          </Link>
          <Link to="/entries">
            <Button variant="secondary">{t("dashboard.browseEntries")}</Button>
          </Link>
          <Link to="/practice">
            <Button variant="secondary">{t("dashboard.practice")}</Button>
          </Link>
        </div>
      </div>
      {/* ── Weekly activity chip ── */}
      <WeeklyActivityChip entries={entries} />
      {/* ── Stats — mobile (3-col grid) ── */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <StatCard label={t("dashboard.statTotal")} value={entries.length} color="text-emerald-600" to="/entries" />
        <StatCard
          label={t("dashboard.statToday")}
          value={stats.todayCount}
          color="text-emerald-600"
          to="/entries"
          toState={{ dateFilter: "today" }}
        />
        <StatCard
          label={t("dashboard.statWeek")}
          value={stats.weekCount}
          color="text-cyan-600"
          to="/entries"
          toState={{ dateFilter: "week" }}
        />
      </div>
      {/* ── Stats — desktop grid ── */}
      <div className="hidden sm:grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <StatCard label={t("dashboard.statTotal")} value={entries.length} color="text-blue-600" to="/entries" />
        <StatCard
          label={t("dashboard.statToday")}
          value={stats.todayCount}
          color="text-green-600"
          to="/entries"
          toState={{ dateFilter: "today" }}
        />
        <StatCard
          label={t("dashboard.statWeek")}
          value={stats.weekCount}
          color="text-cyan-600"
          to="/entries"
          toState={{ dateFilter: "week" }}
          sub={t("dashboard.statWeekSub")}
        />
        <StatCard label={t("dashboard.statPractice")} value={stats.flashCount} color="text-violet-600" to="/practice" />
        <StatCard label={t("dashboard.statAvgRating")} value={stats.avgRating} color="text-amber-500" to="/practice" sub={t("dashboard.statAvgRatingSub")} />
      </div>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-start">
        {/* ── Category distribution ── */}
        <Card className="sm:flex-1 max-sm:px-1 max-sm:py-2">
          <CardHeader className={`hidden sm:block mb-2 sm:mb-4`}>
            <CardTitle className="text-sm sm:text-lg">{t("dashboard.categoryDistribution")}</CardTitle>
          </CardHeader>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noEntries")}</p>
          ) : (
            <div className="flex flex-row sm:flex-col gap-1 sm:gap-4 flex-wrap sm:flex-nowrap max-sm:justify-between">
              {CATEGORY_STYLES.map(({ key, color, colorWrap, mobileClasses }) => (
                <Link
                  key={key}
                  to="/entries"
                  state={{ categoryFilter: key }}
                  className="block rounded-xl hover:opacity-80 transition-opacity">
                  <CategoryRow
                    label={t(`dashboard.categories.${key}`)}
                    count={categoryCounts[key] ?? 0}
                    total={entries.length}
                    barColor={color}
                    colorWrap={colorWrap}
                    mobileClasses={mobileClasses}
                  />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* ── Recent entries ── */}
        <Card className="sm:flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("dashboard.recentEntries")}</CardTitle>
              <Link to="/entries" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                {t("dashboard.viewAll")}
              </Link>
            </div>
          </CardHeader>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noEntries")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{entry.word}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{entry.explanation}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* FAB — mobile only, above bottom nav */}
      <Link
        to="/entries"
        state={{ openCreateForm: true }}
        className="sm:hidden fixed bottom-[65px] opacity-70 right-5 z-20 w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-colors
        "
        aria-label={t("dashboard.addEntry")}>
        <FaPlus className="text-xl" />
      </Link>
    </div>
  );
}

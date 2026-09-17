import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaPlus, FaStar, FaGamepad, FaFire, FaTrophy, FaCalendarAlt } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { entriesApi } from "@/api/api";
import type { DayStat } from "@/api/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEntriesStore } from "@/features/entries/store/entriesStore";

// ── Helpers ───────────────────────────────────────────────────────────────

function heatColor(total: number): string {
  if (total === 0) return "bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600/30";
  if (total <= 2) return "bg-emerald-100 dark:bg-emerald-900/90";
  if (total <= 5) return "bg-emerald-300 dark:bg-emerald-700";
  if (total <= 9) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-400";
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  accentBg,
  iconBg,
  iconColor,
  icon,
  unit,
}: {
  label: string;
  value: number;
  color: string;
  accentBg: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  unit?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex">
      <div className={`w-1 shrink-0 ${accentBg}`} />
      <div className="p-3.5 flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <span className={`text-lg ${iconColor}`}>{icon}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
            {label}
          </p>
          <p className={`text-2xl font-bold leading-none ${color}`}>
            {value}
            {unit && <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

const LEGEND_CELLS = [
  "bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600/30",
  "bg-emerald-100 dark:bg-emerald-900/90",
  "bg-emerald-300 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-700 dark:bg-emerald-400",
];

export function ActivityPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mode = useAuthStore((s) => s.mode);

  // Heatmap interaction: hover (desktop) + pin (tap / click)
  const [hoveredDay, setHoveredDay] = useState<DayStat | null>(null);
  const [pinnedDay, setPinnedDay] = useState<DayStat | null>(null);
  const displayDay = pinnedDay ?? hoveredDay;

  const entries = useEntriesStore((s) => s.entries);
  const masteredCount = useMemo(() => entries.filter((e) => e.mastery_level === 5).length, [entries]);

  const { data, isLoading } = useQuery({
    queryKey: ["activityHistory"],
    queryFn: () => entriesApi.getActivityHistory(8),
    enabled: mode === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  // ── Heatmap grid ─────────────────────────────────────────────────────

  const { grid, weekLabels, dayLabels } = useMemo(() => {
    if (!data?.days.length) return { grid: [], weekLabels: [], dayLabels: [] };

    const firstDate = new Date(data.days[0].date + "T12:00:00");
    const firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0=Mon, 6=Sun

    const padded: (DayStat | null)[] = [...Array(firstDayOfWeek).fill(null), ...data.days];
    const cols: (DayStat | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));

    const weekLabels: string[] = cols.map((col, wi) => {
      const firstReal = col.find((d) => d !== null);
      if (!firstReal) return "";
      const d = new Date(firstReal.date + "T12:00:00");
      const prevFirst = wi > 0 ? cols[wi - 1].find((d) => d !== null) : null;
      const prevMonth = prevFirst ? new Date(prevFirst.date + "T12:00:00").getMonth() : -1;
      return d.getMonth() !== prevMonth ? d.toLocaleDateString(i18n.language, { month: "short" }) : "";
    });

    const anchor = new Date("2024-01-01T12:00:00"); // Monday
    const dayLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString(i18n.language, { weekday: "narrow" });
    });

    return { grid: cols, weekLabels, dayLabels };
  }, [data, i18n.language]);

  // ── Weekly aggregates ─────────────────────────────────────────────────

  const weeklyAggs = useMemo(() => {
    if (!data?.days.length) return [];
    const result: { entries: number; reviews: number; games: number; total: number; label: string }[] = [];
    for (let i = 0; i < data.days.length; i += 7) {
      const chunk = data.days.slice(i, i + 7);
      const entries = chunk.reduce((s, d) => s + d.entries_added, 0);
      const reviews = chunk.reduce((s, d) => s + d.reviews_count, 0);
      const games = chunk.reduce((s, d) => s + d.games_completed, 0);
      const d = new Date(chunk[0].date + "T12:00:00");
      result.push({
        entries,
        reviews,
        games,
        total: entries + reviews + games,
        label: d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" }),
      });
    }
    return result;
  }, [data, i18n.language]);

  const maxWeekTotal = Math.max(...weeklyAggs.map((w) => w.total), 1);
  const bestWeek = Math.max(...weeklyAggs.map((w) => w.total), 0);

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <FaArrowLeft className="text-sm" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("activity.title")}</h1>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={t("dashboard.tooltipEntries")}
          value={data?.totals.entries ?? 0}
          color="text-emerald-500 dark:text-emerald-400"
          accentBg="bg-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-900/40"
          iconColor="text-emerald-400 dark:text-emerald-500"
          icon={<FaPlus />}
        />
        <StatCard
          label={t("dashboard.statMastered")}
          value={masteredCount}
          color="text-indigo-500 dark:text-indigo-400"
          accentBg="bg-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-900/40"
          iconColor="text-indigo-400 dark:text-indigo-500"
          icon={<FaStar />}
        />
        <StatCard
          label={t("dashboard.tooltipGames")}
          value={data?.totals.games ?? 0}
          color="text-amber-500 dark:text-amber-400"
          accentBg="bg-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-900/40"
          iconColor="text-amber-400 dark:text-amber-500"
          icon={<FaGamepad />}
        />
        <StatCard
          label={t("activity.longestStreak")}
          value={data?.longest_streak ?? 0}
          color="text-violet-500 dark:text-violet-400"
          accentBg="bg-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-900/40"
          iconColor="text-violet-400 dark:text-violet-500"
          icon={<FaFire />}
          unit={t("dashboard.days")}
        />
      </div>

      {/* Middle section: calendar (left 2/5) + weekly breakdown (right 3/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Calendar heatmap — 2/5 cols on desktop */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("activity.heatmap")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("activity.last8Weeks")}</p>
            </div>

            {/* Selected / hovered day detail */}
            <div className="min-h-[2.5rem] flex items-center">
              {displayDay ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs w-full">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                    {new Date(displayDay.date + "T12:00:00").toLocaleDateString(i18n.language, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-[2px] bg-emerald-400 shrink-0" />
                    {t("dashboard.tooltipEntries")}:{" "}
                    <b className="text-gray-700 dark:text-gray-200 ml-0.5">{displayDay.entries_added}</b>
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-[2px] bg-indigo-400 shrink-0" />
                    {t("dashboard.tooltipReviews")}:{" "}
                    <b className="text-gray-700 dark:text-gray-200 ml-0.5">{displayDay.reviews_count}</b>
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-[2px] bg-amber-400 shrink-0" />
                    {t("dashboard.tooltipGames")}:{" "}
                    <b className="text-gray-700 dark:text-gray-200 ml-0.5">{displayDay.games_completed}</b>
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 ml-auto shrink-0">
                    {t("dashboard.tooltipTotal")}:{" "}
                    <b className="text-gray-700 dark:text-gray-200">
                      {displayDay.entries_added + displayDay.reviews_count + displayDay.games_completed}
                    </b>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-300 dark:text-gray-600 select-none">{t("activity.selectHint")}</p>
              )}
            </div>

            {/* Grid */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex gap-[5px] min-w-max">
                {/* Day-of-week labels */}
                <div className="flex flex-col gap-[5px]">
                  <div className="h-4" />
                  {dayLabels.map((label, i) => (
                    <div key={i} className="w-6 h-6 flex items-center justify-end">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 pr-0.5 select-none">
                        {i % 2 === 0 ? label : ""}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                {grid.map((col, wi) => (
                  <div key={wi} className="flex flex-col gap-[5px]">
                    <div className="h-4 flex items-end pb-0.5">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none select-none">
                        {weekLabels[wi]}
                      </span>
                    </div>
                    {col.map((day, di) => {
                      const total = day ? day.entries_added + day.reviews_count + day.games_completed : 0;
                      const isActive = displayDay?.date === day?.date;
                      return (
                        <div
                          key={di}
                          className={[
                            "w-6 h-6 rounded-sm transition-all duration-100",
                            day ? `${heatColor(total)} cursor-pointer` : "invisible",
                            isActive
                              ? "ring-2 ring-offset-1 ring-gray-500 dark:ring-gray-300 dark:ring-offset-gray-800"
                              : "",
                          ].join(" ")}
                          onMouseEnter={() => {
                            if (day && !pinnedDay) setHoveredDay(day);
                          }}
                          onMouseLeave={() => {
                            if (!pinnedDay) setHoveredDay(null);
                          }}
                          onClick={() => {
                            if (!day) return;
                            setHoveredDay(null);
                            setPinnedDay((prev) => (prev?.date === day.date ? null : day));
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("activity.legendLess")}</span>
              {LEGEND_CELLS.map((cls, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
              ))}
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("activity.legendMore")}</span>
            </div>
          </div>
        </div>
        {/* /calendar */}

        {/* Weekly breakdown bars — 3/5 cols on desktop */}
        <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 shrink-0">
                {t("activity.weeklyBreakdown")}
              </p>
              <div className="flex items-center gap-2.5 text-[10px] text-gray-400 dark:text-gray-500 flex-wrap justify-end">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-emerald-400 shrink-0" />
                  {t("dashboard.tooltipEntries")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-indigo-400 shrink-0" />
                  {t("dashboard.tooltipReviews")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-amber-400 shrink-0" />
                  {t("dashboard.tooltipGames")}
                </span>
              </div>
            </div>

            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: "180px" }}>
              {weeklyAggs.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                  {/* Tooltip */}
                  {w.total > 0 && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-sm bg-emerald-400 shrink-0" />
                        <span className="text-gray-300">{t("dashboard.tooltipEntries")}:</span>
                        <span className="font-semibold">{w.entries}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-sm bg-indigo-400 shrink-0" />
                        <span className="text-gray-300">{t("dashboard.tooltipReviews")}:</span>
                        <span className="font-semibold">{w.reviews}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-sm bg-amber-400 shrink-0" />
                        <span className="text-gray-300">{t("dashboard.tooltipGames")}:</span>
                        <span className="font-semibold">{w.games}</span>
                      </div>
                      <div className="border-t border-gray-700 dark:border-gray-500 pt-0.5 mt-0.5 flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-gray-400">{t("dashboard.tooltipTotal")}:</span>
                        <span className="font-bold">{w.total}</span>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                    </div>
                  )}

                  {/* Stacked bar */}
                  <div className="w-full flex flex-col justify-end" style={{ height: "160px" }}>
                    {w.total > 0 ? (
                      <div
                        className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-300"
                        style={{ height: `${Math.max((w.total / maxWeekTotal) * 100, 8)}%` }}>
                        <div style={{ flex: w.entries || 0 }} className="bg-emerald-400 dark:bg-emerald-500" />
                        <div style={{ flex: w.reviews || 0 }} className="bg-indigo-400" />
                        <div style={{ flex: w.games || 0 }} className="bg-amber-400" />
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-sm" style={{ height: "3px" }} />
                    )}
                  </div>

                  <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{w.label}</span>
                </div>
              ))}
            </div>
          </div>{" "}
          {/* Bottom badges — expandable row for future cards */}
          <div className="grid grid-cols-2 mt-4 sm:grid-cols-2 gap-3">
            <StatCard
              label={t("activity.bestDay")}
              value={data?.best_day ?? 0}
              color="text-orange-500 dark:text-orange-400"
              accentBg="bg-orange-400"
              iconBg="bg-orange-50 dark:bg-orange-900/40"
              iconColor="text-orange-400 dark:text-orange-500"
              icon={<FaTrophy />}
              unit={t("dashboard.tooltipTotal")}
            />
            <StatCard
              label={t("activity.bestWeek")}
              value={bestWeek}
              color="text-rose-500 dark:text-rose-400"
              accentBg="bg-rose-400"
              iconBg="bg-rose-50 dark:bg-rose-900/40"
              iconColor="text-rose-400 dark:text-rose-500"
              icon={<FaCalendarAlt />}
              unit={t("dashboard.tooltipTotal")}
            />
          </div>
        </div>
        {/* /weekly breakdown */}
      </div>
      {/* /middle grid */}
    </div>
  );
}

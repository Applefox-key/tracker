import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FiBookOpen,
  FiPlusCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTarget,
  FiStar,
  FiCalendar,
  FiPieChart,
  FiList,
} from "react-icons/fi";
import { Card, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Entry, EntryCategory } from "@/features/entries/types";
import { AddEntryFab } from "@/features/entries/components/AddEntryFab";
import { EntryForm, EntryFormValues } from "@/features/entries/components/AddEntryForm";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import { entriesApi, type DayStat } from "@/api/api";

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
  hexColor: string;
  mobileBg: string;
  mobileText: string;
  mobileClasses: string;
}> = [
  {
    key: "word",
    color: "bg-blue-500",
    colorWrap: "bg-blue-200",
    hexColor: "#3b82f6",
    mobileBg: "bg-blue-50 dark:bg-blue-950/40",
    mobileText: "text-blue-500",
    mobileClasses: "max-sm:bg-blue-200 max-sm:border-l-2 max-sm:border-blue-500",
  },
  {
    key: "phrase",
    color: "bg-green-500",
    colorWrap: "bg-green-200",
    hexColor: "#22c55e",
    mobileBg: "bg-green-50 dark:bg-green-950/40",
    mobileText: "text-green-500",
    mobileClasses: "max-sm:bg-green-200 max-sm:border-l-2 max-sm:border-green-500",
  },
  {
    key: "grammar",
    color: "bg-purple-500",
    colorWrap: "bg-purple-200",
    hexColor: "#a855f7",
    mobileBg: "bg-purple-50 dark:bg-purple-950/40",
    mobileText: "text-purple-500",
    mobileClasses: "max-sm:bg-purple-200 max-sm:border-l-2 max-sm:border-purple-500",
  },
  {
    key: "idiom",
    color: "bg-orange-500",
    colorWrap: "bg-orange-200",
    hexColor: "#f97316",
    mobileBg: "bg-orange-50 dark:bg-orange-950/40",
    mobileText: "text-orange-500",
    mobileClasses: "max-sm:bg-orange-200 max-sm:border-l-2 max-sm:border-orange-500",
  },
  {
    key: "note",
    color: "bg-teal-500",
    colorWrap: "bg-teal-200",
    hexColor: "#14b8a6",
    mobileBg: "bg-teal-50 dark:bg-teal-950/40",
    mobileText: "text-teal-500",
    mobileClasses: "max-sm:bg-teal-200 max-sm:border-l-2 max-sm:border-teal-500",
  },
];

// ── Badge milestones ──────────────────────────────────────────────────────

// ── Streak 2.5D cake ─────────────────────────────────────────────────────────

const LAP_COLORS = [
  {
    top: "fill-amber-400 dark:fill-amber-500",
    side: "fill-amber-600 dark:fill-amber-700",
    fadedTop: "fill-amber-200 dark:fill-amber-800",
    fadedSide: "fill-amber-300 dark:fill-amber-700",
  },
  {
    top: "fill-blue-400 dark:fill-blue-500",
    side: "fill-blue-600 dark:fill-blue-700",
    fadedTop: "fill-blue-200 dark:fill-blue-800",
    fadedSide: "fill-blue-300 dark:fill-blue-700",
  },
  {
    top: "fill-emerald-400 dark:fill-emerald-500",
    side: "fill-emerald-600 dark:fill-emerald-700",
    fadedTop: "fill-emerald-200 dark:fill-emerald-800",
    fadedSide: "fill-emerald-300 dark:fill-emerald-700",
  },
  {
    top: "fill-violet-400 dark:fill-violet-500",
    side: "fill-violet-600 dark:fill-violet-700",
    fadedTop: "fill-violet-200 dark:fill-violet-800",
    fadedSide: "fill-violet-300 dark:fill-violet-700",
  },
  {
    top: "fill-pink-400 dark:fill-pink-500",
    side: "fill-pink-600 dark:fill-pink-700",
    fadedTop: "fill-pink-200 dark:fill-pink-800",
    fadedSide: "fill-pink-300 dark:fill-pink-700",
  },
  {
    top: "fill-orange-400 dark:fill-orange-500",
    side: "fill-orange-600 dark:fill-orange-700",
    fadedTop: "fill-orange-200 dark:fill-orange-800",
    fadedSide: "fill-orange-300 dark:fill-orange-700",
  },
  {
    top: "fill-teal-400 dark:fill-teal-500",
    side: "fill-teal-600 dark:fill-teal-700",
    fadedTop: "fill-teal-200 dark:fill-teal-800",
    fadedSide: "fill-teal-300 dark:fill-teal-700",
  },
] as const;

// fruit per lap: amber→🍋 blue→🫐 emerald→🍏 violet→🍇 pink→🍒 orange→🍊 teal→🥝
const LAP_FRUITS = ["🍋", "🫐", "🍏", "🍇", "🍒", "🍊", "🥝"] as const;

function StreakFruits({
  completedLaps,
  max = 7,
  small = false,
}: {
  completedLaps: number;
  max?: number;
  small?: boolean;
}) {
  if (completedLaps === 0) return null;
  const visible = Math.min(completedLaps, max);
  const overflow = completedLaps - visible;
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {Array.from({ length: visible }, (_, i) => (
        <span
          key={i}
          className={small ? "text-[11px] leading-none" : "text-md leading-none select-none"}
          title={`Week ${i + 1}`}>
          {LAP_FRUITS[i % LAP_FRUITS.length]}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={
            small
              ? "text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-0.5"
              : "text-md font-bold text-gray-400 dark:text-gray-500 ml-0.5"
          }>
          +{overflow}
        </span>
      )}
    </div>
  );
}

function StreakCake3D({
  streak,
  total = 7,
  small = false,
  hideBadge = false,
}: {
  streak: number;
  total?: number;
  small?: boolean;
  hideBadge?: boolean;
}) {
  const { t } = useTranslation();
  const cx = 60,
    cy = 36;
  const rx = 52,
    ry = 20;
  const depth = 14;
  const STEP = (2 * Math.PI) / total;
  const START = -Math.PI / 2;

  const completedLaps = Math.floor(streak / 7);
  const progress = streak % 7;
  const lapNumber = streak > 0 ? Math.ceil(streak / 7) : 0;
  const currentColor = LAP_COLORS[completedLaps % LAP_COLORS.length];
  const prevColor = completedLaps > 0 ? LAP_COLORS[(completedLaps - 1) % LAP_COLORS.length] : null;

  const pt = (angle: number, bot = false): [number, number] => [
    cx + rx * Math.cos(angle),
    cy + (bot ? depth : 0) + ry * Math.sin(angle),
  ];

  const sectors = Array.from({ length: total }, (_, i) => {
    const a0 = START + i * STEP;
    const a1 = a0 + STEP;
    const midSin = Math.sin(a0 + STEP / 2);
    const [tx0, ty0] = pt(a0);
    const [tx1, ty1] = pt(a1);
    const [bx0, by0] = pt(a0, true);
    const [bx1, by1] = pt(a1, true);
    const topPath = `M ${cx} ${cy} L ${tx0.toFixed(2)} ${ty0.toFixed(2)} A ${rx} ${ry} 0 0 1 ${tx1.toFixed(2)} ${ty1.toFixed(2)} Z`;
    const sidePath =
      midSin > -0.25
        ? `M ${tx0.toFixed(2)} ${ty0.toFixed(2)} L ${bx0.toFixed(2)} ${by0.toFixed(2)} A ${rx} ${ry} 0 0 1 ${bx1.toFixed(2)} ${by1.toFixed(2)} L ${tx1.toFixed(2)} ${ty1.toFixed(2)} Z`
        : null;

    // progress===0 && streak>0 means lap just completed — show all sectors in that lap's color
    const isFilledCurrent = progress === 0 ? streak > 0 : i < progress;

    let topClass: string;
    let sideClass: string;
    if (isFilledCurrent) {
      // When lap just completed (progress===0), show previous lap's color (the one just done)
      const color = progress === 0 ? (prevColor ?? currentColor) : currentColor;
      topClass = color.top;
      sideClass = color.side;
    } else if (prevColor) {
      // Empty slots in lap 2+: faded version of the previous lap
      topClass = prevColor.fadedTop;
      sideClass = prevColor.fadedSide;
    } else {
      // Empty slots in lap 1: plain gray
      topClass = "fill-gray-200 dark:fill-gray-600";
      sideClass = "fill-gray-300 dark:fill-gray-500";
    }

    return { i, topClass, sideClass, midSin, topPath, sidePath };
  });

  const sideSectors = [...sectors].filter((s) => s.sidePath !== null).sort((a, b) => a.midSin - b.midSin);

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <svg viewBox="0 0 120 80" className="w-20 h-14" aria-hidden>
        <ellipse cx={cx} cy={cy + depth + ry + 2} rx={rx - 4} ry={4} fill="rgba(0,0,0,0.12)" />
        <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry} className="fill-gray-200 dark:fill-gray-600" />
        {sideSectors.map((s) => (
          <path key={`w${s.i}`} d={s.sidePath!} className={s.sideClass} />
        ))}
        {sectors.map((s) => (
          <path
            key={`t${s.i}`}
            d={s.topPath}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.7"
            className={s.topClass}
          />
        ))}
      </svg>
      {!small && !hideBadge && lapNumber >= 2 && (
        <span className="text-[9px] font-bold bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-800 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
          {t("dashboard.streakLap", { count: lapNumber })}
        </span>
      )}
    </div>
  );
}

// ── Weekly activity chip — mobile ─────────────────────────────────────────

function WeeklyActivityChip({
  streak,
  weeklyStats,
  todayCount,
}: {
  streak: number;
  weeklyStats: DayStat[];
  todayCount: number;
}) {
  const { t, i18n } = useTranslation();

  const days = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return weeklyStats.map((stat) => {
      const d = new Date(stat.date + "T12:00:00");
      return {
        entries_added: stat.entries_added,
        reviews_count: stat.reviews_count,
        letter: d.toLocaleDateString(i18n.language, { weekday: "narrow" }),
        isToday: stat.date === today,
      };
    });
  }, [weeklyStats, i18n.language]);

  const maxEntries = Math.max(...days.map((d) => d.entries_added), 1);
  const maxReviews = Math.max(...days.map((d) => d.reviews_count), 1);

  const lastDay = days[days.length - 1];
  const lapNumber = streak > 0 ? Math.ceil(streak / 7) : 0;

  const streakMain =
    streak === 0
      ? null
      : streak === 1
        ? t("dashboard.streak1")
        : streak >= 7
          ? t("dashboard.streakLegendary", { count: streak })
          : t("dashboard.streakKeepUp", { count: streak });

  const streakSub =
    streak === 0
      ? null
      : streak === 1
        ? t("dashboard.streak1Sub")
        : streak >= 7
          ? t("dashboard.streakLegendarySub")
          : t("dashboard.streakKeepUpSub");

  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm">
      {/* Top row: [pie] [text flex-1] [badge] [today stats] */}

      <div className="flex items-center gap-2">
        <StreakCake3D streak={streak} small />
        <div className="flex-1 min-w-0">
          {streakMain ? (
            <>
              <div className="flex flex-col  max-w-fit">
                <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 leading-snug">{streakMain}</p>
                <p className="text-xs text-right italic text-amber-400 dark:text-amber-300 leading-snug">{streakSub}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 leading-snug">
                {t("dashboard.noStreak")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{t("dashboard.noStreakSub")}</p>
            </>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-[2px] bg-emerald-400" />
            {todayCount} {t("dashboard.tooltipEntries")}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-[2px] bg-indigo-400" />
            {lastDay?.reviews_count ?? 0} {t("dashboard.tooltipReviews")}
          </span>
        </div>
      </div>
      {lapNumber >= 2 && (
        <div className="flex items-center gap-1.5 mb-1">
          <span className="shrink-0 text-[10px] font-bold text-gray-600 border  dark:text-gray-300 bg-white dark:bg-gray-700 px-1.5 py-1 rounded-full leading-none whitespace-nowrap">
            {t("dashboard.streakLap", { count: lapNumber })}
          </span>
          <StreakFruits completedLaps={Math.floor(streak / 7)} max={5} small />
        </div>
      )}
      {/* Bottom: full-width bar chart */}
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-[10px] h-10">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex items-end gap-[1px]" style={{ height: "100%" }}>
              {d.entries_added > 0 ? (
                <div
                  className="flex-1 rounded-t-md bg-emerald-400 dark:bg-emerald-400 transition-all duration-300"
                  style={{ height: `${Math.max((d.entries_added / maxEntries) * 100, 18)}%` }}
                />
              ) : (
                <div className="flex-1 rounded-t-md bg-gray-300 dark:bg-gray-600/40" style={{ height: "3px" }} />
              )}
              {d.reviews_count > 0 ? (
                <div
                  className="flex-1 rounded-t-md bg-indigo-400 dark:bg-indigo-400 transition-all duration-300"
                  style={{ height: `${Math.max((d.reviews_count / maxReviews) * 100, 18)}%` }}
                />
              ) : (
                <div className="flex-1 rounded-t-md bg-gray-300 dark:bg-gray-600/40" style={{ height: "3px" }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <span
                className={`text-[9px] font-medium leading-none select-none ${
                  d.isToday
                    ? "text-emerald-500 dark:text-emerald-400 font-bold"
                    : d.entries_added + d.reviews_count > 0
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-600"
                }`}>
                {d.letter}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Desktop streak block ──────────────────────────────────────────────────

function DesktopStreakBlock({
  streak,
  todayCount,
  todayReviews,
}: {
  streak: number;
  todayCount: number;
  todayReviews: number;
}) {
  const { t } = useTranslation();

  const streakMain =
    streak === 0
      ? t("dashboard.noStreak")
      : streak === 1
        ? t("dashboard.streak1")
        : streak >= 7
          ? t("dashboard.streakLegendary", { count: streak })
          : t("dashboard.streakKeepUp", { count: streak });

  const streakSub =
    streak === 0
      ? t("dashboard.noStreakSub")
      : streak === 1
        ? t("dashboard.streak1Sub")
        : streak >= 7
          ? t("dashboard.streakLegendarySub")
          : t("dashboard.streakKeepUpSub");

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-4">
        <StreakCake3D streak={streak} hideBadge />
        <div className="flex-1 min-w-0">
          <p
            className={`text-base font-bold leading-snug ${streak > 0 ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
            {streakMain}
          </p>
          <p
            className={`text-sm leading-snug ${streak > 0 ? "text-amber-400 dark:text-amber-300" : "text-gray-400 dark:text-gray-500"}`}>
            {streakSub}
          </p>
        </div>
      </div>
      {/* <div className="flex items-center gap-4"> */}
      <div className="flex-1 min-w-0">
        {Math.floor(streak / 7) >= 1 && (
          <div className="flex items-center gap-1.5 mt-1">
            {Math.ceil(streak / 7) >= 2 && (
              <span className="shrink-0 text-[12px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border px-1.5 py-1 rounded-full leading-none whitespace-nowrap">
                {t("dashboard.streakLap", { count: Math.ceil(streak / 7) })}
              </span>
            )}
            <StreakFruits completedLaps={Math.floor(streak / 7)} max={7} />
          </div>
        )}
        {/* </div> */}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-orange-400 flex items-center justify-center text-white shrink-0">
            <FiPlusCircle size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{todayCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">
              {t("dashboard.statToday")}
            </p>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white shrink-0">
            <FiTarget size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{todayReviews}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">
              {t("dashboard.statTodayReviews")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Desktop weekly activity bar ───────────────────────────────────────────

function DesktopWeeklyActivity({ weeklyStats }: { weeklyStats: DayStat[] }) {
  const { t, i18n } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const days = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return weeklyStats.map((stat) => {
      const d = new Date(stat.date + "T12:00:00");
      return {
        entries_added: stat.entries_added,
        reviews_count: stat.reviews_count,
        letter: d.toLocaleDateString(i18n.language, { weekday: "narrow" }),
        isToday: stat.date === today,
      };
    });
  }, [weeklyStats, i18n.language]);

  const maxEntries = Math.max(...days.map((d) => d.entries_added), 1);
  const maxReviews = Math.max(...days.map((d) => d.reviews_count), 1);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("dashboard.weeklyActivity")}</p>
      <div className="flex items-end gap-2 flex-1" style={{ minHeight: "80px" }}>
        {days.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}>
            {hoveredIdx === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap pointer-events-none flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-sm bg-emerald-400 shrink-0" />
                  <span className="text-gray-300">{t("dashboard.tooltipEntries")}:</span>
                  <span className="font-semibold">{d.entries_added}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-sm bg-indigo-400 shrink-0" />
                  <span className="text-gray-300">{t("dashboard.tooltipReviews")}:</span>
                  <span className="font-semibold">{d.reviews_count}</span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </div>
            )}
            <div className="w-full flex items-end " style={{ height: "64px" }}>
              <div
                className={`flex-1 rounded-t-md transition-all duration-300 ${d.entries_added > 0 ? "bg-emerald-400 dark:bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"}`}
                style={{
                  height: d.entries_added > 0 ? `${Math.max((d.entries_added / maxEntries) * 100, 15)}%` : "4px",
                }}
              />
              <div
                className={`flex-1 rounded-t-md transition-all duration-300 ${d.reviews_count > 0 ? "bg-indigo-400 dark:bg-indigo-400" : "bg-gray-200 dark:bg-gray-600"}`}
                style={{
                  height: d.reviews_count > 0 ? `${Math.max((d.reviews_count / maxReviews) * 100, 15)}%` : "4px",
                }}
              />
            </div>
            <span
              className={`text-[10px] font-medium select-none ${
                d.isToday
                  ? "text-emerald-500 dark:text-emerald-400 font-bold"
                  : d.entries_added + d.reviews_count > 0
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-gray-400 dark:text-gray-600"
              }`}>
              {d.letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Desktop Due Today card ────────────────────────────────────────────────

function DesktopDueTodayCard({ dueCount }: { dueCount: number | null }) {
  const { t } = useTranslation();
  const hasDue = dueCount !== null && dueCount > 0;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm min-h-[110px] ${
        hasDue
          ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
          : "bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-600"
      }`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            hasDue ? "bg-violet-500" : "bg-gray-100 dark:bg-gray-700/60"
          }`}>
          <FiCalendar size={20} className={hasDue ? "text-white" : "text-gray-400 dark:text-gray-500"} />
        </div>
        <div>
          {hasDue ? (
            <>
              <p className="text-3xl font-extrabold text-violet-700 dark:text-violet-300 leading-none">{dueCount}</p>
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">{t("dashboard.dueTodaySub")}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("dashboard.dueTodayNone")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("dashboard.dueTodayNoneSub")}</p>
            </>
          )}
        </div>
      </div>
      {hasDue && (
        <Link to="/practice/due">
          <button className="w-full text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500 rounded-xl py-2 transition-colors">
            {t("dashboard.dueTodayStart")}
          </button>
        </Link>
      )}
    </div>
  );
}

// ── Desktop stat card with icon ───────────────────────────────────────────

interface DesktopStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  to?: string;
  toState?: object;
}

function DesktopStatCard({ label, value, sub, icon, iconBg, to, toState }: DesktopStatCardProps) {
  const card = (
    <Card
      padding="sm"
      className={`flex items-center gap-4 p-5 h-full${to ? " hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
      <div className={`w-12 h-12 shrink-0 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
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

// ── Rapid Review Card ─────────────────────────────────────────────────────

const QUICK_REVIEW_CATEGORIES: EntryCategory[] = ["word", "phrase", "idiom"];

function RapidReviewCard({ entries }: { entries: Entry[] }) {
  const { t } = useTranslation();

  const eligible = useMemo(() => entries.filter((e) => QUICK_REVIEW_CATEGORIES.includes(e.category)), [entries]);

  const [entryId, setEntryId] = useState<number | null>(() =>
    eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)].id : null,
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const entry = useMemo(() => eligible.find((e) => e.id === entryId) ?? eligible[0] ?? null, [eligible, entryId]);

  const shuffle = () => {
    if (eligible.length === 0 || isAnimating) return;
    setIsFlipped(false);
    setIsAnimating(true);
    setTimeout(() => {
      const pool = eligible.filter((e) => e.id !== entryId);
      const next = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : eligible[0];
      setEntryId(next.id);
      setIsAnimating(false);
    }, 200);
  };

  const categoryStyle = entry ? CATEGORY_STYLES.find((c) => c.key === entry.category) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("dashboard.rapidReview.title")}</h2>
        {eligible.length > 1 && (
          <button
            onClick={shuffle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next card">
            <FiRefreshCw size={14} />
          </button>
        )}
      </div>

      {!entry ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 px-1">{t("dashboard.rapidReview.noEntries")}</p>
      ) : (
        <div
          className={`cursor-pointer select-none transition-opacity duration-200 ${isAnimating ? "opacity-0" : "opacity-100"}`}
          style={{ perspective: "1000px" }}
          onClick={() => !isAnimating && setIsFlipped((f) => !f)}>
          <div
            className="relative w-full h-36"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
            {/* Front */}
            <div
              className="absolute inset-0 bg-white dark:bg-gray-800 border-2 border-amber-400/60 dark:border-amber-500/40 rounded-2xl shadow-sm flex flex-col"
              style={{ backfaceVisibility: "hidden" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-5 gap-1.5">
                {categoryStyle && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${categoryStyle.mobileText}`}>
                    {t(`dashboard.categories.${entry.category}`)}
                  </span>
                )}
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-tight">
                  {entry.word}
                </p>
              </div>
              <div className="shrink-0 pb-3 flex justify-center">
                <span className="text-[10px] text-gray-300 dark:text-gray-600">
                  {t("dashboard.rapidReview.tapToFlip")}
                </span>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-emerald-600 dark:bg-emerald-700 rounded-2xl shadow-sm flex flex-col items-center justify-center px-5 py-4 gap-2"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <p className="text-sm font-semibold text-white text-center leading-snug line-clamp-3">
                {entry.explanation}
              </p>
              {entry.example && (
                <p className="text-xs text-emerald-100 italic text-center line-clamp-2 opacity-90">
                  &ldquo;{entry.example}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile stat card with icon ─────────────────────────────────────────────

interface MobileStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  to?: string;
  toState?: object;
  onIconClick?: () => void;
}

function MobileStatCard({ label, value, sub, icon, iconBg, to, toState, onIconClick }: MobileStatCardProps) {
  const iconEl = onIconClick ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onIconClick();
      }}
      className={`w-9 h-9 shrink-0 rounded-xl ${iconBg} flex items-center justify-center text-white active:opacity-80`}>
      {icon}
    </button>
  ) : (
    <div className={`w-9 h-9 shrink-0 rounded-xl ${iconBg} flex items-center justify-center text-white`}>{icon}</div>
  );

  const card = (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm flex flex-col gap-1.5 flex-1${to ? " cursor-pointer active:scale-95 transition-transform" : ""}`}>
      <div className="flex items-center gap-2.5 justify-around">
        {iconEl}
        <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
      </div>
      <p className="text-[11px] font-semibold text-center text-gray-700 dark:text-gray-300 leading-tight truncate">
        {label}
      </p>
      {sub && <p className="text-[10px] text-center text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
  if (to)
    return (
      <Link to={to} state={toState} className="flex-1">
        {card}
      </Link>
    );
  return card;
}

// ── Circular SVG progress ring ─────────────────────────────────────────────

function CircularRing({ pct, hexColor }: { pct: number; hexColor: string }) {
  return (
    <svg viewBox="0 0 36 36" className="w-14 h-14" style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx="18"
        cy="18"
        r="15.9155"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="2.8"
        className="dark:stroke-gray-700"
      />
      <circle
        cx="18"
        cy="18"
        r="15.9155"
        fill="none"
        stroke={hexColor}
        strokeWidth="2.8"
        strokeDasharray={`${pct} ${100 - pct}`}
        strokeLinecap="round"
        strokeDashoffset="0"
      />
    </svg>
  );
}

// ── Category card with circular ring ──────────────────────────────────────

interface CategoryRingCardProps {
  label: string;
  count: number;
  total: number;
  hexColor: string;
  mobileBg: string;
  mobileText: string;
  to: string;
  toState: object;
}

function CategoryRingCard({ label, count, total, hexColor, mobileBg, mobileText, to, toState }: CategoryRingCardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <Link to={to} state={toState} className="flex-1 min-w-0">
      <div
        className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-3 ${mobileBg} h-full active:scale-95 transition-transform border`}
        style={{ borderColor: `${hexColor}40`, boxShadow: `0 2px 8px 0 ${hexColor}22` }}>
        <p className={`text-[10px] font-semibold ${mobileText} truncate w-full text-center px-1`}>{label}</p>
        <div className="relative flex items-center justify-center">
          <CircularRing pct={pct} hexColor={hexColor} />
          <span className="absolute text-[11px] font-bold text-gray-700 dark:text-gray-300">{pct}%</span>
        </div>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{count}</p>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { t } = useTranslation();
  const entries = useEntriesStore((s) => s.entries);
  const dueCount = useEntriesStore((s) => s.dueCount);
  const [showAddForm, setShowAddForm] = useState(false);
  const { addEntry } = useEntryCrud();
  const mode = useAuthStore((s) => s.mode);

  const { data: weeklyStatsData } = useQuery({
    queryKey: ["weeklyStats"],
    queryFn: () => entriesApi.getWeeklyStats(),
    enabled: mode === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  // Fallback for demo/unauthenticated: calculate from entries (entries only, no reviews)
  const fallbackStats = useMemo<DayStat[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = daysAgo(6 - i);
        const date = d.toISOString().slice(0, 10);
        const from = d.getTime();
        const to = from + 86400000;
        return {
          date,
          entries_added: entries.filter((e) => {
            const t = new Date(e.createdAt).getTime();
            return t >= from && t < to;
          }).length,
          reviews_count: 0,
        };
      }),
    [entries],
  );

  const weeklyStats = weeklyStatsData?.length ? weeklyStatsData : fallbackStats;

  async function handleAdd(values: EntryFormValues) {
    const { tagIds, imgFile, removeImg: _, ...entryData } = values;
    await addEntry({ ...entryData, tags: [] }, tagIds, imgFile ?? undefined);
    setShowAddForm(false);
  }

  const streak = useMemo(() => {
    // Dates with new entries (all-time, infinite lookback)
    const activityDates = new Set(
      entries.map((e) => {
        const d = new Date(e.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    // Also count days where user did reviews (last 7 days from weeklyStats)
    for (const stat of weeklyStats) {
      if (stat.reviews_count > 0) {
        const d = new Date(stat.date + "T12:00:00");
        activityDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
    let s = 0;
    let i = 0;
    while (true) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (activityDates.has(key)) {
        s++;
        i++;
      } else if (i === 0) {
        i++; // today has no activity yet — check yesterday
      } else {
        break;
      }
    }
    return s;
  }, [entries, weeklyStats]);

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

  const todayReviews = weeklyStats[weeklyStats.length - 1]?.reviews_count ?? 0;

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
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* ── Title row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden sm:block text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">{t("dashboard.subtitle")}</p>
        </div>
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

      {/* ── Desktop row 1: streak + weekly activity + due today ── */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        <DesktopStreakBlock streak={streak} todayCount={stats.todayCount} todayReviews={todayReviews} />
        <DesktopWeeklyActivity weeklyStats={weeklyStats} />
        <DesktopDueTodayCard dueCount={dueCount} />
      </div>

      {/* ── Weekly activity chip — mobile only ── */}
      <div className="sm:hidden">
        <WeeklyActivityChip streak={streak} weeklyStats={weeklyStats} todayCount={stats.todayCount} />
      </div>

      {/* ── Stats — mobile (3 icon cards) ── */}
      <div className="flex gap-2.5 sm:hidden">
        <MobileStatCard
          label={t("dashboard.statTotal")}
          value={entries.length}
          sub={t("dashboard.statTotalSub")}
          icon={<FiBookOpen size={18} />}
          iconBg="bg-emerald-500"
          to="/entries"
        />
        <MobileStatCard
          label={t("dashboard.statToday")}
          value={stats.todayCount}
          sub={t("dashboard.statTodaySub")}
          icon={<FiPlusCircle size={18} />}
          iconBg="bg-orange-400"
          to="/entries"
          toState={{ dateFilter: "today" }}
          onIconClick={() => setShowAddForm(true)}
        />
        <MobileStatCard
          label={t("dashboard.statWeek")}
          value={stats.weekCount}
          sub={t("dashboard.statWeekMotivation")}
          icon={<FiTrendingUp size={18} />}
          iconBg="bg-blue-500"
          to="/entries"
          toState={{ dateFilter: "week" }}
        />
      </div>

      {/* ── Desktop row 2: stat cards with icons ── */}
      <div className="hidden sm:grid grid-cols-5 gap-4">
        <DesktopStatCard
          label={t("dashboard.statTotal")}
          value={entries.length}
          sub={t("dashboard.statTotalSub")}
          icon={<FiBookOpen size={22} />}
          iconBg="bg-emerald-500"
          to="/entries"
        />
        <DesktopStatCard
          label={t("dashboard.statToday")}
          value={stats.todayCount}
          sub={t("dashboard.statTodaySub")}
          icon={<FiPlusCircle size={22} />}
          iconBg="bg-orange-400"
          to="/entries"
          toState={{ dateFilter: "today" }}
        />
        <DesktopStatCard
          label={t("dashboard.statWeek")}
          value={stats.weekCount}
          sub={t("dashboard.statWeekSub")}
          icon={<FiTrendingUp size={22} />}
          iconBg="bg-blue-500"
          to="/entries"
          toState={{ dateFilter: "week" }}
        />
        <DesktopStatCard
          label={t("dashboard.statPractice")}
          value={stats.flashCount}
          sub={t("dashboard.statWeekMotivation")}
          icon={<FiTarget size={22} />}
          iconBg="bg-violet-500"
          to="/practice"
        />
        <DesktopStatCard
          label={t("dashboard.statAvgRating")}
          value={stats.avgRating}
          sub={t("dashboard.statAvgRatingSub")}
          icon={<FiStar size={22} />}
          iconBg="bg-amber-400"
          to="/practice"
        />
      </div>

      {/* ── Category rings — mobile ── */}
      <div className="flex gap-1 sm:hidden mb-8">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 px-1">{t("dashboard.noEntries")}</p>
        ) : (
          CATEGORY_STYLES.map(({ key, hexColor, mobileBg, mobileText }) => (
            <CategoryRingCard
              key={key}
              label={t(`dashboard.categories.${key}`)}
              count={categoryCounts[key] ?? 0}
              total={entries.length}
              hexColor={hexColor}
              mobileBg={mobileBg}
              mobileText={mobileText}
              to="/entries"
              toState={{ categoryFilter: key }}
            />
          ))
        )}
      </div>

      {/* ── Rapid review — mobile only ── */}
      <div className="sm:hidden">
        <RapidReviewCard entries={entries} />
      </div>

      {/* ── Desktop row 3: category rings + rapid review + recent entries ── */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {/* Category distribution */}
        <Card>
          <CardHeader className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPieChart size={16} className="text-gray-400 dark:text-gray-500" />
                <CardTitle className="text-base">{t("dashboard.categoryDistribution")}</CardTitle>
              </div>
              <Link to="/entries" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                {t("dashboard.viewAll")}
              </Link>
            </div>
          </CardHeader>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noEntries")}</p>
          ) : (
            <div className="flex gap-1">
              {CATEGORY_STYLES.map(({ key, hexColor, mobileBg, mobileText }) => (
                <CategoryRingCard
                  key={key}
                  label={t(`dashboard.categories.${key}`)}
                  count={categoryCounts[key] ?? 0}
                  total={entries.length}
                  hexColor={hexColor}
                  mobileBg={mobileBg}
                  mobileText={mobileText}
                  to="/entries"
                  toState={{ categoryFilter: key }}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Rapid review */}
        <Card>
          <RapidReviewCard entries={entries} />
        </Card>

        {/* Recent entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiList size={16} className="text-gray-400 dark:text-gray-500" />
                <CardTitle className="text-base">{t("dashboard.recentEntries")}</CardTitle>
              </div>
              <Link to="/entries" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                {t("dashboard.viewAll")}
              </Link>
            </div>
          </CardHeader>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noEntries")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
              {recentEntries.map((entry) => {
                const catStyle = CATEGORY_STYLES.find((c) => c.key === entry.category);
                return (
                  <div key={entry.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{entry.word}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {entry.explanation}
                      </p>
                    </div>
                    {catStyle && (
                      <span
                        className={`shrink-0 text-xs font-medium capitalize px-2 py-0.5 rounded-full ${catStyle.mobileBg} ${catStyle.mobileText}`}>
                        {t(`dashboard.categories.${entry.category}`)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent entries — mobile ── */}
      <Card className="sm:hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t("dashboard.recentEntries")}</CardTitle>
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
              <div key={entry.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{entry.word}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{entry.explanation}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {entry.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* FAB — mobile only, above bottom nav */}
      <AddEntryFab to="/entries" state={{ openCreateForm: true }} ariaLabel={t("dashboard.addEntry")} />

      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-gray-900 sm:hidden">
          <EntryForm mode="create" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}
    </div>
  );
}

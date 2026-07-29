import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiPlusCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTarget,
  FiStar,
  FiAward,
  FiPieChart,
  FiList,
} from "react-icons/fi";
import { Card, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { Entry, EntryCategory } from "@/features/entries/types";
import { AddEntryFab } from "@/features/entries/components/AddEntryFab";
import { EntryForm, EntryFormValues } from "@/features/entries/components/AddEntryForm";
import { useEntryCrud } from "@/hooks/useEntryCrud";

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

function StreakCake3D({ streak, total = 7 }: { streak: number; total?: number }) {
  const cx = 60,
    cy = 36;
  const rx = 52,
    ry = 20;
  const depth = 14;
  const STEP = (2 * Math.PI) / total;
  const START = -Math.PI / 2;

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
    const sidePoints =
      midSin > -0.25
        ? `${tx0.toFixed(2)},${ty0.toFixed(2)} ${bx0.toFixed(2)},${by0.toFixed(2)} ${bx1.toFixed(2)},${by1.toFixed(2)} ${tx1.toFixed(2)},${ty1.toFixed(2)}`
        : null;
    return { i, filled: i < streak, midSin, topPath, sidePoints };
  });

  const sideSectors = [...sectors].filter((s) => s.sidePoints !== null).sort((a, b) => a.midSin - b.midSin);

  return (
    <svg viewBox="0 0 120 80" className="w-20 h-14" aria-hidden>
      <ellipse cx={cx} cy={cy + depth + ry + 2} rx={rx - 4} ry={4} fill="rgba(0,0,0,0.12)" />
      <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry} className="fill-gray-200 dark:fill-gray-600" />
      {sideSectors.map((s) => (
        <polygon
          key={`w${s.i}`}
          points={s.sidePoints!}
          className={s.filled ? "fill-amber-600 dark:fill-amber-700" : "fill-gray-300 dark:fill-gray-500"}
        />
      ))}
      {sectors.map((s) => (
        <path
          key={`t${s.i}`}
          d={s.topPath}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.7"
          className={s.filled ? "fill-amber-400 dark:fill-amber-500" : "fill-gray-200 dark:fill-gray-600"}
        />
      ))}
    </svg>
  );
}

// ── Weekly activity chip — mobile ─────────────────────────────────────────

function WeeklyActivityChip({ entries }: { entries: Entry[] }) {
  const { t, i18n } = useTranslation();

  const { days, streak } = useMemo(() => {
    const arr = Array.from({ length: 7 }, (_, i) => {
      const from = daysAgo(6 - i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const count = entries.filter((e) => {
        const time = new Date(e.createdAt).getTime();
        return time >= from.getTime() && time < to.getTime();
      }).length;
      const letter = from.toLocaleDateString(i18n.language, { weekday: "narrow" });
      return { count, letter, isToday: i === 6 };
    });

    let s = 0;
    for (let i = 6; i >= 0; i--) {
      if (arr[i].count > 0) s++;
      else if (i === 6) continue;
      else break;
    }
    return { days: arr, streak: s };
  }, [entries, i18n.language]);

  const max = Math.max(...days.map((d) => d.count), 1);

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
    <div className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm">
      <StreakCake3D streak={streak} />
      <div className="flex-1 min-w-0">
        {streakMain ? (
          <div>
            <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 leading-snug">{streakMain}</p>
            <p className="text-xs text-amber-400 dark:text-amber-300 leading-snug">{streakSub}</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 leading-snug">
              {t("dashboard.noStreak")}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{t("dashboard.noStreakSub")}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-end gap-[3px] h-8">
          {days.map((d, i) => {
            const heightPct = d.count > 0 ? Math.max((d.count / max) * 100, 22) : 0;
            return (
              <div
                key={i}
                className={`w-3 rounded-sm transition-all duration-300 ${d.count > 0 ? "bg-emerald-400 dark:bg-emerald-400" : "bg-gray-300 dark:bg-gray-600/40"}`}
                style={{ height: d.count > 0 ? `${heightPct}%` : "3px" }}
              />
            );
          })}
        </div>
        <div className="flex gap-[3px]">
          {days.map((d, i) => (
            <div key={i} className="w-3 flex justify-center">
              <span
                className={`text-[9px] font-medium leading-none select-none ${
                  d.isToday
                    ? "text-emerald-500 dark:text-emerald-400 font-bold"
                    : d.count > 0
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
  flashCount,
}: {
  streak: number;
  todayCount: number;
  flashCount: number;
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
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <StreakCake3D streak={streak} />
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
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{flashCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">
              {t("dashboard.statPractice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Desktop weekly activity bar ───────────────────────────────────────────

function DesktopWeeklyActivity({ entries }: { entries: Entry[] }) {
  const { t, i18n } = useTranslation();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const from = daysAgo(6 - i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const count = entries.filter((e) => {
        const time = new Date(e.createdAt).getTime();
        return time >= from.getTime() && time < to.getTime();
      }).length;
      const letter = from.toLocaleDateString(i18n.language, { weekday: "narrow" });
      return { count, letter, isToday: i === 6 };
    });
  }, [entries, i18n.language]);

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("dashboard.weeklyActivity")}</p>
      <div className="flex items-end gap-2 flex-1" style={{ minHeight: "80px" }}>
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  d.count > 0
                    ? d.isToday
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-emerald-400 dark:bg-emerald-500"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
                style={{ height: d.count > 0 ? `${Math.max((d.count / max) * 100, 15)}%` : "4px" }}
              />
            </div>
            <span
              className={`text-[10px] font-medium select-none ${
                d.isToday
                  ? "text-emerald-500 dark:text-emerald-400 font-bold"
                  : d.count > 0
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

// ── Desktop badge placeholder ─────────────────────────────────────────────

function DesktopBadgePlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm min-h-[110px]">
      <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700/60 rounded-xl flex items-center justify-center">
        <FiAward size={22} className="text-gray-400 dark:text-gray-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("dashboard.badgesComingSoon")}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("dashboard.badgesComingSoonSub")}</p>
      </div>
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
  const [showAddForm, setShowAddForm] = useState(false);
  const { addEntry } = useEntryCrud();

  async function handleAdd(values: EntryFormValues) {
    const { tagIds, imgFile, removeImg: _, ...entryData } = values;
    await addEntry({ ...entryData, tags: [] }, tagIds, imgFile ?? undefined);
    setShowAddForm(false);
  }

  const streak = useMemo(() => {
    const dayCounts = Array.from({ length: 7 }, (_, i) => {
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
      if (dayCounts[i] > 0) s++;
      else if (i === 6) continue;
      else break;
    }
    return s;
  }, [entries]);

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
    <div className="flex flex-col gap-4 sm:gap-6">
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

      {/* ── Desktop row 1: streak + weekly activity + next badge ── */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        <DesktopStreakBlock streak={streak} todayCount={stats.todayCount} flashCount={stats.flashCount} />
        <DesktopWeeklyActivity entries={entries} />
        <DesktopBadgePlaceholder />
      </div>

      {/* ── Weekly activity chip — mobile only ── */}
      <div className="sm:hidden">
        <WeeklyActivityChip entries={entries} />
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
        <div className="fixed inset-0 z-50 overflow-y-auto sm:hidden">
          <EntryForm mode="create" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}
    </div>
  );
}

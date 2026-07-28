import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBookOpen, FiPlusCircle, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
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
      {/* drop shadow */}
      <ellipse cx={cx} cy={cy + depth + ry + 2} rx={rx - 4} ry={4} fill="rgba(0,0,0,0.12)" />
      {/* bottom cap */}
      <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry} className="fill-gray-200 dark:fill-gray-600" />
      {/* side walls back-to-front */}
      {sideSectors.map((s) => (
        <polygon
          key={`w${s.i}`}
          points={s.sidePoints!}
          className={s.filled ? "fill-amber-600 dark:fill-amber-700" : "fill-gray-300 dark:fill-gray-500"}
        />
      ))}
      {/* top sectors */}
      {sectors.map((s) => (
        <path
          key={`t${s.i}`}
          d={s.topPath}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.7"
          className={s.filled ? "fill-amber-400 dark:fill-amber-500" : "fill-gray-200 dark:fill-gray-600"}
        />
      ))}
      {/* gloss highlight */}
      {/* <ellipse cx={cx - 10} cy={cy - 7} rx={16} ry={5} fill="rgba(255,255,255,0.28)" /> */}
    </svg>
  );
}

// ── Weekly activity chip ──────────────────────────────────────────────────

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

// ── Desktop stat card ──────────────────────────────────────────────────────

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
      className={`h-full sm:p-6 flex flex-col items-center gap-0.5 sm:gap-1 min-w-0${to ? " hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
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
  // r=15.9155 → circumference ≈ 100, so dasharray maps directly to percentage
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

// ── Mobile category card with circular ring ────────────────────────────────

interface MobileCategoryCardProps {
  label: string;
  count: number;
  total: number;
  hexColor: string;
  mobileBg: string;
  mobileText: string;
  to: string;
  toState: object;
}

function MobileCategoryCard({
  label,
  count,
  total,
  hexColor,
  mobileBg,
  mobileText,
  to,
  toState,
}: MobileCategoryCardProps) {
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

// ── Desktop category row ───────────────────────────────────────────────────

interface CategoryRowProps {
  label: string;
  count: number;
  total: number;
  barColor: string;
  colorWrap: string;
  mobileClasses: string;
}

function CategoryRow({ label, count, total, barColor }: CategoryRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-400 dark:text-gray-500 tabular-nums">
          {count} <span className="text-gray-300 dark:text-gray-600">·</span> {pct}%
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
  const [showAddForm, setShowAddForm] = useState(false);
  const { addEntry } = useEntryCrud();

  async function handleAdd(values: EntryFormValues) {
    const { tagIds, imgFile, removeImg: _, ...entryData } = values;
    await addEntry({ ...entryData, tags: [] }, tagIds, imgFile ?? undefined);
    setShowAddForm(false);
  }

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
    <div className="flex flex-col gap-4 sm:gap-8">
      {/* ── Title row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden sm:block text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("dashboard.title")}
          </h1>
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
        <StatCard
          label={t("dashboard.statAvgRating")}
          value={stats.avgRating}
          color="text-amber-500"
          to="/practice"
          sub={t("dashboard.statAvgRatingSub")}
        />
      </div>

      {/* ── Category rings — mobile (5 circular cards) ── */}
      <div className="flex gap-1 sm:hidden mb-8">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 px-1">{t("dashboard.noEntries")}</p>
        ) : (
          CATEGORY_STYLES.map(({ key, hexColor, mobileBg, mobileText }) => (
            <MobileCategoryCard
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

      {/* ── Rapid review ── */}
      <RapidReviewCard entries={entries} />

      {/* ── Desktop: category distribution + recent entries ── */}
      <div className="hidden sm:flex flex-row gap-8 items-start">
        {/* Category distribution */}
        <Card className="flex-1">
          <CardHeader className="mb-4">
            <CardTitle>{t("dashboard.categoryDistribution")}</CardTitle>
          </CardHeader>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noEntries")}</p>
          ) : (
            <div className="flex flex-col gap-4">
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

        {/* Recent entries */}
        <Card className="flex-1">
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

      {/* Add entry overlay — mobile, opened via FiPlusCircle icon tap */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto sm:hidden">
          <EntryForm mode="create" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { EntryCategory } from "@/features/entries/types";

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

const CATEGORIES: Array<{ key: EntryCategory; label: string; color: string }> = [
  { key: "word", label: "Words", color: "bg-blue-500" },
  { key: "phrase", label: "Phrases", color: "bg-green-500" },
  { key: "grammar", label: "Grammar", color: "bg-purple-500" },
  { key: "idiom", label: "Idioms", color: "bg-orange-500" },
  { key: "note", label: "Notes", color: "bg-teal-500" },
];

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
      className={` h-full p-2 sm:p-6 flex flex-col items-center gap-0.5 sm:gap-1 min-w-0${to ? " hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
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
}

function CategoryRow({ label, count, total, barColor }: CategoryRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-0.5 sm:gap-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Your language learning at a glance</p>
        </div>
        {/* Quick actions — desktop */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <Link to="/entries" state={{ openCreateForm: true }}>
            <Button>+ Add New Entry</Button>
          </Link>
          <Link to="/entries">
            <Button variant="secondary">Browse Entries</Button>
          </Link>
          <Link to="/practice">
            <Button variant="secondary">Practice</Button>
          </Link>
        </div>

        {/* FAB — mobile */}

        <Link
          to="/entries"
          state={{ openCreateForm: true }}
          className="sm:hidden fixed top-[115px] right-4 z-50 w-11 h-11 rounded-full bg-emerald-600 flex items-center
                     justify-center text-white hover:bg-emerald-700
                     active:scale-95 transition-transform shadow-md"
          style={{ right: 17 }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
        </Link>
      </div>

      {/* ── Stats — mobile (3-col grid) ── */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <StatCard label="Total Entries" value={entries.length} color="text-emerald-600" to="/entries" />
        <StatCard
          label="Added Today"
          value={stats.todayCount}
          color="text-emerald-600"
          to="/entries"
          toState={{ dateFilter: "today" }}
        />
        <StatCard
          label="This Week"
          value={stats.weekCount}
          color="text-cyan-600"
          to="/entries"
          toState={{ dateFilter: "week" }}
        />
      </div>
      {/* ── Stats — desktop grid ── */}
      <div className="hidden sm:grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <StatCard label="Total Entries" value={entries.length} color="text-blue-600" to="/entries" />
        <StatCard
          label="Added Today"
          value={stats.todayCount}
          color="text-green-600"
          to="/entries"
          toState={{ dateFilter: "today" }}
        />
        <StatCard
          label="This Week"
          value={stats.weekCount}
          color="text-cyan-600"
          to="/entries"
          toState={{ dateFilter: "week" }}
          sub="last 7 days"
        />
        <StatCard label="Practice" value={stats.flashCount} color="text-violet-600" to="/practice" />
        <StatCard label="Avg Rating" value={stats.avgRating} color="text-amber-500" to="/practice" sub="out of 5" />
      </div>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-start">
        {/* ── Category distribution ── */}
        <Card className="sm:flex-1">
          <CardHeader className="mb-2 sm:mb-4">
            <CardTitle className="text-sm sm:text-lg">Category Distribution</CardTitle>
          </CardHeader>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No entries yet.</p>
          ) : (
            <div className="flex flex-col gap-1 sm:gap-4">
              {CATEGORIES.map(({ key, label, color }) => (
                <CategoryRow
                  key={key}
                  label={label}
                  count={categoryCounts[key] ?? 0}
                  total={entries.length}
                  barColor={color}
                />
              ))}
            </div>
          )}
        </Card>

        {/* ── Recent entries ── */}
        <Card className="sm:flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Entries</CardTitle>
              <Link to="/entries" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No entries yet.</p>
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
    </div>
  );
}

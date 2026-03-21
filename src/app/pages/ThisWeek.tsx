import React from 'react';
import { Link } from 'react-router';
import { addDays, format, startOfWeek, endOfWeek, isThisWeek, subWeeks } from 'date-fns';
import { ArrowRight, CalendarDays, CheckSquare, Crown, PenLine } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useApp, type LogEntry } from '../context/AppContext';
import { QuickLogBar } from '../components/QuickLogBar';
import { LogEntryCard } from '../components/LogEntryCard';
import { HomeworkItemComponent } from '../components/HomeworkItemComponent';
import { EmptyState } from '../components/EmptyState';
import { getErrorMessage } from '../lib/api';

const DAILY_MOOD_MARKER = '__daily_mood_checkin__';

const moodOptions = [
  { emoji: '😞', label: 'Rough', score: 1 },
  { emoji: '😕', label: 'Low', score: 2 },
  { emoji: '😐', label: 'Okay', score: 3 },
  { emoji: '🙂', label: 'Good', score: 4 },
  { emoji: '😄', label: 'Great', score: 5 },
];

function isDailyMoodEntry(entry: LogEntry) {
  return entry.prepNote === DAILY_MOOD_MARKER;
}

function moodMetaByScore(score: number) {
  return moodOptions.find(option => option.score === score) ?? moodOptions[2];
}

export function ThisWeek() {
  const {
    sessionEntries,
    sessionArchivedEntries,
    loadArchivedEntries,
    sessionHomework,
    activeSessionDate,
    addEntry,
    updateEntry,
    plan,
    selectPlan,
  } = useApp();
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [isSavingMood, setIsSavingMood] = React.useState(false);
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  React.useEffect(() => {
    void loadArchivedEntries();
  }, [loadArchivedEntries]);

  React.useEffect(() => {
    if (!archiveOpen) return;
    void loadArchivedEntries();
  }, [archiveOpen, loadArchivedEntries]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const allSessionLogs = [...sessionEntries, ...sessionArchivedEntries];

  const moodEntryByDay = React.useMemo(() => {
    const byDay = new Map<string, LogEntry>();

    for (const entry of allSessionLogs) {
      if (!isDailyMoodEntry(entry)) continue;
      const dayKey = format(entry.timestamp, 'yyyy-MM-dd');
      const existing = byDay.get(dayKey);
      if (!existing || existing.timestamp.getTime() < entry.timestamp.getTime()) {
        byDay.set(dayKey, entry);
      }
    }

    return byDay;
  }, [allSessionLogs]);

  const todayKey = format(now, 'yyyy-MM-dd');
  const todayMoodEntry = moodEntryByDay.get(todayKey) ?? null;

  const moodTrendData = React.useMemo(() => (
    Array.from({ length: 14 }, (_, index) => {
      const date = addDays(now, index - 13);
      const key = format(date, 'yyyy-MM-dd');
      const entry = moodEntryByDay.get(key);
      const moodMeta = entry ? moodMetaByScore(entry.intensity) : null;
      return {
        date,
        label: format(date, 'MMM d'),
        short: format(date, 'EEE'),
        score: entry?.intensity ?? null,
        moodLabel: moodMeta?.label ?? 'No check-in',
      };
    })
  ), [moodEntryByDay, now]);

  const weeklyAverageData = React.useMemo(() => {
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

    return Array.from({ length: 8 }, (_, index) => {
      const weekStartDate = subWeeks(currentWeekStart, 7 - index);
      const weekEndDate = addDays(weekStartDate, 6);
      const weekMoods = Array.from(moodEntryByDay.values()).filter(entry => {
        const ts = entry.timestamp.getTime();
        return ts >= weekStartDate.getTime() && ts <= weekEndDate.getTime();
      });

      const average = weekMoods.length > 0
        ? Number((weekMoods.reduce((sum, entry) => sum + entry.intensity, 0) / weekMoods.length).toFixed(1))
        : null;

      return {
        weekLabel: format(weekStartDate, 'MMM d'),
        weekRange: `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d')}`,
        average,
        count: weekMoods.length,
      };
    });
  }, [moodEntryByDay, now]);

  const nonMoodEntries = sessionEntries.filter(entry => !isDailyMoodEntry(entry));
  const archivedNonMoodEntries = sessionArchivedEntries.filter(entry => !isDailyMoodEntry(entry));

  const thisWeekEntries = nonMoodEntries
    .filter(e => isThisWeek(e.timestamp, { weekStartsOn: 1 }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const activeHomework = sessionHomework.filter(h => !h.completed).slice(0, 3);
  const prepCount = nonMoodEntries.filter(e => e.addedToPrep).length;

  const daysUntilSession = Math.ceil(
    (activeSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const sessionLabel =
    daysUntilSession > 0
      ? `${daysUntilSession} day${daysUntilSession !== 1 ? 's' : ''} until session`
      : daysUntilSession === 0
        ? 'Today'
        : `${Math.abs(daysUntilSession)} day${Math.abs(daysUntilSession) !== 1 ? 's' : ''} ago`;

  const todayMoodMeta = todayMoodEntry ? moodMetaByScore(todayMoodEntry.intensity) : null;

  const handleDailyMoodSelect = async (score: number) => {
    if (isSavingMood) return;

    const mood = moodMetaByScore(score);
    const moodText = `Daily mood check-in: ${mood.emoji} ${mood.label}`;
    setIsSavingMood(true);
    try {
      if (todayMoodEntry) {
        updateEntry(todayMoodEntry.id, {
          text: moodText,
          type: 'thought',
          intensity: score,
          addedToPrep: false,
          prepNote: DAILY_MOOD_MARKER,
          checkedOff: false,
        });
        toast("Today's mood updated.", { duration: 2000 });
      } else {
        const added = await addEntry({
          text: moodText,
          type: 'thought',
          intensity: score,
          addedToPrep: false,
          prepNote: DAILY_MOOD_MARKER,
          checkedOff: false,
        });
        if (!added) {
          toast('Free plan limit reached (30 logs/month). Upgrade to Pro for unlimited logs.', { duration: 3000 });
          return;
        }
        toast("Today's mood logged.", { duration: 2000 });
      }
    } catch (error) {
      toast(getErrorMessage(error, "Unable to save today's mood. Please try again."), { duration: 3000 });
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleUpgrade = async () => {
    if (isUpgrading) return;

    setIsUpgrading(true);
    try {
      await selectPlan('PRO');
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to start checkout right now.'), { duration: 3000 });
      setIsUpgrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-foreground mb-1">This Week</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-muted-foreground text-[14px]">
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
              </span>
              <span className="text-[12px] text-terracotta" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {thisWeekEntries.length} thing{thisWeekEntries.length !== 1 ? 's' : ''} logged this week
              </span>
            </div>
          </div>

          {/* Quick Log */}
          <div className="mb-6">
            <QuickLogBar />
          </div>

          {/* Feed */}
          <div data-tour-target="logs-history">
            {thisWeekEntries.length > 0 ? (
              <div className="space-y-3">
                {thisWeekEntries.map(entry => (
                  <LogEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyState
                headline="Nothing logged yet this week."
                subtext="Something happen today? Start with whatever's in your head right now."
              />
            )}
          </div>

          <div className="mt-8 border-t border-border pt-4">
            <button
              onClick={() => setArchiveOpen(prev => !prev)}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {archiveOpen ? 'Hide Archive' : 'Archive (older than 2 weeks)'}
            </button>
            {archiveOpen && (
              <div className="mt-3 space-y-3">
                {archivedNonMoodEntries.length > 0 ? (
                  archivedNonMoodEntries.map(entry => <LogEntryCard key={entry.id} entry={entry} />)
                ) : (
                  <p className="text-[13px] text-muted-foreground">No archived logs yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* Upcoming Session */}
          <div data-tour-target="manage-sessions" className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
              <h4 className="text-foreground">Upcoming Session</h4>
            </div>
            <p className="text-muted-foreground text-[14px] mb-1">
              {format(activeSessionDate, 'EEEE, MMM d · h:mmaaa')}
            </p>
            <p className="text-[13px] text-muted-foreground mb-3">
              {sessionLabel}
            </p>
            <div className="flex items-center gap-2 text-[13px] text-sage mb-4">
              <span>{prepCount} thing{prepCount !== 1 ? 's' : ''} to discuss</span>
            </div>
            <div className="space-y-2">
              <Link
                to="/app/next-session"
                className="flex items-center justify-center gap-2 w-full py-2 border border-border rounded-md text-[13px] text-foreground hover:bg-secondary transition-colors"
              >
                Review your session prep <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/app/post-session"
                className="flex items-center justify-center gap-2 w-full py-2 text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
              >
                <PenLine className="w-3.5 h-3.5" /> Write post-session notes
              </Link>
            </div>
          </div>

          {/* Homework */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                <h4 className="text-foreground">This week's homework</h4>
              </div>
              <Link to="/app/homework" className="text-[12px] text-terracotta hover:underline">
                See all
              </Link>
            </div>
            {activeHomework.length > 0 ? (
              <div className="space-y-1">
                {activeHomework.map(item => (
                  <HomeworkItemComponent key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-[13px] py-2">No homework right now.</p>
            )}
          </div>

          {/* Weekly mood */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-foreground">How are you doing today?</h4>
              {todayMoodMeta ? (
                <span className="text-[12px] text-terracotta" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {todayMoodMeta.emoji} {todayMoodMeta.label}
                </span>
              ) : (
                <span className="text-[12px] text-muted-foreground">No check-in yet</span>
              )}
            </div>
            <div className="flex items-center justify-between px-1">
              {moodOptions.map(mood => (
                <button
                  key={mood.score}
                  onClick={() => { void handleDailyMoodSelect(mood.score); }}
                  disabled={isSavingMood}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-150 ${
                    todayMoodEntry?.intensity === mood.score
                      ? 'bg-terracotta/10 scale-110'
                      : 'hover:bg-secondary hover:scale-105'
                  } ${isSavingMood ? 'opacity-60 cursor-not-allowed' : ''}`}
                  aria-label={mood.label}
                >
                  <span className="text-[24px]">{mood.emoji}</span>
                  <span className={`text-[10px] transition-colors ${
                    todayMoodEntry?.intensity === mood.score ? 'text-terracotta' : 'text-muted-foreground'
                  }`}>{mood.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[12px] text-muted-foreground mb-2">Daily mood trend (last 14 days)</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="short"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--foreground)',
                      }}
                      formatter={(value: number | string) => {
                        if (typeof value !== 'number') return [value, 'Mood'];
                        return [moodMetaByScore(value).label, 'Mood'];
                      }}
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload as { label: string; moodLabel: string } | undefined;
                        if (!point) return '';
                        return `${point.label} · ${point.moodLabel}`;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#C17A5A"
                      strokeWidth={2}
                      connectNulls={false}
                      dot={{ fill: '#C17A5A', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[12px] text-muted-foreground mb-2">Weekly average mood (last 8 weeks)</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAverageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 3, 5]}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--foreground)',
                      }}
                      formatter={(value: number | string) => {
                        if (typeof value !== 'number') return [value, 'Weekly average'];
                        return [value.toFixed(1), 'Weekly average'];
                      }}
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload as { weekRange: string; count: number } | undefined;
                        if (!point) return '';
                        return `${point.weekRange} · ${point.count} check-in${point.count !== 1 ? 's' : ''}`;
                      }}
                    />
                    <Bar dataKey="average" fill="#4A6741" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div data-tour-target="upgrade-pro" className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00c8ff]/12 flex items-center justify-center text-[#00c8ff] flex-shrink-0">
                <Crown className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-foreground">Pro insights</h4>
                <p className="text-muted-foreground text-[13px] mt-1">
                  Unlock pattern recognition, deeper trends, and richer insight summaries.
                </p>
              </div>
            </div>
            {plan !== 'PRO' ? (
              <button
                onClick={() => { void handleUpgrade(); }}
                disabled={isUpgrading}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00c8ff] px-4 py-2.5 text-[13px] font-medium text-[#03131A] transition-colors hover:bg-[#55d9ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            ) : (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#00c8ff]/35 bg-[#00c8ff]/8 px-3 py-2 text-[12px] text-[#9beeff]">
                <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
                Pro already unlocked
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

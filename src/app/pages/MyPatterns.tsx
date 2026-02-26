import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { Lock, Award } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MyPatterns() {
  const { planBenefits, entries, archivedEntries, sessions, homework } = useApp();
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);
  const allEntries = [...entries, ...archivedEntries];
  const wins = allEntries
    .filter(item => item.type === 'win')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
  const completedSessions = sessions
    .filter(session => session.completed)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const triggerMapData = Array.from({ length: 90 }, (_, i) => {
    const date = subDays(new Date(), 89 - i);
    const triggers = allEntries.filter(entry => entry.type === 'trigger' && isSameDay(entry.timestamp, date));
    const maxIntensity = triggers.length > 0 ? Math.max(...triggers.map(entry => entry.intensity)) : 0;

    return {
      date,
      dateStr: format(date, 'MMM d'),
      intensity: maxIntensity,
      dayLabel: format(date, 'EEE'),
    };
  });

  const recurringThemeMap = completedSessions.reduce((acc, session) => {
    session.topics.forEach(topic => {
      acc[topic] = (acc[topic] ?? 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const recurringThemes = Object.entries(recurringThemeMap)
    .map(([topic, count]) => ({
      topic,
      count,
      total: Math.max(completedSessions.length, 1),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const homeworkCompletionData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.getMonth();
    const year = date.getFullYear();
    const items = homework.filter(item => item.sessionDate.getMonth() === month && item.sessionDate.getFullYear() === year);
    const done = items.filter(item => item.completed).length;
    const rate = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
    return {
      month: format(date, 'MMM'),
      rate,
    };
  });

  const moodTimelineData = completedSessions.slice(-6).map(session => ({
    session: `#${session.number}`,
    mood: session.postMood,
    date: format(session.date, 'MMM d'),
  }));

  if (!planBenefits.hasPatternInsights) {
    return <ProOverlay />;
  }

  const triggerCount = triggerMapData.filter(d => d.intensity > 0).length;
  const recentTriggers = triggerMapData.slice(-timeRange);

  // Compute weeks for the grid
  const weeks: typeof recentTriggers[] = [];
  for (let i = 0; i < recentTriggers.length; i += 7) {
    weeks.push(recentTriggers.slice(i, i + 7));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <h1 className="text-foreground mb-1">My Patterns</h1>
        <p className="text-muted-foreground text-[14px]">
          What keeps showing up. This isn't a diagnosis — just patterns worth noticing.
        </p>
      </div>

      {/* Section A: Trigger Map */}
      <section className="mb-10">
        <SectionHeader
          title="Trigger Map"
          action={
            <div className="flex gap-1">
              {([30, 60, 90] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded text-[12px] transition-colors ${
                    timeRange === range ? 'bg-terracotta/15 text-terracotta' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
          }
        />
        <div className="bg-card border border-border rounded-lg p-5">
          {/* Grid */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const colors = [
                    'bg-secondary',
                    'bg-sage/30',
                    'bg-sage/50',
                    'bg-terracotta/40',
                    'bg-terracotta/60',
                    'bg-terracotta',
                  ];
                  return (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-sm ${colors[day.intensity]} transition-colors cursor-default`}
                      title={`${format(day.date, 'MMM d')}: ${day.intensity > 0 ? `intensity ${day.intensity}` : 'no entries'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-[13px]">
            You've logged {triggerCount} trigger{triggerCount !== 1 ? 's' : ''} in the last {timeRange} days.
          </p>
        </div>
      </section>

      {/* Section B: Recurring Themes */}
      <section className="mb-10">
        <SectionHeader title="Recurring Themes" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="space-y-3">
            {recurringThemes.map(theme => (
              <div key={theme.topic} className="flex items-center gap-3">
                <span className="w-28 text-[14px] text-foreground">{theme.topic}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta rounded-full transition-all"
                    style={{ width: `${(theme.count / theme.total) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] text-muted-foreground w-16 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {theme.count}/{theme.total}
                </span>
              </div>
            ))}
          </div>
          {recurringThemes.length > 0 && (
            <p className="text-muted-foreground text-[13px] mt-4 pt-3 border-t border-border">
              Most frequent topic: "{recurringThemes[0].topic}" in {recurringThemes[0].count} session{recurringThemes[0].count !== 1 ? 's' : ''}.
            </p>
          )}
        </div>
      </section>

      {/* Section C: Homework Completion Trend */}
      <section className="mb-10">
        <SectionHeader title="Homework Completion" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={homeworkCompletionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--foreground)',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Completion']}
                />
                <Bar dataKey="rate" fill="#C17A5A" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted-foreground text-[13px] mt-3 pt-3 border-t border-border">
            Your completion rate has improved from 40% to 75% over 3 months.
          </p>
        </div>
      </section>

      {/* Section D: Session Mood Timeline */}
      <section className="mb-10">
        <SectionHeader title="Session Mood Timeline" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="session" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false} tickLine={false}
                  domain={[1, 10]}
                  ticks={[1, 3, 5, 7, 10]}
                  tickFormatter={(v) => v <= 3 ? 'Drained' : v <= 5 ? '' : v <= 7 ? '' : 'Energized'}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--foreground)',
                  }}
                  formatter={(value: number) => [value <= 3 ? 'Drained' : value <= 5 ? 'Neutral' : value <= 7 ? 'Good' : 'Energized', 'Mood']}
                  labelFormatter={(label) => {
                    const item = moodTimelineData.find(d => d.session === label);
                    return item ? `Session ${label} · ${item.date}` : label;
                  }}
                />
                <Line type="monotone" dataKey="mood" stroke="#C17A5A" strokeWidth={2} dot={{ fill: '#C17A5A', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section E: Wins Log */}
      <section className="mb-10">
        <SectionHeader
          title="Wins Log"
          action={<Award className="w-5 h-5 text-gold" strokeWidth={1.5} />}
        />
        {wins.length > 0 ? (
          <div className="space-y-2">
            {wins.map((win, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-foreground text-[14px] leading-relaxed">{win.text}</p>
                  <span className="text-[11px] text-muted-foreground mt-1 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {format(win.timestamp, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            headline="No wins logged yet."
            subtext="They count. Tag them when they happen."
            icon={<Award className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />}
          />
        )}
      </section>
    </div>
  );
}

function ProOverlay() {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8 relative">
      <div className="mb-8">
        <h1 className="text-foreground mb-1">My Patterns</h1>
        <p className="text-muted-foreground text-[14px]">See what keeps coming up.</p>
      </div>

      {/* Blurred content */}
      <div className="relative">
        <div className="filter blur-md pointer-events-none select-none opacity-60">
          <div className="bg-card border border-border rounded-lg p-5 mb-6 h-48" />
          <div className="bg-card border border-border rounded-lg p-5 mb-6 h-64" />
          <div className="bg-card border border-border rounded-lg p-5 mb-6 h-48" />
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-8 text-center max-w-sm shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gold" strokeWidth={1.5} />
            </div>
            <h3 className="text-foreground mb-2">Unlock Patterns</h3>
            <p className="text-muted-foreground text-[14px] mb-4 leading-relaxed">
              See your triggers, themes, homework trends, and mood over time. Patterns take a few weeks to appear — keep logging and they'll show up here.
            </p>
            <button className="px-6 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all active:translate-y-px">
              Upgrade to Pro — $6/month
            </button>
            <p className="text-[11px] text-muted-foreground mt-3">
              or $48/year · cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router';
import { format, startOfWeek, endOfWeek, isThisWeek } from 'date-fns';
import { ArrowRight, CalendarDays, CheckSquare, PenLine } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuickLogBar } from '../components/QuickLogBar';
import { LogEntryCard } from '../components/LogEntryCard';
import { HomeworkItemComponent } from '../components/HomeworkItemComponent';
import { EmptyState } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';

export function ThisWeek() {
  const { entries, archivedEntries, loadArchivedEntries, homework, settings, weeklyMood, setWeeklyMood } = useApp();
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  React.useEffect(() => {
    if (!archiveOpen) return;
    void loadArchivedEntries();
  }, [archiveOpen, loadArchivedEntries]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeekEntries = entries
    .filter(e => isThisWeek(e.timestamp, { weekStartsOn: 1 }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const activeHomework = homework.filter(h => !h.completed).slice(0, 3);
  const prepCount = entries.filter(e => e.addedToPrep).length;

  const daysUntilSession = Math.ceil(
    (settings.nextSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const moods = ['😞', '😐', '🙂', '😄'];
  const moodLabels = ['Rough', 'Okay', 'Good', 'Great'];

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
          <div>
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
                {archivedEntries.length > 0 ? (
                  archivedEntries.map(entry => <LogEntryCard key={entry.id} entry={entry} />)
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
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
              <h4 className="text-foreground">Upcoming Session</h4>
            </div>
            <p className="text-muted-foreground text-[14px] mb-1">
              {format(settings.nextSessionDate, 'EEEE, MMM d · h:mmaaa')}
            </p>
            <p className="text-[13px] text-muted-foreground mb-3">
              {daysUntilSession > 0 ? `${daysUntilSession} day${daysUntilSession !== 1 ? 's' : ''} until session` : 'Today'}
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
            <h4 className="text-foreground mb-3">How are you doing this week?</h4>
            <div className="flex items-center justify-between px-2">
              {moods.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setWeeklyMood(m)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-150 ${
                    weeklyMood === m
                      ? 'bg-terracotta/10 scale-110'
                      : 'hover:bg-secondary hover:scale-105'
                  }`}
                  aria-label={moodLabels[i]}
                >
                  <span className="text-[28px]">{m}</span>
                  <span className={`text-[10px] transition-colors ${
                    weeklyMood === m ? 'text-terracotta' : 'text-muted-foreground'
                  }`}>{moodLabels[i]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

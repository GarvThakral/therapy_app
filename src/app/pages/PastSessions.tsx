import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Search, Filter, FileDown, Pencil, X, CalendarClock, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TopicChip } from '../components/TagChip';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import type { TopicTag, Session } from '../context/AppContext';
import { getErrorMessage } from '../lib/api';

const allTopics: TopicTag[] = [
  'Anxiety', 'Family', 'Relationships', 'Work', 'Self-esteem',
  'Grief', 'Identity', 'Patterns', 'Communication', 'Trauma', 'Boundaries',
];

function moodLabel(val: number) {
  if (val <= 3) return 'Drained';
  if (val <= 5) return 'Neutral';
  if (val <= 7) return 'Good';
  return 'Energized';
}

function moodToneClasses(val: number) {
  if (val <= 3) return 'text-red-700 bg-red-100 border-red-200';
  if (val <= 5) return 'text-amber-700 bg-amber-100 border-amber-200';
  if (val <= 7) return 'text-sage bg-sage/15 border-sage/30';
  return 'text-emerald-700 bg-emerald-100 border-emerald-200';
}

export function PastSessions() {
  const { sessions, updateSession } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<TopicTag | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const completedSessions = sessions.filter(s => s.completed);

  const filteredSessions = completedSessions
    .filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.whatStoodOut.toLowerCase().includes(q) ||
          s.topics.some(t => t.toLowerCase().includes(q)) ||
          s.moodWord.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(s => {
      if (filterTopic) return s.topics.includes(filterTopic);
      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const averageMood = filteredSessions.length > 0
    ? Number((filteredSessions.reduce((sum, session) => sum + session.postMood, 0) / filteredSessions.length).toFixed(1))
    : null;

  const recurringTopics = filteredSessions.reduce<Record<string, number>>((acc, session) => {
    session.topics.forEach(topic => {
      acc[topic] = (acc[topic] ?? 0) + 1;
    });
    return acc;
  }, {});
  const topTopic = Object.entries(recurringTopics).sort((a, b) => b[1] - a[1])[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: 'radial-gradient(120% 80% at 0% 0%, rgba(193, 122, 90, 0.12), transparent 56%)',
          }}
        />

        <div className="relative p-5 lg:p-6">
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/25 bg-terracotta/10 px-2.5 py-1 text-[11px] text-terracotta">
              <Sparkles className="h-3.5 w-3.5" />
              Session history
            </div>
            <h1 className="text-foreground mt-3 mb-1">Past Sessions</h1>
            <p className="text-muted-foreground text-[14px]">
              Browse your archived sessions, revisit insights, and track how your patterns evolve over time.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Total archived
              </p>
              <p className="text-foreground text-[16px]">{completedSessions.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Showing now</p>
              <p className="text-foreground text-[16px]">{filteredSessions.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Avg mood
              </p>
              <p className="text-foreground text-[16px]">
                {averageMood ? `${averageMood}/10` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Top topic</p>
              <p className="text-foreground text-[16px] truncate">
                {topTopic ? topTopic[0] : '—'}
              </p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes, topics, or mood words..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] transition-colors ${
                filterTopic || showFilters
                  ? 'border-terracotta/40 text-terracotta bg-terracotta/5'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {filterTopic && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFilterTopic(null); }}
                  className="ml-1 p-0.5 rounded-full hover:bg-terracotta/20"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterTopic(null)}
                className={`text-[12px] px-2.5 py-1 rounded-full transition-colors ${
                  !filterTopic ? 'bg-terracotta/15 text-terracotta' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {allTopics.map(topic => (
                <TopicChip
                  key={topic}
                  topic={topic}
                  selected={filterTopic === topic}
                  onClick={() => setFilterTopic(filterTopic === topic ? null : topic)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session list */}
      {filteredSessions.length > 0 ? (
        <div className="relative">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/80" />
          <div className="space-y-3">
            {filteredSessions.map(session => (
              <div key={session.id} className="relative pl-5">
                <span className="absolute left-0 top-7 h-3 w-3 rounded-full border border-terracotta/40 bg-terracotta/25" />
                <SessionCard
                  session={session}
                  expanded={expandedId === session.id}
                  onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  onEdit={async (nextText) => {
                    await updateSession(session.id, { whatStoodOut: nextText });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : completedSessions.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <Search className="w-10 h-10 text-muted-foreground/40 mb-4" strokeWidth={1.5} />
          <p className="text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px' }}>
            No sessions match your search.
          </p>
          <p className="text-muted-foreground text-[14px] mb-4">
            Try different keywords or clear your filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterTopic(null); }}
            className="text-[13px] text-terracotta hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <EmptyState
          headline="No sessions archived yet."
          subtext="After your first session, your notes will live here."
        />
      )}
    </div>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
  onEdit,
}: {
  session: Session;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (nextText: string) => Promise<void>;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-muted-foreground/35 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-terracotta" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-foreground text-[15px]">
              {format(session.date, 'EEEE, MMM d, yyyy')}
            </span>
            <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              #{session.number}
            </span>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {session.endDate ? `ended ${format(session.endDate, 'MMM d, yyyy')}` : 'current'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {session.topics.length > 0 ? session.topics.map(topic => (
              <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full border border-border/80 bg-background text-muted-foreground">
                {topic}
              </span>
            )) : (
              <span className="text-[11px] text-muted-foreground">No topics tagged</span>
            )}
          </div>
          {!expanded && (
            <p className="text-muted-foreground text-[13px] mt-1.5 truncate">
              {session.whatStoodOut ? `${session.whatStoodOut.slice(0, 110)}...` : 'No notes saved for this session yet.'}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${moodToneClasses(session.postMood)}`}>
            {session.postMood}/10 · {moodLabel(session.postMood)}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
            <h4 className="text-foreground mb-2 text-[14px]">What stood out</h4>
            <p className="text-foreground text-[14px] leading-relaxed whitespace-pre-wrap">
              {session.whatStoodOut || 'No notes saved.'}
            </p>
          </div>

          {session.prepItems.length > 0 && (
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <h4 className="text-foreground mb-2 text-[14px]">Session prep</h4>
              <ul className="space-y-1.5">
                {session.prepItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <svg className="w-3.5 h-3.5 text-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-border bg-background px-4 py-3">
            <h4 className="text-foreground mb-2 text-[14px]">How it felt</h4>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-28 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-terracotta rounded-full transition-all"
                    style={{ width: `${(session.postMood / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] text-muted-foreground">{moodLabel(session.postMood)}</span>
              </div>
              <span className="text-[12px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {session.postMood}/10
              </span>
              {session.moodWord && (
                <span className="text-[12px] text-terracotta italic">"{session.moodWord}"</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                const next = window.prompt('Edit session notes', session.whatStoodOut);
                if (next === null) return;
                void onEdit(next).then(() => {
                  toast('Session updated.', { duration: 2000 });
                }).catch((error) => {
                  toast(getErrorMessage(error, 'Failed to update session.'), { duration: 3000 });
                });
              }}
              className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => {
                const text = `Session #${session.number} — ${format(session.date, 'EEEE, MMMM d, yyyy')}\n\nTopics: ${session.topics.join(', ')}\n\nWhat stood out:\n${session.whatStoodOut}\n\n${session.prepItems.length > 0 ? `Session prep:\n${session.prepItems.map(p => `  - ${p}`).join('\n')}\n\n` : ''}Mood: ${session.postMood}/10 · ${moodLabel(session.postMood)}${session.moodWord ? ` · "${session.moodWord}"` : ''}`;
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `session-${session.number}-${format(session.date, 'yyyy-MM-dd')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast('Session exported.', { duration: 2000 });
              }}
              className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, CheckSquare, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HomeworkItemComponent } from '../components/HomeworkItemComponent';
import { EmptyState } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';

export function MyHomework() {
  const { homework, addHomework } = useApp();
  const [completedOpen, setCompletedOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const activeItems = homework.filter(h => !h.completed);
  const completedItems = homework.filter(h => h.completed);

  // Group active by session date
  const groupedActive = activeItems.reduce((acc, item) => {
    const key = format(item.sessionDate, 'MMM d, yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof activeItems>);

  // Stats
  const thisMonth = homework.filter(h => {
    const now = new Date();
    return h.sessionDate.getMonth() === now.getMonth() && h.sessionDate.getFullYear() === now.getFullYear();
  });
  const thisMonthCompleted = thisMonth.filter(h => h.completed);
  const completionRate = thisMonth.length > 0
    ? Math.round((thisMonthCompleted.length / thisMonth.length) * 100)
    : 0;

  const handleAdd = () => {
    if (!newText.trim()) return;
    addHomework({
      text: newText.trim(),
      sessionId: '',
      sessionDate: new Date(),
      dueDate: undefined,
    });
    setNewText('');
    setAdding(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-foreground mb-1">My Homework</h1>
        <p className="text-muted-foreground text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          This month: {thisMonth.length} assigned, {thisMonthCompleted.length} completed. {completionRate}% follow-through.
        </p>
      </div>

      <section className="mb-6">
        <SectionHeader title="Add Homework" />
        {adding ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Add a homework item..."
              className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/50"
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setAdding(false);
                  setNewText('');
                }
              }}
            />
            <button onClick={handleAdd} className="p-2 text-terracotta hover:text-foreground transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => { setAdding(false); setNewText(''); }} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
          >
            <Plus className="w-4 h-4" /> Add homework item
          </button>
        )}
      </section>

      {/* Active homework */}
      {activeItems.length > 0 ? (
        <div className="space-y-6 mb-10">
          {Object.entries(groupedActive).map(([sessionDate, items]) => (
            <div key={sessionDate}>
              <p className="text-[12px] text-muted-foreground mb-2 px-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                From session on {sessionDate}
              </p>
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {items.map(item => (
                  <HomeworkItemComponent key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-10">
          <EmptyState
            headline="No homework right now."
            subtext="If your therapist assigns something, add it here so you don't forget."
            icon={<CheckSquare className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />}
          />
        </div>
      )}

      {/* Completed homework */}
      {completedItems.length > 0 && (
        <div>
          <button
            onClick={() => setCompletedOpen(!completedOpen)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {completedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-[14px]">Completed ({completedItems.length})</span>
          </button>

          {completedOpen && (
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {completedItems.map(item => (
                <HomeworkItemComponent key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

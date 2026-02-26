import React, { useState } from 'react';
import { format, isThisWeek } from 'date-fns';
import { GripVertical, Plus, X, Check, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { IntensityDots } from '../components/IntensityDots';
import { SectionHeader } from '../components/SectionHeader';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { useActionRateLimit } from '../hooks/useActionRateLimit';

export function NextSession() {
  const { entries, settings, updateEntry, addEntry } = useApp();
  const [newItem, setNewItem] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const { run } = useActionRateLimit(700);

  const handleAddManualItem = async () => {
    if (!newItem.trim()) return;
    try {
      const result = await run(() => addEntry({ text: newItem.trim(), type: 'thought', intensity: 3, addedToPrep: true }, true));
      if (result.blocked) return;
      const added = result.value;
      if (!added) {
        toast('Free plan limit reached (30 logs/month). Upgrade to Pro for unlimited logs.', { duration: 3000 });
        return;
      }
      setNewItem('');
      setAddingItem(false);
      toast('Added to your session prep.', { duration: 2000 });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to save log.', { duration: 3000 });
    }
  };

  const prepItems = entries.filter(e => e.addedToPrep);
  const thisWeekEntries = entries.filter(e => isThisWeek(e.timestamp, { weekStartsOn: 1 }));

  const triggerCount = thisWeekEntries.filter(e => e.type === 'trigger').length;
  const eventCount = thisWeekEntries.filter(e => e.type === 'event').length;
  const winCount = thisWeekEntries.filter(e => e.type === 'win').length;
  const thoughtCount = thisWeekEntries.filter(e => e.type === 'thought').length;

  const handleStartSession = () => {
    setSessionStarted(true);
    toast('Session started. Good luck in there.', {
      duration: 3000,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-1">
          Preparing for {format(settings.nextSessionDate, 'EEEE, MMM d')}
        </h1>
        <p className="text-muted-foreground text-[14px]">
          {format(settings.nextSessionDate, 'h:mmaaa')} · {prepItems.length} item{prepItems.length !== 1 ? 's' : ''} to discuss
        </p>
      </div>

      {/* Section A: What I want to talk about */}
      <section className="mb-10">
        <SectionHeader
          title="What I want to talk about"
          subtitle={`${prepItems.length} items queued from your log`}
        />

        {prepItems.length > 0 ? (
          <div className="space-y-2">
            {prepItems.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-lg p-4 group">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground/40 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {format(item.timestamp, 'EEE, MMM d')}
                      </span>
                      <TagChip type={item.type} />
                    </div>
                    <p className="text-foreground text-[14px] leading-relaxed mb-2">{item.text}</p>
                    {item.prepNote ? (
                      <div className="flex items-start gap-1.5 bg-secondary/50 rounded px-3 py-2 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-[13px] text-muted-foreground italic">{item.prepNote}</p>
                      </div>
                    ) : editingNoteId === item.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Note to self..."
                          className="flex-1 bg-secondary/50 rounded px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-terracotta/30"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && noteText.trim()) {
                              updateEntry(item.id, { prepNote: noteText.trim() });
                              setEditingNoteId(null);
                              setNoteText('');
                            }
                            if (e.key === 'Escape') {
                              setEditingNoteId(null);
                              setNoteText('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (noteText.trim()) {
                              updateEntry(item.id, { prepNote: noteText.trim() });
                            }
                            setEditingNoteId(null);
                            setNoteText('');
                          }}
                          className="p-1 text-sage hover:text-foreground"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingNoteId(null); setNoteText(''); }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNoteId(item.id); setNoteText(''); }}
                        className="text-[12px] text-muted-foreground hover:text-terracotta transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                      >
                        + Add a note to self
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <IntensityDots value={item.intensity} max={5} />
                    {item.checkedOff ? (
                      <div className="w-5 h-5 rounded border-2 border-sage bg-sage flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <button
                        onClick={() => updateEntry(item.id, { checkedOff: true })}
                        className="w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-sage transition-colors"
                        title="Mark as discussed"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-[14px]">
              No items queued yet. Log something on the This Week page and add it to your session prep.
            </p>
          </div>
        )}

        {/* Add manually */}
        <div className="mt-3">
          {addingItem ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="What else do you want to mention?"
                className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/50"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newItem.trim()) {
                    void handleAddManualItem();
                  }
                  if (e.key === 'Escape') {
                    setNewItem('');
                    setAddingItem(false);
                  }
                }}
              />
              <button
                onClick={() => { setNewItem(''); setAddingItem(false); }}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
            >
              <Plus className="w-4 h-4" /> Add something manually
            </button>
          )}
        </div>
      </section>

      {/* Section B: What I've been feeling */}
      <section className="mb-10">
        <SectionHeader title="What I've been feeling this week" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex flex-wrap gap-4 mb-5">
            {triggerCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[13px] text-foreground">{triggerCount} trigger{triggerCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {eventCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-[13px] text-foreground">{eventCount} big event{eventCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {thoughtCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[13px] text-foreground">{thoughtCount} thought{thoughtCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {winCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[13px] text-foreground">{winCount} win{winCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Intensity dots timeline */}
          <div>
            <p className="text-[12px] text-muted-foreground mb-2">This week's intensity</p>
            <div className="flex items-center gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const dayEntries = thisWeekEntries.filter(e => e.timestamp.getDay() === (i === 6 ? 0 : i + 1));
                const maxIntensity = dayEntries.length > 0 ? Math.max(...dayEntries.map(e => e.intensity)) : 0;
                const colors = ['bg-border', 'bg-sage/40', 'bg-sage/60', 'bg-terracotta/50', 'bg-terracotta/70', 'bg-terracotta'];
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded ${colors[maxIntensity]} transition-colors`} title={`${day}: ${maxIntensity}/5`} />
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section C: What I want to get out of this session */}
      <section className="mb-10">
        <SectionHeader title="What I want to get out of this session" />
        <textarea
          value={sessionGoal}
          onChange={e => setSessionGoal(e.target.value)}
          placeholder="What do you need from today?"
          className="w-full bg-card border border-border rounded-lg px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/40 resize-none min-h-[80px] leading-relaxed"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
      </section>

      {/* CTA */}
      <div className="flex justify-center pb-8">
        {sessionStarted ? (
          <div className="text-center">
            <div className="flex items-center gap-2 text-sage mb-1">
              <Check className="w-5 h-5" />
              <span className="text-[15px]">You've got this session covered.</span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Started at {format(new Date(), 'h:mmaaa')}
            </p>
            <Link
              to="/app/post-session"
              className="text-[13px] text-terracotta hover:underline"
            >
              Write post-session notes when you're done →
            </Link>
          </div>
        ) : (
          <button
            onClick={handleStartSession}
            className="px-8 py-3 bg-terracotta text-white rounded-lg text-[15px] hover:bg-terracotta/90 transition-all active:translate-y-px"
          >
            I'm ready. Let's go.
          </button>
        )}
      </div>
    </div>
  );
}

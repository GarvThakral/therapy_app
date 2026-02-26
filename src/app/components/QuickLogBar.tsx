import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { IntensityDots } from './IntensityDots';
import { useApp } from '../context/AppContext';
import type { EntryType } from '../context/AppContext';
import { toast } from 'sonner';
import { useActionRateLimit } from '../hooks/useActionRateLimit';

const typeOptions: { value: EntryType; label: string; emoji: string }[] = [
  { value: 'trigger', label: 'Trigger', emoji: '🔴' },
  { value: 'event', label: 'Big Event', emoji: '🟡' },
  { value: 'thought', label: 'Thought', emoji: '💭' },
  { value: 'win', label: 'Win', emoji: '🟢' },
];

export function QuickLogBar() {
  const { addEntry, monthlyEntryCount, planBenefits, plan } = useApp();
  const [text, setText] = useState('');
  const [type, setType] = useState<EntryType>('thought');
  const [intensity, setIntensity] = useState(3);
  const [addToPrep, setAddToPrep] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { run } = useActionRateLimit(700);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      const result = await run(() => addEntry({ text: text.trim(), type, intensity, addedToPrep: addToPrep }, addToPrep));
      if (result.blocked) return;
      const added = result.value;
      if (!added) {
        toast('Free plan limit reached (30 logs/month). Upgrade to Pro for unlimited logs.', { duration: 3000 });
        return;
      }
      setText('');
      setIntensity(3);
      setType('thought');
      setAddToPrep(false);
      inputRef.current?.focus();
      toast(addToPrep ? 'Logged + added to session prep.' : 'Logged.', { duration: 2000 });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to save log.', { duration: 3000 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const selectedType = typeOptions.find(t => t.value === type)!;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {plan === 'FREE' && (
        <p className="text-[12px] text-muted-foreground mb-2">
          Free plan: {monthlyEntryCount}/{planBenefits.maxMonthlyEntries} logs this month.
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Something happened... what was it?"
            className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground text-[15px] leading-relaxed min-h-[44px]"
            rows={1}
            style={{ height: 'auto', overflow: 'hidden' }}
            aria-label="Quick log entry"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setTypeOpen(!typeOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-[13px]"
            >
              <span>{selectedType.emoji}</span>
              <span className="text-foreground">{selectedType.label}</span>
            </button>
            {typeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTypeOpen(false)} />
                <div className="absolute left-0 bottom-full mb-1 z-20 bg-popover border border-border rounded-lg shadow-sm py-1 min-w-[140px]">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setType(opt.value); setTypeOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[14px] hover:bg-secondary flex items-center gap-2 ${
                        opt.value === type ? 'text-terracotta' : 'text-foreground'
                      }`}
                    >
                      <span>{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Intensity</span>
            <IntensityDots value={intensity} onChange={setIntensity} />
          </div>
          <button
            onClick={() => setAddToPrep(!addToPrep)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[12px] transition-all ${
              addToPrep
                ? 'bg-sage/15 text-sage'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title="Also add to session prep"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prep</span>
          </button>
        </div>
        <button
          onClick={() => { void handleSubmit(); }}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-terracotta text-white rounded-md hover:bg-terracotta/90 transition-all duration-150 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed text-[14px]"
        >
          Save
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

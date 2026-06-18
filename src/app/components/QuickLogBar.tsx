import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Mic, Square } from 'lucide-react';
import { IntensityDots } from './IntensityDots';
import { useApp } from '../context/AppContext';
import type { EntryType } from '../context/AppContext';
import { toast } from 'sonner';
import { useActionRateLimit } from '../hooks/useActionRateLimit';
import { getErrorMessage } from '../lib/api';

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
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { run } = useActionRateLimit(700);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const toggleVoice = () => {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast("Voice input isn't supported in this browser. Try Chrome or Edge.", { duration: 3000 });
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    const base = text.trim() ? text.trim() + ' ' : '';
    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setText((base + transcript).replace(/^\s+/, ''));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

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
      toast(getErrorMessage(error, 'Failed to save log.'), { duration: 3000 });
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
    <div data-tour-target="log-entry" className="bg-card border border-border rounded-lg p-4">
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
      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
        <Mic className="w-3 h-3" />
        <span>Type it, or tap the mic to speak</span>
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
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            title={listening ? 'Stop dictation' : 'Dictate your log'}
            aria-label={listening ? 'Stop dictation' : 'Dictate your log'}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
              listening ? 'bg-destructive text-white animate-pulse' : 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20'
            }`}
          >
            {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
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
    </div>
  );
}

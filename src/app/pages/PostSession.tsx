import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MoodSlider } from '../components/MoodSlider';
import { TopicChip } from '../components/TagChip';
import { SectionHeader } from '../components/SectionHeader';
import { toast } from 'sonner';
import { Link } from 'react-router';
import type { TopicTag } from '../context/AppContext';

const allTopics: TopicTag[] = [
  'Anxiety', 'Family', 'Relationships', 'Work', 'Self-esteem',
  'Grief', 'Identity', 'Patterns', 'Communication', 'Trauma', 'Boundaries',
];

export function PostSession() {
  const { saveSession } = useApp();
  const [whatStoodOut, setWhatStoodOut] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<TopicTag[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<{ text: string; dueDate: string }[]>([]);
  const [newHomework, setNewHomework] = useState('');
  const [addingHomework, setAddingHomework] = useState(false);
  const [postMood, setPostMood] = useState(5);
  const [moodWord, setMoodWord] = useState('');
  const [saved, setSaved] = useState(false);

  const sessionDate = new Date();

  const toggleTopic = (topic: TopicTag) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const addHomeworkItem = () => {
    if (!newHomework.trim()) return;
    setHomeworkItems(prev => [...prev, { text: newHomework.trim(), dueDate: '' }]);
    setNewHomework('');
  };

  const removeHomeworkItem = (i: number) => {
    setHomeworkItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    try {
      await saveSession({
        date: sessionDate,
        topics: selectedTopics,
        whatStoodOut,
        prepItems: [],
        postMood,
        moodWord,
        completed: true,
        homeworkItems: homeworkItems.map(item => ({
          text: item.text,
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        })),
      });

      setSaved(true);
      toast('Saved. Good work today.', { duration: 3000 });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to save session.', { duration: 3000 });
    }
  };

  if (saved) {
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center mb-4">
            <Check className="w-7 h-7 text-sage" />
          </div>
          <p className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>
            Saved. Good work today.
          </p>
          <p className="text-muted-foreground text-[14px] mb-6">
            Your session notes are safe. Come back anytime to review them.
          </p>
          <div className="flex gap-4">
            <Link to="/app" className="text-[13px] text-terracotta hover:underline">
              Back to This Week
            </Link>
            <Link to="/app/past-sessions" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              View past sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-1">
          How did {format(sessionDate, 'EEEE, MMM d')} go?
        </h1>
        <p className="text-muted-foreground text-[14px]">While it's still fresh.</p>
      </div>

      {/* Section A: What stood out */}
      <section className="mb-10">
        <SectionHeader title="What stood out" />
        <textarea
          value={whatStoodOut}
          onChange={e => setWhatStoodOut(e.target.value)}
          placeholder="What landed? What surprised you? What do you want to remember?"
          className="w-full bg-card border border-border rounded-lg px-5 py-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/40 resize-none min-h-[160px] leading-[1.7]"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.max(160, target.scrollHeight) + 'px';
          }}
        />
      </section>

      {/* Section B: What we worked on */}
      <section className="mb-10">
        <SectionHeader title="What we worked on" subtitle="Select the topics you covered" />
        <div className="flex flex-wrap gap-2">
          {allTopics.map(topic => (
            <TopicChip
              key={topic}
              topic={topic}
              selected={selectedTopics.includes(topic)}
              onClick={() => toggleTopic(topic)}
            />
          ))}
        </div>
      </section>

      {/* Section C: My homework */}
      <section className="mb-10">
        <SectionHeader title="My homework" subtitle="Did your therapist give you anything to work on?" />

        {homeworkItems.length > 0 && (
          <div className="space-y-2 mb-3">
            {homeworkItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                <CheckSquareIcon className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                <span className="flex-1 text-[14px] text-foreground">{item.text}</span>
                <button onClick={() => removeHomeworkItem(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addingHomework ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newHomework}
              onChange={e => setNewHomework(e.target.value)}
              placeholder="What's the homework?"
              className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/50"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') { addHomeworkItem(); }
                if (e.key === 'Escape') { setAddingHomework(false); setNewHomework(''); }
              }}
            />
            <button onClick={addHomeworkItem} className="p-2 text-sage hover:text-foreground transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setAddingHomework(false); setNewHomework(''); }} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingHomework(true)}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
          >
            <Plus className="w-4 h-4" /> Add homework item
          </button>
        )}
      </section>

      {/* Section D: How I feel right now */}
      <section className="mb-10">
        <SectionHeader title="How I feel right now" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="mb-6">
            <MoodSlider value={postMood} onChange={setPostMood} />
          </div>
          <div>
            <input
              type="text"
              value={moodWord}
              onChange={e => setMoodWord(e.target.value)}
              placeholder="One word for how this session felt?"
              className="w-full bg-transparent border-b border-border pb-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-terracotta/40"
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-center pb-8">
        <button
          onClick={() => { void handleSave(); }}
          className="px-8 py-3 bg-terracotta text-white rounded-lg text-[15px] hover:bg-terracotta/90 transition-all active:translate-y-px"
        >
          Save my notes
        </button>
      </div>
    </div>
  );
}

function CheckSquareIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}

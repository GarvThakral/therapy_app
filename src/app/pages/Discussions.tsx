import React, { useState } from 'react';
import { MessageCircle, Heart, ChevronDown, ChevronUp, Plus, X, Send, TrendingUp, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Reply {
  id: string;
  alias: string;
  body: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

interface Discussion {
  id: string;
  alias: string;
  title: string;
  body: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  replies: Reply[];
  tag: string;
}

const tags = ['All', 'Session Prep', 'Triggers', 'Wins', 'Homework', 'Boundaries', 'Anxiety', 'General'];

const animalAliases = [
  'Gentle Otter', 'Quiet Sparrow', 'Brave Fox', 'Calm Deer', 'Patient Bear',
  'Wise Owl', 'Kind Dolphin', 'Steady Hawk', 'Warm Rabbit', 'Curious Cat',
  'Tender Wolf', 'Bright Finch', 'Peaceful Crane', 'Strong Elk', 'Hopeful Wren',
];

const getAlias = () => animalAliases[Math.floor(Math.random() * animalAliases.length)];

const initialDiscussions: Discussion[] = [
  {
    id: '1',
    alias: 'Gentle Otter',
    title: 'Does anyone else forget everything they wanted to say the moment they sit down?',
    body: 'Every single time. I spend the whole week thinking about what I want to discuss, and then my therapist says "how are you?" and my mind goes completely blank. I\'ve started writing things down on my phone which helps, but I\'m curious if others deal with this too.',
    timestamp: '2 hours ago',
    likes: 47,
    liked: false,
    tag: 'Session Prep',
    replies: [
      { id: 'r1', alias: 'Brave Fox', body: 'Every. Single. Time. I started keeping a running note on my phone and just pulling it up at the start of my session. Game changer.', timestamp: '1 hour ago', likes: 23, liked: false },
      { id: 'r2', alias: 'Wise Owl', body: 'My therapist actually told me this is really common and has to do with context-dependent memory. The therapy room puts you in a different state than where you had the thoughts. Writing them down is the fix.', timestamp: '45 min ago', likes: 31, liked: false },
      { id: 'r3', alias: 'Calm Deer', body: 'I literally have a "therapy topics" note that I add to throughout the week. Sometimes it\'s just one word — enough to jog my memory when I look at it.', timestamp: '30 min ago', likes: 12, liked: false },
    ],
  },
  {
    id: '2',
    alias: 'Patient Bear',
    title: 'Small win: I set a boundary with my mom for the first time in 30 years',
    body: 'It was terrifying and I almost backed down three times during the conversation. But I did it. I told her I needed her to call before coming over instead of just showing up. She didn\'t take it well, but I held firm. My hands were shaking the entire time. Therapy gave me the tools but actually doing it was something else entirely.',
    timestamp: '5 hours ago',
    likes: 134,
    liked: false,
    tag: 'Wins',
    replies: [
      { id: 'r4', alias: 'Kind Dolphin', body: 'This is huge. The shaking hands part is so real — your body is catching up to what your mind already knows. You did an incredibly brave thing.', timestamp: '4 hours ago', likes: 45, liked: false },
      { id: 'r5', alias: 'Hopeful Wren', body: 'The fact that she didn\'t take it well and you still held firm? That\'s the whole point. Boundaries aren\'t about controlling their reaction. They\'re about honoring yours.', timestamp: '3 hours ago', likes: 67, liked: false },
    ],
  },
  {
    id: '3',
    alias: 'Curious Cat',
    title: 'How do you handle the "homework" your therapist gives you?',
    body: 'Mine asked me to practice noticing my "should" thoughts this week and writing them down. I keep forgetting until the evening and then I can\'t remember specific instances. Anyone have tips for remembering to do therapy homework throughout the day?',
    timestamp: '8 hours ago',
    likes: 28,
    liked: false,
    tag: 'Homework',
    replies: [
      { id: 'r6', alias: 'Steady Hawk', body: 'I set three random alarms on my phone labeled "check in." When they go off, I take 30 seconds to notice what I\'m thinking/feeling. Works way better than trying to remember.', timestamp: '7 hours ago', likes: 19, liked: false },
      { id: 'r7', alias: 'Warm Rabbit', body: 'I tie it to things I already do. Coffee = check in. Lunch = check in. Brushing teeth at night = check in. Piggybacking on existing habits is the only thing that works for me.', timestamp: '6 hours ago', likes: 22, liked: false },
    ],
  },
  {
    id: '4',
    alias: 'Tender Wolf',
    title: 'DAE feel worse after therapy sometimes? Is that normal?',
    body: 'Had a really intense session yesterday and I\'ve been feeling raw and emotional ever since. We touched on some childhood stuff that I usually keep locked away. Part of me wonders if I should have just left it alone. Is this normal or is something wrong?',
    timestamp: '1 day ago',
    likes: 89,
    liked: false,
    tag: 'General',
    replies: [
      { id: 'r8', alias: 'Bright Finch', body: 'Completely normal. My therapist calls it "productive discomfort." You opened something that needed to be opened. The rawness is your system processing it. It usually settles within a day or two.', timestamp: '22 hours ago', likes: 56, liked: false },
      { id: 'r9', alias: 'Peaceful Crane', body: 'I felt like this for weeks after we started EMDR. My therapist said it\'s like cleaning out a wound — it hurts more before it heals. Hang in there.', timestamp: '20 hours ago', likes: 34, liked: false },
      { id: 'r10', alias: 'Strong Elk', body: 'One thing that helped me was telling my therapist at the START of the next session how I felt after the last one. They can adjust the pacing so it doesn\'t hit as hard.', timestamp: '18 hours ago', likes: 41, liked: false },
    ],
  },
  {
    id: '5',
    alias: 'Bright Finch',
    title: 'Tracking triggers changed my therapy completely',
    body: 'I started logging my triggers three months ago — just the event, the feeling, and the intensity. When I brought a month of data to my therapist, she immediately spotted a pattern I\'d been missing: almost all my anxiety spikes happened when I felt like I was being evaluated. Work reviews, social situations, even texts from my partner asking "can we talk?" Once we named it, everything clicked.',
    timestamp: '2 days ago',
    likes: 156,
    liked: false,
    tag: 'Triggers',
    replies: [
      { id: 'r11', alias: 'Gentle Otter', body: 'This is exactly what I needed to hear. I\'ve been thinking about starting a trigger log but wasn\'t sure if it would actually be useful. You just convinced me.', timestamp: '1 day ago', likes: 28, liked: false },
      { id: 'r12', alias: 'Patient Bear', body: 'The "can we talk?" text trigger is SO relatable. Those three words send my cortisol through the roof even when it\'s about something completely benign.', timestamp: '1 day ago', likes: 72, liked: false },
    ],
  },
  {
    id: '6',
    alias: 'Peaceful Crane',
    title: 'Six months into therapy and I\'m not sure it\'s working',
    body: 'I\'ve been going weekly for six months. I like my therapist, the sessions feel good in the moment, but I\'m not sure anything is actually changing in my daily life. I still react the same way to the same situations. Am I being impatient or should I be seeing more progress by now?',
    timestamp: '3 days ago',
    likes: 63,
    liked: false,
    tag: 'General',
    replies: [
      { id: 'r13', alias: 'Wise Owl', body: 'Progress in therapy is often invisible until you look back. Are you journaling? Having a record of where you were 6 months ago vs now might surprise you.', timestamp: '2 days ago', likes: 38, liked: false },
      { id: 'r14', alias: 'Tender Wolf', body: 'Have you told your therapist this? "I feel stuck" is one of the most productive things you can say. A good therapist will welcome the feedback and adjust.', timestamp: '2 days ago', likes: 44, liked: false },
    ],
  },
  {
    id: '7',
    alias: 'Strong Elk',
    title: 'The Sunday scaries are actually useful data',
    body: 'I used to dread Sundays — that creeping anxiety about Monday. Started logging it instead of just enduring it. After a month, I realized my Sunday anxiety was always highest when I had unresolved conflicts from the previous week. Now I use Sunday as a check-in: what\'s unresolved? What do I need to address? The anxiety went from a vague dread to an actionable signal.',
    timestamp: '4 days ago',
    likes: 112,
    liked: false,
    tag: 'Anxiety',
    replies: [
      { id: 'r15', alias: 'Curious Cat', body: 'Reframing anxiety as "data" instead of "a problem" has been one of the biggest shifts in my therapy. This is a perfect example of that.', timestamp: '3 days ago', likes: 51, liked: false },
    ],
  },
];

export function Discussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [activeTag, setActiveTag] = useState('All');
  const [sortBy, setSortBy] = useState<'trending' | 'recent'>('trending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTag, setNewTag] = useState('General');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [myAlias] = useState(() => getAlias());

  const filtered = discussions
    .filter(d => activeTag === 'All' || d.tag === activeTag)
    .sort((a, b) => sortBy === 'trending' ? b.likes - a.likes : 0);

  const handleLikeDiscussion = (id: string) => {
    setDiscussions(prev => prev.map(d =>
      d.id === id ? { ...d, liked: !d.liked, likes: d.liked ? d.likes - 1 : d.likes + 1 } : d
    ));
  };

  const handleLikeReply = (discussionId: string, replyId: string) => {
    setDiscussions(prev => prev.map(d =>
      d.id === discussionId
        ? {
            ...d,
            replies: d.replies.map(r =>
              r.id === replyId ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
            ),
          }
        : d
    ));
  };

  const handleNewPost = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error('Please add a title and body for your post.');
      return;
    }
    const newDiscussion: Discussion = {
      id: Date.now().toString(),
      alias: myAlias,
      title: newTitle.trim(),
      body: newBody.trim(),
      timestamp: 'Just now',
      likes: 0,
      liked: false,
      tag: newTag,
      replies: [],
    };
    setDiscussions(prev => [newDiscussion, ...prev]);
    setNewTitle('');
    setNewBody('');
    setNewTag('General');
    setShowNewPost(false);
    toast.success('Post shared anonymously!');
  };

  const handleReply = (discussionId: string) => {
    if (!replyText.trim()) return;
    const newReply: Reply = {
      id: Date.now().toString(),
      alias: myAlias,
      body: replyText.trim(),
      timestamp: 'Just now',
      likes: 0,
      liked: false,
    };
    setDiscussions(prev => prev.map(d =>
      d.id === discussionId ? { ...d, replies: [...d.replies, newReply] } : d
    ));
    setReplyText('');
    setReplyingTo(null);
    toast.success('Reply posted!');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>
            Community
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Anonymous discussions with people who get it. No names, no judgment.
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all active:translate-y-px flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Your alias */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-sage/20 flex items-center justify-center text-sage text-[11px]">
          {myAlias.split(' ').map(w => w[0]).join('')}
        </div>
        <span className="text-[13px] text-muted-foreground">
          You're posting as <strong className="text-foreground">{myAlias}</strong>
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          anonymous
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
              sortBy === 'trending' ? 'bg-terracotta/10 text-terracotta' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Trending
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
              sortBy === 'recent' ? 'bg-terracotta/10 text-terracotta' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3 h-3" /> Recent
          </button>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex flex-wrap gap-1.5 ml-1">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                activeTag === tag
                  ? 'bg-terracotta text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* New post form */}
      {showNewPost && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Start a discussion</h3>
            <button onClick={() => setShowNewPost(false)} className="p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            placeholder="What's on your mind?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 mb-3 transition-colors"
          />
          <textarea
            placeholder="Share more details..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            rows={4}
            className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 mb-3 resize-none transition-colors"
          />
          <div className="flex items-center justify-between">
            <select
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-[13px] text-foreground outline-none"
            >
              {tags.filter(t => t !== 'All').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={handleNewPost}
              className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-white rounded-lg text-[13px] hover:bg-terracotta/90 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Post anonymously
            </button>
          </div>
        </div>
      )}

      {/* Discussions list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-[14px]">No discussions in this category yet. Be the first!</p>
          </div>
        ) : (
          filtered.map(d => (
            <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/20 transition-colors">
              {/* Main post */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta text-[10px]">
                    {d.alias.split(' ').map(w => w[0]).join('')}
                  </div>
                  <span className="text-[13px] text-foreground">{d.alias}</span>
                  <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.timestamp}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.tag}
                  </span>
                </div>

                <h3
                  className="text-foreground mb-2 cursor-pointer hover:text-terracotta transition-colors"
                  style={{ fontSize: '15px' }}
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                >
                  {d.title}
                </h3>

                <p className={`text-muted-foreground text-[13px] leading-relaxed ${expandedId === d.id ? '' : 'line-clamp-2'}`}>
                  {d.body}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => handleLikeDiscussion(d.id)}
                    className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                      d.liked ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${d.liked ? 'fill-current' : ''}`} /> {d.likes}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> {d.replies.length} {d.replies.length === 1 ? 'reply' : 'replies'}
                    {expandedId === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded replies */}
              {expandedId === d.id && (
                <div className="border-t border-border bg-secondary/30">
                  {d.replies.map(r => (
                    <div key={r.id} className="px-5 py-4 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-sage/15 flex items-center justify-center text-sage text-[9px]">
                          {r.alias.split(' ').map(w => w[0]).join('')}
                        </div>
                        <span className="text-[12px] text-foreground">{r.alias}</span>
                        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {r.timestamp}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[13px] leading-relaxed ml-8 mb-2">
                        {r.body}
                      </p>
                      <button
                        onClick={() => handleLikeReply(d.id, r.id)}
                        className={`flex items-center gap-1 text-[12px] ml-8 transition-colors ${
                          r.liked ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${r.liked ? 'fill-current' : ''}`} /> {r.likes}
                      </button>
                    </div>
                  ))}

                  {/* Reply input */}
                  <div className="px-5 py-4">
                    {replyingTo === d.id ? (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-sage text-[9px] mt-1 flex-shrink-0">
                          {myAlias.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            autoFocus
                            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 resize-none transition-colors"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleReply(d.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-terracotta text-white rounded-md text-[12px] hover:bg-terracotta/90 transition-all"
                            >
                              <Send className="w-3 h-3" /> Reply
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(d.id)}
                        className="text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
                      >
                        + Add a reply
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Community guidelines */}
      <div className="mt-8 bg-card border border-border rounded-xl p-5">
        <h4 className="text-foreground text-[14px] mb-2">Community guidelines</h4>
        <ul className="text-[12px] text-muted-foreground space-y-1.5 leading-relaxed">
          <li>&#8226; All posts are anonymous. Your identity is protected with a random animal alias.</li>
          <li>&#8226; Be kind. Everyone here is working through something.</li>
          <li>&#8226; Don't share identifying personal information (yours or others').</li>
          <li>&#8226; This is not a substitute for therapy or crisis support.</li>
          <li>&#8226; If you or someone is in crisis, contact 988 Suicide & Crisis Lifeline (call/text 988).</li>
        </ul>
      </div>
    </div>
  );
}

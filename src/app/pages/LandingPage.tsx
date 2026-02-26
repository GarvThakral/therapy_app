import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, Clock } from 'lucide-react';
import { SessionlyLogo } from '../components/SessionlyLogo';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { blogPosts } from '../data/blog-posts';

const howItWorks = [
  {
    step: '01',
    title: 'Log as it happens',
    desc: 'Trigger happened? Big moment? Capture it in 30 seconds before you forget.',
    image: 'https://images.unsplash.com/photo-1627048776675-5aaac3fe1abb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBqb3VybmFsaW5nJTIwcGhvbmUlMjBjb3p5fGVufDF8fHx8MTc3MTg0MTM5NHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    step: '02',
    title: 'Prep your session',
    desc: "Before you walk in, pull up what you've collected. Your talking points are ready.",
    image: 'https://images.unsplash.com/photo-1709487229575-769eea1b8c8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbml6ZWQlMjBub3RlYm9vayUyMHRoZXJhcHklMjBwbGFubmluZ3xlbnwxfHx8fDE3NzE4NDEzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    step: '03',
    title: 'Capture after',
    desc: "A reminder lands after your session. Write while it's still fresh.",
    image: 'https://images.unsplash.com/photo-1763390545773-e9065a806d30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjByZWZsZWN0aW5nJTIwd3JpdGluZyUyMHBlYWNlZnVsfGVufDF8fHx8MTc3MTg0MTM5NXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const features = [
  {
    title: 'Trigger Log',
    desc: 'Capture triggers the moment they happen, before they fade.',
    image: 'https://images.unsplash.com/photo-1630406866478-a2fca6070d25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbW90aW9uYWwlMjBhd2FyZW5lc3MlMjBtaW5kZnVsbmVzcyUyMGNhbG18ZW58MXx8fHwxNzcxODQxMzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Session Prep',
    desc: 'Walk into therapy with everything organized and ready.',
    image: 'https://images.unsplash.com/photo-1765867967050-30db3e7a3be8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3RlYm9vayUyMGNoZWNrbGlzdCUyMG9yZ2FuaXplZCUyMGRlc2t8ZW58MXx8fHwxNzcxODQxMzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Post-Session Notes',
    desc: "Write what landed while it's still fresh.",
    image: 'https://images.unsplash.com/photo-1674514738234-785bdd5faa39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMHdyaXRpbmclMjBwZW4lMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3MTg0MTQwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Homework Tracker',
    desc: 'Never forget what your therapist asked you to work on.',
    image: 'https://images.unsplash.com/photo-1598708521413-feaa4e69c01b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxlbmRhciUyMHBsYW5uZXIlMjBvcmdhbml6ZWQlMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc3MTg0MTQwOHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Big Events Timeline',
    desc: 'Log the moments that matter between sessions.',
    image: 'https://images.unsplash.com/photo-1765371513276-a74f1ecbcf7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwZGVzayUyMHdvcmtzcGFjZSUyMG1pbmltYWx8ZW58MXx8fHwxNzcxODQxNDAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Pattern Insights',
    desc: 'See what keeps coming up. Powered by your own data.',
    image: 'https://images.unsplash.com/photo-1767474764929-2119391c888b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwdmlzdWFsaXphdGlvbiUyMHBhdHRlcm5zJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcxODQxMzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    pro: true,
  },
];

const quotes = [
  { text: 'I used to walk out of therapy and forget half of what we covered. This changed that.', initial: 'R' },
  { text: 'My therapist noticed I come in more prepared now. Sessions feel twice as productive.', initial: 'M' },
  { text: 'I finally have a place for all the things I think about between sessions.', initial: 'K' },
];

const recentPosts = blogPosts.slice(0, 3);

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1A1814] text-[#F0EDE8]">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <SessionlyLogo size={32} showWordmark wordmarkSize={20} wordmarkClassName="text-[#F0EDE8]" />
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/blog" className="text-[14px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors hidden sm:inline">
            Blog
          </Link>
          <Link to="/auth?mode=login" className="text-[14px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors">
            Log in
          </Link>
          <Link to="/auth?mode=signup&plan=free" className="px-4 py-2 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
            Start for free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-[#F0EDE8] mb-6" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: '1.15' }}>
            Everything you want to say in therapy — organized.
          </h1>
          <p className="text-[#8A7F75] text-[18px] leading-relaxed mb-10 max-w-2xl mx-auto">
            Log what happens between sessions. Prep what matters. Never leave a session wishing you'd mentioned something.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/auth?mode=signup&plan=free" className="w-full sm:w-auto text-center px-6 py-3 bg-[#C17A5A] text-white rounded-lg text-[15px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
              Start for free
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto text-center px-6 py-3 border border-[#2E2A25] text-[#F0EDE8] rounded-lg text-[15px] hover:border-[#8A7F75] transition-all">
              See how it works
            </a>
          </div>
        </div>

        {/* App Mockup */}
        <div className="mt-12 md:mt-16 max-w-3xl mx-auto">
          <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-4 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#2E2A25] hidden sm:block" />
              <div className="w-3 h-3 rounded-full bg-[#2E2A25] hidden sm:block" />
              <div className="w-3 h-3 rounded-full bg-[#2E2A25] hidden sm:block" />
              <span className="text-[11px] text-[#8A7F75] sm:ml-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                This Week — Feb 17 – Feb 23
              </span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#1A1814] border border-[#2E2A25] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Tuesday 9:14pm</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />TRIGGER
                  </span>
                </div>
                <p className="text-[#F0EDE8] text-[14px] leading-relaxed">
                  Felt dismissed after the call with mom. She kept changing the subject when I tried to bring up the holidays. Want to bring this up.
                </p>
              </div>
              <div className="bg-[#1A1814] border border-[#2E2A25] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Wednesday 2:32pm</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />WIN
                  </span>
                </div>
                <p className="text-[#F0EDE8] text-[14px] leading-relaxed">
                  Set a boundary with Jake about weekend plans. Said no without over-explaining. First time in months.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — image cards */}
      <section id="how-it-works" className="bg-[#231F1B] border-t border-b border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-center text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px' }}>
            How it works
          </h2>
          <p className="text-center text-[#8A7F75] mb-14 text-[15px] max-w-lg mx-auto">
            Three steps. Thirty seconds each. That's all it takes to make your sessions count.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="group bg-[#1A1814] border border-[#2E2A25] rounded-xl overflow-hidden hover:border-[#3A3530] transition-all">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1814] via-[#1A1814]/30 to-transparent" />
                  <span
                    className="absolute top-4 left-4 text-[#C17A5A]/60 text-[48px]"
                    style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1 }}
                  >
                    {item.step}
                  </span>
                </div>
                <div className="p-5 -mt-8 relative">
                  <h3 className="text-[#F0EDE8] mb-2">{item.title}</h3>
                  <p className="text-[#8A7F75] text-[14px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — image-backed cards */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-center text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px' }}>
          What's inside
        </h2>
        <p className="text-center text-[#8A7F75] mb-12 text-[15px]">Your therapy, your notes, your patterns.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group bg-[#231F1B] border border-[#2E2A25] rounded-xl overflow-hidden hover:border-[#3A3530] transition-colors">
              <div className="aspect-[16/9] overflow-hidden relative">
                <ImageWithFallback
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#231F1B] via-[#231F1B]/40 to-transparent" />
                {f.pro && (
                  <span
                    className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-[#D4A853]/20 text-[#D4A853] backdrop-blur-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <div className="p-5 -mt-4 relative">
                <h4 className="text-[#F0EDE8] mb-1">{f.title}</h4>
                <p className="text-[#8A7F75] text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-[#231F1B] border-t border-b border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-center text-[#F0EDE8] mb-12" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>
            What people are saying
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quotes.map((q, i) => (
              <div key={i} className="bg-[#1A1814] border border-[#2E2A25] rounded-lg p-6">
                <p className="text-[#F0EDE8] text-[14px] leading-relaxed mb-4 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                  "{q.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2E2A25] flex items-center justify-center text-[#8A7F75] text-[11px]">
                    {q.initial}
                  </div>
                  <span className="text-[12px] text-[#8A7F75]">Verified user</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-center text-[#F0EDE8] mb-12" style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px' }}>
          Simple pricing
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-6">
            <h3 className="text-[#F0EDE8] mb-1">Free</h3>
            <p className="text-[32px] text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>$0</p>
            <ul className="space-y-3 mb-6">
              {['Session prep + notes', 'Homework tracker', '30 log entries/month'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[#8A7F75] text-[14px]">
                  <svg className="w-4 h-4 text-[#4A6741]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth?mode=signup&plan=free" className="block text-center px-4 py-2.5 border border-[#2E2A25] rounded-lg text-[14px] text-[#F0EDE8] hover:border-[#8A7F75] transition-all">
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-[#231F1B] border border-[#C17A5A]/30 rounded-xl p-6 relative">
            <div className="absolute -top-3 right-6 px-3 py-0.5 bg-[#C17A5A] text-white text-[11px] rounded-full">
              Most popular
            </div>
            <h3 className="text-[#F0EDE8] mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-[32px] text-[#F0EDE8]" style={{ fontFamily: "'Playfair Display', serif" }}>$6</span>
              <span className="text-[#8A7F75] text-[14px]">/month</span>
            </div>
            <p className="text-[12px] text-[#8A7F75] mb-4">or $48/year — save 33%</p>
            <ul className="space-y-3 mb-6">
              {['Everything in Free', 'Unlimited log entries', 'Pattern Insights', 'Export to PDF'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[#8A7F75] text-[14px]">
                  <svg className="w-4 h-4 text-[#C17A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth?mode=signup&plan=pro" className="block text-center px-4 py-2.5 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
              Continue to payment
            </Link>
          </div>
        </div>
        <p className="text-center text-[12px] text-[#8A7F75] mt-6">
          Your data is encrypted and never used to train AI.
        </p>
      </section>

      {/* Blog preview */}
      <section className="bg-[#231F1B] border-t border-b border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-[#F0EDE8] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>
                From the journal
              </h2>
              <p className="text-[#8A7F75] text-[14px]">Practical reads to help you get more from therapy.</p>
            </div>
            <Link to="/blog" className="hidden sm:flex items-center gap-1.5 text-[#C17A5A] text-[14px] hover:gap-2.5 transition-all">
              All articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {recentPosts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-[#1A1814] border border-[#2E2A25] rounded-xl overflow-hidden hover:border-[#3A3530] transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C17A5A]/15 text-[#C17A5A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <Clock className="w-3 h-3" /> {post.readTime} min
                    </span>
                  </div>
                  <h4 className="text-[#F0EDE8] text-[14px] mb-1 group-hover:text-[#C17A5A] transition-colors leading-snug line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {post.title}
                  </h4>
                  <p className="text-[#8A7F75] text-[12px] leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/blog" className="sm:hidden flex items-center justify-center gap-1.5 text-[#C17A5A] text-[14px] mt-6">
            See all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>
          Ready to make therapy work harder for you?
        </h2>
        <p className="text-[#8A7F75] text-[15px] mb-6 max-w-xl mx-auto">
          Start free. Upgrade when you're ready.
        </p>
        <Link to="/auth?mode=signup&plan=free" className="inline-block px-6 py-3 bg-[#C17A5A] text-white rounded-lg text-[15px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
          Get started — it's free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SessionlyLogo size={24} />
            <span className="text-[14px] text-[#8A7F75]">Nothing gets lost between sessions.</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#8A7F75]">
            <Link to="/blog" className="hover:text-[#F0EDE8] transition-colors">Blog</Link>
            <Link to="/privacy" className="hover:text-[#F0EDE8] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F0EDE8] transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-[#F0EDE8] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

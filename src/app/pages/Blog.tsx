import React, { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Clock, Search } from 'lucide-react';
import { SessionlyLogo } from '../components/SessionlyLogo';
import { blogPosts, blogCategories } from '../data/blog-posts';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = blogPosts[0];
  const rest = filtered.filter(p => p.slug !== featured.slug || activeCategory !== 'All' || searchQuery !== '');

  return (
    <div className="min-h-screen bg-[#1A1814] text-[#F0EDE8]">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/">
          <SessionlyLogo size={32} showWordmark wordmarkSize={20} wordmarkClassName="text-[#F0EDE8]" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-[14px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors">
            Log in
          </Link>
          <Link to="/onboarding" className="px-4 py-2 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
            Start for free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-8 md:pt-14 pb-10">
        <h1 className="text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)' }}>
          The Sessionly Journal
        </h1>
        <p className="text-[#8A7F75] text-[16px] leading-relaxed max-w-2xl mb-8">
          Practical guides on therapy, journaling, emotional awareness, and making every session count. No fluff. No clinical jargon.
        </p>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F75]" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#231F1B] border border-[#2E2A25] rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-[#F0EDE8] placeholder-[#8A7F75] outline-none focus:border-[#C17A5A]/40 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {blogCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                activeCategory === cat
                  ? 'bg-[#C17A5A] text-white'
                  : 'bg-[#231F1B] text-[#8A7F75] border border-[#2E2A25] hover:border-[#8A7F75]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured post */}
      {activeCategory === 'All' && searchQuery === '' && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <Link to={`/blog/${featured.slug}`} className="group block">
            <div className="grid md:grid-cols-2 gap-6 bg-[#231F1B] border border-[#2E2A25] rounded-xl overflow-hidden hover:border-[#3A3530] transition-colors">
              <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                <ImageWithFallback
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:py-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C17A5A]/15 text-[#C17A5A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {featured.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <Clock className="w-3 h-3" /> {featured.readTime} min read
                  </span>
                </div>
                <h2 className="text-[#F0EDE8] mb-3 group-hover:text-[#C17A5A] transition-colors" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>
                  {featured.title}
                </h2>
                <p className="text-[#8A7F75] text-[14px] leading-relaxed mb-4">
                  {featured.excerpt}
                </p>
                <span className="flex items-center gap-1.5 text-[#C17A5A] text-[14px] group-hover:gap-2.5 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Article grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#8A7F75] text-[15px]">No articles found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(activeCategory === 'All' && searchQuery === '' ? rest : filtered).map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-[#231F1B] border border-[#2E2A25] rounded-xl overflow-hidden hover:border-[#3A3530] transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C17A5A]/15 text-[#C17A5A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <Clock className="w-3 h-3" /> {post.readTime} min
                    </span>
                  </div>
                  <h3 className="text-[#F0EDE8] text-[15px] mb-2 group-hover:text-[#C17A5A] transition-colors leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {post.title}
                  </h3>
                  <p className="text-[#8A7F75] text-[13px] leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SessionlyLogo size={24} />
            <span className="text-[14px] text-[#8A7F75]">Nothing gets lost between sessions.</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#8A7F75]">
            <Link to="/privacy" className="hover:text-[#F0EDE8] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F0EDE8] transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-[#F0EDE8] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

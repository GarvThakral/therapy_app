import React from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { SessionlyLogo } from '../components/SessionlyLogo';
import { blogPosts } from '../data/blog-posts';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const postIndex = blogPosts.findIndex(p => p.slug === slug);
  const post = blogPosts[postIndex];

  if (!post) return <Navigate to="/blog" replace />;

  const nextPost = blogPosts[postIndex + 1];
  const prevPost = blogPosts[postIndex - 1];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderBody = (paragraph: string) => {
    if (paragraph.startsWith('## ')) {
      return (
        <h2
          key={paragraph}
          className="text-[#F0EDE8] mt-8 mb-3"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}
        >
          {paragraph.slice(3)}
        </h2>
      );
    }
    return (
      <p key={paragraph} className="text-[#C4BDB4] text-[15px] leading-[1.8] mb-4">
        {paragraph}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-[#1A1814] text-[#F0EDE8]">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/">
          <SessionlyLogo size={32} showWordmark wordmarkSize={20} wordmarkClassName="text-[#F0EDE8]" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/blog" className="text-[14px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors">
            All articles
          </Link>
          <Link to="/onboarding" className="px-4 py-2 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
            Start for free
          </Link>
        </div>
      </nav>

      {/* Back */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pt-6 pb-16">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#C17A5A]/15 text-[#C17A5A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <Clock className="w-3 h-3" /> {post.readTime} min read
          </span>
          <span className="flex items-center gap-1 text-[12px] text-[#8A7F75]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <Calendar className="w-3 h-3" /> {formatDate(post.date)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[#F0EDE8] mb-6" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: '1.2' }}>
          {post.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[#2E2A25]">
          <div className="w-9 h-9 rounded-full bg-[#C17A5A]/20 flex items-center justify-center">
            <SessionlyLogo size={20} />
          </div>
          <div>
            <p className="text-[13px] text-[#F0EDE8]">{post.author}</p>
            <p className="text-[11px] text-[#8A7F75]">Published {formatDate(post.date)}</p>
          </div>
        </div>

        {/* Hero image */}
        <div className="rounded-xl overflow-hidden mb-10 aspect-[16/8]">
          <ImageWithFallback
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Body */}
        <div className="max-w-none">
          {post.body.map((p, i) => (
            <React.Fragment key={i}>{renderBody(p)}</React.Fragment>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#231F1B] border border-[#2E2A25] rounded-xl p-6 md:p-8 text-center">
          <h3 className="text-[#F0EDE8] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}>
            Ready to put this into practice?
          </h3>
          <p className="text-[#8A7F75] text-[14px] mb-5 max-w-md mx-auto">
            Sessionly helps you log triggers, prep sessions, and track homework — so nothing falls through the cracks.
          </p>
          <Link to="/onboarding" className="inline-block px-6 py-2.5 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px">
            Start for free
          </Link>
        </div>

        {/* Prev / Next */}
        <div className="mt-10 grid grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.slug}`}
              className="group bg-[#231F1B] border border-[#2E2A25] rounded-lg p-4 hover:border-[#3A3530] transition-colors"
            >
              <span className="text-[11px] text-[#8A7F75] flex items-center gap-1 mb-2"><ArrowLeft className="w-3 h-3" /> Previous</span>
              <p className="text-[13px] text-[#F0EDE8] group-hover:text-[#C17A5A] transition-colors leading-snug line-clamp-2">{prevPost.title}</p>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link
              to={`/blog/${nextPost.slug}`}
              className="group bg-[#231F1B] border border-[#2E2A25] rounded-lg p-4 hover:border-[#3A3530] transition-colors text-right"
            >
              <span className="text-[11px] text-[#8A7F75] flex items-center justify-end gap-1 mb-2">Next <ArrowRight className="w-3 h-3" /></span>
              <p className="text-[13px] text-[#F0EDE8] group-hover:text-[#C17A5A] transition-colors leading-snug line-clamp-2">{nextPost.title}</p>
            </Link>
          ) : <div />}
        </div>
      </article>

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

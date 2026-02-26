import React from 'react';
import { Link } from 'react-router';
import { SessionlyLogo } from '../components/SessionlyLogo';

export function Terms() {
  return (
    <div className="min-h-screen bg-[#1A1814] text-[#F0EDE8]">
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/">
          <SessionlyLogo size={32} showWordmark wordmarkSize={20} wordmarkClassName="text-[#F0EDE8]" />
        </Link>
        <Link to="/app" className="text-[14px] text-[#8A7F75] hover:text-[#F0EDE8] transition-colors">
          Go to app
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 pt-8 pb-20">
        <h1 className="text-[#F0EDE8] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px' }}>
          Terms of Service
        </h1>
        <p className="text-[#8A7F75] text-[13px] mb-10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Last updated: February 1, 2026
        </p>

        <div className="space-y-8 text-[#C4BDB4] text-[15px] leading-[1.8]">
          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Welcome to Sessionly
            </h2>
            <p>
              These terms govern your use of Sessionly ("we," "us," "our"), a web-based therapy companion tool. By using Sessionly, you agree to these terms. We've written them in plain language because legal jargon helps no one.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              What Sessionly is (and isn't)
            </h2>
            <p className="mb-3">
              Sessionly is a personal journaling and organization tool designed to complement professional therapy. It helps you log events between sessions, prepare talking points, and track homework.
            </p>
            <p>
              <strong className="text-[#F0EDE8]">Sessionly is not a substitute for professional mental health care.</strong> We do not provide therapy, counseling, diagnosis, or medical advice. If you are in crisis, please contact the 988 Suicide & Crisis Lifeline (call or text 988) or your local emergency services.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Your account
            </h2>
            <p className="mb-3">You are responsible for maintaining the security of your account credentials. We recommend using a strong, unique password.</p>
            <p>You must be at least 16 years old to use Sessionly. If you are under 18, we encourage you to discuss your use of the app with a parent, guardian, or therapist.</p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Your content
            </h2>
            <p className="mb-3">
              Everything you write in Sessionly — journal entries, session notes, homework logs, trigger logs — belongs to you. We do not claim any ownership or rights to your content.
            </p>
            <p>
              We need a limited license to store, display, and back up your content in order to provide the service. This license ends when you delete your content or account.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Free and Pro plans
            </h2>
            <p className="mb-3">
              Sessionly offers a free tier with core features and a Pro subscription at $6/month (or $48/year). Pro features include unlimited log entries, pattern insights, and PDF export.
            </p>
            <p className="mb-3">
              You can cancel your Pro subscription at any time. Cancellation takes effect at the end of your current billing period. We do not offer partial refunds for unused time.
            </p>
            <p>
              We reserve the right to change pricing with 30 days' notice. Price changes do not affect your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Community discussions
            </h2>
            <p className="mb-3">
              Sessionly includes an anonymous community discussion feature. When participating, you agree to:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-[#4A6741] mt-0.5">&#8226;</span>
                Be respectful of other community members
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4A6741] mt-0.5">&#8226;</span>
                Not share identifying information about yourself or others
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4A6741] mt-0.5">&#8226;</span>
                Not provide medical or therapeutic advice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4A6741] mt-0.5">&#8226;</span>
                Report content that violates these guidelines
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove content and restrict access to the community feature for violations.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Availability
            </h2>
            <p>
              We aim for high availability but cannot guarantee uninterrupted service. We are not liable for data loss due to service interruptions, though we maintain regular encrypted backups to minimize this risk.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Termination
            </h2>
            <p>
              You can delete your account at any time. We may terminate or suspend your account if you violate these terms. In either case, your data will be permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. Significant changes will be communicated via email and in-app notification at least 30 days in advance. Continued use of Sessionly after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Questions?
            </h2>
            <p>
              Reach us at{' '}
              <a href="mailto:legal@sessionly.app" className="text-[#C17A5A] hover:underline">legal@sessionly.app</a>
              {' '}or use our{' '}
              <Link to="/contact" className="text-[#C17A5A] hover:underline">contact form</Link>.
            </p>
          </section>
        </div>
      </article>

      <footer className="border-t border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SessionlyLogo size={24} />
            <span className="text-[14px] text-[#8A7F75]">Nothing gets lost between sessions.</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#8A7F75]">
            <Link to="/privacy" className="hover:text-[#F0EDE8] transition-colors">Privacy Policy</Link>
            <span className="text-[#F0EDE8]">Terms</span>
            <Link to="/contact" className="hover:text-[#F0EDE8] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

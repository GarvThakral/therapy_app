import React from 'react';
import { Link } from 'react-router';
import { SessionlyLogo } from '../components/SessionlyLogo';

export function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="text-[#8A7F75] text-[13px] mb-10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Last updated: February 1, 2026
        </p>

        <div className="space-y-8 text-[#C4BDB4] text-[15px] leading-[1.8]">
          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Your privacy matters deeply to us
            </h2>
            <p>
              Sessionly is built for people navigating one of the most personal parts of their lives. We take that responsibility seriously. This policy explains what data we collect, why, and what we do (and don't do) with it.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              What we collect
            </h2>
            <p className="mb-3"><strong className="text-[#F0EDE8]">Account information:</strong> When you create an account, we collect your email address and a display name of your choosing. We do not require your real name.</p>
            <p className="mb-3"><strong className="text-[#F0EDE8]">Journal entries and logs:</strong> The content you create in Sessionly — trigger logs, session notes, homework items, mood data — is stored securely and encrypted at rest. This data belongs to you.</p>
            <p className="mb-3"><strong className="text-[#F0EDE8]">Usage analytics:</strong> We collect anonymized usage data (pages visited, feature usage) to improve the product. This data is never linked to your journal content.</p>
            <p><strong className="text-[#F0EDE8]">Payment information:</strong> If you subscribe to Pro, payment is processed by Stripe. We never see or store your full credit card number.</p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              What we never do
            </h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#C17A5A] mt-1">&#10005;</span>
                Sell your data to third parties
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C17A5A] mt-1">&#10005;</span>
                Use your journal content to train AI models
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C17A5A] mt-1">&#10005;</span>
                Share your entries with advertisers, employers, or insurance companies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C17A5A] mt-1">&#10005;</span>
                Read your journal entries (our staff does not have access to decrypted content)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Data encryption
            </h2>
            <p>
              All journal entries, session notes, and personal logs are encrypted at rest using AES-256 encryption. Data in transit is protected via TLS 1.3. Your emotional data is treated with the same security standards as financial data.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Data export and deletion
            </h2>
            <p className="mb-3">
              You can export all your data at any time from the Settings page. Your data is yours — we make it easy to take it with you.
            </p>
            <p>
              You can delete your account and all associated data at any time. Deletion is permanent and irreversible. We do not retain copies of your data after deletion.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Cookies
            </h2>
            <p>
              We use essential cookies to keep you logged in and remember your preferences. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Third-party services
            </h2>
            <p>
              We use a minimal set of third-party services: Stripe for payments, a cloud hosting provider for infrastructure, and anonymized analytics. None of these services have access to your journal content.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Changes to this policy
            </h2>
            <p>
              If we make significant changes to this policy, we'll notify you via email and in-app notification at least 30 days before the changes take effect. We'll never quietly weaken your privacy protections.
            </p>
          </section>

          <section>
            <h2 className="text-[#F0EDE8] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
              Contact
            </h2>
            <p>
              Questions about privacy? Reach us at{' '}
              <a href="mailto:privacy@sessionly.app" className="text-[#C17A5A] hover:underline">privacy@sessionly.app</a>
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
            <span className="text-[#F0EDE8]">Privacy Policy</span>
            <Link to="/terms" className="hover:text-[#F0EDE8] transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-[#F0EDE8] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

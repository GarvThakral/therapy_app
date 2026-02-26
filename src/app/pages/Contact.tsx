import React, { useState } from 'react';
import { Link } from 'react-router';
import { Mail, MessageCircle, Shield, Send } from 'lucide-react';
import { SessionlyLogo } from '../components/SessionlyLogo';
import { toast } from 'sonner';

const topics = [
  'General question',
  'Bug report',
  'Feature request',
  'Account & billing',
  'Privacy concern',
  'Press inquiry',
  'Other',
];

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General question');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast.error('Please fill in your email and message.');
      return;
    }
    setSubmitted(true);
    toast.success('Message sent! We\'ll get back to you within 48 hours.');
  };

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

      <div className="max-w-5xl mx-auto px-6 pt-8 pb-20">
        <div className="max-w-2xl mb-12">
          <h1 className="text-[#F0EDE8] mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px' }}>
            Get in touch
          </h1>
          <p className="text-[#8A7F75] text-[16px] leading-relaxed">
            Have a question, found a bug, or just want to say hi? We're a small team and we read every message.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#4A6741]/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-[#4A6741]" />
                </div>
                <h2 className="text-[#F0EDE8] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px' }}>
                  Message sent
                </h2>
                <p className="text-[#8A7F75] text-[14px] mb-6">
                  Thanks for reaching out! We typically respond within 48 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage(''); }}
                  className="text-[#C17A5A] text-[14px] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[#8A7F75] mb-1.5">Name (optional)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="How should we address you?"
                      className="w-full bg-[#231F1B] border border-[#2E2A25] rounded-lg px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A7F75]/60 outline-none focus:border-[#C17A5A]/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#8A7F75] mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-[#231F1B] border border-[#2E2A25] rounded-lg px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A7F75]/60 outline-none focus:border-[#C17A5A]/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] text-[#8A7F75] mb-1.5">Topic</label>
                  <select
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full bg-[#231F1B] border border-[#2E2A25] rounded-lg px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C17A5A]/40 transition-colors"
                  >
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] text-[#8A7F75] mb-1.5">Message *</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={6}
                    required
                    className="w-full bg-[#231F1B] border border-[#2E2A25] rounded-lg px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A7F75]/60 outline-none focus:border-[#C17A5A]/40 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-[#C17A5A] text-white rounded-lg text-[14px] hover:bg-[#C17A5A]/90 transition-all active:translate-y-px"
                >
                  <Send className="w-4 h-4" /> Send message
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#C17A5A]/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#C17A5A]" />
                </div>
                <h3 className="text-[#F0EDE8]" style={{ fontSize: '15px' }}>Email us directly</h3>
              </div>
              <p className="text-[#8A7F75] text-[13px] leading-relaxed mb-2">
                For general inquiries:
              </p>
              <a href="mailto:hello@sessionly.app" className="text-[#C17A5A] text-[14px] hover:underline">hello@sessionly.app</a>
            </div>

            <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#4A6741]/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#4A6741]" />
                </div>
                <h3 className="text-[#F0EDE8]" style={{ fontSize: '15px' }}>Response time</h3>
              </div>
              <p className="text-[#8A7F75] text-[13px] leading-relaxed">
                We typically respond within 48 hours. Bug reports and privacy concerns are prioritized.
              </p>
            </div>

            <div className="bg-[#231F1B] border border-[#2E2A25] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#D4A853]" />
                </div>
                <h3 className="text-[#F0EDE8]" style={{ fontSize: '15px' }}>Privacy first</h3>
              </div>
              <p className="text-[#8A7F75] text-[13px] leading-relaxed">
                For privacy-related concerns, email{' '}
                <a href="mailto:privacy@sessionly.app" className="text-[#C17A5A] hover:underline">privacy@sessionly.app</a>
                {' '}for a faster response.
              </p>
            </div>

            <div className="bg-[#231F1B] border border-[#C17A5A]/20 rounded-xl p-5">
              <p className="text-[#F0EDE8] text-[14px] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                In crisis?
              </p>
              <p className="text-[#8A7F75] text-[13px] leading-relaxed">
                If you or someone you know is in immediate danger, please contact the{' '}
                <strong className="text-[#F0EDE8]">988 Suicide & Crisis Lifeline</strong> (call or text 988)
                or your local emergency services. Sessionly is not a crisis service.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#2E2A25]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SessionlyLogo size={24} />
            <span className="text-[14px] text-[#8A7F75]">Nothing gets lost between sessions.</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#8A7F75]">
            <Link to="/privacy" className="hover:text-[#F0EDE8] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F0EDE8] transition-colors">Terms</Link>
            <span className="text-[#F0EDE8]">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

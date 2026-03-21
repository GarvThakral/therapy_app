import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/SectionHeader';
import { Moon, Sun, Monitor, Download, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { confirmProCheckoutApi, getErrorMessage } from '../lib/api';
import { buildDetailedUserReportPdf } from '../lib/pdf-report';

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    entries,
    archivedEntries,
    sessions,
    homework,
    plan,
    planBenefits,
    monthlyEntryCount,
    selectPlan,
    deleteAccount,
    token,
    refreshSession,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [checkoutConfirming, setCheckoutConfirming] = useState(false);

  const toDateTimeInput = (value: Date) => {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative rounded-full transition-colors duration-200 ${
        checked ? 'bg-terracotta' : 'bg-switch-background'
      }`}
      style={{ minWidth: '40px', width: '40px', height: '22px' }}
    >
      <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 shadow-sm ${
        checked ? 'translate-x-[18px]' : ''
      }`} />
    </button>
  );

  const handleExport = () => {
    if (!planBenefits.hasPdfExport) {
      toast('PDF export is available on Pro plan.', { duration: 2500 });
      return;
    }

    setPdfExportLoading(true);
    try {
      const filename = buildDetailedUserReportPdf({
        displayName: settings.displayName || 'User',
        plan,
        settings,
        entries,
        archivedEntries,
        sessions,
        homework,
      });

      toast(`Detailed PDF exported: ${filename}`, { duration: 2500 });
    } catch (error) {
      toast(getErrorMessage(error, 'Failed to generate detailed PDF report.'), { duration: 3000 });
    } finally {
      setPdfExportLoading(false);
    }
  };

  const handleLegacyJsonExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      entries,
      archivedEntries,
      sessions,
      homework,
      settings: { ...settings, therapistName: settings.therapistName || undefined },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessionly-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON exported.', { duration: 2000 });
  };

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(location.search);
    const status = params.get('status') || params.get('payment_status') || undefined;
    const paymentId = params.get('payment_id') || undefined;
    const sessionId = params.get('session') || undefined;
    const checkoutId = params.get('checkout_id') || undefined;
    const email = params.get('email') || undefined;
    const hasPaymentSignal = Boolean(status || paymentId || sessionId || checkoutId);
    if (!hasPaymentSignal) return;

    const clearPaymentQueryParams = () => {
      const next = new URLSearchParams(location.search);
      ['status', 'payment_status', 'payment_id', 'session', 'checkout_id', 'email', 'license_key'].forEach(key => next.delete(key));
      const search = next.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
        },
        { replace: true },
      );
    };

    if (status && status !== 'succeeded') {
      toast('Payment was not completed.', { duration: 3000 });
      clearPaymentQueryParams();
      return;
    }

    if (checkoutConfirming) return;
    setCheckoutConfirming(true);

    void confirmProCheckoutApi(token, { status, paymentId, sessionId, checkoutId, email })
      .then(async () => {
        await refreshSession();
        toast('Payment successful. Pro is now active.', { duration: 3000 });
      })
      .catch(error => {
        toast(getErrorMessage(error, 'Payment verification failed. Please contact support if charged.'), { duration: 3500 });
      })
      .finally(() => {
        setCheckoutConfirming(false);
        clearPaymentQueryParams();
      });
  }, [checkoutConfirming, location.pathname, location.search, navigate, refreshSession, token]);

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <h1 className="text-foreground mb-1">Settings</h1>
      </div>

      {/* My Therapy Setup */}
      <section className="mb-10">
        <SectionHeader title="My Therapy Setup" />
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Your name</p>
              <p className="text-muted-foreground text-[12px]">How you want to be addressed</p>
            </div>
            <input
              type="text"
              value={settings.displayName}
              onChange={e => updateSettings({ displayName: e.target.value })}
              placeholder="e.g. Alex"
              className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none w-40 text-right"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Therapist name</p>
              <p className="text-muted-foreground text-[12px]">Optional, private</p>
            </div>
            <input
              type="text"
              value={settings.therapistName}
              onChange={e => updateSettings({ therapistName: e.target.value })}
              placeholder="e.g. Dr. Chen"
              className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none w-40 text-right"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-foreground text-[14px]">Session frequency</p>
            <select
              value={settings.sessionFrequency}
              onChange={e => updateSettings({ sessionFrequency: e.target.value as any })}
              className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground outline-none cursor-pointer"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom dates</option>
            </select>
          </div>
          {settings.sessionFrequency !== 'custom' && (
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-foreground text-[14px]">Session day</p>
              <select
                value={settings.sessionDay}
                onChange={e => updateSettings({ sessionDay: e.target.value })}
                className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground outline-none cursor-pointer"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-foreground text-[14px]">Session start time</p>
            <input
              type="time"
              value={settings.sessionTime}
              onChange={e => updateSettings({ sessionTime: e.target.value })}
              className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground outline-none"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Next session begins</p>
              <p className="text-muted-foreground text-[12px]">
                You can pick any date/time. In recurring mode, this auto-rolls when you start a session.
              </p>
            </div>
            <input
              type="datetime-local"
              value={toDateTimeInput(settings.nextSessionDate)}
              onChange={e => {
                const parsed = new Date(e.target.value);
                if (Number.isNaN(parsed.getTime())) return;
                updateSettings({
                  nextSessionDate: parsed,
                  sessionTime: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
                });
              }}
              className="bg-input-background border-none rounded-md px-3 py-1.5 text-[14px] text-foreground outline-none"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-10">
        <SectionHeader title="Notifications" />
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Pre-session prep reminder</p>
              <p className="text-muted-foreground text-[12px]">{settings.preSessionReminder} hours before</p>
            </div>
            <Toggle checked={settings.enablePreReminder} onChange={v => updateSettings({ enablePreReminder: v })} label="Pre-session prep reminder" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Post-session notes reminder</p>
              <p className="text-muted-foreground text-[12px]">{settings.postSessionReminder} hour{settings.postSessionReminder !== 1 ? 's' : ''} after</p>
            </div>
            <Toggle checked={settings.enablePostReminder} onChange={v => updateSettings({ enablePostReminder: v })} label="Post-session notes reminder" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Weekly homework check-in</p>
              <p className="text-muted-foreground text-[12px]">A gentle nudge on Sundays</p>
            </div>
            <Toggle checked={settings.enableHomeworkReminder} onChange={v => updateSettings({ enableHomeworkReminder: v })} label="Weekly homework check-in" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Weekly "anything to log?" nudge</p>
              <p className="text-muted-foreground text-[12px]">Midweek reminder to check in</p>
            </div>
            <Toggle checked={settings.enableWeeklyNudge} onChange={v => updateSettings({ enableWeeklyNudge: v })} label="Weekly anything to log nudge" />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="mb-10">
        <SectionHeader title="Appearance" />
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="px-5 py-4">
            <p className="text-foreground text-[14px] mb-3">Theme</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'system' as const, icon: Monitor, label: 'System' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ theme: opt.value })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] transition-all ${
                    settings.theme === opt.value
                      ? 'border-terracotta/40 bg-terracotta/10 text-terracotta'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                  }`}
                  aria-pressed={settings.theme === opt.value}
                >
                  <opt.icon className="w-4 h-4" strokeWidth={1.5} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-foreground text-[14px] mb-3">Font size</p>
            <div className="flex gap-2">
              {[
                { value: 'standard' as const, label: 'Standard' },
                { value: 'large' as const, label: 'Large' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ fontSize: opt.value })}
                  className={`px-4 py-2 rounded-lg border text-[13px] transition-all ${
                    settings.fontSize === opt.value
                      ? 'border-terracotta/40 bg-terracotta/10 text-terracotta'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                  }`}
                  aria-pressed={settings.fontSize === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-10">
        <SectionHeader title="Privacy" />
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Use entries to improve AI suggestions</p>
              <p className="text-muted-foreground text-[12px]">Off by default. Your data, your choice.</p>
            </div>
            <Toggle checked={settings.aiSuggestions} onChange={v => updateSettings({ aiSuggestions: v })} label="AI suggestions" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-[14px]">Export all data</p>
              <p className="text-muted-foreground text-[12px]">Pro: detailed behavior report PDF · JSON fallback</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={pdfExportLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" /> {pdfExportLoading ? 'Building report...' : 'Export Detailed PDF'}
              </button>
              <button
                onClick={handleLegacyJsonExport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-destructive text-[14px]">Delete account</p>
              <p className="text-muted-foreground text-[12px]">This permanently removes all your data</p>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 rounded-md text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="mb-10">
        <SectionHeader title="Subscription" />
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <div>
              <p className="text-foreground text-[14px]">
                {plan === 'PRO' ? 'Pro Plan' : 'Free Plan'}
              </p>
              <p className="text-muted-foreground text-[12px]">
                {plan === 'PRO' ? '$6/month (Dodo Payments)' : '30 logs/month + core features'}
              </p>
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground mb-3 space-y-1">
            <p>Pattern insights: {planBenefits.hasPatternInsights ? 'Enabled' : 'Locked'}</p>
            <p>PDF export: {planBenefits.hasPdfExport ? 'Enabled' : 'Locked'}</p>
            <p>
              Monthly log limit: {planBenefits.maxMonthlyEntries === null ? 'Unlimited' : `${monthlyEntryCount}/${planBenefits.maxMonthlyEntries}`}
            </p>
          </div>
          {plan !== 'PRO' && (
            <button
              onClick={async () => {
                setSubscriptionLoading(true);
                try {
                  await selectPlan('PRO');
                } catch (error) {
                  toast(getErrorMessage(error, 'Failed to update plan.'), { duration: 3000 });
                } finally {
                  setSubscriptionLoading(false);
                }
              }}
              disabled={subscriptionLoading || checkoutConfirming}
              className="px-4 py-2 bg-terracotta text-white rounded-lg text-[13px] hover:bg-terracotta/90 transition-all active:translate-y-px disabled:opacity-50"
            >
              {subscriptionLoading || checkoutConfirming ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          )}
          {plan === 'PRO' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gold/10 text-gold text-[12px]">
              <Crown className="w-3.5 h-3.5" /> Pro active
            </div>
          )}

        </div>
      </section>

      {/* Delete account dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete your account?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will permanently delete all your entries, sessions, homework, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="px-4 py-2 border border-border rounded-lg text-[14px] text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                void (async () => {
                  try {
                    await deleteAccount();
                    setShowDeleteDialog(false);
                    toast('Account deleted.', { duration: 3000 });
                  } catch (error) {
                    toast(getErrorMessage(error, 'Failed to delete account.'), { duration: 3000 });
                  }
                })();
              }}
              className="px-4 py-2 bg-destructive text-white rounded-lg text-[14px] hover:bg-destructive/90 transition-colors"
            >
              Yes, delete everything
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

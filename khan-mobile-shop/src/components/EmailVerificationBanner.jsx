import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// A quiet, persistent floating reminder for logged-in users whose email isn't
// verified yet — mirrors the existing Toast/WhatsAppButton floating-overlay
// pattern, so it needs no layout coordination with the fixed navbar or any
// page's padding. Dismissing hides it for the current page load only; it
// reappears next visit until the address is actually verified.
const EmailVerificationBanner = () => {
  const { user, isAuthenticated, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const shouldShow = isAuthenticated && user && !user.emailVerified && !user.hasGoogleLinked && !dismissed;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      /* non-critical — the pill itself stays up either way */
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
          className="fixed bottom-6 left-6 z-[55] max-w-xs bg-navy-800 border border-accent/30 shadow-lg rounded-xl2 px-4 py-3"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">📧</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 leading-snug">
                {sent
                  ? 'Verification email sent — check your inbox.'
                  : 'Please verify your email address.'}
              </p>
              {!sent && (
                <button onClick={handleResend} disabled={sending}
                  className="text-xs font-semibold text-accent hover:underline mt-1">
                  {sending ? 'Sending…' : 'Resend Email'}
                </button>
              )}
            </div>
            <button onClick={() => setDismissed(true)} aria-label="Dismiss"
              className="text-slate-400 hover:text-slate-600 text-sm leading-none shrink-0">
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailVerificationBanner;
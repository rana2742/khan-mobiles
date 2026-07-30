import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const missingLink = !token || !email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/auth/reset-password', { email, token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="max-w-md mx-auto bg-navy-800 rounded-xl2 p-8 my-16"
          >
            {missingLink ? (
              <div className="text-center">
                <span className="text-5xl block mb-4">⚠️</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Invalid Link</h1>
                <p className="text-slate-500 text-sm mb-6">
                  This password reset link is incomplete. Please request a new one.
                </p>
                <Link to="/forgot-password"><Button>Request New Link</Button></Link>
              </div>
            ) : done ? (
              <div className="text-center">
                <span className="text-5xl block mb-4">✅</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Password Reset!</h1>
                <p className="text-slate-500 text-sm">Redirecting you to log in…</p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-1 text-center">Set a New Password</h1>
                <p className="text-slate-500 text-sm text-center mb-8">for {email}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">New Password</label>
                    <input
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Confirm New Password</label>
                    <input
                      type="password" required value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                      placeholder="Re-enter your new password"
                    />
                  </div>

                  {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? 'Resetting…' : 'Reset Password'}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default ResetPassword;

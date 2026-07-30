import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
            {submitted ? (
              <div className="text-center">
                <span className="text-5xl block mb-4">📬</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Check Your Email</h1>
                <p className="text-slate-500 text-sm mb-6">
                  If an account exists for <strong className="text-slate-700">{email}</strong>, we've sent a link to reset your password. It expires in 1 hour.
                </p>
                <Link to="/login" className="text-accent text-sm font-medium hover:underline">← Back to Log In</Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-1 text-center">Forgot Password?</h1>
                <p className="text-slate-500 text-sm text-center mb-8">
                  Enter your email and we'll send you a link to reset it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Reset Link'}
                  </Button>
                </form>

                <p className="text-sm text-slate-500 text-center mt-6">
                  Remembered it? <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link>
                </p>
              </>
            )}
          </motion.div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default ForgotPassword;

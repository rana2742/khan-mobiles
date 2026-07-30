import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const GOOGLE_CONFIGURED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Small inline icons so the show/hide toggle doesn't need a new dependency.
const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a15.6 15.6 0 0 1-3.14 4.24M6.5 6.6C3.4 8.5 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.24-.87" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
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
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 text-center">Create Your Account</h1>
            <p className="text-slate-500 text-sm text-center mb-8">Sign up to check out faster next time.</p>

            {GOOGLE_CONFIGURED ? (
              <div className="flex justify-center mb-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed.')}
                  theme="filled_black"
                  shape="pill"
                  width="320"
                  text="signup_with"
                />
              </div>
            ) : (
              <div className="bg-navy-700 border border-navy-700 rounded-xl2 px-4 py-3 text-xs text-slate-500 mb-6 text-center">
                Google sign-in isn&apos;t configured yet. See the README to add your Client ID.
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-navy-700" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-navy-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                <input
                  required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                  placeholder="Ali Khan"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 pr-11 text-slate-900 placeholder-slate-500 text-sm"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm text-center">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-6">
              Already have an account?{' '}
              <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-accent hover:underline font-medium">
                Log in
              </Link>
            </p>
          </motion.div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default Signup;

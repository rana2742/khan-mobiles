import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { user, resendVerification } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return; // StrictMode double-invoke guard — token is single-use
    attempted.current = true;

    if (!token || !email) {
      setStatus('error');
      setMessage('This verification link is incomplete.');
      return;
    }

    api.post('/api/auth/verify-email', { email, token })
      .then(() => {
        setStatus('success');
        window.location.assign('/'); // full reload so AuthContext re-checks /me with fresh status
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'This verification link is invalid or has expired.');
      });
  }, [token, email]);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="max-w-md mx-auto bg-navy-800 rounded-xl2 p-8 my-16 text-center"
          >
            {status === 'verifying' && (
              <>
                <span className="text-5xl block mb-4">⏳</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Verifying…</h1>
                <p className="text-slate-500 text-sm">One moment while we confirm your email.</p>
              </>
            )}
            {status === 'success' && (
              <>
                <span className="text-5xl block mb-4">✅</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Email Verified!</h1>
                <p className="text-slate-500 text-sm">Redirecting you now…</p>
              </>
            )}
            {status === 'error' && (
              <>
                <span className="text-5xl block mb-4">⚠️</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Verification Failed</h1>
                <p className="text-slate-500 text-sm mb-6">{message}</p>
                {user ? (
                  <Button onClick={() => resendVerification()}>Resend Verification Email</Button>
                ) : (
                  <Link to="/login"><Button>Back to Log In</Button></Link>
                )}
              </>
            )}
          </motion.div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default VerifyEmail;
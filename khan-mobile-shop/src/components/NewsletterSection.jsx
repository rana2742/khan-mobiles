import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sectionVariants } from '../utils/motionVariants';
import Button from './Button';
import Container from './Container';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <section className="py-20 bg-navy-800/40">
      <Container>
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-4">
            Stay in the loop
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Get Exclusive Deals &amp; Updates
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Subscribe to our newsletter and be the first to know about new arrivals,
            flash sales, and special offers.
          </p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <span className="text-5xl">🎉</span>
                <p className="text-xl font-bold text-slate-900">Thanks! You&apos;re subscribed.</p>
                <p className="text-slate-500 text-sm">Check your inbox for a welcome offer.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="w-full bg-navy-800 border border-navy-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 rounded-xl2 px-5 py-3.5 text-slate-900 placeholder-slate-500 text-sm transition-colors"
                  />
                  {error && <p className="text-red-600 text-xs mt-1 text-left">{error}</p>}
                </div>
                <Button type="submit" size="md">Subscribe</Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </Container>
    </section>
  );
};

export default NewsletterSection;

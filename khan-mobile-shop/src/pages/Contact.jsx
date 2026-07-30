import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const CONTACT_INFO = [
  { icon: '📍', label: 'Visit Us', value: 'Industrial Estate area near UBL Bank Multan' },
  { icon: '📞', label: 'Call Us', value: '+92 316 695 3535' },
  { icon: '✉️', label: 'Email Us', value: 'khanmobiles345@gmail.com' },
  { icon: '🕐', label: 'Store Hours', value: 'Open Daily: 08am – 10pm' },
];

const emptyForm = { name: '', email: '', subject: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Please enter a valid email.';
    if (!form.message.trim()) errs.message = 'Please enter a message.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post('/api/contact', form);
      setSubmitted(true);
      setForm(emptyForm);
    } catch (err) {
      setSubmitError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Contact Us" description="Get in touch with Khan Mobile Shop — questions about an order, a product, or bulk purchases." path="/contact" />
      <Navbar />
      <main className="pt-16 min-h-screen">
        <section className="bg-gradient-to-b from-navy-800 to-navy py-16">
          <Container>
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">Get In Touch</span>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Contact Us</h1>
              <p className="text-slate-500">
                Have a question about an order, a product, or a bulk purchase? We&apos;d love to hear from you.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-16">
          <Container>
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                {CONTACT_INFO.map((c) => (
                  <div key={c.label} className="bg-navy-800 rounded-xl2 p-5 flex items-start gap-4">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{c.label}</p>
                      <p className="text-sm text-slate-900">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 bg-navy-800 rounded-xl2 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-16">
                      <span className="text-6xl mb-5">✅</span>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
                      <p className="text-slate-500 mb-6 max-w-sm">
                        Thanks for reaching out — our team will get back to you within 24 hours.
                      </p>
                      <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="space-y-5">
                      <h2 className="text-lg font-bold text-slate-900 mb-2">Send Us a Message</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Your Name</label>
                          <input value={form.name} onChange={handleChange('name')}
                            className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                            placeholder="Ali Khan" />
                          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                          <input type="email" value={form.email} onChange={handleChange('email')}
                            className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                            placeholder="you@example.com" />
                          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Subject</label>
                        <input value={form.subject} onChange={handleChange('subject')}
                          className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                          placeholder="Order inquiry, product question, etc." />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Message</label>
                        <textarea rows={5} value={form.message} onChange={handleChange('message')}
                          className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm resize-none"
                          placeholder="Tell us how we can help..." />
                        {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
                      </div>
                      {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
                      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send Message'}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;

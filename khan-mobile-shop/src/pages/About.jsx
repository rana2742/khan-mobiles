import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const VALUES = [
  { icon: '🎯', title: 'Quality First', text: 'Every product is tested and vetted before it reaches our shelves.' },
  { icon: '⚡', title: 'Fast Delivery', text: 'Same-day dispatch in Multan, nationwide delivery in 2–4 days.' },
  { icon: '💬', title: 'Real Support', text: 'A real human answers your questions — no chatbots, no runaround.' },
  { icon: '💸', title: 'Fair Pricing', text: 'Premium accessories without the premium markup.' },
];

const About = () => (
  <>
    <SEO title="About Us" description="Khan Mobile Shop has been Multan's go-to destination for mobile accessories since 2018 — now delivering nationwide across Pakistan." path="/about" />
    <Navbar />
    <main className="pt-16 min-h-screen">
      <section className="bg-gradient-to-b from-navy-800 to-navy py-20">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">Our Story</span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-5">About Khan Mobile Shop</h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Since 2018, Khan Mobile Shop has been Multan&apos;s go-to destination for mobile accessories —
              from Industrial Estate to your doorstep, nationwide.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">From a Small Stall to a Nationwide Brand</h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Khan Mobile Shop started as a single stall in Industrial Estate, Multan, selling phone cases
                and chargers to university students. Word of mouth about honest pricing and genuine
                products turned that stall into a full retail store — and now, into an online shop serving
                customers across Pakistan.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Today we stock over 500 products across cases, chargers, earphones, power banks, screen
                protectors, and smartwatches — all handpicked for durability and value.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl3 h-72 md:h-80"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)' }}
            />
          </div>

          <motion.div
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
          >
            <motion.h2 variants={itemVariants} className="text-2xl md:text-3xl font-extrabold text-center mb-12">
              What We Stand For
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((v) => (
                <motion.div key={v.title} variants={itemVariants}
                  className="bg-navy-800 rounded-xl2 p-6 text-center">
                  <span className="text-4xl block mb-4">{v.icon}</span>
                  <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="text-center mt-24">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Ready to Explore?</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Browse our full catalog and find the perfect accessories for your device.
            </p>
            <Link to="/shop"><Button size="lg">Shop Now</Button></Link>
          </motion.div>
        </Container>
      </section>
    </main>
    <Footer />
  </>
);

export default About;

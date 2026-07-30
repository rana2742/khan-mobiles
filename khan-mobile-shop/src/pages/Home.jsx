import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import HeroSlider from '../components/HeroSlider';
import CategorySection from '../components/CategorySection';
import PromoStrip from '../components/PromoStrip';
import TrendingProducts from '../components/TrendingProducts';
import StatsStrip from '../components/StatsStrip';
import NewsletterSection from '../components/NewsletterSection';
import Footer from '../components/Footer';

const Home = () => (
  <>
    <SEO
      description="Premium mobile accessories for every phone — cases, chargers, earphones, power banks, and more. Fast delivery across Pakistan from Khan Mobile Shop,Industrial Estate Multan."
      path="/"
    />
    <Navbar />
    <main className="pt-16">
      <HeroSlider />
      <CategorySection />
      <PromoStrip />
      <TrendingProducts />
      <StatsStrip />
      <NewsletterSection />
    </main>
    <Footer />
  </>
);

export default Home;

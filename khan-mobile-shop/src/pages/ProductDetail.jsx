import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ProductCard from '../components/ProductCard';

const badgeVariantMap = { New: 'accent', Hot: 'warning', Sale: 'warning', Bestseller: 'success' };

const StarRating = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width={size} height={size} viewBox="0 0 24 24"
        fill={s <= Math.round(rating) ? '#f59e0b' : '#E2E8F0'} stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

const ReviewsSection = ({ productId, rating, reviewCount }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/reviews/product/${productId}`)
      .then((data) => setReviews(data.reviews))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <section className="pb-20 border-t border-navy-700 pt-12">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-extrabold">Customer Reviews</h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={rating} size={18} />
            <span className="text-sm text-slate-500">{rating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="bg-navy-800 rounded-xl2 p-8 text-center">
          <span className="text-4xl block mb-3">⭐</span>
          <p className="text-slate-900 font-semibold mb-1">No reviews yet</p>
          <p className="text-slate-500 text-sm">Be the first to review this product after your order is delivered.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-navy-800 rounded-xl2 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent text-sm font-bold flex items-center justify-center">
                    {r.userName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{r.userName}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <StarRating rating={r.rating} size={14} />
              {r.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.get(`/api/products/${id}`);
      setProduct(data.product);
      setActiveImageIndex(0);
      const relatedData = await api.get(`/api/products?category=${encodeURIComponent(data.product.category)}&limit=5`);
      setRelated(relatedData.products.filter((p) => p.id !== data.product.id).slice(0, 4));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProduct(); window.scrollTo(0, 0); }, [loadProduct]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center text-slate-500">Loading…</main>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Container>
            <div className="text-center py-24">
              <span className="text-7xl mb-6 block">📦</span>
              <h1 className="text-2xl font-bold mb-3">Product not found</h1>
              <p className="text-slate-500 mb-8">This product may have been removed or the link is incorrect.</p>
              <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const { name, price, compareAtPrice, category, brand, rating, reviewCount, badge, bgGradient, imageUrl, images, compatibleModels, description, stock } = product;
  const gallery = images && images.length > 0 ? images : (imageUrl ? [{ id: 'primary', url: imageUrl }] : []);
  const activeImage = gallery[activeImageIndex]?.url || imageUrl;
  const onSale = compareAtPrice && compareAtPrice > price;
  const discountPct = onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const requireLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) return requireLogin();
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) return requireLogin();
    addItem(product, quantity);
    navigate('/checkout');
  };

  return (
    <>
      <SEO
        title={name}
        description={description || `${name} by ${brand} — Rs. ${price.toLocaleString('en-PK')}. Available now at Khan Mobile Shop with fast delivery across Pakistan.`}
        path={`/product/${product.id}`}
        image={activeImage}
      />
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          {/* Breadcrumb */}
          <nav className="py-6 text-sm text-slate-500 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-accent transition-colors">Shop</Link>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(category)}`} className="hover:text-accent transition-colors">{category}</Link>
            <span>/</span>
            <span className="text-slate-600">{name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 pb-16">
            {/* Image gallery */}
            <div>
              <motion.div
                key={activeImage}
                initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                className="relative rounded-xl3 overflow-hidden h-80 md:h-[28rem] bg-cover bg-center"
                style={activeImage ? { backgroundImage: `url(${activeImage})` } : { background: bgGradient }}
              >
                <div className="absolute top-5 left-5 flex flex-col gap-2 items-start">
                  {badge && <Badge variant={badgeVariantMap[badge] || 'accent'}>{badge}</Badge>}
                  {onSale && <Badge variant="warning">-{discountPct}% OFF</Badge>}
                </div>
              </motion.div>

              {gallery.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {gallery.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`w-16 h-16 rounded-xl2 overflow-hidden bg-cover bg-center border-2 transition-colors shrink-0 ${
                        i === activeImageIndex ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundImage: `url(${img.url})` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">{brand}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <StarRating rating={rating} />
                {reviewCount > 0
                  ? <span className="text-sm text-slate-500">{rating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                  : <span className="text-sm text-slate-500">No reviews yet</span>}
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-3xl font-extrabold text-slate-900">Rs. {price.toLocaleString('en-PK')}</p>
                {onSale && (
                  <p className="text-lg text-slate-400 line-through">Rs. {compareAtPrice.toLocaleString('en-PK')}</p>
                )}
              </div>

              <p className="text-slate-500 leading-relaxed mb-4">
                {description || `The ${name} from ${brand} combines premium build quality with everyday reliability.`}
              </p>

              <p className={`text-sm font-medium mb-8 ${stock === 0 ? 'text-red-600' : stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                {stock === 0 ? '✕ Out of stock' : stock < 10 ? `⚠ Only ${stock} left in stock` : '✓ In stock'}
              </p>

              {/* Compatible models */}
              {compatibleModels?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Compatible With</h3>
                  <div className="flex flex-wrap gap-2">
                    {compatibleModels.map((m) => (
                      <span key={m} className="text-xs px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-slate-600">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3 bg-navy-800 border border-navy-700 rounded-xl2 px-2">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 text-lg">−</button>
                  <span className="w-6 text-center text-slate-900 font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 text-lg">+</button>
                </div>
                <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={stock === 0}>
                  {added ? '✓ Added!' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
              <Button variant="secondary" size="lg" className="w-full" disabled={stock === 0} onClick={handleBuyNow}>
                Buy Now
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  <Link to="/login" className="text-accent hover:underline">Log in</Link> to add items to your cart.
                </p>
              )}

              <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-navy-700 text-center">
                <div>
                  <span className="text-2xl block mb-1">🚚</span>
                  <p className="text-xs text-slate-500">Free delivery over Rs. 2,000</p>
                </div>
                <div>
                  <span className="text-2xl block mb-1">↩️</span>
                  <p className="text-xs text-slate-500">7-day easy returns</p>
                </div>
                <div>
                  <span className="text-2xl block mb-1">🛡️</span>
                  <p className="text-xs text-slate-500">1-year warranty</p>
                </div>
              </div>
            </motion.div>
          </div>

          <ReviewsSection productId={product.id} rating={rating} reviewCount={reviewCount} />

          {/* Related products */}
          {related.length > 0 && (
            <section className="pb-20">
              <h2 className="text-2xl font-extrabold mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Container from '../../components/Container';
import Button from '../../components/Button';

const BADGES = ['', 'New', 'Hot', 'Sale', 'Bestseller'];
const MAX_IMAGES = 6;

const emptyForm = {
  name: '', description: '', price: '', compareAtPrice: '', category: '', brand: '',
  badge: '', stock: '', compatibleModels: '', isActive: true,
};

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState([]); // [{id, url}] already saved on the product
  const [newImages, setNewImages] = useState([]); // [{file, preview}] picked but not yet uploaded
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/products/categories').then((d) => setCategories(d.categories.map((c) => c.label))).catch(() => {});
  }, []);

  const loadProduct = useCallback(async () => {
    try {
      const data = await api.get(`/api/products/${id}`);
      const p = data.product;
      setForm({
        name: p.name,
        description: p.description || '',
        price: String(p.price),
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
        category: p.category,
        brand: p.brand,
        badge: p.badge || '',
        stock: String(p.stock),
        compatibleModels: (p.compatibleModels || []).join(', '),
        isActive: p.isActive,
      });
      setExistingImages(p.images || []);
    } catch (err) {
      setError(err.message || 'Could not load product.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (isEdit) loadProduct(); }, [isEdit, loadProduct]);

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const totalImageCount = existingImages.length + newImages.length;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const room = MAX_IMAGES - totalImageCount;
    const accepted = files.slice(0, Math.max(room, 0));
    setNewImages((prev) => [...prev, ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = ''; // allow picking the same file again later if removed
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Existing (already-saved) images delete immediately via their own endpoint —
  // separate from the rest of the form, since there's nothing to "save" for this.
  const removeExistingImage = async (imageId) => {
    setDeletingImageId(imageId);
    try {
      await api.delete(`/api/products/${id}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err.message || 'Could not remove image.');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.price || !form.category.trim() || !form.brand.trim()) {
      setError('Name, price, category, and brand are required.');
      return;
    }
    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
      setError('"Compare at" price must be higher than the actual price.');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    fd.append('price', form.price);
    fd.append('compareAtPrice', form.compareAtPrice);
    fd.append('category', form.category.trim());
    fd.append('brand', form.brand.trim());
    fd.append('badge', form.badge);
    fd.append('stock', form.stock || '0');
    fd.append('compatibleModels', form.compatibleModels);
    fd.append('isActive', String(form.isActive));
    newImages.forEach((img) => fd.append('images', img.file));

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/products/${id}`, fd, { isFormData: true });
      } else {
        await api.post('/api/products', fd, { isFormData: true });
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center text-slate-500">Loading…</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10 max-w-3xl mx-auto">
            <Link to="/admin" className="text-sm text-slate-500 hover:text-accent transition-colors mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold mb-8">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

            <motion.form
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="bg-navy-800 rounded-xl2 p-6 md:p-8 space-y-6"
            >
              {/* Images */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">
                  Product Photos <span className="text-slate-400 font-normal normal-case">({totalImageCount}/{MAX_IMAGES} — first photo is the main one shown on the shop)</span>
                </label>

                <div className="flex flex-wrap gap-3 mb-3">
                  <AnimatePresence>
                    {existingImages.map((img) => (
                      <motion.div key={img.id} exit={{ opacity: 0, scale: 0.8 }}
                        className="relative w-20 h-20 rounded-xl2 overflow-hidden border border-navy-700 group">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img.url})` }} />
                        <button type="button" onClick={() => removeExistingImage(img.id)} disabled={deletingImageId === img.id}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                          {deletingImageId === img.id ? '…' : 'Remove'}
                        </button>
                      </motion.div>
                    ))}
                    {newImages.map((img, i) => (
                      <motion.div key={img.preview} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="relative w-20 h-20 rounded-xl2 overflow-hidden border-2 border-accent/50 group">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img.preview})` }} />
                        <span className="absolute bottom-0 inset-x-0 bg-accent/90 text-white text-[10px] text-center py-0.5">New</span>
                        <button type="button" onClick={() => removeNewImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                          Remove
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {totalImageCount === 0 && (
                    <div className="w-20 h-20 rounded-xl2 border border-navy-700" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }} />
                  )}
                </div>

                {totalImageCount < MAX_IMAGES && (
                  <>
                    <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange}
                      className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl2 file:border-0 file:bg-accent file:text-white file:text-sm file:font-semibold file:cursor-pointer cursor-pointer" />
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG, WEBP or GIF — up to 5MB each, {MAX_IMAGES} photos max.</p>
                  </>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Product Name</label>
                  <input required value={form.name} onChange={handleChange('name')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="Premium Silicone Case" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Price (Rs.)</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={handleChange('price')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="1299" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Compare-at Price <span className="text-slate-400 font-normal normal-case">(optional, shows a sale)</span>
                  </label>
                  <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={handleChange('compareAtPrice')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="e.g. 1599 (must be higher than price)" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={handleChange('stock')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="50" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Category</label>
                  <input required list="category-options" value={form.category} onChange={handleChange('category')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="Cases" />
                  <datalist id="category-options">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Brand</label>
                  <input required value={form.brand} onChange={handleChange('brand')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="ProShield" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Badge</label>
                  <select value={form.badge} onChange={handleChange('badge')}
                    className="w-full bg-navy-700 border border-navy-700 rounded-xl2 px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-accent">
                    {BADGES.map((b) => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 sm:pt-6">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={handleChange('isActive')}
                    className="w-4 h-4 accent-accent" />
                  <label htmlFor="isActive" className="text-sm text-slate-600">Visible in store</label>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Compatible Phone Models</label>
                  <input value={form.compatibleModels} onChange={handleChange('compatibleModels')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm"
                    placeholder="iPhone 14, Samsung S23, Redmi Note 12" />
                  <p className="text-xs text-slate-500 mt-1">Comma-separated.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
                  <textarea rows={4} value={form.description} onChange={handleChange('description')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 text-sm resize-none"
                    placeholder="Short product description shown on the detail page." />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                </Button>
                <Link to="/admin"><Button type="button" variant="secondary" size="lg">Cancel</Button></Link>
              </div>
            </motion.form>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default AdminProductForm;

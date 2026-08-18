const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Product images are stored on Cloudinary instead of local disk — Railway's
// filesystem is ephemeral and gets wiped on every redeploy/restart, which
// would silently delete every uploaded product photo. Cloudinary's URLs are
// permanent regardless of app restarts.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'khan-mobile-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Best-effort deletion from Cloudinary given one of its own URLs — used
// when a product image is removed. Cloudinary URLs look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v169.../khan-mobile-products/abc123.jpg
// The public_id is the folder+filename portion, without the extension.
const extractPublicId = (url) => {
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
};

const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Ignore errors — a missing/already-deleted image shouldn't block the API response.
  }
};

module.exports = upload;
module.exports.deleteFromCloudinary = deleteFromCloudinary;

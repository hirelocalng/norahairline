const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } = require('../utils/media');
require('dotenv').config();

// Cloudinary is kept configured only to delete legacy assets still
// referenced by cloudinary_public_id — new uploads go to R2.
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('[UPLOAD] WARNING: Cloudinary credentials are missing from .env (needed to delete legacy Cloudinary assets).');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memoryStorage = multer.memoryStorage();

function imageOrVideoFilter(req, file, cb) {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Only video files are allowed'));
  }
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
}

// multer applies one fileSize ceiling to every file in a request, so this is
// set to the larger (video) limit; the true 10MB image cap is enforced below
// once files are in memory and we know which field each one came from.
const upload = multer({
  storage: memoryStorage,
  fileFilter: imageOrVideoFilter,
  limits: { fileSize: MAX_VIDEO_SIZE, files: 11 },
});

const uploadFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]);

function handleUpload(req, res, next) {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB for videos.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    const oversized = (req.files?.images || []).some(f => f.size > MAX_IMAGE_SIZE);
    if (oversized) {
      return res.status(400).json({ error: 'Images must be under 10MB each' });
    }
    next();
  });
}

function handleBannerUpload(req, res, next) {
  upload.single('bannerImage')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    if (req.file && req.file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Banner image must be under 10MB' });
    }
    next();
  });
}

const galleryUpload = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  },
  limits: { fileSize: MAX_VIDEO_SIZE },
});

function handleGalleryUpload(req, res, next) {
  galleryUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    if (req.file && req.file.mimetype.startsWith('image/') && req.file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Images must be under 10MB' });
    }
    next();
  });
}

module.exports = { cloudinary, handleUpload, handleBannerUpload, handleGalleryUpload };

const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('[UPLOAD] ERROR: Cloudinary credentials are missing from .env!');
  console.error('[UPLOAD] Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.');
  console.error('[UPLOAD] Get these from: https://cloudinary.com → Dashboard → API Keys');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.fieldname === 'video';
    if (isVideo) {
      return { folder: 'norahairline', resource_type: 'video' };
    }
    return {
      folder: 'norahairline',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Accept any video mimetype
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Only video files are allowed'));
  }
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 11 },
});

// Wraps multer fields upload so errors return JSON instead of HTML
const uploadFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]);

function handleUpload(req, res, next) {
  uploadFields(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB for videos, 100MB for images.' });
    }
    return res.status(400).json({ error: err.message || 'File upload failed' });
  });
}

const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    if (isVideo) {
      return { folder: 'norahairline/gallery', resource_type: 'video' };
    }
    return {
      folder: 'norahairline/gallery',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const galleryUpload = multer({
  storage: galleryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || /jpeg|jpg|png|webp/.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp) and videos (mp4, mov) are allowed'));
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

function handleGalleryUpload(req, res, next) {
  galleryUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ error: err.message || 'File upload failed' });
  });
}

module.exports = { upload, cloudinary, handleUpload, handleGalleryUpload };

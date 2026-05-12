const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.fieldname === 'video';
    return {
      folder: 'norahairline',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      ...(isVideo ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    const ismp4 = path.extname(file.originalname).toLowerCase() === '.mp4' && file.mimetype === 'video/mp4';
    return ismp4 ? cb(null, true) : cb(new Error('Only MP4 video files are allowed'));
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
  limits: { fileSize: 50 * 1024 * 1024, files: 11 },
});

module.exports = { upload, cloudinary };

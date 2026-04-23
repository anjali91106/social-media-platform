const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');

const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  // Use basic multer memory storage for now
  return multer.memoryStorage();
};

const createUploadMiddleware = (folder, fieldName, maxCount = 1, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  const storage = createStorage(folder, allowedFormats);
  
  const fileFilter = (req, file, cb) => {
    const filetypes = new RegExp(allowedFormats.join('|'));
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedFormats.join(', ')} are allowed.`));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: maxCount
    },
    fileFilter: fileFilter
  }).single(fieldName);
};

const createMultipleUploadMiddleware = (folder, fieldName, maxCount = 5, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  const storage = createStorage(folder, allowedFormats);
  
  const fileFilter = (req, file, cb) => {
    const filetypes = new RegExp(allowedFormats.join('|'));
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedFormats.join(', ')} are allowed.`));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit per file
      files: maxCount
    },
    fileFilter: fileFilter
  }).array(fieldName, maxCount);
};


module.exports = {
  createUploadMiddleware,
  createMultipleUploadMiddleware
};

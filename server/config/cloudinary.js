const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getPublicId = (url) => {
  const lastSlashIndex = url.lastIndexOf('/');
  const lastDotIndex = url.lastIndexOf('.');
  return url.substring(lastSlashIndex + 1, lastDotIndex);
};

const deleteFile = async (url) => {
  try {
    const publicId = getPublicId(url);
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

const optimizedUrl = (url, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  let transformations = [];
  
  if (width || height) {
    transformations.push(`w_${width || 'auto'},h_${height || 'auto'},c_${crop}`);
  }
  
  transformations.push(`q_${quality}`, `f_${format}`);
  
  const transformationString = transformations.join(',');
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const publicIdWithExt = url.split('/upload/')[1];
  
  return `${baseUrl}${transformationString}/${publicIdWithExt}`;
};

module.exports = {
  cloudinary,
  deleteFile,
  optimizedUrl,
  getPublicId
};

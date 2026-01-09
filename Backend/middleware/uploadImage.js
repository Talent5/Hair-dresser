const multer = require('multer');
const { uploadImage } = require('../utils/imagekit');

// Configure multer for memory storage (we'll upload to ImageKit from memory)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Middleware to upload single image to ImageKit
 * @param {String} fieldName - Form field name
 * @param {String} folder - ImageKit folder path
 */
const uploadSingleImage = (fieldName, folder = 'hair-dresser') => {
  return async (req, res, next) => {
    // First use multer to handle file upload
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 5MB'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      // If no file uploaded, continue
      if (!req.file) {
        return next();
      }

      try {
        // Upload to ImageKit
        const fileName = `${Date.now()}_${req.file.originalname}`;
        const result = await uploadImage(
          req.file.buffer,
          fileName,
          folder,
          {
            tags: [folder, req.userId || 'unknown']
          }
        );

        // Attach image data to request
        req.imageData = result.data;
        next();
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: error.message
        });
      }
    });
  };
};

/**
 * Middleware to upload multiple images to ImageKit
 * @param {String} fieldName - Form field name
 * @param {Number} maxCount - Maximum number of files
 * @param {String} folder - ImageKit folder path
 */
const uploadMultipleImages = (fieldName, maxCount = 10, folder = 'hair-dresser') => {
  return async (req, res, next) => {
    // First use multer to handle file uploads
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 5MB per file'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `Too many files. Maximum is ${maxCount} files`
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      // If no files uploaded, continue
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Upload all files to ImageKit
        const uploadPromises = req.files.map((file) => {
          const fileName = `${Date.now()}_${file.originalname}`;
          return uploadImage(
            file.buffer,
            fileName,
            folder,
            {
              tags: [folder, req.userId || 'unknown']
            }
          );
        });

        const results = await Promise.all(uploadPromises);

        // Attach image data to request
        req.imagesData = results.map(r => r.data);
        next();
      } catch (error) {
        console.error('Multiple images upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: error.message
        });
      }
    });
  };
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};

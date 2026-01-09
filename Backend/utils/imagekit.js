const ImageKit = require('imagekit');

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload image to ImageKit
 * @param {Buffer|String} file - File buffer or base64 string
 * @param {String} fileName - Name of the file
 * @param {String} folder - Folder path in ImageKit
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload response
 */
const uploadImage = async (file, fileName, folder = 'hair-dresser', options = {}) => {
  try {
    const uploadResponse = await imagekit.upload({
      file, // required: file buffer or base64 string
      fileName, // required: file name
      folder, // optional: folder path
      useUniqueFileName: true, // optional: generate unique filename
      tags: options.tags || [], // optional: tags for the image
      ...options
    });

    return {
      success: true,
      data: {
        fileId: uploadResponse.fileId,
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl,
        name: uploadResponse.name,
        filePath: uploadResponse.filePath,
        size: uploadResponse.size,
        fileType: uploadResponse.fileType,
        height: uploadResponse.height,
        width: uploadResponse.width
      }
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from ImageKit
 * @param {String} fileId - ImageKit file ID
 * @returns {Promise<Object>} - Delete response
 */
const deleteImage = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get image details from ImageKit
 * @param {String} fileId - ImageKit file ID
 * @returns {Promise<Object>} - File details
 */
const getImageDetails = async (fileId) => {
  try {
    const details = await imagekit.getFileDetails(fileId);
    return {
      success: true,
      data: details
    };
  } catch (error) {
    console.error('ImageKit get details error:', error);
    throw new Error(`Failed to get image details: ${error.message}`);
  }
};

/**
 * Generate authentication parameters for client-side upload
 * @returns {Object} - Authentication parameters
 */
const getAuthenticationParameters = () => {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  return {
    signature: authenticationParameters.signature,
    expire: authenticationParameters.expire,
    token: authenticationParameters.token
  };
};

/**
 * Generate optimized URL with transformations
 * @param {String} path - Image path
 * @param {Object} transformations - Transformation options
 * @returns {String} - Transformed URL
 */
const getOptimizedUrl = (path, transformations = {}) => {
  try {
    const url = imagekit.url({
      path,
      transformation: [
        {
          quality: transformations.quality || 80,
          format: transformations.format || 'auto',
          ...transformations
        }
      ]
    });
    return url;
  } catch (error) {
    console.error('ImageKit URL generation error:', error);
    return path;
  }
};

/**
 * Generate thumbnail URL
 * @param {String} path - Image path
 * @param {Number} width - Thumbnail width
 * @param {Number} height - Thumbnail height
 * @returns {String} - Thumbnail URL
 */
const getThumbnailUrl = (path, width = 300, height = 300) => {
  return getOptimizedUrl(path, {
    width,
    height,
    cropMode: 'pad_resize',
    quality: 80
  });
};

module.exports = {
  imagekit,
  uploadImage,
  deleteImage,
  getImageDetails,
  getAuthenticationParameters,
  getOptimizedUrl,
  getThumbnailUrl
};

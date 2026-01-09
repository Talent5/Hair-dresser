# ImageKit Integration Guide

This application now uses **ImageKit** for image storage and optimization. This document explains how to set up and use ImageKit in the Hair Dresser application.

## 🚀 Setup

### 1. Get ImageKit Credentials

1. Sign up for a free account at [ImageKit.io](https://imagekit.io)
2. From your ImageKit dashboard, get:
   - **Public Key**
   - **Private Key**
   - **URL Endpoint** (e.g., `https://ik.imagekit.io/your_imagekit_id`)

### 2. Configure Environment Variables

Add the following to your `.env` file (see `.env.example` for reference):

```env
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### 3. Install Dependencies

```bash
cd Backend
npm install
```

This will install the `imagekit` package along with other dependencies.

## 📁 File Structure

```
Backend/
├── utils/
│   └── imagekit.js          # ImageKit configuration and helper functions
├── middleware/
│   └── uploadImage.js       # Multer + ImageKit upload middleware
├── routes/
│   ├── users.js             # User profile image routes
│   ├── stylists.js          # Stylist portfolio image routes
│   └── auth.js              # ImageKit auth parameters endpoint
└── models/
    ├── User.js              # Updated with ImageKit fields
    └── Stylist.js           # Updated with ImageKit fields
```

## 🎯 API Endpoints

### User Profile Image

#### Upload Profile Avatar
```http
POST /api/users/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: {
  avatar: <image file>
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile avatar uploaded successfully",
  "data": {
    "user": { ... },
    "avatar": {
      "fileId": "...",
      "url": "https://ik.imagekit.io/...",
      "thumbnailUrl": "https://ik.imagekit.io/..."
    }
  }
}
```

#### Delete Profile Avatar
```http
DELETE /api/users/profile/avatar
Authorization: Bearer <token>
```

### Stylist Portfolio Images

#### Add Single Portfolio Item
```http
POST /api/stylists/portfolio
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: {
  image: <image file>,
  service: "braids",
  caption: "Beautiful braided hairstyle"
}
```

#### Add Multiple Portfolio Items
```http
POST /api/stylists/portfolio/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: {
  images: [<image file 1>, <image file 2>, ...],
  portfolioData: JSON.stringify([
    { service: "braids", caption: "Braids style 1" },
    { service: "weaves", caption: "Weave style 1" }
  ])
}
```

#### Delete Portfolio Item
```http
DELETE /api/stylists/portfolio/:itemId
Authorization: Bearer <token>
```

### ImageKit Authentication (for Client-Side Upload)

```http
GET /api/auth/imagekit-auth
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "ImageKit authentication parameters retrieved successfully",
  "data": {
    "signature": "...",
    "expire": 1234567890,
    "token": "..."
  }
}
```

## 🔧 Utility Functions

### Available in `utils/imagekit.js`

```javascript
// Upload image
await uploadImage(fileBuffer, fileName, folder, options);

// Delete image
await deleteImage(fileId);

// Get image details
await getImageDetails(fileId);

// Get authentication parameters (for client-side upload)
getAuthenticationParameters();

// Generate optimized URL
getOptimizedUrl(path, transformations);

// Generate thumbnail URL
getThumbnailUrl(path, width, height);
```

## 📱 Mobile App Integration

### Using Client-Side Upload

1. **Get Authentication Parameters:**
```typescript
const response = await fetch('https://your-api.com/api/auth/imagekit-auth', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const authParams = await response.json();
```

2. **Upload Image from Mobile App:**
```typescript
import ImageKit from 'imagekit-javascript';

const imagekit = new ImageKit({
  publicKey: "your-public-key",
  urlEndpoint: "https://ik.imagekit.io/your_imagekit_id",
  authenticationEndpoint: "https://your-api.com/api/auth/imagekit-auth"
});

// Upload
imagekit.upload({
  file: imageFile, // base64 or File object
  fileName: "profile_image.jpg",
  folder: "/profiles"
}, (err, result) => {
  console.log(result);
});
```

### Using Server-Side Upload (Recommended)

Simply use the form-data upload endpoints:

```typescript
const formData = new FormData();
formData.append('avatar', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'avatar.jpg'
});

const response = await fetch('https://your-api.com/api/users/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
```

## ✨ Features

- **Automatic Image Optimization:** Images are automatically optimized for web and mobile
- **Thumbnail Generation:** Thumbnails are generated for faster loading
- **Secure Upload:** All uploads are authenticated and authorized
- **File Management:** Old images are automatically deleted when replaced
- **Multiple Upload Support:** Upload multiple portfolio images at once
- **CDN Delivery:** Fast image delivery through ImageKit's CDN
- **Transformations:** Support for on-the-fly image transformations

## 🔐 Security

- All upload endpoints require authentication
- File size limit: 5MB per file
- Only image files are accepted
- File type validation on server-side
- Secure deletion of old images

## 📊 Image Storage Structure

```
ImageKit Folders:
├── hair-dresser/
│   ├── profiles/        # User profile images
│   └── portfolio/       # Stylist portfolio images
```

## 🎨 Image Transformations

ImageKit supports various transformations:

```javascript
// Resize
getOptimizedUrl(path, { width: 300, height: 300 });

// Format conversion
getOptimizedUrl(path, { format: 'webp' });

// Quality adjustment
getOptimizedUrl(path, { quality: 80 });

// Crop modes
getOptimizedUrl(path, { cropMode: 'pad_resize' });
```

## 🐛 Troubleshooting

### Image Upload Fails

1. Check that ImageKit credentials are correctly set in `.env`
2. Verify file size is under 5MB
3. Ensure file is an image type
4. Check server logs for detailed error messages

### Images Not Loading

1. Verify URL endpoint is correct
2. Check that images exist in ImageKit dashboard
3. Ensure public key is correct for client-side access

### Authentication Errors

1. Verify private key is correct
2. Check token expiration
3. Ensure user is authenticated

## 📚 Resources

- [ImageKit Documentation](https://docs.imagekit.io/)
- [ImageKit Node.js SDK](https://github.com/imagekit-developer/imagekit-nodejs)
- [ImageKit React Native](https://github.com/imagekit-developer/imagekit-react-native)

## 🔄 Migration from Cloudinary

If you were previously using Cloudinary:

1. Update environment variables to use ImageKit
2. Run the application - new uploads will use ImageKit
3. Existing Cloudinary URLs will continue to work
4. Gradually migrate existing images if needed

## 💡 Best Practices

1. Always delete old images when uploading new ones
2. Use thumbnails for list views
3. Use full images only when needed
4. Implement progressive image loading
5. Cache images on client-side
6. Use appropriate image quality settings (70-80 for most cases)

## 📝 License

This integration is part of the Hair Dresser application.

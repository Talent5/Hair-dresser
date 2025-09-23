# Google Maps Setup Guide

This app now uses Google Maps with billing enabled. Follow these steps to set up your Google Maps API key.

## Prerequisites

1. **Google Cloud Console Account**: You need a Google Cloud Console account with billing enabled
2. **Payment Method**: Google Maps requires a valid payment method for billing

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

### 2. Enable Google Maps APIs

Enable the following APIs in your Google Cloud Console:

- **Maps SDK for Android** (for Android app)
- **Maps SDK for iOS** (for iOS app)
- **Places API** (for location search)
- **Geocoding API** (for address conversion)
- **Directions API** (optional, for directions)

### 3. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Copy your API key
4. Restrict the API key (recommended):
   - Click on the API key to edit it
   - Under **Application restrictions**:
     - For Android: Select "Android apps" and add your package name (`com.curlmap.stylistapp`) and SHA-1 fingerprint
     - For iOS: Select "iOS apps" and add your bundle identifier (`com.curlmap.stylistapp`)

### 4. Add API Key to Your App

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in the following files with your actual API key:

**app.config.js:**
```javascript
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
},
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

### 5. Billing Information

Google Maps pricing (as of 2024):
- **Maps SDK**: $7.00 per 1,000 map loads
- **Places API**: $32.00 per 1,000 requests (for place search)
- **Geocoding API**: $5.00 per 1,000 requests

**Free tier**: Google provides $200 in monthly credit, which covers:
- ~28,500 map loads per month
- Plus other API usage

### 6. Monitor Usage

1. Set up **billing alerts** in Google Cloud Console
2. Monitor usage in **APIs & Services** > **Dashboard**
3. Set **quotas** to prevent unexpected charges

### 7. Security Best Practices

1. **Restrict API keys** to specific platforms
2. **Monitor usage** regularly
3. **Set quotas** and alerts
4. **Never commit API keys** to version control

## Production Deployment

When deploying to production:

1. Use **different API keys** for development and production
2. Enable **detailed logging** for monitoring
3. Set up **proper error handling** for API failures
4. Consider **caching** to reduce API calls

## Cost Optimization Tips

1. **Cache map tiles** when possible
2. **Minimize API calls** by batching requests
3. **Use appropriate zoom levels** to reduce data usage
4. **Implement smart loading** (load maps only when needed)
5. **Set reasonable quotas** to prevent overages

## Troubleshooting

### Common Issues:

1. **"API key not found"**: Check that you've added the key to app.config.js
2. **"This API project is not authorized"**: Verify API restrictions and app signatures
3. **"Quota exceeded"**: Check your usage and billing in Google Cloud Console
4. **"Billing not enabled"**: Ensure billing is set up for your Google Cloud project

### Support Resources:

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Support](https://cloud.google.com/support)
- [Maps Platform Pricing](https://developers.google.com/maps/billing-and-pricing)

## Migration Notes

This app has been reverted from OpenStreetMap (free) back to Google Maps (paid) as requested. The implementation now includes:

- ✅ Google Maps provider (`PROVIDER_GOOGLE`)
- ✅ Proper API key configuration
- ✅ Billing-enabled setup
- ✅ Production-ready implementation
- ✅ Error handling and fallbacks

Your map will now use Google's premium mapping service with all the associated features and billing costs.
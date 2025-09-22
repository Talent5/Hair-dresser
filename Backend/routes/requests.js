const express = require('express');
const Request = require('../models/Request');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Create a new styling request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { styleDescription, offerPrice, preferredTime, additionalNotes, location } = req.body;

    // Get user's location if not provided
    let requestLocation = location;
    if (!requestLocation && req.user.location && req.user.location.coordinates) {
      requestLocation = {
        type: 'Point',
        coordinates: req.user.location.coordinates,
        address: req.user.location.address
      };
    }

    if (!requestLocation || !requestLocation.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Location is required to create a request'
      });
    }

    const request = new Request({
      clientId: req.user.id,
      styleDescription,
      offerPrice,
      preferredTime,
      additionalNotes,
      location: requestLocation
    });

    await request.save();

    // Populate client information
    await request.populate('clientId', 'name email avatar');

    res.status(201).json({
      success: true,
      data: request,
      message: 'Styling request created successfully'
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating request'
    });
  }
});

// Get nearby requests for stylists
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in kilometers

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Convert radius from km to meters for MongoDB
    const radiusInMeters = radius * 1000;

    const requests = await Request.find({
      status: 'pending',
      clientId: { $ne: req.user.id }, // Exclude own requests
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInMeters / 6378100] // Earth radius in meters
        }
      }
    })
    .populate('clientId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

    // Calculate distances and add to response
    const requestsWithDistance = requests.map(request => {
      const requestObj = request.toObject();
      
      // Calculate distance using Haversine formula (approximate)
      const R = 6371; // Earth's radius in km
      const dLat = (parseFloat(lat) - request.location.coordinates[1]) * Math.PI / 180;
      const dLng = (parseFloat(lng) - request.location.coordinates[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(request.location.coordinates[1] * Math.PI / 180) * Math.cos(parseFloat(lat) * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      return {
        ...requestObj,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        clientName: requestObj.clientId.name,
        clientAvatar: requestObj.clientId.avatar
      };
    });

    res.json({
      success: true,
      data: requestsWithDistance
    });
  } catch (error) {
    console.error('Error fetching nearby requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching requests'
    });
  }
});

// Get user's own requests
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({ clientId: req.user.id })
      .populate('acceptedStylistId', 'name avatar')
      .sort({ createdAt: -1 });

    // Get offer counts for each request
    const requestsWithOffers = await Promise.all(
      requests.map(async (request) => {
        const offerCount = await Offer.countDocuments({ requestId: request._id });
        const requestObj = request.toObject();
        return {
          ...requestObj,
          offerCount
        };
      })
    );

    res.json({
      success: true,
      data: requestsWithOffers
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching requests'
    });
  }
});

// Make an offer on a request
router.post('/:requestId/offers', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { price, estimatedTime, message, portfolio } = req.body;

    // Check if request exists and is still pending
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request is no longer accepting offers'
      });
    }

    // Check if user is the request owner
    if (request.clientId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot make an offer on your own request'
      });
    }

    // Check if stylist already made an offer
    const existingOffer = await Offer.findOne({
      requestId,
      stylistId: req.user.id
    });

    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'You have already made an offer on this request'
      });
    }

    const offer = new Offer({
      requestId,
      stylistId: req.user.id,
      price,
      estimatedTime,
      message,
      portfolio
    });

    await offer.save();

    // Update request status to 'offered' if it's the first offer
    if (request.status === 'pending') {
      request.status = 'offered';
      await request.save();
    }

    await offer.populate('stylistId', 'name avatar');

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Offer submitted successfully'
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating offer'
    });
  }
});

// Get offers for a request
router.get('/:requestId/offers', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Check if request exists and user is the owner
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view offers for your own requests'
      });
    }

    const offers = await Offer.find({ requestId })
      .populate('stylistId', 'name avatar rating reviewCount')
      .sort({ createdAt: -1 });

    // Format offers for frontend
    const formattedOffers = offers.map(offer => {
      const offerObj = offer.toObject();
      return {
        ...offerObj,
        stylistName: offerObj.stylistId.name,
        stylistAvatar: offerObj.stylistId.avatar,
        stylistRating: offerObj.stylistId.rating || 5.0,
        stylistReviewCount: offerObj.stylistId.reviewCount || 0
      };
    });

    res.json({
      success: true,
      data: formattedOffers
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching offers'
    });
  }
});

// Accept an offer
router.post('/:requestId/offers/:offerId/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId, offerId } = req.params;

    // Check if request exists and user is the owner
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept offers for your own requests'
      });
    }

    if (request.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been accepted'
      });
    }

    // Check if offer exists
    const offer = await Offer.findById(offerId);
    if (!offer || offer.requestId.toString() !== requestId) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Accept the offer and reject all others
    await Offer.updateMany(
      { requestId },
      { status: 'rejected' }
    );

    offer.status = 'accepted';
    await offer.save();

    // Update request
    request.status = 'accepted';
    request.acceptedOfferId = offerId;
    request.acceptedStylistId = offer.stylistId;
    await request.save();

    await offer.populate('stylistId', 'name avatar');

    res.json({
      success: true,
      data: {
        request,
        offer
      },
      message: 'Offer accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting offer'
    });
  }
});

// Update request status
router.patch('/:requestId/status', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'offered', 'accepted', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is authorized to update this request
    if (request.clientId.toString() !== req.user.id && 
        request.acceptedStylistId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }

    request.status = status;
    await request.save();

    res.json({
      success: true,
      data: request,
      message: 'Request status updated successfully'
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating request status'
    });
  }
});

module.exports = router;
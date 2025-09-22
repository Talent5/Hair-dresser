const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^(\+263|0)[7-9][0-9]{8}$/, 'Please enter a valid Zimbabwean phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'stylist', 'admin'],
    default: 'customer'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: function() {
        return this.role === 'stylist' || this.role === 'customer';
      }
    },
    coordinates: {
      type: [Number],
      required: function() {
        return this.role === 'stylist' || this.role === 'customer';
      },
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90; // latitude
        },
        message: 'Invalid coordinates format [longitude, latitude]'
      }
    }
  },
  address: {
    street: String,
    suburb: String,
    city: { type: String, default: 'Harare' },
    country: { type: String, default: 'Zimbabwe' }
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    notifications: {
      bookings: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index
userSchema.index({ location: '2dsphere' });

// Create text index for search
userSchema.index({ name: 'text', 'address.suburb': 'text' });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, suburb, city, country } = this.address;
  return [street, suburb, city, country].filter(Boolean).join(', ');
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastSeen on login
userSchema.pre('findOneAndUpdate', function() {
  if (this.getUpdate().$set && this.getUpdate().$set.password) {
    // If password is being updated, hash it
    const update = this.getUpdate();
    delete update.$set.password;
    update.$set.lastSeen = new Date();
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find users within radius
userSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000, role = null) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // meters
      }
    },
    isActive: true
  };

  if (role) {
    query.role = role;
  }

  return this.find(query);
};

// Static method for text search
userSchema.statics.searchByText = function(searchTerm, role = null) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };

  if (role) {
    query.role = role;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
             .sort({ score: { $meta: 'textScore' } });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
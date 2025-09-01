const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  secondaryEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Account Type and Status
  accountType: {
    type: String,
    enum: ['colleague', 'member'],
    default: 'colleague'
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'expired', 'pending', 'cancelled'],
    default: 'pending'
  },
  membershipExpiryDate: {
    type: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Academic Information
  affiliation: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  orcidId: {
    type: String,
    trim: true
  },
  cvUrl: {
    type: String
  },
  bio: {
    type: String,
    maxLength: 1000
  },
  
  // Profile Information
  profilePhoto: {
    type: String
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  
  // Topics of Interest
  topicsOfInterest: [{
    type: String,
    trim: true
  }],
  
  // Reviewing Options
  isReviewer: {
    type: Boolean,
    default: false
  },
  reviewerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending'
  },
  reviewerAvailability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    unavailableFrom: {
      type: Date
    },
    unavailableTo: {
      type: Date
    },
    maxReviewsPerYear: {
      type: Number,
      default: 10
    },
    minDaysBetweenAssignments: {
      type: Number,
      default: 7
    }
  },
  
  // Roles and Permissions
  roles: [{
    type: String,
    enum: ['reviewer', 'editor', 'editor-in-chief', 'administrator', 'super-admin']
  }],
  
  // Journal/Conference Associations
  journalRoles: [{
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journal'
    },
    role: {
      type: String,
      enum: ['reviewer', 'editor', 'editor-in-chief']
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    newsletterSubscription: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Social Media Links
  socialLinks: {
    website: String,
    twitter: String,
    facebook: String,
    linkedin: String
  },
  
  // Statistics and Metrics
  stats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    completedReviews: {
      type: Number,
      default: 0
    },
    averageReviewTime: {
      type: Number,
      default: 0
    },
    averageReviewScore: {
      type: Number,
      default: 0
    },
    reviewerRating: {
      type: Number,
      default: 0
    }
  },
  
  // Awards and Recognition
  awards: [{
    type: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    year: Number,
    description: String,
    awardedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ membershipStatus: 1 });
userSchema.index({ 'journalRoles.journalId': 1 });
userSchema.index({ topicsOfInterest: 1 });
userSchema.index({ country: 1, city: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to check if user has role
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

// Instance method to check if user is member
userSchema.methods.isMember = function() {
  return this.accountType === 'member' && this.membershipStatus === 'active';
};

// Static method to find available reviewers
userSchema.statics.findAvailableReviewers = function(journalId, topics) {
  return this.find({
    'journalRoles.journalId': journalId,
    'journalRoles.role': 'reviewer',
    'journalRoles.status': 'active',
    'reviewerAvailability.isAvailable': true,
    topicsOfInterest: { $in: topics },
    isActive: true
  });
};

module.exports = mongoose.model('User', userSchema);

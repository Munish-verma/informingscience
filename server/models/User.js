const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['colleague', 'member', 'student'],
    default: 'colleague'
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'pending'],
    default: 'pending'
  },
  membershipExpiryDate: {
    type: Date
  },
  roles: [{
    type: String,
    enum: ['reviewer', 'editor', 'editor-in-chief', 'administrator', 'super-admin']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
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
  bio: {
    type: String,
    trim: true
  },
  topicsOfInterest: [{
    type: String,
    trim: true
  }],
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
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

// Hash password before saving
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

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);

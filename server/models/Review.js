const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  reviewer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String
  },
  reviewType: {
    type: String,
    enum: ['initial', 'revision', 'final'],
    default: 'initial'
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'declined'],
    default: 'assigned'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  declinedAt: {
    type: Date
  },
  declineReason: {
    type: String,
    trim: true
  },
  recommendation: {
    type: String,
    enum: ['accept', 'minor-revision', 'major-revision', 'reject']
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  detailedRatings: {
    originality: {
      type: Number,
      min: 1,
      max: 5
    },
    methodology: {
      type: Number,
      min: 1,
      max: 5
    },
    results: {
      type: Number,
      min: 1,
      max: 5
    },
    writing: {
      type: Number,
      min: 1,
      max: 5
    },
    significance: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  comments: {
    type: String,
    trim: true
  },
  confidentialComments: {
    type: String,
    trim: true
  },
  suggestions: {
    type: String,
    trim: true
  },
  strengths: {
    type: String,
    trim: true
  },
  weaknesses: {
    type: String,
    trim: true
  },
  additionalFiles: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  editor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  isBlindReview: {
    type: Boolean,
    default: true
  },
  isDoubleBlindReview: {
    type: Boolean,
    default: false
  },
  reviewRound: {
    type: Number,
    default: 1
  },
  previousReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
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

// Update updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Review', reviewSchema);

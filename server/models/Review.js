const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Basic Information
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  journalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review Assignment
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Review Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'withdrawn'],
    default: 'draft'
  },
  
  // Review Form Responses
  responses: [{
    questionId: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['text', 'rating', 'multiple-choice', 'yes-no'],
      required: true
    },
    response: {
      type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  
  // Overall Assessment
  overallAssessment: {
    recommendation: {
      type: String,
      enum: ['accept', 'accept_with_minor_revisions', 'revise_and_resubmit', 'reject'],
      required: true
    },
    confidence: {
      type: String,
      enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
      required: true
    },
    summary: {
      type: String,
      maxLength: 2000,
      required: true
    }
  },
  
  // Comments
  comments: {
    forAuthor: {
      type: String,
      maxLength: 3000
    },
    forEditor: {
      type: String,
      maxLength: 2000
    },
    confidential: {
      type: String,
      maxLength: 1000
    }
  },
  
  // Ratings and Scores
  ratings: {
    originality: {
      type: Number,
      min: 1,
      max: 5
    },
    significance: {
      type: Number,
      min: 1,
      max: 5
    },
    methodology: {
      type: Number,
      min: 1,
      max: 5
    },
    presentation: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Process
  process: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: Date,
    timeSpent: Number, // in minutes
    numberOfDrafts: {
      type: Number,
      default: 0
    }
  },
  
  // Editor Evaluation
  editorEvaluation: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluatedAt: Date
  },
  
  // Withdrawal Information
  withdrawal: {
    reason: String,
    withdrawnAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
reviewSchema.index({ submissionId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ journalId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ 'overallAssessment.recommendation': 1 });

// Pre-save middleware to update updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to update process information
reviewSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'submitted' && !this.process.submittedAt) {
    this.process.submittedAt = new Date();
  }
  
  if (this.isModified('responses')) {
    this.process.numberOfDrafts += 1;
  }
  
  next();
});

// Instance method to calculate average rating
reviewSchema.methods.getAverageRating = function() {
  const ratings = this.ratings;
  const validRatings = Object.values(ratings).filter(rating => rating !== undefined && rating !== null);
  
  if (validRatings.length === 0) return 0;
  
  return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
};

// Instance method to check if review is complete
reviewSchema.methods.isComplete = function() {
  return this.status === 'submitted' && this.overallAssessment.recommendation;
};

// Instance method to get review quality score
reviewSchema.methods.getQualityScore = function() {
  if (!this.editorEvaluation.quality) return null;
  return this.editorEvaluation.quality;
};

// Instance method to submit review
reviewSchema.methods.submitReview = function() {
  this.status = 'submitted';
  this.process.submittedAt = new Date();
};

// Instance method to withdraw review
reviewSchema.methods.withdrawReview = function(reason, approvedBy) {
  this.status = 'withdrawn';
  this.withdrawal = {
    reason,
    withdrawnAt: new Date(),
    approvedBy
  };
};

// Instance method to evaluate review by editor
reviewSchema.methods.evaluateByEditor = function(quality, timeliness, helpfulness, comments, editorId) {
  this.editorEvaluation = {
    quality,
    timeliness,
    helpfulness,
    comments,
    evaluatedBy: editorId,
    evaluatedAt: new Date()
  };
};

// Static method to find reviews by reviewer
reviewSchema.statics.findByReviewer = function(reviewerId) {
  return this.find({ reviewerId }).populate('submissionId', 'title submissionId');
};

// Static method to find reviews by submission
reviewSchema.statics.findBySubmission = function(submissionId) {
  return this.find({ submissionId }).populate('reviewerId', 'firstName lastName email');
};

// Static method to find completed reviews
reviewSchema.statics.findCompleted = function() {
  return this.find({ status: 'submitted' });
};

// Static method to calculate reviewer statistics
reviewSchema.statics.getReviewerStats = function(reviewerId) {
  return this.aggregate([
    { $match: { reviewerId: mongoose.Types.ObjectId(reviewerId), status: 'submitted' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageQuality: { $avg: '$editorEvaluation.quality' },
        averageTimeliness: { $avg: '$editorEvaluation.timeliness' },
        averageHelpfulness: { $avg: '$editorEvaluation.helpfulness' },
        averageRating: { $avg: '$ratings.overall' }
      }
    }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);

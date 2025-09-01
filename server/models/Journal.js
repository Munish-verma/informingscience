const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    maxLength: 2000
  },
  issn: {
    type: String,
    trim: true
  },
  doiPrefix: {
    type: String,
    trim: true
  },
  
  // Status and Configuration
  isActive: {
    type: Boolean,
    default: true
  },
  isOpenForSubmissions: {
    type: Boolean,
    default: true
  },
  
  // Editorial Team
  editorInChief: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    assignedDate: {
      type: Date,
      default: Date.now
    }
  },
  
  associateEditors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    assignedDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  reviewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    topics: [String],
    joinedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }],
  
  // Publication Settings
  publicationSettings: {
    requiresBlinding: {
      type: Boolean,
      default: true
    },
    requiresLineNumbers: {
      type: Boolean,
      default: true
    },
    maxReviewersPerSubmission: {
      type: Number,
      default: 3
    },
    minReviewersPerSubmission: {
      type: Number,
      default: 2
    },
    reviewTimeLimit: {
      type: Number,
      default: 30 // days
    },
    editorDecisionTimeLimit: {
      type: Number,
      default: 7 // days
    }
  },
  
  // Review Form Template
  reviewFormTemplate: {
    questions: [{
      question: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'rating', 'multiple-choice', 'yes-no'],
        default: 'text'
      },
      required: {
        type: Boolean,
        default: true
      },
      options: [String], // for multiple-choice questions
      maxRating: {
        type: Number,
        default: 5
      }
    }]
  },
  
  // Email Templates
  emailTemplates: [{
    name: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    variables: [String], // available variables like [AUTHOR_NAME], [ARTICLE_TITLE]
    isGlobal: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    publishedArticles: {
      type: Number,
      default: 0
    },
    rejectionRate: {
      type: Number,
      default: 0
    },
    averageReviewTime: {
      type: Number,
      default: 0
    },
    averageTimeToPublication: {
      type: Number,
      default: 0
    }
  },
  
  // Current Volume/Issue
  currentVolume: {
    type: Number,
    default: 1
  },
  currentIssue: {
    type: Number,
    default: 1
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
journalSchema.index({ shortName: 1 });
journalSchema.index({ isActive: 1 });
journalSchema.index({ 'editorInChief.userId': 1 });
journalSchema.index({ 'associateEditors.userId': 1 });
journalSchema.index({ 'reviewers.userId': 1 });

// Pre-save middleware to update updatedAt
journalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to get active reviewers
journalSchema.methods.getActiveReviewers = function() {
  return this.reviewers.filter(reviewer => reviewer.status === 'active');
};

// Instance method to get available reviewers for topics
journalSchema.methods.getAvailableReviewersForTopics = function(topics) {
  return this.reviewers.filter(reviewer => 
    reviewer.status === 'active' && 
    reviewer.topics.some(topic => topics.includes(topic))
  );
};

// Instance method to add reviewer
journalSchema.methods.addReviewer = function(userId, name, email, topics) {
  const existingReviewer = this.reviewers.find(r => r.userId.toString() === userId.toString());
  if (existingReviewer) {
    existingReviewer.status = 'active';
    existingReviewer.topics = topics;
  } else {
    this.reviewers.push({
      userId,
      name,
      email,
      topics,
      status: 'active'
    });
  }
};

// Instance method to remove reviewer
journalSchema.methods.removeReviewer = function(userId) {
  const reviewer = this.reviewers.find(r => r.userId.toString() === userId.toString());
  if (reviewer) {
    reviewer.status = 'inactive';
  }
};

// Instance method to add associate editor
journalSchema.methods.addAssociateEditor = function(userId, name, email) {
  const existingEditor = this.associateEditors.find(e => e.userId.toString() === userId.toString());
  if (!existingEditor) {
    this.associateEditors.push({
      userId,
      name,
      email,
      isActive: true
    });
  }
};

// Instance method to remove associate editor
journalSchema.methods.removeAssociateEditor = function(userId) {
  const editor = this.associateEditors.find(e => e.userId.toString() === userId.toString());
  if (editor) {
    editor.isActive = false;
  }
};

module.exports = mongoose.model('Journal', journalSchema);

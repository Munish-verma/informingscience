const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  abstract: {
    type: String,
    required: true,
    maxLength: 2000
  },
  keywords: [{
    type: String,
    trim: true
  }],
  
  // Authors
  authors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    affiliation: String,
    isCorrespondingAuthor: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      required: true
    }
  }],
  
  // Journal Information
  journalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true
  },
  
  // Files
  files: {
    originalManuscript: {
      url: String,
      filename: String,
      uploadedAt: Date,
      fileSize: Number
    },
    blindedManuscript: {
      url: String,
      filename: String,
      processedAt: Date
    },
    supplementaryFiles: [{
      url: String,
      filename: String,
      description: String,
      uploadedAt: Date,
      fileSize: Number
    }]
  },
  
  // Submission Status
  status: {
    type: String,
    enum: [
      'submitted',
      'under_desk_review',
      'desk_rejected',
      'under_review',
      'review_completed',
      'awaiting_editor_decision',
      'decision_made',
      'revision_requested',
      'revision_submitted',
      'accepted',
      'rejected',
      'withdrawn',
      'published'
    ],
    default: 'submitted'
  },
  
  // Editorial Assignment
  assignedEditor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    assignedDate: Date,
    dueDate: Date
  },
  
  // Review Assignments
  reviewAssignments: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewerName: String,
    reviewerEmail: String,
    assignedDate: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'completed', 'withdrawn'],
      default: 'invited'
    },
    invitationSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  }],
  
  // Review Process
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  // Editorial Decision
  editorialDecision: {
    decision: {
      type: String,
      enum: ['accept', 'accept_with_minor_revisions', 'revise_and_resubmit', 'reject'],
      required: false
    },
    decisionDate: Date,
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decisionLetter: {
      type: String,
      maxLength: 5000
    },
    developmentLetter: {
      type: String,
      maxLength: 5000
    },
    revisionDeadline: Date,
    revisionInstructions: String
  },
  
  // Publication Information
  publication: {
    doi: String,
    volume: Number,
    issue: Number,
    pageNumbers: String,
    publishedDate: Date,
    publishedUrl: String,
    downloadCount: {
      type: Number,
      default: 0
    }
  },
  
  // Internal Notes
  internalNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedDate: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }],
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'system_notification', 'internal_note'],
      required: true
    },
    subject: String,
    message: String,
    sentTo: [String], // email addresses
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentDate: {
      type: Date,
      default: Date.now
    },
    templateUsed: String
  }],
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  submissionId: {
    type: String,
    unique: true
  },
  wordCount: Number,
  pageCount: Number,
  plagiarismScore: Number,
  isBlinded: {
    type: Boolean,
    default: false
  }
});

// Indexes
submissionSchema.index({ journalId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ 'authors.userId': 1 });
submissionSchema.index({ 'assignedEditor.userId': 1 });
submissionSchema.index({ 'reviewAssignments.reviewerId': 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ submissionId: 1 });

// Pre-save middleware to update updatedAt
submissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate submission ID
submissionSchema.pre('save', function(next) {
  if (!this.submissionId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.submissionId = `SUB-${year}-${random}`;
  }
  next();
});

// Instance method to get corresponding author
submissionSchema.methods.getCorrespondingAuthor = function() {
  return this.authors.find(author => author.isCorrespondingAuthor);
};

// Instance method to get all author emails
submissionSchema.methods.getAuthorEmails = function() {
  return this.authors.map(author => author.email);
};

// Instance method to check if user is author
submissionSchema.methods.isAuthor = function(userId) {
  return this.authors.some(author => author.userId.toString() === userId.toString());
};

// Instance method to check if user is assigned editor
submissionSchema.methods.isAssignedEditor = function(userId) {
  return this.assignedEditor && this.assignedEditor.userId.toString() === userId.toString();
};

// Instance method to check if user is assigned reviewer
submissionSchema.methods.isAssignedReviewer = function(userId) {
  return this.reviewAssignments.some(assignment => 
    assignment.reviewerId.toString() === userId.toString()
  );
};

// Instance method to get active review assignments
submissionSchema.methods.getActiveReviewAssignments = function() {
  return this.reviewAssignments.filter(assignment => 
    ['invited', 'accepted'].includes(assignment.status)
  );
};

// Instance method to get completed reviews
submissionSchema.methods.getCompletedReviews = function() {
  return this.reviewAssignments.filter(assignment => 
    assignment.status === 'completed'
  );
};

// Instance method to add internal note
submissionSchema.methods.addInternalNote = function(note, userId, isPrivate = true) {
  this.internalNotes.push({
    note,
    addedBy: userId,
    isPrivate
  });
};

// Instance method to add communication
submissionSchema.methods.addCommunication = function(type, subject, message, sentTo, sentBy, templateUsed = null) {
  this.communications.push({
    type,
    subject,
    message,
    sentTo,
    sentBy,
    templateUsed
  });
};

// Static method to find submissions by author
submissionSchema.statics.findByAuthor = function(userId) {
  return this.find({ 'authors.userId': userId });
};

// Static method to find submissions by editor
submissionSchema.statics.findByEditor = function(userId) {
  return this.find({ 'assignedEditor.userId': userId });
};

// Static method to find submissions by reviewer
submissionSchema.statics.findByReviewer = function(userId) {
  return this.find({ 'reviewAssignments.reviewerId': userId });
};

module.exports = mongoose.model('Submission', submissionSchema);

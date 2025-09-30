const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  abstract: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  authors: [{
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
      trim: true,
      lowercase: true
    },
    affiliation: {
      type: String,
      trim: true
    },
    isCorresponding: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      required: true
    }
  }],
  correspondingAuthor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true
  },
  manuscriptFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  coverLetter: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'revision-requested', 'accepted', 'rejected', 'withdrawn'],
    default: 'draft'
  },
  submissionType: {
    type: String,
    enum: ['research-article', 'review-article', 'short-communication', 'case-study', 'letter-to-editor'],
    default: 'research-article'
  },
  subjectArea: {
    type: String,
    trim: true
  },
  wordCount: {
    type: Number
  },
  pageCount: {
    type: Number
  },
  references: [{
    citation: String,
    doi: String,
    url: String
  }],
  reviewHistory: [{
    reviewer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String
    },
    reviewType: {
      type: String,
      enum: ['initial', 'revision', 'final']
    },
    recommendation: {
      type: String,
      enum: ['accept', 'minor-revision', 'major-revision', 'reject']
    },
    comments: String,
    submittedAt: {
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
    email: String,
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  decisionDate: {
    type: Date
  },
  decision: {
    type: String,
    enum: ['accept', 'reject', 'revision-required']
  },
  decisionComments: {
    type: String,
    trim: true
  },
  revisionDeadline: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  doi: {
    type: String,
    trim: true
  },
  volume: {
    type: String,
    trim: true
  },
  issue: {
    type: String,
    trim: true
  },
  pages: {
    type: String,
    trim: true
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
submissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);

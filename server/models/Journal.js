const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
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
    trim: true
  },
  issn: {
    type: String,
    trim: true
  },
  eissn: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  editorInChief: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  associateEditors: [{
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
  }],
  reviewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    expertise: [String],
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  scope: {
    type: String,
    trim: true
  },
  submissionGuidelines: {
    type: String,
    trim: true
  },
  reviewProcess: {
    type: String,
    trim: true
  },
  publicationFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'biannual', 'annual', 'continuous'],
    default: 'quarterly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOpenForSubmissions: {
    type: Boolean,
    default: true
  },
  submissionDeadline: {
    type: Date
  },
  nextIssueDate: {
    type: Date
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    twitter: String,
    linkedin: String,
    facebook: String
  },
  metrics: {
    impactFactor: Number,
    hIndex: Number,
    totalCitations: Number,
    totalArticles: {
      type: Number,
      default: 0
    }
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
journalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Journal', journalSchema);

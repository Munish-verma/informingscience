const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  // Content Identification
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Content Type
  type: {
    type: String,
    enum: ['page', 'section', 'announcement', 'featured-quote', 'faq', 'about', 'news'],
    required: true
  },
  
  // Content Data
  content: {
    type: String,
    required: true
  },
  
  // Rich Text Editor Data
  richContent: {
    type: mongoose.Schema.Types.Mixed // For storing rich text editor data
  },
  
  // Content Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // SEO and Display
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  
  // Display Settings
  displayOrder: {
    type: Number,
    default: 0
  },
  showInNavigation: {
    type: Boolean,
    default: false
  },
  showInFooter: {
    type: Boolean,
    default: false
  },
  
  // Content Categories/Tags
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  
  // Author Information
  author: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  
  // Publishing Information
  publishedAt: {
    type: Date
  },
  publishedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    richContent: mongoose.Schema.Types.Mixed,
    version: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    }
  }],
  
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
contentSchema.index({ key: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ isActive: 1, isPublished: 1 });
contentSchema.index({ slug: 1 });
contentSchema.index({ categories: 1 });
contentSchema.index({ tags: 1 });

// Pre-save middleware to update updatedAt
contentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate slug if not provided or if title changed
  if ((!this.slug || this.isModified('title')) && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Set published date when publishing
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Instance method to create new version
contentSchema.methods.createVersion = function(updatedBy) {
  this.previousVersions.push({
    content: this.content,
    richContent: this.richContent,
    version: this.version,
    updatedBy: updatedBy
  });
  
  this.version += 1;
  // Don't save here - let the calling code handle the save
  return this;
};

// Instance method to get published content
contentSchema.methods.getPublishedContent = function() {
  if (this.isActive && this.isPublished) {
    return {
      key: this.key,
      title: this.title,
      content: this.content,
      richContent: this.richContent,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      slug: this.slug,
      publishedAt: this.publishedAt,
      categories: this.categories,
      tags: this.tags
    };
  }
  return null;
};

// Static method to find content by key
contentSchema.statics.findByKey = function(key) {
  return this.findOne({ key, isActive: true });
};

// Static method to find published content
contentSchema.statics.findPublished = function() {
  return this.find({ isActive: true, isPublished: true }).sort({ displayOrder: 1, title: 1 });
};

// Static method to find content by type
contentSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true, isPublished: true }).sort({ displayOrder: 1, title: 1 });
};

module.exports = mongoose.model('Content', contentSchema);











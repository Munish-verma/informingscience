const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  // Template Identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Template Type
  type: {
    type: String,
    enum: ['system', 'journal', 'conference', 'user', 'notification', 'newsletter'],
    required: true
  },
  
  // Template Content
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  
  // Rich Text Content
  richBody: {
    type: mongoose.Schema.Types.Mixed // For rich text editor content
  },
  
  // Template Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Associated Entities
  journalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal'
  },
  conferenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference'
  },
  
  // Available Variables
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    example: {
      type: String
    },
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  
  // Email Settings
  fromName: {
    type: String,
    trim: true
  },
  fromEmail: {
    type: String,
    trim: true
  },
  replyTo: {
    type: String,
    trim: true
  },
  
  // Template Categories
  categories: [{
    type: String,
    trim: true
  }],
  
  // Usage Statistics
  usage: {
    totalSent: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  
  // Author Information
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    subject: String,
    body: String,
    richBody: mongoose.Schema.Types.Mixed,
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
emailTemplateSchema.index({ key: 1 });
emailTemplateSchema.index({ type: 1 });
emailTemplateSchema.index({ isActive: 1, isGlobal: 1 });
emailTemplateSchema.index({ journalId: 1 });
emailTemplateSchema.index({ conferenceId: 1 });
emailTemplateSchema.index({ categories: 1 });

// Pre-save middleware to update updatedAt
emailTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to create new version
emailTemplateSchema.methods.createVersion = function(updatedBy) {
  this.previousVersions.push({
    subject: this.subject,
    body: this.body,
    richBody: this.richBody,
    version: this.version,
    updatedBy: updatedBy
  });
  
  this.version += 1;
  return this.save();
};

// Instance method to render template with variables
emailTemplateSchema.methods.render = function(variables = {}) {
  let renderedSubject = this.subject;
  let renderedBody = this.body;
  
  // Replace variables in subject and body
  Object.keys(variables).forEach(key => {
    const placeholder = `[${key.toUpperCase()}]`;
    const value = variables[key] || '';
    
    renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
    renderedBody = renderedBody.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return {
    subject: renderedSubject,
    body: renderedBody,
    fromName: this.fromName,
    fromEmail: this.fromEmail,
    replyTo: this.replyTo
  };
};

// Instance method to validate required variables
emailTemplateSchema.methods.validateVariables = function(variables = {}) {
  const missingVariables = [];
  
  this.variables.forEach(variable => {
    if (variable.isRequired && !variables[variable.name]) {
      missingVariables.push(variable.name);
    }
  });
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
};

// Static method to find template by key
emailTemplateSchema.statics.findByKey = function(key) {
  return this.findOne({ key, isActive: true });
};

// Static method to find global templates
emailTemplateSchema.statics.findGlobal = function() {
  return this.find({ isGlobal: true, isActive: true }).sort({ name: 1 });
};

// Static method to find templates by type
emailTemplateSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true }).sort({ name: 1 });
};

// Static method to find templates by journal
emailTemplateSchema.statics.findByJournal = function(journalId) {
  return this.find({ 
    $or: [
      { journalId: journalId },
      { isGlobal: true }
    ],
    isActive: true 
  }).sort({ name: 1 });
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);












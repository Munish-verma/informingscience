const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  // Configuration Key
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Configuration Value
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Configuration Type
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array', 'json'],
    required: true
  },
  
  // Configuration Category
  category: {
    type: String,
    enum: [
      'email', 'payment', 'storage', 'api', 'security', 'general', 
      'notification', 'backup', 'analytics', 'integration', 'system',
      'reviewer', 'editor-in-chief', 'publisher'
    ],
    required: true
  },
  
  // Configuration Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Configuration Settings
  isEncrypted: {
    type: Boolean,
    default: false
  },
  isSensitive: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Validation Rules
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    enum: [String],
    required: Boolean
  },
  
  // Default Value
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Environment Specific
  environment: {
    type: String,
    enum: ['development', 'staging', 'production', 'all'],
    default: 'all'
  },
  
  // Configuration Metadata
  metadata: {
    unit: String, // e.g., 'days', 'bytes', 'percentage'
    format: String, // e.g., 'email', 'url', 'date'
    helpText: String,
    examples: [String]
  },
  
  // Access Control
  accessLevel: {
    type: String,
    enum: ['public', 'admin', 'super-admin'],
    default: 'admin'
  },
  
  // Configuration History
  history: [{
    value: mongoose.Schema.Types.Mixed,
    changedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }
});

// Indexes
systemConfigSchema.index({ key: 1 });
systemConfigSchema.index({ category: 1 });
systemConfigSchema.index({ isPublic: 1 });
systemConfigSchema.index({ accessLevel: 1 });
systemConfigSchema.index({ environment: 1 });

// Pre-save middleware to update updatedAt and create history
systemConfigSchema.pre('save', function(next) {
  const now = new Date();
  this.updatedAt = now;
  
  // Create history entry if value changed
  if (this.isModified('value') && !this.isNew) {
    this.history.push({
      value: this.value,
      changedBy: this.lastModifiedBy,
      changedAt: now
    });
  }
  
  next();
});

// Instance method to get decrypted value
systemConfigSchema.methods.getDecryptedValue = function() {
  if (this.isEncrypted) {
    // In a real implementation, you would decrypt the value here
    // For now, we'll return the value as-is
    return this.value;
  }
  return this.value;
};

// Instance method to validate value
systemConfigSchema.methods.validateValue = function(value) {
  const errors = [];
  
  // Type validation
  if (this.type === 'string' && typeof value !== 'string') {
    errors.push('Value must be a string');
  } else if (this.type === 'number' && typeof value !== 'number') {
    errors.push('Value must be a number');
  } else if (this.type === 'boolean' && typeof value !== 'boolean') {
    errors.push('Value must be a boolean');
  } else if (this.type === 'object' && typeof value !== 'object') {
    errors.push('Value must be an object');
  } else if (this.type === 'array' && !Array.isArray(value)) {
    errors.push('Value must be an array');
  }
  
  // Validation rules
  if (this.validation) {
    if (this.validation.min !== undefined && value < this.validation.min) {
      errors.push(`Value must be at least ${this.validation.min}`);
    }
    if (this.validation.max !== undefined && value > this.validation.max) {
      errors.push(`Value must be at most ${this.validation.max}`);
    }
    if (this.validation.pattern && !new RegExp(this.validation.pattern).test(value)) {
      errors.push(`Value does not match required pattern`);
    }
    if (this.validation.enum && !this.validation.enum.includes(value)) {
      errors.push(`Value must be one of: ${this.validation.enum.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Instance method to update value with history
systemConfigSchema.methods.updateValue = function(newValue, updatedBy, reason) {
  const validation = this.validateValue(newValue);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  this.value = newValue;
  this.lastModifiedBy = updatedBy;
  
  if (reason) {
    this.history[this.history.length - 1].reason = reason;
  }
  
  return this.save();
};

// Static method to get configuration by key
systemConfigSchema.statics.getConfig = function(key) {
  return this.findOne({ key, isPublic: true });
};

// Static method to get all public configurations
systemConfigSchema.statics.getPublicConfigs = function() {
  return this.find({ isPublic: true }).select('key value type category name description metadata');
};

// Static method to get configurations by category
systemConfigSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ name: 1 });
};

// Static method to get sensitive configurations (admin only)
systemConfigSchema.statics.getSensitiveConfigs = function() {
  return this.find({ isSensitive: true }).select('-value');
};

// Static method to initialize default configurations
systemConfigSchema.statics.initializeDefaults = function() {
  const defaultConfigs = [
    {
      key: 'site_name',
      value: 'InformingScience.org',
      type: 'string',
      category: 'general',
      name: 'Site Name',
      description: 'The name of the website',
      isPublic: true
    },
    {
      key: 'site_description',
      value: 'A platform for academic publishing and collaboration',
      type: 'string',
      category: 'general',
      name: 'Site Description',
      description: 'Brief description of the website',
      isPublic: true
    },
    {
      key: 'email_from_name',
      value: 'InformingScience.org',
      type: 'string',
      category: 'email',
      name: 'Email From Name',
      description: 'Default sender name for emails',
      isPublic: false
    },
    {
      key: 'email_from_address',
      value: 'noreply@informingscience.org',
      type: 'string',
      category: 'email',
      name: 'Email From Address',
      description: 'Default sender email address',
      isPublic: false,
      validation: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      }
    },
    {
      key: 'backup_enabled',
      value: true,
      type: 'boolean',
      category: 'backup',
      name: 'Backup Enabled',
      description: 'Whether automatic backups are enabled',
      isPublic: false
    },
    {
      key: 'backup_frequency_days',
      value: 7,
      type: 'number',
      category: 'backup',
      name: 'Backup Frequency (Days)',
      description: 'How often to perform backups',
      isPublic: false,
      validation: {
        min: 1,
        max: 30
      },
      metadata: {
        unit: 'days'
      }
    }
  ];
  
  return Promise.all(
    defaultConfigs.map(config => {
      return this.findOneAndUpdate(
        { key: config.key },
        config,
        { upsert: true, new: true }
      );
    })
  );
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);












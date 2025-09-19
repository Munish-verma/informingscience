const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  // Backup Identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Backup Type
  type: {
    type: String,
    enum: ['full', 'incremental', 'differential', 'manual', 'scheduled'],
    required: true
  },
  
  // Backup Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Backup Scope
  scope: {
    collections: [String], // Which collections to backup
    includeUsers: {
      type: Boolean,
      default: true
    },
    includeContent: {
      type: Boolean,
      default: true
    },
    includeSubmissions: {
      type: Boolean,
      default: true
    },
    includeAnalytics: {
      type: Boolean,
      default: false
    }
  },
  
  // Backup Location
  location: {
    type: {
      type: String,
      enum: ['local', 's3', 'ftp', 'google_drive', 'dropbox'],
      required: true
    },
    path: String,
    bucket: String, // For S3
    region: String, // For S3
    credentials: {
      accessKey: String,
      secretKey: String
    }
  },
  
  // Backup Files
  files: [{
    name: String,
    path: String,
    size: Number, // in bytes
    checksum: String,
    uploadedAt: Date
  }],
  
  // Backup Statistics
  stats: {
    totalSize: {
      type: Number,
      default: 0
    },
    totalRecords: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number, // in milliseconds
      default: 0
    },
    compressionRatio: {
      type: Number,
      default: 0
    }
  },
  
  // Backup Schedule (for scheduled backups)
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    time: String, // HH:MM format
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    cronExpression: String // For custom schedules
  },
  
  // Backup Retention
  retention: {
    keepDays: {
      type: Number,
      default: 30
    },
    maxBackups: {
      type: Number,
      default: 10
    },
    autoDelete: {
      type: Boolean,
      default: true
    }
  },
  
  // Backup Metadata
  metadata: {
    version: String,
    databaseVersion: String,
    serverInfo: {
      hostname: String,
      platform: String,
      nodeVersion: String
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production']
    }
  },
  
  // Error Information
  error: {
    message: String,
    stack: String,
    code: String,
    occurredAt: Date
  },
  
  // Progress Information
  progress: {
    currentStep: String,
    percentage: {
      type: Number,
      default: 0
    },
    estimatedTimeRemaining: Number, // in milliseconds
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Backup History
  history: [{
    action: {
      type: String,
      enum: ['created', 'started', 'completed', 'failed', 'restored', 'deleted']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    performedBy: {
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
  },
  startedAt: Date,
  completedAt: Date,
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }
});

// Indexes
backupSchema.index({ status: 1 });
backupSchema.index({ type: 1 });
backupSchema.index({ createdAt: -1 });
backupSchema.index({ 'schedule.frequency': 1 });
backupSchema.index({ 'location.type': 1 });

// Pre-save middleware to update updatedAt
backupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to start backup
backupSchema.methods.start = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  this.progress.percentage = 0;
  this.progress.currentStep = 'Initializing backup';
  
  this.history.push({
    action: 'started',
    details: 'Backup process started'
  });
  
  return this.save();
};

// Instance method to complete backup
backupSchema.methods.complete = function(stats) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress.percentage = 100;
  this.progress.currentStep = 'Backup completed';
  
  if (stats) {
    this.stats = { ...this.stats, ...stats };
  }
  
  this.history.push({
    action: 'completed',
    details: `Backup completed successfully. Size: ${this.stats.totalSize} bytes, Records: ${this.stats.totalRecords}`
  });
  
  return this.save();
};

// Instance method to fail backup
backupSchema.methods.fail = function(error) {
  this.status = 'failed';
  this.error = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    occurredAt: new Date()
  };
  
  this.history.push({
    action: 'failed',
    details: `Backup failed: ${error.message}`
  });
  
  return this.save();
};

// Instance method to update progress
backupSchema.methods.updateProgress = function(step, percentage, estimatedTimeRemaining) {
  this.progress.currentStep = step;
  this.progress.percentage = percentage;
  this.progress.estimatedTimeRemaining = estimatedTimeRemaining;
  this.progress.lastUpdate = new Date();
  
  return this.save();
};

// Instance method to add file
backupSchema.methods.addFile = function(fileInfo) {
  this.files.push({
    ...fileInfo,
    uploadedAt: new Date()
  });
  
  return this.save();
};

// Instance method to restore from backup
backupSchema.methods.restore = function(restoredBy) {
  this.history.push({
    action: 'restored',
    details: 'Backup was restored',
    performedBy: restoredBy
  });
  
  return this.save();
};

// Instance method to delete backup
backupSchema.methods.delete = function(deletedBy) {
  this.history.push({
    action: 'deleted',
    details: 'Backup was deleted',
    performedBy: deletedBy
  });
  
  return this.save();
};

// Static method to create scheduled backup
backupSchema.statics.createScheduled = function(schedule, createdBy) {
  return this.create({
    name: `Scheduled Backup - ${schedule.frequency}`,
    type: 'scheduled',
    schedule: schedule,
    createdBy: createdBy,
    scope: {
      collections: ['users', 'journals', 'submissions', 'reviews', 'conferences', 'content'],
      includeUsers: true,
      includeContent: true,
      includeSubmissions: true,
      includeAnalytics: false
    }
  });
};

// Static method to create manual backup
backupSchema.statics.createManual = function(name, description, scope, createdBy) {
  return this.create({
    name: name,
    description: description,
    type: 'manual',
    scope: scope,
    createdBy: createdBy
  });
};

// Static method to get scheduled backups
backupSchema.statics.getScheduled = function() {
  return this.find({ type: 'scheduled', status: { $ne: 'cancelled' } });
};

// Static method to get recent backups
backupSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(limit);
};

// Static method to get failed backups
backupSchema.statics.getFailed = function() {
  return this.find({ status: 'failed' })
    .sort({ createdAt: -1 });
};

// Static method to clean old backups
backupSchema.statics.cleanOldBackups = function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep backups for 30 days
  
  return this.find({
    status: 'completed',
    createdAt: { $lt: cutoffDate }
  }).then(backups => {
    return Promise.all(backups.map(backup => backup.delete()));
  });
};

// Static method to get backup statistics
backupSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSize: { $sum: '$stats.totalSize' },
        avgDuration: { $avg: '$stats.duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('Backup', backupSchema);












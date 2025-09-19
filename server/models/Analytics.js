const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Analytics Type
  type: {
    type: String,
    enum: ['page_view', 'user_action', 'system_event', 'performance', 'error'],
    required: true
  },
  
  // Event Details
  event: {
    type: String,
    required: true,
    trim: true
  },
  
  // User Information
  user: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    country: String,
    city: String
  },
  
  // Page/Resource Information
  page: {
    url: String,
    title: String,
    referrer: String,
    path: String
  },
  
  // Event Data
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Performance Metrics
  performance: {
    loadTime: Number, // milliseconds
    responseTime: Number, // milliseconds
    memoryUsage: Number, // bytes
    cpuUsage: Number // percentage
  },
  
  // Error Information
  error: {
    message: String,
    stack: String,
    code: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Date fields for aggregation
  date: {
    type: Date,
    default: Date.now
  },
  year: {
    type: Number,
    index: true
  },
  month: {
    type: Number,
    index: true
  },
  day: {
    type: Number,
    index: true
  },
  hour: {
    type: Number,
    index: true
  }
});

// Indexes for efficient querying
analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ event: 1, timestamp: -1 });
analyticsSchema.index({ 'user.userId': 1, timestamp: -1 });
analyticsSchema.index({ 'page.url': 1, timestamp: -1 });
analyticsSchema.index({ year: 1, month: 1, day: 1 });
analyticsSchema.index({ timestamp: -1 });

// Pre-save middleware to set date fields
analyticsSchema.pre('save', function(next) {
  const date = new Date(this.timestamp);
  this.date = date;
  this.year = date.getFullYear();
  this.month = date.getMonth() + 1;
  this.day = date.getDate();
  this.hour = date.getHours();
  next();
});

// Static method to track page view
analyticsSchema.statics.trackPageView = function(data) {
  return this.create({
    type: 'page_view',
    event: 'page_view',
    user: data.user,
    page: data.page,
    data: data.data
  });
};

// Static method to track user action
analyticsSchema.statics.trackUserAction = function(event, data) {
  return this.create({
    type: 'user_action',
    event: event,
    user: data.user,
    page: data.page,
    data: data.data
  });
};

// Static method to track system event
analyticsSchema.statics.trackSystemEvent = function(event, data) {
  return this.create({
    type: 'system_event',
    event: event,
    data: data
  });
};

// Static method to track performance
analyticsSchema.statics.trackPerformance = function(data) {
  return this.create({
    type: 'performance',
    event: 'performance_metric',
    performance: data.performance,
    page: data.page
  });
};

// Static method to track error
analyticsSchema.statics.trackError = function(error, data) {
  return this.create({
    type: 'error',
    event: 'error_occurred',
    error: error,
    user: data.user,
    page: data.page
  });
};

// Static method to get page views
analyticsSchema.statics.getPageViews = function(startDate, endDate, filters = {}) {
  const query = {
    type: 'page_view',
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (filters.url) {
    query['page.url'] = { $regex: filters.url, $options: 'i' };
  }
  
  if (filters.userId) {
    query['user.userId'] = filters.userId;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get user actions
analyticsSchema.statics.getUserActions = function(startDate, endDate, filters = {}) {
  const query = {
    type: 'user_action',
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (filters.event) {
    query.event = filters.event;
  }
  
  if (filters.userId) {
    query['user.userId'] = filters.userId;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get system events
analyticsSchema.statics.getSystemEvents = function(startDate, endDate, filters = {}) {
  const query = {
    type: 'system_event',
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (filters.event) {
    query.event = filters.event;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get performance metrics
analyticsSchema.statics.getPerformanceMetrics = function(startDate, endDate, filters = {}) {
  const query = {
    type: 'performance',
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (filters.url) {
    query['page.url'] = { $regex: filters.url, $options: 'i' };
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get errors
analyticsSchema.statics.getErrors = function(startDate, endDate, filters = {}) {
  const query = {
    type: 'error',
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (filters.severity) {
    query['error.severity'] = filters.severity;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get aggregated statistics
analyticsSchema.statics.getAggregatedStats = function(startDate, endDate, groupBy = 'day') {
  const groupField = groupBy === 'hour' ? '$hour' : 
                    groupBy === 'day' ? '$day' : 
                    groupBy === 'month' ? '$month' : '$year';
  
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          period: groupField
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user.userId' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { '_id.period': 1 }
    }
  ]);
};

// Static method to get top pages
analyticsSchema.statics.getTopPages = function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$page.url',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user.userId' }
      }
    },
    {
      $project: {
        url: '$_id',
        count: 1,
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get user activity
analyticsSchema.statics.getUserActivity = function(userId, startDate, endDate) {
  return this.find({
    'user.userId': userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

// Static method to clean old analytics data
analyticsSchema.statics.cleanOldData = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Analytics', analyticsSchema);












const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema({
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
  
  // Conference Details
  theme: {
    type: String,
    trim: true
  },
  topics: [{
    type: String,
    trim: true
  }],
  
  // Dates and Location
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  abstractDeadline: {
    type: Date
  },
  paperDeadline: {
    type: Date
  },
  registrationDeadline: {
    type: Date
  },
  
  // Location Information
  location: {
    venue: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isVirtual: {
      type: Boolean,
      default: false
    },
    virtualPlatform: {
      type: String,
      trim: true
    },
    virtualLink: {
      type: String,
      trim: true
    }
  },
  
  // Conference Status
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOpenForRegistration: {
    type: Boolean,
    default: true
  },
  isOpenForSubmissions: {
    type: Boolean,
    default: true
  },
  
  // Organizing Committee
  organizingCommittee: {
    chair: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      affiliation: String
    },
    coChairs: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      affiliation: String
    }],
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      affiliation: String,
      role: String
    }]
  },
  
  // Program Committee
  programCommittee: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    affiliation: String,
    role: {
      type: String,
      enum: ['reviewer', 'track-chair', 'session-chair', 'member']
    },
    topics: [String]
  }],
  
  // Registration Information
  registration: {
    isRequired: {
      type: Boolean,
      default: true
    },
    fees: {
      earlyBird: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD'
        },
        deadline: Date
      },
      regular: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      student: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      member: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      }
    },
    includes: [String], // What's included in registration
    paymentMethods: [{
      type: String,
      enum: ['credit-card', 'paypal', 'bank-transfer', 'check']
    }]
  },
  
  // Submission Guidelines
  submissionGuidelines: {
    maxPages: {
      type: Number,
      default: 10
    },
    minPages: {
      type: Number,
      default: 4
    },
    format: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'latex'],
      default: 'pdf'
    },
    template: {
      type: String // URL to template file
    },
    blindReview: {
      type: Boolean,
      default: true
    },
    categories: [{
      name: String,
      description: String,
      maxPages: Number
    }]
  },
  
  // Conference Links
  links: {
    website: String,
    registration: String,
    submission: String,
    program: String,
    proceedings: String,
    socialMedia: {
      twitter: String,
      facebook: String,
      linkedin: String
    }
  },
  
  // Contact Information
  contact: {
    email: String,
    phone: String,
    address: String
  },
  
  // Statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedPapers: {
      type: Number,
      default: 0
    },
    totalRegistrations: {
      type: Number,
      default: 0
    },
    totalAttendees: {
      type: Number,
      default: 0
    }
  },
  
  // Conference History
  isRecurring: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['annual', 'biannual', 'triennial', 'irregular']
  },
  previousConferences: [{
    year: Number,
    location: String,
    attendance: Number,
    papers: Number
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
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }
});

// Indexes
conferenceSchema.index({ shortName: 1 });
conferenceSchema.index({ status: 1 });
conferenceSchema.index({ startDate: 1 });
conferenceSchema.index({ isActive: 1 });
conferenceSchema.index({ topics: 1 });
conferenceSchema.index({ 'location.city': 1, 'location.country': 1 });

// Pre-save middleware to update updatedAt
conferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-update status based on dates
  const now = new Date();
  if (this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else if (this.endDate < now) {
    this.status = 'completed';
  } else if (this.startDate > now) {
    this.status = 'upcoming';
  }
  
  next();
});

// Instance method to get upcoming conferences
conferenceSchema.statics.getUpcoming = function() {
  return this.find({
    status: 'upcoming',
    isActive: true,
    startDate: { $gte: new Date() }
  }).sort({ startDate: 1 });
};

// Instance method to get past conferences
conferenceSchema.statics.getPast = function() {
  return this.find({
    status: 'completed',
    isActive: true
  }).sort({ endDate: -1 });
};

// Instance method to get current conferences
conferenceSchema.statics.getCurrent = function() {
  const now = new Date();
  return this.find({
    status: 'ongoing',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ startDate: 1 });
};

// Instance method to check if registration is open
conferenceSchema.methods.isRegistrationOpen = function() {
  if (!this.isOpenForRegistration) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  return true;
};

// Instance method to check if submissions are open
conferenceSchema.methods.isSubmissionOpen = function() {
  if (!this.isOpenForSubmissions) return false;
  if (this.paperDeadline && new Date() > this.paperDeadline) return false;
  return true;
};

// Instance method to get registration fee
conferenceSchema.methods.getRegistrationFee = function(userType = 'regular') {
  const now = new Date();
  const fees = this.registration.fees;
  
  if (userType === 'student' && fees.student) {
    return fees.student;
  }
  
  if (userType === 'member' && fees.member) {
    return fees.member;
  }
  
  if (fees.earlyBird && fees.earlyBird.deadline && now <= fees.earlyBird.deadline) {
    return fees.earlyBird;
  }
  
  return fees.regular;
};

// Instance method to add program committee member
conferenceSchema.methods.addProgramCommitteeMember = function(userId, name, email, affiliation, role, topics = []) {
  const existingMember = this.programCommittee.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!existingMember) {
    this.programCommittee.push({
      userId,
      name,
      email,
      affiliation,
      role,
      topics
    });
  }
  
  return this.save();
};

// Instance method to remove program committee member
conferenceSchema.methods.removeProgramCommitteeMember = function(userId) {
  this.programCommittee = this.programCommittee.filter(member => 
    member.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

module.exports = mongoose.model('Conference', conferenceSchema);
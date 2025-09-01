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
  conferenceType: {
    type: String,
    enum: ['annual', 'biennial', 'special', 'workshop'],
    default: 'annual'
  },
  year: {
    type: Number,
    required: true
  },
  edition: {
    type: Number,
    default: 1
  },
  
  // Dates
  dates: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    submissionDeadline: {
      type: Date,
      required: true
    },
    reviewDeadline: Date,
    notificationDate: Date,
    registrationDeadline: Date
  },
  
  // Location
  location: {
    venue: String,
    city: String,
    country: String,
    address: String,
    isVirtual: {
      type: Boolean,
      default: false
    },
    virtualPlatform: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['planning', 'open_for_submissions', 'under_review', 'registration_open', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  
  // Conference Chair
  chair: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    affiliation: String
  },
  
  // Program Committee
  programCommittee: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['chair', 'co-chair', 'member'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Tracks/Sessions
  tracks: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    chair: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Submission Guidelines
  submissionGuidelines: {
    maxPages: {
      type: Number,
      default: 10
    },
    allowedFormats: [{
      type: String,
      enum: ['pdf', 'doc', 'docx'],
      default: ['pdf']
    }],
    requiresAbstract: {
      type: Boolean,
      default: true
    },
    requiresKeywords: {
      type: Boolean,
      default: true
    },
    maxAuthors: {
      type: Number,
      default: 6
    }
  },
  
  // Registration
  registration: {
    isOpen: {
      type: Boolean,
      default: false
    },
    fees: {
      earlyBird: {
        member: Number,
        nonMember: Number,
        student: Number
      },
      regular: {
        member: Number,
        nonMember: Number,
        student: Number
      },
      late: {
        member: Number,
        nonMember: Number,
        student: Number
      }
    },
    capacity: Number,
    registeredCount: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    rejectedSubmissions: {
      type: Number,
      default: 0
    },
    registeredParticipants: {
      type: Number,
      default: 0
    }
  },
  
  // Website and Social Media
  website: {
    url: String,
    customDomain: String
  },
  socialMedia: {
    twitter: String,
    facebook: String,
    linkedin: String
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
conferenceSchema.index({ shortName: 1 });
conferenceSchema.index({ year: 1 });
conferenceSchema.index({ status: 1 });
conferenceSchema.index({ 'dates.startDate': 1 });
conferenceSchema.index({ 'chair.userId': 1 });

// Pre-save middleware to update updatedAt
conferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check if conference is accepting submissions
conferenceSchema.methods.isAcceptingSubmissions = function() {
  const now = new Date();
  return this.status === 'open_for_submissions' && 
         this.dates.submissionDeadline > now;
};

// Instance method to check if conference is ongoing
conferenceSchema.methods.isOngoing = function() {
  const now = new Date();
  return this.dates.startDate <= now && this.dates.endDate >= now;
};

// Instance method to check if registration is open
conferenceSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  return this.registration.isOpen && 
         this.registration.capacity > this.registration.registeredCount &&
         this.dates.registrationDeadline > now;
};

// Instance method to add program committee member
conferenceSchema.methods.addProgramCommitteeMember = function(userId, name, email, role = 'member') {
  const existingMember = this.programCommittee.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
  } else {
    this.programCommittee.push({
      userId,
      name,
      email,
      role,
      isActive: true
    });
  }
};

// Instance method to remove program committee member
conferenceSchema.methods.removeProgramCommitteeMember = function(userId) {
  const member = this.programCommittee.find(member => 
    member.userId.toString() === userId.toString()
  );
  if (member) {
    member.isActive = false;
  }
};

// Instance method to add track
conferenceSchema.methods.addTrack = function(name, description, chairUserId, chairName, chairEmail) {
  this.tracks.push({
    name,
    description,
    chair: {
      userId: chairUserId,
      name: chairName,
      email: chairEmail
    },
    isActive: true
  });
};

// Instance method to get active tracks
conferenceSchema.methods.getActiveTracks = function() {
  return this.tracks.filter(track => track.isActive);
};

// Instance method to get program committee members
conferenceSchema.methods.getActiveProgramCommittee = function() {
  return this.programCommittee.filter(member => member.isActive);
};

// Static method to find upcoming conferences
conferenceSchema.statics.findUpcoming = function() {
  const now = new Date();
  return this.find({
    'dates.startDate': { $gte: now },
    status: { $in: ['planning', 'open_for_submissions', 'under_review', 'registration_open'] }
  }).sort({ 'dates.startDate': 1 });
};

// Static method to find ongoing conferences
conferenceSchema.statics.findOngoing = function() {
  const now = new Date();
  return this.find({
    'dates.startDate': { $lte: now },
    'dates.endDate': { $gte: now },
    status: 'ongoing'
  });
};

// Static method to find conferences by year
conferenceSchema.statics.findByYear = function(year) {
  return this.find({ year }).sort({ 'dates.startDate': 1 });
};

module.exports = mongoose.model('Conference', conferenceSchema);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://dharmendrashukla239_db_user:6CTvn1goGYxsdRPg@cluster0.zuz5amc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Models
const User = require('./models/User');
const Journal = require('./models/Journal');
const Submission = require('./models/Submission');
const Review = require('./models/Review');
const Conference = require('./models/Conference');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// ==================== AUTHENTICATION ROUTES ====================

// User Registration
app.post('/api/auth/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('accountType').isIn(['colleague', 'member']).withMessage('Account type must be colleague or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, accountType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      accountType,
      membershipStatus: accountType === 'member' ? 'pending' : 'active'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        roles: user.roles,
        accountType: user.accountType 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        roles: user.roles,
        accountType: user.accountType 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        roles: user.roles,
        membershipStatus: user.membershipStatus
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('affiliation').optional().trim(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('orcidId').optional().trim(),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('topicsOfInterest').optional().isArray(),
  body('socialLinks').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'affiliation', 'department', 'position',
      'orcidId', 'bio', 'topicsOfInterest', 'socialLinks', 'country', 'city'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        roles: user.roles,
        ...user.toObject()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== JOURNAL ROUTES ====================

// Get All Journals
app.get('/api/journals', async (req, res) => {
  try {
    const journals = await Journal.find({ isActive: true })
      .select('name shortName description issn')
      .sort({ name: 1 });

    res.json({ journals });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Journal by ID
app.get('/api/journals/:id', async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json({ journal });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SUBMISSION ROUTES ====================

// Get User Submissions
app.get('/api/submissions/my', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ 'authors.userId': req.user.userId })
      .populate('journalId', 'name shortName')
      .sort({ submittedAt: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create New Submission
app.post('/api/submissions', authenticateToken, [
  body('title').trim().isLength({ min: 10 }).withMessage('Title must be at least 10 characters'),
  body('abstract').trim().isLength({ min: 50 }).withMessage('Abstract must be at least 50 characters'),
  body('keywords').isArray({ min: 1 }).withMessage('At least one keyword is required'),
  body('journalId').isMongoId().withMessage('Valid journal ID is required'),
  body('authors').isArray({ min: 1 }).withMessage('At least one author is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, abstract, keywords, journalId, authors } = req.body;

    // Verify journal exists and is accepting submissions
    const journal = await Journal.findById(journalId);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    if (!journal.isOpenForSubmissions) {
      return res.status(400).json({ message: 'Journal is not accepting submissions' });
    }

    // Create submission
    const submission = new Submission({
      title,
      abstract,
      keywords,
      journalId,
      authors: authors.map((author, index) => ({
        ...author,
        order: index + 1
      }))
    });

    await submission.save();

    res.status(201).json({
      message: 'Submission created successfully',
      submission: {
        id: submission._id,
        submissionId: submission.submissionId,
        title: submission.title,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Users (Admin only)
app.get('/api/admin/users', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.roles = role;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Role (Admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { roles } = req.body;
    
    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: 'Roles must be an array' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.roles = roles;
    await user.save();

    res.json({ 
      message: 'User roles updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

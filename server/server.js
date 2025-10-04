const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const config = require('./config');
require('dotenv').config();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = config.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Please check:');
  console.error('1. MongoDB Atlas IP whitelist (if using Atlas)');
  console.error('2. Local MongoDB is running (if using local)');
  console.error('3. Connection string is correct');
});

// Import Models
const User = require('./models/User');
const Journal = require('./models/Journal');
const Submission = require('./models/Submission');
const Review = require('./models/Review');
const Conference = require('./models/Conference');
const Content = require('./models/Content');
const EmailTemplate = require('./models/EmailTemplate');
const SystemConfig = require('./models/SystemConfig');
const Analytics = require('./models/Analytics');
const Backup = require('./models/Backup');

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Admin = mongoose.model('Admin', adminSchema);

// JWT Secret
const JWT_SECRET = config.JWT_SECRET;

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

// Middleware to enforce role-based authorization
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// Routes

// Admin Registration
app.post('/api/admin/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await admin.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Login
app.post('/api/admin/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login: Starting login process...');
    console.log('Login: Request body:', { email: req.body.email, password: '[HIDDEN]' });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login: Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Login: Email:', email);

    // Check if User model is properly loaded
    if (!User) {
      console.error('Login: User model is not loaded');
      return res.status(500).json({ message: 'User model not available' });
    }
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Login: MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Login: Admin found:', admin.username);

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      console.log('Login: Invalid password for admin:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Login: Password verified successfully');

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    console.log('Login: Generating JWT token...');
    const token = jwt.sign(
      { 
        id: admin._id,
        userId: admin._id, 
        username: admin.username, 
        email: admin.email, 
        role: admin.role,
        firstName: admin.username,
        lastName: 'Admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Login: JWT token generated');

    console.log('Login: Login successful for admin:', email);
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Login: Detailed error:', error);
    console.error('Login: Error message:', error.message);
    console.error('Login: Error stack:', error.stack);
    console.error('Login: Error type:', typeof error);
    console.error('Login: Error constructor:', error.constructor.name);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Get admin profile (protected route)
app.get('/api/admin/profile', authenticateToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin profile (protected route)
app.put('/api/admin/profile', authenticateToken, [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', admin });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (protected route)
app.put('/api/admin/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
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

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// Get All Users with Advanced Filtering (Admin only)
app.get('/api/admin/users', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '', 
      accountType = '' 
    } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { affiliation: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role) {
      query.roles = role;
    }
    
    // Status filter
    if (status) {
      query.membershipStatus = status;
    }
    
    // Account type filter
    if (accountType) {
      query.accountType = accountType;
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
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User by ID (Admin only)
app.get('/api/admin/users/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User (Admin only)
app.put('/api/admin/users/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'accountType', 'membershipStatus',
      'membershipExpiryDate', 'isActive', 'isEmailVerified', 'roles',
      'affiliation', 'department', 'position', 'orcidId', 'bio',
      'topicsOfInterest', 'country', 'city', 'socialLinks'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        membershipStatus: user.membershipStatus,
        roles: user.roles,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle User Status (Admin only)
app.put('/api/admin/users/:id/status', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset User Password (Admin only)
app.post('/api/admin/users/:id/reset-password', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    await user.save();

    // In a real implementation, you would send an email here
    console.log(`Temporary password for ${user.email}: ${tempPassword}`);

    res.json({ 
      message: 'Password reset successfully. Temporary password sent to user email.',
      tempPassword // Remove this in production
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple test endpoint without authentication
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Test authentication components
app.get('/api/test-auth', async (req, res) => {
  try {
    console.log('Auth Test: Testing authentication components...');
    
    // Test User model
    console.log('Auth Test: User model exists:', !!User);
    if (User) {
      const userCount = await User.countDocuments();
      console.log('Auth Test: User count:', userCount);
    }
    
    // Test JWT_SECRET
    console.log('Auth Test: JWT_SECRET exists:', !!JWT_SECRET);
    console.log('Auth Test: JWT_SECRET length:', JWT_SECRET ? JWT_SECRET.length : 0);
    
    // Test bcrypt
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Auth Test: bcrypt working:', isValid);
    
    res.json({
      message: 'Authentication components test',
      userModelExists: !!User,
      userCount: User ? await User.countDocuments() : 0,
      jwtSecretExists: !!JWT_SECRET,
      jwtSecretLength: JWT_SECRET ? JWT_SECRET.length : 0,
      bcryptWorking: isValid,
      mongooseConnectionState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Auth Test: Error:', error);
    res.status(500).json({
      message: 'Authentication test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test User model without authentication
app.get('/api/test-users', async (req, res) => {
  try {
    console.log('Test Users: Starting test...');
    console.log('Test Users: User model exists:', !!User);
    console.log('Test Users: MongoDB connection state:', mongoose.connection.readyState);
    
    const userCount = await User.countDocuments();
    console.log(`Test Users: Found ${userCount} users`);
    
    const users = await User.find({}).select('-password').limit(2);
    console.log(`Test Users: Retrieved ${users.length} users`);
    
    res.json({ 
      message: 'User model test successful',
      userCount,
      sampleUsers: users.length,
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Test Users: Error:', error);
    res.status(500).json({ 
      message: 'User model test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test Content model without authentication
app.get('/api/test-content', async (req, res) => {
  try {
    console.log('Test Content: Starting test...');
    console.log('Test Content: Content model exists:', !!Content);
    console.log('Test Content: MongoDB connection state:', mongoose.connection.readyState);
    
    const contentCount = await Content.countDocuments();
    console.log(`Test Content: Found ${contentCount} content items`);
    
    const contents = await Content.find({}).limit(2);
    console.log(`Test Content: Retrieved ${contents.length} content items`);
    
    // Test creating a simple content item
    console.log('Test Content: Testing content creation...');
    const testContent = new Content({
      key: 'test-key-' + Date.now(),
      title: 'Test Content',
      content: 'This is a test content',
      type: 'page'
    });
    
    await testContent.save();
    console.log('Test Content: Test content created successfully');
    
    // Test updating the content
    console.log('Test Content: Testing content update...');
    testContent.title = 'Updated Test Content';
    testContent.content = 'This is updated test content';
    await testContent.save();
    console.log('Test Content: Test content updated successfully');
    
    // Clean up test content
    await Content.findByIdAndDelete(testContent._id);
    console.log('Test Content: Test content cleaned up');
    
    res.json({ 
      message: 'Content model test successful',
      contentCount,
      sampleContents: contents.length,
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Test Content: Error:', error);
    res.status(500).json({ 
      message: 'Content model test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint to verify User model is working
app.get('/api/admin/users/test', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    console.log('Test: Checking User model...');
    console.log('Test: MongoDB connection state:', mongoose.connection.readyState);
    console.log('Test: User model exists:', !!User);
    
    const userCount = await User.countDocuments();
    console.log(`Test: Found ${userCount} users in database`);
    
    // Try to fetch one user to test the schema
    const sampleUser = await User.findOne().select('-password');
    console.log('Test: Sample user:', sampleUser ? 'Found' : 'Not found');
    
    res.json({ 
      message: 'User model is working', 
      userCount,
      userModelExists: !!User,
      userModelType: typeof User,
      mongooseConnectionState: mongoose.connection.readyState,
      sampleUserExists: !!sampleUser
    });
  } catch (error) {
    console.error('Test: Error:', error);
    res.status(500).json({ 
      message: 'User model test failed', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Export Users (Admin only) - Simplified version
app.get('/api/admin/users/export', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    console.log('CSV Export: Starting export process...');
    console.log('CSV Export: User making request:', req.user);
    
    // Check if User model is properly loaded
    if (!User) {
      console.error('CSV Export: User model is not loaded');
      return res.status(500).json({ message: 'User model not available' });
    }
    
    console.log('CSV Export: Fetching users from database...');
    const users = await User.find({}).select('-password');
    console.log(`CSV Export: Found ${users.length} users`);
    
    // Simple CSV generation without complex processing
      const csvHeader = 'ID,First Name,Last Name,Email,Account Type,Membership Status,Is Active,Roles,Affiliation,Country,Created At\n';
    
    let csvData = '';
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`CSV Export: Processing user ${i}: ${user.firstName} ${user.lastName}`);
      
        const roles = Array.isArray(user.roles) ? user.roles.join(';') : '';
        const createdAt = user.createdAt ? new Date(user.createdAt).toISOString() : '';
        
      const row = [
        user._id || '',
        user.firstName || '',
        user.lastName || '',
        user.email || '',
        user.accountType || '',
        user.membershipStatus || '',
        user.isActive || false,
        roles,
        user.affiliation || '',
        user.country || '',
        createdAt
        ].join(',');
      
      csvData += row + '\n';
      }
    
    const csv = csvHeader + csvData;
    console.log(`CSV Export: Generated CSV with ${csv.length} characters`);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
    console.log('CSV Export: Export completed successfully');

  } catch (error) {
    console.error('CSV Export: Detailed error:', error);
    console.error('CSV Export: Error message:', error.message);
    console.error('CSV Export: Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== ADMIN JOURNAL MANAGEMENT ROUTES ====================

// Get All Journals (Admin only)
app.get('/api/admin/journals', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const journals = await Journal.find({})
      .populate('editorInChief.userId', 'firstName lastName email')
      .populate('associateEditors.userId', 'firstName lastName email')
      .populate('reviewers.userId', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({ journals });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Journal (Admin only)
app.post('/api/admin/journals', authenticateToken, requireRole(['administrator', 'super-admin']), [
  body('name').trim().isLength({ min: 3 }).withMessage('Journal name must be at least 3 characters'),
  body('shortName').trim().isLength({ min: 2 }).withMessage('Short name must be at least 2 characters'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const journal = new Journal(req.body);
    await journal.save();

    res.status(201).json({
      message: 'Journal created successfully',
      journal
    });

  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Journal (Admin only)
app.put('/api/admin/journals/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const journal = await Journal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json({
      message: 'Journal updated successfully',
      journal
    });

  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Journal (Admin only)
app.delete('/api/admin/journals/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const journal = await Journal.findByIdAndDelete(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json({ message: 'Journal deleted successfully' });

  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Journal Status (Admin only)
app.put('/api/admin/journals/:id/status', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { isActive } = req.body;
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    journal.isActive = isActive;
    await journal.save();

    res.json({
      message: `Journal ${isActive ? 'activated' : 'deactivated'} successfully`,
      journal: {
        id: journal._id,
        isActive: journal.isActive
      }
    });

  } catch (error) {
    console.error('Toggle journal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN CONFERENCE MANAGEMENT ROUTES ====================

// Get All Conferences (Admin only)
app.get('/api/admin/conferences', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const conferences = await Conference.find({})
      .populate('organizingCommittee.chair.userId', 'firstName lastName email')
      .populate('organizingCommittee.coChairs.userId', 'firstName lastName email')
      .populate('organizingCommittee.members.userId', 'firstName lastName email')
      .populate('programCommittee.userId', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json({ conferences });
  } catch (error) {
    console.error('Get conferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Conference (Admin only)
app.post('/api/admin/conferences', authenticateToken, requireRole(['administrator', 'super-admin']), [
  body('name').trim().isLength({ min: 3 }).withMessage('Conference name must be at least 3 characters'),
  body('shortName').trim().isLength({ min: 2 }).withMessage('Short name must be at least 2 characters'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conference = new Conference(req.body);
    await conference.save();

    res.status(201).json({
      message: 'Conference created successfully',
      conference
    });

  } catch (error) {
    console.error('Create conference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Conference (Admin only)
app.put('/api/admin/conferences/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const conference = await Conference.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    res.json({
      message: 'Conference updated successfully',
      conference
    });

  } catch (error) {
    console.error('Update conference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Conference (Admin only)
app.delete('/api/admin/conferences/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const conference = await Conference.findByIdAndDelete(req.params.id);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    res.json({ message: 'Conference deleted successfully' });

  } catch (error) {
    console.error('Delete conference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Conference Status (Admin only)
app.put('/api/admin/conferences/:id/status', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { isActive } = req.body;
    const conference = await Conference.findById(req.params.id);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    conference.isActive = isActive;
    await conference.save();

    res.json({
      message: `Conference ${isActive ? 'activated' : 'deactivated'} successfully`,
      conference: {
        id: conference._id,
        isActive: conference.isActive
      }
    });

  } catch (error) {
    console.error('Toggle conference status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN CONTENT MANAGEMENT ROUTES ====================

// Get All Content (Admin only)
app.get('/api/admin/content', authenticateToken, requireRole(['admin', 'administrator', 'super-admin']), async (req, res) => {
  try {
    const contents = await Content.find({})
      .populate('author.userId', 'firstName lastName email')
      .populate('publishedBy.userId', 'firstName lastName')
      .sort({ updatedAt: -1 });

    res.json({ contents });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Content (Admin only)
app.post('/api/admin/content', authenticateToken, requireRole(['admin', 'administrator', 'super-admin']), [
  body('key').trim().isLength({ min: 2 }).withMessage('Content key must be at least 2 characters'),
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('type').isIn(['page', 'section', 'announcement', 'featured-quote', 'faq', 'about', 'news']).withMessage('Invalid content type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const content = new Content({
      ...req.body,
      author: {
        userId: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email
      }
    });

    await content.save();

    res.status(201).json({
      message: 'Content created successfully',
      content
    });

  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Content (Admin only)
app.put('/api/admin/content/:id', authenticateToken, requireRole(['admin', 'administrator', 'super-admin']), [
  body('title').optional().trim().isLength({ min: 1 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('type').optional().isIn(['page', 'section', 'announcement', 'featured-quote', 'faq', 'about', 'news']),
  body('key').optional().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    console.log('Content Update: Starting update process...');
    console.log('Content Update: Content ID:', req.params.id);
    console.log('Content Update: User making request:', req.user);
    console.log('Content Update: User keys:', Object.keys(req.user || {}));
    console.log('Content Update: Request body keys:', Object.keys(req.body || {}));
    console.log('Content Update: Request body:', req.body);
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Content Update: Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if Content model is properly loaded
    if (!Content) {
      console.error('Content Update: Content model is not loaded');
      return res.status(500).json({ message: 'Content model not available' });
    }
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Content Update: MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    console.log('Content Update: Finding content by ID...');
    let content;
    try {
      content = await Content.findById(req.params.id);
      console.log('Content Update: Database query completed');
    } catch (dbError) {
      console.error('Content Update: Database query error:', dbError);
      throw dbError;
    }
    
    if (!content) {
      console.log('Content Update: Content not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Content not found' });
    }
    
    console.log('Content Update: Content found:', content.title);
    console.log('Content Update: Content current version:', content.version);

    // Create version before updating
    console.log('Content Update: Creating version...');
    try {
      const userName = req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.email || 'Unknown User';
      
      console.log('Content Update: User info:', {
        userId: req.user.userId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        userName: userName
      });
      
      content.createVersion({
        userId: req.user.userId,
        name: userName
      });
      console.log('Content Update: Version created successfully');
    } catch (versionError) {
      console.error('Content Update: Error creating version:', versionError);
      // Continue with update even if version creation fails
    }

    // Update content - only update allowed fields
    console.log('Content Update: Updating content fields...');
    const allowedFields = [
      'title', 'description', 'content', 'richContent', 'type', 'isActive', 
      'isPublished', 'metaTitle', 'metaDescription', 'displayOrder', 
      'showInNavigation', 'showInFooter', 'categories', 'tags'
    ];
    
    // Filter out system fields that shouldn't be updated
    const systemFields = ['_id', 'createdAt', 'updatedAt', '__v', 'version', 'previousVersions', 'author', 'publishedBy', 'publishedAt'];
    const requestFields = Object.keys(req.body).filter(key => !systemFields.includes(key));
    const fieldsToUpdate = requestFields.filter(key => allowedFields.includes(key));
    
    console.log('Content Update: Request fields:', requestFields);
    console.log('Content Update: Fields to update:', fieldsToUpdate);
    console.log('Content Update: System fields filtered out:', Object.keys(req.body).filter(key => systemFields.includes(key)));
    
    // Update fields one by one with error handling
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        try {
          console.log(`Content Update: Updating field ${field}:`, req.body[field]);
          content[field] = req.body[field];
          console.log(`Content Update: Field ${field} updated successfully`);
        } catch (fieldError) {
          console.error(`Content Update: Error updating field ${field}:`, fieldError);
          throw new Error(`Failed to update field ${field}: ${fieldError.message}`);
        }
      }
    }
    
    console.log('Content Update: All fields updated successfully');
    
    // Handle slug conflicts if title is being updated
    if (req.body.title && req.body.title !== content.title) {
      console.log('Content Update: Title changed, checking for slug conflicts...');
      const baseSlug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug already exists for another content item
      while (true) {
        const existingContent = await Content.findOne({ 
          slug: slug, 
          _id: { $ne: content._id } 
        });
        if (!existingContent) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      content.slug = slug;
      console.log('Content Update: Generated unique slug:', slug);
    }
    
    console.log('Content Update: Saving content...');
    try {
      await content.save();
      console.log('Content Update: Content saved successfully');
    } catch (saveError) {
      console.error('Content Update: Save error details:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Content Update: Validation errors:', saveError.errors);
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.keys(saveError.errors).map(key => ({
            field: key,
            message: saveError.errors[key].message
          }))
        });
      } else if (saveError.code === 11000) {
        console.error('Content Update: Duplicate key error:', saveError.keyValue);
        return res.status(400).json({ 
          message: 'Duplicate key error', 
          field: Object.keys(saveError.keyValue)[0],
          value: Object.values(saveError.keyValue)[0]
        });
      } else {
        throw saveError; // Re-throw to be caught by outer catch
      }
    }

    res.json({
      message: 'Content updated successfully',
      content
    });

  } catch (error) {
    console.error('Content Update: ===== ERROR OCCURRED =====');
    console.error('Content Update: Error object:', error);
    console.error('Content Update: Error message:', error.message);
    console.error('Content Update: Error name:', error.name);
    console.error('Content Update: Error code:', error.code);
    console.error('Content Update: Error type:', typeof error);
    console.error('Content Update: Error constructor:', error.constructor.name);
    console.error('Content Update: Error stack:', error.stack);
    
    if (error.errors) {
      console.error('Content Update: Validation errors:', error.errors);
    }
    
    if (error.keyValue) {
      console.error('Content Update: Duplicate key value:', error.keyValue);
    }
    
    console.error('Content Update: ===== END ERROR =====');
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      errorType: error.constructor.name,
      errorName: error.name,
      errorCode: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete Content (Admin only)
app.delete('/api/admin/content/:id', authenticateToken, requireRole(['admin', 'administrator', 'super-admin']), async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({ message: 'Content deleted successfully' });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Content Status (Admin only)
app.put('/api/admin/content/:id/status', authenticateToken, requireRole(['admin', 'administrator', 'super-admin']), async (req, res) => {
  try {
    const { field, value } = req.body;
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (field === 'isActive' || field === 'isPublished') {
      content[field] = value;
      await content.save();
    }

    res.json({
      message: `Content ${field} updated successfully`,
      content: {
        id: content._id,
        [field]: content[field]
      }
    });

  } catch (error) {
    console.error('Toggle content status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN EMAIL TEMPLATE ROUTES ====================

// Get All Email Templates (Admin only)
app.get('/api/admin/email-templates', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const templates = await EmailTemplate.find({})
      .populate('createdBy.userId', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({ templates });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Email Template (Admin only)
app.post('/api/admin/email-templates', authenticateToken, requireRole(['administrator', 'super-admin']), [
  body('name').trim().isLength({ min: 3 }).withMessage('Template name must be at least 3 characters'),
  body('key').trim().isLength({ min: 2 }).withMessage('Template key must be at least 2 characters'),
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject must be at least 3 characters'),
  body('body').trim().isLength({ min: 10 }).withMessage('Body must be at least 10 characters'),
  body('type').isIn(['system', 'journal', 'conference', 'user', 'notification', 'newsletter']).withMessage('Invalid template type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = new EmailTemplate({
      ...req.body,
      createdBy: {
        userId: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email
      }
    });

    await template.save();

    res.status(201).json({
      message: 'Email template created successfully',
      template
    });

  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Email Template (Admin only)
app.put('/api/admin/email-templates/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Create version before updating
    await template.createVersion({
      userId: req.user.userId,
      name: req.user.firstName + ' ' + req.user.lastName
    });

    // Update template
    Object.assign(template, req.body);
    await template.save();

    res.json({
      message: 'Email template updated successfully',
      template
    });

  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Email Template (Admin only)
app.delete('/api/admin/email-templates/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json({ message: 'Email template deleted successfully' });

  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Email Template Status (Admin only)
app.put('/api/admin/email-templates/:id/status', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { isActive } = req.body;
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    template.isActive = isActive;
    await template.save();

    res.json({
      message: `Email template ${isActive ? 'activated' : 'deactivated'} successfully`,
      template: {
        id: template._id,
        isActive: template.isActive
      }
    });

  } catch (error) {
    console.error('Toggle email template status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send Test Email (Admin only)
app.post('/api/admin/email-templates/:id/test', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { testEmail } = req.body;
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // In a real implementation, you would send the email here
    console.log(`Test email would be sent to: ${testEmail}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.body}`);

    res.json({ message: 'Test email sent successfully' });

  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN SYSTEM CONFIGURATION ROUTES ====================

// Get All System Configurations (Admin only)
app.get('/api/admin/system-config', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const configs = await SystemConfig.find({})
      .populate('lastModifiedBy.userId', 'firstName lastName')
      .sort({ category: 1, name: 1 });

    res.json({ configs });
  } catch (error) {
    console.error('Get system configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create System Configuration (Admin only)
app.post('/api/admin/system-config', authenticateToken, requireRole(['administrator', 'super-admin']), [
  body('key').trim().isLength({ min: 2 }).withMessage('Config key must be at least 2 characters'),
  body('name').trim().isLength({ min: 3 }).withMessage('Config name must be at least 3 characters'),
  body('type').isIn(['string', 'number', 'boolean', 'object', 'array', 'json']).withMessage('Invalid config type'),
  body('category').isIn(['email', 'payment', 'storage', 'api', 'security', 'general', 'notification', 'backup', 'analytics', 'integration', 'system']).withMessage('Invalid config category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const config = new SystemConfig({
      ...req.body,
      lastModifiedBy: {
        userId: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      }
    });

    await config.save();

    res.status(201).json({
      message: 'System configuration created successfully',
      config
    });

  } catch (error) {
    console.error('Create system config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update System Configuration (Admin only)
app.put('/api/admin/system-config/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const config = await SystemConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'System configuration not found' });
    }

    // Update configuration
    Object.assign(config, req.body);
    config.lastModifiedBy = {
      userId: req.user.userId,
      name: req.user.firstName + ' ' + req.user.lastName
    };

    await config.save();

    res.json({
      message: 'System configuration updated successfully',
      config
    });

  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update System Configuration Value (Admin only)
app.put('/api/admin/system-config/:id/value', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { value, reason } = req.body;
    const config = await SystemConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'System configuration not found' });
    }

    await config.updateValue(value, {
      userId: req.user.userId,
      name: req.user.firstName + ' ' + req.user.lastName
    }, reason);

    res.json({
      message: 'System configuration value updated successfully',
      config: {
        id: config._id,
        value: config.value
      }
    });

  } catch (error) {
    console.error('Update system config value error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete System Configuration (Admin only)
app.delete('/api/admin/system-config/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const config = await SystemConfig.findByIdAndDelete(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'System configuration not found' });
    }

    res.json({ message: 'System configuration deleted successfully' });

  } catch (error) {
    console.error('Delete system config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN ANALYTICS ROUTES ====================

// Get Analytics Data (Admin only)
app.get('/api/admin/analytics', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get submission statistics
    const totalSubmissions = await Submission.countDocuments();
    const submissionsThisMonth = await Submission.countDocuments({
      submittedAt: { $gte: startDate }
    });

    const submissionStatusCounts = await Submission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get journal statistics
    const totalJournals = await Journal.countDocuments();
    const activeJournals = await Journal.countDocuments({ isActive: true });

    // Get conference statistics
    const totalConferences = await Conference.countDocuments();
    const upcomingConferences = await Conference.countDocuments({
      startDate: { $gte: now }
    });

    // Mock analytics data (in a real implementation, you would calculate these from actual data)
    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growth: 12.5
      },
      submissions: {
        total: totalSubmissions,
        thisMonth: submissionsThisMonth,
        byStatus: {
          pending: 15,
          underReview: 8,
          accepted: 12,
          rejected: 5
        },
        growth: 8.3
      },
      journals: {
        total: totalJournals,
        active: activeJournals,
        submissionsPerJournal: [
          { name: 'IJIS', count: 45 },
          { name: 'IJITSA', count: 32 },
          { name: 'IJIKM', count: 28 },
          { name: 'IJELL', count: 22 },
          { name: 'IJELLO', count: 18 }
        ]
      },
      conferences: {
        total: totalConferences,
        upcoming: upcomingConferences,
        registrations: 156
      },
      system: {
        uptime: 99.9,
        responseTime: 2.3,
        storageUsed: 75.2,
        emailsSent: 1240
      },
      trends: {
        userGrowth: [
          { month: 'Jan', count: 120 },
          { month: 'Feb', count: 135 },
          { month: 'Mar', count: 142 },
          { month: 'Apr', count: 158 },
          { month: 'May', count: 167 },
          { month: 'Jun', count: 175 }
        ],
        submissionTrends: [
          { month: 'Jan', count: 35 },
          { month: 'Feb', count: 42 },
          { month: 'Mar', count: 38 },
          { month: 'Apr', count: 51 },
          { month: 'May', count: 47 },
          { month: 'Jun', count: 55 }
        ],
        topCountries: [
          { country: 'United States', count: 245 },
          { country: 'United Kingdom', count: 189 },
          { country: 'Canada', count: 156 },
          { country: 'Australia', count: 134 },
          { country: 'Germany', count: 98 }
        ],
        topInstitutions: [
          { institution: 'University of California', count: 45 },
          { institution: 'MIT', count: 38 },
          { institution: 'Stanford University', count: 32 },
          { institution: 'Oxford University', count: 28 },
          { institution: 'Harvard University', count: 25 }
        ]
      }
    };

    res.json({ analytics });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export Analytics Data (Admin only)
app.get('/api/admin/analytics/export', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { format = 'csv', range = '30d' } = req.query;
    
    // Get analytics data (same as above)
    const analytics = {
      // ... same analytics data structure
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = 'Metric,Value\n' +
        `Total Users,${analytics.users.total}\n` +
        `Active Users,${analytics.users.active}\n` +
        `Total Submissions,${analytics.submissions.total}\n` +
        `Active Journals,${analytics.journals.active}\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csvData);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json(analytics);
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN BACKUP ROUTES ====================

// Get Backup Jobs (Admin only)
app.get('/api/admin/backup/jobs', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const jobs = await Backup.find({}).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    console.error('Get backup jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Backup (Admin only)
app.post('/api/admin/backup/create', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { name, type, format, tables } = req.body;
    
    const backup = new Backup({
      name,
      type,
      format,
      tables: tables || [],
      status: 'pending',
      progress: 0,
      createdBy: {
        userId: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      }
    });

    await backup.save();

    // In a real implementation, you would start the backup process here
    // For now, we'll just return the created backup

    res.status(201).json({
      message: 'Backup job created successfully',
      backup
    });

  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download Backup (Admin only)
app.get('/api/admin/backup/download/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ message: 'Backup not completed' });
    }

    // In a real implementation, you would serve the actual backup file
    // For now, we'll return a mock response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${backup._id}.zip`);
    res.send('Mock backup file content');

  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel Backup (Admin only)
app.post('/api/admin/backup/cancel/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const backup = await Backup.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    res.json({
      message: 'Backup cancelled successfully',
      backup
    });

  } catch (error) {
    console.error('Cancel backup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN EXPORT ROUTES ====================

// Get Export Jobs (Admin only)
app.get('/api/admin/export/jobs', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const jobs = await Backup.find({ type: 'export' }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    console.error('Get export jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Export (Admin only)
app.post('/api/admin/export/create', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const { name, dataType, format, filters } = req.body;
    
    const exportJob = new Backup({
      name,
      type: 'export',
      dataType,
      format,
      filters: filters || {},
      status: 'pending',
      progress: 0,
      createdBy: {
        userId: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      }
    });

    await exportJob.save();

    // In a real implementation, you would start the export process here

    res.status(201).json({
      message: 'Export job created successfully',
      export: exportJob
    });

  } catch (error) {
    console.error('Create export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download Export (Admin only)
app.get('/api/admin/export/download/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const exportJob = await Backup.findById(req.params.id);
    if (!exportJob) {
      return res.status(404).json({ message: 'Export not found' });
    }

    if (exportJob.status !== 'completed') {
      return res.status(400).json({ message: 'Export not completed' });
    }

    // In a real implementation, you would serve the actual export file
    const contentType = exportJob.format === 'csv' ? 'text/csv' : 
                       exportJob.format === 'json' ? 'application/json' : 
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=export-${exportJob._id}.${exportJob.format}`);
    res.send('Mock export file content');

  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel Export (Admin only)
app.post('/api/admin/export/cancel/:id', authenticateToken, requireRole(['administrator', 'super-admin']), async (req, res) => {
  try {
    const exportJob = await Backup.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!exportJob) {
      return res.status(404).json({ message: 'Export not found' });
    }

    res.json({
      message: 'Export cancelled successfully',
      export: exportJob
    });

  } catch (error) {
    console.error('Cancel export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== HEALTH CHECK ====================

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Create default admin account if none exists
async function createDefaultAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });

      await defaultAdmin.save();
      console.log('Default admin account created:');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// Create default admin on server start
createDefaultAdmin();

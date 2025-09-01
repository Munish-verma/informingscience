const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-memory admin storage
const admins = new Map();

// Create default admin account
const createDefaultAdmin = async () => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);
  
  const defaultAdmin = {
    id: 'default-admin',
    username: 'admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date()
  };
  
  admins.set('admin@example.com', defaultAdmin);
  console.log('Default admin account created:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
};

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
    if (admins.has(email)) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const admin = {
      id: `admin-${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date()
    };

    admins.set(email, admin);

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = admins.get(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email, 
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin profile (protected route)
app.get('/api/admin/profile', authenticateToken, async (req, res) => {
  try {
    const admin = admins.get(req.user.email);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    const { password, ...adminWithoutPassword } = admin;
    res.json(adminWithoutPassword);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is accessible', status: 'OK' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createDefaultAdmin();
});


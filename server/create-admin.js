const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://dharmendrashukla239_db_user:6CTvn1goGYxsdRPg@cluster0.zuz5amc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create default admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed by the pre-save middleware
      accountType: 'colleague',
      membershipStatus: 'active',
      isActive: true,
      isEmailVerified: true,
      roles: ['administrator', 'super-admin'],
      affiliation: 'Informing Science Institute',
      department: 'Administration',
      position: 'System Administrator'
    });

    await adminUser.save();
    console.log('Default admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createDefaultAdmin();

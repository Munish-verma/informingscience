const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://dharmendrashukla239_db_user:6CTvn1goGYxsdRPg@cluster0.zuz5amc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const defaultUsers = [
  // Super Admin
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@example.com',
    password: 'superadmin123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: ['super-admin', 'administrator'],
    affiliation: 'Informing Science Institute',
    department: 'System Administration',
    position: 'Super Administrator'
  },
  
  // Administrator
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: ['administrator'],
    affiliation: 'Informing Science Institute',
    department: 'Administration',
    position: 'System Administrator'
  },
  
  // Editor in Chief
  {
    firstName: 'Editor',
    lastName: 'Chief',
    email: 'editorchief@example.com',
    password: 'editorchief123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: ['editor-in-chief', 'editor'],
    affiliation: 'Informing Science Institute',
    department: 'Editorial',
    position: 'Editor in Chief'
  },
  
  // Editor
  {
    firstName: 'Editor',
    lastName: 'User',
    email: 'editor@example.com',
    password: 'editor123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: ['editor'],
    affiliation: 'Informing Science Institute',
    department: 'Editorial',
    position: 'Editor'
  },
  
  // Reviewer
  {
    firstName: 'Reviewer',
    lastName: 'User',
    email: 'reviewer@example.com',
    password: 'reviewer123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: ['reviewer'],
    isReviewer: true,
    reviewerStatus: 'approved',
    affiliation: 'University of Technology',
    department: 'Computer Science',
    position: 'Associate Professor',
    topicsOfInterest: ['Information Systems', 'Software Engineering', 'Data Science']
  },
  
  // Active Member
  {
    firstName: 'Active',
    lastName: 'Member',
    email: 'member@example.com',
    password: 'member123',
    accountType: 'member',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: [],
    affiliation: 'Business University',
    department: 'Information Technology',
    position: 'Assistant Professor',
    topicsOfInterest: ['Business Intelligence', 'E-commerce', 'Digital Transformation']
  },
  
  // Pending Member
  {
    firstName: 'Pending',
    lastName: 'Member',
    email: 'pending@example.com',
    password: 'pending123',
    accountType: 'member',
    membershipStatus: 'pending',
    isActive: true,
    isEmailVerified: true,
    roles: [],
    affiliation: 'Tech College',
    department: 'Information Systems',
    position: 'Lecturer',
    topicsOfInterest: ['Cloud Computing', 'Cybersecurity']
  },
  
  // Colleague (Non-Member)
  {
    firstName: 'Colleague',
    lastName: 'User',
    email: 'colleague@example.com',
    password: 'colleague123',
    accountType: 'colleague',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: [],
    affiliation: 'Research Institute',
    department: 'Technology Research',
    position: 'Research Scientist',
    topicsOfInterest: ['Artificial Intelligence', 'Machine Learning', 'Big Data']
  },
  
  // Inactive User
  {
    firstName: 'Inactive',
    lastName: 'User',
    email: 'inactive@example.com',
    password: 'inactive123',
    accountType: 'member',
    membershipStatus: 'expired',
    isActive: false,
    isEmailVerified: true,
    roles: [],
    affiliation: 'Old University',
    department: 'Computer Science',
    position: 'Professor Emeritus',
    topicsOfInterest: ['Legacy Systems', 'Database Management']
  },
  
  // Student Member
  {
    firstName: 'Student',
    lastName: 'User',
    email: 'student@example.com',
    password: 'student123',
    accountType: 'member',
    membershipStatus: 'active',
    isActive: true,
    isEmailVerified: true,
    roles: [],
    affiliation: 'University of Information Science',
    department: 'Graduate Studies',
    position: 'PhD Student',
    topicsOfInterest: ['Information Retrieval', 'Natural Language Processing', 'Web Technologies']
  }
];

async function createDefaultUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('Creating default users...\n');

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists - skipping`);
        continue;
      }

      // Create new user
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.roles.join(', ') || 'No roles'})`);
    }

    console.log('\n=== DEFAULT USER CREDENTIALS ===');
    console.log('All passwords follow the pattern: [username]123\n');
    
    defaultUsers.forEach(user => {
      const username = user.email.split('@')[0];
      console.log(`${user.firstName} ${user.lastName}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${username}123`);
      console.log(`  Roles: ${user.roles.join(', ') || 'No roles'}`);
      console.log(`  Account Type: ${user.accountType}`);
      console.log(`  Status: ${user.membershipStatus}${!user.isActive ? ' (Inactive)' : ''}`);
      console.log('');
    });

    console.log('Default users created successfully!');

  } catch (error) {
    console.error('Error creating default users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createDefaultUsers();

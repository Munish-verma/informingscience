const mongoose = require('mongoose');
const config = require('./config');

console.log('🔍 Testing MongoDB connection...');
console.log('Connection string:', config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Ready state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('Error details:', err);
    process.exit(1);
  });

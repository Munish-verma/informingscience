#!/usr/bin/env node

/**
 * Password Setup Script for MongoDB Atlas
 * This script helps you set your MongoDB password securely
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 MongoDB Atlas Password Setup');
console.log('===============================\n');

console.log('Your MongoDB Atlas connection details:');
console.log('Username: dharmendrashukla239_db_user');
console.log('Cluster: cluster0.zuz5amc.mongodb.net');
console.log('Database: informingscience\n');

rl.question('Enter your MongoDB Atlas password: ', (password) => {
  if (!password.trim()) {
    console.log('❌ Password cannot be empty. Please run the script again.');
    rl.close();
    return;
  }

  // Escape special characters in password for URL
  const escapedPassword = encodeURIComponent(password.trim());
  
  const connectionString = `mongodb+srv://dharmendrashukla239_db_user:${escapedPassword}@cluster0.zuz5amc.mongodb.net/informingscience?retryWrites=true&w=majority`;
  
  updateConfigFile(connectionString);
});

function updateConfigFile(connectionString) {
  const configPath = path.join(__dirname, 'config.js');
  
  try {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update the MONGODB_URI line
    configContent = configContent.replace(
      /MONGODB_URI: process\.env\.MONGODB_URI \|\| '[^']*'/,
      `MONGODB_URI: process.env.MONGODB_URI || '${connectionString}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    
    console.log('\n✅ Configuration updated successfully!');
    console.log('📁 Updated file: server/config.js');
    console.log('\n🚀 You can now start your server with:');
    console.log('   cd server');
    console.log('   node server.js\n');
    
    console.log('🔍 To test the connection, you can also run:');
    console.log('   node -e "const mongoose = require(\'mongoose\'); const config = require(\'./config\'); mongoose.connect(config.MONGODB_URI).then(() => { console.log(\'✅ Connected to MongoDB!\'); process.exit(0); }).catch(err => { console.error(\'❌ Connection failed:\', err.message); process.exit(1); });"');
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
    console.log('\n📝 Please manually update server/config.js with:');
    console.log(`   MONGODB_URI: process.env.MONGODB_URI || '${connectionString}'`);
  }
  
  rl.close();
}

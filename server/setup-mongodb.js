#!/usr/bin/env node

/**
 * MongoDB Setup Helper Script
 * This script helps you set up MongoDB for your application
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 MongoDB Setup Helper');
console.log('======================\n');

console.log('You have several options to set up MongoDB:\n');

console.log('1. 🚀 MongoDB Atlas (Cloud) - RECOMMENDED');
console.log('   - Free tier available');
console.log('   - No local installation required');
console.log('   - Easy to set up\n');

console.log('2. 💻 Local MongoDB Installation');
console.log('   - Requires downloading and installing MongoDB');
console.log('   - More control over your data');
console.log('   - Requires more setup\n');

console.log('3. 🐳 Docker MongoDB (if you have Docker)');
console.log('   - Quick setup with Docker');
console.log('   - Isolated environment\n');

rl.question('Which option would you like to use? (1/2/3): ', (answer) => {
  switch(answer.trim()) {
    case '1':
      setupMongoDBAtlas();
      break;
    case '2':
      setupLocalMongoDB();
      break;
    case '3':
      setupDockerMongoDB();
      break;
    default:
      console.log('Invalid option. Please run the script again and choose 1, 2, or 3.');
      rl.close();
  }
});

function setupMongoDBAtlas() {
  console.log('\n🚀 Setting up MongoDB Atlas...\n');
  
  console.log('Steps to set up MongoDB Atlas:');
  console.log('1. Go to https://www.mongodb.com/atlas');
  console.log('2. Create a free account');
  console.log('3. Create a new cluster (choose the free M0 tier)');
  console.log('4. Create a database user');
  console.log('5. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)');
  console.log('6. Get your connection string\n');
  
  rl.question('Enter your MongoDB Atlas connection string: ', (connectionString) => {
    if (connectionString.trim()) {
      updateConfigFile(connectionString.trim());
    } else {
      console.log('No connection string provided. You can update the config.js file manually.');
      rl.close();
    }
  });
}

function setupLocalMongoDB() {
  console.log('\n💻 Setting up Local MongoDB...\n');
  
  console.log('To install MongoDB locally on Windows:');
  console.log('1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community');
  console.log('2. Run the installer');
  console.log('3. Start MongoDB service: net start MongoDB');
  console.log('4. Or use MongoDB Compass (GUI tool)\n');
  
  console.log('Alternative: Use Chocolatey package manager:');
  console.log('1. Install Chocolatey: https://chocolatey.org/install');
  console.log('2. Run: choco install mongodb');
  console.log('3. Start service: net start MongoDB\n');
  
  console.log('After installation, the default connection string will be:');
  console.log('mongodb://localhost:27017/informingscience\n');
  
  rl.question('Press Enter when MongoDB is installed and running...', () => {
    updateConfigFile('mongodb://localhost:27017/informingscience');
  });
}

function setupDockerMongoDB() {
  console.log('\n🐳 Setting up Docker MongoDB...\n');
  
  console.log('Run this command to start MongoDB with Docker:');
  console.log('docker run --name mongodb -p 27017:27017 -d mongo:latest\n');
  
  console.log('To start the container later:');
  console.log('docker start mongodb\n');
  
  console.log('Connection string will be:');
  console.log('mongodb://localhost:27017/informingscience\n');
  
  rl.question('Press Enter when Docker MongoDB is running...', () => {
    updateConfigFile('mongodb://localhost:27017/informingscience');
  });
}

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
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
    console.log('\n📝 Please manually update server/config.js with your connection string:');
    console.log(`   MONGODB_URI: process.env.MONGODB_URI || '${connectionString}'`);
  }
  
  rl.close();
}

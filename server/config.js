// Configuration file for the server
module.exports = {
  // MongoDB Configuration
  // For local development, you can use:
  // MONGODB_URI: 'mongodb://localhost:27017/informingscience'
  
  // For MongoDB Atlas (cloud), use:
  // MONGODB_URI: 'mongodb+srv://username:password@cluster0.mongodb.net/informingscience?retryWrites=true&w=majority'
  
  // For local development, use local MongoDB:
  // MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/informingscience',
  
  // For MongoDB Atlas (cloud), use:
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://dharmendrashukla239_db_user:6CTvn1goGYxsdRPg@cluster0.zuz5amc.mongodb.net/informingscience?retryWrites=true&w=majority&ssl=true&authSource=admin',
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

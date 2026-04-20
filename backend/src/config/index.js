require('dotenv').config();

const config = {
  appName: process.env.APP_NAME || 'CareerMate AI API',
  debug: process.env.DEBUG === 'true',
  port: parseInt(process.env.PORT || '8000', 10),

  // Database
  databasePath: process.env.DATABASE_PATH || './careermate.db',

  // JWT
  secretKey: process.env.SECRET_KEY || 'change-this-secret-key-in-production',
  accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '10080', 10), // 7 days

  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // File uploads
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = config;

// spiritualpurity/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads',
  'uploads/profile-pictures',
  'uploads/advertisements'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// CORS Configuration - Fixed for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://spiritualpurity.onrender.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    createDatabaseIndexes();
  })
  .catch((error) => console.error('MongoDB connection error:', error));

// Function to create database indexes
async function createDatabaseIndexes() {
  try {
    const db = mongoose.connection.db;
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ joinDate: -1 });
    await db.collection('users').createIndex({ isActive: 1 });
    
    // Advertiser indexes
    await db.collection('advertisers').createIndex({ contactEmail: 1 }, { unique: true });
    await db.collection('advertisers').createIndex({ businessName: 1 });
    await db.collection('advertisers').createIndex({ accountStatus: 1 });
    await db.collection('advertisers').createIndex({ currentPlan: 1 });
    
    // Advertisement indexes
    await db.collection('advertisements').createIndex({ advertiser: 1 });
    await db.collection('advertisements').createIndex({ status: 1 });
    await db.collection('advertisements').createIndex({ tier: 1 });
    await db.collection('advertisements').createIndex({ category: 1 });
    
    // Conversation indexes
    await db.collection('conversations').createIndex({ participants: 1 });
    await db.collection('conversations').createIndex({ lastActivity: -1 });
    
    // Message indexes
    await db.collection('messages').createIndex({ conversation: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ sender: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  });
});

// API Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/advertisers', require('./routes/advertisers'));
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
  console.log('Some API routes may not be available');
}

// Serve static files from React build (PRODUCTION)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, 'build')));

  // Handle React routing - catch all handler for non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // Development route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Spiritual Purity API Server is running!',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users', 
        messages: '/api/messages',
        advertisers: '/api/advertisers'
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// CRITICAL: Render requires binding to all interfaces and using PORT env var
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Serving React app from /build directory');
  }
});
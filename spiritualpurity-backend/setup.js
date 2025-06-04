// spiritualpurity-backend/setup.js
// Run this script to set up your backend environment

const fs = require('fs');
const path = require('path');

console.log('Setting up Spiritual Purity Backend...\n');

// 1. Create required directories
const directories = [
  'uploads',
  'uploads/profile-pictures', 
  'uploads/advertisements',
  'routes',
  'models',
  'middleware'
];

console.log('Creating directories...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Exists: ${dir}`);
  }
});

// 2. Create .env template if it doesn't exist
const envTemplate = `# Spiritual Purity Backend Environment Variables
# Copy this file to .env and fill in your actual values

# MongoDB Connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/spiritual-purity?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# Email Configuration (for future use)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Processing (for future use)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env.template', envTemplate);
  console.log('\nCreated .env.template');
  console.log('   Please copy this to .env and fill in your actual values');
} else {
  console.log('\n.env file already exists');
}

// 3. Check package.json dependencies
console.log('\nChecking package.json...');
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDependencies = {
    'express': '^4.18.2',
    'mongoose': '^7.5.0',
    'cors': '^2.8.5',
    'dotenv': '^16.3.1',
    'bcryptjs': '^2.4.3',
    'jsonwebtoken': '^9.0.2',
    'multer': '^1.4.5-lts.1'
  };
  
  const missing = [];
  Object.keys(requiredDependencies).forEach(dep => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missing.push(`${dep}@${requiredDependencies[dep]}`);
    }
  });
  
  if (missing.length > 0) {
    console.log('Missing dependencies:');
    missing.forEach(dep => console.log(`   - ${dep}`));
    console.log('\n   Run: npm install ' + missing.join(' '));
  } else {
    console.log('All required dependencies are present');
  }
} else {
  console.log('package.json not found');
  console.log('   Run: npm init -y');
}

// 4. Create startup scripts
console.log('\nCreating helpful scripts...');

const startScript = `#!/bin/bash
# Start the Spiritual Purity backend server

echo "Starting Spiritual Purity Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo ".env file not found!"
    echo "   Please copy .env.template to .env and configure your settings"
    exit 1
fi

# Start the server
node server.js
`;

const devScript = `#!/bin/bash
# Start the development server with nodemon

echo "Starting Spiritual Purity Backend in Development Mode..."
echo ""

# Check if nodemon is installed
if ! command -v nodemon &> /dev/null; then
    echo "Installing nodemon..."
    npm install -g nodemon
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ".env file not found!"
    echo "   Please copy .env.template to .env and configure your settings"
    exit 1
fi

# Start with nodemon
nodemon server.js
`;

fs.writeFileSync('start.sh', startScript);
fs.writeFileSync('dev.sh', devScript);

// Make scripts executable on Unix systems
try {
  fs.chmodSync('start.sh', '755');
  fs.chmodSync('dev.sh', '755');
  console.log('Created executable scripts: start.sh, dev.sh');
} catch (error) {
  console.log('Created scripts: start.sh, dev.sh');
  console.log('   (Run chmod +x *.sh to make them executable on Unix systems)');
}

// 5. Print setup completion
console.log('\nBackend setup complete!\n');

console.log('Next steps:');
console.log('1. Copy .env.template to .env and configure your settings');
console.log('2. Install dependencies: npm install');
console.log('3. Start development server: npm run dev (or ./dev.sh)');
console.log('4. Test the server: curl http://localhost:5001/health\n');

console.log('Key files to review:');
console.log('- server.js (main server file)');
console.log('- routes/ (API endpoints)');
console.log('- models/ (database schemas)'); 
console.log('- middleware/ (authentication, etc.)\n');

console.log('Development commands:');
console.log('- npm start (production)');
console.log('- npm run dev (development with auto-reload)');
console.log('- ./start.sh (using bash script)');
console.log('- ./dev.sh (development with bash script)\n');

console.log('Happy coding!');
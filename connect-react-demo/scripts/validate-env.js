#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  const errors = [];
  const warnings = [];
  
  // Check if .env or .env.local file exists
  const hasEnv = fs.existsSync(envPath);
  const hasEnvLocal = fs.existsSync(envLocalPath);
  
  let env = {};
  
  if (!hasEnv && !hasEnvLocal) {
    // In deployment environments (like Vercel), use process.env instead of local files
    console.log('📁 No local .env files found, using environment variables from deployment platform\n');
    env = process.env;
  } else {
    // Load env files (env.local takes precedence)
    const envBase = hasEnv ? loadEnvFile(envPath) : {};
    const envLocal = hasEnvLocal ? loadEnvFile(envLocalPath) : {};
    env = { ...envBase, ...envLocal };
    
    // Log which files are being used
    const filesUsed = [];
    if (hasEnv) filesUsed.push('.env');
    if (hasEnvLocal) filesUsed.push('.env.local');
    console.log(`📁 Using environment files: ${filesUsed.join(', ')}\n`);
  }
  
  // Required fields
  const requiredFields = [
    'PIPEDREAM_CLIENT_ID',
    'PIPEDREAM_CLIENT_SECRET',
    'PIPEDREAM_PROJECT_ID',
    'PIPEDREAM_PROJECT_ENVIRONMENT',
    'PIPEDREAM_ALLOWED_ORIGINS'
  ];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!env[field] || env[field].includes('<') || env[field].includes('your-')) {
      errors.push(`❌ ${field} is not configured properly. Please set a valid value.`);
    }
  });
  
  // Validate PIPEDREAM_PROJECT_ENVIRONMENT
  if (env.PIPEDREAM_PROJECT_ENVIRONMENT) {
    const validEnvironments = ['development', 'production'];
    if (!validEnvironments.includes(env.PIPEDREAM_PROJECT_ENVIRONMENT)) {
      errors.push(`❌ PIPEDREAM_PROJECT_ENVIRONMENT must be either 'development' or 'production'. Current value: '${env.PIPEDREAM_PROJECT_ENVIRONMENT}'`);
    }
  }
  
  // Validate PIPEDREAM_PROJECT_ID
  if (env.PIPEDREAM_PROJECT_ID && !env.PIPEDREAM_PROJECT_ID.includes('<')) {
    if (!env.PIPEDREAM_PROJECT_ID.startsWith('proj_')) {
      errors.push(`❌ PIPEDREAM_PROJECT_ID must start with 'proj_'. Current value: '${env.PIPEDREAM_PROJECT_ID}'`);
    }
  }
  
  // Validate PIPEDREAM_ALLOWED_ORIGINS
  if (env.PIPEDREAM_ALLOWED_ORIGINS && !env.PIPEDREAM_ALLOWED_ORIGINS.includes('<')) {
    try {
      let origins;
      let originsValue = env.PIPEDREAM_ALLOWED_ORIGINS;
      
      // Handle both quoted and unquoted JSON formats
      // Remove surrounding quotes if they exist
      if (originsValue.startsWith('"') && originsValue.endsWith('"')) {
        originsValue = originsValue.slice(1, -1);
      } else if (originsValue.startsWith("'") && originsValue.endsWith("'")) {
        originsValue = originsValue.slice(1, -1);
      }
      
      origins = JSON.parse(originsValue);
      
      if (!Array.isArray(origins)) {
        errors.push(`❌ PIPEDREAM_ALLOWED_ORIGINS must be a JSON array. Current value: '${env.PIPEDREAM_ALLOWED_ORIGINS}'`);
      } else {
        // Check if localhost:3000 is included for development
        const hasLocalhost = origins.some(origin => origin.includes('localhost:3000'));
        if (!hasLocalhost && env.PIPEDREAM_PROJECT_ENVIRONMENT === 'development') {
          warnings.push(`⚠️  PIPEDREAM_ALLOWED_ORIGINS doesn't include 'http://localhost:3000'. This may cause issues during local development.`);
        }
      }
    } catch (e) {
      errors.push(`❌ PIPEDREAM_ALLOWED_ORIGINS must be valid JSON. Error: ${e.message}`);
    }
  }
  
  // Print results
  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    errors.forEach(error => console.error(`  ${error}`));
    
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:\n');
      warnings.forEach(warning => console.warn(`  ${warning}`));
    }
    
    console.error('\n📝 Please update your .env file with the correct values.\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:\n');
    warnings.forEach(warning => console.warn(`  ${warning}`));
  }
  
  console.log('✅ Environment configuration is valid!\n');
  console.log('📋 Detected configuration:');
  console.log(`  - Environment: ${env.PIPEDREAM_PROJECT_ENVIRONMENT}`);
  console.log(`  - Project ID: ${env.PIPEDREAM_PROJECT_ID}`);
  console.log(`  - Allowed Origins: ${env.PIPEDREAM_ALLOWED_ORIGINS}`);
  console.log('');
}

// Run validation
validateEnvironment();
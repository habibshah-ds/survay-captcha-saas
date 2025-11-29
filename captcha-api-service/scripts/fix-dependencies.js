const fs = require('fs');
const { execSync } = require('child_process');

console.log('Fixing dependencies...');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Remove the problematic dependency
delete packageJson.dependencies['redis-rate-limiter'];

// Add the correct dependency
packageJson.dependencies['rate-limit-redis'] = '^3.0.0';

// Write updated package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

console.log('Updated package.json');

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
}

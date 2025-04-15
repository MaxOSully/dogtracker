#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let testType = 'all'; // Default to running all tests

if (args.includes('--unit')) {
  testType = 'unit';
} else if (args.includes('--integration')) {
  testType = 'integration';
}

// Configure test command based on test type
let command = 'npx';
let commandArgs = ['jest'];

if (testType === 'unit') {
  commandArgs.push('tests/unit');
  console.log('Running unit tests...');
} else if (testType === 'integration') {
  commandArgs.push('tests/integration');
  console.log('Running integration tests...');
} else {
  console.log('Running all tests...');
}

// Add Jest options
commandArgs.push('--verbose');

// If there's a specific test file specified, add it to the arguments
const specificTest = args.find(arg => arg.endsWith('.test.ts') || arg.endsWith('.spec.ts'));
if (specificTest) {
  commandArgs.push(specificTest);
  console.log(`Running specific test: ${specificTest}`);
}

// Run tests with environment variables
const env = {
  ...process.env,
  NODE_ENV: 'test'
};

// Execute the test command
const testProcess = spawn(command, commandArgs, {
  env,
  stdio: 'inherit',
  shell: true
});

// Handle process completion
testProcess.on('close', code => {
  if (code !== 0) {
    console.error(`Tests exited with code ${code}`);
    process.exit(code);
  }
  console.log('All tests completed successfully!');
});

// Handle process errors
testProcess.on('error', err => {
  console.error('Failed to start test process:', err);
  process.exit(1);
});
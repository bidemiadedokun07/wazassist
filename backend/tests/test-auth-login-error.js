import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(message) {
  log(`✅ ${message}`, 'green');
}

function fail(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testMissingFieldsValidation() {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    { email: 'nonexistent@example.com', password: 'WrongPass123!' },
    { validateStatus: () => true }
  );

  if (response.status !== 400) {
    throw new Error(`Expected 400 for missing phoneNumber, got ${response.status}`);
  }

  if (response.data?.error !== 'Phone number and password are required') {
    throw new Error(
      `Unexpected validation message: ${response.data?.error || 'undefined'}`
    );
  }

  pass('Missing-field validation returns stable 400 response');
}

async function testInvalidCredentialsMessage() {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    { phoneNumber: '+2348012345678', password: 'WrongPass123!' },
    { validateStatus: () => true }
  );

  if (response.status !== 401) {
    throw new Error(`Expected 401 for invalid credentials, got ${response.status}`);
  }

  const errorMessage = response.data?.error;

  if (errorMessage !== 'Invalid phone number or password') {
    throw new Error(`Expected sanitized error message, got: ${errorMessage || 'undefined'}`);
  }

  pass('Invalid credentials return sanitized 401 message');
}

async function run() {
  info(`Running auth regression checks against: ${API_BASE_URL}`);

  try {
    await testMissingFieldsValidation();
    await testInvalidCredentialsMessage();
    pass('Auth login error regression checks passed');
    process.exit(0);
  } catch (error) {
    fail(error.message);
    process.exit(1);
  }
}

run();

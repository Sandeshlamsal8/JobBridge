/**
 * Test Script for Email Verification
 * 
 * This script tests the email verification flow
 * Make sure MongoDB is running and .env is configured
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test user data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com', // Change this to your test email
  password: 'Password123',
  confirmPassword: 'Password123',
  userType: 'jobseeker',
  agreeToTerms: true
};

async function testSignup() {
  console.log('\n🧪 Testing Signup (Step 1)...');
  try {
    const response = await axios.post(`${BASE_URL}/signup`, testUser);
    console.log('✅ Signup Success:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Signup Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testVerifyEmail(pin) {
  console.log('\n🧪 Testing Email Verification (Step 2)...');
  try {
    const response = await axios.post(`${BASE_URL}/verify-email`, {
      email: testUser.email,
      pin: pin
    });
    console.log('✅ Verification Success:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Verification Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testResendPin() {
  console.log('\n🧪 Testing Resend PIN...');
  try {
    const response = await axios.post(`${BASE_URL}/resend-pin`, {
      email: testUser.email
    });
    console.log('✅ Resend Success:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Resend Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Email Verification Tests...');
  console.log('📧 Test Email:', testUser.email);
  console.log('\nMake sure:');
  console.log('1. MongoDB is running');
  console.log('2. Server is running (npm run dev)');
  console.log('3. EMAIL_USER and EMAIL_PASS are set in .env');
  console.log('\n' + '='.repeat(50));

  // Test 1: Signup
  const signupSuccess = await testSignup();
  if (!signupSuccess) {
    console.log('\n❌ Tests stopped due to signup failure');
    return;
  }

  console.log('\n📬 Check your email for the PIN code');
  console.log('💡 To verify, run: node test-email-verification.js verify <PIN>');
  
  // Test 2: Resend PIN (optional)
  // await testResendPin();
}

// Check if PIN is provided as argument
const args = process.argv.slice(2);
if (args[0] === 'verify' && args[1]) {
  testVerifyEmail(args[1]);
} else {
  runTests();
}

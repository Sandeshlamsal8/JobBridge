require('dotenv').config();
const { generateResetToken, sendPasswordResetEmail } = require('./utils/emailService');

async function testForgotPassword() {
  console.log('Testing Forgot Password Email...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
  const resetToken = generateResetToken();
  const firstName = 'Test User';
  
  console.log('\nGenerated Reset Token:', resetToken);
  console.log('\nSending password reset email to:', testEmail);
  
  try {
    const result = await sendPasswordResetEmail(testEmail, resetToken, firstName);
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Password reset email sent successfully!');
      console.log('Check your inbox at:', testEmail);
    } else {
      console.log('\n❌ FAILED to send email');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testForgotPassword();

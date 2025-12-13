# Troubleshooting Forgot Password Feature

## Issue: "Failed to send reset email"

### Solution Steps:

1. **Restart the Backend Server**
   - The backend needs to be restarted to load the new password reset routes
   - Stop the current backend process
   - Start it again with `npm start`

2. **Verify Email Configuration**
   - Check `backend/.env` file has:
     ```
     EMAIL_USER=jobbridge123@gmail.com
     EMAIL_PASS=your-app-password
     FRONTEND_URL=http://localhost:5173
     ```

3. **Test Email Service**
   ```bash
   cd backend
   node test-forgot-password.js
   ```
   - This will send a test email to verify the configuration works

## Common Issues:

### 1. Backend Not Restarted
**Symptom**: "Failed to send reset email" or 404 error
**Solution**: Restart the backend server

### 2. Wrong Email Password
**Symptom**: Authentication error in backend logs
**Solution**: 
- Make sure you're using a Gmail App Password, not your regular password
- Generate a new app password at: https://myaccount.google.com/apppasswords

### 3. Port Already in Use
**Symptom**: Backend won't start
**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Start backend again
npm start
```

### 4. Frontend URL Mismatch
**Symptom**: Reset link doesn't work
**Solution**: Make sure `FRONTEND_URL` in `.env` matches your actual frontend URL
- Development: `http://localhost:5173` or `http://localhost:5174`
- Production: Your actual domain

## Testing the Complete Flow:

### Step 1: Request Password Reset
1. Go to login page
2. Click "Forgot password?"
3. Enter your email: `jobbridge123@gmail.com`
4. Click "Send Reset Link"
5. Should see success message

### Step 2: Check Email
1. Check inbox at jobbridge123@gmail.com
2. Look for email with subject "Password Reset Request - JobBridge"
3. Click the reset link in the email

### Step 3: Reset Password
1. Should be redirected to reset password page
2. Enter new password (must meet requirements):
   - At least 6 characters
   - One uppercase letter
   - One lowercase letter
   - One number
3. Confirm password
4. Click "Reset Password"

### Step 4: Login
1. Should be redirected to login page
2. Login with your new password
3. Success!

## API Endpoints to Test Manually:

### Test Forgot Password Request:
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"jobbridge123@gmail.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

### Test Token Verification:
```bash
curl http://localhost:5000/api/auth/verify-reset-token/YOUR_TOKEN_HERE
```

## Backend Logs to Check:

When you request a password reset, check the backend terminal for:
- ✅ "Password reset email sent successfully"
- ❌ Any error messages about email sending

## Still Having Issues?

1. Check browser console for errors (F12)
2. Check backend terminal for error messages
3. Verify MongoDB is running
4. Make sure all npm packages are installed:
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

## Quick Reset:

If nothing works, try this complete reset:

```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Backend
cd backend
npm install
npm start

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Then try the forgot password feature again!

# Testing Forgot Password Feature

## Steps to Test:

### 1. Start the Backend Server
```bash
cd backend
npm start
```

### 2. Start the Frontend Server
```bash
cd frontend
npm run dev
```

### 3. Open Browser Console
- Open your browser's Developer Tools (F12)
- Go to the Console tab

### 4. Test Navigation
1. Go to the login page
2. Click "Forgot password?" button
3. Check the console for these messages:
   - "Forgot password clicked"
   - "Navigating to: forgot-password"
   - "Current page: forgot-password"
   - "Rendering ForgotPasswordPage"

### 5. What to Check:

If you see the console messages but the page doesn't change:
- Check if there are any React errors in the console
- Check the Network tab for any failed requests
- Make sure the ForgotPasswordPage component is rendering

If you don't see the console messages:
- The onClick handler might not be firing
- Check if the button is actually clickable (not covered by another element)

### 6. Manual Test:

You can also manually test by typing this in the browser console:
```javascript
// This should navigate to forgot password page
window.location.hash = 'forgot-password'
```

## Common Issues:

### Issue 1: Page doesn't navigate
**Solution**: Make sure you've saved all files and the dev server has reloaded

### Issue 2: Component not found error
**Solution**: Check that ForgotPasswordPage.jsx exists in frontend/src/pages/

### Issue 3: Blank page
**Solution**: Check browser console for React errors

## Debug Information:

The console logs will show:
1. When the button is clicked
2. What page is being navigated to
3. What page is currently being rendered
4. When ForgotPasswordPage is being rendered

This will help identify where the issue is occurring.

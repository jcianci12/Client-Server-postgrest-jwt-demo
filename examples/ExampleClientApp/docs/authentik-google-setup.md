## Configuring Direct Google Authentication in Authentik

This guide explains how to configure Authentik to skip the username/password form and go directly to Google authentication.

### Prerequisites
- Authentik instance with Google social login already configured and working
- Admin access to Authentik

### Steps

1. **Create a New Authentication Flow**
   - Log in to Authentik admin interface
   - Navigate to "Flows & Stages" → "Flows"
   - Click "Create"
   - Configure the flow:
     ```
     Name: Direct Google Authentication
     Title: Sign in with Google
     Slug: direct-google-auth
     Designation: Authentication
     ```
   - Click "Create"

2. **Add the Social Login Stage**
   - In your new flow, click "Stage Bindings"
   - Click "Bind Stage"
   - Create a new "Social Login" stage or select your existing one
   - Configure the stage:
     ```
     Name: Google Social Login
     Authentication Backends: Select only Google
     ```
   - Set "Order" to 0
   - Enable "Re-evaluate policies"

3. **Set as Default Authentication Flow**
   - Go to "Customization" → "Brands"
   - Select your active brand
   - Under "Flow Settings", set "Default Authentication Flow" to your new "Direct Google Authentication" flow
   - Save changes

4. **Optional: Hide Other Authentication Methods**
   - In your Google Social Login stage settings
   - Disable all authentication backends except Google
   - This ensures only Google authentication is presented

### Testing
1. Log out of Authentik
2. Visit your login page
3. You should be immediately redirected to Google's authentication page

### Troubleshooting
- If you still see the username/password form:
  - Clear your browser cache and cookies
  - Verify the flow is set as default in your active brand
  - Check that no other authentication flows are taking precedence
  - Verify the flow's policies allow access for all users

### Security Considerations
- Ensure you have a backup authentication method for administrators
- Consider setting up recovery flows for users who lose access to their Google accounts
- Review and test your password reset and account recovery procedures

### Notes
- This configuration assumes you want Google as the only authentication method
- For production environments, consider keeping an alternative authentication method for system administrators
- Remember to update your application's documentation to reflect this change in authentication flow 

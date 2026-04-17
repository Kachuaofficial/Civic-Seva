# Cloud Function Setup Guide: Report Status Notifications

This guide will help you set up and deploy the Cloud Function that sends email notifications when an admin updates a report's status in the Civic Seva dashboard.

## Overview

When an admin changes a report's status (pending → in-progress → fixed), the system will automatically:
1. Detect the status change in Firestore
2. Retrieve the reporter's email address
3. Send a personalized email notification
4. Log the notification in Firestore for tracking

## Prerequisites

- Firebase project with Blaze plan (Cloud Functions require it)
- Node.js 16+ installed locally
- Firebase CLI installed (`npm install -g firebase-tools`)
- Gmail account or SendGrid account for sending emails

## Step 1: Initialize Firebase Functions (if not already done)

```bash
cd civic-seva-admin
firebase init functions
```

Choose:
- **Language**: JavaScript
- **ESLint**: Yes (recommended)
- **Dependencies**: Yes

This creates a `functions/` directory with boilerplate code.

## Step 2: Install Dependencies

Navigate to the functions directory and install required packages:

```bash
cd functions
npm install firebase-admin nodemailer
cd ..
```

## Step 3: Set Up Email Service

### Option A: Using Gmail (Recommended for Development)

1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication if not already enabled
3. Generate an App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated 16-character password

4. Set environment variables:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password-16chars"
```

### Option B: Using SendGrid

1. Sign up at [SendGrid](https://sendgrid.com)
2. Generate an API key
3. Set environment variables:

```bash
firebase functions:config:set sendgrid.api_key="SG.your-api-key"
```

Then update the Cloud Function to use SendGrid instead of Nodemailer.

## Step 4: Deploy the Cloud Function

Replace the contents of `functions/index.js` with the Cloud Function code provided, or copy the `onReportStatusUpdate.js` file to your functions directory.

Deploy:

```bash
firebase deploy --only functions
```

The first deployment may take 2-3 minutes. You should see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/{project-id}/overview
```

## Step 5: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Functions** → **onReportStatusUpdate**
3. Check the **Logs** tab for recent invocations

## Step 6: Test the Function

1. Open the Civic Seva Admin Dashboard
2. View a complaint and update its status
3. Check the user's email for the notification
4. Check Firebase Functions logs for debugging

## Environment Variables

The function uses the following environment variables:

```javascript
process.env.EMAIL_USER        // Gmail address
process.env.EMAIL_PASSWORD    // Gmail App Password
```

To view current settings:

```bash
firebase functions:config:get
```

To update settings:

```bash
firebase functions:config:set email.user="new-email@gmail.com"
firebase functions:config:set email.password="new-app-password"
```

## Firestore Security Rules

Ensure your Firestore rules allow the Cloud Function to write to the `notifications` subcollection:

```javascript
match /reports/{reportId}/notifications/{document=**} {
  allow create: if request.auth.uid != null;
  allow read: if resource.data.recipient == request.auth.token.email;
}
```

## Email Template Customization

To customize the email template, edit the `htmlContent` variable in the Cloud Function:

- Change colors: Modify hex codes like `#2d8c56`
- Change text: Update the status messages object
- Add logo: Replace the Civic Seva header with an actual logo URL
- Change button link: Update `https://civicseva.example.com`

## Monitoring and Logs

View function logs:

```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to **Functions** → **onReportStatusUpdate**
2. Click on **Logs** tab
3. Filter by date/time

## Troubleshooting

### Error: "Cloud Functions API has not been used"

Solution: Enable it in Firebase Console → Functions → Try Again

### Error: "Permission denied" for Firestore writes

Solution: Update Firestore security rules to allow function writes

### Email not sending

Check:
1. Email credentials are correct
2. Less secure apps are enabled (for Gmail)
3. App Password was generated correctly (16 chars, no spaces)
4. Check Firebase Functions logs for errors

### Email sent but not received

Check:
1. Email address is correct in the `reports` document
2. Check spam/promotions folder
3. Verify email service quota hasn't been exceeded

## Database Structure

The function expects reports to have:

```
/reports/{reportId}
├── userId: string (user UID)
├── userEmail: string (recipient email)
├── userName: string (user's display name)
├── title: string (report title)
├── status: string ("pending" | "in-progress" | "fixed" | "rejected")
├── updatedAt: timestamp
└── notifications/
    ├── {auto-id}/
    │   ├── type: "status_update"
    │   ├── status: string
    │   ├── sentAt: timestamp
    │   ├── recipient: string
    │   └── success: boolean
```

## Advanced: Push Notifications via Firebase Cloud Messaging (FCM)

For in-app push notifications instead of email, uncomment the `onReportStatusUpdateFCM` function in the code and:

1. Store FCM tokens in the `users` collection
2. Users must have the app installed and granted notification permissions
3. Notifications arrive as push notifications in real-time

## Cost Considerations

- **Cloud Functions**: First 2M invocations/month are free
- **Sendgrid**: First 100 emails/day are free
- **Gmail**: Unlimited via Nodemailer (for personal use)

For production use, consider SendGrid's paid plans.

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Review Firestore security rules
3. Verify email service credentials
4. Test with a simple report status update

---

**Last Updated**: April 17, 2026

/**
 * Cloud Function: Send Notification on Report Status Update
 * 
 * This Cloud Function triggers whenever a report's status is updated in Firestore.
 * It sends an email notification to the user who reported the issue.
 * 
 * Prerequisites:
 * 1. Initialize Firebase Admin SDK
 * 2. Configure Firestore and Realtime Database
 * 3. Set up SendGrid or Firebase Cloud Messaging for notifications
 * 4. Enable the Cloud Functions API in your Firebase project
 * 
 * Deployment:
 * firebase deploy --only functions:onReportStatusUpdate
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure your email service (using Gmail or your email service)
// For Gmail: Create an App Password at https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Set via: firebase functions:config:set email.user="your-email@gmail.com"
    pass: process.env.EMAIL_PASSWORD, // Set via: firebase functions:config:set email.password="your-app-password"
  },
});

// Status update messages
const statusMessages = {
  pending: {
    subject: "Your Report Status: Pending Review",
    message:
      "Your civic issue report has been received and is pending review by our team. We will investigate and provide updates soon.",
  },
  "in-progress": {
    subject: "Your Report Status: In Progress",
    message:
      "Great news! Your report is now being addressed. Our team is actively working on resolving this issue. We will notify you once it's completed.",
  },
  fixed: {
    subject: "Your Report Status: Resolved! ✓",
    message:
      "Excellent! Your reported civic issue has been successfully resolved. Thank you for helping make our city better. Your contribution makes a difference!",
  },
  rejected: {
    subject: "Your Report Status: Requires More Information",
    message:
      "We reviewed your report, but need more details to proceed. Please contact our support team with additional information about your issue.",
  },
};

/**
 * Cloud Function: Triggered on report document update
 * Sends email notification to the user
 */
exports.onReportStatusUpdate = functions
  .region("asia-south1") // Change to your region
  .firestore.document("reports/{reportId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const reportId = context.params.reportId;

      // Check if status was actually changed
      if (beforeData.status === afterData.status) {
        console.log(`Report ${reportId}: No status change detected`);
        return null;
      }

      const newStatus = afterData.status;
      const userEmail = afterData.userEmail;
      const userName = afterData.userName || "User";
      const reportTitle = afterData.title || "Your Report";

      // Verify required fields
      if (!userEmail || !newStatus) {
        console.error(
          `Report ${reportId}: Missing userEmail or status for notification`
        );
        return null;
      }

      // Get status message
      const statusInfo = statusMessages[newStatus];
      if (!statusInfo) {
        console.warn(`Report ${reportId}: Unknown status "${newStatus}"`);
        return null;
      }

      // Prepare email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2d8c56 0%, #1f5d38 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Civic Seva</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Civic Issue Tracking System</p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #2d8c56; font-size: 18px;">
                ${statusInfo.subject}
              </h2>

              <p style="margin: 0 0 15px 0;">Dear ${userName},</p>

              <p style="margin: 0 0 15px 0;">
                <strong>Report:</strong> ${reportTitle}
              </p>

              <p style="margin: 0 0 20px 0; background: #f5f5f5; padding: 15px; border-left: 4px solid #2d8c56; border-radius: 4px;">
                ${statusInfo.message}
              </p>

              <p style="margin: 0 0 20px 0; font-size: 13px; color: #666;">
                <strong>Report ID:</strong> ${reportId}
              </p>

              <p style="margin: 0 0 20px 0;">
                If you have any questions, please contact our support team.
              </p>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="https://civicseva.example.com/report/${reportId}" 
                   style="display: inline-block; background: #2d8c56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Report Details
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9f9f9; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">© 2026 Civic Seva Platform. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">
                Status Updated At: ${new Date(afterData.updatedAt?.toDate?.() || new Date()).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: statusInfo.subject,
        html: htmlContent,
        replyTo: "support@civicseva.example.com",
      };

      await transporter.sendMail(mailOptions);

      // Log notification sent
      await admin
        .firestore()
        .collection("reports")
        .doc(reportId)
        .collection("notifications")
        .add({
          type: "status_update",
          status: newStatus,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          recipient: userEmail,
          success: true,
        });

      console.log(
        `Notification sent to ${userEmail} for report ${reportId} with status: ${newStatus}`
      );
      return null;
    } catch (error) {
      console.error("Error sending notification:", error);
      
      // Log error for debugging
      await admin
        .firestore()
        .collection("system_logs")
        .add({
          type: "notification_error",
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      throw error;
    }
  });

/**
 * Alternative: Cloud Function using Firebase Cloud Messaging (FCM)
 * Uncomment and deploy this if you want push notifications instead of email
 */
/*
exports.onReportStatusUpdateFCM = functions
  .region("asia-south1")
  .firestore.document("reports/{reportId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status === afterData.status) {
      return null;
    }

    const userId = afterData.userId;
    const newStatus = afterData.status;
    const reportTitle = afterData.title;

    try {
      // Get user's FCM tokens
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      const fcmTokens = userDoc.data()?.fcmTokens || [];

      const statusInfo = statusMessages[newStatus];

      const message = {
        notification: {
          title: statusInfo.subject,
          body: statusInfo.message,
        },
        data: {
          reportId: context.params.reportId,
          status: newStatus,
          reportTitle: reportTitle,
        },
      };

      // Send to all user devices
      const sendPromises = fcmTokens.map((token) =>
        admin.messaging().send({ ...message, token }).catch((err) => {
          console.error(`Failed to send to token ${token}:`, err);
        })
      );

      await Promise.all(sendPromises);
      console.log(`FCM notifications sent for report ${context.params.reportId}`);
      return null;
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      throw error;
    }
  });
*/

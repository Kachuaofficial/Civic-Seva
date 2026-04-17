import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Update report status and trigger cloud function notification
 * @param {string} reportId - The ID of the report to update
 * @param {string} newStatus - New status: "pending", "in-progress", "fixed", or "rejected"
 * @param {object} adminInfo - Information about the admin making the change
 * @returns {Promise<void>}
 */
export async function updateReportStatus(reportId, newStatus, adminInfo = {}) {
  if (!db) {
    throw new Error("Firebase Firestore is not configured");
  }

  if (!["pending", "in-progress", "fixed", "rejected"].includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  try {
    const reportRef = doc(db, "reports", reportId);
    
    // Update the report with new status
    // The Cloud Function will be triggered by this update and send notification
    await updateDoc(reportRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: adminInfo.email || "admin",
      updatedByName: adminInfo.displayName || "Admin",
      statusChangedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
}

/**
 * Batch update multiple reports
 * @param {string[]} reportIds - Array of report IDs
 * @param {string} newStatus - New status for all reports
 * @param {object} adminInfo - Admin information
 * @returns {Promise<void>}
 */
export async function updateMultipleReportStatus(reportIds, newStatus, adminInfo = {}) {
  if (!db) {
    throw new Error("Firebase Firestore is not configured");
  }

  const updates = reportIds.map((id) => updateReportStatus(id, newStatus, adminInfo));
  await Promise.all(updates);
}

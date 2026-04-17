/**
 * Civic Seva Firebase Cloud Functions
 * 
 * This file exports all Cloud Functions for the Civic Seva admin platform.
 * 
 * Functions:
 * - onReportStatusUpdate: Sends email notification when report status changes
 */

const { onReportStatusUpdate } = require("./onReportStatusUpdate");

module.exports = {
  onReportStatusUpdate,
};

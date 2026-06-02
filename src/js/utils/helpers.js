import { LOCALE } from './constants.js';

/**
 * Format a date string to locale date string
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(LOCALE);
}

/**
 * Format a date string to locale date-time string
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date-time string
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString(LOCALE);
}

/**
 * Calculate success rate percentage
 * @param {number} success - Number of successful executions
 * @param {number} total - Total number of executions
 * @returns {number} Success rate as percentage (0-100)
 */
export function calculateSuccessRate(success, total) {
  if (total === 0) return 0;
  return Math.round((success / total) * 100);
}

/**
 * Format execution time for tooltip display
 * @param {string} timeStr - ISO time string
 * @returns {string} Formatted time string
 */
export function formatExecutionTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 19).replace('T', ' ');
}

/**
 * Helper utilities for formatting and parsing dates in Vietnam standard format (dd/mm/yyyy).
 */

/**
 * Formats a date string (YYYY-MM-DD or ISO timestamp) to dd/mm/yyyy.
 * @param dateStr Date string from API
 * @returns Formatted date string or 'Chưa rõ'
 */
export const formatDateToDDMMYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Chưa rõ';
  
  // Extract YYYY-MM-DD pattern if available
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Chưa rõ';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return 'Chưa rõ';
  }
};

/**
 * Parses a dd/mm/yyyy date string to YYYY-MM-DD for backend storage.
 * @param dateStr User input date string (dd/mm/yyyy)
 * @returns YYYY-MM-DD formatted string or empty string
 */
export const parseDDMMYYYYToYYYYMMDD = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr; // Return as-is if already in YYYY-MM-DD or other format
};

/**
 * Formats an ISO date string/timestamp to dd/mm/yyyy hh:mm:ss.
 * @param dateStr ISO timestamp
 * @returns Formatted date-time string or 'Chưa rõ'
 */
export const formatDateToDateTimeString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Chưa rõ';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Chưa rõ';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return 'Chưa rõ';
  }
};

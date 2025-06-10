/**
 * Magic Link Utility Functions
 * Handles magic link creation, expiration checking, and related operations
 */

/**
 * Calculate magic link expiration time (1 hour from now)
 * @returns Date object representing when the magic link expires
 */
export function calculateMagicLinkExpiration(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
}

/**
 * Check if a magic link has expired
 * @param expirationDate - The expiration date to check against
 * @returns boolean indicating if the link has expired
 */
export function isMagicLinkExpired(expirationDate: Date | null): boolean {
  if (!expirationDate) {
    return false; // If no expiration date is set, consider it as not expired
  }
  return new Date() > expirationDate;
}

/**
 * Get time remaining until magic link expires
 * @param expirationDate - The expiration date
 * @returns number of milliseconds until expiration, or 0 if expired
 */
export function getTimeUntilExpiration(expirationDate: Date | null): number {
  if (!expirationDate) {
    return Infinity; // If no expiration date is set, return infinity
  }
  const timeRemaining = expirationDate.getTime() - Date.now();
  return Math.max(0, timeRemaining);
}

/**
 * Format time remaining as human readable string
 * @param expirationDate - The expiration date
 * @returns Human readable string like "45 minutes" or "Expired"
 */
export function formatTimeRemaining(expirationDate: Date | null): string {
  if (!expirationDate) {
    return 'No expiration';
  }
  
  const timeRemaining = getTimeUntilExpiration(expirationDate);
  
  if (timeRemaining === 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${minutes}m`;
  }
} 
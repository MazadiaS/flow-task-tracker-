/**
 * Security utilities for input sanitization and validation
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string safe for display and storage
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';

  // Trim and enforce max length
  let sanitized = input.trim().slice(0, maxLength);

  // Use DOMPurify to remove any malicious HTML/scripts
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true // Keep text content, just remove tags
  });

  return sanitized;
};

/**
 * Sanitize task name (shorter max length)
 */
export const sanitizeTaskName = (name: string): string => {
  return sanitizeInput(name, 200);
};

/**
 * Sanitize notes/descriptions (longer max length)
 */
export const sanitizeNotes = (notes: string): string => {
  return sanitizeInput(notes, 5000);
};

/**
 * Validate and sanitize URL
 * Only allows http:// and https:// protocols
 * @param url - URL string to validate
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeURL = (url: string): string | null => {
  if (!url) return null;

  try {
    const trimmed = url.trim();
    const parsed = new URL(trimmed);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn('Rejected URL with unsafe protocol:', parsed.protocol);
      return null;
    }

    // Prevent data: and javascript: URLs
    if (trimmed.toLowerCase().startsWith('data:') ||
        trimmed.toLowerCase().startsWith('javascript:')) {
      console.warn('Rejected dangerous URL scheme');
      return null;
    }

    return parsed.toString();
  } catch (error) {
    console.warn('Invalid URL format:', url);
    return null;
  }
};

/**
 * Sanitize array of URLs (for homework resources)
 */
export const sanitizeURLArray = (urls: string[]): string[] => {
  if (!Array.isArray(urls)) return [];

  return urls
    .map(sanitizeURL)
    .filter((url): url is string => url !== null)
    .slice(0, 20); // Max 20 resources
};

/**
 * Validate email format (basic validation)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize and validate number input
 */
export const sanitizeNumber = (
  value: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number => {
  const num = parseInt(value, 10);

  if (isNaN(num)) return min;
  if (num < min) return min;
  if (num > max) return max;

  return num;
};

/**
 * Prevent localStorage quota exceeded errors
 * @returns Available space in bytes (approximate)
 */
export const checkLocalStorageQuota = (): number => {
  try {
    const test = 'x'.repeat(1024 * 1024); // 1MB test
    const key = '__quota_test__';

    for (let i = 0; i < 10; i++) {
      try {
        localStorage.setItem(key, test);
        localStorage.removeItem(key);
      } catch {
        return i * 1024 * 1024; // Return approximate available space
      }
    }

    return 10 * 1024 * 1024; // 10MB+ available
  } catch {
    return 0;
  }
};

/**
 * Safe localStorage setItem with error handling
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Clear some data.');
      // Could implement auto-cleanup of old archives here
      return false;
    }
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

/**
 * Prevent prototype pollution attacks
 */
export const safeObjectMerge = <T extends object>(target: T, source: any): T => {
  const safeSource = { ...source };

  // Remove dangerous keys
  delete safeSource.__proto__;
  delete safeSource.constructor;
  delete safeSource.prototype;

  return { ...target, ...safeSource };
};

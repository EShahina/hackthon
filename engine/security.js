/**
 * ReelSense — Security Module
 * 
 * Provides input sanitization, rate limiting, and XSS prevention.
 * All user-facing outputs are sanitized through this module.
 */

// === HTML Entity Map for XSS Prevention ===
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;'
};

// === Dangerous Pattern Detection ===
const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\(/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<form\b/gi,
  /<input\b[^>]*type\s*=\s*["']?hidden/gi
];

// === Rate Limiter ===
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  /**
   * Check if a request is allowed under the rate limit
   * @param {string} key - Identifier for the requester
   * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
   */
  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);
    
    // Remove expired timestamps
    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    const remaining = this.maxRequests - timestamps.length;
    const resetMs = timestamps.length > 0 
      ? timestamps[0] + this.windowMs - now 
      : this.windowMs;

    if (remaining <= 0) {
      return { allowed: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    return { allowed: true, remaining: remaining - 1, resetMs };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key) {
    this.requests.delete(key);
  }
}

// === Input Sanitizer ===
class InputSanitizer {
  /**
   * Sanitize a string by escaping HTML entities
   * @param {string} input - Raw user input
   * @returns {string} Sanitized string safe for HTML insertion
   */
  static escapeHtml(input) {
    if (typeof input !== 'string') return String(input);
    return input.replace(/[&<>"'`/]/g, char => HTML_ENTITIES[char]);
  }

  /**
   * Check if input contains potential XSS patterns
   * @param {string} input - String to check
   * @returns {boolean} True if suspicious patterns found
   */
  static containsXssPatterns(input) {
    if (typeof input !== 'string') return false;
    return XSS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize a reel object's text fields
   * @param {Object} reel - Reel data object
   * @returns {Object} Sanitized reel with escaped text fields
   */
  static sanitizeReel(reel) {
    if (!reel || typeof reel !== 'object') return {};
    
    return {
      ...reel,
      title: this.escapeHtml(reel.title || ''),
      creator: this.escapeHtml(reel.creator || ''),
      description: this.escapeHtml(reel.description || ''),
      category: this.escapeHtml(reel.category || ''),
      tags: Array.isArray(reel.tags) 
        ? reel.tags.map(t => this.escapeHtml(t)) 
        : []
    };
  }

  /**
   * Validate reel ID format
   * @param {string} id - Reel ID
   * @returns {boolean} True if valid format
   */
  static isValidReelId(id) {
    return typeof id === 'string' && /^[RT]\d{3}$/.test(id);
  }

  /**
   * Sanitize array of reel IDs
   * @param {string[]} ids - Array of reel IDs
   * @returns {string[]} Valid IDs only
   */
  static sanitizeReelIds(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.filter(id => this.isValidReelId(id));
  }
}

// === Content Validator ===
class ContentValidator {
  /**
   * Validate that reel data has required fields
   * @param {Object} reel - Reel data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateReel(reel) {
    const errors = [];
    
    if (!reel || typeof reel !== 'object') {
      return { valid: false, errors: ['Reel must be an object'] };
    }

    const requiredFields = ['id', 'title', 'creator', 'category', 'semanticTopics', 'contentSignals'];
    for (const field of requiredFields) {
      if (!reel[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (reel.id && !InputSanitizer.isValidReelId(reel.id)) {
      errors.push(`Invalid reel ID format: ${reel.id}`);
    }

    if (reel.semanticTopics && !Array.isArray(reel.semanticTopics)) {
      errors.push('semanticTopics must be an array');
    }

    if (reel.contentSignals && typeof reel.contentSignals !== 'object') {
      errors.push('contentSignals must be an object');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate interest profile output
   * @param {Object} profile - Interest profile from inference engine
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateProfile(profile) {
    const errors = [];

    if (!profile || typeof profile !== 'object') {
      return { valid: false, errors: ['Profile must be an object'] };
    }

    if (profile.primaryInterest && typeof profile.primaryInterest !== 'object') {
      errors.push('primaryInterest must be an object');
    }

    if (profile.clusterScores && typeof profile.clusterScores !== 'object') {
      errors.push('clusterScores must be an object');
    }

    if (profile.reelAnalyses && !Array.isArray(profile.reelAnalyses)) {
      errors.push('reelAnalyses must be an array');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate recommendation output
   * @param {Object} rec - Recommendation object
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateRecommendation(rec) {
    const errors = [];

    if (!rec || typeof rec !== 'object') {
      return { valid: false, errors: ['Recommendation must be an object'] };
    }

    const requiredFields = ['recommendedReel', 'interestDetected', 'category', 'difficulty', 'confidence'];
    for (const field of requiredFields) {
      if (!rec[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (rec.difficulty && !validDifficulties.includes(rec.difficulty)) {
      errors.push(`Invalid difficulty: ${rec.difficulty}`);
    }

    const validConfidences = ['Low', 'Medium', 'High'];
    if (rec.confidence && !validConfidences.includes(rec.confidence)) {
      errors.push(`Invalid confidence: ${rec.confidence}`);
    }

    return { valid: errors.length === 0, errors };
  }
}

// === Security Manager (Main Export) ===
export class SecurityManager {
  constructor() {
    this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
    this.sanitizer = InputSanitizer;
    this.validator = ContentValidator;
    this.auditLog = [];
  }

  /**
   * Check rate limit for analysis requests
   * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
   */
  checkAnalysisRateLimit() {
    return this.rateLimiter.check('analysis');
  }

  /**
   * Sanitize reel data for safe rendering
   */
  sanitizeReel(reel) {
    return this.sanitizer.sanitizeReel(reel);
  }

  /**
   * Sanitize multiple reels
   */
  sanitizeReels(reels) {
    return reels.map(r => this.sanitizeReel(r));
  }

  /**
   * Validate reel data integrity
   */
  validateReel(reel) {
    return this.validator.validateReel(reel);
  }

  /**
   * Validate interest profile
   */
  validateProfile(profile) {
    return this.validator.validateProfile(profile);
  }

  /**
   * Validate recommendation
   */
  validateRecommendation(rec) {
    return this.validator.validateRecommendation(rec);
  }

  /**
   * Escape HTML in output strings
   */
  escapeHtml(str) {
    return this.sanitizer.escapeHtml(str);
  }

  /**
   * Log a security event
   */
  logEvent(type, details) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      type,
      details
    });
    // Keep last 100 events
    if (this.auditLog.length > 100) {
      this.auditLog.shift();
    }
  }

  /**
   * Get audit log
   */
  getAuditLog() {
    return [...this.auditLog];
  }
}

// Export singleton
export const security = new SecurityManager();

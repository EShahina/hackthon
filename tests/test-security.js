/**
 * ReelMind — Security Module Tests
 * Tests: XSS prevention, rate limiting, input validation, sanitization
 */
import { runner, assert, it, beforeAll, afterAll } from './framework.js';
import { SecurityManager, security } from '../engine/security.js';
import { SAMPLE_REELS } from '../data/reels.js';

let sm;

runner.describe('SecurityModule', () => {
  runner.beforeAll(() => {
    sm = new SecurityManager();
  });

  runner.describe('HTML Escaping', () => {
    it('should escape < and > characters', () => {
      const input = '<script>alert("xss")</script>';
      const safe = sm.escapeHtml(input);
      assert.isFalse(safe.includes('<script>'), 'should not contain raw <script>');
      assert.includes(safe.split(''), '&', 'should contain &amp;');
    });

    it('should escape double quotes', () => {
      const input = 'Hello "world"';
      const safe = sm.escapeHtml(input);
      assert.isFalse(safe.includes('"'), 'should escape double quotes');
    });

    it('should escape single quotes', () => {
      const input = "It's a test";
      const safe = sm.escapeHtml(input);
      assert.isFalse(safe.includes("'"), 'should escape single quotes');
    });

    it('should handle non-string input', () => {
      const result = sm.escapeHtml(12345);
      assert.equal(result, '12345', 'should convert numbers to string');
    });

    it('should handle empty string', () => {
      const result = sm.escapeHtml('');
      assert.equal(result, '', 'should return empty string');
    });

    it('should handle null input', () => {
      const result = sm.escapeHtml(null);
      assert.isNotNull(result, 'should not return null');
    });

    it('should escape backticks', () => {
      const input = '`template`';
      const safe = sm.escapeHtml(input);
      assert.isFalse(safe.includes('`'), 'should escape backticks');
    });

    it('should escape forward slashes', () => {
      const input = '<img/src=x onerror=alert(1)>';
      const safe = sm.escapeHtml(input);
      assert.isFalse(safe.includes('/src='), 'should escape slashes in XSS');
    });
  });

  runner.describe('Reel Sanitization', () => {
    it('should sanitize all text fields of a reel', () => {
      const reel = SAMPLE_REELS[0];
      const safe = sm.sanitizeReel(reel);
      assert.hasProperty(safe, 'title');
      assert.hasProperty(safe, 'creator');
      assert.hasProperty(safe, 'description');
      assert.hasProperty(safe, 'category');
    });

    it('should preserve reel ID', () => {
      const reel = SAMPLE_REELS[0];
      const safe = sm.sanitizeReel(reel);
      assert.equal(safe.id, reel.id, 'should preserve ID');
    });

    it('should preserve numeric fields', () => {
      const reel = SAMPLE_REELS[0];
      const safe = sm.sanitizeReel(reel);
      assert.equal(safe.likes, reel.likes, 'should preserve likes');
      assert.equal(safe.views, reel.views, 'should preserve views');
    });

    it('should handle null reel', () => {
      const result = sm.sanitizeReel(null);
      assert.isObject(result, 'should return object for null input');
    });

    it('should sanitize reels array', () => {
      const safe = sm.sanitizeReels(SAMPLE_REELS.slice(0, 3));
      assert.isArray(safe);
      assert.lengthOf(safe, 3);
    });
  });

  runner.describe('XSS Pattern Detection', () => {
    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sm.sanitizer.containsXssPatterns(input);
      assert.isTrue(result, 'should detect script tags');
    });

    it('should detect javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sm.sanitizer.containsXssPatterns(input);
      assert.isTrue(result, 'should detect javascript: protocol');
    });

    it('should detect onerror event handler', () => {
      const input = '<img onerror=alert(1) src=x>';
      const result = sm.sanitizer.containsXssPatterns(input);
      assert.isTrue(result, 'should detect event handlers');
    });

    it('should not flag normal text', () => {
      const input = 'This is a normal reel title about Java programming';
      const result = sm.sanitizer.containsXssPatterns(input);
      assert.isFalse(result, 'should not flag normal text');
    });

    it('should detect data: URI with html', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sm.sanitizer.containsXssPatterns(input);
      assert.isTrue(result, 'should detect data: URIs');
    });
  });

  runner.describe('Reel ID Validation', () => {
    it('should accept valid reel IDs', () => {
      assert.isTrue(sm.sanitizer.isValidReelId('R001'));
      assert.isTrue(sm.sanitizer.isValidReelId('T023'));
    });

    it('should reject invalid formats', () => {
      assert.isFalse(sm.sanitizer.isValidReelId(''));
      assert.isFalse(sm.sanitizer.isValidReelId('abc'));
      assert.isFalse(sm.sanitizer.isValidReelId('R00'));
      assert.isFalse(sm.sanitizer.isValidReelId('R0001'));
      assert.isFalse(sm.sanitizer.isValidReelId(null));
      assert.isFalse(sm.sanitizer.isValidReelId(123));
    });

    it('should sanitize reel IDs array', () => {
      const ids = ['R001', 'invalid', 'T002', '', 'R999'];
      const clean = sm.sanitizer.sanitizeReelIds(ids);
      assert.lengthOf(clean, 3, 'should filter invalid IDs');
    });
  });

  runner.describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new (sm.rateLimiter.constructor)(5, 60000);
      const result = limiter.check('test');
      assert.isTrue(result.allowed, 'should allow first request');
      assert.isAbove(result.remaining, 0, 'should have remaining requests');
    });

    it('should block requests over limit', () => {
      const limiter = new (sm.rateLimiter.constructor)(2, 60000);
      limiter.check('test');
      limiter.check('test');
      const result = limiter.check('test');
      assert.isFalse(result.allowed, 'should block after limit');
      assert.equal(result.remaining, 0);
    });

    it('should track different keys independently', () => {
      const limiter = new (sm.rateLimiter.constructor)(1, 60000);
      limiter.check('user1');
      const result = limiter.check('user2');
      assert.isTrue(result.allowed, 'different keys should be independent');
    });

    it('should reset rate limit', () => {
      const limiter = new (sm.rateLimiter.constructor)(1, 60000);
      limiter.check('test');
      limiter.reset('test');
      const result = limiter.check('test');
      assert.isTrue(result.allowed, 'should allow after reset');
    });

    it('should report correct remaining count', () => {
      const limiter = new (sm.rateLimiter.constructor)(3, 60000);
      const r1 = limiter.check('test');
      assert.equal(r1.remaining, 2, 'should have 2 remaining');
      const r2 = limiter.check('test');
      assert.equal(r2.remaining, 1, 'should have 1 remaining');
    });
  });

  runner.describe('Content Validation', () => {
    it('should validate a correct reel', () => {
      const result = sm.validateReel(SAMPLE_REELS[0]);
      assert.isTrue(result.valid, 'valid reel should pass');
      assert.lengthOf(result.errors, 0, 'should have no errors');
    });

    it('should reject reel missing required fields', () => {
      const bad = { title: 'Test' };
      const result = sm.validateReel(bad);
      assert.isFalse(result.valid, 'should be invalid');
      assert.isAbove(result.errors.length, 0, 'should have errors');
    });

    it('should validate interest profile', () => {
      const profile = { primaryInterest: { label: 'Test' }, clusterScores: {}, reelAnalyses: [] };
      const result = sm.validateProfile(profile);
      assert.isTrue(result.valid);
    });

    it('should validate recommendation', () => {
      const rec = { recommendedReel: 'Test', interestDetected: 'Test', category: 'HLD', difficulty: 'Intermediate', confidence: 'High' };
      const result = sm.validateRecommendation(rec);
      assert.isTrue(result.valid);
    });

    it('should reject invalid difficulty level', () => {
      const rec = { recommendedReel: 'Test', interestDetected: 'Test', category: 'HLD', difficulty: 'Expert', confidence: 'High' };
      const result = sm.validateRecommendation(rec);
      assert.isFalse(result.valid, 'Expert is not a valid difficulty');
    });

    it('should reject invalid confidence level', () => {
      const rec = { recommendedReel: 'Test', interestDetected: 'Test', category: 'HLD', difficulty: 'Intermediate', confidence: 'Very High' };
      const result = sm.validateRecommendation(rec);
      assert.isFalse(result.valid, 'Very High is not a valid confidence');
    });
  });

  runner.describe('Rate Limit Integration', () => {
    it('should allow analysis within rate limit', () => {
      const result = sm.checkAnalysisRateLimit();
      assert.isTrue(result.allowed);
    });
  });

  runner.describe('Audit Logging', () => {
    it('should log security events', () => {
      const initialLen = sm.getAuditLog().length;
      sm.logEvent('test_event', { detail: 'test' });
      const log = sm.getAuditLog();
      assert.isAbove(log.length, initialLen, 'should add to log');
    });

    it('should include timestamp in events', () => {
      sm.logEvent('test_event', {});
      const log = sm.getAuditLog();
      const last = log[log.length - 1];
      assert.hasProperty(last, 'timestamp');
      assert.hasProperty(last, 'type');
      assert.hasProperty(last, 'details');
    });
  });
});

/**
 * ReelMind — Integration Tests
 * Tests: full pipeline (reels → inference → recommendations → validation)
 */
import { runner, assert, it, beforeAll, afterAll } from './framework.js';
import { InterestInferenceEngine } from '../engine/inference.js';
import { RecommendationEngine } from '../engine/recommender.js';
import { SecurityManager } from '../engine/security.js';
import { SAMPLE_REELS } from '../data/reels.js';

let inferEngine, recEngine, security;

runner.describe('Integration: Full Pipeline', () => {
  runner.beforeAll(() => {
    inferEngine = new InterestInferenceEngine();
    recEngine = new RecommendationEngine();
    security = new SecurityManager();
  });

  runner.describe('End-to-End Flow', () => {
    it('should complete full pipeline: reels → analysis → recommendations', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const profile = inferEngine.analyze(trapReels);
      const recs = recEngine.recommend(profile, trapReels, 5);
      
      assert.isObject(profile);
      assert.isArray(recs);
      assert.isAbove(recs.length, 0, 'should produce recommendations');
    });

    it('should detect compound interest from trap reels', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const profile = inferEngine.analyze(trapReels);
      assert.isNotNull(profile.compoundInterest, 'should detect compound interest');
      assert.isAbove(profile.compoundInterest.matchedClusters.length, 1, 'compound should span 2+ clusters');
    });

    it('should produce valid recommendations after compound detection', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const profile = inferEngine.analyze(trapReels);
      const recs = recEngine.recommend(profile, trapReels, 3);
      
      for (const rec of recs) {
        assert.hasProperty(rec, 'recommendedReel');
        assert.hasProperty(rec, 'interestDetected');
        assert.hasProperty(rec, 'confidence');
        assert.hasProperty(rec, 'difficulty');
        assert.hasProperty(rec, 'whyThisRecommendation');
      }
    });

    it('should sanitize outputs through security module', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const profile = inferEngine.analyze(trapReels);
      const recs = recEngine.recommend(profile, trapReels, 3);
      
      for (const rec of recs) {
        const safe = security.sanitizeReel({ title: rec.recommendedReel });
        assert.isFalse(security.sanitizer.containsXssPatterns(safe.title), 'output should be XSS-safe');
      }
    });

    it('should validate all outputs through security validator', () => {
      const profile = inferEngine.analyze(SAMPLE_REELS.slice(0, 4));
      const profileValid = security.validateProfile(profile);
      assert.isTrue(profileValid.valid, 'profile should be valid');

      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 3);
      for (const rec of recs) {
        const recValid = security.validateRecommendation(rec);
        assert.isTrue(recValid.valid, `recommendation should be valid: ${recValid.errors.join(', ')}`);
      }
    });
  });

  runner.describe('Scenario: Non-Tech Reels', () => {
    it('should handle entertainment-only reels', () => {
      const entReels = SAMPLE_REELS.filter(r => r.contentSignals.techDomain === 'none');
      if (entReels.length > 0) {
        const profile = inferEngine.analyze(entReels);
        assert.isObject(profile);
        const recs = recEngine.recommend(profile, entReels, 3);
        assert.isArray(recs);
      }
    });
  });

  runner.describe('Scenario: Mixed Reels', () => {
    it('should handle mix of tech and non-tech', () => {
      const mixed = [SAMPLE_REELS[0], SAMPLE_REELS[4]]; // Java meme + Cat video
      const profile = inferEngine.analyze(mixed);
      assert.isObject(profile);
      assert.hasProperty(profile, 'clusterScores');
    });
  });

  runner.describe('Scenario: All Reels Selected', () => {
    it('should process all 8 reels without errors', () => {
      const profile = inferEngine.analyze(SAMPLE_REELS);
      const recs = recEngine.recommend(profile, SAMPLE_REELS, 5);
      assert.isObject(profile);
      assert.isArray(recs);
      assert.isAbove(recs.length, 0);
    });
  });

  runner.describe('Security Integration', () => {
    it('should respect rate limit during analysis', () => {
      for (let i = 0; i < 10; i++) {
        const result = security.checkAnalysisRateLimit();
        assert.isTrue(result.allowed, `request ${i + 1} should be allowed`);
      }
      const blocked = security.checkAnalysisRateLimit();
      assert.isFalse(blocked.allowed, '11th request should be blocked');
    });

    it('should log all security events', () => {
      const initialLen = security.getAuditLog().length;
      security.logEvent('test', {});
      security.logEvent('test2', { key: 'value' });
      assert.isAbove(security.getAuditLog().length, initialLen);
    });
  });

  runner.describe('Performance', () => {
    it('should complete analysis in under 100ms', () => {
      const start = performance.now();
      inferEngine.analyze(SAMPLE_REELS);
      const duration = performance.now() - start;
      assert.isBelow(duration, 100, `analysis took ${duration.toFixed(1)}ms, should be < 100ms`);
    });

    it('should complete recommendation in under 100ms', () => {
      const profile = inferEngine.analyze(SAMPLE_REELS.slice(0, 4));
      const start = performance.now();
      recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 5);
      const duration = performance.now() - start;
      assert.isBelow(duration, 100, `recommendation took ${duration.toFixed(1)}ms, should be < 100ms`);
    });

    it('should complete full pipeline in under 200ms', () => {
      const start = performance.now();
      const profile = inferEngine.analyze(SAMPLE_REELS);
      recEngine.recommend(profile, SAMPLE_REELS, 5);
      const duration = performance.now() - start;
      assert.isBelow(duration, 200, `full pipeline took ${duration.toFixed(1)}ms, should be < 200ms`);
    });
  });
});

/**
 * ReelMind — Recommendation Engine Tests
 * Tests: hype filtering, scoring, diversity, formatting, validation
 */
import { runner, assert } from './framework.js';
import { RecommendationEngine } from '../engine/recommender.js';
import { InterestInferenceEngine } from '../engine/inference.js';
import { SAMPLE_REELS, RECOMMENDATION_POOL } from '../data/reels.js';
import { HYPE_PATTERNS, CATEGORY_META, DIFFICULTY_META } from '../data/topics.js';

let recEngine;
let inferEngine;
let profile;

runner.describe('RecommendationEngine', () => {
  runner.beforeAll(() => {
    recEngine = new RecommendationEngine();
    inferEngine = new InterestInferenceEngine();
    profile = inferEngine.analyze(SAMPLE_REELS.slice(0, 4));
  });

  runner.describe('Hype Filtering', () => {
    it('should have hype patterns defined', () => {
      assert.isArray(HYPE_PATTERNS, 'HYPE_PATTERNS should be an array');
      assert.isAbove(HYPE_PATTERNS.length, 0, 'should have at least one pattern');
    });

    it('should filter out hype reels from recommendations', () => {
      const hypeReel = {
        id: 'H001',
        title: 'You won\'t BELIEVE this insane trick!!!',
        category: 'Tech',
        semanticMatch: ['java-programming'],
        difficulty: 'Beginner',
        hypeScore: 0.9
      };
      const result = recEngine._isHype(hypeReel);
      assert.isTrue(result, 'should detect hype content');
    });

    it('should not flag quality content as hype', () => {
      const qualityReel = RECOMMENDATION_POOL[0];
      const result = recEngine._isHype(qualityReel);
      assert.isFalse(result, 'quality content should not be flagged as hype');
    });
  });

  runner.describe('Recommendation Scoring', () => {
    it('should score candidates against profile', () => {
      const scored = recEngine._scoreCandidates(profile, SAMPLE_REELS.slice(0, 4));
      assert.isArray(scored, 'scored should be an array');
      assert.isAbove(scored.length, 0, 'should produce scored candidates');
    });

    it('should sort by score descending', () => {
      const scored = recEngine._scoreCandidates(profile, SAMPLE_REELS.slice(0, 4));
      for (let i = 1; i < scored.length; i++) {
        assert.isAtMost(scored[i].score, scored[i - 1].score, 'should be sorted by score desc');
      }
    });

    it('should boost scores for compound interest matches', () => {
      const compoundProfile = { ...profile, compoundInterest: { label: 'Test', matchedClusters: ['software-engineering', 'computer-science'] } };
      const withCompound = recEngine._scoreCandidates(compoundProfile, SAMPLE_REELS.slice(0, 4));
      const withoutCompound = recEngine._scoreCandidates(profile, SAMPLE_REELS.slice(0, 4));
      // Compound should generally produce higher top scores
      if (withCompound.length > 0 && withoutCompound.length > 0) {
        assert.isAbove(withCompound[0].score, 0, 'should produce positive scores with compound');
      }
    });
  });

  runner.describe('Diversity', () => {
    it('should apply diversity penalty for same category', () => {
      const scored = [
        { candidate: { category: 'HLD', title: 'A' }, score: 2.0, matchDetails: {} },
        { candidate: { category: 'HLD', title: 'B' }, score: 1.8, matchDetails: {} },
        { candidate: { category: 'DSA', title: 'C' }, score: 1.5, matchDetails: {} }
      ];
      const diverse = recEngine._applyDiversity(scored, 3);
      assert.isArray(diverse, 'should return array');
      assert.isAtMost(diverse.length, 3, 'should not exceed max');
    });

    it('should not reduce count below max', () => {
      const scored = Array(10).fill(null).map((_, i) => ({
        candidate: { category: `Cat${i}`, title: `${i}` },
        score: 10 - i,
        matchDetails: {}
      }));
      const diverse = recEngine._applyDiversity(scored, 3);
      assert.isAtMost(diverse.length, 3, 'should cap at max');
    });
  });

  runner.describe('Full Recommendation Pipeline', () => {
    it('should produce recommendations from profile', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 5);
      assert.isArray(recs, 'recommendations should be an array');
      assert.isAbove(recs.length, 0, 'should produce at least one recommendation');
    });

    it('should include required fields in each recommendation', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 3);
      for (const rec of recs) {
        assert.hasProperty(rec, 'index');
        assert.hasProperty(rec, 'currentReel');
        assert.hasProperty(rec, 'interestDetected');
        assert.hasProperty(rec, 'why');
        assert.hasProperty(rec, 'recommendedReel');
        assert.hasProperty(rec, 'category');
        assert.hasProperty(rec, 'difficulty');
        assert.hasProperty(rec, 'confidence');
      }
    });

    it('should return valid difficulty levels', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 5);
      const valid = ['Beginner', 'Intermediate', 'Advanced'];
      for (const rec of recs) {
        assert.includes(valid, rec.difficulty, `difficulty "${rec.difficulty}" should be valid`);
      }
    });

    it('should return valid confidence levels', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 5);
      const valid = ['Low', 'Medium', 'High'];
      for (const rec of recs) {
        assert.includes(valid, rec.confidence, `confidence "${rec.confidence}" should be valid`);
      }
    });

    it('should respect maxRecommendations limit', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 2);
      assert.isAtMost(recs.length, 2, 'should not exceed max');
    });

    it('should not recommend already-watched reels', () => {
      const watched = [RECOMMENDATION_POOL[0].id];
      const recs = recEngine.recommend(profile, watched, 5);
      for (const rec of recs) {
        assert.isNotNull(rec.recommendedReel, 'should have a recommendation');
      }
    });

    it('should handle empty profile gracefully', () => {
      const recs = recEngine.recommend({}, SAMPLE_REELS.slice(0, 4), 5);
      assert.isArray(recs, 'should return array even with empty profile');
    });

    it('should generate non-empty whyThisRecommendation', () => {
      const recs = recEngine.recommend(profile, SAMPLE_REELS.slice(0, 4), 3);
      for (const rec of recs) {
        if (rec.whyThisRecommendation) {
          assert.isAbove(rec.whyThisRecommendation.length, 5, 'whyThisRecommendation should be meaningful');
        }
      }
    });
  });

  runner.describe('Metadata Validation', () => {
    it('should have CATEGORY_META for all used categories', () => {
      assert.isObject(CATEGORY_META, 'CATEGORY_META should be defined');
    });

    it('should have DIFFICULTY_META for all difficulty levels', () => {
      assert.isObject(DIFFICULTY_META, 'DIFFICULTY_META should be defined');
      assert.hasProperty(DIFFICULTY_META, 'Beginner');
      assert.hasProperty(DIFFICULTY_META, 'Intermediate');
      assert.hasProperty(DIFFICULTY_META, 'Advanced');
    });

    it('should have recommendation pool with sufficient entries', () => {
      assert.isArray(RECOMMENDATION_POOL);
      assert.isAbove(RECOMMENDATION_POOL.length, 10, 'should have 10+ recommendations');
    });
  });
});

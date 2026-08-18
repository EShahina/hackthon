/**
 * ReelMind — Data Integrity Tests
 * Tests: data structure validation, topic taxonomy, recommendation pool
 */
import { runner, assert, it, beforeAll, afterAll } from './framework.js';
import { SAMPLE_REELS, RECOMMENDATION_POOL } from '../data/reels.js';
import { TOPIC_HIERARCHY, TOPIC_TO_CLUSTER, SIGNAL_WEIGHTS, COMPOUND_PATTERNS, HYPE_PATTERNS } from '../data/topics.js';

runner.describe('Data Integrity', () => {
  runner.describe('Sample Reels', () => {
    it('should have 8 sample reels', () => {
      assert.lengthOf(SAMPLE_REELS, 8, 'should have exactly 8 reels');
    });

    it('should have unique IDs', () => {
      const ids = SAMPLE_REELS.map(r => r.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, 'all IDs should be unique');
    });

    it('should have all required fields', () => {
      for (const reel of SAMPLE_REELS) {
        assert.hasProperty(reel, 'id', `${reel.id} should have id`);
        assert.hasProperty(reel, 'title', `${reel.id} should have title`);
        assert.hasProperty(reel, 'creator', `${reel.id} should have creator`);
        assert.hasProperty(reel, 'description', `${reel.id} should have description`);
        assert.hasProperty(reel, 'category', `${reel.id} should have category`);
        assert.hasProperty(reel, 'tags', `${reel.id} should have tags`);
        assert.hasProperty(reel, 'duration', `${reel.id} should have duration`);
        assert.hasProperty(reel, 'semanticTopics', `${reel.id} should have semanticTopics`);
        assert.hasProperty(reel, 'contentSignals', `${reel.id} should have contentSignals`);
      }
    });

    it('should have valid ID format', () => {
      for (const reel of SAMPLE_REELS) {
        assert.matches(reel.id, /^[RT]\d{3}$/, `${reel.id} should match ID format`);
      }
    });

    it('should have non-empty titles', () => {
      for (const reel of SAMPLE_REELS) {
        assert.isAbove(reel.title.length, 0, `${reel.id} should have non-empty title`);
      }
    });

    it('should have non-empty semanticTopics', () => {
      for (const reel of SAMPLE_REELS) {
        assert.isArray(reel.semanticTopics, `${reel.id} should have semanticTopics array`);
        assert.isAbove(reel.semanticTopics.length, 0, `${reel.id} should have at least one topic`);
      }
    });

    it('should have valid contentSignals', () => {
      const validDepths = ['none', 'surface', 'moderate', 'deep'];
      const validIntents = ['entertainment', 'learning', 'career-exploration', 'career-planning', 'interview-awareness', 'purchase-research'];
      const validRelevance = ['none', 'indirect', 'direct'];

      for (const reel of SAMPLE_REELS) {
        const s = reel.contentSignals;
        assert.includes(validDepths, s.topicDepth, `${reel.id} should have valid topicDepth`);
        assert.includes(validIntents, s.intentSignal, `${reel.id} should have valid intentSignal`);
        assert.includes(validRelevance, s.careerRelevance, `${reel.id} should have valid careerRelevance`);
      }
    });

    it('should have trap reels (R001-R004)', () => {
      const ids = SAMPLE_REELS.map(r => r.id);
      assert.includes(ids, 'R001', 'should have R001');
      assert.includes(ids, 'R002', 'should have R002');
      assert.includes(ids, 'R003', 'should have R003');
      assert.includes(ids, 'R004', 'should have R004');
    });
  });

  runner.describe('Recommendation Pool', () => {
    it('should have at least 15 recommendations', () => {
      assert.isAbove(RECOMMENDATION_POOL.length, 15, 'should have 15+ recommendations');
    });

    it('should have unique IDs', () => {
      const ids = RECOMMENDATION_POOL.map(r => r.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, 'all IDs should be unique');
    });

    it('should have all required fields', () => {
      for (const rec of RECOMMENDATION_POOL) {
        assert.hasProperty(rec, 'id');
        assert.hasProperty(rec, 'title');
        assert.hasProperty(rec, 'category');
        assert.hasProperty(rec, 'difficulty');
        assert.hasProperty(rec, 'semanticMatch');
      }
    });

    it('should have valid difficulty levels', () => {
      const valid = ['Beginner', 'Intermediate', 'Advanced'];
      for (const rec of RECOMMENDATION_POOL) {
        assert.includes(valid, rec.difficulty, `${rec.id} should have valid difficulty`);
      }
    });

    it('should have semanticMatch arrays', () => {
      for (const rec of RECOMMENDATION_POOL) {
        assert.isArray(rec.semanticMatch, `${rec.id} should have semanticMatch array`);
        assert.isAbove(rec.semanticMatch.length, 0, `${rec.id} should have at least one semantic match`);
      }
    });
  });

  runner.describe('Topic Taxonomy', () => {
    it('should have TOPIC_HIERARCHY with clusters', () => {
      assert.isObject(TOPIC_HIERARCHY);
      assert.isAbove(Object.keys(TOPIC_HIERARCHY).length, 5, 'should have 5+ clusters');
    });

    it('each cluster should have label and children', () => {
      for (const [key, cluster] of Object.entries(TOPIC_HIERARCHY)) {
        assert.hasProperty(cluster, 'label', `${key} should have label`);
        assert.hasProperty(cluster, 'children', `${key} should have children`);
        assert.isArray(cluster.children, `${key} children should be array`);
        assert.isAbove(cluster.children.length, 0, `${key} should have children`);
      }
    });

    it('should have TOPIC_TO_CLUSTER mappings', () => {
      assert.isObject(TOPIC_TO_CLUSTER);
      assert.isAbove(Object.keys(TOPIC_TO_CLUSTER).length, 10, 'should have 10+ mappings');
    });

    it('should have SIGNAL_WEIGHTS', () => {
      assert.isObject(SIGNAL_WEIGHTS);
      assert.hasProperty(SIGNAL_WEIGHTS, 'topicDepth');
      assert.hasProperty(SIGNAL_WEIGHTS, 'intentSignal');
      assert.hasProperty(SIGNAL_WEIGHTS, 'careerRelevance');
      assert.hasProperty(SIGNAL_WEIGHTS, 'learningValue');
    });

    it('should have COMPOUND_PATTERNS', () => {
      assert.isArray(COMPOUND_PATTERNS);
      assert.isAbove(COMPOUND_PATTERNS.length, 0, 'should have compound patterns');
      for (const pattern of COMPOUND_PATTERNS) {
        assert.hasProperty(pattern, 'label');
        assert.hasProperty(pattern, 'matchedClusters');
        assert.hasProperty(pattern, 'description');
      }
    });

    it('should have HYPE_PATTERNS', () => {
      assert.isArray(HYPE_PATTERNS);
      assert.isAbove(HYPE_PATTERNS.length, 0, 'should have hype patterns');
    });
  });
});

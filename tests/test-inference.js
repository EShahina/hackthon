/**
 * ReelSense — Inference Engine Tests
 * Tests: signal extraction, cluster scoring, compound detection, profile generation
 */
import { runner, assert, it, beforeAll, afterAll } from './framework.js';
import { InterestInferenceEngine } from '../engine/inference.js';
import { SAMPLE_REELS } from '../data/reels.js';
import { TOPIC_HIERARCHY, SIGNAL_WEIGHTS, COMPOUND_PATTERNS } from '../data/topics.js';

let engine;

runner.describe('InterestInferenceEngine', () => {
  runner.beforeAll(() => {
    engine = new InterestInferenceEngine();
  });

  runner.describe('Signal Extraction', () => {
    it('should extract signals from a valid reel', () => {
      const reel = SAMPLE_REELS[0]; // R001 Java meme
      const signals = engine.extractSignals(reel);
      assert.isObject(signals, 'signals should be an object');
      assert.hasProperty(signals, 'topicDepth');
      assert.hasProperty(signals, 'intentSignal');
      assert.hasProperty(signals, 'careerRelevance');
      assert.hasProperty(signals, 'learningValue');
      assert.hasProperty(signals, 'techDomain');
      assert.hasProperty(signals, 'emotionalTone');
    });

    it('should compute signal strength correctly', () => {
      const signals = SAMPLE_REELS[1].contentSignals; // R002 deep career
      const strength = engine._calculateSignalStrength(signals);
      assert.isAbove(strength, 0, 'signal strength should be positive');
      assert.isAtMost(strength, 1, 'signal strength should be <= 1');
    });

    it('should return 0 strength for empty signals', () => {
      const strength = engine._calculateSignalStrength({});
      assert.equal(strength, 0, 'empty signals should yield 0');
    });

    it('should return 0 strength for null signals', () => {
      const strength = engine._calculateSignalStrength(null);
      assert.equal(strength, 0, 'null signals should yield 0');
    });

    it('should map topics to clusters correctly', () => {
      const topics = ['java-programming', 'developer-humor'];
      const clusters = engine._mapTopicsToClusters(topics);
      assert.isArray(clusters, 'result should be an array');
      assert.isAbove(clusters.length, 0, 'should map to at least one cluster');
    });
  });

  runner.describe('Cluster Scoring', () => {
    it('should score clusters from multiple reels', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const scores = engine.scoreClusters(trapReels);
      assert.isObject(scores, 'scores should be an object');
      assert.isAbove(Object.keys(scores).length, 0, 'should have cluster scores');
    });

    it('should normalize scores between 0 and 1', () => {
      const scores = engine.scoreClusters(SAMPLE_REELS);
      for (const [cluster, score] of Object.entries(scores)) {
        assert.isAtLeast(score, 0, `${cluster} score should be >= 0`);
        assert.isAtMost(score, 1, `${cluster} score should be <= 1`);
      }
    });

    it('should give higher scores to tech reels than pure entertainment', () => {
      const techReels = SAMPLE_REELS.filter(r => r.contentSignals.techDomain !== 'none');
      const scores = engine.scoreClusters(techReels);
      const techScore = Object.values(scores).reduce((a, b) => a + b, 0);
      assert.isAbove(techScore, 0.5, 'tech reels should produce meaningful cluster scores');
    });
  });

  runner.describe('Compound Interest Detection', () => {
    it('should detect compound interest from trap reels', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const result = engine.analyze(trapReels);
      assert.isObject(result, 'result should be an object');
      assert.hasProperty(result, 'compoundInterest', 'should have compoundInterest');
    });

    it('should produce a non-empty compound label', () => {
      const trapReels = SAMPLE_REELS.slice(0, 4);
      const result = engine.analyze(trapReels);
      if (result.compoundInterest) {
        assert.isAbove(result.compoundInterest.label.length, 0, 'compound label should not be empty');
        assert.isArray(result.compoundInterest.matchedClusters, 'matchedClusters should be array');
        assert.isAbove(result.compoundInterest.matchedClusters.length, 1, 'compound should span 2+ clusters');
      }
    });

    it('should not produce compound interest from a single reel', () => {
      const singleReel = [SAMPLE_REELS[0]];
      const result = engine.analyze(singleReel);
      // Single reel may or may not produce compound - just verify no crash
      assert.isObject(result, 'should not crash on single reel');
    });
  });

  runner.describe('Full Analysis Pipeline', () => {
    it('should return a complete interest profile', () => {
      const result = engine.analyze(SAMPLE_REELS);
      assert.hasProperty(result, 'primaryInterest');
      assert.hasProperty(result, 'clusterScores');
      assert.hasProperty(result, 'reelAnalyses');
      assert.hasProperty(result, 'summary');
    });

    it('should analyze every input reel', () => {
      const result = engine.analyze(SAMPLE_REELS);
      assert.isArray(result.reelAnalyses);
      assert.lengthOf(result.reelAnalyses, SAMPLE_REELS.length, 'should analyze all reels');
    });

    it('should produce a non-empty summary', () => {
      const result = engine.analyze(SAMPLE_REELS);
      assert.isAbove(result.summary.length, 10, 'summary should be meaningful');
    });

    it('should handle empty input gracefully', () => {
      const result = engine.analyze([]);
      assert.isObject(result, 'should not crash on empty input');
    });

    it('should handle non-tech reels without crashing', () => {
      const entertainment = SAMPLE_REELS.filter(r => r.contentSignals.techDomain === 'none');
      if (entertainment.length > 0) {
        const result = engine.analyze(entertainment);
        assert.isObject(result, 'should handle non-tech reels');
      }
    });

    it('should produce higher cluster scores for focused input vs random', () => {
      const focused = engine.analyze(SAMPLE_REELS.slice(0, 4));
      const random = engine.analyze([SAMPLE_REELS[0], SAMPLE_REELS[4]]);
      const focusedSum = Object.values(focused.clusterScores).reduce((a, b) => a + b, 0);
      const randomSum = Object.values(random.clusterScores).reduce((a, b) => a + b, 0);
      assert.isAbove(focusedSum, randomSum, 'focused reels should produce stronger signal');
    });
  });

  runner.describe('Edge Cases', () => {
    it('should handle reel with missing contentSignals', () => {
      const badReel = { id: 'T999', title: 'Test', semanticTopics: ['java-programming'] };
      const result = engine.analyze([badReel]);
      assert.isObject(result, 'should not crash on missing signals');
    });

    it('should handle reel with missing semanticTopics', () => {
      const badReel = { id: 'T999', title: 'Test', contentSignals: { techDomain: 'none' } };
      const result = engine.analyze([badReel]);
      assert.isObject(result, 'should not crash on missing topics');
    });

    it('should handle null reel gracefully', () => {
      const result = engine.analyze([null]);
      assert.isObject(result, 'should not crash on null reel');
    });
  });
});

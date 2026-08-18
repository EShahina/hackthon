/**
 * ReelMind — Recommendation Engine
 * 
 * Takes the interest profile from the inference engine and
 * recommends engaging tech Reels from the recommendation pool.
 * 
 * KEY FEATURES:
 * - Semantic similarity scoring (not keyword matching)
 * - Hype/clickbait content filtering
 * - Diversity penalty to avoid category clustering
 * - Compound interest awareness
 * - Structured output in required format
 */

import { RECOMMENDATION_POOL } from '../data/reels.js';
import { HYPE_PATTERNS, TOPIC_HIERARCHY, CATEGORY_META, DIFFICULTY_META } from '../data/topics.js';

export class RecommendationEngine {
  constructor() {
    this.recommendations = [];
  }

  /**
   * Main entry point: generate recommendations based on interest profile
   * @param {Object} profile - Interest profile from InferenceEngine
   * @param {Array} watchedReels - Reels already watched (to provide context)
   * @param {number} maxRecommendations - Max number of recommendations to return
   * @returns {Array} Structured recommendations
   */
  recommend(profile, watchedReels, maxRecommendations = 5) {
    this.recommendations = [];

    if (!profile || !profile.primaryInterest) {
      console.warn('[Recommender] No profile or primaryInterest', profile);
      return [];
    }

    // Step 1: Filter out hype/clickbait content
    const qualityPool = this._filterHype(RECOMMENDATION_POOL);
    console.log('[Recommender] Quality pool size:', qualityPool.length);

    // Step 2: Score each candidate against the interest profile
    const scored = qualityPool.map(candidate => ({
      candidate,
      score: this._scoreCandidate(candidate, profile),
      matchDetails: this._getMatchDetails(candidate, profile)
    }));

    // Debug: log top scores
    const topScored = [...scored].sort((a, b) => b.score - a.score).slice(0, 10);
    console.log('[Recommender] Top scores:', topScored.map(s => ({ title: s.candidate.title, score: s.score.toFixed(3), category: s.candidate.category })));

    // Step 3: Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Apply diversity — don't recommend all from same category
    const diversified = this._applyDiversity(scored, maxRecommendations);
    console.log('[Recommender] Diversified:', diversified.map(d => ({ title: d.candidate.title, score: d.score.toFixed(3) })));

    // Step 5: Generate structured output for each recommendation
    this.recommendations = diversified.map((item, index) =>
      this._formatRecommendation(item, profile, watchedReels, index)
    );

    return this.recommendations;
  }

  /**
   * Filter out hype/clickbait content
   */
  _filterHype(pool) {
    return pool.filter(reel => {
      // Explicit hype flag
      if (reel.isHype) return false;

      // Quality score threshold
      if (reel.qualityScore < 0.5) return false;

      // Pattern-based detection
      const fullText = `${reel.title} ${reel.description}`;
      for (const pattern of HYPE_PATTERNS) {
        if (pattern.test(fullText)) return false;
      }

      return true;
    });
  }

  /**
   * Score a candidate Reel against the interest profile
   * Uses cosine-similarity-like approach over semantic topic vectors
   */
  _scoreCandidate(candidate, profile) {
    let score = 0;

    // 1. Semantic topic overlap (primary scoring mechanism)
    const candidateTopics = new Set(candidate.semanticMatch || []);
    const profileTopics = Object.keys(profile.topicScores);

    for (const topic of profileTopics) {
      if (candidateTopics.has(topic)) {
        // Direct match — weighted by how strong the profile signal is
        score += profile.topicScores[topic].score * 0.8;
      }
    }

    // 2. Cluster-level matching (broader interest alignment)
    if (profile.allClusters) {
      for (const cluster of profile.allClusters) {
        const clusterTopics = cluster.topics || [];
        const overlap = clusterTopics.filter(t => candidateTopics.has(t)).length;
        if (overlap > 0) {
          score += cluster.score * 0.3 * (overlap / clusterTopics.length);
        }
      }
    }

    // 3. Compound interest bonus (trap handling)
    if (profile.compoundInterest) {
      const compoundTopics = new Set(profile.compoundInterest.inferredInterests);
      const compoundOverlap = [...candidateTopics].filter(t => compoundTopics.has(t)).length;
      if (compoundOverlap > 0) {
        score += compoundOverlap * 0.5;

        // Apply recommendation bias from compound pattern
        const bias = profile.compoundInterest.recommendationBias;
        if (bias && bias[candidate.category]) {
          score *= (1 + bias[candidate.category]);
        }
      }
    }

    // 4. Quality score factor
    score *= (candidate.qualityScore || 0.5);

    return score;
  }

  /**
   * Get detailed match information for a candidate
   */
  _getMatchDetails(candidate, profile) {
    const candidateTopics = new Set(candidate.semanticMatch || []);
    const matchedTopics = [];
    const matchedClusters = [];

    // Find overlapping topics
    for (const [topic, data] of Object.entries(profile.topicScores)) {
      if (candidateTopics.has(topic)) {
        matchedTopics.push({ topic, score: data.score });
      }
    }

    // Find overlapping clusters
    for (const cluster of (profile.allClusters || [])) {
      const clusterTopics = cluster.topics || [];
      if (clusterTopics.some(t => candidateTopics.has(t))) {
        matchedClusters.push(cluster.label);
      }
    }

    // Check compound interest connection
    let compoundConnection = null;
    if (profile.compoundInterest) {
      const compoundTopics = new Set(profile.compoundInterest.inferredInterests);
      const overlap = [...candidateTopics].filter(t => compoundTopics.has(t));
      if (overlap.length > 0) {
        compoundConnection = {
          pattern: profile.compoundInterest.label,
          overlappingInterests: overlap
        };
      }
    }

    return { matchedTopics, matchedClusters, compoundConnection };
  }

  /**
   * Apply diversity to avoid recommending all from the same category
   */
  _applyDiversity(scored, max) {
    const selected = [];
    const categoryCounts = {};

    for (const item of scored) {
      const cat = item.candidate.category;
      const currentCount = categoryCounts[cat] || 0;

      // Diversity: penalize 2nd+ picks from the same category
      if (currentCount >= 1) {
        item.score *= 0.5;
      }

      selected.push(item);
      categoryCounts[cat] = currentCount + 1;

      if (selected.length >= max * 2) break; // Get enough candidates
    }

    // Re-sort after diversity penalty and take top N
    selected.sort((a, b) => b.score - a.score);
    return selected.slice(0, max);
  }

  /**
   * Format a recommendation in the required structured output format
   */
  _formatRecommendation(item, profile, watchedReels, index) {
    const { candidate, score, matchDetails } = item;

    // Determine confidence based on score and match quality
    let confidence = 'Low';
    if (score > 1.5 && matchDetails.matchedTopics.length >= 2) {
      confidence = 'High';
    } else if (score > 0.8 || matchDetails.matchedTopics.length >= 1) {
      confidence = 'Medium';
    }

    // Build rich "WHY THIS RECOMMENDATION" explanation
    let whyRecommendation = '';
    if (matchDetails.compoundConnection) {
      whyRecommendation += `Connects the student's "${matchDetails.compoundConnection.pattern}" interest pattern `;
      whyRecommendation += `to a concrete, real-world topic. `;
      whyRecommendation += `Overlapping signals: ${matchDetails.compoundConnection.overlappingInterests
        .map(t => t.replace(/-/g, ' '))
        .join(', ')}. `;
    }
    if (matchDetails.matchedClusters.length > 0) {
      const clusterLabels = matchDetails.matchedClusters.map(c => TOPIC_HIERARCHY[c]?.label || c);
      whyRecommendation += `Bridges interest clusters: ${clusterLabels.join(', ')}. `;
    }
    if (matchDetails.matchedTopics.length > 0) {
      const topicLabels = matchDetails.matchedTopics.slice(0, 3).map(t => t.topic.replace(/-/g, ' '));
      whyRecommendation += `Topic alignment: ${topicLabels.join(', ')}. `;
    }

    if (!whyRecommendation) {
      whyRecommendation = 'Broadens tech awareness based on general interest signals and engagement patterns.';
    }

    // Find the most relevant watched Reel for this recommendation
    const mostRelevantReel = this._findMostRelevantSource(candidate, watchedReels, profile);

    // Build the interest detected string
    let interestDetected = profile.primaryInterest?.label || 'Technology';
    if (profile.compoundInterest) {
      interestDetected = profile.compoundInterest.label;
    }

    return {
      index: index + 1,
      currentReel: mostRelevantReel ? mostRelevantReel.title : 'Multiple viewed Reels',
      currentReelObj: mostRelevantReel,
      interestDetected,
      why: this._buildEvidenceString(mostRelevantReel, profile, watchedReels),
      recommendedReel: `${candidate.title}`,
      recommendedReelObj: candidate,
      category: candidate.category,
      categoryMeta: CATEGORY_META[candidate.category] || CATEGORY_META['Other'],
      whyThisRecommendation: whyRecommendation.trim(),
      difficulty: candidate.difficulty,
      difficultyMeta: DIFFICULTY_META[candidate.difficulty] || DIFFICULTY_META['Beginner'],
      confidence,
      score: score.toFixed(3),
      matchDetails
    };
  }

  /**
   * Find the watched Reel most relevant to a recommendation
   */
  _findMostRelevantSource(candidate, watchedReels, profile) {
    const candidateTopics = new Set(candidate.semanticMatch || []);
    let bestReel = null;
    let bestOverlap = 0;

    for (const reel of watchedReels) {
      const reelTopics = reel.semanticTopics || [];
      const overlap = reelTopics.filter(t => candidateTopics.has(t)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestReel = reel;
      }
    }

    return bestReel || watchedReels[0];
  }

  /**
   * Build evidence string for why an interest was detected
   */
  _buildEvidenceString(reel, profile, watchedReels) {
    if (!reel) return 'Based on overall viewing pattern analysis.';

    const parts = [];
    const signals = reel.contentSignals || {};

    if (signals.emotionalTone === 'humor' && signals.techDomain !== 'none') {
      parts.push(`The student engaged with humor around ${signals.techDomain.replace(/-/g, ' ')} concepts`);
    } else if (signals.techDomain && signals.techDomain !== 'none') {
      parts.push(`The student engaged with ${signals.techDomain.replace(/-/g, ' ')} content`);
    }

    if (signals.topicDepth === 'deep') {
      parts.push(`demonstrating in-depth interest in the domain`);
    }
    if (signals.careerRelevance === 'direct') {
      parts.push(`with direct career relevance`);
    }
    if (signals.emotionalTone === 'aspirational') {
      parts.push(`reflecting aspirational career goals`);
    }
    if (signals.emotionalTone === 'informative') {
      parts.push(`showing learning-oriented engagement`);
    }
    if (signals.emotionalTone === 'motivational') {
      parts.push(`aligned with professional development goals`);
    }

    // Add compound interest evidence
    if (profile.compoundInterest) {
      const clusterLabels = profile.compoundInterest.matchedClusters
        .map(c => TOPIC_HIERARCHY[c]?.label || c);
      parts.push(
        `part of a broader pattern across ${clusterLabels.length} interest areas (${clusterLabels.join(', ')})`
      );
    }

    // If multiple reels selected, reference the broader pattern
    if (watchedReels && watchedReels.length > 2) {
      const techReels = watchedReels.filter(r => r.contentSignals?.techDomain !== 'none');
      if (techReels.length >= 2) {
        const reelTitles = techReels.slice(0, 3).map(r => r.title);
        parts.push(
          `reflected across multiple Reels: ${reelTitles.join('; ')}`
        );
      }
    }

    if (parts.length === 0) return 'Based on overall viewing pattern analysis.';

    let result = parts.join(', ');
    result = result.charAt(0).toUpperCase() + result.slice(1);
    if (!result.endsWith('.')) result += '.';
    return result;
  }
}

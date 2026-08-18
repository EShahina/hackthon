/**
 * ReelMind — Student Profile Builder
 * Builds comprehensive student profiles from inference + tracker data.
 * Includes trajectory, readiness scores, and next steps.
 */

import { TOPIC_HIERARCHY, CATEGORY_META, DIFFICULTY_META } from '../data/topics.js';

export class StudentProfileBuilder {
  /**
   * Build a complete student profile
   */
  static build(inferenceResult, trackerStats, recommendations) {
    const primary = inferenceResult.primaryInterest;
    const compound = inferenceResult.compoundInterest;
    const clusters = inferenceResult.clusterScores;

    return {
      primaryInterest: primary,
      compoundInterest: compound,
      overallConfidence: inferenceResult.overallConfidence,
      trajectory: this._computeTrajectory(primary, compound, clusters),
      readinessScores: this._computeReadiness(clusters, trackerStats),
      learningStyle: this._inferLearningStyle(trackerStats),
      nextSteps: this._suggestNextSteps(primary, compound, recommendations),
      summary: this._buildSummary(primary, compound, trackerStats),
      metrics: trackerStats,
      categoryBreakdown: this._buildCategoryBreakdown(clusters),
    };
  }

  /**
   * Compute learning trajectory string
   */
  static _computeTrajectory(primary, compound, clusters) {
    if (compound) {
      return compound.label;
    }
    if (primary) {
      const topClusters = Object.entries(clusters)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 2)
        .map(([key]) => TOPIC_HIERARCHY[key]?.label || key);

      if (topClusters.length >= 2) {
        return topClusters.join(' & ') + ' Mastery';
      }
      return (primary.label || primary.cluster || 'Technology') + ' Proficiency';
    }
    return 'Exploring Technology Landscape';
  }

  /**
   * Compute readiness scores per category (0-100)
   */
  static _computeReadiness(clusters, stats) {
    const scores = {};
    for (const [key, data] of Object.entries(clusters)) {
      const label = TOPIC_HIERARCHY[key]?.label || key;
      scores[label] = Math.round(data.score * 100);
    }
    return scores;
  }

  /**
   * Infer learning style from behavioral data
   */
  static _inferLearningStyle(stats) {
    if (!stats) return 'Explorer';

    if (stats.saves > stats.likes && stats.replays > 0) return 'Deep Learner';
    if (stats.shares > stats.likes) return 'Social Learner';
    if (stats.skips === 0 && stats.totalWatchTimeSec > 120) return 'Patient Observer';
    if (stats.replays > 2) return 'Visual Repeater';
    if (stats.likes > stats.saves) return 'Casual Browser';
    return 'Explorer';
  }

  /**
   * Suggest next steps based on interests and recommendations
   */
  static _suggestNextSteps(primary, compound, recommendations) {
    const steps = [];

    if (compound) {
      steps.push({
        type: 'path',
        label: 'Follow ' + compound.label + ' path',
        description: compound.description || 'Your interests span multiple areas',
      });
    }

    if (primary) {
      steps.push({
        type: 'category',
        label: 'Deep dive: ' + (primary.label || 'core skills'),
        description: 'Focus on strengthening fundamentals',
      });
    }

    if (recommendations && recommendations.length > 0) {
      const topRec = recommendations[0];
      steps.push({
        type: 'recommendation',
        label: 'Try: ' + (topRec.recommendedReel || topRec.title || 'Recommended content'),
        description: topRec.whyThisRecommendation || 'Top match for your interests',
      });

      if (recommendations.length > 1) {
        const midRec = recommendations[Math.min(1, recommendations.length - 1)];
        steps.push({
          type: 'explore',
          label: 'Explore: ' + (midRec.recommendedReel || midRec.title || 'More content'),
          description: midRec.whyThisRecommendation || 'Broaden your horizons',
        });
      }
    }

    steps.push({
      type: 'general',
      label: 'Review analytics',
      description: 'Check your engagement patterns for insights',
    });

    return steps;
  }

  /**
   * Build a human-readable summary
   */
  static _buildSummary(primary, compound, stats) {
    let parts = [];

    if (compound) {
      parts.push('Your viewing patterns reveal a compound interest in ' + compound.label);
    } else if (primary) {
      parts.push('Your primary interest is in ' + (primary.label || primary.cluster || 'technology'));
    }

    if (stats) {
      if (stats.engagementScore > 70) {
        parts.push('with high engagement (' + stats.engagementScore + '%)');
      } else if (stats.engagementScore > 40) {
        parts.push('with moderate engagement');
      }

      if (stats.replays > 2) {
        parts.push('and a tendency to replay content for deeper understanding');
      }
      if (stats.saves > 2) {
        parts.push('with strong study intent');
      }
    }

    return parts.length > 0 ? parts.join(' ') + '.' : 'Analyzing your viewing patterns...';
  }

  /**
   * Build category breakdown for visualization
   */
  static _buildCategoryBreakdown(clusters) {
    return Object.entries(clusters).map(([key, data]) => ({
      category: TOPIC_HIERARCHY[key]?.label || key,
      score: Math.round(data.score * 100),
      topics: (data.topics || []).slice(0, 3),
      evidence: (data.evidence || []).slice(0, 2),
    })).sort((a, b) => b.score - a.score);
  }
}

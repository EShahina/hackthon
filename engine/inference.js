/**
 * ReelMind — Interest Inference Engine
 * 
 * Analyzes watched Reels to extract semantic interest signals,
 * builds a weighted interest profile, and detects compound interests.
 * 
 * KEY CAPABILITY: Detects that Java meme + SWE lifestyle + interview joke + laptop comparison
 * = broader "software engineering career" interest, NOT just "Java"
 * 
 * PIPELINE: Reels → Signal Extraction → Cluster Aggregation → Compound Pattern Detection → Profile
 */

import { TOPIC_HIERARCHY, TOPIC_TO_CLUSTER, SIGNAL_WEIGHTS, COMPOUND_PATTERNS } from '../data/topics.js';

export class InterestInferenceEngine {
  constructor() {
    this.watchedReels = [];           // Input: selected Reel objects
    this.topicScores = {};            // Aggregated: topic → {score, sources, evidence}
    this.clusterScores = {};          // Derived: cluster → {score, topics, evidence, breadthBonus}
    this.intentSignals = {};          // Tracked: intentSignal → {count, reels[]}
    this.detectedPatterns = [];       // Output: matched COMPOUND_PATTERNS with confidence
    this.interestProfile = null;      // Final structured profile for recommender
  }

  /**
   * Main entry point: analyze a set of watched Reels
   * @param {Array} reels - Array of Reel objects the student watched
   * @returns {Object} Complete interest analysis with primaryInterest, clusters, compoundInterest, etc.
   */
  analyze(reels) {
    this.reset();
    this.watchedReels = reels;

    // Phase 1: Extract raw signals from each Reel (topic scores + intent signals)
    for (const reel of reels) {
      this._extractSignals(reel);
    }

    // Phase 2: Aggregate topic scores into cluster-level scores
    // This maps specific topics (e.g., 'java-programming') to broader clusters (e.g., 'software-engineering')
    this._aggregateClusters();

    // Phase 3: Detect compound interest patterns (TRAP DETECTION)
    // e.g., Java meme + SWE lifestyle + interview joke + laptop review → "Software Engineering Career Path"
    this._detectCompoundPatterns();

    // Phase 4: Build the final interest profile for the recommender
    this.interestProfile = this._buildProfile();

    console.log('[Inference] Profile:', {
      primaryInterest: this.interestProfile.primaryInterest?.label,
      compoundInterest: this.interestProfile.compoundInterest?.label,
      topicScoresCount: Object.keys(this.interestProfile.topicScores).length,
      allClusters: this.interestProfile.allClusters.map(c => ({ label: c.label, score: c.score.toFixed(2) })),
      intentSignals: this.interestProfile.intentSignals,
      detectedPatterns: this.interestProfile.detectedPatterns.map(p => ({ label: p.label, confidence: p.confidence.toFixed(2) }))
    });

    return this.interestProfile;
  }

  /**
   * Phase 1: Extract semantic signals from a single Reel
   */
  _extractSignals(reel) {
    const signals = reel.contentSignals;
    if (!signals) return;

    // Combined signal strength for this Reel
    const signalStrength = this._calculateSignalStrength(signals);

    // Score each semantic topic from this Reel
    for (const topic of (reel.semanticTopics || [])) {
      if (!this.topicScores[topic]) {
        this.topicScores[topic] = { score: 0, sources: [], evidence: [] };
      }
      this.topicScores[topic].score += signalStrength;
      this.topicScores[topic].sources.push(reel.id);
      this.topicScores[topic].evidence.push({
        reelId: reel.id,
        reelTitle: reel.title,
        strength: signalStrength,
        signals: { ...signals }
      });
    }

    // Track intent signals
    if (signals.intentSignal) {
      if (!this.intentSignals[signals.intentSignal]) {
        this.intentSignals[signals.intentSignal] = { count: 0, reels: [] };
      }
      this.intentSignals[signals.intentSignal].count++;
      this.intentSignals[signals.intentSignal].reels.push(reel.id);
    }
  }

  /**
   * Phase 2: Aggregate topic scores into cluster-level scores
   * This is where "Java meme" becomes part of "software-engineering" cluster
   */
  _aggregateClusters() {
    for (const [topic, data] of Object.entries(this.topicScores)) {
      const clusters = TOPIC_TO_CLUSTER[topic] || [];
      for (const clusterId of clusters) {
        if (!this.clusterScores[clusterId]) {
          this.clusterScores[clusterId] = {
            score: 0,
            topics: [],
            topicCount: 0,
            evidence: []
          };
        }
        this.clusterScores[clusterId].score += data.score;
        this.clusterScores[clusterId].topics.push(topic);
        this.clusterScores[clusterId].topicCount++;
        this.clusterScores[clusterId].evidence.push(...data.evidence);
      }
    }

    // Bonus for breadth: if a cluster has topics from multiple Reels, boost it
    for (const [clusterId, data] of Object.entries(this.clusterScores)) {
      const uniqueSources = new Set(data.evidence.map(e => e.reelId));
      if (uniqueSources.size >= 2) {
        // Breadth bonus: indicates consistent interest, not just one-off
        data.score *= (1 + 0.15 * (uniqueSources.size - 1));
        data.breadthBonus = true;
        data.uniqueSourceCount = uniqueSources.size;
      }
    }
  }

  /**
   * Phase 3: Detect compound interest patterns
   * THIS IS THE CORE TRAP DETECTION LOGIC
   */
  _detectCompoundPatterns() {
    for (const pattern of COMPOUND_PATTERNS) {
      const { requiredSignals } = pattern;

      // Check cluster presence
      const matchedClusters = requiredSignals.clusters.filter(
        c => this.clusterScores[c] && this.clusterScores[c].score > 0
      );

      // Check career signal presence
      const matchedCareerSignals = requiredSignals.careerSignals.filter(
        s => this.intentSignals[s] && this.intentSignals[s].count > 0
      );

      // Pattern matches if enough clusters AND career signals present
      const clusterMatch = matchedClusters.length >= requiredSignals.minClusters;
      const careerMatch = matchedCareerSignals.length >= requiredSignals.minCareerSignals;

      if (clusterMatch && careerMatch) {
        // Calculate pattern confidence
        const clusterConfidence = matchedClusters.length / requiredSignals.clusters.length;
        const totalEvidence = matchedClusters.reduce(
          (sum, c) => sum + (this.clusterScores[c]?.evidence?.length || 0), 0
        );

        this.detectedPatterns.push({
          ...pattern,
          matchedClusters,
          matchedCareerSignals,
          confidence: Math.min(clusterConfidence + (totalEvidence * 0.05), 1.0),
          evidenceCount: totalEvidence
        });
      }
    }

    // Sort patterns by confidence
    this.detectedPatterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Phase 4: Build final interest profile
   */
  _buildProfile() {
    // Rank clusters by score
    const rankedClusters = Object.entries(this.clusterScores)
      .filter(([id]) => id !== 'non-tech')
      .map(([id, data]) => ({
        clusterId: id,
        label: TOPIC_HIERARCHY[id]?.label || id,
        ...data
      }))
      .sort((a, b) => b.score - a.score);

    // Determine primary and secondary interests
    const primaryInterest = rankedClusters[0] || null;
    const secondaryInterests = rankedClusters.slice(1, 3);

    // Determine overall confidence
    let overallConfidence = 'Low';
    if (primaryInterest) {
      if (primaryInterest.score > 1.5 && primaryInterest.uniqueSourceCount >= 2) {
        overallConfidence = 'High';
      } else if (primaryInterest.score > 0.8) {
        overallConfidence = 'Medium';
      }
    }

    // Build per-Reel analysis
    const reelAnalyses = this.watchedReels.map(reel => this._analyzeReel(reel));

    // Check if compound pattern was detected (trap handling)
    const compoundInterest = this.detectedPatterns.length > 0 ? this.detectedPatterns[0] : null;

    return {
      primaryInterest,
      secondaryInterests,
      compoundInterest,
      allClusters: rankedClusters,
      topicScores: this.topicScores,
      intentSignals: this.intentSignals,
      detectedPatterns: this.detectedPatterns,
      reelAnalyses,
      overallConfidence,
      summary: this._generateSummary(primaryInterest, compoundInterest, rankedClusters)
    };
  }

  /**
   * Generate per-Reel analysis with interest detection and evidence
   */
  _analyzeReel(reel) {
    const signals = reel.contentSignals || {};
    const topics = reel.semanticTopics || [];

    // Find which clusters this Reel contributes to
    const contributedClusters = new Set();
    for (const topic of topics) {
      const clusters = TOPIC_TO_CLUSTER[topic] || [];
      clusters.forEach(c => contributedClusters.add(c));
    }

    // Generate human-readable interest detection
    let interestDetected = 'General Entertainment';
    let why = 'No strong tech interest signals detected.';

    if (signals.techDomain && signals.techDomain !== 'none') {
      const clusterLabels = [...contributedClusters]
        .filter(c => c !== 'non-tech')
        .map(c => TOPIC_HIERARCHY[c]?.label || c);

      if (clusterLabels.length > 0) {
        interestDetected = clusterLabels.join(' & ');
      }

      // Build rich evidence string
      const evidenceParts = [];
      const topicNames = topics.map(t => t.replace(/-/g, ' '));

      if (signals.emotionalTone === 'humor' && signals.techDomain !== 'none') {
        evidenceParts.push(`engagement through humor around ${signals.techDomain.replace(/-/g, ' ')} concepts (${topicNames.slice(0, 2).join(', ')})`);
      }
      if (signals.intentSignal === 'career-exploration' || signals.intentSignal === 'career-planning') {
        evidenceParts.push(`active career exploration signals (${signals.intentSignal.replace(/-/g, ' ')})`);
      }
      if (signals.intentSignal === 'interview-awareness') {
        evidenceParts.push(`interview preparation awareness across DSA and hiring signals`);
      }
      if (signals.intentSignal === 'learning') {
        evidenceParts.push(`learning-oriented content consumption`);
      }
      if (signals.intentSignal === 'purchase-research') {
        evidenceParts.push(`developer tooling research and purchase intent`);
      }
      if (signals.careerRelevance === 'direct') {
        evidenceParts.push('directly career-relevant content');
      }
      if (signals.topicDepth === 'deep') {
        evidenceParts.push('in-depth technical content showing sustained interest');
      }
      if (signals.topicDepth === 'moderate') {
        evidenceParts.push('moderate technical depth suggesting developing interest');
      }
      if (signals.emotionalTone === 'aspirational') {
        evidenceParts.push('aspirational tone indicating career goal alignment');
      }
      if (signals.emotionalTone === 'informative') {
        evidenceParts.push('informational content demonstrating learning engagement');
      }
      if (signals.emotionalTone === 'motivational') {
        evidenceParts.push('motivational content aligned with professional growth');
      }
      if (signals.learningValue === 'high') {
        evidenceParts.push('high learning value content');
      }

      if (evidenceParts.length > 0) {
        why = evidenceParts.join('; ') + '.';
        why = why.charAt(0).toUpperCase() + why.slice(1);
      }
    }

    return {
      reel,
      interestDetected,
      why,
      contributedClusters: [...contributedClusters],
      signalStrength: this._calculateSignalStrength(signals)
    };
  }

  _calculateSignalStrength(signals) {
    if (!signals) return 0;
    const depthWeight = SIGNAL_WEIGHTS.topicDepth[signals.topicDepth] || 0;
    const intentWeight = SIGNAL_WEIGHTS.intentSignal[signals.intentSignal] || 0;
    const careerWeight = SIGNAL_WEIGHTS.careerRelevance[signals.careerRelevance] || 0;
    const learningWeight = SIGNAL_WEIGHTS.learningValue[signals.learningValue] || 0;
    return (depthWeight * 0.25 + intentWeight * 0.3 + careerWeight * 0.25 + learningWeight * 0.2);
  }

  /**
   * Generate human-readable summary of the analysis
   */
  _generateSummary(primary, compound, clusters) {
    if (!primary) {
      return 'Not enough data to infer interests. Watch more Reels!';
    }

    let summary = '';

    if (compound) {
      summary = `🎯 Compound interest detected: "${compound.label}". `;
      summary += `Based on signals across ${compound.matchedClusters.length} interest cluster${compound.matchedClusters.length === 1 ? '' : 's'} `;
      summary += `(${compound.matchedClusters.map(c => TOPIC_HIERARCHY[c]?.label).join(', ')}), `;
      summary += `${compound.description.charAt(0).toLowerCase()}${compound.description.slice(1)}. `;
      summary += `This is NOT a single-topic interest like "Java" — it's a broader career and learning pattern.`;
    } else {
      summary = `Primary interest: "${primary.label}" `;
      summary += `(score: ${primary.score.toFixed(2)}, `;
      summary += `from ${primary.topics.length} related topics across ${primary.uniqueSourceCount || 1} Reels). `;
      if (clusters.length > 1) {
        summary += `Secondary interests: ${clusters.slice(1).map(c => c.label).join(', ')}.`;
      }
    }

    return summary;
  }

  reset() {
    this.watchedReels = [];
    this.topicScores = {};
    this.clusterScores = {};
    this.intentSignals = {};
    this.detectedPatterns = [];
    this.interestProfile = null;
  }
}

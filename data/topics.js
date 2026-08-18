/**
 * ReelSense — Semantic Topic Taxonomy
 * 
 * Hierarchical topic relationships for deep interest inference.
 * Maps surface-level content signals (from Reel metadata) to broader interest clusters.
 * 
 * STRUCTURE:
 * - TOPIC_HIERARCHY: clusterId → {label, children[], relatedClusters[]}
 * - TOPIC_TO_CLUSTER: childTopic → clusterId[] (built at import time, O(1) lookup)
 * - SIGNAL_WEIGHTS: weights for contentSignals (topicDepth, intentSignal, careerRelevance, learningValue)
 * - COMPOUND_PATTERNS: multi-cluster patterns that infer broader interests (trap detection)
 * - HYPE_PATTERNS: regex patterns to filter clickbait/low-quality content
 * - CATEGORY_META / DIFFICULTY_META: display metadata for UI
 */

 /**
  * Topic hierarchy — maps specific topics to broader interest clusters.
  * Used for compound interest detection (the trap scenario).
  * 
  * Each cluster has:
  * - label: human-readable name
  * - children: specific topics that roll up to this cluster
  * - relatedClusters: other clusters that often co-occur (for broader matching)
  */
export const TOPIC_HIERARCHY = {
  // Top-level interest clusters
  'software-engineering': {
    label: 'Software Engineering',
    children: [
      'java-programming',
      'software-development',
      'coding-culture',
      'developer-humor',
      'software-engineering-career',
      'big-tech-culture',
      'work-life-balance'
    ],
    relatedClusters: ['computer-science', 'developer-productivity', 'career']
  },
  'computer-science': {
    label: 'Computer Science Fundamentals',
    children: [
      'data-structures',
      'algorithms',
      'interview-preparation',
      'tech-hiring'
    ],
    relatedClusters: ['software-engineering', 'career']
  },
  'artificial-intelligence': {
    label: 'Artificial Intelligence',
    children: [
      'large-language-models',
      'developer-tools-ai',
      'machine-learning'
    ],
    relatedClusters: ['computer-science', 'software-engineering']
  },
  'developer-productivity': {
    label: 'Developer Productivity & Tooling',
    children: [
      'developer-tooling',
      'hardware-for-coding',
      'productivity',
      'tech-gear'
    ],
    relatedClusters: ['software-engineering', 'hardware']
  },
  'career': {
    label: 'Tech Career',
    children: [
      'career-aspiration',
      'career-strategy',
      'professional-development',
      'job-market'
    ],
    relatedClusters: ['software-engineering', 'computer-science']
  },
  'cybersecurity': {
    label: 'Cybersecurity',
    children: [
      'ethical-hacking',
      'web-security',
      'network-security'
    ],
    relatedClusters: ['computer-science', 'software-engineering']
  },
  'hardware': {
    label: 'Hardware & Infrastructure',
    children: [
      'computer-architecture',
      'diy-projects',
      'networking'
    ],
    relatedClusters: ['developer-productivity', 'computer-science']
  },
  'non-tech': {
    label: 'Non-Technical',
    children: [
      'entertainment',
      'animals',
      'viral-content',
      'humor',
      'competitive-gaming',
      'esports',
      'fps-games'
    ],
    relatedClusters: []
  }
};

/**
 * Reverse map: child topic → parent cluster(s)
 * Built at import time for O(1) lookup
 */
export const TOPIC_TO_CLUSTER = {};
for (const [clusterId, cluster] of Object.entries(TOPIC_HIERARCHY)) {
  for (const child of cluster.children) {
    if (!TOPIC_TO_CLUSTER[child]) {
      TOPIC_TO_CLUSTER[child] = [];
    }
    TOPIC_TO_CLUSTER[child].push(clusterId);
  }
}

/**
 * Interest signal weights — how much each content signal contributes
 * to interest inference.
 */
export const SIGNAL_WEIGHTS = {
  topicDepth: {
    'deep': 1.0,
    'moderate': 0.7,
    'surface': 0.3,
    'none': 0.0
  },
  intentSignal: {
    'learning': 1.0,
    'career-planning': 0.9,
    'career-exploration': 0.8,
    'interview-awareness': 0.7,
    'purchase-research': 0.5,
    'entertainment': 0.1
  },
  careerRelevance: {
    'direct': 1.0,
    'indirect': 0.5,
    'none': 0.0
  },
  learningValue: {
    'high': 1.0,
    'moderate': 0.6,
    'low': 0.2,
    'none': 0.0
  }
};

/**
 * Compound interest patterns — when a student watches multiple
 * Reels matching these patterns, infer the compound interest.
 * 
 * THIS IS THE TRAP DETECTOR:
 * Watching Java meme + SWE lifestyle + interview joke + laptop comparison
 * → compound interest = "software-engineering-career" (not just "Java")
 */
export const COMPOUND_PATTERNS = [
  {
    id: 'swe-career-path',
    label: 'Software Engineering Career Path',
    description: 'Student is exploring a career in software engineering',
    requiredSignals: {
      // Need at least 2 of these topic clusters to be present
      minClusters: 2,
      clusters: ['software-engineering', 'computer-science', 'developer-productivity', 'career'],
      // Need at least 1 career-relevant signal
      minCareerSignals: 1,
      careerSignals: ['career-exploration', 'career-planning', 'interview-awareness']
    },
    inferredInterests: [
      'software-engineering-career',
      'career-aspiration',
      'professional-development',
      'interview-preparation',
      'developer-tooling'
    ],
    recommendationBias: {
      'Career': 0.25,
      'HLD': 0.25,
      'DSA': 0.2,
      'Other': 0.15,
      'Cloud': 0.15
    }
  },
  {
    id: 'ai-enthusiast',
    label: 'AI / ML Enthusiast',
    description: 'Student is interested in artificial intelligence and its applications',
    requiredSignals: {
      minClusters: 1,
      clusters: ['artificial-intelligence'],
      minCareerSignals: 0,
      careerSignals: []
    },
    inferredInterests: [
      'artificial-intelligence',
      'large-language-models',
      'machine-learning',
      'developer-tools-ai'
    ],
    recommendationBias: {
      'AI': 0.5,
      'DSA': 0.15,
      'Career': 0.15,
      'Cloud': 0.1,
      'Other': 0.1
    }
  },
  {
    id: 'security-curious',
    label: 'Cybersecurity Curious',
    description: 'Student shows interest in security and ethical hacking',
    requiredSignals: {
      minClusters: 1,
      clusters: ['cybersecurity'],
      minCareerSignals: 0,
      careerSignals: []
    },
    inferredInterests: [
      'cybersecurity',
      'ethical-hacking',
      'web-security'
    ],
    recommendationBias: {
      'Cybersecurity': 0.45,
      'Cloud': 0.2,
      'Career': 0.15,
      'Other': 0.1,
      'HLD': 0.1
    }
  }
];

/**
 * Hype / clickbait detection patterns
 * Used to filter out low-quality recommendations
 */
export const HYPE_PATTERNS = [
  /\d+\s*(ai|ml)\s*tools?\s*(that|which)\s*(will|can)/i,
  /guaranteed/i,
  /learn\s+\w+\s+in\s+\d+\s*(hours?|days?|minutes?)/i,
  /no\s*one\s*(talks?|knows?)\s*about/i,
  /secret\s*(roadmap|hack|trick)/i,
  /just\s*(mass\s*)?apply/i,
  /spam\s*applications/i,
  /get\s*(you\s*)?(a\s*)?(\w+\s*)?job\s*guaranteed/i,
  /\b(insane|crazy|mind[\s-]?blow(ing|n))\b.*\b(tools?|trick|hack)\b/i
];

/**
 * Category display metadata
 */
export const CATEGORY_META = {
  'AI': { icon: '🤖', color: '#a78bfa', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  'DSA': { icon: '🧩', color: '#34d399', gradient: 'linear-gradient(135deg, #059669, #34d399)' },
  'Java': { icon: '☕', color: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  'HLD': { icon: '🏗️', color: '#60a5fa', gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)' },
  'Cybersecurity': { icon: '🔒', color: '#f87171', gradient: 'linear-gradient(135deg, #dc2626, #f87171)' },
  'Cloud': { icon: '☁️', color: '#38bdf8', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
  'Hardware': { icon: '🔧', color: '#fb923c', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)' },
  'Career': { icon: '📈', color: '#c084fc', gradient: 'linear-gradient(135deg, #9333ea, #c084fc)' },
  'Other': { icon: '💡', color: '#fbbf24', gradient: 'linear-gradient(135deg, #ca8a04, #fbbf24)' }
};

/**
 * Difficulty display metadata
 */
export const DIFFICULTY_META = {
  'Beginner': { icon: '🟢', color: '#34d399' },
  'Intermediate': { icon: '🟡', color: '#fbbf24' },
  'Advanced': { icon: '🔴', color: '#f87171' }
};

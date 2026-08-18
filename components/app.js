/**
 * ReelMind — Main Application Controller
 * 
 * Orchestrates the UI flow:
 * 1. Display sample Reels for selection (shuffled on each load)
 * 2. Handle user selection (click/keyboard accessible)
 * 3. Run interest inference on selected Reels → InterestInferenceEngine
 * 4. Generate recommendations → RecommendationEngine
 * 5. Render analysis + recommendations with animations
 * 
 * AUTO-ANALYZE: Triggers 500ms after selection changes (debounced)
 * TRAP SCENARIO: Quick-select buttons for the 4 "trap" Reels (R001-R004)
 */

import { SAMPLE_REELS } from '../data/reels.js';
import { CATEGORY_META, DIFFICULTY_META } from '../data/topics.js';
import { InterestInferenceEngine } from '../engine/inference.js';
import { RecommendationEngine } from '../engine/recommender.js';
import { security } from '../engine/security.js';

class ReelMindApp {
  constructor() {
    this.selectedReels = new Set();           // Set of selected reel IDs
    this.inferenceEngine = new InterestInferenceEngine();  // Interest analysis engine
    this.recommender = new RecommendationEngine();         // Recommendation engine
    this.analysisResult = null;               // Output from inference engine
    this.recommendations = [];                // Output from recommender
    this.isAnalyzing = false;                 // Prevents concurrent analysis
    this.autoAnalyzeTimer = null;             // Debounce timer for auto-analyze
    this.analysisCache = new Map();           // Memoization cache for analysis results

    this.init();
  }

  /**
   * Initialize app: render feed, bind events, update UI
   */
  init() {
    this.renderReelsFeed();
    this.setupEventListeners();
    this.updateSelectionCount();
  }

  /**
   * Render the Reels feed panel with shuffled order for variety
   * Each card is clickable and keyboard accessible (Enter/Space)
   */
  renderReelsFeed() {
    const grid = document.getElementById('reels-grid');
    if (!grid) return;

    // Shuffle reels on each load for variety
    const shuffledReels = [...SAMPLE_REELS].sort(() => Math.random() - 0.5);

    grid.innerHTML = shuffledReels.map(reel => {
      const isYouTube = reel.videoUrl && reel.videoUrl.includes('youtube.com');
      const videoId = isYouTube ? reel.videoUrl.match(/(?:v=|\/)([\w-]{11})/)?.[1] : null;
      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

      return `
      <div class="reel-card" data-reel-id="${reel.id}" data-youtube-url="${isYouTube ? reel.videoUrl : ''}" tabindex="0" role="button" aria-pressed="false" aria-label="Select ${reel.title}">
        <div class="reel-card-inner">
          <div class="reel-thumbnail">
            ${isYouTube
              ? `<img class="reel-yt-thumb" src="${thumbnailUrl}" alt="${reel.title}" onclick="window.open('${reel.videoUrl}', '_blank'); setTimeout(() => this.closest('.reel-card').click(), 100);" /><div class="reel-yt-play" onclick="window.open('${reel.videoUrl}', '_blank'); setTimeout(() => this.closest('.reel-card').click(), 100);"><svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.6)"/><polygon points="18,14 36,24 18,34" fill="white"/></svg></div>`
              : reel.videoUrl
                ? `<video class="reel-video" src="${reel.videoUrl}" muted loop preload="metadata" onclick="event.stopPropagation(); this.closest('.reel-card').click();"></video>`
                : `<span class="reel-emoji">${reel.thumbnail}</span>`
            }
            <span class="reel-duration">${reel.duration}</span>
            <div class="reel-check">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div class="reel-info">
            <h3 class="reel-title">${reel.title}</h3>
            <p class="reel-creator">${reel.creator}</p>
            <p class="reel-description">${reel.description}</p>
            <div class="reel-meta">
              <span class="reel-category-badge">${reel.category}</span>
              <span class="reel-stats">❤️ ${reel.likes} · 👁️ ${reel.views}</span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /**
   * Bind all UI event listeners
   * Handles: reel selection (click/keyboard), analyze/reset buttons, quick-select buttons
   */
  setupEventListeners() {
    // Reel card selection (click + keyboard accessible with Enter/Space)
    const grid = document.getElementById('reels-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.reel-card');
        if (card) this.toggleReelSelection(card);
      });
      grid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const card = e.target.closest('.reel-card');
          if (card) {
            e.preventDefault();
            this.toggleReelSelection(card);
          }
        }
      });
      grid.addEventListener('mouseenter', (e) => {
        const card = e.target.closest('.reel-card');
        if (card) {
          const video = card.querySelector('video');
          if (video) video.play().catch(() => {});
        }
      }, true);
      grid.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.reel-card');
        if (card) {
          const video = card.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
        }
      }, true);
    }

    // Analyze button - triggers full inference + recommendation pipeline
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.runAnalysis());
    }

    // Reset button - clears selections and results
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAll());
    }

    // Quick select: the 4 "trap" Reels (Java meme + SWE lifestyle + interview joke + laptop review)
    const trapBtn = document.getElementById('trap-btn');
    if (trapBtn) {
      trapBtn.addEventListener('click', () => this.selectTrapReels());
    }

    // Quick select: all 8 Reels
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllReels());
    }
  }

  /**
   * Toggle selection state of a Reel card
   * Updates Set, DOM classes, and ARIA attributes for accessibility
   */
  toggleReelSelection(card) {
    const reelId = card.dataset.reelId;

    if (this.selectedReels.has(reelId)) {
      this.selectedReels.delete(reelId);
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    } else {
      this.selectedReels.add(reelId);
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }

    this.updateSelectionCount();
  }

  /**
   * Quick-select the 4 "trap" Reels (R001-R004):
   * Java meme + SWE lifestyle + Interview joke + Laptop comparison
   * This combination should trigger the "Software Engineering Career Path" compound interest
   */
  selectTrapReels() {
    this.clearSelections();
    const trapIds = ['R001', 'R002', 'R003', 'R004'];
    trapIds.forEach(id => {
      this.selectedReels.add(id);
      const card = document.querySelector(`[data-reel-id="${id}"]`);
      if (card) {
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
      }
    });
    this.updateSelectionCount();
  }

  /**
   * Quick-select all 8 Reels in the feed
   */
  selectAllReels() {
    this.clearSelections();
    SAMPLE_REELS.forEach(reel => {
      this.selectedReels.add(reel.id);
      const card = document.querySelector(`[data-reel-id="${reel.id}"]`);
      if (card) {
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
      }
    });
    this.updateSelectionCount();
  }

  /**
   * Clear all selections from UI and internal state
   */
  clearSelections() {
    this.selectedReels.clear();
    document.querySelectorAll('.reel-card.selected').forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
    this.updateSelectionCount();
  }

  /**
   * Update selection counter badge and analyze button state/text
   * Also triggers debounced auto-analysis (500ms after last change)
   */
  updateSelectionCount() {
    const count = this.selectedReels.size;
    const countEl = document.getElementById('selection-count');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (countEl) {
      countEl.textContent = count;
    }
    if (analyzeBtn) {
      analyzeBtn.disabled = count === 0;
      analyzeBtn.querySelector('.btn-text').textContent =
        count === 0 ? 'Select Reels to Analyze' : `Analyze ${count} Reel${count !== 1 ? 's' : ''}`;
    }

    // Auto-trigger analysis with debounce
    this._scheduleAutoAnalyze();
  }

  /**
   * Debounced auto-analysis: waits 500ms after selection changes
   * If selection becomes empty, hides results and clears state
   */
  _scheduleAutoAnalyze() {
    clearTimeout(this.autoAnalyzeTimer);
    if (this.selectedReels.size === 0) {
      // If no reels selected, reset results
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.classList.remove('visible');
      document.getElementById('analysis-content').innerHTML = '';
      document.getElementById('recommendations-content').innerHTML = '';
      this.analysisResult = null;
      this.recommendations = [];
      return;
    }
    this.autoAnalyzeTimer = setTimeout(() => this.runAnalysis(), 500);
  }

  /**
   * Run the full AI analysis pipeline:
   * 1. Filter selected Reel objects from SAMPLE_REELS
   * 2. InterestInferenceEngine.analyze() → interest profile with clusters, compound patterns
   * 3. Render analysis results (summary, clusters, per-Reel breakdown)
   * 4. RecommendationEngine.recommend() → 5 structured recommendations
   * 5. Render recommendation cards with visual comparison
   */
  async runAnalysis() {
    if (this.selectedReels.size === 0 || this.isAnalyzing) return;

    // Security: Rate limit check
    const rateCheck = security.checkAnalysisRateLimit();
    if (!rateCheck.allowed) {
      console.warn('[Security] Rate limit exceeded. Please wait before analyzing again.');
      security.logEvent('rate_limit_exceeded', { remaining: rateCheck.remaining });
      return;
    }

    this.isAnalyzing = true;
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.classList.add('loading');
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';

    // Show results panels
    const resultsSection = document.getElementById('results-section');
    resultsSection.classList.add('visible');

    // Show loading states
    this.showLoadingState('analysis-content', 'Inferring interests...');
    this.showLoadingState('recommendations-content', 'Generating recommendations...');

    try {
      // Get selected Reel objects from the full dataset
      const selectedReelObjects = SAMPLE_REELS.filter(r => this.selectedReels.has(r.id));

      // Security: Validate input reels
      for (const reel of selectedReelObjects) {
        const validation = security.validateReel(reel);
        if (!validation.valid) {
          console.warn(`[Security] Invalid reel data for ${reel.id}:`, validation.errors);
          security.logEvent('invalid_reel_input', { id: reel.id, errors: validation.errors });
        }
      }

      // Efficiency: Check memoization cache
      const cacheKey = [...this.selectedReels].sort().join(',');
      if (this.analysisCache.has(cacheKey)) {
        console.log('[Cache] Using cached analysis result');
        const cached = this.analysisCache.get(cacheKey);
        this.analysisResult = cached.profile;
        this.recommendations = cached.recs;
      } else {
        // Phase 1: Run interest inference
        this.analysisResult = this.inferenceEngine.analyze(selectedReelObjects);

        // Security: Validate profile output
        const profileValidation = security.validateProfile(this.analysisResult);
        if (!profileValidation.valid) {
          security.logEvent('invalid_profile_output', { errors: profileValidation.errors });
        }

        // Phase 2: Run recommendation engine
        this.recommendations = this.recommender.recommend(
          this.analysisResult, selectedReelObjects, 5
        );

        // Security: Validate recommendations
        for (const rec of this.recommendations) {
          const recValidation = security.validateRecommendation(rec);
          if (!recValidation.valid) {
            security.logEvent('invalid_recommendation', { errors: recValidation.errors });
          }
        }

        // Cache the result (max 50 entries)
        if (this.analysisCache.size > 50) {
          const firstKey = this.analysisCache.keys().next().value;
          this.analysisCache.delete(firstKey);
        }
        this.analysisCache.set(cacheKey, { profile: this.analysisResult, recs: this.recommendations });
      }

      this.renderAnalysis();
      console.log('[App] Recommendations generated:', this.recommendations.length);
      this.renderRecommendations();
    } catch (error) {
      console.error('Analysis failed:', error);
      security.logEvent('analysis_error', { error: error.message });
      this.showLoadingState('analysis-content', 'Analysis failed. Please try again.');
      this.showLoadingState('recommendations-content', 'Could not generate recommendations.');
    } finally {
      analyzeBtn.classList.remove('loading');
      analyzeBtn.querySelector('.btn-text').textContent = `Analyze ${this.selectedReels.size} Reels`;
      this.isAnalyzing = false;
    }

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Render analysis results into the analysis panel
   * Sections: Summary card → Compound alert (if detected) → Cluster bars → Per-Reel breakdown
   * Each section uses stagger animation delays for polished feel
   */
  renderAnalysis() {
    const container = document.getElementById('analysis-content');
    if (!container || !this.analysisResult) return;

    const profile = this.analysisResult;

    // Summary card with overall confidence badge
    let html = `
      <div class="analysis-summary glass-card animate-in">
        <div class="summary-icon">🧠</div>
        <p class="summary-text">${profile.summary}</p>
        <div class="confidence-badge confidence-${profile.overallConfidence.toLowerCase()}">
          Confidence: ${profile.overallConfidence}
        </div>
      </div>
    `;

    // Compound interest alert (trap detection) - shows when compound pattern matched
    if (profile.compoundInterest) {
      html += `
        <div class="compound-alert glass-card animate-in" style="animation-delay: 0.1s">
          <div class="alert-header">
            <span class="alert-icon">🎯</span>
            <span class="alert-title">Compound Interest Detected</span>
          </div>
          <div class="alert-body">
            <h4>${profile.compoundInterest.label}</h4>
            <p>${profile.compoundInterest.description}</p>
            <div class="alert-details">
              <div class="detail-item">
                <span class="detail-label">Matched Clusters</span>
                <div class="detail-tags">
                  ${profile.compoundInterest.matchedClusters
                    .map(c => `<span class="tag">${c.replace(/-/g, ' ')}</span>`)
                    .join('')}
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Career Signals</span>
                <div class="detail-tags">
                  ${profile.compoundInterest.matchedCareerSignals
                    .map(s => `<span class="tag career">${s.replace(/-/g, ' ')}</span>`)
                    .join('')}
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Pattern Confidence</span>
                <div class="confidence-bar">
                  <div class="confidence-fill" style="width: ${(profile.compoundInterest.confidence * 100).toFixed(0)}%"></div>
                  <span class="confidence-label">${(profile.compoundInterest.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Interest clusters visualization - ranked by score with breadth bonus indicator
    html += `
      <div class="clusters-section animate-in" style="animation-delay: 0.2s">
        <h3 class="section-subtitle">Interest Clusters</h3>
        <div class="clusters-grid">
          ${profile.allClusters.map((cluster, i) => `
            <div class="cluster-card glass-card" style="animation-delay: ${0.3 + i * 0.08}s">
              <div class="cluster-header">
                <span class="cluster-rank">#${i + 1}</span>
                <span class="cluster-name">${cluster.label}</span>
              </div>
              <div class="cluster-score-bar">
                <div class="score-fill" style="width: ${Math.min(cluster.score / (profile.allClusters[0]?.score || 3) * 100, 100)}%; background: ${this.getClusterColor(i)}"></div>
              </div>
              <div class="cluster-meta">
                <span>${cluster.topics.length} topics</span>
                <span>Score: ${cluster.score.toFixed(2)}</span>
                ${cluster.breadthBonus ? '<span class="breadth-badge">📊 Breadth bonus</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Per-Reel analysis - shows what interest each Reel contributed and why
    html += `
      <div class="reel-analysis-section animate-in" style="animation-delay: 0.4s">
        <h3 class="section-subtitle">Per-Reel Analysis</h3>
        ${profile.reelAnalyses.map((analysis, i) => `
          <div class="reel-analysis-card glass-card" style="animation-delay: ${0.5 + i * 0.06}s">
            <div class="analysis-reel-header">
              <span class="analysis-emoji">${analysis.reel.thumbnail}</span>
              <div class="analysis-reel-info">
                <strong>${analysis.reel.title}</strong>
                <span class="analysis-creator">${analysis.reel.creator}</span>
              </div>
              <div class="signal-meter" title="Signal Strength: ${(analysis.signalStrength * 100).toFixed(0)}%">
                <div class="signal-fill" style="width: ${analysis.signalStrength * 100}%"></div>
              </div>
            </div>
            <div class="analysis-details">
              <div class="analysis-row">
                <span class="analysis-label">Interest Detected:</span>
                <span class="analysis-value interest">${analysis.interestDetected}</span>
              </div>
              <div class="analysis-row">
                <span class="analysis-label">Why:</span>
                <span class="analysis-value">${analysis.why}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render recommendation cards into the recommendations panel
   * Each card shows: visual comparison (watched → recommended), structured output block, description
   * Empty state shown if no recommendations generated
   */
  renderRecommendations() {
    const container = document.getElementById('recommendations-content');
    if (!container) return;

    if (this.recommendations.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-card">
          <span class="empty-icon">🤔</span>
          <p>No tech recommendations could be generated. Try selecting more Reels with tech-related content.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="recommendations-header animate-in">
        <h3 class="section-subtitle">🎬 Recommended Tech Reels</h3>
        <p class="recommendations-intro">Based on your viewing pattern, here are engaging tech Reels that match your interests — no hype, no clickbait.</p>
      </div>
    `;

    html += this.recommendations.map((rec, i) => {
      const currentReelObj = rec.currentReelObj;
      const recReelObj = rec.recommendedReelObj;

      return `
      <div class="recommendation-card glass-card animate-in" style="animation-delay: ${0.1 + i * 0.12}s">
        <div class="rec-header">
          <div class="rec-number">${rec.index}</div>
          <div class="rec-category-badge" style="background: ${rec.categoryMeta.gradient}">
            ${rec.categoryMeta.icon} ${rec.category}
          </div>
          <div class="rec-confidence confidence-${rec.confidence.toLowerCase()}">${rec.confidence}</div>
        </div>

        <div class="rec-visual-compare">
          <div class="rec-visual-reel current">
            <span class="rec-visual-emoji">${currentReelObj ? currentReelObj.thumbnail : '📱'}</span>
            <span class="rec-visual-label">You watched</span>
            <span class="rec-visual-title">${currentReelObj ? currentReelObj.title : 'Multiple Reels'}</span>
            <span class="rec-visual-creator">${currentReelObj ? currentReelObj.creator : ''}</span>
          </div>
          <div class="rec-visual-arrow" aria-hidden="true">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <path d="M2 12h32M30 6l6 6-6 6" stroke="url(#arrowGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <defs><linearGradient id="arrowGrad" x1="2" y1="12" x2="38" y2="12"><stop stop-color="#7c3aed"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
            </svg>
          </div>
          <div class="rec-visual-reel recommended">
            <span class="rec-visual-emoji">${rec.categoryMeta.icon}</span>
            <span class="rec-visual-label">Recommended</span>
            <span class="rec-visual-title">${recReelObj.title}</span>
            <span class="rec-visual-creator">${recReelObj.creator}</span>
          </div>
        </div>
        
        <div class="rec-body">
          <div class="rec-output-block">
            <div class="output-row">
              <span class="output-key">CURRENT REEL:</span>
              <span class="output-value title">${currentReelObj ? `"${currentReelObj.title}" by ${currentReelObj.creator}` : 'Multiple viewed Reels'}</span>
            </div>
            <div class="output-row">
              <span class="output-key">INTEREST DETECTED:</span>
              <span class="output-value highlight">${rec.interestDetected}</span>
            </div>
            <div class="output-row">
              <span class="output-key">WHY:</span>
              <span class="output-value">${rec.why}</span>
            </div>
            <div class="output-row">
              <span class="output-key">RECOMMENDED TECH REEL:</span>
              <span class="output-value title">${recReelObj.title}</span>
            </div>
            <div class="output-row">
              <span class="output-key">CATEGORY:</span>
              <span class="output-value">
                <span class="category-inline">${rec.categoryMeta.icon} ${rec.category}</span>
              </span>
            </div>
            <div class="output-row">
              <span class="output-key">WHY THIS RECOMMENDATION:</span>
              <span class="output-value">${rec.whyThisRecommendation}</span>
            </div>
            <div class="output-row">
              <span class="output-key">DIFFICULTY:</span>
              <span class="output-value">
                <span class="difficulty-inline">${rec.difficultyMeta.icon} ${rec.difficulty}</span>
              </span>
            </div>
            <div class="output-row">
              <span class="output-key">CONFIDENCE:</span>
              <span class="output-value">
                <span class="confidence-inline confidence-${rec.confidence.toLowerCase()}">${rec.confidence}</span>
              </span>
            </div>
          </div>
          
          <div class="rec-creator">
            <span class="rec-description">${recReelObj.description}</span>
          </div>
        </div>
      </div>
    `}).join('');


    container.innerHTML = html;
  }

  /**
   * Show loading skeleton with spinner and message
   */
  showLoadingState(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">${message}</p>
      </div>
    `;
  }

  /**
   * Full reset: clear selections, results, hide panels, scroll to top
   */
  resetAll() {
    this.clearSelections();
    this.analysisResult = null;
    this.recommendations = [];

    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.classList.remove('visible');
    }

    document.getElementById('analysis-content').innerHTML = '';
    document.getElementById('recommendations-content').innerHTML = '';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Utility: get gradient color for cluster rank (cycles through 8 colors)
   */
  getClusterColor(index) {
    const colors = [
      'linear-gradient(90deg, #7c3aed, #a78bfa)',
      'linear-gradient(90deg, #0891b2, #22d3ee)',
      'linear-gradient(90deg, #059669, #34d399)',
      'linear-gradient(90deg, #d97706, #fbbf24)',
      'linear-gradient(90deg, #dc2626, #f87171)',
      'linear-gradient(90deg, #7c3aed, #c084fc)',
      'linear-gradient(90deg, #0284c7, #38bdf8)'
    ];
    return colors[index % colors.length];
  }

  /**
   * Utility: promise-based delay for animations
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ReelMindApp();
});

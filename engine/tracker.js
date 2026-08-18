/**
 * ReelSense — Interaction Tracker
 * Tracks user engagement with reels: watch %, time, likes, saves, skips, replays.
 * Builds engagement metrics and interest signals from behavioral data.
 */

export class InteractionTracker {
  constructor() {
    this.interactions = new Map();
    this.sessionStart = Date.now();
    this.totalWatchTime = 0;
    this.totalReelsWatched = 0;
    this.totalSkips = 0;
    this.totalLikes = 0;
    this.totalSaves = 0;
    this.totalShares = 0;
    this.totalReplays = 0;
  }

  /**
   * Initialize tracking for a reel
   */
  trackReel(reelId) {
    if (!this.interactions.has(reelId)) {
      this.interactions.set(reelId, {
        reelId,
        watchPercent: 0,
        watchTimeMs: 0,
        liked: false,
        saved: false,
        shared: false,
        skipped: false,
        replayCount: 0,
        firstViewed: Date.now(),
        lastViewed: Date.now(),
        viewCount: 1,
      });
    } else {
      const data = this.interactions.get(reelId);
      data.viewCount++;
      data.lastViewed = Date.now();
    }
    return this.interactions.get(reelId);
  }

  /**
   * Update watch percentage for a reel
   */
  updateWatchPercent(reelId, percent) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.watchPercent = Math.max(data.watchPercent, Math.min(100, percent));
    }
  }

  /**
   * Record watch time for a reel
   */
  addWatchTime(reelId, ms) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.watchTimeMs += ms;
      this.totalWatchTime += ms;
    }
  }

  /**
   * Toggle like on a reel
   */
  toggleLike(reelId) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.liked = !data.liked;
      this.totalLikes += data.liked ? 1 : -1;
    }
    return data ? data.liked : false;
  }

  /**
   * Toggle save on a reel
   */
  toggleSave(reelId) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.saved = !data.saved;
      this.totalSaves += data.saved ? 1 : -1;
    }
    return data ? data.saved : false;
  }

  /**
   * Record a share
   */
  share(reelId) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.shared = true;
      this.totalShares++;
    }
  }

  /**
   * Record a skip
   */
  skip(reelId) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.skipped = true;
      this.totalSkips++;
    }
  }

  /**
   * Record a replay
   */
  replay(reelId) {
    const data = this.interactions.get(reelId);
    if (data) {
      data.replayCount++;
      this.totalReplays++;
    }
  }

  /**
   * Get all interactions as an array
   */
  getAll() {
    return Array.from(this.interactions.values());
  }

  /**
   * Get interaction for a specific reel
   */
  get(reelId) {
    return this.interactions.get(reelId) || null;
  }

  /**
   * Compute engagement score (0-100)
   */
  getEngagementScore() {
    const total = this.interactions.size;
    if (total === 0) return 0;

    let score = 0;
    for (const data of this.interactions.values()) {
      score += data.watchPercent / 100;
      if (data.liked) score += 0.2;
      if (data.saved) score += 0.3;
      if (data.shared) score += 0.3;
      if (data.replayCount > 0) score += 0.2 * Math.min(data.replayCount, 3);
    }
    return Math.min(100, Math.round((score / total) * 100));
  }

  /**
   * Compute semantic depth (average watch % across all reels)
   */
  getSemanticDepth() {
    const all = this.getAll();
    if (all.length === 0) return 0;
    const avg = all.reduce((sum, d) => sum + d.watchPercent, 0) / all.length;
    return Math.round(avg);
  }

  /**
   * Compute retention rate (percentage of reels not skipped)
   */
  getRetentionRate() {
    const total = this.interactions.size;
    if (total === 0) return 0;
    return Math.round(((total - this.totalSkips) / total) * 100);
  }

  /**
   * Get category interest distribution
   */
  getCategoryDistribution(reels) {
    const dist = {};
    for (const reel of reels) {
      const data = this.interactions.get(reel.id);
      if (data && !data.skipped) {
        const cat = reel.category || 'Unknown';
        dist[cat] = (dist[cat] || 0) + 1;
      }
    }
    return dist;
  }

  /**
   * Get summary statistics
   */
  getStats() {
    return {
      watched: this.interactions.size,
      totalWatchTimeMs: this.totalWatchTime,
      totalWatchTimeSec: Math.round(this.totalWatchTime / 1000),
      likes: this.totalLikes,
      saves: this.totalSaves,
      shares: this.totalShares,
      skips: this.totalSkips,
      replays: this.totalReplays,
      engagementScore: this.getEngagementScore(),
      semanticDepth: this.getSemanticDepth(),
      retentionRate: this.getRetentionRate(),
      sessionDurationMs: Date.now() - this.sessionStart,
    };
  }

  /**
   * Build a behavioral profile for the inference engine
   * Maps interaction data to semantic signals
   */
  buildBehavioralSignals(reels) {
    const signals = [];
    for (const reel of reels) {
      const data = this.interactions.get(reel.id);
      if (!data) continue;

      signals.push({
        reelId: reel.id,
        title: reel.title,
        category: reel.category,
        watchPercent: data.watchPercent,
        liked: data.liked,
        saved: data.saved,
        shared: data.shared,
        skipped: data.skipped,
        replayed: data.replayCount > 0,
        engagementDepth: this._computeEngagementDepth(data),
        intentSignal: this._inferIntent(data, reel),
      });
    }
    return signals;
  }

  _computeEngagementDepth(data) {
    if (data.watchPercent >= 90 && data.liked) return 'deep';
    if (data.watchPercent >= 60) return 'moderate';
    if (data.watchPercent >= 30) return 'surface';
    return 'minimal';
  }

  _inferIntent(data, reel) {
    if (data.saved) return 'study-intent';
    if (data.shared) return 'social-sharing';
    if (data.replayCount > 1) return 'deep-learning';
    if (data.watchPercent >= 80) return 'high-engagement';
    if (data.skipped) return 'dismissed';
    return 'browsing';
  }

  reset() {
    this.interactions.clear();
    this.sessionStart = Date.now();
    this.totalWatchTime = 0;
    this.totalReelsWatched = 0;
    this.totalSkips = 0;
    this.totalLikes = 0;
    this.totalSaves = 0;
    this.totalShares = 0;
    this.totalReplays = 0;
  }
}

/* ReelMind Test Runner — loaded as a regular script, not inline */
(async function() {
  var statusEl = document.getElementById('status');
  var outputEl = document.getElementById('test-output');
  var summaryEl = document.getElementById('test-summary');

  var SAMPLE_REELS, RECOMMENDATION_POOL, TOPIC_HIERARCHY, TOPIC_TO_CLUSTER;
  var SIGNAL_WEIGHTS, COMPOUND_PATTERNS, HYPE_PATTERNS, CATEGORY_META, DIFFICULTY_META;
  var InterestInferenceEngine, RecommendationEngine, SecurityManager;
  var modulesLoaded = false;

  async function loadModules() {
    statusEl.textContent = 'Loading modules...';
    try {
      var topics = await import('./data/topics.js');
      TOPIC_HIERARCHY = topics.TOPIC_HIERARCHY;
      TOPIC_TO_CLUSTER = topics.TOPIC_TO_CLUSTER;
      SIGNAL_WEIGHTS = topics.SIGNAL_WEIGHTS;
      COMPOUND_PATTERNS = topics.COMPOUND_PATTERNS;
      HYPE_PATTERNS = topics.HYPE_PATTERNS;
      CATEGORY_META = topics.CATEGORY_META;
      DIFFICULTY_META = topics.DIFFICULTY_META;

      var reels = await import('./data/reels.js');
      SAMPLE_REELS = reels.SAMPLE_REELS;
      RECOMMENDATION_POOL = reels.RECOMMENDATION_POOL;

      var inf = await import('./engine/inference.js');
      InterestInferenceEngine = inf.InterestInferenceEngine;

      var rec = await import('./engine/recommender.js');
      RecommendationEngine = rec.RecommendationEngine;

      var sec = await import('./engine/security.js');
      SecurityManager = sec.SecurityManager;

      modulesLoaded = true;
      statusEl.textContent = 'Modules loaded. Running tests...';
    } catch(e) {
      statusEl.innerHTML = 'Module load failed: ' + e.message;
      statusEl.style.color = '#ef4444';
      console.error('Module load error:', e);
    }
  }

  var suites = [];
  function describe(name, fn) { var s = { name: name, tests: [], beforeEach: [] }; suites.push(s); fn(); }
  function it(name, fn) { suites[suites.length-1].tests.push({ name: name, fn: fn }); }
  function beforeEach(fn) { suites[suites.length-1].beforeEach.push(fn); }

  function eq(a, b, m) { if (a !== b) throw new Error((m||'') + ' Expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function gt(a, b, m) { if (!(a > b)) throw new Error((m||'') + ' Expected ' + a + ' > ' + b); }
  function lt(a, b, m) { if (!(a < b)) throw new Error((m||'') + ' Expected ' + a + ' < ' + b); }
  function ge(a, b, m) { if (!(a >= b)) throw new Error((m||'') + ' Expected ' + a + ' >= ' + b); }
  function le(a, b, m) { if (!(a <= b)) throw new Error((m||'') + ' Expected ' + a + ' <= ' + b); }
  function ok(v, m) { if (!v) throw new Error((m||'') + ' Expected truthy, got ' + v); }
  function isArr(v, m) { if (!Array.isArray(v)) throw new Error((m||'') + ' Expected array'); }
  function isObj(v, m) { if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error((m||'') + ' Expected object'); }
  function len(a, n, m) { if (a.length !== n) throw new Error((m||'') + ' Expected length ' + n + ', got ' + a.length); }
  function has(o, k, m) { if (!(k in o)) throw new Error((m||'') + ' Missing ' + k); }
  function nn(v, m) { if (v === null || v === undefined) throw new Error((m||'') + ' Expected non-null'); }
  function includes(a, i, m) { if (!a.includes(i)) throw new Error((m||'') + ' Expected include ' + JSON.stringify(i)); }

  describe('Data: Sample Reels', function() {
    it('loads SAMPLE_REELS', function() { ok(SAMPLE_REELS); });
    it('has 8 reels', function() { len(SAMPLE_REELS, 8); });
    it('has unique IDs', function() {
      var ids = SAMPLE_REELS.map(function(r){ return r.id; });
      eq(new Set(ids).size, ids.length);
    });
    it('all have required fields', function() {
      SAMPLE_REELS.forEach(function(r) {
        has(r, 'id'); has(r, 'title'); has(r, 'creator');
        has(r, 'category'); has(r, 'semanticTopics'); has(r, 'contentSignals');
      });
    });
    it('valid ID format (R/T + 3 digits)', function() {
      SAMPLE_REELS.forEach(function(r) { ok(/^[RT]\d{3}$/.test(r.id), r.id + ' invalid'); });
    });
  });

  describe('Data: Recommendation Pool', function() {
    it('has at least 15 items', function() { gt(RECOMMENDATION_POOL.length, 14); });
    it('has unique IDs', function() {
      var ids = RECOMMENDATION_POOL.map(function(r){ return r.id; });
      eq(new Set(ids).size, ids.length);
    });
    it('all have required fields', function() {
      RECOMMENDATION_POOL.forEach(function(r) {
        has(r, 'id'); has(r, 'title'); has(r, 'creator');
        has(r, 'category'); has(r, 'semanticTopics'); has(r, 'contentSignals');
      });
    });
  });

  describe('Data: Topic Taxonomy', function() {
    it('TOPIC_HIERARCHY has clusters', function() { isObj(TOPIC_HIERARCHY); gt(Object.keys(TOPIC_HIERARCHY).length, 0); });
    it('TOPIC_TO_CLUSTER has mappings', function() { isObj(TOPIC_TO_CLUSTER); gt(Object.keys(TOPIC_TO_CLUSTER).length, 0); });
    it('SIGNAL_WEIGHTS defined', function() { isObj(SIGNAL_WEIGHTS); has(SIGNAL_WEIGHTS, 'topicDepth'); });
    it('COMPOUND_PATTERNS defined', function() { isArr(COMPOUND_PATTERNS); gt(COMPOUND_PATTERNS.length, 0); });
    it('HYPE_PATTERNS defined', function() { isArr(HYPE_PATTERNS); gt(HYPE_PATTERNS.length, 0); });
  });

  describe('Inference: Signal Extraction', function() {
    var engine;
    beforeEach(function() { engine = new InterestInferenceEngine(); });
    it('extracts signals from valid reel', function() { nn(engine._extractSignals(SAMPLE_REELS[0])); });
    it('computes signal strength > 0', function() {
      var s = engine._calculateSignalStrength({ topicDepth: 'deep', intentSignal: 'active', careerRelevance: 'high', learningValue: 'high' });
      gt(s, 0);
    });
    it('returns 0 for null signals', function() { eq(engine._calculateSignalStrength(null), 0); });
    it('maps topics to clusters', function() {
      var c = engine._getClustersForTopic('java-programming');
      isArr(c); gt(c.length, 0);
    });
  });

  describe('Inference: Cluster Aggregation', function() {
    var engine;
    beforeEach(function() { engine = new InterestInferenceEngine(); });
    it('scores clusters from multiple reels', function() {
      var p = engine.analyze(SAMPLE_REELS);
      isObj(p.clusterScores); gt(Object.keys(p.clusterScores).length, 0);
    });
    it('normalizes scores 0-1', function() {
      var p = engine.analyze(SAMPLE_REELS);
      Object.values(p.clusterScores).forEach(function(c) { ge(c.score, 0); le(c.score, 1.01); });
    });
    it('tech reels score higher than entertainment', function() {
      var tech = engine.analyze(SAMPLE_REELS.slice(0, 4));
      var ent = engine.analyze([SAMPLE_REELS[4]]);
      var tMax = Math.max.apply(null, Object.values(tech.clusterScores).map(function(c){return c.score;}));
      var eMax = Math.max.apply(null, Object.values(ent.clusterScores).map(function(c){return c.score;}));
      gt(tMax, eMax);
    });
  });

  describe('Inference: Compound Detection', function() {
    var engine;
    beforeEach(function() { engine = new InterestInferenceEngine(); });
    it('detects compound interest from trap reels', function() {
      var p = engine.analyze(SAMPLE_REELS.slice(0, 4));
      nn(p.compoundInterest, 'should detect compound');
    });
    it('no compound from single reel', function() {
      var p = engine.analyze([SAMPLE_REELS[0]]);
      eq(p.compoundInterest, null);
    });
  });

  describe('Inference: Full Profile', function() {
    var engine;
    beforeEach(function() { engine = new InterestInferenceEngine(); });
    it('returns complete profile', function() {
      var p = engine.analyze(SAMPLE_REELS);
      has(p, 'primaryInterest'); has(p, 'clusterScores'); has(p, 'overallConfidence'); has(p, 'summary');
    });
    it('analyzes all input reels', function() { len(engine.analyze(SAMPLE_REELS).reelAnalyses, 8); });
    it('handles empty input', function() { nn(engine.analyze([])); });
  });

  describe('Recommender: Hype Filtering', function() {
    var engine;
    beforeEach(function() { engine = new RecommendationEngine(); });
    it('filters hype reels', function() {
      var f = engine._filterHype(RECOMMENDATION_POOL);
      isArr(f); gt(f.length, 0);
    });
  });

  describe('Recommender: Scoring', function() {
    var engine, profile;
    beforeEach(function() {
      engine = new RecommendationEngine();
      profile = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
    });
    it('scores candidates', function() {
      var scored = RECOMMENDATION_POOL.map(function(c) { return { c: c, score: engine._scoreCandidate(c, profile) }; });
      isArr(scored); gt(scored.length, 0);
    });
    it('scores are non-negative', function() {
      RECOMMENDATION_POOL.forEach(function(c) {
        var s = engine._scoreCandidate(c, profile);
        ge(s, 0, 'score for ' + c.id);
      });
    });
  });

  describe('Recommender: Full Pipeline', function() {
    var engine, profile, watched;
    beforeEach(function() {
      engine = new RecommendationEngine();
      watched = SAMPLE_REELS.slice(0, 4);
      profile = new InterestInferenceEngine().analyze(watched);
    });
    it('produces recommendations', function() {
      var recs = engine.recommend(profile, watched, 5);
      isArr(recs); gt(recs.length, 0);
    });
    it('has required fields', function() {
      engine.recommend(profile, watched, 3).forEach(function(r) {
        has(r, 'index'); has(r, 'currentReel'); has(r, 'interestDetected');
        has(r, 'recommendedReel'); has(r, 'category'); has(r, 'difficulty'); has(r, 'confidence');
      });
    });
    it('valid difficulty', function() {
      engine.recommend(profile, watched, 3).forEach(function(r) { includes(['Beginner','Intermediate','Advanced'], r.difficulty); });
    });
    it('valid confidence', function() {
      engine.recommend(profile, watched, 3).forEach(function(r) { includes(['Low','Medium','High'], r.confidence); });
    });
    it('no duplicate recommendations', function() {
      var recs = engine.recommend(profile, watched, 5);
      var titles = recs.map(function(r){ return r.recommendedReel; });
      eq(new Set(titles).size, titles.length);
    });
    it('respects max limit', function() { le(engine.recommend(profile, watched, 2).length, 2); });
    it('handles null profile', function() { len(engine.recommend(null, [], 3), 0); });
    it('has whyThisRecommendation', function() {
      engine.recommend(profile, watched, 3).forEach(function(r) {
        has(r, 'whyThisRecommendation'); gt(r.whyThisRecommendation.length, 4);
      });
    });
  });

  describe('Security: HTML Escaping', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('escapes angle brackets', function() {
      var s = sm.sanitizer.escapeHtml('\x3Cscript\x3E');
      ok(s.indexOf('\x3Cscript\x3E') === -1);
      ok(s.indexOf('&lt;') >= 0 || s.indexOf('&amp;') >= 0);
    });
    it('escapes double quotes', function() { ok(sm.sanitizer.escapeHtml('a"b').indexOf('"') === -1); });
    it('handles empty string', function() { eq(sm.sanitizer.escapeHtml(''), ''); });
    it('handles null', function() { nn(sm.sanitizer.escapeHtml(null)); });
  });

  describe('Security: Reel Sanitization', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('sanitizes reel text fields', function() {
      var safe = sm.sanitizeReel({ title: '\x3Cb\x3Etest\x3C/b\x3E', creator: 'x', desc: 'y', category: 'tech', id: 'R001' });
      ok(safe.title.indexOf('\x3Cb\x3E') === -1);
    });
    it('preserves reel ID', function() { eq(sm.sanitizeReel({ id: 'R001', title: 't' }).id, 'R001'); });
    it('handles null reel', function() { isObj(sm.sanitizeReel(null)); });
  });

  describe('Security: XSS Detection', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('detects script tags', function() {
      ok(sm.sanitizer.containsXssPatterns('\x3Cscript\x3Ealert(1)\x3C/script\x3E'));
    });
    it('detects javascript protocol', function() { ok(sm.sanitizer.containsXssPatterns('javascript:void(0)')); });
    it('does not flag normal text', function() { ok(!sm.sanitizer.containsXssPatterns('Hello world 123')); });
  });

  describe('Security: Rate Limiting', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('allows within limit', function() {
      for (var i = 0; i < 10; i++) ok(sm.checkAnalysisRateLimit().allowed);
    });
    it('blocks over limit', function() {
      for (var i = 0; i < 10; i++) sm.checkAnalysisRateLimit();
      ok(!sm.checkAnalysisRateLimit().allowed);
    });
  });

  describe('Security: Content Validation', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('validates correct reel', function() { ok(sm.validateReel(SAMPLE_REELS[0]).valid); });
    it('rejects empty object', function() { ok(!sm.validateReel({}).valid); });
    it('validates profile', function() {
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
      var v = sm.validateProfile(p);
      ok(v.valid, v.errors.join(', '));
    });
    it('validates recommendations', function() {
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
      var recs = new RecommendationEngine().recommend(p, SAMPLE_REELS.slice(0, 4), 2);
      recs.forEach(function(r) {
        var v = sm.validateRecommendation(r);
        ok(v.valid, v.errors.join(', '));
      });
    });
  });

  describe('Security: Audit Logging', function() {
    var sm;
    beforeEach(function() { sm = new SecurityManager(); });
    it('logs events', function() {
      var len0 = sm.getAuditLog().length;
      sm.logEvent('test', {});
      gt(sm.getAuditLog().length, len0);
    });
    it('event has required fields', function() {
      sm.logEvent('test', { key: 'val' });
      var last = sm.getAuditLog()[sm.getAuditLog().length - 1];
      has(last, 'timestamp'); has(last, 'type'); has(last, 'details');
    });
  });

  describe('Integration: Full Pipeline', function() {
    it('reels to analysis to recommendations', function() {
      var infer = new InterestInferenceEngine();
      var eng = new RecommendationEngine();
      var p = infer.analyze(SAMPLE_REELS.slice(0, 4));
      var recs = eng.recommend(p, SAMPLE_REELS.slice(0, 4), 5);
      isObj(p); isArr(recs); gt(recs.length, 0);
    });
    it('trap reels detect compound interest', function() {
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
      nn(p.compoundInterest);
    });
    it('valid outputs through security', function() {
      var sm = new SecurityManager();
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
      ok(sm.validateProfile(p).valid);
      var recs = new RecommendationEngine().recommend(p, SAMPLE_REELS.slice(0, 4), 2);
      recs.forEach(function(r) { ok(sm.validateRecommendation(r).valid); });
    });
    it('all 8 reels processed', function() {
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS);
      var recs = new RecommendationEngine().recommend(p, SAMPLE_REELS, 5);
      isObj(p); isArr(recs);
    });
  });

  describe('Integration: Performance', function() {
    it('analysis < 200ms', function() {
      var t = performance.now(); new InterestInferenceEngine().analyze(SAMPLE_REELS);
      lt(performance.now() - t, 200);
    });
    it('recommendation < 200ms', function() {
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS.slice(0, 4));
      var t = performance.now(); new RecommendationEngine().recommend(p, SAMPLE_REELS.slice(0, 4), 5);
      lt(performance.now() - t, 200);
    });
    it('full pipeline < 300ms', function() {
      var t = performance.now();
      var p = new InterestInferenceEngine().analyze(SAMPLE_REELS);
      new RecommendationEngine().recommend(p, SAMPLE_REELS, 5);
      lt(performance.now() - t, 300);
    });
  });

  // Runner
  async function runTests() {
    if (!modulesLoaded) await loadModules();
    if (!modulesLoaded) return;

    var btn = document.getElementById('run-btn');
    btn.disabled = true; btn.textContent = 'Running...';
    outputEl.innerHTML = ''; summaryEl.innerHTML = '';

    var passed = 0, failed = 0, total = 0;
    var startTime = performance.now();

    for (var si = 0; si < suites.length; si++) {
      var suite = suites[si];
      outputEl.innerHTML += '<div class="suite"><h3>' + suite.name + '</h3></div>';
      for (var ti = 0; ti < suite.tests.length; ti++) {
        var test = suite.tests[ti];
        total++;
        for (var bi = 0; bi < suite.beforeEach.length; bi++) {
          try { await suite.beforeEach[bi](); } catch(e) {}
        }
        var t0 = performance.now();
        try {
          await test.fn();
          passed++;
          outputEl.innerHTML += '<div class="test pass">PASS: ' + test.name + ' <span class="time">' + (performance.now()-t0).toFixed(1) + 'ms</span></div>';
        } catch(e) {
          failed++;
          outputEl.innerHTML += '<div class="test fail">FAIL: ' + test.name + ' <span class="time">' + (performance.now()-t0).toFixed(1) + 'ms</span><pre class="error">' + e.message + '</pre></div>';
        }
      }
    }

    var dur = ((performance.now()-startTime)/1000).toFixed(2);
    var pct = total > 0 ? ((passed/total)*100).toFixed(1) : '0';
    summaryEl.innerHTML = '<div class="summary '+(failed===0?'all-pass':'has-fail')+'">' +
      '<h2>Results: '+passed+'/'+total+' passed ('+pct+'%)</h2>' +
      '<div class="stats"><span class="stat pass">'+passed+' passed</span> ' +
      '<span class="stat fail">'+failed+' failed</span> ' +
      '<span class="stat time">'+dur+'s</span></div></div>';
    btn.disabled = false; btn.textContent = 'Run All Tests';
  }

  document.getElementById('run-btn').addEventListener('click', runTests);

  // Auto-run
  runTests();
})();

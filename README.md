<div align="center">

# ReelMind

### AI-Powered Semantic Interest Inference & Reel Recommendation Agent

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://eshahina.github.io/hackthon/)
[![License](https://img.shields.io/badge/License-MIT-00ff00?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)

<br/>

**ReelMind analyzes student Reel interactions, infers deeper interests via a semantic topic hierarchy, and recommends quality tech Reels — filtering out hype and clickbait.**

[**Live Demo**](https://eshahina.github.io/hackthon/) · [How It Works](#how-it-works) · [Architecture](#architecture) · [Trap Scenario](#trap-scenario)

</div>

---

## Overview

ReelMind is a client-side AI recommendation engine built for Hackathon 2026. It demonstrates how a multi-signal inference system can look past surface-level engagement (memes, lifestyle content) and detect **compound interests** like "Software Engineering Architecture & Real-World Systems Craft."

### Key Features

| Feature | Description |
|---------|-------------|
| **Semantic Topic Hierarchy** | 30+ tech topics organized into 8 interest clusters (AI/ML, Systems Design, DevOps, etc.) |
| **Compound Interest Detection** | Identifies cross-cluster patterns instead of flat single-topic labels |
| **Hype Filtering** | Pattern-matched clickbait detection removes low-signal content |
| **Multi-Signal Scoring** | Combines topic depth, intent, career relevance, and learning value |
| **Real Video Reels** | Each reel links to actual YouTube content matching its topic |
| **Zero Dependencies** | Pure HTML/CSS/JS — no frameworks, no API keys, no backend |

---

## How It Works

```
Student watches Reels → Interest Inference Engine → Interest Profile → Recommendation Engine → Curated Tech Reels
         ↓                        ↓                        ↓                      ↓
   8 sample Reels          Semantic analysis          Cluster scores        Matched + scored
   (shuffled each load)    + signal weighting         + compound labels     + diversity applied
```

### Pipeline Stages

1. **Reel Analysis** — Each watched Reel is scored across 6 content signals (topic depth, intent, career relevance, learning value, tech domain, emotional tone)
2. **Cluster Scoring** — Signal weights roll up into 8 interest clusters with normalized scores
3. **Compound Detection** — When 2+ clusters score above threshold, a compound interest label is generated
4. **Recommendation Matching** — 23 curated tech Reels are scored against the interest profile using topic overlap and cluster alignment
5. **Diversity Pass** — Category diversity prevents recommending too many Reels from the same area

---

## Architecture

```
hackthon/
├── index.html                 # Single-page application shell
├── style.css                  # Design system + component styles
├── components/
│   └── app.js                 # UI controller, event handling, rendering
├── engine/
│   ├── inference.js           # InterestInferenceEngine (semantic analysis)
│   └── recommender.js         # RecommendationEngine (matching + scoring)
├── data/
│   ├── topics.js              # Topic taxonomy, hype patterns, signal weights
│   └── reels.js               # Sample Reels + recommendation pool
└── .github/workflows/
    └── deploy.yml             # GitHub Pages CI/CD
```

---

## Trap Scenario

The core challenge: can the system detect that a student watching Java memes, SWE lifestyle vlogs, coding interview jokes, and laptop reviews is **not** just interested in "Java" — but in the broader **Software Engineering Career** path?

| Reel | Shallow Interpretation | Correct Inference |
|------|----------------------|-------------------|
| Java code compiles meme | "Likes Java" | Developer humor + coding culture |
| Google SWE day-in-life | "Wants to work at Google" | Career aspiration + big tech culture |
| Linked list interview joke | "Studying DSA" | Interview awareness + CS fundamentals |
| MacBook vs ThinkPad review | "Shopping for laptop" | Developer tooling research |

**Result:** ReelMind correctly infers **"Software Engineering Architecture & Real-World Systems Craft"** as a compound interest spanning 4+ clusters.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS3 (custom properties, grid, animations) |
| Logic | ES6+ Modules (import/export) |
| Rendering | Vanilla DOM manipulation |
| Hosting | GitHub Pages |
| Build | None — runs directly in browser |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/EShahina/hackthon.git
cd hackthon

# Start a local server (ES modules require HTTP)
npx serve . -l 3000

# Open in browser
open http://localhost:3000
```

---

## Sample Output

```
CURRENT REEL: POV: NullPointerException on Line 404 at 4:59 PM on Friday
INTEREST DETECTED: Software Engineering Architecture & Real-World Systems Craft
WHY: The student engaged across multiple complementary dev signals: humor around
     production exceptions, day-in-the-life infrastructure discussions, interview
     tree traversals, and compile benchmarks.
RECOMMENDED TECH REEL: What Happens When 100k Users Request the Same Cache Key?
CATEGORY: HLD
DIFFICULTY: Intermediate
CONFIDENCE: High
```

---

## License

MIT © 2026

<div align="center">

**Built for Hackathon 2026 · No API Keys Required · Runs Entirely in Browser**

</div>

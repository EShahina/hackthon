/**
 * ReelMind — Sample Reels Data
 * 
 * 8 sample Reels a student might interact with, covering:
 * entertainment, gaming, coding, AI, gadgets, career, programming memes, tech news
 * 
 * TRAP REELS (IDs: R001, R002, R003, R004):
 * A shallow system seeing these would recommend generic Java content.
 * A strong system should infer broader "software engineering career" interest.
 */

export const SAMPLE_REELS = [
  // === TRAP REEL 1: Java Meme ===
  {
    id: 'R001',
    title: 'When your Java code compiles on first try 😱',
    creator: '@dev_humor_daily',
    description: 'That impossible moment when javac returns 0 errors. POV: You stare at the screen in disbelief. #JavaMemes #Programming #CodingLife',
    thumbnail: '☕',
    videoUrl: 'https://www.youtube.com/watch?v=Vli8i2JU11o',
    category: 'Programming Meme',
    tags: ['java', 'meme', 'coding', 'humor', 'compile', 'programming'],
    duration: '0:15',
    likes: '245K',
    views: '1.2M',
    semanticTopics: ['java-programming', 'developer-humor', 'coding-culture', 'software-development'],
    contentSignals: {
      topicDepth: 'surface',
      intentSignal: 'entertainment',
      careerRelevance: 'indirect',
      learningValue: 'low',
      techDomain: 'software-engineering',
      emotionalTone: 'humor',
      audienceLevel: 'any'
    }
  },

  // === TRAP REEL 2: SWE Lifestyle ===
  {
    id: 'R002',
    title: 'Day in the life of a Google SWE in Bangalore',
    creator: '@techlife_india',
    description: 'Morning standup → deep work → chai break → code review → gym → repeat. The SWE life isn\'t just DSA grinding. #GoogleLife #SoftwareEngineer #TechCareer #Bangalore',
    thumbnail: '🏢',
    videoUrl: 'https://www.youtube.com/watch?v=6ZZI_jPX0U0',
    category: 'Lifestyle / Career',
    tags: ['google', 'software-engineer', 'day-in-life', 'tech-career', 'bangalore', 'lifestyle'],
    duration: '0:45',
    likes: '512K',
    views: '3.1M',
    semanticTopics: ['software-engineering-career', 'big-tech-culture', 'work-life-balance', 'career-aspiration'],
    contentSignals: {
      topicDepth: 'moderate',
      intentSignal: 'career-exploration',
      careerRelevance: 'direct',
      learningValue: 'moderate',
      techDomain: 'software-engineering',
      emotionalTone: 'aspirational',
      audienceLevel: 'beginner'
    }
  },

  // === TRAP REEL 3: Coding Interview Joke ===
  {
    id: 'R003',
    title: 'POV: Interviewer asks you to reverse a linked list on a whiteboard',
    creator: '@interviewsurvivors',
    description: 'Me: *sweating* "So first we set prev to null..." Interviewer: "You have 3 minutes." Me: *starts writing BFS instead* 💀 #CodingInterview #DSA #TechHumor #SWE',
    thumbnail: '📝',
    videoUrl: 'https://www.youtube.com/watch?v=jXArj8RBq0Q',
    category: 'Coding Interview Humor',
    tags: ['coding-interview', 'dsa', 'linked-list', 'whiteboard', 'humor', 'tech-interview'],
    duration: '0:22',
    likes: '389K',
    views: '2.4M',
    semanticTopics: ['interview-preparation', 'data-structures', 'algorithms', 'tech-hiring', 'developer-humor'],
    contentSignals: {
      topicDepth: 'surface',
      intentSignal: 'interview-awareness',
      careerRelevance: 'direct',
      learningValue: 'low',
      techDomain: 'computer-science',
      emotionalTone: 'humor',
      audienceLevel: 'intermediate'
    }
  },

  // === TRAP REEL 4: Laptop Comparison ===
  {
    id: 'R004',
    title: 'MacBook Pro M4 vs ThinkPad X1 Carbon — honest coding review',
    creator: '@techsetup_guru',
    description: 'After 6 months with both: build times, Docker performance, battery, keyboard feel. Which one wins for serious development work? Spoiler: it depends on your stack. #MacBook #ThinkPad #CodingSetup #DevTools',
    thumbnail: '💻',
    videoUrl: 'https://www.youtube.com/watch?v=CepWQBMOwkk',
    category: 'Gadget Review',
    tags: ['macbook', 'thinkpad', 'laptop', 'coding-setup', 'developer-tools', 'review', 'hardware'],
    duration: '1:30',
    likes: '178K',
    views: '890K',
    semanticTopics: ['developer-tooling', 'hardware-for-coding', 'productivity', 'tech-gear'],
    contentSignals: {
      topicDepth: 'deep',
      intentSignal: 'purchase-research',
      careerRelevance: 'indirect',
      learningValue: 'moderate',
      techDomain: 'developer-productivity',
      emotionalTone: 'informative',
      audienceLevel: 'any'
    }
  },

  // === NON-TRAP: Pure Entertainment ===
  {
    id: 'R005',
    title: 'Cat vs Cucumber Compilation 2026 🥒😂',
    creator: '@funnypets_viral',
    description: 'Cats discovering cucumbers for the first time. Pure chaos. #CatsOfReels #Funny #Viral #Pets',
    thumbnail: '🐱',
    videoUrl: 'https://www.youtube.com/watch?v=ECAiFXiXIFo',
    category: 'Entertainment',
    tags: ['cats', 'funny', 'viral', 'pets', 'entertainment', 'comedy'],
    duration: '0:30',
    likes: '1.2M',
    views: '8.5M',
    semanticTopics: ['entertainment', 'animals', 'viral-content', 'humor'],
    contentSignals: {
      topicDepth: 'none',
      intentSignal: 'entertainment',
      careerRelevance: 'none',
      learningValue: 'none',
      techDomain: 'none',
      emotionalTone: 'humor',
      audienceLevel: 'any'
    }
  },

  // === NON-TRAP: Gaming ===
  {
    id: 'R006',
    title: 'Insane Valorant clutch — 1v5 Ace on Ascent 🔥',
    creator: '@esports_clips',
    description: 'This Jett player just pulled off the most insane 1v5 ace in ranked. Crosshair placement is unreal. #Valorant #Gaming #Esports #FPS #Clutch',
    thumbnail: '🎮',
    videoUrl: 'https://www.youtube.com/watch?v=jlkU_bAI8lM',
    category: 'Gaming',
    tags: ['valorant', 'gaming', 'esports', 'fps', 'clutch', 'ace'],
    duration: '0:35',
    likes: '890K',
    views: '5.2M',
    semanticTopics: ['competitive-gaming', 'esports', 'entertainment', 'fps-games'],
    contentSignals: {
      topicDepth: 'none',
      intentSignal: 'entertainment',
      careerRelevance: 'none',
      learningValue: 'none',
      techDomain: 'none',
      emotionalTone: 'excitement',
      audienceLevel: 'any'
    }
  },

  // === NON-TRAP: AI News ===
  {
    id: 'R007',
    title: 'GPT-5 just dropped — here\'s what changed everything',
    creator: '@ai_frontline',
    description: 'OpenAI released GPT-5 and the benchmarks are insane. Reasoning, coding, multimodal — breakdown of what matters for developers. #AI #GPT5 #MachineLearning #TechNews',
    thumbnail: '🤖',
    videoUrl: 'https://www.youtube.com/watch?v=cpvaZF4gO3g',
    category: 'AI / Tech News',
    tags: ['ai', 'gpt-5', 'openai', 'machine-learning', 'tech-news', 'llm'],
    duration: '1:00',
    likes: '678K',
    views: '4.1M',
    semanticTopics: ['artificial-intelligence', 'large-language-models', 'tech-industry', 'developer-tools-ai'],
    contentSignals: {
      topicDepth: 'moderate',
      intentSignal: 'learning',
      careerRelevance: 'indirect',
      learningValue: 'moderate',
      techDomain: 'artificial-intelligence',
      emotionalTone: 'informative',
      audienceLevel: 'intermediate'
    }
  },

  // === NON-TRAP: Career Advice ===
  {
    id: 'R008',
    title: 'Stop mass applying — here\'s what actually works in 2026 tech hiring',
    creator: '@career_dev_maya',
    description: 'After reviewing 500+ resumes as a hiring manager at a Series B startup: the 3 things that actually get you callbacks. Hint: it\'s not your 47th LeetCode badge. #TechHiring #CareerAdvice #Jobs #SWE',
    thumbnail: '📈',
    videoUrl: 'https://www.youtube.com/shorts/zkesOHqn9jQ',
    category: 'Career Advice',
    tags: ['career', 'tech-hiring', 'resume', 'job-search', 'software-engineering', 'advice'],
    duration: '0:55',
    likes: '334K',
    views: '2.0M',
    semanticTopics: ['career-strategy', 'tech-hiring', 'professional-development', 'job-market'],
    contentSignals: {
      topicDepth: 'deep',
      intentSignal: 'career-planning',
      careerRelevance: 'direct',
      learningValue: 'high',
      techDomain: 'career',
      emotionalTone: 'motivational',
      audienceLevel: 'beginner'
    }
  }
];


/**
 * Recommendation Pool — Curated tech Reels to recommend
 * Each has difficulty, category, and semantic matching signals
 */
export const RECOMMENDATION_POOL = [
  // === SOFTWARE ENGINEERING / CAREER ===
  {
    id: 'T001',
    title: 'System Design 101: How Netflix handles 250M users',
    creator: '@system_design_daily',
    description: 'Load balancing, CDNs, microservices — the architecture behind your binge sessions. Great intro for aspiring SWEs.',
    category: 'HLD',
    difficulty: 'Beginner',
    tags: ['system-design', 'netflix', 'architecture', 'scalability'],
    semanticMatch: ['software-engineering-career', 'tech-industry', 'career-aspiration', 'interview-preparation'],
    qualityScore: 0.92,
    isHype: false
  },
  {
    id: 'T002',
    title: 'How I went from 0 to SDE-2 at Amazon in 18 months',
    creator: '@growth_engineer',
    description: 'Real talk about upskilling, mentorship, and navigating big tech. No shortcuts, just systems that worked.',
    category: 'Career',
    difficulty: 'Beginner',
    tags: ['career-growth', 'amazon', 'software-engineer', 'mentorship'],
    semanticMatch: ['software-engineering-career', 'big-tech-culture', 'career-aspiration', 'professional-development'],
    qualityScore: 0.89,
    isHype: false
  },
  {
    id: 'T003',
    title: 'VS Code setup that actually boosted my productivity (not clickbait)',
    creator: '@devtools_honest',
    description: 'Extensions, keybindings, and terminal config that saved me 2 hours/week. Measured with actual data.',
    category: 'Other',
    difficulty: 'Beginner',
    tags: ['vscode', 'productivity', 'developer-tools', 'setup'],
    semanticMatch: ['developer-tooling', 'productivity', 'hardware-for-coding', 'coding-culture'],
    qualityScore: 0.88,
    isHype: false
  },
  {
    id: 'T004',
    title: 'Linked List operations visualized — finally makes sense',
    creator: '@visual_dsa',
    description: 'Animated walkthrough of insert, delete, reverse operations. See the pointers move in real time.',
    category: 'DSA',
    difficulty: 'Beginner',
    tags: ['linked-list', 'data-structures', 'visualization', 'dsa'],
    semanticMatch: ['data-structures', 'algorithms', 'interview-preparation', 'computer-science'],
    qualityScore: 0.91,
    isHype: false
  },
  {
    id: 'T005',
    title: 'Why your microservices are actually a distributed monolith',
    creator: '@arch_patterns',
    description: 'Common anti-patterns in microservice architectures and how to fix them. Real production examples.',
    category: 'HLD',
    difficulty: 'Advanced',
    tags: ['microservices', 'architecture', 'anti-patterns', 'distributed-systems'],
    semanticMatch: ['software-engineering-career', 'software-development', 'tech-industry'],
    qualityScore: 0.90,
    isHype: false
  },

  // === AI / ML ===
  {
    id: 'T006',
    title: 'Build your own AI agent in 20 lines of Python',
    creator: '@ai_practical',
    description: 'Using LangChain and GPT API to create a simple autonomous agent. Code walkthrough included.',
    category: 'AI',
    difficulty: 'Intermediate',
    tags: ['ai-agent', 'langchain', 'python', 'llm', 'tutorial'],
    semanticMatch: ['artificial-intelligence', 'large-language-models', 'developer-tools-ai', 'software-development'],
    qualityScore: 0.87,
    isHype: false
  },
  {
    id: 'T007',
    title: 'RAG explained: How ChatGPT plugins actually work',
    creator: '@ml_under_hood',
    description: 'Retrieval-Augmented Generation demystified. Vector databases, embeddings, and the retrieval pipeline.',
    category: 'AI',
    difficulty: 'Intermediate',
    tags: ['rag', 'vector-database', 'embeddings', 'chatgpt', 'ai'],
    semanticMatch: ['artificial-intelligence', 'large-language-models', 'tech-industry'],
    qualityScore: 0.93,
    isHype: false
  },
  {
    id: 'T008',
    title: 'Neural networks from scratch in NumPy — no frameworks',
    creator: '@deep_fundamentals',
    description: 'Forward pass, backprop, gradient descent — implemented line by line. Understanding > using.',
    category: 'AI',
    difficulty: 'Advanced',
    tags: ['neural-networks', 'numpy', 'deep-learning', 'from-scratch'],
    semanticMatch: ['artificial-intelligence', 'computer-science', 'algorithms'],
    qualityScore: 0.94,
    isHype: false
  },

  // === JAVA / PROGRAMMING ===
  {
    id: 'T009',
    title: 'Java Streams API — write cleaner code in 5 minutes',
    creator: '@java_modern',
    description: 'Map, filter, reduce patterns that replace verbose loops. Modern Java isn\'t your professor\'s Java.',
    category: 'Java',
    difficulty: 'Intermediate',
    tags: ['java', 'streams', 'functional-programming', 'clean-code'],
    semanticMatch: ['java-programming', 'software-development', 'coding-culture'],
    qualityScore: 0.82,
    isHype: false
  },
  {
    id: 'T010',
    title: 'Spring Boot microservices — production checklist you\'re missing',
    creator: '@java_prod',
    description: 'Health checks, circuit breakers, structured logging, graceful shutdown. The stuff tutorials skip.',
    category: 'Java',
    difficulty: 'Advanced',
    tags: ['spring-boot', 'microservices', 'production', 'java', 'devops'],
    semanticMatch: ['java-programming', 'software-engineering-career', 'software-development'],
    qualityScore: 0.88,
    isHype: false
  },

  // === CYBERSECURITY ===
  {
    id: 'T011',
    title: 'I hacked my own WiFi in 10 minutes — here\'s how',
    creator: '@ethical_hacker_raj',
    description: 'WPA2 handshake capture + dictionary attack demo on my own network. Legal, educational, and eye-opening.',
    category: 'Cybersecurity',
    difficulty: 'Intermediate',
    tags: ['cybersecurity', 'ethical-hacking', 'wifi', 'penetration-testing'],
    semanticMatch: ['cybersecurity', 'tech-industry', 'computer-science'],
    qualityScore: 0.86,
    isHype: false
  },
  {
    id: 'T012',
    title: 'SQL injection still works in 2026 — live demo on a test app',
    creator: '@appsec_daily',
    description: 'How to find, exploit, and patch SQL injection. Every developer needs to know this.',
    category: 'Cybersecurity',
    difficulty: 'Beginner',
    tags: ['sql-injection', 'web-security', 'appsec', 'owasp'],
    semanticMatch: ['cybersecurity', 'software-development', 'developer-tooling'],
    qualityScore: 0.85,
    isHype: false
  },

  // === CLOUD ===
  {
    id: 'T013',
    title: 'Deploy your app on AWS for ₹0 — free tier deep dive',
    creator: '@cloud_on_budget',
    description: 'EC2, S3, Lambda — what\'s actually free, what\'s a trap, and how to set billing alerts. Student-friendly.',
    category: 'Cloud',
    difficulty: 'Beginner',
    tags: ['aws', 'cloud', 'free-tier', 'deployment', 'student'],
    semanticMatch: ['developer-tooling', 'software-engineering-career', 'career-aspiration'],
    qualityScore: 0.87,
    isHype: false
  },
  {
    id: 'T014',
    title: 'Kubernetes explained with pizza delivery 🍕',
    creator: '@devops_visual',
    description: 'Pods, nodes, services, ingress — mapped to a pizza shop analogy. Finally makes sense.',
    category: 'Cloud',
    difficulty: 'Beginner',
    tags: ['kubernetes', 'devops', 'containers', 'analogy'],
    semanticMatch: ['developer-tooling', 'software-development', 'tech-industry'],
    qualityScore: 0.90,
    isHype: false
  },

  // === HARDWARE ===
  {
    id: 'T015',
    title: 'How CPUs actually execute your code — visual breakdown',
    creator: '@hardware_explained',
    description: 'Fetch, decode, execute, pipeline stalls. See what happens after you press "Run".',
    category: 'Hardware',
    difficulty: 'Intermediate',
    tags: ['cpu', 'hardware', 'computer-architecture', 'performance'],
    semanticMatch: ['hardware-for-coding', 'computer-science', 'tech-gear'],
    qualityScore: 0.91,
    isHype: false
  },
  {
    id: 'T016',
    title: 'Raspberry Pi home server — NAS + VPN + Pi-hole in one weekend',
    creator: '@diy_tech_projects',
    description: 'Step-by-step weekend project. Block ads, self-host files, and secure your network.',
    category: 'Hardware',
    difficulty: 'Intermediate',
    tags: ['raspberry-pi', 'homelab', 'vpn', 'nas', 'diy'],
    semanticMatch: ['hardware-for-coding', 'developer-tooling', 'tech-gear', 'productivity'],
    qualityScore: 0.84,
    isHype: false
  },

  // === DSA ===
  {
    id: 'T017',
    title: 'Graph algorithms you WILL see in interviews — BFS & DFS visual guide',
    creator: '@algo_animated',
    description: 'Breadth-first vs Depth-first traversal animated on real interview problems. Pattern recognition tips.',
    category: 'DSA',
    difficulty: 'Intermediate',
    tags: ['graphs', 'bfs', 'dfs', 'algorithms', 'interview'],
    semanticMatch: ['algorithms', 'data-structures', 'interview-preparation', 'computer-science'],
    qualityScore: 0.93,
    isHype: false
  },
  {
    id: 'T018',
    title: 'Dynamic Programming isn\'t hard — you\'re just learning it wrong',
    creator: '@dsa_decoded',
    description: 'The mental model shift that makes DP click. Starts from recursion, builds to tabulation.',
    category: 'DSA',
    difficulty: 'Intermediate',
    tags: ['dynamic-programming', 'recursion', 'algorithms', 'dsa'],
    semanticMatch: ['algorithms', 'data-structures', 'interview-preparation', 'computer-science'],
    qualityScore: 0.95,
    isHype: false
  },

  // === CAREER ===
  {
    id: 'T019',
    title: 'How to build a portfolio that actually gets you hired',
    creator: '@hired_dev',
    description: 'Stop adding calculator apps. What hiring managers actually look for in your GitHub and portfolio.',
    category: 'Career',
    difficulty: 'Beginner',
    tags: ['portfolio', 'github', 'hiring', 'career', 'projects'],
    semanticMatch: ['career-strategy', 'professional-development', 'career-aspiration', 'software-engineering-career'],
    qualityScore: 0.88,
    isHype: false
  },
  {
    id: 'T020',
    title: 'Open source contributions — your unfair advantage for getting hired',
    creator: '@oss_for_careers',
    description: 'How to find beginner-friendly issues, make meaningful PRs, and leverage them in interviews.',
    category: 'Career',
    difficulty: 'Beginner',
    tags: ['open-source', 'github', 'career', 'contributions', 'hiring'],
    semanticMatch: ['career-strategy', 'professional-development', 'software-development', 'coding-culture'],
    qualityScore: 0.86,
    isHype: false
  },

  // === HYPE / CLICKBAIT (should be filtered out) ===
  {
    id: 'T021',
    title: '10 AI tools that will get you a ₹50 LPA job guaranteed!! 🚀🔥',
    creator: '@hustle_tech_bro',
    description: 'These AI tools are INSANE. Use them and companies will BEG you to join. Link in bio for my ₹9999 course.',
    category: 'AI',
    difficulty: 'Beginner',
    tags: ['ai-tools', 'jobs', 'guaranteed', 'hustle'],
    semanticMatch: ['artificial-intelligence', 'career-strategy'],
    qualityScore: 0.25,
    isHype: true
  },
  {
    id: 'T022',
    title: 'Learn Java in 24 hours — complete roadmap (NO ONE talks about this)',
    creator: '@clickbait_coder',
    description: 'This secret Java roadmap will make you a pro developer overnight. Just follow these 47 steps.',
    category: 'Java',
    difficulty: 'Beginner',
    tags: ['java', 'roadmap', 'learn-fast', 'secret'],
    semanticMatch: ['java-programming', 'career-strategy'],
    qualityScore: 0.20,
    isHype: true
  },
  {
    id: 'T023',
    title: 'You DON\'T need a degree — just mass apply to 500 companies daily!',
    creator: '@grind_culture',
    description: 'Forget college, forget DSA, just spam applications and you\'ll get hired. Trust the process.',
    category: 'Career',
    difficulty: 'Beginner',
    tags: ['career', 'no-degree', 'mass-apply', 'hustle'],
    semanticMatch: ['career-strategy', 'job-market'],
    qualityScore: 0.15,
    isHype: true
  }
];

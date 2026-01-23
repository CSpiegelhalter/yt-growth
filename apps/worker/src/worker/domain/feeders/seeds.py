"""
Intent seed queries for video discovery.

Responsibility: Provide constant seed queries and window configurations.
Depends on: Nothing.
Does not depend on: Any external I/O, config, or infrastructure.
"""

# Generic intent patterns that work across niches
INTENT_SEEDS = [
    # Instructional patterns
    "how to",
    "tutorial",
    "beginner guide",
    "complete guide",
    "ultimate guide",
    "step by step",
    "learn",
    "course",
    "masterclass",
    "explained",
    "for beginners",
    "basics",
    "introduction to",
    
    # Experiential patterns
    "I tried",
    "trying",
    "testing",
    "first time",
    "my experience",
    "honest opinion",
    "my thoughts on",
    "after one year",
    "update",
    "follow up",
    "results",
    
    # Review/comparison patterns
    "review",
    "honest review",
    "vs comparison",
    "versus",
    "which is better",
    "best",
    "worst",
    "tier list",
    "ranking",
    "top 10",
    "top 5",
    
    # Transformation patterns
    "before and after",
    "transformation",
    "makeover",
    "glow up",
    "progress",
    "journey",
    
    # Challenge/entertainment patterns
    "challenge",
    "day in the life",
    "routine",
    "vlog",
    "reacting to",
    "reaction",
    
    # Knowledge patterns
    "what I learned",
    "mistakes",
    "things I wish",
    "nobody tells you",
    "secrets",
    "hack",
    "tips",
    "tricks",
    "pro tips",
    
    # Building/making patterns
    "building",
    "making",
    "creating",
    "DIY",
    "setup",
    "fixing",
    "repair",
    "restoration",
    
    # Lifestyle patterns
    "morning routine",
    "night routine",
    "day in my life",
    "weekly",
    "monthly",
    
    # Analysis patterns
    "analysis",
    "breakdown",
    "deep dive",
    "in depth",
    "why",
    "how",
    
    # Emotional triggers
    "stop doing",
    "start doing",
    "why I",
    "switching to",
    "upgrading",
    "downgrading",
    "quitting",
    "leaving",
    "starting",
    
    # Question patterns
    "should you",
    "is it worth",
    "do you need",
    "can you",
]

# Window configurations for search
# Each window uses a mix of orders to get both fresh content and proven performers
WINDOWS = {
    "24h": {"days": 1, "order": "date"},      # Fresh content first
    "7d": {"days": 7, "order": "viewCount"},  # Top performers in last week
    "30d": {"days": 30, "order": "viewCount"}, # Proven winners
    "90d": {"days": 90, "order": "viewCount"}, # Long-term winners
}

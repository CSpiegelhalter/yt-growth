Which metrics matter? What do APV, AVD, CTR, weighted z-score mean?

Core YouTube growth pillars

Discovery: can people find/click it? → Impressions, CTR

Retention: do they keep watching? → AVD, APV, retention curve

Engagement/Conversion: do they interact/subscribe? → likes/comments/subs per view

Cadence/Fit: do you post consistently on topics your audience loves?

Definitions & quick formulas

Impressions: times a thumbnail was shown.

Views: counted views (YouTube rules apply).

CTR (Click-Through Rate): % of impressions that became views.
CTR = views / impressions

AVD (Average View Duration): avg watch time (seconds).
Higher AVD = stronger overall retention.

APV (Average Percentage Viewed): fraction of the video watched on average (0–1 or %).
APV = AVD / duration

Views/Day (velocity): views normalized by age.
views_per_day = total_views / max(days_since_publish, 1)

Subs per 1k Views: conversion to subscribers.
subs_per_1k = net_subs_gained / (views/1000)

Engagement per 1k: (likes + comments) / (views/1000)

Why “weighted z-score”?

Raw values aren’t comparable across channels/videos. A z-score tells you how far a video is from your channel’s average in standard deviations:

z = (value − mean) / std

Then we combine multiple z-scores with weights to get a single Health Score (0–100):

Health = 50 + 15 * (
   0.35*z(views/day) +
   0.25*z(CTR) +
   0.20*z(APV) +
   0.10*z(subs/1k) +
   0.10*z(engagement/1k)
)


Interpretation:

50 = average; >70 = doing great; <40 = needs attention.

Practical cutoffs you can surface

Weak hook: APV < 0.35 or AVD < 0.25 * duration

Low CTR: < 3.5% (context: depends on surface; Search CTR norms differ from Browse)

Underperformer: views/day z-score < −1.0 vs. your 28-day median (same duration bucket)
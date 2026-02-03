# Demo Insight Cards for Valorant AI Assistant Coach

This document contains three ready-to-show demo insight cards for the UI, plus a 45-second video/GIF storyboard.

---

## Insight Card A — "Late Smoke Timing on B-Site (Controller: Player03)"

**TITLE:** Late Smoke Timing — B-site Retakes

**PLAYER:** Player03 (Controller)

**ISSUE:** 11/18 executes on B site used smoke in 'postplant' phase or >1.0s after entry, allowing opponents to reposition.

**IMPACT:** Increases opponent retake success by estimated +12% (demo model).

**RECOMMENDATION:** Move smoke timing to 0.6–1.0s before final entry; practice 5x synchronized smoke+entry drills.

**CONFIDENCE:** 78% (evidence count: 11 clips)

**EVIDENCE:** round_no [12: clip_12_03], [19: clip_19_03], [34: clip_34_03], [41: clip_41_03], [52: clip_52_03], [58: clip_58_03], [67: clip_67_03], [73: clip_73_03], [81: clip_81_03], [89: clip_89_03], [95: clip_95_03]

**BUTTONS:**

- [Play Evidence]
- [Add to Practice: Smoke Timing (5x)]
- [Mark Implemented]

**Design hint:** Show a small timeline with the smoke cast moments highlighted and a tiny heatmap of "postplant smoke occurrences."

---

## Insight Card B — "Peek Latency — Duelist Player01"

**TITLE:** Reaction / Peek Latency on Entry Frags

**PLAYER:** Player01 (Duelist)

**ISSUE:** First-shot latency after enemy reveal averages 320 ms (vs expected ~180ms for top duelists).

**IMPACT:** Player01 dies first in 42% of contested peeks; expected entry frag uplift ≈ +3% if latency reduced.

**RECOMMENDATION:** Add 3x 2-minute pre-aim and reaction drills in warmup; run 'sound-cue drills' in practice to reduce latency by ~100ms.

**CONFIDENCE:** 71% (evidence count: 9 clips)

**EVIDENCE:** round_no [3:clip_03_01], [7:clip_07_01], [18:clip_18_01], [25:clip_25_01], [33:clip_33_01], [47:clip_47_01], [59:clip_59_01], [72:clip_72_01], [88:clip_88_01]

**BUTTONS:**

- [Play Clip]
- [Assign Drill: Reaction Warmups]
- [Share with Player]

**Design hint:** Show a small gauge with "latency distribution" and sample frames showing the reveal → shot timeline.

---

## Insight Card C — "Rotation Spread — Team-wide"

**TITLE:** Rotation Arrival Spread Exceeds 3s

**SCOPE:** Team-level (all players)

**ISSUE:** For mid-round rotates, arrival stddev = 3.6s leading to failed retake windows.

**IMPACT:** In target situations, coordination failures reduce retake success by approx -9%.

**RECOMMENDATION:** Standardize 'taxi' role and practice a 30s 'sprint-to-site' drill; define one rotation call and set arrival windows.

**CONFIDENCE:** 84%

**EVIDENCE:** rounds [5, 14, 27, 45, 66, 78, 91] → clip samples

**BUTTONS:**

- [Show Timeline]
- [Create Team Drill: Rotate Sync (10 reps)]
- [Export to Practice Planner]

**Design hint:** Show small swimlane timeline with each player's arrival time and a shaded window showing the ideal arrival interval.

---

## 45-Second Recording / GIF Storyboard

**Goal:** A short demo GIF or MP4 that shows the app in action (use screen recorder: OBS, QuickTime, or a GIF tool). Record at 1280×720 for small size.

### Storyboard (45s total)

**0–3s:** Intro frame — app hero with match summary (map Ascent, Match mock_match_001).

**3–10s:** Click Round 12 → open round-level view showing mini heatmaps and "Top Insights (3)" header.

**10–22s:** Click Insight Card A (Late Smoke Timing). Play evidence clip (5s) showing smoke cast + opponent reposition. Show the little timeline highlighting the smoke cast moment.

**22–30s:** Click Add to Practice → a modal "Create Drill" appears with defaults (name: Smoke Timing Drill, reps: 5, duration: 5m). Click Save & Assign and select Player03.

**30–40s:** Show Practice Planner briefly with new drill listed, drag to week schedule, show "Assigned to Player03".

**40–45s:** Final frame — show KPI panel with "predicted post-implementation improvement" badge (e.g., "expected retake success +6%") and call-to-action: "Run pilot → Measure in 4 weeks".

### Recording Tips

- Keep mouse movement deliberate and slow (no jerky motion).
- Use zoomed-in crop when playing clips so faces/frames are visible.
- Add a small caption overlay on each scene (e.g., "Open Insight", "Play Evidence", "Create Drill").
- Export a 45s MP4, trim silent bits, and convert to GIF if desired (GIF large — prefer MP4).

---

## JSON Structure for UI Integration

Each insight card can be represented as JSON for easy integration:

```json
{
  "insight_id": "insight_a_late_smoke",
  "title": "Late Smoke Timing — B-site Retakes",
  "player_id": "p03",
  "player_name": "Player03",
  "role": "Controller",
  "issue": "11/18 executes on B site used smoke in 'postplant' phase or >1.0s after entry",
  "impact": "+12% opponent retake success",
  "recommendation": "Move smoke timing to 0.6–1.0s before final entry; practice 5x synchronized smoke+entry drills",
  "confidence": 0.78,
  "evidence_count": 11,
  "evidence_clips": [
    { "round_no": 12, "clip_id": "clip_12_03", "timestamp": "00:12:34" },
    { "round_no": 19, "clip_id": "clip_19_03", "timestamp": "00:19:12" },
    { "round_no": 34, "clip_id": "clip_34_03", "timestamp": "00:34:56" }
  ],
  "actions": [
    { "type": "play_evidence", "label": "Play Evidence" },
    {
      "type": "add_drill",
      "label": "Add to Practice: Smoke Timing (5x)",
      "drill_name": "Smoke Timing Drill",
      "reps": 5,
      "duration_min": 5
    },
    { "type": "mark_implemented", "label": "Mark Implemented" }
  ]
}
```

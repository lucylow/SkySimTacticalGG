# Microcopy Guide

This document contains all user-facing text (microcopy) for the application. Use these exact phrases to ensure consistency and clarity.

## Hero Section

### Main Headline

**Current**: "The AI-Powered Esports Coaching Revolution"
**Value Prop**: "Transform raw match data into winning strategies with our comprehensive assistant coach platform. Powered by GRID data and HY-Motion 1.0."

### 3-Step CTA

1. "Paste your match data or prompt"
2. "AI analyzes and generates recommendations"
3. "Review, accept, or adjust the insights"

### Primary CTA Button

- **Default**: "Try Demo"
- **Alternative**: "Get Started"

### Secondary CTA Button

- "Watch Demo"

## AI Playground

### Prompt Editor

**Label**: "Prompt"

**Placeholder Text**:

- Default: "Try: Audit product catalog and suggest 3 quick UI changes that increase CTR"
- Alternative: "Ask the AI agent to analyze data, search patterns, or generate insights..."

**Helper Text**:

- "⌘+Enter to run"

**Sample Prompts** (Quick Actions):

1. "Analyze player performance trends and suggest improvements"
2. "Search for patterns in recent match data"
3. "Help me understand team coordination issues"
4. "Generate a training plan for the team"

**Button States**:

- **Idle**: "Run analysis"
- **Running**: "Stop stream"
- **Disabled**: Button disabled when prompt is empty

### Agent Console

**Header**:

- **Label**: "Console"
- **Streaming Indicator**: "Analyzing..." (with spinner icon)
- **Empty State**:
  - "No messages yet"
  - "Write a prompt and run the agent"

**Message Types**:

- **User**: "USER" badge
- **Assistant**: "ASSISTANT" badge
- **Tool**: "TOOL" badge

**Loading State**: "Thinking..." (with spinner)

### Toolbox

**Header**: "Available Tools"

**Tool Output Format**:

- "Tool: `analyze_catalog(top=5)` • Completed in 120ms"
- "Tool: `search_patterns(query=...)` • Completed in 85ms"

**Empty State**: "No tools executed yet"

### Timeline

**Header**: "Timeline"

**Event Types**:

- "Agent started"
- "Tool called: [tool_name]"
- "Recommendation generated"
- "Analysis complete"

**Empty State**: "No events yet"

### Memory Panel

**Header**: "Memory"

**Memory Item Format**:

- "User preference: [preference]"
- "Context: [context]"

**Empty State**: "No memories stored"

### Events Log

**Header**: "Events Log"

**Event Format**:

- "[timestamp] - [event_type]: [description]"

## Dashboard

### Stats Cards

**Labels**:

- "Win Rate"
- "K/D Ratio"
- "Average Round Time"
- "Team Coordination Score"

**Trend Indicators**:

- "+X%" (up)
- "-X%" (down)
- "No change"

### Performance Chart

**Title**: "Performance Over Time"
**X-axis**: "Date"
**Y-axis**: "Score"

### Player Cards

**Action Buttons**:

- "View Details"
- "Analyze Performance"

## Error States

### Generic Error

**Title**: "Something went wrong"
**Message**: "We encountered an error. Please try again."
**Action**: "Retry"

### Network Error

**Title**: "Connection lost"
**Message**: "Unable to connect to the server. Check your internet connection."
**Action**: "Retry"

### Validation Error

**Title**: "Invalid input"
**Message**: "[Specific validation message]"
**Action**: "Fix"

## Success States

### Action Completed

**Message**: "[Action] completed successfully"
**Undo Option**: "Undo" (if applicable)

### Data Saved

**Message**: "Changes saved"

### Analysis Complete

**Message**: "Analysis complete. Review recommendations below."

## Loading States

### Initial Load

**Message**: "Loading..."

### Streaming

**Message**: "Analyzing..." (with spinner)
**Alternative**: "Streaming response..."

### Processing

**Message**: "Processing..." (with spinner)

## Confidence Badge

**Format**: "[XX]%"
**Tooltip**: "[XX]% — model confidence. Click 'Explain' for evidence & tool calls."
**Explain Button**: "Explain"

## Onboarding Tour

### Step 1: Prompt Editor

**Title**: "Prompt Editor"
**Content**: "Start here! Type your question or paste match data. Try sample prompts or use ⌘+Enter to run."

### Step 2: Run Agent

**Title**: "Run Analysis"
**Content**: "Click 'Run Agent' to start. The AI will analyze your data and stream results in real-time."

### Step 3: View Results

**Title**: "View Results"
**Content**: "Watch the AI's analysis appear here. You'll see tool calls, reasoning, and recommendations."

**Navigation**:

- "Previous"
- "Next"
- "Get Started" (final step)
- "Skip" (close button)

## Accessibility

### Screen Reader Announcements

**Streaming Start**: "Agent started analyzing"
**Streaming Update**: "New response received"
**Streaming Complete**: "Analysis complete"
**Error**: "Error: [error message]"

### ARIA Labels

**Buttons**:

- "Run AI agent analysis"
- "Stop agent execution"
- "Clear conversation"
- "Undo last action"

**Form Controls**:

- "Prompt editor for AI agent"
- "Agent conversation log"

**Status**:

- "Agent is streaming response"
- "Loading data"

## Empty States

### No Data

**Icon**: Relevant icon (Bot, Database, etc.)
**Title**: "No [item] yet"
**Description**: "[Action] to get started"
**CTA**: "[Primary action button]"

### No Results

**Title**: "No results found"
**Description**: "Try adjusting your search or filters"
**Action**: "Clear filters"

## Tooltips

### Confidence Badge

"[XX]% — model confidence. Click 'Explain' for evidence & tool calls."

### Tool Output

"Tool: [tool_name] • Completed in [time]ms"

### Timestamp

"[Formatted time] — [relative time]"

## Notifications

### Toast Messages

**Success**:

- "[Action] completed successfully"
- "Changes saved"

**Error**:

- "[Action] failed. Please try again."
- "Unable to [action]. [Reason]."

**Info**:

- "New data available"
- "Analysis in progress"

**With Undo**:

- "[Action] completed"
- "You can undo this action" (description)
- "Undo" (button)

## Form Validation

### Required Field

"This field is required"

### Invalid Format

"Please enter a valid [format]"

### Too Short

"[Field] must be at least [N] characters"

### Too Long

"[Field] must be no more than [N] characters"

## Navigation

### Breadcrumbs

"Home > [Section] > [Page]"

### Page Titles

- "Dashboard"
- "Match Analysis"
- "Player Development"
- "AI Playground"
- "Assistant Coach"

## Footer

**Text**: "Mock AI Agent • Streaming SSE simulation • No backend required"

## Best Practices

1. **Be Concise**: Keep messages under 160 characters when possible
2. **Be Actionable**: Tell users what they can do next
3. **Be Specific**: Avoid generic messages like "Error occurred"
4. **Use Active Voice**: "Analysis complete" not "Analysis has been completed"
5. **Match Tone**: Professional but approachable
6. **Consistent Terminology**: Use the same words for the same concepts
7. **Include Context**: "Unable to save" → "Unable to save changes. Check your connection."

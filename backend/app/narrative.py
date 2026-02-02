"""
LLM-based narrative generation service.
Converts events + agent signals into analyst-style commentary.
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import os

router = APIRouter()


class NarrativeRequest(BaseModel):
    events: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]
    tone: str = "analyst"  # analyst, coach, casual
    length: str = "short"  # short, medium, long


class NarrativeService:
    """Generates narrative text from events and insights."""
    
    def __init__(self):
        self.use_llm = os.getenv("OPENAI_API_KEY") is not None
        self.llm_client = None
        
        if self.use_llm:
            try:
                from openai import OpenAI
                self.llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            except ImportError:
                self.use_llm = False
    
    def generate(self, req: NarrativeRequest) -> Dict[str, Any]:
        """Generate narrative from request."""
        if self.use_llm and self.llm_client:
            return self._llm_generate(req)
        else:
            return self._template_generate(req)
    
    def _llm_generate(self, req: NarrativeRequest) -> Dict[str, Any]:
        """Generate using LLM."""
        prompt = self._build_prompt(req)
        
        try:
            response = self.llm_client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {
                        "role": "system",
                        "content": "You are an esports analyst. Only reference facts from the provided evidence. Do not invent events."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            narrative = response.choices[0].message.content
            
            return {
                "narrative": narrative,
                "citations": [e.get("event_id") for e in req.events if e.get("event_id")],
                "status": "PENDING_REVIEW",
                "tone": req.tone,
                "length": req.length
            }
        except Exception as e:
            # Fallback to template
            return self._template_generate(req)
    
    def _template_generate(self, req: NarrativeRequest) -> Dict[str, Any]:
        """Generate using templates (fallback)."""
        events = req.events
        insights = req.insights
        
        # Extract key stats
        kills = len([e for e in events if e.get("event_type") == "KILL"])
        rounds = len(set(e.get("round", 0) for e in events))
        
        momentum_insights = [i for i in insights if i.get("type") == "MOMENTUM_SHIFT"]
        
        if momentum_insights:
            insight = momentum_insights[0]
            narrative = (
                f"After a slow start, Team {insight.get('entities', ['Unknown'])[0]} "
                f"seized control with a decisive {insight.get('explanation', {}).get('rounds_won', 0)}-round streak, "
                f"anchored by consistent opening kills and economic advantage."
            )
        else:
            narrative = (
                f"In this {rounds}-round sequence, {kills} kills were recorded. "
                f"The match remains competitive with both teams trading rounds."
            )
        
        return {
            "narrative": narrative,
            "citations": [e.get("event_id") for e in events[:5] if e.get("event_id")],
            "status": "AUTO_GENERATED",
            "tone": req.tone,
            "length": req.length
        }
    
    def _build_prompt(self, req: NarrativeRequest) -> str:
        """Build LLM prompt from request."""
        events_summary = self._summarize_events(req.events)
        insights_summary = self._summarize_insights(req.insights)
        
        return f"""
You are an esports analyst. ONLY reference the evidence below. Do not invent facts.

EVIDENCE:
Events (chronological): {events_summary}
Derived features: {insights_summary}

TASK:
Write a {req.tone} {req.length} summary (4-6 sentences) explaining the key plays.
Explain *why* they worked.
Avoid predictions or betting language.
"""

    def _summarize_events(self, events: List[Dict]) -> str:
        """Summarize events for prompt."""
        summary = []
        for e in events[:20]:  # Limit to first 20
            summary.append(f"{e.get('event_type', 'UNKNOWN')} at round {e.get('round', 0)}")
        return "; ".join(summary)
    
    def _summarize_insights(self, insights: List[Dict]) -> str:
        """Summarize insights for prompt."""
        if not insights:
            return "No AI insights"
        return "; ".join([f"{i.get('type')} (confidence: {i.get('confidence', 0):.2f})" for i in insights])


# Global service instance
narrative_service = NarrativeService()


@router.post("/narrative")
async def generate_narrative(req: NarrativeRequest):
    """Generate narrative from events and insights."""
    try:
        result = narrative_service.generate(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



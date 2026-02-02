"""
Prompt Generator Agent
Converts scene descriptors and character analysis into HY-Motion prompts.
Uses motion vocabulary and agent-specific styles from the architecture doc.
"""
from typing import Dict, Any, List

# Agent to Motion Style Mapping (from tacticalPromptEngine.ts)
AGENT_MOTION_STYLES = {
    "Jett": "light, acrobatic, and fluid",
    "Brimstone": "deliberate, heavy, and authoritative",
    "Sage": "calm, measured, and supportive",
    "Sova": "precise, methodical, and calculated",
    "Omen": "smooth, elusive, and unpredictable",
    "Phoenix": "aggressive, dynamic, and confident",
    "Raze": "explosive, energetic, and bold",
    "Breach": "powerful, forceful, and decisive",
    "Cypher": "methodical, patient, and observant",
    "Viper": "controlled, strategic, and calculated",
    "Reyna": "dominant, confident, and aggressive",
    "Killjoy": "organized, precise, and tactical",
    "Skye": "fluid, natural, and adaptive",
    "Yoru": "agile, deceptive, and quick",
    "Astra": "mystical, controlled, and strategic",
    "KAYO": "direct, efficient, and tactical",
    "Chamber": "precise, elegant, and calculated",
    "Neon": "fast, energetic, and dynamic",
    "Fade": "smooth, tracking, and methodical",
    "Harbor": "steady, protective, and strategic",
    "Gekko": "playful, adaptive, and quick",
    "Deadlock": "methodical, defensive, and patient",
    "Iso": "precise, focused, and controlled",
    "Clove": "adaptive, versatile, and strategic",
}

def build_motion_prompt(scene_descriptor: Dict[str, Any]) -> str:
    """
    Build HY-Motion prompt from scene descriptor.
    
    Uses motion vocabulary mapping and agent-specific styles from the doc.
    
    Args:
        scene_descriptor: Scene descriptor with characters, game state, tactical directive
    
    Returns:
        Natural language prompt string for HY-Motion
    """
    characters = scene_descriptor.get("characters", [])
    tactical_directive = scene_descriptor.get("tactical_directive", "")
    game_state = scene_descriptor.get("game_state", {})
    
    sentences = []
    
    # Build prompt for each character
    for char in characters:
        agent = char.get("agent", "Unknown")
        movement_style = char.get("movement_style", AGENT_MOTION_STYLES.get(agent, "professional and tactical"))
        
        # Emotional state
        severity = char.get("severity", 0)
        if severity > 0.5:
            emotion = "focused but pressured"
        elif severity > 0.3:
            emotion = "cautious and anticipatory"
        else:
            emotion = "calm and ready"
        
        # Physical stance
        is_crouching = char.get("is_crouching", False)
        is_moving = char.get("is_moving", False)
        
        if is_crouching:
            stance = "crouched and stationary"
        elif is_moving:
            stance = "ready to strafe"
        else:
            stance = "standing in a tactical stance"
        
        # Predicted action
        grid_snapshot = char.get("grid_snapshot", {})
        predicted_action = grid_snapshot.get("predicted_action", "holding_angle")
        
        # Build character sentence
        sentence = (
            f"A {agent} agent, moving in a {movement_style} manner. "
            f"They appear {emotion}. "
            f"They are {stance}. "
            f"The player {predicted_action} with decisive urgency."
        )
        sentences.append(sentence)
    
    # Combine character descriptions
    prompt = " ".join(sentences)
    
    # Add tactical directive
    if tactical_directive:
        prompt += f" {tactical_directive}"
    
    # Add game state context if available
    round_phase = game_state.get("round_phase", "")
    if round_phase:
        phase_context = {
            "pre_round": "Players are preparing for the round start.",
            "mid_round": "Players are executing tactical maneuvers.",
            "post_plant": "The spike is planted, players are in post-plant positions.",
            "retake": "Players are coordinating a retake attempt.",
        }
        if round_phase in phase_context:
            prompt += f" {phase_context[round_phase]}"
    
    return prompt.strip()

def build_scene_descriptor(
    match_id: str,
    round: int,
    round_meta: Dict[str, Any],
    characters: List[Dict[str, Any]],
    directive: str = ""
) -> Dict[str, Any]:
    """
    Build a scene descriptor from match data.
    
    Args:
        match_id: Match identifier
        round: Round number
        round_meta: Round metadata (game state, etc.)
        characters: Character descriptors from micro detector
        directive: Tactical directive
    
    Returns:
        Scene descriptor dict
    """
    return {
        "scene_id": f"{match_id}_{round}",
        "game_state": round_meta,
        "characters": characters,
        "tactical_directive": directive,
    }

from app.agents.base import AgentBase
from app.agents.registry import register_agent

@register_agent
class PromptGenerator(AgentBase):
    name = "prompt_generator"
    capabilities = ["nl_generation"]
    priority = 8
    default_timeout_s = 8

    def run(self, payload):
        # payload contains scene descriptor or micro results
        characters = payload.get("characters", [])
        lines = []
        for c in characters:
            lines.append(f"{c['id']} moves in a {c.get('movement_style','steady')} style; inference: {c['inference']}.")
        prompt = " ".join(lines) + " Generate a 6s SMPL motion fitting these behaviors."
        return {"prompt": prompt}



# app/hy_motion_client.py
"""
HY-Motion 1.0 Client
Integrates with Tencent Hunyuan HY-Motion 1.0 for 3D motion synthesis.
Supports both local inference (via local_infer.py) and REST API endpoints.

References:
- GitHub: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- HuggingFace: https://huggingface.co/tencent/HY-Motion-1.0
- Official: https://hunyuan.tencent.com/motion
"""
import requests
from dataclasses import dataclass
from typing import Dict, Any, Optional
import tempfile
import os
import json
import subprocess
import sys
from pathlib import Path
from app.settings import settings

@dataclass
class MotionRequest:
    """Request for motion generation"""
    match_id: str
    player_id: str
    intent: str
    features: Dict[str, Any]
    duration_seconds: float = 2.0
    style: str = "default"
    meta: Dict[str,Any] = None

    def dict(self):
        return {
            "match_id": self.match_id,
            "player_id": self.player_id,
            "intent": self.intent,
            "features": self.features,
            "duration_seconds": self.duration_seconds,
            "style": self.style,
            "meta": self.meta or {}
        }

    def to_prompt(self) -> str:
        """
        Convert motion request to HY-Motion 1.0 text prompt.
        HY-Motion expects concise English prompts (< 60 words) describing specific actions.
        """
        # Extract key motion descriptors from intent and features
        intent_desc = self.intent.lower()
        role = self.features.get("role", "")
        agent = self.features.get("agent", "")
        action = self.features.get("action", "")
        
        # Build prompt following HY-Motion best practices
        prompt_parts = []
        
        if action:
            prompt_parts.append(f"A person {action}")
        elif intent_desc:
            # Map common intents to motion descriptions
            intent_map = {
                "peek": "peeks around a corner, moving cautiously",
                "retreat": "moves backward quickly, maintaining balance",
                "advance": "moves forward with purpose, torso leading",
                "rotate": "turns body smoothly, scanning surroundings",
                "crouch": "crouches down, lowering center of gravity",
                "jump": "jumps upward, using legs to propel",
                "throw": "throws an object forward with arm motion",
                "aim": "raises arms to aim, focusing forward",
                "reload": "performs reloading motion with hands",
            }
            motion_desc = intent_map.get(intent_desc, f"performs {intent_desc}")
            prompt_parts.append(f"A person {motion_desc}")
        else:
            prompt_parts.append("A person moves")
        
        # Add style modifiers if available
        if self.style != "default":
            style_map = {
                "aggressive": "with explosive urgency",
                "defensive": "cautiously and deliberately",
                "precise": "with extreme precision",
                "fluid": "in a light, acrobatic, and fluid manner",
            }
            style_desc = style_map.get(self.style, "")
            if style_desc:
                prompt_parts.append(style_desc)
        
        prompt = ", ".join(prompt_parts)
        
        # Ensure prompt is under 60 words (HY-Motion limitation)
        words = prompt.split()
        if len(words) > 60:
            prompt = " ".join(words[:60])
        
        return prompt


class HYMotionClient:
    """
    Client for HY-Motion 1.0 integration.
    
    Supports three modes:
    1. Local inference via local_infer.py (primary for production)
    2. REST API endpoint (if running as a service)
    3. Legacy CLI (fallback)
    """
    
    def __init__(
        self, 
        base_url: Optional[str] = None, 
        api_key: Optional[str] = None,
        repo_path: Optional[str] = None,
        model_path: Optional[str] = None
    ):
        self.base_url = base_url or settings.HY_MOTION_API_URL
        self.api_key = api_key or settings.HY_MOTION_API_KEY
        self.repo_path = Path(repo_path or settings.HY_MOTION_REPO_PATH)
        self.model_path = model_path or settings.HY_MOTION_MODEL_PATH
        self.infer_script = settings.HY_MOTION_INFER_SCRIPT or str(self.repo_path / "local_infer.py")
        self.cli_path = settings.HY_MOTION_CLI_PATH

    def _get_model_path(self) -> str:
        """Get the model path, defaulting to standard location if not set"""
        if self.model_path:
            return self.model_path
        # Default to ckpts/tencent/HY-Motion-1.0 within repo
        default_path = self.repo_path / "ckpts" / "tencent" / "HY-Motion-1.0"
        return str(default_path)

    def _generate_via_local_inference(self, prompt: str, output_path: str) -> bool:
        """
        Generate motion using HY-Motion 1.0 local inference script.
        
        HY-Motion 1.0 local_infer.py may have different argument formats.
        This method tries multiple common formats to ensure compatibility.
        
        Args:
            prompt: Text prompt for motion generation
            output_path: Path to save output file
            
        Returns:
            True if successful, False otherwise
        """
        if not os.path.exists(self.infer_script):
            return False
        
        model_path = self._get_model_path()
        if not os.path.exists(model_path):
            raise RuntimeError(
                f"HY-Motion model not found at {model_path}. "
                "Please download model weights from: "
                "https://github.com/Tencent-Hunyuan/HY-Motion-1.0"
            )
        
        # Try different command formats (HY-Motion 1.0 may use different args)
        # Format 1: --prompt and --output flags
        cmd_formats = [
            [
                sys.executable,
                str(self.infer_script),
                "--model_path", model_path,
                "--prompt", prompt,
                "--output", output_path
            ],
            # Format 2: positional arguments
            [
                sys.executable,
                str(self.infer_script),
                "--model_path", model_path,
                prompt,
                output_path
            ],
            # Format 3: stdin input
            [
                sys.executable,
                str(self.infer_script),
                "--model_path", model_path,
                "--output", output_path
            ],
        ]
        
        for cmd in cmd_formats:
            try:
                # For stdin format, pass prompt via stdin
                stdin_input = None
                if "--prompt" not in cmd and prompt not in cmd:
                    stdin_input = prompt.encode('utf-8')
                
                result = subprocess.run(
                    cmd,
                    cwd=str(self.repo_path),
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    check=True
                )
                
                # Check if output file was created
                if os.path.exists(output_path):
                    return True
                
                # If no output file but command succeeded, check stdout for file path
                if result.stdout:
                    # Try to extract file path from stdout
                    for line in result.stdout.split('\n'):
                        if '.npy' in line or '.gltf' in line or '.bvh' in line or '.fbx' in line:
                            potential_path = line.strip()
                            if os.path.exists(potential_path):
                                # Move/copy to desired output path
                                import shutil
                                shutil.copy2(potential_path, output_path)
                                return True
                
            except subprocess.TimeoutExpired:
                raise RuntimeError("HY-Motion inference timed out after 120 seconds")
            except subprocess.CalledProcessError as e:
                # Try next format if this one failed
                if cmd == cmd_formats[-1]:  # Last format, raise error
                    error_msg = f"HY-Motion inference failed: {e.stderr or e.stdout}"
                    raise RuntimeError(error_msg)
                continue
        
        return False

    def _generate_via_api(self, prompt: str) -> Dict[str, Any]:
        """
        Generate motion via REST API endpoint.
        
        Args:
            prompt: Text prompt for motion generation
            
        Returns:
            Response dict with motion data
        """
        if not self.base_url:
            raise RuntimeError("HY-Motion API URL not configured")
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "prompt": prompt,
            "model": "HY-Motion-1.0"
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/generate",
                json=payload,
                headers=headers,
                timeout=120
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            raise RuntimeError(f"HY-Motion API request failed: {e}")

    def generate_motion(self, motion_req: MotionRequest) -> Dict[str, Any]:
        """
        Generate motion from a MotionRequest.
        
        Priority:
        1. Local inference (if repo_path and model_path configured)
        2. REST API (if base_url configured)
        3. Legacy CLI (if cli_path configured)
        
        Returns:
            Dict with artifact_bytes, format, content_type, and meta
        """
        # Convert request to HY-Motion prompt
        prompt = motion_req.to_prompt()
        
        # Try local inference first (most reliable for production)
        if self.repo_path.exists() and os.path.exists(self.infer_script):
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".npy") as tmp:
                    output_path = tmp.name
                
                success = self._generate_via_local_inference(prompt, output_path)
                if success:
                    with open(output_path, "rb") as f:
                        data = f.read()
                    os.unlink(output_path)
                    
                    return {
                        "artifact_bytes": data,
                        "format": "npy",  # HY-Motion outputs numpy arrays (SMPL parameters)
                        "content_type": "application/octet-stream",
                        "meta": {
                            "prompt": prompt,
                            "model": "HY-Motion-1.0",
                            "source": "local_inference"
                        }
                    }
            except Exception as e:
                # Fall through to API if local inference fails
                print(f"Local inference failed, trying API: {e}")
        
        # Try REST API
        if self.base_url:
            try:
                result = self._generate_via_api(prompt)
                
                # Handle different response formats
                if "artifact_base64" in result:
                    import base64
                    bytes_data = base64.b64decode(result["artifact_base64"])
                    return {
                        "artifact_bytes": bytes_data,
                        "format": result.get("format", "npy"),
                        "content_type": "application/octet-stream",
                        "meta": result.get("meta", {})
                    }
                elif "artifact_url" in result:
                    art_resp = requests.get(result["artifact_url"], timeout=60)
                    art_resp.raise_for_status()
                    return {
                        "artifact_bytes": art_resp.content,
                        "format": result.get("format", "npy"),
                        "content_type": art_resp.headers.get("Content-Type", "application/octet-stream"),
                        "meta": result.get("meta", {})
                    }
                else:
                    raise RuntimeError("Unexpected API response format")
            except Exception as e:
                print(f"API request failed: {e}")
        
        # Fallback to legacy CLI (if configured)
        if self.cli_path and os.path.exists(self.cli_path):
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".gltf")
            tmp.close()
            req_json = json.dumps(motion_req.dict())
            cmd = [self.cli_path, "synth", "--json", req_json, "--out", tmp.name]
            try:
                subprocess.check_call(cmd, timeout=120)
                with open(tmp.name, "rb") as f:
                    data = f.read()
                os.unlink(tmp.name)
                return {
                    "artifact_bytes": data,
                    "format": "gltf",
                    "content_type": "model/gltf+json",
                    "meta": {}
                }
            except Exception as e:
                raise RuntimeError(f"Legacy CLI failed: {e}")
        
        raise RuntimeError(
            "No HY-Motion endpoint configured. Please set one of:\n"
            "- HY_MOTION_REPO_PATH (for local inference)\n"
            "- HY_MOTION_API_URL (for REST API)\n"
            "- HY_MOTION_CLI_PATH (for legacy CLI)"
        )

    def generate_from_prompt(self, prompt: str, duration_seconds: float = 2.0) -> Dict[str, Any]:
        """
        Generate motion directly from a text prompt (convenience method).
        
        Args:
            prompt: Text description of motion (< 60 words recommended)
            duration_seconds: Duration of motion
            
        Returns:
            Dict with artifact_bytes, format, content_type, and meta
        """
        # Create a minimal MotionRequest
        motion_req = MotionRequest(
            match_id="direct",
            player_id="direct",
            intent=prompt,
            features={"action": prompt},
            duration_seconds=duration_seconds
        )
        return self.generate_motion(motion_req)



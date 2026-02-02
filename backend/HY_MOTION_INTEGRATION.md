# HY-Motion 1.0 Integration Guide

This guide explains how to properly integrate Tencent Hunyuan HY-Motion 1.0 into the Assistant Coach platform.

## Overview

HY-Motion 1.0 is a state-of-the-art motion generation model that converts text prompts into 3D human motion animations. This integration enables the platform to visualize player movements and tactical actions in 3D space.

**Resources:**

- GitHub: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- HuggingFace: https://huggingface.co/tencent/HY-Motion-1.0
- Official Site: https://hunyuan.tencent.com/motion

## Installation

### 1. Clone HY-Motion 1.0 Repository

```bash
# Clone the repository
git clone https://github.com/Tencent-Hunyuan/HY-Motion-1.0.git
cd HY-Motion-1.0/

# Install Git LFS (required for large model files)
git lfs install
git lfs pull

# Install dependencies
pip install -r requirements.txt
```

### 2. Install PyTorch

Install PyTorch based on your system:

**CPU-only:**

```bash
pip install torch torchvision torchaudio
```

**GPU (CUDA 11.8):**

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**GPU (CUDA 12.1):**

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 3. Download Model Weights

Follow the instructions in `HY-Motion-1.0/ckpts/README.md` to download the model weights. The default path is:

```
HY-Motion-1.0/ckpts/tencent/HY-Motion-1.0/
```

### 4. Install Platform Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Configuration

### Environment Variables

Set the following environment variables in your `.env` file or system environment:

```bash
# Path to HY-Motion 1.0 repository
HY_MOTION_REPO_PATH=/path/to/HY-Motion-1.0

# Path to model weights (optional, defaults to ckpts/tencent/HY-Motion-1.0 within repo)
HY_MOTION_MODEL_PATH=/path/to/HY-Motion-1.0/ckpts/tencent/HY-Motion-1.0

# Path to local_infer.py script (optional, defaults to local_infer.py within repo)
HY_MOTION_INFER_SCRIPT=/path/to/HY-Motion-1.0/local_infer.py

# Alternative: Use REST API endpoint (if running HY-Motion as a service)
HY_MOTION_API_URL=http://localhost:8080
HY_MOTION_API_KEY=your-api-key-here
```

### Settings in `app/settings.py`

The integration supports three modes:

1. **Local Inference (Recommended)**: Uses `local_infer.py` script directly
2. **REST API**: Calls HY-Motion service via HTTP
3. **Legacy CLI**: Fallback for older integrations

## Usage

### Basic Usage

```python
from app.hy_motion_client import HYMotionClient, MotionRequest

# Initialize client
client = HYMotionClient()

# Create motion request
motion_req = MotionRequest(
    match_id="match_123",
    player_id="player_1",
    intent="peek",
    features={
        "role": "entry",
        "agent": "Jett",
        "action": "peeks around a corner, moving cautiously"
    },
    duration_seconds=2.0,
    style="aggressive"
)

# Generate motion
result = client.generate_motion(motion_req)

# Access results
artifact_bytes = result["artifact_bytes"]
format_type = result["format"]  # "npy", "gltf", etc.
metadata = result["meta"]
```

### Direct Prompt Generation

```python
from app.hy_motion_client import HYMotionClient

client = HYMotionClient()

# Generate directly from text prompt
result = client.generate_from_prompt(
    prompt="A person peeks around a corner, moving cautiously",
    duration_seconds=2.0
)
```

### Integration with Agents

The motion generator agent automatically uses HY-Motion:

```python
from app.agents.motion_generator import call_hy_motion

# Generate motion from prompt
motion_data = call_hy_motion(
    prompt="A person moves forward with purpose, torso leading",
    duration_s=3,
    character_id="player_1"
)

# Access frames
frames = motion_data["frames"]
duration = motion_data["duration_s"]
fps = motion_data["fps"]
```

## Prompt Guidelines

HY-Motion 1.0 has specific requirements for prompts:

### Best Practices

1. **Length**: Keep prompts under 60 words
2. **Language**: Use English
3. **Focus**: Describe specific actions and movements
4. **Detail**: Include limb and torso movements

### Good Examples

- ✅ "A person peeks around a corner, moving cautiously"
- ✅ "A person moves forward with purpose, torso leading movement"
- ✅ "A person crouches down, lowering center of gravity"
- ✅ "A person throws an object forward with arm motion"

### Bad Examples

- ❌ "A person feels nervous and walks" (emotions not supported)
- ❌ "A person in a red shirt jumps" (clothing not supported)
- ❌ "Two people fight" (multi-person not supported)
- ❌ "A person walks in a forest" (environment details not supported)

## Output Formats

HY-Motion 1.0 can output motion in various formats:

- **NPY**: NumPy arrays with SMPL parameters (default for local inference)
- **GLTF**: GLTF 3D model format
- **BVH**: BVH motion capture format
- **FBX**: FBX animation format

The integration automatically handles format conversion and parsing.

## Troubleshooting

### Model Not Found

**Error**: `HY-Motion model not found at {path}`

**Solution**:

1. Ensure you've downloaded the model weights
2. Check that `HY_MOTION_MODEL_PATH` points to the correct directory
3. Verify the directory contains the model files

### Inference Timeout

**Error**: `HY-Motion inference timed out after 120 seconds`

**Solution**:

1. Check system resources (CPU/GPU)
2. Verify model is loaded correctly
3. Try shorter prompts
4. Consider using REST API mode if local inference is too slow

### Command Format Issues

**Error**: `HY-Motion inference failed`

**Solution**:
The integration tries multiple command formats automatically. If all fail:

1. Check HY-Motion 1.0 repository version
2. Verify `local_infer.py` script exists and is executable
3. Check Python version compatibility
4. Review HY-Motion 1.0 documentation for exact command format

### Import Errors

**Error**: `ModuleNotFoundError: No module named 'torch'`

**Solution**:

```bash
pip install torch torchvision torchaudio
```

## Architecture

### Client Structure

```
app/hy_motion_client.py          # Main HY-Motion client
app/utils/hy_motion_client.py    # Compatibility wrapper
app/agents/motion_generator.py   # Agent integration
```

### Data Flow

```
MotionRequest → Prompt Conversion → HY-Motion 1.0 → Motion Artifact → Frame Parsing → Result
```

1. **MotionRequest**: Structured request with match/player context
2. **Prompt Conversion**: Converts request to HY-Motion-compatible text prompt
3. **HY-Motion 1.0**: Generates motion data (local inference or API)
4. **Motion Artifact**: Raw motion data (NPY, GLTF, etc.)
5. **Frame Parsing**: Converts to frame-based format
6. **Result**: Structured result with frames, metadata, etc.

## Performance Considerations

### Local Inference

- **Latency**: 5-30 seconds depending on hardware
- **GPU**: Significantly faster than CPU
- **Memory**: Requires ~4-8GB RAM for model

### REST API

- **Latency**: Network-dependent
- **Scalability**: Can handle multiple concurrent requests
- **Deployment**: Requires separate service setup

### Optimization Tips

1. **Batch Processing**: Process multiple motions in parallel
2. **Caching**: Cache common motion patterns
3. **Model Quantization**: Use quantized models for faster inference
4. **GPU Acceleration**: Use GPU for production workloads

## Advanced Usage

### Custom Prompt Generation

You can customize how `MotionRequest` converts to prompts:

```python
from app.hy_motion_client import MotionRequest

class CustomMotionRequest(MotionRequest):
    def to_prompt(self) -> str:
        # Custom prompt generation logic
        return f"A person {self.intent} with {self.style} style"
```

### Integration with Celery

For async processing:

```python
from app.celery_tasks_agents import generate_motion_task

# Queue motion generation
task = generate_motion_task.delay(motion_req.dict())
result = task.get()
```

## References

- [HY-Motion 1.0 GitHub](https://github.com/Tencent-Hunyuan/HY-Motion-1.0)
- [HuggingFace Model](https://huggingface.co/tencent/HY-Motion-1.0)
- [Official Documentation](https://hunyuan.tencent.com/motion)
- [Tactical Motion Synthesis Guide](../docs/TACTICAL_MOTION_SYNTHESIS.md)

## Support

For issues with:

- **HY-Motion 1.0**: Check the [GitHub repository](https://github.com/Tencent-Hunyuan/HY-Motion-1.0)
- **Integration**: Check this guide and code comments
- **Platform**: See main README.md

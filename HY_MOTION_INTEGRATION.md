# HY-Motion-1.0 Integration

This document describes the integration of Tencent HY-Motion-1.0 for 3D character animation generation in the frontend.

## Overview

HY-Motion-1.0 is a billion-parameter model developed by Tencent Hunyuan that generates high-quality 3D human motion animations from text prompts. This integration allows the platform to generate 3D character animations for esports player movements.

## Resources

- **GitHub Repository**: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- **Official Website**: https://hunyuan.tencent.com/motion
- **Hugging Face**: https://huggingface.co/tencent/HY-Motion-1.0

## Backend Integration

### API Endpoints

The backend provides two endpoints for motion generation:

1. **POST `/api/v1/motion/generate`** - Asynchronous motion generation
   - Returns a job ID for tracking generation progress
   - Suitable for longer-running generation tasks
   - Progress can be tracked via WebSocket

2. **POST `/api/v1/motion/generate-sync`** - Synchronous motion generation
   - Blocks until generation completes
   - Returns motion data directly
   - Suitable for quick generation tasks

### Request Format

```json
{
  "prompt": "A person peeks around a corner, moving cautiously",
  "duration_seconds": 6.0,
  "match_id": "optional-match-id",
  "player_id": "optional-player-id",
  "metadata": {}
}
```

### Response Format

```json
{
  "frames": [...],
  "duration_s": 6.0,
  "fps": 30,
  "predictedActionLabel": "...",
  "storage_url": "optional-s3-url",
  "metadata": {
    "prompt": "...",
    "format": "npy",
    "model": "HY-Motion-1.0"
  }
}
```

### Configuration

The HY-Motion client can be configured via environment variables or settings:

- `HY_MOTION_REPO_PATH` - Path to HY-Motion-1.0 repository (for local inference)
- `HY_MOTION_MODEL_PATH` - Path to model weights
- `HY_MOTION_API_URL` - REST API endpoint (if running as a service)
- `HY_MOTION_API_KEY` - API key for authentication

The client supports three modes:

1. **Local Inference** (preferred for production) - Uses Python inference script
2. **REST API** - Calls remote HY-Motion service
3. **Legacy CLI** - Fallback option

## Frontend Integration

### MotionViewer Component

The `MotionViewer` component (`src/components/motion/MotionViewer.tsx`) displays 3D animations using React Three Fiber. It supports:

- Frame-by-frame playback controls
- Playback speed adjustment
- Frame scrubbing
- Integration with motion data from HY-Motion-1.0

### MotionStudio Page

The `MotionStudio` page (`src/pages/MotionStudio.tsx`) provides a UI for:

- Generating motion animations from text prompts
- Visualizing player movements in 3D
- Viewing motion metadata and details

### API Service

The `BackendApiService` (`src/services/backendApi.ts`) includes a `generateMotionVisualization` method that:

- Calls the HY-Motion-1.0 API endpoint
- Converts the response to the expected format
- Falls back to mock data if the API is unavailable

## Usage Example

```typescript
import { backendApi } from '@/services/backendApi';

// Generate motion from a text prompt
const motionSequence = await backendApi.generateMotionVisualization(
  "A professional esports player peeks around a corner, moving cautiously",
  {
    duration: 6.0,
    actionType: "peek",
    playerRole: "entry"
  }
);

// Use the motion sequence in a component
<MotionViewer motionData={motionSequence.motion_data} />
```

## Prompt Guidelines

HY-Motion-1.0 works best with:

- **Prompt length**: < 60 words (recommended)
- **Language**: English
- **Style**: Action descriptions, specific movements
- **Format**: Natural language descriptions

Example prompts:

- "A person peeks around a corner, moving cautiously"
- "A professional esports player moves forward with purpose, torso leading"
- "A person crouches down, lowering center of gravity"

## Output Formats

HY-Motion-1.0 can output motion data in various formats:

- **NPY**: NumPy arrays with SMPL parameters (default)
- **GLTF**: 3D model format (if exported)
- **BVH**: Motion capture format (if exported)

The current integration primarily works with NPY format, which is converted to frame-based animation data for display in the frontend.

## Setup Instructions

1. **Clone HY-Motion-1.0 Repository** (if using local inference):

   ```bash
   git clone https://github.com/Tencent-Hunyuan/HY-Motion-1.0.git
   cd HY-Motion-1.0/
   ```

2. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Download Model Weights**:
   Follow instructions in `ckpts/README.md` within the repository

4. **Configure Environment Variables**:

   ```bash
   export HY_MOTION_REPO_PATH=/path/to/HY-Motion-1.0
   export HY_MOTION_MODEL_PATH=/path/to/model/weights
   # OR
   export HY_MOTION_API_URL=https://your-hymotion-service.com
   ```

5. **Start Backend Server**:
   The motion API endpoints will be available at `/api/v1/motion/*`

## Technical Notes

- The HY-Motion-1.0 model requires significant GPU resources (~26GB VRAM for full model, ~24GB for lite version)
- Motion generation typically takes 5-30 seconds depending on duration and hardware
- The integration includes error handling and fallback to mock data for development
- WebSocket support is available for tracking generation progress (for async endpoint)

## Future Enhancements

- Support for GLTF/BVH format export and direct loading in Three.js
- Integration with WebSocket for real-time generation progress
- Caching and storage of generated motions in S3
- Batch generation support
- Integration with tactical prompt engine for automatic prompt generation from GRID data

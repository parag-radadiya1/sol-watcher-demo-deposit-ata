# Birthstone Reading System

This module provides a complete flow for generating and retrieving personalized birthstone readings using AI (similar to the astrology reading system).

## Architecture Overview

The system follows the same pattern as astrology readings with these components:

1. **Entity Layer** - MongoDB schema and service for storing birthstone readings
2. **Business Logic Layer** - Service and controller for handling API requests
3. **Queue Processing** - Background job processing for AI generation
4. **AI Integration** - Uses LangChain with TOON format for efficient responses

## API Endpoints

### 1. Generate Birthstone Reading (Queue Job)
```
POST /user/birthstone/get-my-birthstone
Authorization: Bearer <token>

Request Body:
{
  "forceRegenerate": false  // Optional, default false
}

Response (202 Accepted):
{
  "statusCode": 202,
  "message": "Birthstone reading job queued successfully. Use the jobId to check status.",
  "data": {
    "jobId": "birthstone-123456-1234567890",
    "status": "waiting",
    "message": "Your birthstone reading is being generated...",
    "userDetails": {
      "fullName": "John Doe",
      "birthDate": "January 15, 1990, 10:30 AM EST",
      "birthPlace": "New York, USA"
    }
  }
}
```

### 2. Get Birthstone Overview (Simple Response)
```
GET /user/birthstone/overview
Authorization: Bearer <token>

Response (200 OK):
{
  "statusCode": 200,
  "message": "Birthstone overview retrieved successfully",
  "data": {
    "overview": {
      "birthMonth": "January",
      "birthSign": "Capricorn",
      "lifePathNumber": 5,
      "summary": "Your primary birthstone is Garnet...",
      "keyThemes": ["Protection", "Passion", "Energy"]
    },
    "primaryBirthstone": {
      "name": "Garnet",
      "color": "Deep Red",
      "meaning": "Passion and Protection",
      "origin": "India, Sri Lanka, Africa",
      "properties": ["Grounding", "Energizing", "Protective"],
      "chakraConnection": "Root Chakra",
      "element": "Fire",
      "vibration": "High - Energetic and Passionate",
      "description": "Garnet is a powerful stone..."
    },
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Check Job Status
```
GET /user/birthstone/job-status/:jobId
Authorization: Bearer <token>

Response (200 OK):
{
  "statusCode": 200,
  "message": "Job status retrieved successfully",
  "data": {
    "id": "birthstone-123456-1234567890",
    "status": "completed",
    "progress": 100,
    "result": {
      "overview": {...},
      "primaryBirthstone": {...},
      "secondaryBirthstones": [...],
      "zodiacStones": [...],
      "planetaryInfluence": {...},
      "healingProperties": {...},
      "compatibility": {...},
      "guidance": {...}
    }
  }
}
```

## Data Structure

### Birthstone Reading Interface
```typescript
interface IBirthstoneReading {
  overview: {
    birthMonth: string;
    birthSign: string;
    lifePathNumber: number;
    summary: string;
    keyThemes: string[];
  };
  primaryBirthstone: {
    name: string;
    color: string;
    meaning: string;
    origin: string;
    properties: string[];
    chakraConnection: string;
    element: string;
    vibration: string;
    description: string;
  };
  secondaryBirthstones: Array<{...}>;
  zodiacStones: Array<{
    sign: string;
    stone: string;
    influence: string;
    benefits: string[];
  }>;
  planetaryInfluence: {
    rulingPlanet: string;
    planetaryStone: string;
    cosmicEnergy: string;
    influence: string;
  };
  healingProperties: {
    physical: string[];
    emotional: string[];
    spiritual: string[];
    mental: string[];
  };
  compatibility: {
    bestPairings: string[];
    complementaryStones: string[];
    avoidCombinations: string[];
    reasoning: string;
  };
  guidance: {
    howToWear: string;
    careTips: string[];
    bestTimesToUse: string[];
    affirmations: string[];
    rituals: string[];
  };
}
```

## How It Works

### Flow Diagram
```
User Request → Controller → Service
                              ↓
                        Check Cache
                              ↓
                        Queue Job (BullMQ)
                              ↓
                        Job Processor
                              ↓
                        AI Generation (LangChain)
                              ↓
                        TOON Parser
                              ↓
                        Save to MongoDB
                              ↓
                        Return Result
```

### Step-by-Step Process

1. **User makes request** to `/user/birthstone/get-my-birthstone`
2. **Service validates** user has required birth details (birthDate, birthPlace, name)
3. **Check cache** - If reading exists and `forceRegenerate` is false, return cached version
4. **Queue job** - Create a background job with BullMQ
5. **Job processor** - Processes the job asynchronously:
   - Formats user data
   - Calls LangChain with birthstone prompt
   - AI generates TOON format response
   - Parses TOON to JSON
   - Saves to MongoDB
6. **User polls** `/user/birthstone/job-status/:jobId` to check completion
7. **Frontend calls** `/user/birthstone/overview` to get simplified data

## Frontend Integration Example

```javascript
// Step 1: Request birthstone reading
const response = await fetch('/user/birthstone/get-my-birthstone', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ forceRegenerate: false })
});

const { data } = await response.json();
const jobId = data.jobId;

// Step 2: Poll for completion
const checkStatus = async () => {
  const statusRes = await fetch(`/user/birthstone/job-status/${jobId}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const statusData = await statusRes.json();
  
  if (statusData.data.status === 'completed') {
    // Job completed, get overview
    return statusData.data.result;
  } else if (statusData.data.status === 'failed') {
    throw new Error('Job failed');
  } else {
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return checkStatus();
  }
};

const fullReading = await checkStatus();

// Step 3: Get simple overview for display
const overviewRes = await fetch('/user/birthstone/overview', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const overviewData = await overviewRes.json();
console.log(overviewData.data.overview);
console.log(overviewData.data.primaryBirthstone);
```

## Files Created

### Entity Layer
- `/src/entities/birthstone-reading/birthstone-reading.entities.ts` - MongoDB schema
- `/src/entities/birthstone-reading/birthstone-reading.service.ts` - Database operations
- `/src/entities/birthstone-reading/birthstone-reading.model.module.ts` - Module definition

### Business Logic
- `/src/app/user/birthstone/birthstone.controller.ts` - API endpoints
- `/src/app/user/birthstone/birthstone.service.ts` - Business logic
- `/src/app/user/birthstone/birthstone.module.ts` - Module configuration

### DTOs and Interfaces
- `/src/app/user/birthstone/dto/birthstone.dto.ts` - Request/response DTOs
- `/src/app/user/birthstone/dto/birthstone.exception.ts` - Custom exceptions
- `/src/app/user/birthstone/interfaces/birthstone-reading.interface.ts` - TypeScript interfaces

### AI Integration
- `/src/app/user/birthstone/constants/birthstone-prompt.constant.ts` - AI prompts (TOON format)

### Queue Processing
- `/src/app/queue/processors/birthstone.processor.ts` - Background job processor

## TOON Format Benefits

The system uses TOON (Token Oriented Object Notation) instead of JSON for AI responses:
- **30% fewer tokens** compared to JSON
- **Lower API costs**
- **Faster generation**
- **More robust parsing**

## Caching Strategy

- Readings are cached by `userId`, `birthDate`, and `birthPlace`
- Use `forceRegenerate: true` to bypass cache
- Cached readings are returned instantly (no queue job needed)

## Error Handling

- **IncompleteBirthDetailsException** - User missing required profile data
- **BirthstoneServiceException** - General service errors
- Job failures are tracked in the database with error messages

## Testing

```bash
# Test the complete flow
curl -X POST http://localhost:3000/user/birthstone/get-my-birthstone \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"forceRegenerate": false}'

# Check job status
curl -X GET http://localhost:3000/user/birthstone/job-status/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get overview
curl -X GET http://localhost:3000/user/birthstone/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

Collection: `birthstone_readings`

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId (ref: User),
  "fullName": String,
  "birthDate": Date,
  "birthPlace": String,
  "reading": Object (IBirthstoneReading),
  "generatedAt": Date,
  "isActive": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

Indexes:
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1 }` (ref index)

## Notes

- Birthstone jobs use the same queue as astrology jobs (`astrology-queue`)
- Job priority is 10 (default)
- Jobs are tracked in the `jobs` collection for monitoring
- The `/overview` endpoint is perfect for simple frontend displays showing just the primary birthstone info


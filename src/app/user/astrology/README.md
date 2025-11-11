# Astrology & Numerology Reading System

## Overview
This module provides comprehensive astrology and numerology readings using AI (LangChain with OpenAI). The system generates detailed, structured readings based on user's birth details and caches them for future use.

## Features

### ✅ **Complete Numerology Reading**
- **Core Numbers**: Life Path, Expression, Soul Urge, Personality, Birthday, Maturity, Balance, Hidden Passion, Rational Thought, Subconscious Self, Cornerstone, Capstone, First Vowel
- **Karmic & Spiritual Insights**: Karmic Lessons, Karmic Debts, Master Numbers, Past-life tendencies
- **Timelines**: Personal Year/Month/Day, Pinnacles, Challenges, Period Cycles, Transits, Essence Cycles
- **Guidance**: Career, Relationships, Money, Health, Strengths/Weaknesses, Advice

### ✅ **Complete Astrology Reading**
- **All Planets**: Sun, Moon, Rising, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- **Additional Points**: North/South Nodes, Chiron, Lilith, Vertex, Part of Fortune
- **Chart Characteristics**: Dominant Element & Modality, Stelliums
- **12 Houses Interpretation**
- **Aspects Analysis**: Major aspects with orbs
- **Patterns**: Psychological, Relationship, Career patterns
- **Predictions**: Current Transits, Progressions, Solar Return, Saturn Return

### ✅ **Combined Insights**
- Integrated personality summary
- Life purpose analysis
- Relationship insights and compatibility
- Career map with ideal fields and success factors
- Strengths and challenges integration
- **12-Month Combined Forecast** blending numerology and astrology

### ✅ **Smart Caching**
- Readings are stored in MongoDB
- Automatic retrieval of cached readings
- `forceRegenerate` option to generate fresh reading
- Each user can have multiple readings for different birth details

## API Endpoint

### `POST /user/astrology/check-my-astrology`

**Authentication**: Bearer Token (JWT) Required

**Request Body**:
```json
{
  "question": "What does my birth chart say about my career?",  // Optional
  "forceRegenerate": false  // Optional, default: false
}
```

**Response**:
```json
{
  "statusCode": 200,
  "message": "Astrology reading generated successfully",
  "data": {
    "reading": {
      "numerology": {
        "coreNumbers": { /* ... */ },
        "karmicAndSpiritual": { /* ... */ },
        "timelines": { /* ... */ },
        "guidance": { /* ... */ }
      },
      "astrology": {
        "planets": { /* ... */ },
        "chartCharacteristics": { /* ... */ },
        "houses": { /* ... */ },
        "aspects": [ /* ... */ ],
        "patterns": { /* ... */ },
        "predictions": { /* ... */ }
      },
      "combinedInsights": {
        "personalitySummary": "...",
        "lifePurpose": "...",
        "relationshipInsights": { /* ... */ },
        "careerMap": { /* ... */ },
        "strengthsAndChallenges": { /* ... */ },
        "twelveMonthForecast": [ /* ... */ ]
      }
    },
    "userDetails": {
      "fullName": "John Doe Smith",
      "birthDate": "January 15, 1990, 10:30 AM EST",
      "birthPlace": "New York, USA"
    },
    "cached": false,
    "generatedAt": "2025-11-11T11:20:00.000Z"
  }
}
```

## File Structure

```
src/app/user/astrology/
├── astrology.controller.ts           # API endpoint
├── astrology.service.ts              # Business logic with AI integration
├── astrology.module.ts               # Module configuration
├── constants/
│   └── astrology-prompt.constant.ts  # System & user prompts for AI
├── interfaces/
│   └── astrology-reading.interface.ts # TypeScript interfaces for readings
├── entities/
│   ├── astrology-reading.entities.ts      # MongoDB schema
│   ├── astrology-reading.service.ts       # Database operations
│   └── astrology-reading.model.module.ts  # Model module
└── dto/
    ├── astrology.dto.ts              # Request/response DTOs
    ├── astrology.error.ts            # Custom exceptions
    └── index.ts                      # Barrel exports
```

## How It Works

1. **User Makes Request**
   - User sends authenticated request to the endpoint
   - Optional: Include specific question for focused reading
   - Optional: Set `forceRegenerate: true` to bypass cache

2. **User Validation**
   - System extracts `userId` from JWT token
   - Fetches user profile from database
   - Validates birth date, birth place, and full name exist

3. **Cache Check**
   - If `forceRegenerate` is false, checks for existing reading
   - Returns cached reading if found (faster response)
   - Otherwise proceeds to generate new reading

4. **AI Generation**
   - Formats birth details and optional question
   - Sends structured prompt to LangChain AI (GPT-4)
   - AI responds with complete JSON structure
   - System parses and validates JSON response

5. **Storage & Response**
   - Saves reading to MongoDB for future use
   - Returns complete reading with user details
   - Includes `cached` flag and generation timestamp

## Prompt Engineering

The system uses a carefully engineered prompt structure:

### System Prompt
- Defines AI as expert astrologer/numerologist with 15+ years experience
- Sets expectations for structured, detailed, professional readings
- Enforces JSON response format

### User Prompt
- Provides exact JSON schema for AI to follow
- Includes detailed requirements for each section
- Specifies minimum interpretation lengths
- Requests calculations with explanations
- Ensures consistent structure across all readings

### JSON Schema Enforcement
- AI receives complete JSON template with all required fields
- Prevents missing or malformed responses
- Ensures consistent data structure for storage and display

## Error Handling

### Custom Exceptions

1. **IncompleteBirthDetailsException** (400)
   - User missing birth date, birth place, or name
   - Message: "Incomplete birth details. Please update your profile..."

2. **AstrologyServiceException** (500)
   - AI service failure
   - JSON parsing errors
   - Database errors

## Database Schema

### Collection: `astrology_readings`

```typescript
{
  userId: ObjectId,              // Reference to User
  fullName: String,              // User's full name
  birthDate: Date,               // Birth date and time
  birthPlace: String,            // Birth location
  reading: Object,               // Complete reading JSON
  generatedAt: Date,             // When reading was created
  isActive: Boolean,             // Soft delete flag
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-generated
}
```

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - User's readings sorted by date
- `userId` - Fast user lookups

## Configuration

### Required Environment Variables
```bash
OPENAI_API_KEY=sk-...           # OpenAI API key
OPENAI_MODEL=gpt-4o             # Model name (GPT-4o recommended)
```

### Dependencies
- `@nestjs/common`
- `@nestjs/mongoose`
- `langchain` (via LangChainModule)
- MongoDB connection (via MongooseModule)

## Testing

### With Swagger UI
1. Navigate to `/api-docs`
2. Find `User-Astrology` section
3. Click "Authorize" and enter Bearer token
4. Try the `POST /user/astrology/check-my-astrology` endpoint
5. Add optional question in request body

### With cURL
```bash
curl -X POST http://localhost:3000/user/astrology/check-my-astrology \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What career path suits me best?",
    "forceRegenerate": false
  }'
```

### With Postman
1. Create POST request to endpoint
2. Add Authorization header: `Bearer YOUR_TOKEN`
3. Add JSON body with optional question
4. Send request

## Response Time

- **Cached Reading**: ~100-200ms (database query only)
- **New Reading**: ~15-30 seconds (AI generation + parsing + storage)

## Best Practices

1. **Use Caching**: Don't set `forceRegenerate: true` unless necessary
2. **User Profile**: Ensure users provide accurate birth time and location
3. **Error Handling**: Display user-friendly messages from exception responses
4. **Rate Limiting**: Consider implementing rate limits for AI generation
5. **Monitoring**: Log AI response times and parsing errors

## Future Enhancements

- [ ] Add endpoint to retrieve user's reading history
- [ ] Add endpoint to delete specific readings
- [ ] Implement reading versioning
- [ ] Add support for multiple birth chart types (Vedic, Tropical)
- [ ] Add real-time streaming for AI generation progress
- [ ] Implement reading comparison feature
- [ ] Add sharing functionality
- [ ] Create PDF export of readings

## Troubleshooting

### AI Returns Invalid JSON
- Check `OPENAI_MODEL` is set to GPT-4 or better
- Review error logs for partial AI response
- Increase model temperature if responses too rigid
- Consider adding retry logic for JSON parsing

### Cached Readings Not Working
- Verify MongoDB connection is active
- Check indexes are created on `astrology_readings` collection
- Ensure birth date and place exactly match user profile

### Slow Response Times
- Monitor OpenAI API response times
- Consider implementing background job processing
- Use Redis for additional caching layer
- Optimize MongoDB queries with proper indexes

## Support

For issues or questions, contact the development team or create a ticket in the project repository.


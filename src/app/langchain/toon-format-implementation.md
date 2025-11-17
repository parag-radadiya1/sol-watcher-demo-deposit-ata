# TOON Format Implementation for Astrology Readings

## Overview

This project now uses **TOON (Token Oriented Object Notation)** format instead of JSON for AI-generated astrology readings. TOON format reduces token usage by approximately 30% compared to JSON, making AI responses more efficient and cost-effective.

## What is TOON?

TOON is a token-efficient data format designed specifically for LLM interactions. It uses:
- **Indentation** instead of braces `{}` for structure
- **`key: value`** format for properties
- **Minimal quotes** - only when necessary
- **Inline arrays** `[item1, item2]` or multi-line with dashes

### Example Comparison

**JSON Format (more tokens):**
```json
{
  "numerology": {
    "coreNumbers": {
      "lifePath": {
        "number": 5,
        "meaning": "The Freedom Seeker"
      }
    }
  }
}
```

**TOON Format (fewer tokens):**
```
numerology
  coreNumbers
    lifePath
      number: 5
      meaning: "The Freedom Seeker"
```

## Implementation Details

### 1. TOON Parser (`src/app/user/astrology/utils/toon-parser.util.ts`)

A custom parser that converts TOON format to JSON objects:
- Handles indentation-based nesting
- Supports inline arrays: `[1, 2, 3]`
- Supports multi-line arrays with dashes:
  ```
  pinnacles
    - number: 5
      ageRange: "0-28"
    - number: 7
      ageRange: "29-37"
  ```
- Auto-detects and parses different data types (numbers, booleans, strings)
- Cleans AI responses by removing markdown code blocks

### 2. Updated Prompt (`src/app/user/astrology/constants/astrology-prompt.constant.ts`)

The AI prompt now instructs the model to:
- Respond in TOON format only
- Not wrap responses in markdown code blocks
- Use proper indentation (2 spaces per level)
- Complete the entire structure without truncation

### 3. Service Integration

Both the main service and queue processor now use TOON parsing:
- `astrology.service.ts` - Uses `ToonParser.parse()` instead of `JSON.parse()`
- `astrology.processor.ts` - Queue processor also updated for consistency

## Benefits

### 1. **Token Efficiency (~30% reduction)**
- Fewer tokens per request = lower API costs
- Faster AI response generation
- Less chance of hitting token limits

### 2. **Better Readability**
- Cleaner format for humans to read
- Easier to debug AI responses
- Less visual clutter

### 3. **More Robust Parsing**
- Indentation-based structure is harder to break
- Less prone to quote escaping issues
- Better handling of incomplete responses

## Usage

The TOON format is automatically used throughout the astrology reading system. No changes needed to API calls or responses - the conversion happens internally:

1. **User requests astrology reading** → API receives request
2. **AI generates TOON format** → More efficient token usage
3. **TOON Parser converts to JSON** → Standard JSON object
4. **Response sent to user** → Same JSON structure as before

## TOON Parser API

```typescript
// Parse TOON string to JSON object
const jsonObj = ToonParser.parse(toonString);

// Clean TOON response (remove markdown)
const cleaned = ToonParser.cleanToonResponse(response);

// Validate astrology reading structure
const isValid = ToonParser.validateAstrologyReading(obj);
```

## Reference

Based on the article: [I Vibe-Coded a JSON-TOON Converter in 15 Minutes](https://kettan007.medium.com/i-vibe-coded-a-json-toon-converter-in-15-minutes-idea-live-in-bestaitools-317f38d6400a)

## Migration Notes

- **Backward Compatible**: Existing cached readings in JSON format still work
- **No API Changes**: External API remains the same
- **Transparent**: Users don't see TOON format, only JSON responses
- **Testing**: Verify AI responses parse correctly with new format

## Troubleshooting

If you see parsing errors:

1. Check the AI response preview in logs
2. Verify proper indentation (2 spaces per level)
3. Ensure no markdown code blocks in response
4. Check for incomplete responses (truncation)

The parser includes extensive logging for debugging:
```
=== Attempting to parse TOON format ===
Cleaned response length: 12450
Response preview (first 500 chars): numerology...
=== Successfully parsed TOON format ===
Parsed structure keys: ['numerology', 'astrology', 'combinedInsights']
```

## Future Enhancements

Potential improvements:
- Support for TOON-to-JSON bidirectional conversion
- Schema validation for TOON format
- TOON format linting tools
- Performance benchmarks vs JSON


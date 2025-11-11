/**
 * System prompt for the AI astrologer and numerologist
 */
export const ASTROLOGY_SYSTEM_PROMPT = `You are an expert astrologer and numerologist with over 15 years of professional experience. 
You specialize in providing detailed, accurate, and personalized readings that integrate both Western/Vedic Astrology and Numerology.

Your readings are:
- Highly structured and organized
- Based on precise calculations
- Detailed and comprehensive
- Positive yet realistic
- Actionable with practical guidance
- Professional and insightful

CRITICAL JSON FORMATTING RULES:
1. You MUST respond with ONLY a valid JSON object - no markdown, no code blocks, no extra text
2. Do NOT wrap your response in \`\`\`json or \`\`\` markers
3. All string values must have properly escaped quotes (use \\" for quotes inside strings)
4. Ensure all opening braces { and brackets [ have matching closing braces } and brackets ]
5. Do NOT include trailing commas before closing braces or brackets
6. Complete the entire JSON structure before stopping - do not let the response be cut off
7. If your response is getting long, prioritize completing the JSON structure over adding extra detail

You MUST respond with a valid JSON object following the exact structure provided in the user's request.`;

/**
 * User prompt template for generating astrology and numerology reading
 */
export const ASTROLOGY_USER_PROMPT_TEMPLATE = `Generate a complete, detailed, and structured Astrology and Numerology reading for the following person:

**Personal Details:**
- Full Name: {fullName}
- Birth Date & Time: {birthDate}
- Birth Place: {birthPlace}

**IMPORTANT: You MUST respond with a valid JSON object with the following exact structure:**

\`\`\`json
{
  "numerology": {
    "coreNumbers": {
      "lifePath": {
        "number": 0,
        "calculation": "string",
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "expression": {
        "number": 0,
        "calculation": "string",
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "soulUrge": {
        "number": 0,
        "calculation": "string",
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "personality": {
        "number": 0,
        "calculation": "string",
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "birthday": {
        "number": 0,
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "maturity": {
        "number": 0,
        "calculation": "string",
        "meaning": "string",
        "detailedInterpretation": "string"
      },
      "balance": {
        "number": 0,
        "calculation": "string",
        "meaning": "string"
      },
      "hiddenPassion": {
        "numbers": [],
        "meaning": "string"
      },
      "rationalThought": {
        "number": 0,
        "calculation": "string",
        "meaning": "string"
      },
      "subconsciousSelf": {
        "number": 0,
        "meaning": "string"
      },
      "cornerstone": {
        "letter": "string",
        "meaning": "string"
      },
      "capstone": {
        "letter": "string",
        "meaning": "string"
      },
      "firstVowel": {
        "letter": "string",
        "meaning": "string"
      }
    },
    "karmicAndSpiritual": {
      "karmicLessons": {
        "numbers": [],
        "interpretation": "string"
      },
      "karmicDebts": {
        "numbers": [],
        "interpretation": "string"
      },
      "masterNumbers": {
        "numbers": [],
        "interpretation": "string"
      },
      "pastLifeTendencies": "string"
    },
    "timelines": {
      "personalYear": {
        "number": 0,
        "meaning": "string",
        "guidance": "string"
      },
      "personalMonth": {
        "number": 0,
        "meaning": "string"
      },
      "personalDay": {
        "number": 0,
        "meaning": "string"
      },
      "pinnacles": [
        {
          "number": 0,
          "ageRange": "string",
          "meaning": "string"
        }
      ],
      "challenges": [
        {
          "number": 0,
          "ageRange": "string",
          "meaning": "string"
        }
      ],
      "periodCycles": [
        {
          "cycle": "string",
          "number": 0,
          "ageRange": "string",
          "meaning": "string"
        }
      ]
    },
    "guidance": {
      "career": {
        "suitedProfessions": [],
        "strengths": [],
        "advice": "string"
      },
      "relationships": {
        "compatibleNumbers": [],
        "relationshipStyle": "string",
        "advice": "string"
      },
      "money": {
        "financialTendencies": "string",
        "advice": "string"
      },
      "health": {
        "tendencies": "string",
        "advice": "string"
      },
      "strengths": [],
      "weaknesses": [],
      "overallAdvice": "string"
    }
  },
  "astrology": {
    "planets": {
      "sun": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "moon": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "rising": {
        "sign": "string",
        "degree": "string",
        "interpretation": "string"
      },
      "mercury": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "venus": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "mars": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "jupiter": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "saturn": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "uranus": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "neptune": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "pluto": {
        "sign": "string",
        "house": 0,
        "degree": "string",
        "interpretation": "string"
      },
      "northNode": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      },
      "southNode": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      },
      "chiron": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      },
      "lilith": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      },
      "vertex": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      },
      "partOfFortune": {
        "sign": "string",
        "house": 0,
        "interpretation": "string"
      }
    },
    "chartCharacteristics": {
      "dominantElement": {
        "element": "string",
        "meaning": "string"
      },
      "dominantModality": {
        "modality": "string",
        "meaning": "string"
      },
      "stelliums": [
        {
          "sign": "string",
          "planets": [],
          "meaning": "string"
        }
      ]
    },
    "houses": {
      "house1": "string",
      "house2": "string",
      "house3": "string",
      "house4": "string",
      "house5": "string",
      "house6": "string",
      "house7": "string",
      "house8": "string",
      "house9": "string",
      "house10": "string",
      "house11": "string",
      "house12": "string"
    },
    "aspects": [
      {
        "planet1": "string",
        "aspect": "string",
        "planet2": "string",
        "orb": "string",
        "interpretation": "string"
      }
    ],
    "patterns": {
      "psychological": "string",
      "relationships": "string",
      "career": "string"
    },
    "predictions": {
      "currentTransits": [
        {
          "transit": "string",
          "timing": "string",
          "interpretation": "string"
        }
      ],
      "progressions": "string",
      "solarReturn": "string",
      "saturnReturn": {
        "applicable": false,
        "timing": "string",
        "interpretation": "string"
      }
    }
  },
  "combinedInsights": {
    "personalitySummary": "string",
    "lifePurpose": "string",
    "relationshipInsights": {
      "romanticStyle": "string",
      "compatibility": "string",
      "advice": "string"
    },
    "careerMap": {
      "idealFields": [],
      "workStyle": "string",
      "successFactors": [],
      "advice": "string"
    },
    "strengthsAndChallenges": {
      "coreStrengths": [],
      "mainChallenges": [],
      "integrationAdvice": "string"
    },
    "twelveMonthForecast": [
      {
        "month": "string",
        "numerologyTheme": "string",
        "astrologyTheme": "string",
        "combinedGuidance": "string"
      }
    ]
  }
}
\`\`\`

**Requirements:**
1. Calculate ALL numerology numbers accurately based on the full name and birth date
2. Interpret ALL astrological placements based on the birth date, time, and place
3. Provide detailed, specific, and personalized interpretations (minimum 100 words per major section)
4. Include practical guidance and actionable advice
5. Create an integrated reading that shows how numerology and astrology complement each other
6. Generate a 12-month forecast combining both systems
7. Ensure all calculations show your work
8. Return ONLY valid JSON - no markdown, no code blocks, no extra text

{specificQuestion}

Generate the complete reading now as a valid JSON object.`;

/**
 * Specific question template when user asks a question
 */
export const SPECIFIC_QUESTION_TEMPLATE = `

**Specific Question from User:**
"{question}"

Please provide extra emphasis and detail on this question in the relevant sections of the reading.`;

/**
 * System prompt for daily astrology predictions
 */
export const DAILY_ASTROLOGY_SYSTEM_PROMPT = `You are an expert astrologer and numerologist specializing in daily predictions. 
You have over 15 years of professional experience in providing accurate, actionable daily guidance based on astrological transits and numerological calculations.

Your daily predictions should be:
- Specific to the date and day of the week
- Based on current planetary transits and moon phases
- Grounded in both Western and Vedic astrology traditions
- Highly practical and actionable
- Balanced - acknowledging both opportunities and cautions
- Personalized to the individual's birth chart
- Inspiring yet realistic

For each day, you will provide insights across all life areas:
- Astrological Influences (moon phases, planetary aspects, energy levels)
- Numerology (personal day numbers and their meaning)
- Career & Work (opportunities, best times, cautions)
- Money & Finance (financial outlook, recommendations)
- Love & Relationships (for couples and singles, healing opportunities)
- Emotional & Mental Health (state, challenges, recommendations)
- Physical Health & Wellness (health outlook, cautions, exercise suggestions)
- Family & Social Life (family and social dynamics)
- Lucky Elements (colors, numbers, times, directions)
- AI Action Plan (actionable items, affirmations, general advice)

CRITICAL TOON FORMATTING RULES:
1. You MUST respond with ONLY valid TOON format - no markdown, no code blocks
2. Do NOT wrap response in \`\`\`toon or \`\`\` markers
3. Use indentation (2 spaces per level) for nested structure
4. Use "key: value" format for all properties
5. Strings with spaces or special characters should be in quotes
6. Arrays can be inline [item1, item2] or multi-line with dashes
7. Complete the entire structure without truncation
8. Numbers should be numeric (not quoted)
9. Booleans should be true/false (not quoted)`;

/**
 * User prompt template for daily astrology predictions
 */
export const DAILY_ASTROLOGY_USER_PROMPT_TEMPLATE = `Generate detailed daily astrology predictions for {dayOfWeek}, {predictionDate} for the following person:

**Personal Details:**
- Full Name: {fullName}
- Birth Date: {birthDate}
- Birth Place: {birthPlace}
- Gender: {gender}
- Sun Sign: {sunSign}
- Moon Sign: {moonSign}
- Rising Sign: {risingSign}

**Current Date Context:**
- Today's Date: {currentDate}
- Target Prediction Date: {predictionDate}
- Days Ahead: {daysAhead}

Provide ONLY valid TOON format response with this exact structure:

dayOfWeek: {dayOfWeek}
predictionDate: {predictionDate}
overallTheme: "Clear, concise theme for the day (2-3 sentences)"
astrologicalInfluence
  moonPhase: "Current moon phase name"
  moonInfluence: "How it affects this person today"
  mercuryAspect: "Relevant mercury aspects"
  mercuryInfluence: "Communication and mental clarity outlook"
  saturnInfluence: "Discipline and responsibility influences"
  energyLevel: 75
  additionalInfluences: "Other relevant planetary influences"
numerologyInfluence
  personalDayNumber: 6
  meaning: "A Personal Day 6 brings emotional balance and harmony"
  influence: "Specific influence on this person today"
careerAndWork
  overview: "Career situation for the day"
  morning: "Best morning activities and timing"
  teamDynamics: "How team interactions will feel"
  cautions: "Things to avoid in career matters"
  opportunities
    - "Opportunity 1"
    - "Opportunity 2"
moneyAndFinance
  overview: "Financial energy for the day"
  recommendations: "What to focus on financially"
  opportunities: "Potential financial gains"
  cautions: "Financial cautions"
loveAndRelationships
  overview: "Relationship energy for the day"
  forCouples: "Advice for people in relationships"
  forSingles: "Advice for single people"
  healingOpportunities: "Opportunities for healing past hurts"
emotionalAndMentalHealth
  overview: "Emotional state prediction"
  emotionalState: "How they will likely feel"
  potentialChallenges: "Mental or emotional challenges to watch"
  recommendations
    - "Recommendation 1"
    - "Recommendation 2"
physicalHealthAndWellness
  overview: "Health and wellness outlook"
  cautions: "Physical cautions"
  recommendations
    - "Wellness recommendation 1"
    - "Wellness recommendation 2"
  exerciseSuggestions: "Best exercise type and timing"
familyAndSocialLife
  familyOverview: "Family dynamics for the day"
  familyOpportunities: "Family connection opportunities"
  socialOverview: "Social energy and interactions"
  socialRecommendations
    - "Social recommendation 1"
    - "Social recommendation 2"
luckyElements
  luckyColor: "Recommended color"
  luckyNumber: 3
  luckyTime: "Best time window for important tasks"
  luckyDirection: "Beneficial direction"
aiActionPlan
  actionItems
    - "Action item 1 for the day"
    - "Action item 2 for the day"
  affirmation: "Positive affirmation for the day"
  generalAdvice: "Overall advice and guidance"

**IMPORTANT:**
- All times should be in 12-hour format (e.g., "2 PM - 4 PM")
- Energy levels should be numeric (0-100)
- Numbers should NOT be quoted
- All text should be clear, specific, and actionable
- Do not include any explanations outside the TOON structure
- Start your response directly with the TOON format`;

/**
 * Default values for days ahead validation
 */
export const DAILY_PREDICTION_CONFIG = {
  MAX_DAYS_RANGE: 7,
  MAX_DAYS_FUTURE: 10,
  MIN_DAYS_PAST: 0,
};


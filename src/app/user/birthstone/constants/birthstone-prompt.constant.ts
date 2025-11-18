/**
 * System prompt for birthstone reading generation
 */
export const BIRTHSTONE_SYSTEM_PROMPT = `You are an expert gemologist, astrologer, and spiritual healer specializing in birthstones and crystal healing. 
You have deep knowledge of:
- Traditional, modern, Ayurvedic, and mystical birthstones for each month
- Zodiac stones and their astrological significance
- Crystal healing properties and chakra connections
- Planetary influences on gemstones (Vedic astrology)
- How to wear gemstones (day, metal, finger, weight)
- Cleansing and charging rituals for stones

Your task is to provide comprehensive, personalized birthstone readings that match the exact structure provided.

IMPORTANT FORMATTING INSTRUCTIONS:
- Respond ONLY in TOON (Token Oriented Object Notation) format
- Use indentation (2 spaces per level) for structure
- Use "key: value" format for properties
- Use inline arrays for simple lists: [item1, item2, item3]
- Use multi-line arrays with dashes (-) for complex objects
- DO NOT wrap your response in markdown code blocks
- DO NOT use JSON braces {} or brackets for structure
- Complete the entire response without truncation
- Include ALL fields specified in the template`;

/**
 * User prompt template for birthstone reading
 */
export const BIRTHSTONE_USER_PROMPT_TEMPLATE = `Generate a comprehensive birthstone reading for:

Full Name: {fullName}
Birth Date: {birthDate}
Birth Place: {birthPlace}
Gender: {gender}

Provide a detailed analysis in TOON format with the following EXACT structure:

overview
  birthMonth: [month name like "November"]
  birthSign: [zodiac sign like "Scorpio"]
  lifePathNumber: [calculated from birth date]
  summary: [brief 2-3 sentence overview of their birthstone profile]
  keyThemes: [theme1, theme2, theme3, theme4, theme5]

birthstoneCategories
  modernBirthstone: [stone name or "Stone1 / Stone2" if multiple]
  traditional: [traditional birthstone]
  ayurvedicBirthstone: [Ayurvedic/Vedic birthstone]
  mysticalBirthstone: [mystical birthstone]
  luckyCharm: [lucky charm stone]
  zodiacStarStone: [zodiac star stone]
  birthdayStone: [birthday stone]

meaningSymbolism: [detailed 3-4 sentence explanation of what these stones represent and symbolize]

keyBenefits
  - [benefit 1 - full sentence]
  - [benefit 2 - full sentence]
  - [benefit 3 - full sentence]
  - [benefit 4 - full sentence]
  - [benefit 5 - full sentence]

planetaryAssociation
  primaryPlanet: [main ruling planet like "Jupiter"]
  secondaryPlanet: [secondary planet if applicable, or null]
  stones: [stone1 → planet1, stone2 → planet2]

chakraConnection
  chakraName: [chakra name like "Solar Plexus Chakra"]
  description: [what this chakra governs - full sentence]
  benefits: [benefit1, benefit2, benefit3]

howToWear
  day: [best day to wear like "Thursday"]
  metal: [recommended metal like "Gold" or "Silver"]
  finger: [which finger like "Index finger" or "Ring finger"]
  recommendedWeight: [weight range like "5-7 carats" or "3-5 carats"]
  additionalInstructions: [any special wearing instructions]

cleansingCharging
  steps
    - [step 1 - how to cleanse]
    - [step 2 - how to charge]
    - [step 3 - optional methods]
  frequency: [how often to cleanse like "weekly" or "monthly"]
  bestTime: [best time for cleansing like "early morning sunlight"]

substituteStone: [name of substitute stone that can be used instead, with brief reason why]

additionalProperties
  healingProperties
    - [physical healing property 1]
    - [physical healing property 2]
    - [physical healing property 3]
  emotionalBenefits
    - [emotional benefit 1]
    - [emotional benefit 2]
    - [emotional benefit 3]
  spiritualSignificance
    - [spiritual significance 1]
    - [spiritual significance 2]
    - [spiritual significance 3]
  historicalContext: [2-3 sentences about historical and cultural significance of these stones]

IMPORTANT: Generate ALL fields above. Base the birthstone categories on the person's birth month. Use traditional Vedic/Ayurvedic astrology knowledge for planetary associations. Be specific and detailed in all descriptions.`;

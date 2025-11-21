/**
 * Complete Astrology and Numerology Reading Interface
 */

export interface IAstrologyNumerologyReading {
  numerology: INumerologyReading;
  astrology: IAstrologyReading;
  combinedInsights: ICombinedInsights;
}

// ============= NUMEROLOGY INTERFACES =============

export interface INumerologyReading {
  coreNumbers: ICoreNumbers;
  karmicAndSpiritual: IKarmicAndSpiritual;
  timelines: ITimelines;
  guidance: INumerologyGuidance;
}

export interface ICoreNumbers {
  lifePath: INumberInterpretation;
  expression: INumberInterpretation;
  soulUrge: INumberInterpretation;
  personality: INumberInterpretation;
  birthday: ISimpleNumberInterpretation;
  maturity: INumberInterpretation;
  balance: ISimpleNumberMeaning;
  hiddenPassion: IMultiNumberMeaning;
  rationalThought: INumberInterpretation;
  subconsciousSelf: ISimpleNumberMeaning;
  cornerstone: ILetterMeaning;
  capstone: ILetterMeaning;
  firstVowel: ILetterMeaning;
}

export interface INumberInterpretation {
  number: number;
  calculation: string;
  meaning: string;
  detailedInterpretation: string;
}

export interface ISimpleNumberInterpretation {
  number: number;
  meaning: string;
  detailedInterpretation: string;
}

export interface ISimpleNumberMeaning {
  number: number;
  meaning: string;
  calculation?: string;
}

export interface IMultiNumberMeaning {
  numbers: number[];
  meaning: string;
}

export interface ILetterMeaning {
  letter: string;
  meaning: string;
}

export interface IKarmicAndSpiritual {
  karmicLessons: {
    numbers: number[];
    interpretation: string;
  };
  karmicDebts: {
    numbers: number[];
    interpretation: string;
  };
  masterNumbers: {
    numbers: number[];
    interpretation: string;
  };
  pastLifeTendencies: string;
}

export interface ITimelines {
  personalYear: IPersonalCycle;
  personalMonth: ISimpleNumberMeaning;
  personalDay: ISimpleNumberMeaning;
  pinnacles: IPinnacle[];
  challenges: IChallenge[];
  periodCycles: IPeriodCycle[];
}

export interface IPersonalCycle {
  number: number;
  meaning: string;
  guidance: string;
}

export interface IPinnacle {
  number: number;
  ageRange: string;
  meaning: string;
}

export interface IChallenge {
  number: number;
  ageRange: string;
  meaning: string;
}

export interface IPeriodCycle {
  cycle: string;
  number: number;
  ageRange: string;
  meaning: string;
}

export interface INumerologyGuidance {
  career: {
    suitedProfessions: string[];
    strengths: string[];
    advice: string;
  };
  relationships: {
    compatibleNumbers: number[];
    relationshipStyle: string;
    advice: string;
  };
  money: {
    financialTendencies: string;
    advice: string;
  };
  health: {
    tendencies: string;
    advice: string;
  };
  strengths: string[];
  weaknesses: string[];
  overallAdvice: string;
}

// ============= ASTROLOGY INTERFACES =============

export interface IAstrologyReading {
  planets: IPlanets;
  chartCharacteristics: IChartCharacteristics;
  houses: IHouses;
  aspects: IAspect[];
  patterns: IPatterns;
  predictions: IPredictions;
  planetPositionSummary: IPlanetPositionSummary;
  birthstone: IBirthstone;
  healingStones: IHealingStones;
}

export interface IPlanets {
  sun: IPlanetPlacement;
  moon: IPlanetPlacement;
  rising: IRisingPlacement;
  mercury: IPlanetPlacement;
  venus: IPlanetPlacement;
  mars: IPlanetPlacement;
  jupiter: IPlanetPlacement;
  saturn: IPlanetPlacement;
  uranus: IPlanetPlacement;
  neptune: IPlanetPlacement;
  pluto: IPlanetPlacement;
  northNode: INodePlacement;
  southNode: INodePlacement;
  chiron: INodePlacement;
  lilith: INodePlacement;
  vertex: INodePlacement;
  partOfFortune: INodePlacement;
}

export interface IPlanetPlacement {
  sign: string;
  house: number;
  degree: string;
  motion: string;
  degAbsolute: string;
  interpretation: string;
}

export interface IRisingPlacement {
  sign: string;
  degree: string;
  motion: string;
  degAbsolute: string;
  interpretation: string;
}

export interface INodePlacement {
  sign: string;
  house: number;
  interpretation: string;
}

export interface IChartCharacteristics {
  dominantElement: {
    element: string;
    meaning: string;
  };
  dominantModality: {
    modality: string;
    meaning: string;
  };
  stelliums: IStellium[];
}

export interface IStellium {
  sign: string;
  planets: string[];
  meaning: string;
}

export interface IHouses {
  house1: string;
  house2: string;
  house3: string;
  house4: string;
  house5: string;
  house6: string;
  house7: string;
  house8: string;
  house9: string;
  house10: string;
  house11: string;
  house12: string;
}

export interface IAspect {
  planet1: string;
  aspect: string;
  planet2: string;
  orb: string;
  interpretation: string;
}

export interface IPatterns {
  psychological: string;
  relationships: string;
  career: string;
}

export interface IPredictions {
  currentTransits: ITransit[];
  progressions: string;
  solarReturn: string;
  saturnReturn: {
    applicable: boolean;
    timing?: string;
    interpretation?: string;
  };
}

export interface ITransit {
  transit: string;
  timing: string;
  interpretation: string;
}

// ============= PLANET POSITION SUMMARY & STONES INTERFACES =============

export interface IPlanetPositionSummary {
  overview: string;
  keyPlacements: string[];
  strengths: string[];
  challenges: string[];
  dominantInfluences: string;
  energyBalance: string;
}

export interface IBirthstone {
  primary: {
    name: string;
    color: string;
    properties: string;
    wearingAdvice: string;
  };
  secondary: {
    name: string;
    color: string;
    properties: string;
    wearingAdvice: string;
  };
  zodiacStone: {
    name: string;
    color: string;
    properties: string;
    wearingAdvice: string;
  };
}

export interface IHealingStones {
  recommendedStones: IStone[];
  planetaryStones: IPlanetaryStone[];
  chakraStones: IChakraStone[];
  usageGuidance: {
    howToWear: string;
    bestTimes: string;
    cleansing: string;
    charging: string;
    generalAdvice: string;
  };
}

export interface IStone {
  name: string;
  color: string;
  purpose: string;
  benefits: string[];
  wearingMethod: string;
}

export interface IPlanetaryStone {
  planet: string;
  stone: string;
  color: string;
  purpose: string;
  benefits: string[];
}

export interface IChakraStone {
  chakra: string;
  stone: string;
  color: string;
  purpose: string;
  benefits: string[];
}

// ============= COMBINED INSIGHTS INTERFACES =============

export interface ICombinedInsights {
  personalitySummary: string;
  lifePurpose: string;
  relationshipInsights: {
    romanticStyle: string;
    compatibility: string;
    advice: string;
  };
  careerMap: {
    idealFields: string[];
    workStyle: string;
    successFactors: string[];
    advice: string;
  };
  strengthsAndChallenges: {
    coreStrengths: string[];
    mainChallenges: string[];
    integrationAdvice: string;
  };
  twelveMonthForecast: IMonthlyForecast[];
}

export interface IMonthlyForecast {
  month: string;
  numerologyTheme: string;
  astrologyTheme: string;
  combinedGuidance: string;
}

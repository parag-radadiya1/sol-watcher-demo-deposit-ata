/**
 * Complete Birthstone Reading Interface
 */

export interface IBirthstoneReading {
  overview: IBirthstoneOverview;
  birthstoneCategories: IBirthstoneCategories;
  meaningSymbolism: string;
  keyBenefits: string[];
  planetaryAssociation: IPlanetaryAssociation;
  chakraConnection: IChakraConnection;
  howToWear: IHowToWear;
  cleansingCharging: ICleansingCharging;
  substituteStone: string;
  additionalProperties?: IAdditionalProperties;
}

export interface IBirthstoneOverview {
  birthMonth: string;
  birthSign: string;
  lifePathNumber?: number;
  summary: string;
  keyThemes: string[];
}

export interface IBirthstoneCategories {
  modernBirthstone: string;
  traditional: string;
  ayurvedicBirthstone: string;
  mysticalBirthstone: string;
  luckyCharm: string;
  zodiacStarStone: string;
  birthdayStone: string;
}

export interface IPlanetaryAssociation {
  primaryPlanet: string;
  secondaryPlanet?: string;
  stones: string[];
}

export interface IChakraConnection {
  chakraName: string;
  description: string;
  benefits: string[];
}

export interface IHowToWear {
  day: string;
  metal: string;
  finger: string;
  recommendedWeight: string;
  additionalInstructions?: string;
}

export interface ICleansingCharging {
  steps: string[];
  frequency?: string;
  bestTime?: string;
}

export interface IAdditionalProperties {
  healingProperties?: string[];
  emotionalBenefits?: string[];
  spiritualSignificance?: string[];
  historicalContext?: string;
}

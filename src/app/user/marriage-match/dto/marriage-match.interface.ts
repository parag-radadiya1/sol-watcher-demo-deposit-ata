export interface IMarriageMatchResponse {
  matchId: string;
  partners: {
    boy: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
    girl: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
  };
  synastry: {
    overallSummary: string;
    aspects: Array<{
      planet1: string;
      planet2: string;
      aspect: string;
      orb: number;
      interpretation: string;
    }>;
    compatibilityFactors: {
      emotional: string;
      intellectual: string;
      physical: string;
      spiritual: string;
    };
  };
  compositeChart: {
    sun: {
      sign: string;
      house: number;
      interpretation: string;
    };
    moon: {
      sign: string;
      house: number;
      interpretation: string;
    };
    ascendant: {
      sign: string;
      interpretation: string;
    };
    venus: {
      sign: string;
      house: number;
      interpretation: string;
    };
    mars: {
      sign: string;
      house: number;
      interpretation: string;
    };
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };
  scores: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };
  finalSummary: {
    short: string;
    detailed: string;
  };
  createdAt: Date;
  cached?: boolean;
  cacheSource?: string;
}

export interface IMarriageMatchesListResponse {
  total: number;
  matches: Array<{
    _id: string;
    partners: {
      boy: {
        name: string;
        birthDate: string;
        birthTime: string;
        birthPlace: string;
        gender: string;
      };
      girl: {
        name: string;
        birthDate: string;
        birthTime: string;
        birthPlace: string;
        gender: string;
      };
    };
    scores: {
      love: number;
      emotion: number;
      communication: number;
      sexuality: number;
      overall: number;
    };
    finalSummary: {
      short: string;
      detailed: string;
    };
    createdAt: Date;
  }>;
}

export interface IMarriageMatchDetailResponse {
  _id?: string;
  userId: string;
  partners: {
    boy: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
    girl: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
  };
  synastry: {
    overallSummary: string;
    aspects: Array<{
      planet1: string;
      planet2: string;
      aspect: string;
      orb: number;
      interpretation: string;
    }>;
    compatibilityFactors: {
      emotional: string;
      intellectual: string;
      physical: string;
      spiritual: string;
    };
  };
  compositeChart: {
    sun: {
      sign: string;
      house: number;
      interpretation: string;
    };
    moon: {
      sign: string;
      house: number;
      interpretation: string;
    };
    ascendant: {
      sign: string;
      interpretation: string;
    };
    venus: {
      sign: string;
      house: number;
      interpretation: string;
    };
    mars: {
      sign: string;
      house: number;
      interpretation: string;
    };
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };
  scores: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };
  finalSummary: {
    short: string;
    detailed: string;
  };
  source: string;
  partnerId?: string;
  partnerDetailsHash?: string;
  toonMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

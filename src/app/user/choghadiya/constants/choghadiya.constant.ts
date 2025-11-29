/**
 * Choghadiya constants and mappings
 */

export enum ChoghadiyaType {
  AMRIT = 'Amrit',
  CHAR = 'Char',
  LABH = 'Labh',
  SHUBH = 'Shubh',
  UDVEG = 'Udveg',
  KAAL = 'Kaal',
  ROG = 'Rog',
}

export enum ChoghadiyaNature {
  AUSPICIOUS = 'Auspicious',
  INAUSPICIOUS = 'Inauspicious',
  NEUTRAL = 'Neutral',
}

/**
 * Day Choghadiya mapping for each day of the week
 * Index 0 = Sunday, 6 = Saturday
 */
export const DAY_CHOGHADIYA_MAP: Record<number, ChoghadiyaType[]> = {
  0: [ // Sunday: Starts with Udveg
    ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR, ChoghadiyaType.LABH, ChoghadiyaType.AMRIT,
    ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH, ChoghadiyaType.ROG, ChoghadiyaType.UDVEG,
  ],
  1: [ // Monday: Starts with Amrit
    ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH, ChoghadiyaType.ROG,
    ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR, ChoghadiyaType.LABH, ChoghadiyaType.AMRIT,
  ],
  2: [ // Tuesday: Starts with Rog
    ChoghadiyaType.ROG, ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR, ChoghadiyaType.LABH,
    ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH, ChoghadiyaType.ROG,
  ],
  3: [ // Wednesday: Starts with Labh
    ChoghadiyaType.LABH, ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH,
    ChoghadiyaType.ROG, ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR, ChoghadiyaType.LABH,
  ],
  4: [ // Thursday: Starts with Shubh
    ChoghadiyaType.SHUBH, ChoghadiyaType.ROG, ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR,
    ChoghadiyaType.LABH, ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH,
  ],
  5: [ // Friday: Starts with Char
    ChoghadiyaType.CHAR, ChoghadiyaType.LABH, ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL,
    ChoghadiyaType.SHUBH, ChoghadiyaType.ROG, ChoghadiyaType.UDVEG, ChoghadiyaType.CHAR,
  ],
  6: [ // Saturday: Starts with Kaal
    ChoghadiyaType.KAAL, ChoghadiyaType.SHUBH, ChoghadiyaType.ROG, ChoghadiyaType.UDVEG,
    ChoghadiyaType.CHAR, ChoghadiyaType.LABH, ChoghadiyaType.AMRIT, ChoghadiyaType.KAAL,
  ],
};

/**
 * Night Choghadiya mapping for each day of the week
 * Index 0 = Sunday, 6 = Saturday
 */
export const NIGHT_CHOGHADIYA_MAP: Record<number, ChoghadiyaType[]> = {
  0: [ // Sunday Night: Starts with Shubh
    ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR, ChoghadiyaType.ROG,
    ChoghadiyaType.KAAL, ChoghadiyaType.LABH, ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH,
  ],
  1: [ // Monday Night: Starts with Char
    ChoghadiyaType.CHAR, ChoghadiyaType.ROG, ChoghadiyaType.KAAL, ChoghadiyaType.LABH,
    ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR,
  ],
  2: [ // Tuesday Night: Starts with Kaal
    ChoghadiyaType.KAAL, ChoghadiyaType.LABH, ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH,
    ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR, ChoghadiyaType.ROG, ChoghadiyaType.KAAL,
  ],
  3: [ // Wednesday Night: Starts with Udveg
    ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR,
    ChoghadiyaType.ROG, ChoghadiyaType.KAAL, ChoghadiyaType.LABH, ChoghadiyaType.UDVEG,
  ],
  4: [ // Thursday Night: Starts with Amrit
    ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR, ChoghadiyaType.ROG, ChoghadiyaType.KAAL,
    ChoghadiyaType.LABH, ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT,
  ],
  5: [ // Friday Night: Starts with Rog
    ChoghadiyaType.ROG, ChoghadiyaType.KAAL, ChoghadiyaType.LABH, ChoghadiyaType.UDVEG,
    ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT, ChoghadiyaType.CHAR, ChoghadiyaType.ROG,
  ],
  6: [ // Saturday Night: Starts with Labh
    ChoghadiyaType.LABH, ChoghadiyaType.UDVEG, ChoghadiyaType.SHUBH, ChoghadiyaType.AMRIT,
    ChoghadiyaType.CHAR, ChoghadiyaType.ROG, ChoghadiyaType.KAAL, ChoghadiyaType.LABH,
  ],
};

/**
 * Choghadiya nature and descriptions
 */
export const CHOGHADIYA_INFO: Record<
  ChoghadiyaType,
  { nature: ChoghadiyaNature; description: string; meaning: string }
> = {
  [ChoghadiyaType.AMRIT]: {
    nature: ChoghadiyaNature.AUSPICIOUS,
    description: 'Best time for all auspicious activities',
    meaning: 'Nectar - Most auspicious',
  },
  [ChoghadiyaType.SHUBH]: {
    nature: ChoghadiyaNature.AUSPICIOUS,
    description: 'Good for important work and new beginnings',
    meaning: 'Auspicious',
  },
  [ChoghadiyaType.LABH]: {
    nature: ChoghadiyaNature.AUSPICIOUS,
    description: 'Favorable for business and financial activities',
    meaning: 'Profit',
  },
  [ChoghadiyaType.CHAR]: {
    nature: ChoghadiyaNature.NEUTRAL,
    description: 'Good for traveling and movement',
    meaning: 'Movable',
  },
  [ChoghadiyaType.ROG]: {
    nature: ChoghadiyaNature.INAUSPICIOUS,
    description: 'Avoid important activities',
    meaning: 'Disease',
  },
  [ChoghadiyaType.KAAL]: {
    nature: ChoghadiyaNature.INAUSPICIOUS,
    description: 'Highly inauspicious, avoid new beginnings',
    meaning: 'Death',
  },
  [ChoghadiyaType.UDVEG]: {
    nature: ChoghadiyaNature.INAUSPICIOUS,
    description: 'Not favorable for important work',
    meaning: 'Anxiety',
  },
};

/**
 * Response messages
 */
export const choghadiyaResponse = {
  success: 'Choghadiya data retrieved successfully',
  invalidDate: 'Invalid date provided',
  invalidCoordinates: 'Invalid latitude or longitude',
  calculationError: 'Error calculating Choghadiya times',
};

// Rahu Kalam (day-only)
// Sunday(8), Mon(2), Tue(7), Wed(5), Thu(6), Fri(4), Sat(3)
export const rahuSegments: Record<number, number> = {
  0: 8, 1: 2, 2: 7, 3: 5, 4: 6, 5: 4, 6: 3
};

// Standard: Sun(5), Mon(4), Tue(3), Wed(2), Thu(1), Fri(7), Sat(6)
export const yamagandaSegments: Record<number, number> = {
  0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 7, 6: 6
};

// Standard: Sun(7), Mon(6), Tue(5), Wed(4), Thu(3), Fri(2), Sat(1)
export const gulikaSegments: Record<number, number> = {
  0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1
};

// Standard: Sun(4), Mon(7), Tue(2), Wed(5), Thu(8), Fri(3), Sat(6)
export const vaarVelaSegments: Record<number, number> = {
  0: 4, 1: 7, 2: 2, 3: 5, 4: 8, 5: 3, 6: 6,
};

// Standard: Sun(5), Mon(2), Tue(6), Wed(3), Thu(7), Fri(4), Sat(1/8*)
// *Note: Some texts say Sat is 1, some say 8. 1 is widely accepted for Day Kaal Vela.
export const kaalVelaSegments: Record<number, number> = {
  0: 5, 1: 2, 2: 6, 3: 3, 4: 7, 5: 4, 6: 1,
};
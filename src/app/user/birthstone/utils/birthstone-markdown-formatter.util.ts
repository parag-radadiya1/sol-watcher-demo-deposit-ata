/**
 * Utility to convert birthstone reading data to Markdown format
 * Matches the exact format of birthstone_overview.md
 */
export class BirthstoneMarkdownFormatter {
  /**
   * Convert a birthstone reading object to markdown format
   */
  static toMarkdown(reading: any): string {
    const sections: string[] = [];

    // Title with emoji
    sections.push(`# 💎 Birthstone Overview\n\n`);

    // Overview section
    if (reading.overview) {
      sections.push(`## 📋 Overview\n`);
      if (reading.overview.summary) {
        sections.push(`${reading.overview.summary}\n\n`);
      }
      if (reading.overview.keyThemes && Array.isArray(reading.overview.keyThemes)) {
        sections.push(`**Key Themes:** ${reading.overview.keyThemes.join(', ')}\n\n`);
      }
    }

    sections.push(`${'---'}\n\n`);

    // Birthstone Categories Table
    if (reading.birthstoneCategories) {
      sections.push(`## Birthstone Categories\n\n`);
      sections.push(`| Category                | Stone(s)               |\n`);
      sections.push(`|-------------------------|------------------------|\n`);
      
      const categories = reading.birthstoneCategories;
      if (categories.modernBirthstone) {
        sections.push(`| **Modern Birthstone**   | ${categories.modernBirthstone} |\n`);
      }
      if (categories.traditional) {
        sections.push(`| **Traditional**         | ${categories.traditional} |\n`);
      }
      if (categories.ayurvedicBirthstone) {
        sections.push(`| **Ayurvedic Birthstone**| ${categories.ayurvedicBirthstone} |\n`);
      }
      if (categories.mysticalBirthstone) {
        sections.push(`| **Mystical Birthstone** | ${categories.mysticalBirthstone} |\n`);
      }
      if (categories.luckyCharm) {
        sections.push(`| **Lucky Charm**         | ${categories.luckyCharm} |\n`);
      }
      if (categories.zodiacStarStone) {
        sections.push(`| **Zodiac Star Stone**   | ${categories.zodiacStarStone} |\n`);
      }
      if (categories.birthdayStone) {
        sections.push(`| **Birthday Stone**      | ${categories.birthdayStone} |\n`);
      }
      
      sections.push(`\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Meaning / Symbolism
    if (reading.meaningSymbolism) {
      sections.push(`## ✨ Meaning / Symbolism\n`);
      sections.push(`${reading.meaningSymbolism}\n\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Key Benefits
    if (reading.keyBenefits && Array.isArray(reading.keyBenefits)) {
      sections.push(`## 🌟 Key Benefits\n`);
      reading.keyBenefits.forEach((benefit: string) => {
        sections.push(`- ${benefit}\n`);
      });
      sections.push(`\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Planetary Association
    if (reading.planetaryAssociation) {
      sections.push(`## 🔮 Planetary Association\n`);
      const pa = reading.planetaryAssociation;
      if (pa.primaryPlanet) {
        sections.push(`- **${pa.stones ? pa.stones[0] : 'Stone'}** → ${pa.primaryPlanet}\n`);
      }
      if (pa.secondaryPlanet && pa.stones && pa.stones.length > 1) {
        sections.push(`- **${pa.stones[1]}** → ${pa.secondaryPlanet}\n`);
      }
      sections.push(`\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Chakra Connection
    if (reading.chakraConnection) {
      sections.push(`## 🔥 Chakra Connection\n`);
      sections.push(`- **${reading.chakraConnection.chakraName}** – ${reading.chakraConnection.description}\n\n`);
    }

    sections.push(`${'---'}\n\n`);

    // How to Wear
    if (reading.howToWear) {
      sections.push(`## 🧭 How to Wear\n`);
      const htw = reading.howToWear;
      if (htw.day) sections.push(`- **Day:** ${htw.day}\n`);
      if (htw.metal) sections.push(`- **Metal:** ${htw.metal}\n`);
      if (htw.finger) sections.push(`- **Finger:** ${htw.finger}\n`);
      if (htw.recommendedWeight) sections.push(`- **Recommended Weight:** ${htw.recommendedWeight}\n`);
      sections.push(`\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Cleansing & Charging
    if (reading.cleansingCharging) {
      sections.push(`## 🧼 Cleansing & Charging\n`);
      const cc = reading.cleansingCharging;
      if (cc.method && Array.isArray(cc.method)) {
        cc.method.forEach((method: string) => {
          sections.push(`- ${method}\n`);
        });
      } else if (typeof cc === 'string') {
        sections.push(`${cc}\n`);
      }
      sections.push(`\n`);
    }

    sections.push(`${'---'}\n\n`);

    // Substitute Stone
    if (reading.substituteStone) {
      sections.push(`## 🔁 Substitute Stone\n`);
      sections.push(`- ${reading.substituteStone}\n\n`);
    }

    // Additional Properties
    if (reading.additionalProperties) {
      sections.push(`${'---'}\n\n`);
      sections.push(`## ✨ Additional Properties\n`);
      const ap = reading.additionalProperties;
      if (ap.element) sections.push(`- **Element:** ${ap.element}\n`);
      if (ap.color) sections.push(`- **Color:** ${ap.color}\n`);
      if (ap.origin) sections.push(`- **Origin:** ${ap.origin}\n`);
      if (ap.vibration) sections.push(`- **Vibration:** ${ap.vibration}\n`);
      if (ap.description) sections.push(`\n${ap.description}\n`);
    }

    return sections.join('');
  }
}


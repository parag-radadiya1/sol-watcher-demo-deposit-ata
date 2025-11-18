/**
 * Utility to convert daily prediction data to Markdown format
 * Matches the exact format of wednesday_prediction.md
 */
export class DailyPredictionMarkdownFormatter {
  /**
   * Convert a daily prediction object to markdown format
   */
  static toMarkdown(prediction: any, dayOfWeek: string): string {
    const formatNumber = (num: any): string => {
      if (typeof num === 'number') return num.toString();
      return num?.toString() || 'N/A';
    };

    const sections: string[] = [];

    // Title
    sections.push(`# 📅 **${dayOfWeek} --- Detailed Daily Prediction**\n`);

    // Overall Theme
    sections.push(`## 🌟 **Overall Theme**\n`);
    sections.push(`${prediction.overallTheme || 'No theme available'}\n`);
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Astrological Influence
    sections.push(`## 🔮 **Astrological Influence**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatAstrologicalInfluence(prediction.astrologicalInfluence));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Numerology Influence
    sections.push(`## 🔢 **Numerology Influence --- Personal Day Number: ${formatNumber(prediction.numerologyInfluence?.personalDayNumber)}**\n`);
    sections.push(`${prediction.numerologyInfluence?.meaning || 'No numerology data available'}\n\n`);
    if (prediction.numerologyInfluence?.influence) {
      sections.push(`${prediction.numerologyInfluence.influence}\n`);
    }
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Career & Work
    sections.push(`## 💼 **Career & Work**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatCareerAndWork(prediction.careerAndWork));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Money & Finance
    sections.push(`## 💰 **Money & Finance**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatMoneyAndFinance(prediction.moneyAndFinance));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Love & Relationships
    sections.push(`## ❤️ **Love & Relationships**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatLoveAndRelationships(prediction.loveAndRelationships));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Emotional & Mental Health
    sections.push(`## 😌 **Emotional & Mental Health**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatEmotionalAndMentalHealth(prediction.emotionalAndMentalHealth));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Physical Health & Wellness
    sections.push(`## 🧘 **Physical Health & Wellness**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatPhysicalHealthAndWellness(prediction.physicalHealthAndWellness));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Family & Social Life
    sections.push(`## 👨‍👩‍👧 **Family & Social Life**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatFamilyAndSocialLife(prediction.familyAndSocialLife));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // Lucky Elements
    sections.push(`## ✨ **Lucky Elements**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatLuckyElements(prediction.luckyElements));
    sections.push(`${'------------------------------------------------------------------------'}\n`);

    // AI Action Plan
    sections.push(`## 📌 **AI Action Plan for the Day**\n`);
    sections.push(DailyPredictionMarkdownFormatter.formatAIActionPlan(prediction.aiActionPlan));

    return sections.join('');
  }

  private static formatAstrologicalInfluence(data: any): string {
    if (!data) return 'No astrological data available\n\n';

    let content = '';

    // Add narrative content
    if (data.additionalInfluences) {
      content += `${data.additionalInfluences}\n`;
    }

    if (data.moonPhase && data.moonInfluence) {
      if (content) content += ' ';
      content += `Today is strongly influenced by the **${data.moonPhase}**, which enhances ${data.moonInfluence}.`;
    }

    if (data.mercuryAspect && data.mercuryInfluence) {
      if (content) content += ' ';
      content += `A harmonious **${data.mercuryAspect}** boosts ${data.mercuryInfluence}.`;
    }

    if (data.saturnInfluence) {
      if (content) content += ' ';
      content += `You may naturally feel more ${data.saturnInfluence}.`;
    }

    content += '\n\n';

    // Create table with proper formatting
    content += '| Astro Factor              | Influence                                                 |\n';
    content += '| ------------------------- | --------------------------------------------------------- |\n';

    if (data.moonPhase) {
      content += `| ${data.moonPhase.padEnd(25)} | ${(data.moonInfluence || 'Lunar influence on energy and emotions').substring(0, 59).padEnd(59)} |\n`;
    }
    if (data.mercuryAspect) {
      content += `| ${data.mercuryAspect.padEnd(25)} | ${(data.mercuryInfluence || 'Mental clarity and communication').substring(0, 59).padEnd(59)} |\n`;
    }
    if (data.saturnInfluence) {
      content += `| Saturn's subtle influence | ${data.saturnInfluence.substring(0, 59).padEnd(59)} |\n`;
    }
    if (data.energyLevel) {
      const energyText = `**${data.energyLevel} / 100**`;
      content += `| Energy Level              | ${energyText.padEnd(59)} |\n`;
    }

    content += '\n\n';
    return content;
  }

  private static formatCareerAndWork(data: any): string {
    if (!data) return 'No career data available\n\n';

    let content = '';

    if (data.overview) {
      content += `${data.overview}`;
    }

    if (data.morning) {
      if (content) content += ' ';
      content += `${data.morning}`;
    }

    if (data.teamDynamics) {
      if (content) content += ' ';
      content += `${data.teamDynamics}`;
    }

    if (data.opportunities && Array.isArray(data.opportunities) && data.opportunities.length > 0) {
      if (content) content += ' ';
      content += data.opportunities.join(' ');
    }

    if (data.cautions) {
      if (content) content += ' ';
      content += `${data.cautions}`;
    }

    content += '\n\n';
    return content;
  }

  private static formatMoneyAndFinance(data: any): string {
    if (!data) return 'No financial data available\n\n';

    let content = '';

    if (data.overview) {
      content += `${data.overview}`;
    }

    if (data.recommendations) {
      if (content) content += ' ';
      content += `${data.recommendations}`;
    }

    if (data.opportunities) {
      if (content) content += ' ';
      content += `${data.opportunities}`;
    }

    if (data.cautions) {
      if (content) content += ' ';
      content += `${data.cautions}`;
    }

    content += '\n\n';
    return content;
  }

  private static formatLoveAndRelationships(data: any): string {
    if (!data) return 'No relationship data available\n\n';

    let content = '';

    if (data.overview) {
      content += `${data.overview}`;
    }

    if (data.forCouples) {
      if (content) content += ' ';
      content += `${data.forCouples}`;
    }

    if (data.forSingles) {
      if (content) content += ' ';
      content += `${data.forSingles}`;
    }

    if (data.healingOpportunities) {
      if (content) content += ' ';
      content += `${data.healingOpportunities}`;
    }

    content += '\n\n';
    return content;
  }

  private static formatEmotionalAndMentalHealth(data: any): string {
    if (!data) return 'No emotional/mental health data available\n\n';

    let content = '';

    if (data.overview) {
      content += `${data.overview}`;
    }

    if (data.emotionalState) {
      if (content) content += ' ';
      content += `${data.emotionalState}`;
    }

    if (data.potentialChallenges) {
      if (content) content += ' ';
      content += `${data.potentialChallenges}`;
    }

    if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      if (content) content += ' ';
      content += data.recommendations.join(' ');
    }

    content += '\n\n';
    return content;
  }

  private static formatPhysicalHealthAndWellness(data: any): string {
    if (!data) return 'No health/wellness data available\n\n';

    let content = '';

    if (data.overview) {
      content += `${data.overview}`;
    }

    if (data.cautions) {
      if (content) content += ' ';
      content += `${data.cautions}`;
    }

    if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      if (content) content += ' ';
      content += data.recommendations.join(' ');
    }

    if (data.exerciseSuggestions) {
      if (content) content += ' ';
      content += `${data.exerciseSuggestions}`;
    }

    content += '\n\n';
    return content;
  }

  private static formatFamilyAndSocialLife(data: any): string {
    if (!data) return 'No family/social data available\n\n';

    let content = '';

    if (data.familyOverview) {
      content += `${data.familyOverview}`;
    }

    if (data.familyOpportunities) {
      if (content) content += ' ';
      content += `${data.familyOpportunities}`;
    }

    if (data.socialOverview) {
      if (content) content += ' ';
      content += `${data.socialOverview}`;
    }

    if (data.socialRecommendations && Array.isArray(data.socialRecommendations) && data.socialRecommendations.length > 0) {
      if (content) content += ' ';
      content += data.socialRecommendations.join(' ');
    }

    content += '\n\n';
    return content;
  }

  private static formatLuckyElements(data: any): string {
    if (!data) return 'No lucky elements data available\n\n';

    let content = '  Element               Value\n';
    content += '  --------------------- --------------\n';

    if (data.luckyColor) {
      content += `  **Lucky Color**       ${data.luckyColor}\n`;
    }
    if (data.luckyNumber) {
      content += `  **Lucky Number**      ${data.luckyNumber}\n`;
    }
    if (data.luckyTime) {
      content += `  **Lucky Time**        ${data.luckyTime}\n`;
    }
    if (data.luckyDirection) {
      content += `  **Lucky Direction**   ${data.luckyDirection}\n`;
    }

    content += '\n\n';
    return content;
  }

  private static formatAIActionPlan(data: any): string {
    if (!data) return 'No action plan available';

    let content = '';

    if (data.actionItems && Array.isArray(data.actionItems) && data.actionItems.length > 0) {
      data.actionItems.forEach((item: string) => {
        content += `-   ${item}\\\n`;
      });
      content += '-   ';
      if (data.affirmation) {
        content += `**Affirmation:** *"${data.affirmation}"*\n`;
      }
    }

    return content;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { LangChainService } from '@app/langchain/langchain.service';
import { ASTROLOGY_VALIDATION_SYSTEM_PROMPT } from '../constants/chat-validation-prompt.constant';

@Injectable()
export class ChatValidationService {
  private readonly logger = new Logger(ChatValidationService.name);

  constructor(private readonly langChainService: LangChainService) {}

  /**
   * Validate if user message is astrology-related using AI
   * Returns true if valid, false if not related to astrology
   */
  async isAstrologyRelated(message: string): Promise<boolean> {
    try {
      // Quick validation for empty or very short messages
      if (!message || message.trim().length < 2) {
        return false;
      }

      // Allow common conversational phrases without AI check (to save tokens)
      const commonPhrases = [
        'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay',
        'yes', 'no', 'got it', 'i see', 'understood'
      ];

      const normalizedMessage = message.toLowerCase().trim();
      if (commonPhrases.some(phrase => normalizedMessage === phrase)) {
        this.logger.log(`Allowing conversational phrase: "${message}"`);
        return true;
      }

      // Use AI to validate if the message is astrology-related
      this.logger.log(`Validating if message is astrology-related: "${message.substring(0, 50)}..."`);

      const validationPrompt = `User message: "${message}"

Is this astrology/numerology related? Answer only YES or NO.`;

      // Use lightweight AI call for validation (no user ID needed, no token tracking)
      const response = await this.langChainService.simpleChat(
        ASTROLOGY_VALIDATION_SYSTEM_PROMPT,
        validationPrompt
      );

      const answer = response.trim().toUpperCase();
      const isValid = answer.startsWith('YES');

      this.logger.log(`Validation result for "${message.substring(0, 30)}...": ${isValid ? 'VALID' : 'INVALID'} (AI response: ${answer})`);

      return isValid;
    } catch (error) {
      this.logger.error('Error validating astrology content:', error);
      // On error, allow the message through (fail open to avoid blocking users)
      return true;
    }
  }

  /**
   * Get a friendly error message for non-astrology content
   */
  getNonAstrologyMessage(): string {
    return "I specialize in astrology and numerology. Let me know if you have questions about your birth chart, life path, zodiac signs, or cosmic guidance! 🌟";
  }
}

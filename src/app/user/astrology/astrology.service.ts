import { Injectable, HttpStatus } from '@nestjs/common';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import {
  CheckAstrologyDto,
  IAstrologyResponse,
  IncompleteBirthDetailsException,
  AstrologyServiceException
} from './dto';
import { AstrologyReadingModelService } from './entities/astrology-reading.service';
import {
  ASTROLOGY_SYSTEM_PROMPT,
  ASTROLOGY_USER_PROMPT_TEMPLATE,
  SPECIFIC_QUESTION_TEMPLATE
} from './constants/astrology-prompt.constant';
import { IAstrologyNumerologyReading } from './interfaces/astrology-reading.interface';
import { QueueService } from '@app/queue/queue.service';

@Injectable()
export class AstrologyService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
    private readonly astrologyReadingModelService: AstrologyReadingModelService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * @description Get astrology reading for the authenticated user using AI with queue processing
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {CheckAstrologyDto} value - Optional question from user
   * @returns {Promise<ICommonResponse<IAstrologyResponse>>} Astrology reading response or job status
   * @throws {IncompleteBirthDetailsException} If user birth details are incomplete
   * @throws {AstrologyServiceException} If AI service fails
   */
  async checkMyAstrology(
    req: IAuthGuardResponse,
    value: CheckAstrologyDto,
  ): Promise<ICommonResponse<IAstrologyResponse>> {
    try {
      // Get user details from database using userId from auth guard
      const user = await this.userModelService.getUserById(req.userId);

      if (!user) {
        throw new IncompleteBirthDetailsException();
      }

      // Validate that user has all required birth details
      if (!user.birthDate || !user.birthPlace || !user.name) {
        throw new IncompleteBirthDetailsException();
      }

      // Prepare user birth details
      const fullName = user.surname
        ? `${user.firstName} ${user.lastName} ${user.surname}`.trim()
        : `${user.firstName} ${user.lastName}`.trim();

      const birthDateFormatted = new Date(user.birthDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      console.log('=== value ====', value);
      // Check if we have a cached reading (unless force regenerate is requested)
      if (!value?.forceRegenerate) {
        const cachedReading = await this.astrologyReadingModelService.findByUserAndBirthDetails(
          req.userId,
          user.birthDate,
          user.birthPlace,
        );

        if (cachedReading) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Astrology reading retrieved from cache',
            data: {
              reading: cachedReading.reading,
              userDetails: {
                fullName,
                birthDate: birthDateFormatted,
                birthPlace: user.birthPlace,
              },
              cached: true,
              generatedAt: cachedReading.generatedAt,
            },
          };
        }
      }

      // Add job to queue for async processing with rate limiting
      const job = await this.queueService.addAstrologyJob({
        userId: req.userId,
        fullName,
        birthDate: user.birthDate,
        birthPlace: user.birthPlace,
        question: value?.question || "",
        forceRegenerate: value?.forceRegenerate,
      });

      // Return job information - client can poll for status
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Astrology reading generation has been queued. This will be processed with rate limiting to ensure quality.',
        data: {
          jobId: job.id,
          status: 'queued',
          userDetails: {
            fullName,
            birthDate: birthDateFormatted,
            birthPlace: user.birthPlace,
          },
          estimatedTime: '30-60 seconds',
        } as any,
      };
    } catch (error) {
      // Re-throw custom exceptions
      if (error instanceof IncompleteBirthDetailsException) {
        throw error;
      }

      // Log and throw generic astrology service error
      console.error('Astrology service error:', error);
      throw new AstrologyServiceException(
        error?.message || 'Failed to generate astrology reading'
      );
    }
  }

  /**
   * @description Get astrology job status by job ID
   */
  async getJobStatus(jobId: string): Promise<ICommonResponse<any>> {
    try {
      const jobStatus = await this.queueService.getJobStatus(jobId);

      if (!jobStatus) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Job not found',
          data: null,
        };
      }

      console.log('=== jobStatus ====', jobStatus);
      // If job is completed, return the reading
      if (jobStatus.state === 'completed' && jobStatus.returnvalue) {
        const result = jobStatus.returnvalue;

        console.log('=== result ====', result);
        if (result.cached) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Astrology reading retrieved from cache',
            data: {
              reading: result.reading.reading,
              userDetails: {
                fullName: result.reading.fullName,
                birthDate: result.reading.birthDate,
                birthPlace: result.reading.birthPlace,
              },
              cached: true,
              generatedAt: result.reading.generatedAt,
            },
          };
        }

        return {
          statusCode: HttpStatus.OK,
          message: 'Astrology reading generated successfully',
          data: {
            reading: result.reading.reading,
            userDetails: {
              fullName: result.reading.fullName,
              birthDate: result.reading.birthDate,
              birthPlace: result.reading.birthPlace,
            },
            cached: false,
            generatedAt: result.reading.generatedAt,
          },
        };
      }

      // Return job status for pending jobs
      return {
        statusCode: HttpStatus.OK,
        message: `Job is ${jobStatus.state}`,
        data: {
          jobId: jobStatus.id,
          status: jobStatus.state,
          progress: jobStatus.progress,
          failedReason: jobStatus.failedReason,
        },
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new AstrologyServiceException('Failed to get job status');
    }
  }

  /**
   * @description Generate astrology and numerology reading using AI
   * @private
   */
  private async generateAstrologyReading(
    fullName: string,
    birthDate: string,
    birthPlace: string,
    question?: string,
  ): Promise<IAstrologyNumerologyReading> {
    try {
      // Build the specific question section
      const specificQuestion = question
        ? SPECIFIC_QUESTION_TEMPLATE.replace('{question}', question)
        : '';

      // Build the complete user prompt
      const userPrompt = ASTROLOGY_USER_PROMPT_TEMPLATE
        .replace('{fullName}', fullName)
        .replace('{birthDate}', birthDate)
        .replace('{birthPlace}', birthPlace)
        .replace('{specificQuestion}', specificQuestion);

      console.log('=== Starting AI astrology reading generation ===');
      console.log('User prompt length:', userPrompt.length, 'characters');

      const startTime = Date.now();

      // Get AI response using LangChain with timeout protection
      const aiResponse = await Promise.race([
        this.langChainService.chatWithContext(
          ASTROLOGY_SYSTEM_PROMPT,
          userPrompt,
        ),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timeout after 180 seconds')), 180000)
        )
      ]);

      const endTime = Date.now();
      console.log(`=== AI response received in ${(endTime - startTime) / 1000}s ===`);
      console.log('Response length:', aiResponse.length, 'characters');
      console.log('Response preview:', aiResponse.substring(0, 200));

      // Check if response is empty or too short
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.error('Empty AI response received - model may have hit token limits');
        throw new AstrologyServiceException(
          'The AI model did not generate any content. This usually happens when the model hits token limits. Please try again, or contact support if the issue persists.'
        );
      }

      if (aiResponse.length < 100) {
        console.warn('AI response is suspiciously short:', aiResponse);
        throw new AstrologyServiceException(
          'The AI model generated an incomplete response. Please try again.'
        );
      }

      // Parse the JSON response
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Error generating astrology reading:', error);

      // Better error messages
      if (error.message?.includes('timeout')) {
        throw new AstrologyServiceException(
          'AI request timed out. The astrology reading is taking too long to generate. Please try again or simplify your request.'
        );
      }

      if (error.message?.includes('rate limit')) {
        throw new AstrologyServiceException(
          'API rate limit exceeded. Please wait a moment and try again.'
        );
      }

      if (error.message?.includes('token')) {
        throw new AstrologyServiceException(
          'The request is too large for the AI model. Please try with a shorter question.'
        );
      }

      // Re-throw AstrologyServiceException as-is
      if (error instanceof AstrologyServiceException) {
        throw error;
      }

      throw new AstrologyServiceException(
        error?.message || 'Failed to generate astrology reading from AI'
      );
    }
  }

  /**
   * @description Parse and validate AI response as JSON
   * @private
   */
  private parseAIResponse(response: string): IAstrologyNumerologyReading {
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = response.trim();

      // Remove ```json or ``` markers
      cleanedResponse = cleanedResponse.replace(/^```json?\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/```\s*$/, '');

      // Try to extract JSON if it's embedded in text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      console.log('=== Attempting to parse JSON ===');
      console.log('Cleaned response length:', cleanedResponse.length);

      // Try parsing directly first
      try {
        const parsed = JSON.parse(cleanedResponse);

        // Validate basic structure
        if (!parsed.numerology || !parsed.astrology || !parsed.combinedInsights) {
          throw new Error('Invalid response structure from AI - missing required sections');
        }

        console.log('=== Successfully parsed JSON ===');
        return parsed as IAstrologyNumerologyReading;
      } catch (directParseError) {
        console.log('Direct parse failed, attempting repair...');

        // Try to repair common JSON issues
        const repairedResponse = this.repairJSON(cleanedResponse);
        const parsed = JSON.parse(repairedResponse);

        // Validate basic structure
        if (!parsed.numerology || !parsed.astrology || !parsed.combinedInsights) {
          throw new Error('Invalid response structure from AI - missing required sections');
        }

        console.log('=== Successfully parsed repaired JSON ===');
        return parsed as IAstrologyNumerologyReading;
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Error details:', error.message);
      console.error('Raw response preview (first 1000 chars):', response.substring(0, 1000));
      console.error('Raw response preview (last 500 chars):', response.substring(Math.max(0, response.length - 500)));

      throw new AstrologyServiceException(
        'Failed to parse AI response. The AI may not have returned valid JSON. Please try again or contact support if the issue persists.'
      );
    }
  }

  /**
   * @description Attempt to repair common JSON issues
   * @private
   */
  private repairJSON(jsonString: string): string {
    let repaired = jsonString;

    // Fix unescaped quotes in strings (common issue)
    // This is a simple approach - more sophisticated repair might be needed

    // Fix trailing commas before closing braces/brackets
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Try to complete incomplete JSON by adding closing braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Add missing closing brackets
    if (openBrackets > closeBrackets) {
      const missing = openBrackets - closeBrackets;
      console.log(`Adding ${missing} missing closing brackets`);
      repaired += ']'.repeat(missing);
    }

    // Add missing closing braces
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      console.log(`Adding ${missing} missing closing braces`);
      repaired += '}'.repeat(missing);
    }

    // Remove any incomplete string at the end (if the response was cut off)
    // Find the last complete value
    const lastCompleteValueMatch = repaired.match(/.*[}\]"](\s*[,\s]*)?$/s);
    if (!lastCompleteValueMatch && repaired.includes('"')) {
      // Response might be cut off mid-string, try to find last complete section
      const lastClosingBrace = repaired.lastIndexOf('}');
      const lastClosingBracket = repaired.lastIndexOf(']');
      const lastQuote = repaired.lastIndexOf('"');

      // If there's an unclosed string after the last structural element
      if (lastQuote > Math.max(lastClosingBrace, lastClosingBracket)) {
        console.log('Detected incomplete string, attempting to close it');
        // Find if this quote is actually closing a key or value
        const beforeQuote = repaired.substring(0, lastQuote);
        const quoteCount = (beforeQuote.match(/"/g) || []).length;

        // If odd number of quotes, we need to close the string
        if (quoteCount % 2 === 0) {
          // This is an opening quote that wasn't closed
          repaired += '"';
        }
      }
    }

    return repaired;
  }
}

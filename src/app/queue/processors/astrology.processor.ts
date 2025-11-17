import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue.constants';
import { IAstrologyJobData, IUserRegistrationJobData } from '../queue.service';
import { JobModelService } from '@entities-job/job.service';
import { IAstrologyNumerologyReading } from '@app/user/astrology/interfaces';
import {
  ASTROLOGY_SYSTEM_PROMPT,
  ASTROLOGY_USER_PROMPT_TEMPLATE,
  SPECIFIC_QUESTION_TEMPLATE,
} from '@app/user/astrology/constants/astrology-prompt.constant';
import { AstrologyServiceException } from '@app/user/astrology/dto';
import { LangChainService } from '@app/langchain/langchain.service';
import { AstrologyReadingModelService } from '@app/user/astrology/entities/astrology-reading.service';
import { ToonParser } from '@app/user/astrology/utils/toon-parser.util';
import { Types } from 'mongoose';

@Processor(QUEUE_NAMES.ASTROLOGY_QUEUE, {
  concurrency: 100,
})
@Injectable()
export class AstrologyProcessor extends WorkerHost {
  private readonly logger = new Logger(AstrologyProcessor.name);

  constructor(
    private readonly jobModelService: JobModelService,
    private readonly langChainService: LangChainService,
    private readonly astrologyReadingModelService: AstrologyReadingModelService,

  ) {
    super();
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
      // const aiResponse = await Promise.race([
      //   this.langChainService.chatWithContext(
      //     ASTROLOGY_SYSTEM_PROMPT,
      //     userPrompt,
      //   ),
      //   new Promise<string>((_, reject) =>
      //     setTimeout(() => reject(new Error('AI request timeout after 180 seconds')), 180000)
      //   )
      // ]);

      const aiResponse = await this.langChainService.chatWithContext(
        ASTROLOGY_SYSTEM_PROMPT,
        userPrompt,
      )
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
        const parsed = ToonParser.parse(cleanedResponse);

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
        const parsed = ToonParser.parse(repairedResponse);

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

  async process(job: Job<IAstrologyJobData | IUserRegistrationJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    // set time out for 500ms
    await new Promise(resolve => setTimeout(resolve, 500));


    try {
      // Update job status to active in database
      // Ensure job record exists (some jobs might be added externally)
      const existing = await this.jobModelService.getJobByJobId(job.id as string);
      console.log('=== existing ====', existing);
      if (!existing) {
        // Create a minimal record for this job
        await this.jobModelService.createJob({
          jobId: job.id as string,
          userId: job.data?.userId ? new Types.ObjectId(job.data.userId) : undefined,
          jobType: job.name as string,
          jobData: job.data,
          queueName: QUEUE_NAMES.ASTROLOGY_QUEUE,
          status: 'active',
          progress: 0,
          priority: 0,
          attempts: 0,
        });
        console.log('===  ==== here after data creation', );
      } else {
        await this.jobModelService.updateJobStatus(job.id as string, 'active', {
          startedAt: new Date(),
        });
      }

      let result;

      switch (job.name) {
        case JOB_NAMES.GENERATE_ASTROLOGY_READING:
          result = await this.processAstrologyReading(job as Job<IAstrologyJobData>);
          break;

        case JOB_NAMES.PROCESS_USER_REGISTRATION:
          result = await this.processUserRegistration(job as Job<IUserRegistrationJobData>);
          break;

        default:
          const error = new Error(`Unknown job type: ${job.name}`);
          await this.jobModelService.setJobFailed(job.id as string, error.message);
          throw error;
      }

      // Mark job as completed in database
      await this.jobModelService.setJobCompleted(job.id as string, result);

      return result;
    } catch (error) {
      // Mark job as failed in database
      // Increment attempts and mark failed
      await this.jobModelService.incrementJobAttempts(job.id as string);
      await this.jobModelService.setJobFailed(
        job.id as string,
        error.message || 'Unknown error',
      );

      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process astrology reading generation
   */
  private async processAstrologyReading(job: Job<IAstrologyJobData>) {
    const { userId, fullName, birthDate, birthPlace, question } = job.data;

    this.logger.log(`Generating astrology reading for user ${userId}`);

    // Update progress: Starting analysis
    await job.updateProgress(10);
    await this.jobModelService.updateJobProgress(job.id as string, 10);

    const birthDateFormatted = new Date(birthDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Update progress: Preparing AI request
    await job.updateProgress(20);
    await this.jobModelService.updateJobProgress(job.id as string, 20);

    // Generate new reading using AI
    const reading = await this.generateAstrologyReading(
      fullName,
      birthDateFormatted,
      birthPlace,
      question,
    );

    console.log('=== reading ====', reading);
    // Update progress: AI generation complete
    await job.updateProgress(70);
    await this.jobModelService.updateJobProgress(job.id as string, 70);

    // Store the reading in database
    const savedReading = await this.astrologyReadingModelService.createReading(
      userId,
      fullName,
      birthDate,
      birthPlace,
      reading,
    );

    console.log('=== savedReading ====', savedReading);
    // Update progress: Complete
    await job.updateProgress(100);
    await this.jobModelService.updateJobProgress(job.id as string, 100);

    this.logger.log(`Astrology reading completed for user ${userId}`);

    return {
      userId,
      fullName,
      birthDate,
      birthPlace,
      question,
      reading: savedReading,
      generatedAt: new Date(),
    };
  }

  /**
   * Process user registration tasks
   */
  private async processUserRegistration(job: Job<IUserRegistrationJobData>) {
    const { userId, email, name } = job.data;

    this.logger.log(`Processing registration for user ${userId}`);

    // Update progress: Starting
    await job.updateProgress(20);
    await this.jobModelService.updateJobProgress(job.id as string, 20);

    // Here you can add various post-registration tasks:
    // - Send welcome email
    // - Create default user settings
    // - Initialize user analytics
    // - Add to mailing list
    // etc.

    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update progress: Mid-way
    await job.updateProgress(60);
    await this.jobModelService.updateJobProgress(job.id as string, 60);

    // Simulate more processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update progress: Complete
    await job.updateProgress(100);
    await this.jobModelService.updateJobProgress(job.id as string, 100);

    this.logger.log(`Registration processing completed for user ${userId}`);

    return {
      userId,
      email,
      name,
      processed: true,
      completedAt: new Date(),
    };
  }

  /**
   * Event handlers for job lifecycle
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
    // Ensure DB has an entry for this job (best-effort, non-blocking)
    (async () => {
      try {
        const existing = await this.jobModelService.getJobByJobId(job.id as string);
        if (!existing) {
          await this.jobModelService.createJob({
            jobId: job.id as string,
            userId: job.data?.userId ? new Types.ObjectId(job.data.userId) : undefined,
            jobType: job.name as string,
            jobData: job.data,
            queueName: QUEUE_NAMES.ASTROLOGY_QUEUE,
            status: 'active',
            progress: (job.progress as number) || 0,
            priority: 0,
            attempts: 0,
          });
        } else {
          await this.jobModelService.updateJobStatus(job.id as string, 'active', { startedAt: new Date() });
        }
      } catch (err) {
        this.logger.error('Failed to ensure job DB record on active event', err?.message || err);
      }
    })();
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has completed`);
    // Persist completion metadata if not already handled in process
    (async () => {
      try {
        // Attempt to set completed with any return value if available
        const returnValue = (job as any).returnvalue ?? null;
        await this.jobModelService.setJobCompleted(job.id as string, returnValue);
      } catch (err) {
        this.logger.error('Failed to mark job completed in DB on completed event', err?.message || err);
      }
    })();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
    (async () => {
      try {
        await this.jobModelService.incrementJobAttempts(job.id as string);
        await this.jobModelService.setJobFailed(job.id as string, error.message || 'Unknown error');
      } catch (err) {
        this.logger.error('Failed to record job failure in DB on failed event', err?.message || err);
      }
    })();
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
    // Best-effort DB update (non-blocking)
    (async () => {
      try {
        await this.jobModelService.updateJobProgress(job.id as string, progress);
      } catch (err) {
        this.logger.error('Failed to update job progress in DB on progress event', err?.message || err);
      }
    })();
  }
}

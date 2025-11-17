import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { LangChainService } from '@app/langchain/langchain.service';
import { BirthstoneReadingModelService } from '../../../entities/birthstone-reading/birthstone-reading.service';
import { JobModelService } from '@entities-job/job.service';
import {
  BIRTHSTONE_SYSTEM_PROMPT,
  BIRTHSTONE_USER_PROMPT_TEMPLATE,
} from '@app/user/birthstone/constants/birthstone-prompt.constant';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue.constants';
import { ToonParser } from '@app/user/astrology/utils/toon-parser.util';
import { IBirthstoneJobData } from '../queue.service';

@Processor(QUEUE_NAMES.ASTROLOGY_QUEUE, {
  concurrency: 100,
})
@Injectable()
export class BirthstoneProcessor extends WorkerHost {
  private readonly logger = new Logger(BirthstoneProcessor.name);

  constructor(
    private readonly langChainService: LangChainService,
    private readonly birthstoneReadingModelService: BirthstoneReadingModelService,
    private readonly jobModelService: JobModelService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name === JOB_NAMES.GENERATE_BIRTHSTONE_READING) {
      return this.handleBirthstoneGeneration(job);
    }
  }

  async handleBirthstoneGeneration(job: Job<IBirthstoneJobData>) {
    const { userId, fullName, birthDate, birthPlace, forceRegenerate } = job.data;

    this.logger.log(`Processing birthstone job ${job.id} for user ${userId}`);

    try {
      // Update job status to active
      await this.jobModelService.updateJobStatus(
        job.id as string,
        'active',
      );

      // Check if we already have a cached reading (unless force regenerate)
      if (!forceRegenerate) {
        const cachedReading =
          await this.birthstoneReadingModelService.findByUserAndBirthDetails(
            userId,
            birthDate,
            birthPlace,
          );

        if (cachedReading) {
          this.logger.log(`Using cached birthstone reading for user ${userId}`);
          await this.jobModelService.updateJobStatus(
            job.id as string,
            'completed',
          );
          return cachedReading.reading;
        }
      }

      // Format birth date for the prompt
      const birthDateFormatted = new Date(birthDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      // Prepare the user prompt
      const userPrompt = BIRTHSTONE_USER_PROMPT_TEMPLATE.replace(
        '{fullName}',
        fullName,
      )
        .replace('{birthDate}', birthDateFormatted)
        .replace('{birthPlace}', birthPlace);

      this.logger.log('Calling LangChain for birthstone reading generation...');

      // Call LangChain service with system and user prompts
      const aiResponse = await this.langChainService.chatWithContext(
        BIRTHSTONE_SYSTEM_PROMPT,
        userPrompt,
      );

      this.logger.log('AI Response received, parsing TOON format...');

      // Parse the TOON format response
      let parsedReading: any;
      try {
        parsedReading = ToonParser.parse(aiResponse);
        this.logger.log('Successfully parsed TOON format to JSON');
      } catch (parseError) {
        this.logger.error('Failed to parse TOON format:', parseError);
        this.logger.error('Raw AI response:', aiResponse);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }

      // Validate the parsed reading has required structure
      if (!parsedReading.overview || !parsedReading.birthstoneCategories || !parsedReading.meaningSymbolism) {
        throw new Error('Invalid birthstone reading structure from AI - missing required fields');
      }

      this.logger.log('Saving birthstone reading to database...');

      // Save the reading to database
      await this.birthstoneReadingModelService.createReading(
        userId,
        fullName,
        birthDate,
        birthPlace,
        parsedReading,
      );

      this.logger.log(`Birthstone reading saved successfully for user ${userId}`);

      // Update job status to completed
      await this.jobModelService.updateJobStatus(
        job.id as string,
        'completed',
      );

      return parsedReading;
    } catch (error) {
      this.logger.error(`Error processing birthstone job ${job.id}:`, error);

      // Update job status to failed
      await this.jobModelService.updateJobStatus(
        job.id as string,
        'failed',
      );

      throw error;
    }
  }
}

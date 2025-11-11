import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ description: 'User message to send to AI' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ChatWithContextDto {
  @ApiProperty({ description: 'System instructions for AI' })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiProperty({ description: 'User message' })
  @IsString()
  @IsNotEmpty()
  userMessage: string;
}

class ConversationMessage {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsString()
  @IsNotEmpty()
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatWithHistoryDto {
  @ApiProperty({ type: [ConversationMessage], description: 'Conversation history' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessage)
  conversationHistory: ConversationMessage[];
}

export class ChatWithTemplateDto {
  @ApiProperty({ description: 'Prompt template with variables like {variable_name}' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({
    description: 'Variables to fill in the template',
    type: 'object',
    additionalProperties: true,
    example: { name: 'John', topic: 'authentication' }
  })
  @IsObject()
  @IsNotEmpty()
  variables: Record<string, any>;
}

export class AgenticCallDto {
  @ApiProperty({ description: 'Task description for the AI agent' })
  @IsString()
  @IsNotEmpty()
  task: string;

  @ApiProperty({
    description: 'Optional tools available to the agent',
    required: false,
    type: 'array'
  })
  @IsOptional()
  @IsArray()
  tools?: Array<{
    name: string;
    description: string;
  }>;
}

export class EmbeddingDto {
  @ApiProperty({ description: 'Text to generate embeddings for' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * EXAMPLE: How to integrate LangChain AI into your Auth Service
 * 
 * This file shows practical examples of how to use AI in your authentication flow.
 * Copy the methods you need into your actual auth.service.ts
 */

import { Injectable } from '@nestjs/common';
import { LangChainService } from '@app/langchain/langchain.service';

@Injectable()
export class AuthServiceAIExamples {
  constructor(
    private readonly langChainService: LangChainService,
  ) {}

  /**
   * Example 1: AI-powered password strength checker
   * Provides intelligent feedback on password security
   */
  async analyzePasswordStrength(password: string): Promise<{
    score: number;
    feedback: string;
  }> {
    const prompt = `Analyze this password strength and provide a score (1-10) and specific feedback:
Password length: ${password.length}
Has uppercase: ${/[A-Z]/.test(password)}
Has numbers: ${/[0-9]/.test(password)}
Has special chars: ${/[!@#$%^&*]/.test(password)}

Return ONLY a JSON object like: {"score": 7, "feedback": "Your specific advice"}`;

    const response = await this.langChainService.chat(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return { score: 5, feedback: 'Unable to analyze password' };
    }
  }

  /**
   * Example 2: Intelligent OTP message generator
   * Creates personalized OTP messages based on context
   */
  async generatePersonalizedOTPMessage(
    userName: string,
    otpType: string,
    language: string = 'English',
  ): Promise<string> {
    const template = `Generate a friendly, professional {otpType} message in {language} for {userName}. 
Include a warm greeting and clear instructions. Keep it under 100 words.`;

    return await this.langChainService.chatWithTemplate(template, {
      userName,
      otpType,
      language,
    });
  }

  /**
   * Example 3: Detect suspicious login attempts
   * AI analyzes login patterns for potential security threats
   */
  async detectSuspiciousLogin(loginData: {
    userEmail: string;
    ipAddress: string;
    location: string;
    deviceInfo: string;
    timeOfDay: string;
    previousLoginPattern?: string;
  }): Promise<{ isSuspicious: boolean; reason: string; riskScore: number }> {
    const systemPrompt = `You are a cybersecurity expert analyzing login attempts. 
Return ONLY a JSON object with: {"isSuspicious": boolean, "reason": string, "riskScore": 0-100}`;

    const userMessage = `Analyze this login:
Email: ${loginData.userEmail}
IP: ${loginData.ipAddress}
Location: ${loginData.location}
Device: ${loginData.deviceInfo}
Time: ${loginData.timeOfDay}
${loginData.previousLoginPattern ? `Normal pattern: ${loginData.previousLoginPattern}` : ''}`;

    const response = await this.langChainService.chatWithContext(
      systemPrompt,
      userMessage,
    );

    try {
      return JSON.parse(response);
    } catch {
      return { isSuspicious: false, reason: 'Analysis failed', riskScore: 50 };
    }
  }

  /**
   * Example 4: Smart chatbot for user support during registration
   * Helps users with common registration issues
   */
  async registrationSupportBot(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    newUserQuestion: string,
  ): Promise<string> {
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful registration support assistant. Help users with:
- Email verification issues
- Password requirements
- Mobile OTP problems
- Account creation errors
Keep responses concise and actionable.`,
    };

    const messages = [
      systemMessage,
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      })),
      { role: 'user' as const, content: newUserQuestion },
    ];

    return await this.langChainService.chatWithHistory(messages);
  }

  /**
   * Example 5: Auto-generate security questions
   * Creates personalized security questions based on user profile
   */
  async generateSecurityQuestions(userProfile: {
    name: string;
    age?: number;
    interests?: string[];
  }): Promise<string[]> {
    const prompt = `Generate 5 personalized security questions for ${userProfile.name}.
${userProfile.age ? `Age: ${userProfile.age}` : ''}
${userProfile.interests ? `Interests: ${userProfile.interests.join(', ')}` : ''}

Return ONLY a JSON array of 5 questions: ["Question 1", "Question 2", ...]`;

    const response = await this.langChainService.chat(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return [
        "What was your first pet's name?",
        "What city were you born in?",
        "What is your mother's maiden name?",
        "What was your first car?",
        "What is your favorite color?",
      ];
    }
  }

  /**
   * Example 6: Agentic call - AI decides best action for failed login
   * AI autonomously determines the appropriate security response
   */
  async handleFailedLoginAgent(failedLoginData: {
    email: string;
    failedAttempts: number;
    lastSuccessfulLogin: Date;
    accountAge: number;
  }): Promise<{
    action: 'allow' | 'captcha' | 'lock' | 'notify';
    reason: string;
  }> {
    const task = `Analyze this failed login scenario and recommend the best security action:
- Email: ${failedLoginData.email}
- Failed attempts: ${failedLoginData.failedAttempts}
- Last successful login: ${failedLoginData.lastSuccessfulLogin}
- Account age: ${failedLoginData.accountAge} days

Available actions:
1. allow - Let user try again
2. captcha - Require CAPTCHA verification
3. lock - Temporarily lock the account
4. notify - Send security alert to user

Respond with JSON: {"action": "chosen_action", "reason": "explanation"}`;

    const response = await this.langChainService.agenticCall(task, [
      {
        name: 'allow_retry',
        description: 'Allow user to try logging in again',
        execute: async () => ({ action: 'allow' }),
      },
      {
        name: 'require_captcha',
        description: 'Require CAPTCHA verification',
        execute: async () => ({ action: 'captcha' }),
      },
      {
        name: 'lock_account',
        description: 'Temporarily lock the account',
        execute: async () => ({ action: 'lock' }),
      },
      {
        name: 'send_notification',
        description: 'Send security alert to user',
        execute: async () => ({ action: 'notify' }),
      },
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return { action: 'captcha', reason: 'Default security measure' };
    }
  }

  /**
   * Example 7: Smart email content generator
   * Generate contextual email templates on the fly
   */
  async generateWelcomeEmail(userData: {
    name: string;
    plan?: string;
    referralSource?: string;
  }): Promise<{ subject: string; htmlContent: string }> {
    const prompt = `Generate a warm, professional welcome email for ${userData.name}.
${userData.plan ? `They signed up for: ${userData.plan}` : ''}
${userData.referralSource ? `Referred by: ${userData.referralSource}` : ''}

Return JSON with: {"subject": "email subject", "htmlContent": "HTML email body"}`;

    const response = await this.langChainService.chat(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return {
        subject: `Welcome ${userData.name}!`,
        htmlContent: `<h1>Welcome!</h1><p>We're excited to have you.</p>`,
      };
    }
  }
}

/**
 * HOW TO USE IN YOUR AUTH.SERVICE.TS:
 * 
 * 1. Import the LangChain service:
 *    import { LangChainService } from '@app/langchain/langchain.service';
 * 
 * 2. Add to constructor:
 *    constructor(
 *      // ...existing services
 *      private readonly langChainService: LangChainService,
 *    ) {}
 * 
 * 3. Import LangChainModule in auth.module.ts:
 *    @Module({
 *      imports: [
 *        // ...existing imports
 *        LangChainModule,
 *      ],
 *      // ...rest
 *    })
 * 
 * 4. Copy any method from above and adapt to your needs!
 */


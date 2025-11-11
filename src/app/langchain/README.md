# LangChain Integration with OpenAI (GPT-4o / GPT-5)

This module provides AI capabilities using LangChain with OpenAI's latest models.

## 📋 Table of Contents
- [Setup Instructions](#setup-instructions)
- [How to Get OpenAI API Key](#how-to-get-openai-api-key)
- [Environment Variables](#environment-variables)
- [Available Features](#available-features)
- [Usage Examples](#usage-examples)
- [Integration in Your Services](#integration-in-your-services)

---

## 🚀 Setup Instructions

### 1. Install Dependencies (Already Done)
```bash
npm install langchain @langchain/openai @langchain/core
```

### 2. Get Your OpenAI API Key

#### Step-by-step Guide:

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/

2. **Sign Up / Log In:**
   - Create an account or log in to your existing account
   - You may need to verify your email address

3. **Navigate to API Keys:**
   - Click on your profile icon (top right)
   - Select "View API keys" or go directly to: https://platform.openai.com/api-keys

4. **Create New API Key:**
   - Click on "Create new secret key"
   - Give it a name (e.g., "NestJS App")
   - **IMPORTANT:** Copy the key immediately - you won't be able to see it again!
   - Format: `sk-proj-...` (starts with sk-proj or sk-)

5. **Add Billing Information (Required):**
   - Go to: https://platform.openai.com/account/billing
   - Add a payment method
   - Set up billing limits to control costs
   - OpenAI requires a payment method even for small usage

6. **Check Usage and Limits:**
   - Monitor usage: https://platform.openai.com/account/usage
   - Set monthly limits to avoid unexpected charges

---

## 🔑 Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_MODEL=gpt-4o  # or gpt-4-turbo, gpt-3.5-turbo

# Optional: Model Configuration
OPENAI_TEMPERATURE=0.7  # 0.0 to 1.0 (creativity level)
OPENAI_MAX_TOKENS=1000  # Maximum response length
```

### Available Models (as of 2024):
- **`gpt-4o`** - Latest GPT-4 Optimized (recommended for production) - This is effectively "GPT-5 level"
- **`gpt-4o-mini`** - Faster, cheaper version
- **`gpt-4-turbo`** - Previous generation, still powerful
- **`gpt-3.5-turbo`** - Faster and cheaper, good for simple tasks

**Note:** OpenAI hasn't officially released "GPT-5" yet, but `gpt-4o` (released May 2024) represents their most advanced model with multimodal capabilities.

---

## ✨ Available Features

### 1. Simple Chat
Basic question-answer interaction

### 2. Chat with Context
Add system instructions to guide AI behavior

### 3. Multi-turn Conversation
Maintain conversation history for context-aware responses

### 4. Template-based Chat
Use structured prompts with variables

### 5. Agentic Calls
AI analyzes tasks and decides on actions (autonomous agent behavior)

### 6. Embeddings Generation
Convert text to vectors for semantic search, RAG, etc.

### 7. Streaming Responses
Real-time streaming for long responses

---

## 📖 Usage Examples

### Example 1: Simple Chat
```typescript
POST /ai/chat
{
  "message": "Explain NestJS in simple terms"
}
```

### Example 2: Chat with Context
```typescript
POST /ai/chat-with-context
{
  "systemPrompt": "You are a helpful customer support agent for a banking app.",
  "userMessage": "How do I reset my password?"
}
```

### Example 3: Agentic Call
```typescript
POST /ai/agentic-call
Headers: Authorization: Bearer <your-token>
{
  "task": "Analyze this user feedback and categorize it: 'The app is slow and crashes often'",
  "tools": [
    {
      "name": "categorize_feedback",
      "description": "Categorizes user feedback into bug, feature request, or complaint"
    }
  ]
}
```

### Example 4: Generate Embeddings (for Vector Search/RAG)
```typescript
POST /ai/embeddings
Headers: Authorization: Bearer <your-token>
{
  "text": "NestJS is a progressive Node.js framework"
}
```

---

## 🔧 Integration in Your Services

### Example: Add AI to Auth Service

```typescript
// In your auth.service.ts
import { LangChainService } from '@app/langchain/langchain.service';

@Injectable()
export class AuthService {
  constructor(
    // ...existing dependencies
    private readonly langChainService: LangChainService,
  ) {}

  // Example: AI-powered user onboarding assistant
  async getOnboardingHelp(userId: string, question: string): Promise<string> {
    const user = await this.userModelService.getUserById(userId);
    
    const systemPrompt = `You are an onboarding assistant helping ${user.name}. 
    Provide clear, step-by-step guidance for their questions about using our platform.`;
    
    const response = await this.langChainService.chatWithContext(
      systemPrompt,
      question
    );
    
    return response;
  }

  // Example: AI content moderation for user profiles
  async moderateUserContent(content: string): Promise<boolean> {
    const response = await this.langChainService.chatWithContext(
      'You are a content moderator. Respond with only "SAFE" or "UNSAFE".',
      `Analyze this content: "${content}"`
    );
    
    return response.includes('SAFE');
  }
}
```

### Example: Add AI Module to Auth Module

```typescript
// In auth.module.ts
import { LangChainModule } from '@app/langchain/langchain.module';

@Module({
  imports: [
    // ...existing imports
    LangChainModule,
  ],
  // ...rest of module
})
export class AuthModule {}
```

---

## 💰 Cost Considerations

### Pricing (approximate as of 2024):
- **GPT-4o:** ~$5 per 1M input tokens, ~$15 per 1M output tokens
- **GPT-4o-mini:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-3.5-turbo:** ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens

**Tip:** Start with `gpt-4o-mini` for development, upgrade to `gpt-4o` for production.

---

## 🛡️ Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Set usage limits** in OpenAI dashboard
4. **Monitor costs** regularly
5. **Implement rate limiting** on your endpoints
6. **Add authentication** to AI endpoints (already done with AuthGuard)

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- Verify your key starts with `sk-`
- Check if billing is set up on OpenAI account
- Ensure key is correctly copied (no spaces)

### Error: "Insufficient Quota"
- Add payment method to OpenAI account
- Check usage limits: https://platform.openai.com/account/usage

### Error: "Model not found"
- Use supported model names: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
- Check OpenAI docs for latest models: https://platform.openai.com/docs/models

---

## 📚 Additional Resources

- **OpenAI Platform:** https://platform.openai.com/
- **OpenAI API Docs:** https://platform.openai.com/docs/
- **LangChain Docs:** https://js.langchain.com/docs/
- **Model Pricing:** https://openai.com/api/pricing/

---

## 🚀 Next Steps

1. ✅ Get OpenAI API key (see above)
2. ✅ Add to `.env` file
3. ✅ Test with simple chat endpoint
4. ✅ Integrate into your services (see examples)
5. ✅ Monitor usage and costs
6. ✅ Build amazing AI features!


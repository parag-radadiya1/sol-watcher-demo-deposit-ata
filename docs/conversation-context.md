# Conversation Context & Memory in LangChain Chat

## Overview

The chat system now includes **full conversation context** - the AI remembers previous messages and responds accordingly. This creates a natural, coherent multi-turn conversation experience.

## How It Works

### 1. **Conversation History Flow**

When a user sends a message:

1. **Fetch Previous Messages**: System retrieves the last 20 messages from the conversation (from MongoDB)
2. **Build Context**: Converts messages to LangChain format (System, User, Assistant messages)
3. **Add System Prompt**: Includes instructions for the AI
4. **Stream with Context**: LangChain streams response with full conversation history
5. **Save to DB**: Both user message and AI response are saved for future context

### 2. **LangChain Implementation**

#### New Method: `streamChatWithHistory()`

```typescript
async *streamChatWithHistory(
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  newMessage: string,
): AsyncIterable<string>
```

**What it does:**
- Takes array of previous messages
- Adds new user message
- Streams AI response with full context
- AI "remembers" the entire conversation

**Example conversation history format:**
```javascript
[
  { role: 'system', content: 'You are a helpful AI assistant...' },
  { role: 'user', content: 'What is the capital of France?' },
  { role: 'assistant', content: 'The capital of France is Paris.' },
  { role: 'user', content: 'Tell me more about it.' }, // AI knows "it" = Paris
]
```

### 3. **Memory Limits**

- **Last 20 messages** are included in context
- Why limit? To avoid token limits (GPT-3.5-turbo has ~4K token limit)
- Sorted by `createdAt` (oldest to newest)
- System prompt always included first

### 4. **System Prompt**

Default system prompt:
```
You are a helpful AI assistant. Provide clear, concise, and accurate 
responses. Remember the context of previous messages in this conversation.
```

You can customize this in `SocketGatewayService.streamChatToSocket()`.

## Example Conversations

### Example 1: Contextual Follow-up

```
User: "What's the weather like in Tokyo?"
AI: "I don't have real-time weather data, but Tokyo typically has..."

User: "What about the temperature?"  ← AI knows this refers to Tokyo
AI: "Tokyo's temperature varies by season. In summer it's..."
```

### Example 2: Multi-step Problem Solving

```
User: "I need to write a function to sort an array"
AI: "Here's a JavaScript function to sort an array: [code]"

User: "Can you make it work for objects?"  ← AI remembers the function
AI: "Sure! Here's the modified version that works with objects: [code]"

User: "Add error handling"  ← AI knows the full context
AI: "Here's the function with error handling: [code]"
```

### Example 3: Clarifications

```
User: "Tell me about Python"
AI: "Python is a programming language known for..."

User: "No, the snake"  ← AI corrects itself based on clarification
AI: "Oh, you mean the reptile! Pythons are large snakes..."
```

## Database Structure

### Conversation
```javascript
{
  _id: "69145aa57d2af3a8866be275",
  userId: "6912f6a7df56b62a34d6f98e",
  title: "Chat 12/11/2025, 3:30:05 pm",
  isActive: true,
  metadata: {},
  createdAt: "2025-11-12T10:00:05.000Z",
  updatedAt: "2025-11-12T10:05:30.000Z"
}
```

### Messages (in sequence)
```javascript
[
  {
    _id: "msg1",
    conversationId: "69145aa57d2af3a8866be275",
    role: "user",
    content: "What is Node.js?",
    status: "completed",
    createdAt: "2025-11-12T10:00:10.000Z"
  },
  {
    _id: "msg2",
    conversationId: "69145aa57d2af3a8866be275",
    role: "assistant",
    content: "Node.js is a JavaScript runtime...",
    status: "completed",
    createdAt: "2025-11-12T10:00:15.000Z"
  },
  {
    _id: "msg3",
    conversationId: "69145aa57d2af3a8866be275",
    role: "user",
    content: "What can I build with it?",  // ← Context: "it" = Node.js
    status: "completed",
    createdAt: "2025-11-12T10:00:20.000Z"
  }
]
```

## Code Flow

### SocketGatewayService.streamChatToSocket()

```typescript
1. Get/Create conversationId
2. Fetch previous messages: messageModelService.getMessagesByConversation(conversationId, 20)
3. Build conversation history array:
   - System prompt (role: 'system')
   - Previous user messages (role: 'user')
   - Previous AI messages (role: 'assistant')
4. Save new user message to DB
5. Stream AI response with history: langChainService.streamChatWithHistory(history, newMessage)
6. Save each chunk to DB
7. Mark message as completed
```

### LangChainService.streamChatWithHistory()

```typescript
1. Convert history to LangChain message objects:
   - SystemMessage for system prompt
   - HumanMessage for user messages
   - AIMessage for assistant messages
2. Add new HumanMessage(newMessage)
3. Stream response: chatModel.stream(messages)
4. Yield chunks as they arrive
```

## Configuration Options

### Adjust History Limit

In `SocketGatewayService.streamChatToSocket()`:

```typescript
// Change 20 to desired number (be careful of token limits)
const previousMessages = await this.messageModelService.getMessagesByConversation(conversationId, 20);
```

**Recommendations:**
- **20 messages** (default) - Good for most conversations (~2-3K tokens)
- **50 messages** - For longer context (may hit token limits)
- **10 messages** - For faster responses with less context

### Customize System Prompt

```typescript
const conversationHistory = [
  {
    role: 'system',
    content: 'You are a coding assistant specialized in JavaScript. Provide code examples and best practices.'
  }
];
```

### Different Prompts per Use Case

```typescript
// Customer support
content: 'You are a friendly customer support agent. Be empathetic and helpful.'

// Educational
content: 'You are a patient teacher. Explain concepts simply and provide examples.'

// Technical
content: 'You are a senior developer. Provide detailed technical explanations and code reviews.'
```

## Testing the Context Feature

### Test 1: Simple Follow-up

```javascript
// Message 1
sendChatMessage('What is 5 + 3?');
// AI: "5 + 3 equals 8"

// Message 2 (in same conversation)
sendChatMessage('What about 10 times that?');  // AI should know "that" = 8
// AI: "10 times 8 equals 80"
```

### Test 2: Progressive Detail

```javascript
sendChatMessage('Tell me about the Eiffel Tower');
// AI: "The Eiffel Tower is a famous landmark in Paris..."

sendChatMessage('When was it built?');  // AI knows "it" = Eiffel Tower
// AI: "It was built in 1889..."

sendChatMessage('Who designed it?');  // AI maintains context
// AI: "It was designed by Gustave Eiffel..."
```

### Test 3: Correction

```javascript
sendChatMessage('Write a Python function to add numbers');
// AI: [Python code]

sendChatMessage('Actually, make it JavaScript');  // AI understands the correction
// AI: [JavaScript code]
```

## Performance Considerations

### Token Usage

Each message in context uses tokens:
- User message: ~10-100 tokens (depending on length)
- AI message: ~50-500 tokens (depending on response)
- System prompt: ~20-50 tokens

**Example calculation for 20 messages:**
- System prompt: 30 tokens
- 10 user messages: 500 tokens
- 10 AI messages: 2000 tokens
- New user message: 50 tokens
- **Total input: ~2580 tokens**

### Database Queries

- **1 query** to fetch conversation history (indexed on `conversationId`)
- **Fast** due to limit (20 messages) and MongoDB indexes

### Streaming Performance

- Context does NOT slow down streaming
- First chunk arrives just as fast
- LangChain processes context in parallel

## Troubleshooting

### "Token limit exceeded" Error

**Solution:** Reduce history limit
```typescript
const previousMessages = await this.messageModelService.getMessagesByConversation(conversationId, 10); // Reduced to 10
```

### AI Doesn't Remember Context

**Check:**
1. Are messages being saved? Check MongoDB `messages` collection
2. Is `conversationId` same for all messages? 
3. Are messages sorted correctly? (oldest first)
4. Check logs: `Streaming with X previous messages as context`

### Slow Responses

**Possible causes:**
- Too many messages in history (reduce limit)
- Messages with very long content (truncate old messages)
- Database query slow (check indexes)

## Advanced: Custom Context Strategies

### Summarize Old Messages

For very long conversations, summarize older messages:

```typescript
// Fetch last 50 messages
const allMessages = await this.messageModelService.getMessagesByConversation(conversationId, 50);

// Take last 10 as-is
const recentMessages = allMessages.slice(-10);

// Summarize older 40 messages
const olderMessages = allMessages.slice(0, -10);
const summary = await this.langChainService.chat(
  `Summarize this conversation in 2-3 sentences: ${JSON.stringify(olderMessages)}`
);

// Build context
const conversationHistory = [
  { role: 'system', content: 'Previous conversation summary: ' + summary },
  ...recentMessages.map(msg => ({ role: msg.role, content: msg.content }))
];
```

### Semantic Search (RAG)

For finding relevant past messages (not just recent):

```typescript
// Get embeddings for new message
const queryEmbedding = await this.langChainService.getEmbeddings(message);

// Find semantically similar past messages (requires vector DB)
const relevantMessages = await vectorDB.similaritySearch(queryEmbedding, 10);

// Use relevant messages as context instead of recent messages
```

## Summary

✅ **What we added:**
- `streamChatWithHistory()` method in LangChainService
- Automatic conversation history fetching (last 20 messages)
- Context-aware streaming with full message history
- System prompts for AI behavior control

✅ **What this enables:**
- AI remembers previous messages
- Natural follow-up questions work
- Multi-turn conversations feel coherent
- Contextual clarifications and corrections

✅ **How to use:**
- Send messages with same `conversationId`
- AI automatically includes context
- No changes needed in client code
- Works with existing socket events

🚀 **Try it now:** Send multiple messages in the same conversation and watch the AI remember context!


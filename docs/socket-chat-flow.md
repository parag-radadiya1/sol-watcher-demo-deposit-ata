# Socket Chat Flow (per-user socket, rooms, and conversation streaming)

This document demonstrates the WebSocket flow: streaming AI responses from the `LangChainService` to clients via Socket.IO, with per-user socket mapping, optional rooms (conversation rooms), and conversation identifiers.

## Project Structure

The chat functionality is organized into separate entity modules following the project's pattern:
- `src/entities/message/` - Message entity, service, and module
- `src/entities/conversation/` - Conversation entity, service, and module
- `src/entities/message-chunk/` - MessageChunk entity, service, and module
- `src/entities/socket-connection/` - SocketConnection entity, service, and module
- `src/entities/conversation-feedback/` - ConversationFeedback entity, service, and module

Each entity folder contains:
- `{entity}.entities.ts` - Mongoose schema and model
- `{entity}.service.ts` - Service with CRUD operations
- `{entity}.model.module.ts` - NestJS module that exports the model and service

## Files Referenced
- Server gateway: `src/app/socket/socket.gateway.ts`
- Streaming helper: `src/app/socket/socket.gateway.service.ts`
- Socket module: `src/app/socket/socket.module.ts`
- LangChain integration: `src/app/langchain/langchain.service.ts`
- Auth guard: `src/guards/socketAuth.guard.ts`
- Message service: `src/entities/message/message.service.ts`
- Conversation service: `src/entities/conversation/conversation.service.ts`
- MessageChunk service: `src/entities/message-chunk/message-chunk.service.ts`

## High-level overview
1. Client connects to Socket.IO and provides an auth token in the handshake (`handshake.auth.token`), prefix `Bearer `.
2. Client emits `joinRoom` (guarded) to join a conversation-specific room (optional). The server stores a per-user mapping: `socket.data.userId -> socket`.
3. Client sends `chatMessage` with payload `{ message, roomName?, conversationId? }` (guarded). The server immediately returns `status: 'started'` and begins streaming.
4. Server creates a `Message` document in the database, then uses `LangChainService.streamChat(message)` (async iterable) and:
   - Creates `MessageChunk` documents for each chunk
   - Appends chunks to the Message content
   - Emits streaming events to the client
5. Server emits streaming events:
   - `aiMessageStart` — stream started (includes messageId)
   - `aiMessageChunk` — each partial chunk (includes messageId)
   - `aiMessageComplete` — finished (includes messageId)
   - `aiMessageError` — on error (includes messageId)
6. If `roomName` was provided, stream events are broadcast to the room; otherwise sent to the individual client.
7. On completion, the Message status is updated to `COMPLETED`. On error, status is updated to `FAILED`.

## Why per-user socket and rooms are different
- **Per-user socket**: a single socket connection tied to an authenticated user (stored on `socket.data.userId`). Useful for private, direct messages and for locating a user's socket on the server.
- **Room**: a logical grouping (e.g., `conversation:<id>`). Multiple sockets (users) can join. Events sent to the room reach all participants.
- **Conversation ID**: a domain identifier that represents a conversation record (e.g., a DB document). It's included in events so clients can correlate messages to local UI state or persisted resources.

## Database Persistence

When a chat message is streamed:
1. A `Message` document is created with:
   - `conversationId` - links to a Conversation
   - `role` - ASSISTANT (for AI responses)
   - `status` - STREAMING (updates to COMPLETED or FAILED)
   - `content` - accumulated text from all chunks
   - `isStreaming` - true during streaming
   - `streamCompleted` - true when done
   - `completedAt` - timestamp when completed
   - `tokenCount` - token usage (can be incremented)
   - `modelName` - AI model name
   - `errorMessage` - error if failed

2. `MessageChunk` documents are created for each chunk with:
   - `messageId` - links to the Message
   - `content` - the chunk text
   - `sequence` - order number
   - `tokenCount` - tokens in this chunk

## Event Map

### Client → Server
- `joinRoom` (string roomName)
  - Guarded by `SocketAuthGuard`
  - Server handler: `SocketGateway.handleJoinRoom`
  - Response: `{ status: 'ok', room }` or `{ status: 'error', message }` and emits `joinedRoom` on success.

- `chatMessage` (object { message: string, roomName?: string, conversationId?: string })
  - Guarded by `SocketAuthGuard`
  - Server handler: `SocketGateway.handleChatMessage`
  - Response: immediate `{ status: 'started' }` (the streaming then begins asynchronously)

### Server → Client Events (streaming)
- `aiMessageStart` — payload: `{ conversationId?: string | null, userId: string, messageId: string }`
- `aiMessageChunk` — payload: `{ conversationId?: string | null, userId: string, messageId: string, chunk: string }`
- `aiMessageComplete` — payload: `{ conversationId?: string | null, userId: string, messageId: string }`
- `aiMessageError` — payload: `{ conversationId?: string | null, userId: string, messageId: string, error: string }`

## Detailed Sequence

1. **Client connects** to server with handshake auth:
   - `handshake.auth.token = "Bearer <JWT>"`
   - `SocketAuthGuard` extracts the token and calls `GuardAuthService.guardAuth(token, socket.data, ip, context)` which validates token and sets `socket.data.userId`.

2. **Client emits `joinRoom`** with `roomName` (e.g., `conversation:abc123`). 
   - `handleJoinRoom` stores the mapping `clients.set(userId, socket)` and `socket.join(roomName)`.

3. **Client emits `chatMessage`** with `{ message: 'Hello', roomName: 'conversation:abc123', conversationId: 'abc123' }`.

4. **Server returns** `{ status: 'started' }` and calls `SocketGatewayService.streamChatToSocket(socket, payload, userId)`.

5. **SocketGatewayService.streamChatToSocket**:
   - Creates a `Message` document (status: STREAMING, role: ASSISTANT)
   - Emits `aiMessageStart` with the messageId
   - Calls `for await (const chunk of langChainService.streamChat(message))`
   - For each chunk:
     - Creates a `MessageChunk` document
     - Appends chunk to Message content
     - Emits `aiMessageChunk` event
   - On completion: marks Message as COMPLETED and emits `aiMessageComplete`
   - On error: marks Message as FAILED and emits `aiMessageError`

6. Events are broadcast to the room if `roomName` is provided; otherwise emitted directly to the client socket.

## Example Client (browser or node using `socket.io-client`)

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: 'Bearer YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('connected', socket.id);
  // join conversation room (optional)
  socket.emit('joinRoom', 'conversation:abc123');
});

socket.on('joinedRoom', ({ roomName }) => {
  console.log('joined', roomName);
});

socket.on('aiMessageStart', (payload) => {
  console.log('Stream started:', payload);
  // payload includes messageId - you can use it to track the message in your UI
});

socket.on('aiMessageChunk', (payload) => {
  // append to UI
  console.log('Chunk:', payload.chunk);
  console.log('Message ID:', payload.messageId); // Use this to update the right message in UI
});

socket.on('aiMessageComplete', (payload) => {
  console.log('Stream complete:', payload);
  // Message is now saved in DB with status COMPLETED
});

socket.on('aiMessageError', (payload) => {
  console.error('Stream error:', payload);
  // Message is saved in DB with status FAILED
});

// Send a chat message to trigger streaming
socket.emit('chatMessage', {
  message: 'Please summarize the last conversation in bullet points.',
  roomName: 'conversation:abc123', // optional - if provided, events broadcast to room
  conversationId: 'abc123' // optional - included in all events for UI correlation
});
```

## Module Dependencies

The `SocketModule` imports:
- `LangChainModule` - for AI streaming
- `MessageModelsModule` - for Message CRUD operations
- `ConversationModelModule` - for Conversation operations and user/OTP validation
- `MessageChunkModelsModule` - for MessageChunk persistence

The `ConversationModelModule` imports:
- `OtpModelModule` - for OTP validation
- `UserModelsModule` - for user validation

This allows the `ConversationModelService` to:
- Validate users via `validateUser(userId)`
- Validate OTPs via `validateOtp(otp, userId, otpType)`

## Service APIs

### MessageModelService
- `createMessage(value)` - Create a new message
- `appendToMessage(messageId, chunk)` - Append chunk to message content
- `markCompleted(messageId)` - Mark message as completed
- `markFailed(messageId, error)` - Mark message as failed
- `getMessagesByConversation(conversationId, limit)` - Get messages for a conversation
- `getPendingOrStreamingMessages()` - Get all streaming/pending messages
- `incrementTokenCount(messageId, count)` - Update token count

### ConversationModelService
- `createConversation(userId, title?)` - Create a new conversation
- `getConversationsByUser(userId, limit)` - List user's conversations
- `getConversationById(id)` - Get conversation by ID
- `closeConversation(id)` - Mark conversation as inactive
- `validateUser(userId)` - Check if user exists
- `validateOtp(otp, userId, otpType)` - Validate OTP for a user

### MessageChunkModelService
- `createChunk(value)` - Create a message chunk
- `getChunksByMessage(messageId)` - Get all chunks for a message
- `deleteChunksByMessage(messageId)` - Delete all chunks for a message

### SocketConnectionModelService
- `createConnection(value)` - Create socket connection record
- `findActiveByUser(userId)` - Find active connections for user
- `getBySocketId(socketId)` - Get connection by socket ID
- `deactivateSocket(socketId)` - Mark socket as inactive
- `touch(socketId)` - Update last activity timestamp

## Notes on OTP and User Validation

The `ConversationModelService` integrates with existing OTP and User services:
- Uses `OtpModelService` from `@entities-otp/otp.service` to validate OTPs
- Uses `UserModelService` from `@entities-user/user.service` to validate users

Example usage:
```typescript
// In your controller or service
const isValid = await conversationModelService.validateUser(userId);
if (!isValid) {
  throw new UnauthorizedException('Invalid user');
}

const otpDoc = await conversationModelService.validateOtp(otp, userId, OTP_TYPE.EMAIL_VERIFICATION_OTP);
if (!otpDoc) {
  throw new UnauthorizedException('Invalid or expired OTP');
}
```

## Suggested Improvements

- **Add cancelStream event**: Allow clients to stop an ongoing stream
- **Implement rate limiting**: Prevent abuse by limiting messages per user
- **Add conversation history**: Include previous messages in LangChain context
- **Optimize chunk persistence**: Batch chunk writes to reduce DB load
- **Add token counting**: Integrate proper tokenization to track usage accurately
- **Add typing indicators**: Emit events when AI is "thinking"
- **Add read receipts**: Track when messages are read by participants
- **Add edit/delete**: Allow editing or deleting messages with history tracking

## Quick Troubleshooting

- `SocketAuthGuard` expects the handshake token to be in `socket.handshake.auth.token` and to start with `Bearer `.
- If events are not received, confirm socket connection uses `websocket` transport (server configured explicitly to `transports: ['websocket']`).
- If you use CORS, ensure `ALLOW_ORIGIN` env variable is set; otherwise the gateway uses `*`.
- Check that the conversationId provided actually exists in the database before streaming.
- Verify that Message and MessageChunk documents are being created in MongoDB.

## Database Collections

- `conversations` - Conversation documents
- `messages` - Message documents  
- `message_chunks` - MessageChunk documents
- `socket_connections` - SocketConnection documents
- `conversation_feedbacks` - ConversationFeedback documents

-- End of document

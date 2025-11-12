import { io } from 'socket.io-client';

// Replace with your actual server URL and JWT token
const SERVER_URL = 'http://localhost:8888';
const JWT_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEyZjZhN2RmNTZiNjJhMzRkNmY5OGUiLCJzZXNzaW9uSWQiOm51bGwsImlhdCI6MTc2MjkzOTQ2NiwiZXhwIjoxNzYzMDI1ODY2fQ.sVwagbWn038NbVpS1F0Ak9mDu3IEGgCIXOmgCn8fgVs'; // Get this from your login endpoint

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  auth: {
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEyZjZhN2RmNTZiNjJhMzRkNmY5OGUiLCJzZXNzaW9uSWQiOm51bGwsImlhdCI6MTc2MjkzOTQ2NiwiZXhwIjoxNzYzMDI1ODY2fQ.sVwagbWn038NbVpS1F0Ak9mDu3IEGgCIXOmgCn8fgVs"
  }
});

// ======================
// CONNECTION EVENTS
// ======================

socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
  
  // Get user's conversations on connect
  socket.emit('getConversations', { limit: 20 });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🚫 Connection error:', error.message);
});

// ======================
// ROOM EVENTS
// ======================

socket.on('joinedRoom', ({ roomName }) => {
  console.log('🏠 Joined room:', roomName);
});

// ======================
// CONVERSATION MANAGEMENT
// ======================

// Listen for conversations list
socket.on('conversationsList', (payload) => {
  console.log('📋 Your conversations:', payload);
  console.log(`Total: ${payload.conversations.length} conversations`);
  
  payload.conversations.forEach((conv, idx) => {
    console.log(`  ${idx + 1}. ${conv.title || 'Untitled'} (ID: ${conv._id})`);
    console.log(`     Created: ${new Date(conv.createdAt).toLocaleString()}`);
    console.log(`     Updated: ${new Date(conv.updatedAt).toLocaleString()}`);
  });
});

socket.on('conversationsError', (payload) => {
  console.error('❌ Error getting conversations:', payload.error);
});

// Listen for conversation created
socket.on('conversationCreated', (payload) => {
  console.log('✨ New conversation created:', payload.conversation);
});

socket.on('conversationError', (payload) => {
  console.error('❌ Error creating conversation:', payload.error);
});

// ======================
// MESSAGE HISTORY
// ======================

// Listen for messages list
socket.on('messagesList', (payload) => {
  console.log(`💬 Messages for conversation ${payload.conversationId}:`);
  console.log(`Total: ${payload.messages.length} messages`);
  
  payload.messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? '👤 YOU' : '🤖 AI';
    console.log(`\n  ${idx + 1}. ${role} (${new Date(msg.createdAt).toLocaleString()}):`);
    console.log(`     ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    console.log(`     Status: ${msg.status} | Tokens: ${msg.tokenCount}`);
  });
});

socket.on('messagesError', (payload) => {
  console.error('❌ Error getting messages:', payload.error);
});

// ======================
// AI STREAMING EVENTS
// ======================

let currentStreamingContent = '';
let streamStartTime = null;

socket.on('aiMessageStart', (payload) => {
  console.log('\n🚀 AI stream started:', payload);
  currentStreamingContent = '';
  streamStartTime = Date.now();
});

socket.on('aiMessageChunk', (payload) => {
  currentStreamingContent += payload.chunk;
  process.stdout.write(payload.chunk); // Stream to console in real-time
});

socket.on('aiMessageComplete', (payload) => {
  const duration = Date.now() - streamStartTime;
  console.log(`\n\n✅ AI stream completed in ${duration}ms`);
  console.log(`Message ID: ${payload.messageId}`);
  console.log(`Conversation ID: ${payload.conversationId}`);
  console.log(`Total length: ${currentStreamingContent.length} characters`);
  currentStreamingContent = '';
});

socket.on('aiMessageError', (payload) => {
  console.error('\n❌ AI stream error:', payload.error);
  currentStreamingContent = '';
});

// ======================
// EXAMPLE USAGE FUNCTIONS
// ======================

function createNewConversation(title = null) {
  console.log('Creating new conversation...');
  socket.emit('createConversation', { title });
}

function getMyConversations(limit = 20) {
  console.log('Fetching conversations...');
  socket.emit('getConversations', { limit });
}

function getMessagesForConversation(conversationId) {
  console.log(`Fetching messages for conversation: ${conversationId}`);
  socket.emit('getMessages', { conversationId, limit: 100 });
}

function joinConversationRoom(conversationId) {
  const roomName = `conversation:${conversationId}`;
  console.log(`Joining room: ${roomName}`);
  socket.emit('joinRoom', roomName);
}

function sendChatMessage(message, conversationId = null, roomName = null) {
  console.log(`\n👤 YOU: ${message}\n`);
  socket.emit('chatMessage', {
    message,
    conversationId, // Can be null to auto-create a new conversation
    roomName,       // Optional - for broadcasting to room
  });
}

// ======================
// AUTO-RUN DEMO
// ======================

// Wait for connection, then run demo
socket.once('connect', () => {
  console.log('\n===========================================');
  console.log('🎉 Socket.IO Chat Demo');
  console.log('===========================================\n');
  
  // Step 1: Get all conversations
  // setTimeout(() => {
  //   console.log('\n--- Step 1: Get all conversations ---');
  //   getMyConversations(10);
  // }, 500);
  //
  // Step 2: Create a new conversation
  // setTimeout(() => {
  //   console.log('\n--- Step 2: Create new conversation ---');
  //   createNewConversation('Demo Chat');
  // }, 2000);
  //
  // Step 3: Send a message (will auto-create conversation if needed)
  setTimeout(() => {
    sendChatMessage('Birth stone, stone', '691467299565ecc329584fd0');
  }, 4000);
  
  // Step 4: After streaming completes, get conversation history
  socket.once('aiMessageComplete', (payload) => {
    setTimeout(() => {
      console.log('\n--- Step 4: Get message history ---');
      getMessagesForConversation(payload.conversationId);
    }, 1000);
  });
});

// ======================
// EXPORT FOR REUSE
// ======================

// You can use these functions in your app
export {
  socket,
  createNewConversation,
  getMyConversations,
  getMessagesForConversation,
  joinConversationRoom,
  sendChatMessage,
};

// ======================
// MANUAL TESTING (uncomment to use)
// ======================

/*
// After connecting, you can manually call:

// 1. Get your conversations
getMyConversations(20);

// 2. Create a new conversation
createNewConversation('My New Chat');

// 3. Get messages for a specific conversation
getMessagesForConversation('YOUR_CONVERSATION_ID_HERE');

// 4. Join a conversation room
joinConversationRoom('YOUR_CONVERSATION_ID_HERE');

// 5. Send a message (auto-creates conversation if none specified)
sendChatMessage('What is the capital of France?');

// 6. Send a message to existing conversation
sendChatMessage('Tell me more about Paris', 'YOUR_CONVERSATION_ID_HERE');

// 7. Send a message with room broadcasting
sendChatMessage('Hello everyone!', 'CONVERSATION_ID', 'conversation:CONVERSATION_ID');
*/


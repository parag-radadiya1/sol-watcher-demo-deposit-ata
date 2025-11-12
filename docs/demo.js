import { io } from 'socket.io-client';

const socket = io('http://localhost:8888', {
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
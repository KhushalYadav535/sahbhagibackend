require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/events', require('./routes/importExport'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-event', (eventId) => {
    socket.join(eventId);
    console.log(`User ${socket.id} joined event ${eventId}`);
  });

  socket.on('send-poll-response', (data) => {
    io.to(data.eventId).emit('poll-response', data);
  });

  socket.on('send-question', (data) => {
    io.to(data.eventId).emit('new-question', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

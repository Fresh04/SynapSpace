require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const changePasswordRoute = require('./routes/changepassword');
const spaceRoute = require('./routes/spaces');

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/changepassword', changePasswordRoute);
app.use('/spaces', spaceRoute);

async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('SynapSpace');
    global.db = db;
    console.log('Connected to DB');
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('New socket connected:', socket.id);

      socket.on('join-room', (spaceId) => {
        socket.join(spaceId);
        console.log(`Socket ${socket.id} joined room ${spaceId}`);
      });

      socket.on('drawing-data', ({ spaceId, data }) => {
        socket.to(spaceId).emit('receive-drawing', data);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

connectMongoDB();
module.exports = app;

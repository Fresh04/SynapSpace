require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 8000;

async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('SynapSpace');
    global.db = db;
    console.log('Connected to database');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

app.use(cors());
app.use(express.json());

// const accessRoute = require('./routes/access'); 
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const changePasswordRoute = require('./routes/changepassword');

// app.use('/access', accessRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/changepassword', changePasswordRoute);

connectMongoDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

module.exports = app;

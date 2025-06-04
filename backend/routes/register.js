const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

module.exports = router;
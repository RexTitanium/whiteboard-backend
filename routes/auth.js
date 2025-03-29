// 5. routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
  
      const hashed = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashed });
      await user.save();
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false,
      });
  
      res.status(201).json({ message: 'User registered', user: { id: user._id, name, email } });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  module.exports = router;

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Check if both fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
  
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: true,
    });
  
    res.json({ message: 'Logged in successfully', token, user: { id: user._id, name: user.name, email: user.email } });
  });
  
  
  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  
router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id); // ✅
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ _id: user._id, name: user.name, email: user.email });
    } catch (err) {
      console.error('Get /me error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });



  //LRU cache get

  // GET /auth/recents
    router.get('/recents', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('recents');
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json(user.recents); // array of board objects
    } catch (err) {
      console.error('Fetch recents error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get Id from email
  router.get('/findId', async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      res.json({ userId: user._id });
    } catch (err) {
      console.error('Error fetching userId from email:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
module.exports = router;
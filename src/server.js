require('dotenv').config();
const mongodb = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyparser = require("body-parser")
const helmet = require('helmet')

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./Model');

const app = express()
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(helmet({
  frameguard: { 
    action: 'deny'
  },
  contentSecurityPolicy: { 
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ['style.com'],
    }
  },
  dnsPrefetchControl: false 
}))
// Connect to MongoDB
mongodb.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB: ' + err);
  });

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;  // Store user info from the token
    next();
  });
}
app.get('/',async(req,res)=>{
  console.log("Entered on backend")
  res.json({
    detail:"Server running on port 5000"
  })
})
// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    console.log('User found:', user);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Login successful!' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
});

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
});

// Protected Route to Get User Data
app.get('/api/user',authenticateToken, async (req, res) => {
  console.log('User route hit');
  console.log('Decoded user from token:', req.user);
  try {
    const user = await User.findById(req.user.id);  // Retrieve user by ID from token payload
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User info', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user data: ' + error.message });
  }
});


// Start the server
const port = 5000;
app.listen(port, () => {
  console.log("Server started on port " + port + ", waiting for requests ...");
});

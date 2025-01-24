const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3051; // Dynamic port for Azure compatibility

app.use(cors());
app.use(bodyParser.json());

// Access token generation
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
}

// Refresh token generation
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
  });
}

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  token = token.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// Input validation for animation settings
function validateAnimationSettings(settings) {
  const { spring_constant, mass, amplitude, phase, damping_coefficient } = settings;

  if (
    spring_constant <= 0 ||
    spring_constant > 100 ||
    mass <= 0 ||
    mass > 100 ||
    amplitude < 0 ||
    amplitude > 170
  ) {
    return false;
  }

  if (
    damping_coefficient !== null &&
    (damping_coefficient < 0 || damping_coefficient >= 2 * Math.sqrt(spring_constant * mass))
  ) {
    return false;
  }

  return true;
}

// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM projekt_techniki.users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query(
      'INSERT INTO projekt_techniki.refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    );

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Refresh token handling
app.post('/token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh Token required.' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const result = await pool.query(
      'SELECT * FROM projekt_techniki.refresh_tokens WHERE token = $1',
      [refreshToken]
    );
    if (result.rows.length === 0)
      return res.status(403).json({ message: 'Invalid Refresh Token.' });

    const accessToken = generateAccessToken(decoded.userId);

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error('Error refreshing token:', err.message);
    res.status(403).json({ message: 'Invalid Refresh Token.' });
  }
});

// Logout and Revoke Refresh Token
app.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: 'Refresh Token required.' });

  try {
    const result = await pool.query(
      'DELETE FROM projekt_techniki.refresh_tokens WHERE token = $1',
      [refreshToken]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Refresh Token not found.' });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Error during logout:', err.message);
    res.status(500).json({ message: 'An error occurred during logout.' });
  }
});

// User Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if the username already exists
    const userCheck = await pool.query(
      'SELECT id FROM projekt_techniki.users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const result = await pool.query(
      'INSERT INTO projekt_techniki.users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    res.status(201).json({ userId: result.rows[0].id });
  } catch (err) {
    console.error('Error registering user:', err.message);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
});

// Save or Update User Animation Settings
app.post('/animation-settings', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  if (!validateAnimationSettings(req.body)) {
    return res.status(400).json({ message: 'Invalid animation settings.' });
  }

  const { spring_constant, mass, amplitude, phase, damping_coefficient } = req.body;

  try {
    const result = await pool.query(
      'SELECT id FROM projekt_techniki.user_animation_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE projekt_techniki.user_animation_settings
         SET spring_constant = $1, mass = $2, amplitude = $3, phase = $4, damping_coefficient = $5
         WHERE user_id = $6`,
        [spring_constant, mass, amplitude, phase, damping_coefficient, userId]
      );
      return res.status(200).json({ message: 'Settings updated successfully.' });
    } else {
      await pool.query(
        `INSERT INTO projekt_techniki.user_animation_settings
         (user_id, spring_constant, mass, amplitude, phase, damping_coefficient)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, spring_constant, mass, amplitude, phase, damping_coefficient]
      );
      return res.status(201).json({ message: 'Settings saved successfully.' });
    }
  } catch (err) {
    console.error('Error saving settings:', err.message);
    res.status(500).json({ message: 'An error occurred while saving settings.' });
  }
});

// Retrieve User Animation Settings
app.get('/animation-settings', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT spring_constant, mass, amplitude, phase, damping_coefficient FROM projekt_techniki.user_animation_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]);
    } else {
      return res.status(404).json({ message: 'No saved settings found for this user.' });
    }
  } catch (err) {
    console.error('Error retrieving settings:', err.message);
    res.status(500).json({ message: 'An error occurred while retrieving settings.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

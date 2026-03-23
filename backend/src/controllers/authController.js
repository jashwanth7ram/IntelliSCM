const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
};

exports.register = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({
      name,
      username,
      email,
      passwordHash: password, // Pre-save hook hashes this
      role: role || 'Developer'
    });

    await user.save();
    
    // Also send login email on auto-login after register
    emailService.sendLoginEmail(user.email, user.name);

    const token = generateToken(user._id);
    res.status(201).json({ user: { id: user._id, username: user.username, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Send login alert
    emailService.sendLoginEmail(user.email, user.name);

    const token = generateToken(user._id);
    res.json({ user: { id: user._id, username: user.username, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'contactInfo', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach(update => {
      if (update === 'password') {
         req.user.passwordHash = req.body.password;
      } else {
         req.user[update] = req.body[update];
      }
    });
    
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
     const { email, newPassword, confirmPassword } = req.body;
     if (newPassword !== confirmPassword) {
       return res.status(400).json({ error: 'Passwords do not match' });
     }
     const user = await User.findOne({ email });
     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }
     user.passwordHash = newPassword;
     await user.save();
     res.json({ message: 'Password reset successful' });
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

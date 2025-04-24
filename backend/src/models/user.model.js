const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    set: v => v.replace(/\s+/g, '_').toLowerCase() // <-- always store as lowercase, underscores
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function () {
      // Password is not required if the user has a googleId
      return !this.googleId;
    },
    minlength: 6,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents with null/undefined values
  },
  profilePicture: {
    type: String,
    default: '',
  },
  saveFilesToDashboard: {
    type: Boolean,
    default: false, // By default, files won't be saved to dashboard
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema); 
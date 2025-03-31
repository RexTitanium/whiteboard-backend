const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleAuth;
    },
  },
  googleAuth: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String, // URL to profile picture
  },
  recents: [{ type: String, ref: 'Board' }],
});

module.exports = mongoose.model('User', UserSchema);
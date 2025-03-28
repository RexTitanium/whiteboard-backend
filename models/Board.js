// models/Board.js
const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  _id: String, // UUID
  name: String,
  data: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // ✅ required!
  },
  visibility: {
    type: String,
    default: 'private',
    enum: ['private', 'public']
  }
});

module.exports = mongoose.model('Board', boardSchema);

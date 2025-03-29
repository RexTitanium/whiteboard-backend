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
  },
  sharedWith: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: { type: String, enum: ['view', 'edit'], default: 'edit' },
    }
  ]

});

module.exports = mongoose.model('Board', boardSchema);

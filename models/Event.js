const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  password: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  polls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);

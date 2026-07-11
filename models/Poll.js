const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'word-cloud', 'open-text', 'rating', 'ranking', 'quiz'],
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String
  },
  responses: [{
    userId: {
      type: String
    },
    answer: {
      type: mongoose.Schema.Types.Mixed
    },
    reactions: {
      type: Map,
      of: Number,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Poll', pollSchema);

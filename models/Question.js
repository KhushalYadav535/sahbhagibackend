const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Anonymous'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  upvotes: [{
    type: String
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  displayName: {
    type: String,
    default: 'Anonymous'
  },
  language: {
    type: String,
    default: 'en'
  },
  rosterRef: {
    type: String
  },
  deviceInfo: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Participant', participantSchema);

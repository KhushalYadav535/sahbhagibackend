const mongoose = require('mongoose');

const rosterSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  externalId: {
    type: String,
    required: true
  },
  batch: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Roster', rosterSchema);

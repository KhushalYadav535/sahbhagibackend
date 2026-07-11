const express = require('express');
const { protect } = require('../middleware/auth');
const Event = require('../models/Event');
const Poll = require('../models/Poll');
const Question = require('../models/Question');
const Participant = require('../models/Participant');

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get aggregate analytics for the host
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ host: req.user.id });
    const eventIds = events.map(e => e._id);

    const totalEvents = events.length;

    const polls = await Poll.find({ event: { $in: eventIds } });
    const totalPolls = polls.length;
    
    let totalResponses = 0;
    polls.forEach(p => {
      totalResponses += p.responses.length;
    });

    const questions = await Question.find({ event: { $in: eventIds } });
    const totalQuestions = questions.length;
    
    let totalUpvotes = 0;
    questions.forEach(q => {
      totalUpvotes += q.upvotes.length;
    });

    res.json({
      totalEvents,
      totalPolls,
      totalResponses,
      totalQuestions,
      totalUpvotes,
      avgResponsesPerPoll: totalPolls > 0 ? (totalResponses / totalPolls).toFixed(1) : 0,
      recentEvents: events.slice(-5).map(e => ({
        _id: e._id,
        title: e.title,
        createdAt: e.createdAt,
        pollCount: e.polls.length
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
});

module.exports = router;

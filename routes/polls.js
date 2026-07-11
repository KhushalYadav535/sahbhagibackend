const express = require('express');
const { body, validationResult } = require('express-validator');
const Poll = require('../models/Poll');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/polls
// @desc    Create a poll
// @access  Private
router.post('/', protect, [
  body('question', 'Question is required').not().isEmpty(),
  body('type', 'Poll type is required').not().isEmpty(),
  body('event', 'Event ID is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.body.event);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const poll = new Poll({
      question: req.body.question,
      type: req.body.type,
      options: req.body.options || [],
      correctAnswer: req.body.correctAnswer,
      event: req.body.event
    });

    await poll.save();
    await Event.findByIdAndUpdate(req.body.event, { $push: { polls: poll._id } });

    res.status(201).json(poll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/polls/:id
// @desc    Get poll by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/polls/:id
// @desc    Update poll
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const event = await Event.findById(poll.event);
    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.body.isActive === true && poll.isActive === false) {
      req.body.startTime = new Date();
    }

    const updatedPoll = await Poll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedPoll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/polls/:id/respond
// @desc    Submit poll response
// @access  Public
router.post('/:id/respond', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const response = {
      userId: req.body.userId || `user_${Date.now()}_${Math.random()}`,
      answer: req.body.answer,
      timestamp: new Date()
    };

    poll.responses.push(response);
    await poll.save();

    res.json(poll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/polls/:id/responses/:responseId/react
// @desc    Add a reaction to a poll response (Open Text)
// @access  Public
router.patch('/:id/responses/:responseId/react', async (req, res) => {
  try {
    const { emoji } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const response = poll.responses.id(req.params.responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    if (!response.reactions) {
      response.reactions = new Map();
    }
    
    const currentCount = response.reactions.get(emoji) || 0;
    response.reactions.set(emoji, currentCount + 1);

    await poll.save();
    res.json(poll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

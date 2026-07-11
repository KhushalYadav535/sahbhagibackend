const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Poll = require('../models/Poll');
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Generate unique event code
const generateEventCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @route   POST /api/events
// @desc    Create an event
// @access  Private
router.post('/', protect, [
  body('title', 'Title is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, language, password } = req.body;

  try {
    let code;
    let codeExists = true;
    while (codeExists) {
      code = generateEventCode();
      codeExists = await Event.findOne({ code });
    }

    const event = new Event({
      title,
      description,
      code,
      host: req.user.id,
      language: language || 'en',
      password
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events
// @desc    Get all events for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ host: req.user.id }).populate('polls').populate('questions');
    res.json(events);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events/:code
// @desc    Get event by code
// @access  Public
router.get('/:code', async (req, res) => {
  try {
    const isValidId = require('mongoose').Types.ObjectId.isValid(req.params.code);
    const query = isValidId ? { _id: req.params.code } : { code: req.params.code };
    const event = await Event.findOne(query).populate('polls').populate('questions');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const eventObj = event.toObject();
    if (eventObj.password) {
      return res.json({ requiresPassword: true, _id: eventObj._id, passwordRequired: true });
    }
    delete eventObj.password;
    res.json(eventObj);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/events/:code/verify-password
// @desc    Verify event password
// @access  Public
router.post('/:code/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const event = await Event.findOne({ code: req.params.code });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.password && event.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    res.json({ message: 'Password verified' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('polls').populate('questions');

    res.json(updatedEvent);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Poll.deleteMany({ event: req.params.id });
    await Question.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/events/:id/questions/:questionId
// @desc    Update question approval status
// @access  Private
router.patch('/:id/questions/:questionId', protect, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.isApproved = isApproved;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

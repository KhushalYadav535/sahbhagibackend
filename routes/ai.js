const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/ai/generate-polls
// @desc    Generate polls using OpenRouter
// @access  Private
router.post('/generate-polls', protect, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        polls: [
          {
            question: `Mock Poll 1 about: ${prompt.substring(0, 20)}...`,
            type: "multiple-choice",
            options: ["Option A", "Option B", "Option C"]
          },
          {
            question: "How would you rate this session so far?",
            type: "rating"
          }
        ]
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating engaging polls and questions for events, meetings, and training sessions. Generate a list of 3-5 relevant polls based on the user's description. Return the response in JSON format with the following structure:
          {
            "polls": [
              {
                "question": "Poll question text",
                "type": "multiple-choice | word-cloud | open-text | rating | ranking | quiz",
                "options": ["Option 1", "Option 2", ...]
              }
            ]
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sahbhagi'
      }
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to generate polls'
    });
  }
});

// @route   POST /api/ai/rewrite-question
// @desc    Rewrite poll question using AI
// @access  Private
router.post('/rewrite-question', protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        rewrittenQuestions: `✨ ${question} (improved)`
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Rewrite the given poll question to make it more clear, engaging, and professional. Provide 2-3 alternative versions of the question.'
        },
        {
          role: 'user',
          content: question
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sahbhagi'
      }
    });

    res.json({
      rewrittenQuestions: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to rewrite question'
    });
  }
});

// @route   POST /api/ai/generate-options
// @desc    Generate answer options for a poll
// @access  Private
router.post('/generate-options', protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        options: ["Excellent", "Good", "Average", "Needs Improvement"]
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate 4-6 relevant answer options for the given poll question. Return a JSON array of options.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sahbhagi'
      }
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to generate options'
    });
  }
});

// @route   POST /api/ai/generate-event
// @desc    Generate a full event (title, description, and polls)
// @access  Private
router.post('/generate-event', protect, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      // Mock response if no API key
      return res.json({
        title: `Event: ${prompt}`,
        description: 'Auto-generated event based on your prompt.',
        polls: [
          { question: 'How are you feeling today?', type: 'rating' },
          { question: 'What is your main expectation?', type: 'word-cloud' },
          { question: 'Which topic should we prioritize?', type: 'multiple-choice', options: ['Topic A', 'Topic B'] }
        ]
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert event planner. Based on the prompt, generate an Event Title, a short Description, and 3-5 engaging polls. Return JSON:
          {
            "title": "...",
            "description": "...",
            "polls": [
              {
                "question": "...",
                "type": "multiple-choice | word-cloud | open-text | rating | quiz",
                "options": ["...", "..."],
                "correctAnswer": "..." // Only if type is quiz
              }
            ]
          }`
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ message: 'Failed to generate event' });
  }
});

// @route   POST /api/ai/summarize-responses
// @desc    Summarize open-text/Q&A responses
// @access  Private
router.post('/summarize-responses', protect, async (req, res) => {
  try {
    const { responses } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        themes: [
          { title: 'Theme 1', description: 'Mock theme description based on responses' },
          { title: 'Theme 2', description: 'Another mock theme.' }
        ]
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant. Analyze these audience responses and cluster them into 3-5 main themes. Return JSON:
          {
            "themes": [
              { "title": "...", "description": "..." }
            ]
          }`
        },
        { role: 'user', content: JSON.stringify(responses) }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ message: 'Failed to summarize' });
  }
});

// @route   POST /api/ai/recommend-interaction
// @desc    Recommend next interaction based on current state
// @access  Private
router.post('/recommend-interaction', protect, async (req, res) => {
  try {
    const { eventState } = req.body;
    // eventState could contain current poll engagement, time elapsed, etc.

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        recommendation: "Engagement seems low. Consider launching a quick 5-star Rating poll to get the audience's pulse!"
      });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI co-host for a live event. Analyze the given event state and suggest ONE actionable recommendation for the host to increase engagement. Keep it under 2 sentences. Return JSON: { "recommendation": "..." }`
        },
        { role: 'user', content: JSON.stringify(eventState) }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ message: 'Failed to get recommendation' });
  }
});

module.exports = router;

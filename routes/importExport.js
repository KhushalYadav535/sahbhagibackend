const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { createObjectCsvStringifier } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const Poll = require('../models/Poll');
const Question = require('../models/Question');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const Roster = require('../models/Roster');

// Set up multer for temporary file storage
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

// @route   POST /api/events/:id/import
// @desc    Import polls from an Excel/CSV file
// @access  Private (should be authenticated but omitting middleware for MVP speed)
router.post('/:id/import', upload.single('file'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the file using xlsx
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Expected columns: Question, Type, Options, CorrectAnswer
    const newPolls = [];
    for (const row of data) {
      if (!row.Question) continue; // Skip empty rows

      const type = row.Type ? row.Type.toLowerCase().replace(' ', '-') : 'multiple-choice';
      let options = [];
      if (row.Options) {
        options = row.Options.split(',').map(opt => opt.trim());
      }

      const poll = new Poll({
        question: row.Question,
        type: type,
        options: options,
        correctAnswer: row.CorrectAnswer || '',
        event: eventId,
        isActive: false // Default to false, host will activate it manually
      });
      
      const savedPoll = await poll.save();
      event.polls.push(savedPoll._id);
      newPolls.push(savedPoll);
    }

    await event.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Import successful', importedCount: newPolls.length, polls: newPolls });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// @route   GET /api/events/:id/export
// @desc    Export poll and Q&A results as CSV
// @access  Private
router.get('/:id/export', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch all polls for this event
    const polls = await Poll.find({ event: eventId });
    
    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'type', title: 'Record Type' },
            { id: 'content', title: 'Content / Question' },
            { id: 'participant', title: 'Participant ID' },
            { id: 'response', title: 'Response / Value' },
            { id: 'timestamp', title: 'Timestamp' }
        ]
    });

    const records = [];

    // Add poll responses
    for (const poll of polls) {
      for (const response of poll.responses) {
        records.push({
          type: 'Poll Response',
          content: poll.question,
          participant: response.userId || 'Anonymous',
          response: response.answer,
          timestamp: response.timestamp ? response.timestamp.toISOString() : ''
        });
      }
    }

    // Add Q&A
    const questions = await Question.find({ event: eventId });
    for (const q of questions) {
      records.push({
        type: 'Q&A',
        content: q.text,
        participant: q.author || 'Anonymous',
        response: `Upvotes: ${q.upvotes.length}`,
        timestamp: q.createdAt ? q.createdAt.toISOString() : ''
      });
    }

    const csvOutput = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event_${eventId}_export.csv"`);
    res.send(csvOutput);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

// @route   POST /api/events/:id/roster/import
// @desc    Import participant roster from Excel/CSV
// @access  Private
router.post('/:id/roster/import', upload.single('file'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const newRoster = [];
    // Expected columns: Name, ExternalId, Batch
    for (const row of data) {
      if (!row.ExternalId && !row.Name) continue;
      
      const rosterEntry = new Roster({
        event: eventId,
        name: row.Name || 'Unknown',
        externalId: row.ExternalId ? String(row.ExternalId) : `gen_${Date.now()}_${Math.random()}`,
        batch: row.Batch || ''
      });
      
      await rosterEntry.save();
      newRoster.push(rosterEntry);
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: 'Roster imported successfully', importedCount: newRoster.length });
  } catch (error) {
    console.error('Roster Import error:', error);
    res.status(500).json({ message: 'Server error during roster import' });
  }
});

// @route   POST /api/events/:id/lms/sync
// @desc    Mock sync to LMS (Canvas/Moodle)
// @access  Private
router.post('/:id/lms/sync', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // In a real LTI 1.3 implementation, we would extract scores, build a signed JWT, 
    // and POST to the LMS LineItem URL. Here we simulate a successful sync.
    setTimeout(() => {
      res.json({ message: 'Successfully synced grades to LMS!' });
    }, 1500); // simulate network delay

  } catch (error) {
    console.error('LMS Sync error:', error);
    res.status(500).json({ message: 'Failed to sync with LMS' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const shortid = require('shortid');

const createSpaceModel = require('../models/Space');

router.post('/create', async (req, res) => {
  const { name, userId } = req.body;
  const spaces = createSpaceModel(global.db);

  const newSpace = {
    name,
    code: shortid.generate(),
    createdBy: userId,
    members: [userId],
    createdAt: new Date(),
    strokes: [],
  };

  const result = await spaces.create(newSpace);
  res.json({ success: true, spaceId: result.insertedId, code: newSpace.code });
});

router.get('/:spaceId', async (req, res) => {
  const { spaceId } = req.params;
  const spaces = createSpaceModel(global.db);
  try {
    const space = await spaces.findById(spaceId);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    res.json(space);
  } catch (err) {
    console.error('Error fetching space by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:spaceId/save-strokes', async (req, res) => {
  const { spaceId } = req.params;
  const { strokes } = req.body;

  if (!Array.isArray(strokes)) {
    return res.status(400).json({ message: 'Invalid strokes format' });
  }

  try {
    const spaces = createSpaceModel(global.db);
    await spaces.updateDrawing(spaceId, strokes);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving strokes:', err);
    res.status(500).json({ message: 'Failed to save strokes' });
  }
});

router.post('/join', async (req, res) => {
  const { code, userId } = req.body;
  const spaces = createSpaceModel(global.db);
  const found = await spaces.findByCode(code);

  if (!found) return res.status(404).json({ message: 'Invalid code' });

  await spaces.addUserToSpace(code, userId);
  res.json({ success: true, joinedSpace: found.name, spaceId: found._id });
});


router.get('/myspaces/:userId', async (req, res) => {
  const { userId } = req.params;
  const spaces = createSpaceModel(global.db);
  const list = await spaces.findByUserId(userId);
  res.json(list);
});

router.delete('/:spaceId', async (req, res) => {
  const { spaceId } = req.params;
  const spaces = createSpaceModel(global.db);

  try {
    const result = await spaces.deleteById(spaceId);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Space not found or already deleted' });
    }
    res.json({ success: true, message: 'Space deleted successfully' });
  } catch (err) {
    console.error('Error deleting space:', err);
    res.status(500).json({ message: 'Failed to delete space' });
  }
});


module.exports = router;

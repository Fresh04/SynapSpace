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
  };
  // console.log(name);
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

router.get('/myspaces/:userId', async (req, res) => {
  const { userId } = req.params;
  const spaces = createSpaceModel(global.db);
  const list = await spaces.findByUserId(userId);
  res.json(list);
});

router.post('/join', async (req, res) => {
  const { code, userId } = req.body;
  const spaces = createSpaceModel(global.db);
  const found = await spaces.findByCode(code);
  if (!found) return res.status(404).json({ message: 'Invalid code' });

  await spaces.addUserToSpace(code, userId);
  res.json({ success: true, joinedSpace: found.name });
});

module.exports = router;

const express = require('express');
const Board = require('../models/Board');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const getUniqueBoardName = async (baseName, userId) => {
    let name = baseName;
    let count = 1;
  
    while (await Board.findOne({ name, userId })) {
      name = `${baseName} (${count++})`;
    }
  
    return name;
};

const getUniqueBoardNameForUpdate = async (baseName, userId, currentId) => {
let name = baseName;
let count = 1;

while (await Board.findOne({ name, userId, _id: { $ne: currentId } })) {
    name = `${baseName} (${count++})`;
}

return name;
};


// Get all boards for logged-in user
router.get('/', auth, async (req, res) => {
  const boards = await Board.find({ userId: req.user._id });
  res.json(boards);
});

// Get public boards
router.get('/public', async (_req, res) => {
  const boards = await Board.find({ visibility: 'public' });
  res.json(boards);
});

// Get single board
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!board.userId.equals(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    res.json(board);
  } catch (err) {
    console.error('Fetch board error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// routes/boards.js
router.post('/createBoard', auth, async (req, res) => {
  try {
    const baseName = req.body.name || 'Untitled';
    const name = await getUniqueBoardName(baseName, req.user._id);

    const board = new Board({
      _id: uuidv4(),
      name,
      data: '',
      userId: req.user._id,
    });

    await board.save();
    res.status(201).json(board);
  } catch (err) {
    console.error('Create board error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update board
router.put('/:id', auth, async (req, res) => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board || board.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
  
      const incomingName = req.body.name;
  
      if (incomingName && incomingName !== board.name) {
        const uniqueName = await getUniqueBoardNameForUpdate(incomingName, req.user.id, req.params.id);
        board.name = uniqueName;
      }
  
      if (req.body.data !== undefined) {
        board.data = req.body.data;
      }
  
      await board.save();
      res.json(board);
    } catch (err) {
      console.error('Update board error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Delete board
router.delete('/:id', auth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board || !board.userId.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });

  await Board.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

router.post('/:id/recent', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      console.log('Before update:', user.recents);
      user.recents = [req.params.id, ...user.recents.filter(id => id !== req.params.id)].slice(0, 10);
      console.log('After update:', user.recents);
      
      await user.save();
      
      res.json({ success: true });
    } catch (err) {
      console.error('Update recent error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

  module.exports = router;
  

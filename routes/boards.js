const express = require('express');
const Board = require('../models/Board');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../config/aws');

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


// GET /boards/shared
router.get('/shared', auth, async (req, res) => {
  try {
    const boards = await Board.find({ 'sharedWith.userId': req.user._id });
    res.json(boards);
  } catch (err) {
    console.error('Fetch shared boards error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single board
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).lean();
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isOwner = board.userId.toString() === req.user._id.toString();
    const isSharedUser = board.sharedWith?.some(
      (entry) => entry.userId.toString() === req.user._id.toString()
    );

    if (!isOwner && !isSharedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Populate sharedWith with emails
    const userIds = board.sharedWith.map((entry) => entry.userId);
    const users = await User.find({ _id: { $in: userIds } }, '_id email').lean();

    board.sharedWith = board.sharedWith.map(entry => {
      const match = users.find(u => u._id.toString() === entry.userId.toString());
      return {
        ...entry,
        email: match?.email || 'Unknown',
      };
    });

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

// UploadBoard

router.post('/:id/upload', auth, async (req, res) => {
  const { dataUrl } = req.body;
  const buffer = Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  const boardId = req.params.id;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `boards/${boardId}.png`,
    Body: buffer,
    ContentEncoding: 'base64',
    ContentType: 'image/png',
  };

  try {
    const uploadResult = await s3.upload(params).promise();

    const board = await Board.findById(boardId);
    board.data = uploadResult.Location;
    await board.save();

    res.json({ url: uploadResult.Location });
  } catch (err) {
    console.error('S3 Upload Error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});


// Update board
router.put('/:id', auth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ message: 'Board not found' });

  const isOwner = board.userId.equals(req.user._id);
  const sharedEntry = board.sharedWith.find(
    (entry) => entry.userId.toString() === req.user._id.toString()
  );

  const isEditor = sharedEntry?.permission === 'edit';

  if (!isOwner && !isEditor) {
    return res.status(403).json({ message: 'No permission to save' });
  }

  board.name = getUniqueBoardNameForUpdate(req.body.name)|| board.name;
  if (req.body.data !== undefined) {
    board.data = req.body.data;
  }

  await board.save();
  res.json(board);
});



router.delete('/:id/share', auth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const board = await Board.findById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const userToRemove = await User.findOne({ email });
  if (!userToRemove) {
    return res.status(404).json({ error: 'User not found' });
  }

  const originalLength = board.sharedWith.length;

  board.sharedWith = board.sharedWith.filter(
    (entry) => entry.userId.toString() !== userToRemove._id.toString()
  );

  if (board.sharedWith.length === originalLength) {
    return res.status(404).json({ error: 'User not shared with this board' });
  }

  await board.save();
  res.json({ success: true, message: 'User removed from shared list' });
});


// Delete board
router.delete('/:id', auth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board || !board.userId.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });

  await Board.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});


//LRU post
router.post('/:id/recent', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.recents = [req.params.id, ...user.recents.filter(id => id !== req.params.id)].slice(0, 10);
      
      await user.save();
      
      res.json({ success: true });
    } catch (err) {
      console.error('Update recent error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Share Board
router.post('/:id/share', auth, async (req, res) => {
  const { email, permission } = req.body;

  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Invalid permission. Use "view" or "edit"' });
  }

  const board = await Board.findById(req.params.id);
  const userToShare = await User.findOne({ email });

  if (!board || !userToShare) {
    return res.status(404).json({ error: 'Board or user not found' });
  }

  const existingIndex = board.sharedWith.findIndex(
    (entry) => entry.userId.toString() === userToShare._id.toString()
  );

  if (existingIndex !== -1) {
    board.sharedWith[existingIndex].permission = permission;
    board.sharedWith[existingIndex].email = email; // 🔁 ensures email is up to date
  } else {
    board.sharedWith.push({
      userId: userToShare._id,
      email,
      permission
    });
  }

  await board.save();
  res.json({ success: true });
});


  module.exports = router;
  

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Connection = require('../models/Connection');
const User = require('../models/User');

// Get all connections (both active and pending)
router.get('/', protect, async (req, res) => {
  try {
    // Get accepted connections where user is either sender or receiver
    const connections = await Connection.find({
      $or: [
        { sender: req.user },
        { receiver: req.user }
      ],
      status: 'accepted'
    }).populate('sender receiver', 'name email businessName image');

    // Get pending connections where user is the receiver
    const pendingConnections = await Connection.find({
      receiver: req.user,
      status: 'pending'
    }).populate('sender', 'name email businessName image');

    res.json({
      connections: connections.map(conn => 
        conn.sender._id.equals(req.user) ? conn.receiver : conn.sender
      ),
      pendingConnections: pendingConnections.map(conn => conn.sender)
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send connection request
router.post('/request/:userId', protect, async (req, res) => {
  try {
    // console.log('Requesting connection with user:', req.params.userId);
    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (receiver._id.equals(req.user)) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: req.user, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    const connection = new Connection({
      sender: req.user,
      receiver: receiver._id,
      status: 'pending'
    });

    await connection.save();
    res.json({ message: 'Connection request sent successfully' });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
// Accept connection request
router.post('/accept/:userId', protect, async (req, res) => {
  try {
    const connection = await Connection.findOne({
      sender: req.params.userId,
      receiver: req.user,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    connection.status = 'accepted';
    await connection.save();
    // console.log(connection);

    // Add to both users' connections array
    const sender = await User.findById(req.params.userId);
    const receiver = await User.findById(connection.receiver._id);
    
    if (!sender.connections.includes(receiver._id)) {
      sender.connections.push(receiver._id);
      await sender.save();
    }

    // if (!receiver.connections.includes(sender._id)) {
    //   receiver.connections.push(sender._id);
    //   await receiver.save();
    // }

    res.json({ message: 'Connection accepted successfully' });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Reject connection request
router.post('/reject/:userId', protect, async (req, res) => {
  try {
    const connection = await Connection.findOne({
      sender: req.params.userId,
      receiver: req.user,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    connection.status = 'rejected';
    await connection.save();

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
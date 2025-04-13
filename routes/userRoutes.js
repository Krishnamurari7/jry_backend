const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).populate("connections", "name email image");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const { email, name, bio } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.bio = bio || user.bio;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile image
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.image = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ imageUrl: user.image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users
router.get("/search", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Search email is required" });
    }

    const users = await User.find({
      email: { $regex: email, $options: "i" }
    }).select("name email image");
    // console.log(users);
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.json(users);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add connection
router.post("/connections", async (req, res) => {
  try {
    const { userEmail, connectionEmail } = req.body;
    if (!userEmail || !connectionEmail) {
      return res.status(400).json({ message: "Both user and connection emails are required" });
    }

    const user = await User.findOne({ email: userEmail });
    const connection = await User.findOne({ email: connectionEmail });

    if (!user || !connection) {
      return res.status(404).json({ message: "User or connection not found" });
    }

    // Check if connection already exists
    if (user.connections.includes(connection._id)) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    // Add bidirectional connection
    user.connections.push(connection._id);
    connection.connections.push(user._id);

    await user.save();
    await connection.save();

    // Return updated user with populated connections
    const updatedUser = await User.findOne({ email: userEmail })
      .populate("connections", "name email image");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove connection
router.delete("/connections", async (req, res) => {
  try {
    const { userEmail, connectionEmail } = req.body;
    if (!userEmail || !connectionEmail) {
      return res.status(400).json({ message: "Both user and connection emails are required" });
    }

    const user = await User.findOne({ email: userEmail });
    const connection = await User.findOne({ email: connectionEmail });

    if (!user || !connection) {
      return res.status(404).json({ message: "User or connection not found" });
    }

    // Remove bidirectional connection
    user.connections = user.connections.filter(
      (connId) => connId.toString() !== connection._id.toString()
    );
    connection.connections = connection.connections.filter(
      (connId) => connId.toString() !== user._id.toString()
    );

    await user.save();
    await connection.save();

    // Return updated user with populated connections
    const updatedUser = await User.findOne({ email: userEmail })
      .populate("connections", "name email image");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's network
router.get("/network", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email })
      .populate("connections", "name email image")
      .populate({
        path: "connections",
        populate: {
          path: "connections",
          select: "name email image"
        }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all connections (direct and indirect)
    const network = new Set();
    user.connections.forEach(connection => {
      network.add(connection._id.toString());
      connection.connections.forEach(indirectConnection => {
        if (indirectConnection._id.toString() !== user._id.toString()) {
          network.add(indirectConnection._id.toString());
        }
      });
    });

    // Convert Set to Array and get unique users
    const networkUsers = await User.find({
      _id: { $in: Array.from(network) }
    }).select("name email image");

    res.json({
      directConnections: user.connections,
      networkSize: networkUsers.length,
      network: networkUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
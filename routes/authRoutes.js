const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {protect} = require("../middleware/auth"); // adjust your path
const path = require("path");

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
});

// Register Route
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      fatherName,
      businessName,
      businessOption,
      dob,
      image,
      post,
      pinCode,
      policeStation,
      district,
      state,
      phoneNo,
      aadharNo,
      panNo,
      villageTown
    } = req.body;

    // Validate required fields
    if (!name || !email || !password ) {
      return res.status(400).json({
        message: "Please fill in all required fields",
        missingFields: {
          name: !name,
          email: !email,
          password: !password,
          
        }
      });
    }

    // Optional: Validate base64 format
    if (image && !image.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      fatherName,
      businessName,
      businessOption,
      dob,
      image: image || "/default-avatar.png",
      post,
      pinCode,
      policeStation,
      district,
      state,
      phoneNo,
      aadharNo,
      panNo,
      villageTown
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log("Login request body:", req.body);

    // Check if user exists
    const user = await User.findOne({ email });
   
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // console.log(user.password)
    // console.log(password)
    // Check if user is blocked

    

    // Validate password
    // const isMatch = await user.matchPassword(password);
    // const isMatch=user.password===password;
     const isMatch = await bcrypt.compare(password, user.password);
    // console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout Route
router.post("/logout", async(req, res) => {
 
  res.status(200).json({ success: true, message: "Logged out successfully" });
});


// Get user data


router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Auth /me error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

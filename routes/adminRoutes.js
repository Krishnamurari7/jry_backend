const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {protect} = require("../middleware/auth"); 



// routes/admin.js (or in your main router file)




const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access only" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const admintoken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      admintoken,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
    // console.log(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


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

router.post("/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      fatherName,
      businessName,
      businessOption,
      dob,
      phoneNo,         // maps to phoneNo
      aadharNo,        // maps to aadharNo
      panNo,           // maps to panNo
      post,
      pinCode,
      policeStation,
      district,
      state,
      villageTown        // maps to villageTown
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
      role,
      fatherName,
      businessName,
      businessOption:businessOption,
      dob,
      phoneNo: phoneNo,
      aadharNo: aadharNo,
      panNo: panNo,
      post,
      pinCode,
      policeStation,
      district,
      state,
      villageTown: villageTown
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      fatherName,
      businessName,
      businessOption,
      dob,
      phoneNo,         // maps to phoneNo
      aadharNo,        // maps to aadharNo
      panNo,           // maps to panNo
      post,
      pinCode,
      policeStation,
      district,
      state,
      villageTown        // maps to villageTown
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.fatherName = fatherName || user.fatherName;
    user.businessOption = businessOption || user.businessOption;
    user.businessName = businessName || user.businessName;
    user.dob = dob || user.dob;
    user.phoneNo = phoneNo || user.phoneNo;
    user.aadharNo = aadharNo || user.aadharNo;
    user.panNo = panNo || user.panNo;
    user.post = post || user.post;
    user.pinCode = pinCode || user.pinCode;
    user.policeStation = policeStation || user.policeStation;
    user.district = district || user.district;
    user.state = state || user.state;
    user.villageTown = villageTown || user.villageTown;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 
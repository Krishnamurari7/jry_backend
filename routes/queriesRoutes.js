const express = require('express');
const router = express.Router();
const Query = require('../models/Queries');
const User = require('../models/User');// Make sure to import the User model
const {protect} = require("../middleware/auth"); // adjust your path



// POST: Save a new message
router.post("/submit", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // 1. Save the new query
    const newQuery = new Query({ name, email, subject, message });
    const savedQuery = await newQuery.save();

    // 2. Push the query ID to all admin users
    await User.updateMany(
      { role: "admin" },
      { $push: { queries: savedQuery._id } }
    );

    res.status(201).json({ message: "Query submitted and linked to admin(s)!" });
  } catch (error) {
    console.error("Error submitting query:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

router.get("/admin-queries",protect, async (req, res) => {
    try {
      const userId = req.user; // from auth middleware
      const user = await User.findById(userId).populate("queries");
    //   console.log(userId);
    //     console.log(user);
  
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
  
      res.status(200).json(user.queries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin queries" });
    }
  });


// GET: Fetch all queries (admin only, add auth logic as needed)
router.get("/", async (req, res) => {
  try {
    // Replace this with real admin verification logic
    const isAdmin = req.user && req.user.role === "admin";
    if (!isAdmin) return res.status(403).json({ error: "Access denied" });

    const queries = await Query.find().sort({ createdAt: -1 });
    res.status(200).json(queries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});

module.exports = router; 

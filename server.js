require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const connectionRoutes = require('./routes/connectionRoutes');
const queriesRoutes = require('./routes/queriesRoutes');



const PORT = process.env.PORT || 5000;
const app = express();
connectDB();

const FRONTEND_URLS = [
  "http://localhost:5000", // Localhost for development
  "https://jry-backend.vercel.app/", // Deployed frontend
];


// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.get("/", (req, res) => {
  res.send(`API is running...${PORT}`);
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected:", process.env.MONGO_URI || "127.0.0.1"))
  .catch((err) => console.error("MongoDB connection error:", err));

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || FRONTEND_URLS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS Not Allowed"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/connections', connectionRoutes);
app.use("/api/queries", queriesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

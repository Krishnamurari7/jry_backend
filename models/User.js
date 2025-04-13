const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  fatherName: {
    type: String,
    
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  siName: { type: String },
  siId: { type: String },
  businessOption: {
    type: String,
    
    
    trim: true
  },
  businessName: {
    type: String,
    
    trim: true
  },
  dob: {
    type: Date,
    
  },
  image: {
    type: String,
    default: "/default-avatar.png"
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  bio: {
    type: String,
    trim: true,
    default: ""
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  networkSize: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  queries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query"
    }
  ],
  post: String,
  pinCode: String,
  policeStation: String,
  district: String,
  state: String,
  phoneNo: String,
  aadharNo: String,
  panNo: String,
  villageTown: String,
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre("save", async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
// userSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const eventUpdateSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // Improves query performance
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [10, "Content must be at least 10 characters long"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the admin who created the update
      required: true,
      index: true, // Helps in filtering updates by admin
    },
    isEdited: {
      type: Boolean,
      default: false, // Tracks if an update has been edited
    },
  },
  { timestamps: true }
);

// Middleware to update `isEdited` when content is modified
eventUpdateSchema.pre("save", function (next) {
  if (this.isModified("content") || this.isModified("title")) {
    this.isEdited = true;
  }
  next();
});


const Event = mongoose.model("EventUpdate", eventUpdateSchema);
module.exports  = Event

const express = require("express");
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require("../controllers/eventController");
const { upload } = require("../config/multer");
const {protect} = require("../middleware/auth.js")
// Assuming multer config is in `config/multer.js

const router = express.Router();

router.post(
  "/create",
  protect,
  upload.single("banner"), // Handle single file upload (banner)
  createEvent
);
router.get("/all", getAllEvents);

// ✅ Get Event by ID
router.get("/:id", getEventById);

// ✅ Update Event (Only Event Creator)
router.put("/:id", protect, updateEvent);

// ✅ Delete Event (Only Event Creator)
router.delete("/:id", protect, deleteEvent);

router.get("/community/:communityId", getEventsByCommunityId);
export default router;

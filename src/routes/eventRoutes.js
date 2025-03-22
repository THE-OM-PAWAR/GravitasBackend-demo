const express = require("express");
const { createEvent } = require("../controllers/eventController");
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

export default router;

const Event = require("../models/eventModel");
const Community = require("../models/community");
const { uploadOnCloudinary } = require("../config/cloudinary"); // Cloudinary helper function

const createEvent = async (req, res) => {
  try {
    const { title, date, startTime, endTime, capacity, location, description, communityId } = req.body;
    const createdBy = req.user.id; // Assuming authentication middleware adds `req.user`

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Ensure only the community creator can create events
    if (!community.createdBy.equals(createdBy)) {
      return res.status(403).json({ message: "Only the community creator can create events" });
    }

    // Auto-generate uniqueId from title (lowercase & replace spaces with hyphens)
    const uniqueId = title.toLowerCase().replace(/\s+/g, "-");

    // Check if event uniqueId already exists
    const existingEvent = await Event.findOne({ uniqueId });
    if (existingEvent) {
      return res.status(400).json({ message: "Event with this title already exists" });
    }

    // Upload banner if provided
    let bannerUrl = null;
    if (req.file) {
      const bannerUpload = await uploadOnCloudinary(req.file.path);
      if (bannerUpload) bannerUrl = bannerUpload.secure_url;
    }

    // Create new event
    const newEvent = new Event({
      title,
      uniqueId,
      date,
      startTime,
      endTime,
      capacity,
      location,
      description,
      bannerUrl,
      community: communityId,
      createdBy,
    });

    await newEvent.save();

    // Add event to the community's events array
    community.events.push(newEvent._id);
    await community.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createEvent };

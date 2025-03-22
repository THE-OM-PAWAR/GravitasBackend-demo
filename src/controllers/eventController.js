const Event = require("../models/Event");
const Community = require("../models/community");
const uploadOnCloudinary = require("../config/cloudinary"); // Cloudinary helper function

// ✅ Create Event
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

// ✅ Get All Events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email") // Populate event creator details
      .populate("community", "name uniqueId"); // Populate community details

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("community", "name uniqueId");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update Event
const updateEvent = async (req, res) => {
  try {
    const { title, date, startTime, endTime, capacity, location, description } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Ensure only the event creator can update the event
    if (!event.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: "You are not authorized to update this event" });
    }

    // Update fields
    event.title = title || event.title;
    event.date = date || event.date;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.capacity = capacity || event.capacity;
    event.location = location || event.location;
    event.description = description || event.description;

    await event.save();

    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete Event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Ensure only the event creator can delete the event
    if (!event.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: "You are not authorized to delete this event" });
    }

    // Remove event from the associated community
    await Community.findByIdAndUpdate(event.community, { $pull: { events: event._id } });

    await event.deleteOne();

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Export all controllers
module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};

const uploadOnCloudinary = require("../utils/cloudinary.js");
const Community = require("../models/community"); // Community model

const createCommunity = async (req, res) => {
  try {
    const { name, uniqueId, description } = req.body;
    const createdBy = req.user.id; // Assuming authentication middleware adds `req.user`

    // Check if the uniqueId already exists
    const existingCommunity = await Community.findOne({ uniqueId });
    if (existingCommunity) {
      return res.status(400).json({ message: "Unique ID already exists" });
    }

    // Upload banner and logo if provided
    let bannerUrl = null;
    let logoUrl = null;

    if (req.files?.banner) {
      const bannerUpload = await uploadOnCloudinary(req.files.banner[0].path);
      if (bannerUpload) bannerUrl = bannerUpload.secure_url;
    }

    if (req.files?.logo) {
      const logoUpload = await uploadOnCloudinary(req.files.logo[0].path);
      if (logoUpload) logoUrl = logoUpload.secure_url;
    }

    // Create new community
    const newCommunity = new Community({
      name,
      uniqueId,
      description,
      bannerUrl,
      logoUrl,
      createdBy,
      members: [{ user: createdBy, role: "admin" }],
    });

    await newCommunity.save();

    res.status(201).json({
      message: "Community created successfully",
      community: newCommunity,
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate("createdBy", "name email")
      .populate("events", "title date");

    res.status(200).json({
      success: true,
      count: communities.length,
      communities,
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createCommunity, getAllCommunities };

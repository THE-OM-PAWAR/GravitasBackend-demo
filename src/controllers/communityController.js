import Community from "../models/community.js";

export const createCommunity = async (req, res) => {
  try {
    const { name, uniqueId, description, bannerUrl, logoUrl } = req.body;
    const createdBy = req.user.id; // Assuming `req.user.id` contains the authenticated user's ID

    // Check if the uniqueId already exists
    const existingCommunity = await Community.findOne({ uniqueId });
    if (existingCommunity) {
      return res.status(400).json({ message: "Unique ID already exists" });
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

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Unique ID can only contain lowercase letters, numbers, and hyphens"],
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching
eventSchema.index({ title: "text", description: "text" });

// Ensure event can only be created by the community owner
eventSchema.statics.createEvent = async function (eventData, userId) {
  const community = await mongoose.model("Community").findById(eventData.community);

  if (!community) {
    throw new Error("Community not found");
  }

  if (!community.createdBy.equals(userId)) {
    throw new Error("Only the community creator can create events");
  }

  const event = new this(eventData);
  await event.save();

  // Add event to community
  community.events.push(event._id);
  await community.save();

  return event;
};

const Event = mongoose.model("Event", eventSchema);

export default Event;

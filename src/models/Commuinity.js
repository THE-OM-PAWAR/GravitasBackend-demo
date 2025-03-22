import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: {
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
      match: [
        /^[a-z0-9-]+$/,
        "Unique ID can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
communitySchema.index({ name: "text", description: "text" });
communitySchema.index({ uniqueId: 1 }, { unique: true });
communitySchema.index({ createdBy: 1 });

// Virtual for member count
communitySchema.virtual("memberCount").get(function () {
  return this.members.length;
});

// Methods
communitySchema.methods.addMember = async function (userId, role = "member") {
  if (!this.members.some((member) => member.user.equals(userId))) {
    this.members.push({ user: userId, role });
    await this.save();
  }
};

communitySchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter((member) => !member.user.equals(userId));
  await this.save();
};

communitySchema.methods.updateMemberRole = async function (userId, newRole) {
  const member = this.members.find((member) => member.user.equals(userId));
  if (member) {
    member.role = newRole;
    await this.save();
  }
};

// Statics
communitySchema.statics.findByUniqueId = function (uniqueId) {
  return this.findOne({ uniqueId });
};

communitySchema.statics.findUserCommunities = function (userId) {
  return this.find({ "members.user": userId });
};

communitySchema.statics.findAdminCommunities = function (userId) {
  return this.find({
    members: {
      $elemMatch: {
        user: userId,
        role: "admin",
      },
    },
  });
};

const Community = mongoose.model("Community", communitySchema);

export default Community;

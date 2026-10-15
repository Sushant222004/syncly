const Conversation = require("../models/Conversation");
const responseHandler = require("../Utils/responseHandler");
const User = require("../models/User");

const createDirectConversation = async (req, res) => {
  const currentUserId = req.user.userId;
  const { userId } = req.body;

  if (!userId) {
    return responseHandler.error(res, "User ID is required", null, 400);
  }

  if (currentUserId === userId) {
    return responseHandler.error(
      res,
      "You cannot create a conversation with yourself",
      null,
      400,
    );
  }

  const existingConversation = await Conversation.findOne({
    participants: { $all: [currentUserId, userId] },
    type: "direct",
  });

  if (existingConversation) {
    return responseHandler.success(
      res,
      "Conversation already exists",
      existingConversation,
      200,
    );
  }

  const conversation = await Conversation.create({
    participants: [currentUserId, userId],
    type: "direct",
  });

  return responseHandler.success(
    res,
    "Conversation created successfully",
    conversation,
    201,
  );
};
const getConversations = async (req, res) => {
  const userId = req.user.userId;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "firstName lastName avatar isOnline lastSeen")
    .populate("lastMessage", "content sender createdAt")
    .sort({ updatedAt: -1 });

  return responseHandler.success(
    res,
    "Conversations fetched successfully",
    conversations,
    200,
  );
};

const createGroupConversation = async (req, res, next) => {
  try {
    const { name, participants } = req.body;

    if (!name || !name.trim()) {
      return responseHandler.error(res, "Group name is required");
    }

    if (!Array.isArray(participants) || participants.length < 2) {
      return responseHandler.error(
        res,
        "At least 2 participants are required",
      );
    }

    const userId = req.user.userId;

    const allParticipants = [
      ...new Set([userId, ...participants.map(String)]),
    ];

    const conversation = await Conversation.create({
      type: "group",
      name: name.trim(),
      participants: allParticipants,
      createdBy: userId,
      admins: [userId],
    });

    const populatedConversation = await Conversation.findById(
      conversation._id,
    ).populate(
      "participants",
      "firstName lastName avatar isOnline lastSeen",
    );

    responseHandler.success(
      res,
      "Group conversation created successfully",
      populatedConversation,
      201,
    );
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.userId } },
      "firstName lastName email avatar",
    );

    responseHandler.success(res, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};
module.exports = { createDirectConversation, getConversations, createGroupConversation , getUsers};

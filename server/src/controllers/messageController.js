const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const responseHandler = require("../Utils/responseHandler");

const sendMessage = async (req, res) => {
  const senderId = req.user.userId;
  const { conversationId, content } = req.body;

  if (!conversationId || !content) {
    return responseHandler.error(
      res,
      "Conversation ID and content are required",
      null,
      400,
    );
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversation) {
    return responseHandler.error(
      res,
      "Conversation not found or access denied",
      null,
      403,
    );
  }

  const message = await Message.create({
    sender: senderId,
    conversation: conversationId,
    content,
  });

  conversation.lastMessage = message._id;
  await conversation.save();
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "firstName lastName avatar",
  );

  return responseHandler.success(
    res,
    "Message sent successfully",
    populatedMessage,
    201,
  );
};

const getMessages = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    return responseHandler.error(
      res,
      "Conversation not found or access denied",
      null,
      403,
    );
  }

  const messages = await Message.find({
    conversation: conversationId,
  })
    .populate("sender", "firstName lastName avatar")
    .sort({ createdAt: 1 });

  return responseHandler.success(
    res,
    "Messages fetched successfully",
    messages,
    200,
  );
};

module.exports = { sendMessage, getMessages };

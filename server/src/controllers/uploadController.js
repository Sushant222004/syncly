const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const responseHandler = require("../Utils/responseHandler");

const uploadImage = async (req, res, next) => {
  try {
    const { conversationId, content = "" } = req.body;

    // 1. Check whether an image was provided
    if (!req.file) {
      return responseHandler.error(res, "Please select an image");
    }

    // 2. Check the conversation ID
    if (!conversationId) {
      return responseHandler.error(res, "Conversation ID is required");
    }

    // 3. Verify that the conversation exists
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return responseHandler.error(res, "Conversation not found", null, 404);
    }

    // 4. Verify that the authenticated user belongs to this conversation
    const isMember = conversation.participants.some(
      (participantId) => String(participantId) === String(req.user.userId),
    );

    if (!isMember) {
      return responseHandler.error(res, "Access denied", null, 403);
    }

    if (!content.trim() && !req.file) {
      return responseHandler.error(
        res,
        "A message must contain text or an image",
      );
    }

    // 5. Upload the image buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "syncly",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    // 6. Save the message in MongoDB
    const message = await Message.create({
      sender: req.user.userId,
      conversation: conversationId,
      content: content.trim(),
      imageUrl: uploadResult.secure_url,
    });

    // 7. Update the conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // 8. Return the saved message
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "firstName lastName avatar",
    );

    return responseHandler.success(
      res,
      "Image uploaded successfully",
      populatedMessage,
      201,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };

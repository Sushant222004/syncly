const User = require("../models/User");
const responseHandler = require("../Utils/responseHandler");

const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const getMe = async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId);

  if (!user) {
    return responseHandler.error(res, "User not found", null, 404);
  }

  return responseHandler.success(res, "Authenticated user", user, 200);
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return responseHandler.error(res, "Please select a profile picture");
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "syncly/avatars",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: uploadResult.secure_url },
      { new: true, runValidators: true },
    );

    if (!user) {
      return responseHandler.error(res, "User not found", null, 404);
    }

    return responseHandler.success(
      res,
      "Profile picture updated successfully",
      user,
      200,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateAvatar };

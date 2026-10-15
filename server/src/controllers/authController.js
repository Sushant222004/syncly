const responseHandler = require("../Utils/responseHandler");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return responseHandler.error(res, "Please fill all the fields first");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });
  const userObject = user.toObject();
  const { password: removedPassword, ...safeUser } = userObject;

  responseHandler.success(res, "User created successfully", safeUser, 201);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email }).select("+password");

  if (!existingUser) {
    responseHandler.error(res, "Invalid email or password", null, 401);
    return;
  }

  const isMatch = await bcrypt.compare(password, existingUser.password);

  if (!isMatch) {
    responseHandler.error(res, "Invalid email or password", null, 401);
    return;
  }

  const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const userObject = existingUser.toObject();
  const { password: removedPassword, ...safeUser } = userObject;

  responseHandler.success(res, "Login Successfull", { token, safeUser }, 200);
};

module.exports = { register, login };

require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiRoutes = require("./routes/aiRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://syncly-nine-jade.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://syncly-nine-jade.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --------------------------------------------------
// BASIC ROUTE
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("Syncly server is working");
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", userRoutes);
// --------------------------------------------------
// SOCKET.IO AUTHENTICATION
// --------------------------------------------------

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = String(decoded.userId);

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// --------------------------------------------------
// SOCKET.IO CONNECTION
// --------------------------------------------------

io.on("connection", async (socket) => {
  const userId = socket.userId;

  // Each user's personal room supports multiple tabs.
  await socket.join(userId);

  console.log("Socket connected:", socket.id);
  console.log("Authenticated user:", userId);

  try {
    const user = await User.findById(userId);

    if (user) {
      user.isOnline = true;
      await user.save();
    }

    io.emit("user-connected", {
      userId,
      isOnline: true,
    });
  } catch (error) {
    console.error("Error updating online status:", error);
  }

  // ------------------------------------------------
  // JOIN CONVERSATION
  // ------------------------------------------------

  socket.on("join-conversation", async (conversationId, callback) => {
    try {
      if (!mongoose.isValidObjectId(conversationId)) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: "Invalid conversation ID",
          });
        }
        return;
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: "Conversation not found",
          });
        }
        return;
      }

      const isMember = conversation.participants.some(
        (participantId) => String(participantId) === userId,
      );

      if (!isMember) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: "Access denied",
          });
        }
        return;
      }

      await socket.join(String(conversationId));

      console.log(`User ${userId} joined conversation ${conversationId}`);

      if (typeof callback === "function") {
        callback({
          success: true,
          conversationId: String(conversationId),
        });
      }
    } catch (error) {
      console.error("Error joining conversation:", error);

      if (typeof callback === "function") {
        callback({
          success: false,
          message: "Failed to join conversation",
        });
      }
    }
  });

  // ------------------------------------------------
  // LEAVE CONVERSATION
  // ------------------------------------------------

  socket.on("leave-conversation", (conversationId) => {
    if (conversationId) {
      socket.leave(String(conversationId));

      console.log(`User ${userId} left conversation ${conversationId}`);
    }
  });

  // ------------------------------------------------
  // SEND MESSAGE - REAL-TIME BROADCAST
  // ------------------------------------------------

  socket.on("send-message", async (message) => {
    try {
      console.log("SEND EVENT RECEIVED:", message);

      const conversationId = String(
        message?.conversationId ||
          message?.conversation?._id ||
          message?.conversation ||
          "",
      );

      if (!conversationId) {
        console.log("Message or conversation ID is missing");
        return;
      }

      if (!mongoose.isValidObjectId(conversationId)) {
        console.log("Invalid conversation ID");
        return;
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        console.log("Conversation not found:", conversationId);
        return;
      }

      const isMember = conversation.participants.some(
        (participantId) => String(participantId) === userId,
      );

      if (!isMember) {
        console.log("Unauthorized message attempt:", userId);
        return;
      }

      // Confirm that this socket has joined the conversation room.
      const isInRoom = socket.rooms.has(conversationId);

      if (!isInRoom) {
        console.log(
          `Socket ${socket.id} has not joined room ${conversationId}`,
        );
        return;
      }

      const room = io.sockets.adapter.rooms.get(conversationId);

      console.log("Sockets in conversation room:", room ? [...room] : []);

      // Fetch the saved message and populate the sender.
      const savedMessage = await Message.findById(message._id).populate(
        "sender",
        "firstName lastName avatar",
      );

      if (!savedMessage) {
        console.log("Saved message not found:", message._id);
        return;
      }

      // Notify every participant, even if they aren't viewing this conversation.
      conversation.participants.forEach((participantId) => {
        io.to(String(participantId)).emit("receive-message", {
          ...savedMessage.toObject(),
          conversationId,
        });
      });

      console.log("Message broadcast completed:", conversationId);
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  });

  // ------------------------------------------------
  // TYPING INDICATOR
  // ------------------------------------------------

  socket.on("typing", async ({ conversationId } = {}) => {
    try {
      if (!conversationId) return;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) return;

      const isMember = conversation.participants.some(
        (participantId) => String(participantId) === userId,
      );

      if (!isMember) return;

      // Only broadcast typing to other sockets in the room.
      socket.to(String(conversationId)).emit("user-typing", {
        userId,
        conversationId: String(conversationId),
      });
    } catch (error) {
      console.error("Typing event error:", error);
    }
  });

  // ------------------------------------------------
  // MARK MESSAGES AS READ
  // ------------------------------------------------

  socket.on("mark-messages-read", async ({ conversationId } = {}) => {
    try {
      if (!conversationId) return;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) return;

      const isMember = conversation.participants.some(
        (participantId) => String(participantId) === userId,
      );

      if (!isMember) return;

      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          isRead: false,
        },
        {
          $set: { isRead: true },
        },
      );
      console.log("EMITTING MESSAGES READ:", {
        conversationId: String(conversationId),
        userId,
      });
      console.log("Sockets in conversation room:", [
        ...(io.sockets.adapter.rooms.get(String(conversationId)) || []),
      ]);
      io.to(String(conversationId)).emit("messages-read", {
        conversationId: String(conversationId),
        userId,
      });
      io.to(userId).emit("messages-read", {
        conversationId: String(conversationId),
        userId,
      });

      console.log("Read receipts updated:", conversationId);
    } catch (error) {
      console.error("Read receipt error:", error);
    }
  });

  // ------------------------------------------------
  // DISCONNECT AND ONLINE PRESENCE
  // ------------------------------------------------

  socket.on("disconnect", async () => {
    try {
      // The socket is automatically removed from its rooms
      // before the disconnect event is handled.
      const userRoom = io.sockets.adapter.rooms.get(userId);
      const remainingSockets = userRoom ? userRoom.size : 0;

      // Only mark offline when the user's final tab disconnects.
      if (remainingSockets === 0) {
        const user = await User.findById(userId);

        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }

        io.emit("user-disconnected", {
          userId,
          isOnline: false,
        });

        console.log("User went offline:", userId);
      } else {
        console.log(
          `User ${userId} still has ${remainingSockets} connected socket(s)`,
        );
      }
    } catch (error) {
      console.error("Error updating user presence:", error);
    }
  });
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// DATABASE AND SERVER STARTUP
// --------------------------------------------------

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the environment");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the environment");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Syncly server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

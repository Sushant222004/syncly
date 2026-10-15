import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  const { user, setUser, loading, updateProfilePicture } =
    useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousConversationRef = useRef(null);
  const [typingUserId, setTypingUserId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const selectedConversationRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const messageEndRef = useRef(null);
  const avatarInputRef = useRef(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);
  useEffect(() => {
    if (!user) return;
    const socket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("authToken"),
      },
    });

    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      const conversationId = selectedConversationRef.current?._id;

      if (conversationId) {
        socket.emit("join-conversation", conversationId, (result) => {
          console.log("Conversation join result:", result);
        });
      }
    });
    socket.on("receive-message", (message) => {
      console.log("Received message:", message);
      console.log("Sender details:", message.sender);
      console.log("Sender ID:", message.sender?._id || message.sender);

      const incomingConversationId =
        message.conversationId ||
        message.conversation?._id ||
        message.conversation;

      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          String(conversation._id) === String(incomingConversationId)
            ? { ...conversation, lastMessage: message }
            : conversation,
        );
        const index = updated.findIndex(
          (conversation) =>
            String(conversation._id) === String(incomingConversationId),
        );

        if (index === -1) return updated;

        const [conversation] = updated.splice(index, 1);
        return [conversation, ...updated];
      });
      if (
        String(incomingConversationId) !==
        String(selectedConversationRef.current?._id)
      ) {
        return;
      }
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (existingMessage) =>
            String(existingMessage._id) === String(message._id),
        );

        if (alreadyExists) return prev;

        return [...prev, message];
      });
      console.log("Incoming conversation ID:", incomingConversationId);

      const currentUserId = String(user._id);
      const senderId = String(message.sender?._id || message.sender);

      if (senderId !== currentUserId) {
        socket.emit("mark-messages-read", {
          conversationId: String(incomingConversationId),
        });
      }
    });

    socketRef.current.on("user-typing", ({ userId }) => {
      console.log("User is typing:", userId);
      setTypingUserId(userId);

      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUserId(null);
      }, 1000);
    });

    socketRef.current.on("messages-read", ({ conversationId, userId }) => {
      console.log("MESSAGES READ EVENT:", conversationId, userId);

      setMessages((prev) => {
        console.log("Messages before read update:", prev);
        return prev.map((message) => {
          const messageConversationId =
            message.conversation?._id ||
            message.conversation ||
            message.conversationId;

          const isSameConversation =
            String(messageConversationId) === String(conversationId);

          const isSentByOtherUser =
            String(message.sender?._id || message.sender) !== String(userId);

          if (isSameConversation && isSentByOtherUser) {
            return { ...message, isRead: true };
          }

          return message;
        });
      });
    });

    setMessages((prev) =>
      prev.map((message) => {
        const messageConversationId =
          message.conversation?._id ||
          message.conversation ||
          message.conversationId;

        const isSameConversation =
          String(messageConversationId) === String(conversationId);

        const isSentByOtherUser =
          String(message.sender?._id || message.sender) !== String(userId);

        if (isSameConversation && isSentByOtherUser) {
          return { ...message, isRead: true };
        }

        return message;
      }),
    );

    const updateUserPresence = (userId, isOnline) => {
      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: conversation.participants.map((participant) =>
            String(participant._id) === String(userId)
              ? { ...participant, isOnline }
              : participant,
          ),
        })),
      );

      setSelectedConversation((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((participant) =>
            String(participant._id) === String(userId)
              ? { ...participant, isOnline }
              : participant,
          ),
        };
      });
    };

    socket.on("user-connected", ({ userId, isOnline }) => {
      updateUserPresence(userId, isOnline);
    });

    socket.on("user-disconnected", ({ userId, isOnline }) => {
      updateUserPresence(userId, isOnline);
    });
    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, selectedConversation]);

  const handleImageUpload = async () => {
    if (!selectedImage || !selectedConversation) {
      return;
    }

    const token = localStorage.getItem("authToken");
    const formData = new FormData();

    formData.append("image", selectedImage);
    formData.append("conversationId", selectedConversation._id);

    setUploading(true);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Image upload failed");
      }

      const savedMessage = result.data;

      socketRef.current?.emit("send-message", {
        ...savedMessage,
        conversationId: selectedConversation._id,
      });

      setSelectedImage(null);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(error.message || "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  const fetchConversations = async () => {
    const token = localStorage.getItem("authToken");
    setLoadingState(true);

    try {
      const response = await fetch("http://localhost:5000/api/conversations", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch conversations");
      }

      setConversations(result.data);
      return result.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    fetchConversations().catch(() => {});
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch users");
      }

      setUsers(result.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const startDirectChat = async (person) => {
    try {
      setCreatingConversation(true);

      const token = localStorage.getItem("authToken");

      const response = await fetch(
        "http://localhost:5000/api/conversations/direct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: person._id,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to start conversation");
      }

      const conversationId = result.data._id;

      setShowNewChatModal(false);
      setUserSearch("");

      // Refresh the conversation list.
      const updatedConversations = await fetchConversations();

      const conversation = updatedConversations.find(
        (item) => String(item._id) === String(conversationId),
      );

      if (!conversation) {
        throw new Error("Conversation was created but could not be loaded");
      }

      setSelectedConversation(conversation);
    } catch (error) {
      console.error("Error starting direct chat:", error);
      alert(error.message || "Could not start conversation");
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleOpenNewChat = async () => {
    setUserSearch("");
    setShowNewChatModal(true);
    await fetchUsers();
  };

  useEffect(() => {
    async function getConversation() {
      if (!selectedConversation) return;

      const token = localStorage.getItem("authToken");

      const previousConversationId = previousConversationRef.current;
      const currentConversationId = selectedConversation._id;

      // Leave the previous room
      if (previousConversationId) {
        socketRef.current.emit("leave-conversation", previousConversationId);
      }

      // Join the new room
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "join-conversation",
          currentConversationId,
          (result) => {
            console.log("Conversation join result:", result);
          },
        );
      } else {
        console.log("Socket is not connected yet");
      }
      console.log("Joining conversation room:", currentConversationId);
      console.log("Socket connected:", socketRef.current?.connected);
      socketRef.current.emit("mark-messages-read", {
        conversationId: currentConversationId,
      });

      // Remember the current room
      previousConversationRef.current = currentConversationId;

      setLoadingState(true);

      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/messages/${currentConversationId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (response.ok) {
          setMessages((prev) =>
            result.data.map((fetchedMessage) => {
              const existingMessage = prev.find(
                (message) => String(message._id) === String(fetchedMessage._id),
              );

              return existingMessage?.isRead
                ? { ...fetchedMessage, isRead: true }
                : fetchedMessage;
            }),
          );
        }
      } finally {
        setLoadingState(false);
      }
    }

    getConversation();
  }, [selectedConversation]);
  const otherUser =
    selectedConversation?.type === "direct"
      ? selectedConversation.participants.find(
          (participant) => participant._id !== user._id,
        )
      : null;
  const typingUser = selectedConversation?.participants.find(
    (participant) => participant._id === typingUserId,
  );

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) {
      return;
    }

    const token = localStorage.getItem("authToken");

    const response = await fetch("http://localhost:5000/api/auth/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: selectedConversation._id,
        content: messageInput,
      }),
    });

    const result = await response.json();

    console.log(result);

    socketRef.current.emit("send-message", result.data);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation._id === selectedConversation._id
          ? {
              ...conversation,
              lastMessage: result.data,
            }
          : conversation,
      ),
    );
    setMessageInput("");
  };

  const generateSuggestions = async () => {
    if (!selectedConversation || messages.length === 0) {
      return;
    }

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const token = localStorage.getItem("authToken");

      const conversationText = messages
        .filter((message) => message.content)
        .slice(-10)
        .map((message) => {
          const sender =
            String(message.sender?._id || message.sender) === String(user._id)
              ? "Me"
              : "Other person";

          return `${sender}: ${message.content}`;
        })
        .join("\n");

      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Based on this conversation, suggest exactly 3 short, natural replies I could send to the latest message from the other person.

Conversation:
${conversationText}

Return only a JSON array of 3 strings, with no markdown or additional text.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate suggestions.");
      }

      const parsedSuggestions = JSON.parse(data.reply);

      if (
        Array.isArray(parsedSuggestions) &&
        parsedSuggestions.length === 3 &&
        parsedSuggestions.every((item) => typeof item === "string")
      ) {
        setSuggestions(parsedSuggestions);
      } else {
        throw new Error("The AI returned an unexpected response.");
      }
    } catch (error) {
      console.error("Suggestion generation error:", error);
      alert(error.message || "Could not generate suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateSummary = async () => {
    if (!selectedConversation || messages.length === 0) {
      return;
    }

    setLoadingSummary(true);
    setSummary("");

    try {
      const token = localStorage.getItem("authToken");

      const conversationText = messages
        .filter((message) => message.content)
        .map((message) => {
          const sender =
            String(message.sender?._id || message.sender) === String(user._id)
              ? "Me"
              : "Other person";

          return `${sender}: ${message.content}`;
        })
        .join("\n");

      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Summarize this conversation in 3-5 concise bullet points. Include the main topics, important decisions, and any pending actions.

IMPORTANT FORMATTING RULES:
- Use plain text only.
- Do not use Markdown formatting.
- Do not use asterisks (*), bold text, or decorative separators.
- Put each point on a new line, starting with a simple hyphen (-).

Conversation:
${conversationText}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate summary.");
      }

      setSummary(data.reply);
    } catch (error) {
      console.error("Summary generation error:", error);
      alert(error.message || "Could not generate the summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    async function fetchUsers() {
      if (!user) return;

      const token = localStorage.getItem("authToken");

      try {
        const response = await fetch("http://localhost:5000/api/auth/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    fetchUsers();
  }, [user]);

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Enter a group name");
      return;
    }

    if (groupParticipants.length < 2) {
      alert("Select at least 2 members");
      return;
    }

    const token = localStorage.getItem("authToken");

    const response = await fetch(
      "http://localhost:5000/api/auth/conversations/group",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          participants: groupParticipants,
        }),
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log("Group created:", result.data);

      setConversations((prev) => [result.data, ...prev]);
      setSelectedConversation(result.data);

      setGroupName("");
      setGroupParticipants([]);
      setShowGroupModal(false);
    } else {
      console.error(result.message);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      await updateProfilePicture(file);
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      alert(error.message || "Could not update profile picture.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-100">
      {showConversations && (
        <button
          type="button"
          aria-label="Close conversation list"
          onClick={() => setShowConversations(false)}
          className="fixed inset-0 z-20 bg-slate-950/30 md:hidden"
        />
      )}
      {/* Conversation list */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[min(85vw,20rem)] flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-auto md:w-80 md:translate-x-0 ${
          showConversations ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Hidden profile picture input */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Sidebar header */}
        {/* Sidebar Header */}
        <div className="shrink-0 border-b border-slate-200 px-4 py-4">
          {/* Top row: Profile and app name */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              title="Change profile picture"
              aria-label="Change profile picture"
              className="shrink-0 rounded-full outline-none transition hover:ring-4 hover:ring-indigo-100"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Your profile"
                  className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {(user?.firstName?.[0] || "?").toUpperCase()}
                </span>
              )}
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">
                Syncly
              </h1>
              <p className="text-sm text-slate-500">Messages</p>
            </div>
          </div>
          {/* Bottom row: Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-2 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <span className="text-lg leading-none text-indigo-600">+</span>
              New group
            </button>

            <button
              type="button"
              onClick={handleOpenNewChat}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-2 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <span className="text-lg leading-none">+</span>
              New Chat
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/ai-assistant")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <span>🤖</span>
            AI Chatbot
          </button>
        </div>

        {/* Recent conversations */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent chats
          </p>

          {conversations.map((conversation) => {
            const isGroup = conversation.type === "group";

            const otherParticipant = conversation.participants?.find(
              (participant) => String(participant._id) !== String(user?._id),
            );

            const title = isGroup
              ? conversation.name
              : `${otherParticipant?.firstName || "Unknown"} ${
                  otherParticipant?.lastName || ""
                }`.trim();

            const active =
              String(selectedConversation?._id) === String(conversation._id);

            return (
              <button
                key={conversation._id}
                type="button"
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowConversations(false);
                }}
                className={`group mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition duration-150 hover:-translate-y-px hover:shadow-sm ${
                  active
                    ? "border-indigo-200 bg-indigo-50 shadow-sm"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                {/* Conversation avatar */}
                <span
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isGroup
                      ? "bg-violet-100 text-violet-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {isGroup
                    ? "♧"
                    : (otherParticipant?.firstName?.[0] || "?").toUpperCase()}

                  {!isGroup && otherParticipant?.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </span>

                {/* Conversation details */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-sm font-semibold ${
                        active ? "text-indigo-950" : "text-slate-800"
                      }`}
                    >
                      {title}
                    </span>

                    {active && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </span>

                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {conversation.lastMessage?.content ||
                      (isGroup ? "Group conversation" : "No messages yet")}
                  </span>
                </span>
              </button>
            );
          })}

          {/* Empty state */}
          {conversations.length === 0 && !loadingState && (
            <div className="mx-2 mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No conversations yet
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Start a group or choose someone to begin chatting.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <button
            type="button"
            aria-label="Open conversations"
            onClick={() => setShowConversations(true)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden"
          >
            Chats
          </button>
          <div className="flex min-w-0 items-center gap-3">
            {selectedConversation && (
              <img
                src={
                  selectedConversation.type === "group"
                    ? selectedConversation.avatar || "/default-avatar.png"
                    : otherUser?.avatar || "/default-avatar.png"
                }
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
              />
            )}

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-900">
                {selectedConversation?.type === "group"
                  ? selectedConversation.name
                  : otherUser
                    ? `${otherUser.firstName} ${otherUser.lastName}`
                    : "Select a conversation"}
              </h2>

              {selectedConversation && (
                <>
                  <p className="text-xs text-slate-500">
                    {otherUser?.isOnline ? "Online" : "Offline"}
                  </p>

                  {typingUser && (
                    <p className="text-xs text-slate-400">
                      {typingUser.firstName} {typingUser.lastName} is typing...
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 sm:p-4">
          {selectedConversation ? (
            messages.map((message) => {
              const isMine =
                String(message.sender?._id || message.sender) ===
                String(user._id);
              return (
                <div
                  key={message._id}
                  className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] break-words rounded-2xl px-3 py-2 sm:max-w-[75%] sm:px-4 ${
                      isMine
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    {selectedConversation.type === "group" && !isMine && (
                      <p className="mb-1 text-xs font-semibold text-slate-500">
                        {message.sender?.firstName || "Unknown sender"}{" "}
                        {message.sender?.lastName || ""}
                      </p>
                    )}
                    <div>
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}

                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Shared image"
                          className="mt-2 max-h-64 max-w-full rounded-lg object-contain"
                          loading="lazy"
                        />
                      )}

                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isMine ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                    {isMine && message.isRead && (
                      <div className="text-xs opacity-70 mt-1">Read</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-500">
              Select a conversation to start chatting
            </p>
          )}
          <div ref={messageEndRef} />
        </div>

        {selectedConversation && (
          <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
            <button
              type="button"
              onClick={generateSuggestions}
              disabled={loadingSuggestions || messages.length === 0}
              className="mb-3 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              {loadingSuggestions
                ? "Generating suggestions..."
                : "✨ Suggest Replies"}
            </button>
            <button
              type="button"
              onClick={generateSummary}
              disabled={loadingSummary || messages.length === 0}
              className="mb-3 ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              {loadingSummary ? "Summarizing..." : "📝 Summarize Conversation"}
            </button>

            {summary && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-800">
                  📝 Conversation Summary
                </h3>

                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {summary}
                </p>

                <button
                  type="button"
                  onClick={() => setSummary("")}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMessageInput(suggestion)}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-slate-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);

                  if (selectedConversation) {
                    socketRef.current.emit("typing", {
                      conversationId: selectedConversation._id,
                    });
                  }
                }}
                placeholder="Type a message..."
                className="min-w-0 flex-1 basis-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:basis-auto sm:px-4"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setSelectedImage(e.target.files?.[0] || null)
                  }
                  className="min-w-0 max-w-full flex-1 text-xs text-slate-600 sm:text-sm"
                />

                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={
                    !selectedImage || uploading || !selectedConversation
                  }
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                >
                  {uploading ? "Uploading..." : "Send Image"}
                </button>
              </div>
              <button
                onClick={sendMessage}
                className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {showGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGroupModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            className="max-h-[90dvh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="create-group-title" className="text-lg font-semibold">
                    Create a group
                  </h2>
                  <p className="mt-1 text-sm text-indigo-100">
                    Give it a name and choose at least two members.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close create group dialog"
                  onClick={() => setShowGroupModal(false)}
                  className="rounded-lg px-2 py-1 text-xl leading-none text-white/90 transition hover:bg-white/15"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="group-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Group name
                </label>
                <input
                  id="group-name"
                  type="text"
                  placeholder="e.g. Weekend plans"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">
                    Add members
                  </p>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    {groupParticipants.length} selected
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {users
                    .filter((item) => String(item._id) !== String(user?._id))
                    .map((item) => (
                      <label
                        key={item._id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition hover:bg-indigo-50"
                      >
                        <input
                          type="checkbox"
                          checked={groupParticipants.includes(item._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupParticipants((prev) => [
                                ...prev,
                                item._id,
                              ]);
                            } else {
                              setGroupParticipants((prev) =>
                                prev.filter((id) => id !== item._id),
                              );
                            }
                          }}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-semibold text-indigo-700">
                          {(item.firstName?.[0] || "?").toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                          {item.firstName} {item.lastName}
                        </span>
                      </label>
                    ))}
                  {users.filter(
                    (item) => String(item._id) !== String(user?._id),
                  ).length === 0 && (
                    <p className="p-4 text-center text-sm text-slate-500">
                      No other members available yet.
                    </p>
                  )}
                </div>
                {groupParticipants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setGroupParticipants([])}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createGroup}
                  disabled={!groupName.trim() || groupParticipants.length < 2}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Create group
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewChatModal(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-chat-title"
            className="max-h-[85dvh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id="new-chat-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  New Chat
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Find someone to start a conversation with.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close new chat"
                onClick={() => setShowNewChatModal(false)}
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search people by name..."
                autoFocus
                className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <div className="max-h-72 space-y-1 overflow-y-auto">
                {loadingState ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Loading people...
                  </p>
                ) : (
                  users
                    .filter((person) => {
                      const fullName = `${person.firstName || ""} ${person.lastName || ""}`;

                      return fullName
                        .toLowerCase()
                        .includes(userSearch.trim().toLowerCase());
                    })
                    .filter(
                      (person) => String(person._id) !== String(user?._id),
                    )
                    .map((person) => (
                      <button
                        type="button"
                        key={person._id}
                        onClick={() => startDirectChat(person)}
                        disabled={creatingConversation}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {(person.firstName?.[0] || "?").toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {person.email}
                          </p>
                        </div>
                      </button>
                    ))
                )}

                {!loadingState &&
                  users.filter((person) => {
                    const fullName = `${person.firstName || ""} ${person.lastName || ""}`;

                    return (
                      String(person._id) !== String(user?._id) &&
                      fullName
                        .toLowerCase()
                        .includes(userSearch.trim().toLowerCase())
                    );
                  }).length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-500">
                      No people found.
                    </p>
                  )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Chat;

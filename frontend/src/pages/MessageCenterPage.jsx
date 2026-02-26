import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useToast } from "../hooks/useToast";
import Toast from "../components/ui/Toast";

function MessageCenterPage({ onNavigate, conversationId }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const markedAsReadRef = useRef(new Set()); // Track which conversations have been marked as read
  const textareaRef = useRef(null); // Reference to textarea for height reset
  const messagesContainerRef = useRef(null); // Reference to messages container for scrolling

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // If conversationId is provided, fetch and select that conversation
  useEffect(() => {
    if (!conversationId) return;

    if (conversations.length > 0) {
      const conversation = conversations.find((c) => c._id === conversationId);
      if (
        conversation &&
        (!selectedConversation || selectedConversation._id !== conversationId)
      ) {
        setSelectedConversation(conversation);
      } else if (!conversation) {
        // Conversation not in list, fetch it directly
        fetchSingleConversation(conversationId);
      }
    }
  }, [conversationId, conversations.length]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);

      // Only mark as read if we haven't already done so for this conversation
      if (!markedAsReadRef.current.has(selectedConversation._id)) {
        markConversationAsRead(selectedConversation._id);
        markedAsReadRef.current.add(selectedConversation._id);
      }
    } else {
      setMessages([]);
    }
  }, [selectedConversation?._id]); // Only depend on the ID, not the whole object

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      showError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleConversation = async (id) => {
    try {
      setLoadingConversation(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        const conversation = data.data.conversation;
        setSelectedConversation(conversation);
        // Add to conversations list if not already there
        if (!conversations.find((c) => c._id === id)) {
          setConversations((prev) => [conversation, ...prev]);
        }
      } else {
        showError(data.message || "Failed to load conversation");
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      showError("Failed to load conversation");
    } finally {
      setLoadingConversation(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${convId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      showError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const markConversationAsRead = async (convId) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${convId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Update local state to remove unread indicator
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      // Don't show error to user, this is a background operation
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${selectedConversation._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: messageInput.trim() }),
        },
      );

      const data = await response.json();
      if (data.success) {
        // Add message to list
        setMessages((prev) => [...prev, data.data.message]);
        // Clear input
        setMessageInput("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    content: messageInput.trim(),
                    timestamp: new Date(),
                    senderId: user._id || user.id || user.userId,
                  },
                  updatedAt: new Date(),
                }
              : c,
          ),
        );
      } else {
        showError(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Header
        user={user}
        onNavigate={onNavigate}
        onLogout={handleLogout}
        currentPage="messages"
      />

      <main className="flex-1 py-8 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
            <p className="text-slate-400">
              Communicate with employers about your applications
            </p>
          </div>

          {/* Message Center Content */}
          <div className="bg-dark-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversation List */}
              <div className="w-1/3 border-r border-slate-800 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Conversations
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="mt-4 text-slate-400">
                        No conversations yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Start a conversation from your applications
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation._id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?._id === conversation._id
                              ? "bg-primary-500/20 border border-primary-500/50"
                              : "hover:bg-dark-800"
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation);
                            onNavigate(`messages/${conversation._id}`);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {conversation.otherParticipant?.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {conversation.jobTitle}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-500 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage?.content && (
                            <p className="mt-1 text-xs text-slate-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Display */}
              <div className="flex-1 flex flex-col">
                {loadingConversation ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-slate-400">Loading conversation...</p>
                    </div>
                  </div>
                ) : selectedConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className="p-4 border-b border-slate-800">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedConversation.otherParticipant?.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {selectedConversation.jobTitle}
                      </p>
                    </div>

                    {/* Messages */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 bg-dark-950"
                    >
                      {loadingMessages ? (
                        <div className="text-center py-12">
                          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-400">
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((message, index) => {
                            // Handle both populated and non-populated senderId
                            const messageSenderId =
                              typeof message.senderId === "object"
                                ? message.senderId._id
                                : message.senderId;

                            // Get current user ID (try multiple possible fields)
                            const currentUserId =
                              user._id || user.id || user.userId;

                            // Ensure both IDs are strings for comparison
                            const isOwnMessage =
                              String(messageSenderId) === String(currentUserId);

                            // Get sender name
                            const senderName =
                              typeof message.senderId === "object"
                                ? `${message.senderId.firstName || ""} ${message.senderId.lastName || ""}`.trim()
                                : isOwnMessage
                                  ? "You"
                                  : selectedConversation.otherParticipant
                                      ?.name || "Unknown";

                            // Check if we should show the sender name (first message or different sender from previous)
                            const showSenderName =
                              !isOwnMessage &&
                              (index === 0 ||
                                (typeof messages[index - 1].senderId ===
                                "object"
                                  ? messages[index - 1].senderId._id
                                  : messages[index - 1].senderId) !==
                                  messageSenderId);

                            return (
                              <div
                                key={message._id}
                                className={`flex items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                              >
                                {/* Avatar */}
                                {!isOwnMessage && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {senderName.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                  className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}
                                >
                                  {showSenderName && (
                                    <span className="text-xs text-slate-500 mb-1 px-3">
                                      {senderName}
                                    </span>
                                  )}
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      isOwnMessage
                                        ? "bg-primary-500 text-white rounded-br-sm"
                                        : "bg-dark-800 text-slate-100 rounded-bl-sm"
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {message.content}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-xs mt-1 px-3 ${
                                      isOwnMessage
                                        ? "text-slate-500"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                </div>

                                {/* Spacer for own messages to balance layout */}
                                {isOwnMessage && (
                                  <div className="flex-shrink-0 w-8"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-slate-800 bg-dark-900">
                      <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                          <textarea
                            ref={textareaRef}
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => {
                              setMessageInput(e.target.value);
                              // Auto-resize textarea
                              e.target.style.height = "auto";
                              e.target.style.height =
                                Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                            onKeyPress={handleKeyPress}
                            disabled={sending}
                            rows={1}
                            className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none max-h-[120px] overflow-y-auto"
                            style={{ minHeight: "44px" }}
                          />
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sending}
                          className="flex-shrink-0 w-11 h-11 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
                        >
                          {sending ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="mt-4 text-slate-400">
                        Select a conversation to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

export default MessageCenterPage;

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  MessageCircle,
  Send,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function DeanTopbarLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const [showProfileSettingsModal, setShowProfileSettingsModal] =
    useState(false);
  const [showPrivacySettingsModal, setShowPrivacySettingsModal] =
    useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);
  const [showDeviceSessionsModal, setShowDeviceSessionsModal] =
    useState(false);

  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedConversationUserId, setSelectedConversationUserId] =
    useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const [messageForm, setMessageForm] = useState({
    to: "",
    subject: "",
    message: "",
  });

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    primaryEmail: "",
    alternateEmail: "",
    contactNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const isActive = (path) => location.pathname === path;

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    setCurrentUserId(userData.user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    setProfileForm({
      firstName: data?.first_name || "",
      middleName: data?.middle_name || "",
      lastName: data?.last_name || "",
      primaryEmail: userData.user.email || "",
      alternateEmail: data?.alternate_email || "",
      contactNumber: data?.contact_number || "",
    });
  };

  const fetchUsers = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .neq("id", userData.user.id)
      .order("full_name", { ascending: true });

    if (!error) setUsers(data || []);
  };

  const fetchMessages = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    setCurrentUserId(userData.user.id);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`receiver_id.eq.${userData.user.id},sender_id.eq.${userData.user.id}`)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
  };

  const fetchNotifications = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
    fetchUsers();
    fetchMessages();
    fetchNotifications();
  }, []);

  const unreadMessages = messages.filter(
    (msg) => !msg.is_read && msg.receiver_id === currentUserId
  ).length;

  const unreadNotifications = notifications.filter(
    (notif) => !notif.is_read
  ).length;

  const getUserById = (id) => {
    return users.find((user) => user.id === id);
  };

  const conversations = messages.reduce((acc, msg) => {
    const otherUserId =
      msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;

    const otherUser = getUserById(otherUserId);

    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        userId: otherUserId,
        fullName: otherUser?.full_name || "Unknown User",
        role: otherUser?.role || "",
        messages: [],
        lastMessage: msg,
      };
    }

    acc[otherUserId].messages.push(msg);
    acc[otherUserId].lastMessage = msg;

    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort(
    (a, b) =>
      new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
  );

  const selectedConversation = selectedConversationUserId
    ? conversations[selectedConversationUserId]
    : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    if (!messageForm.to) {
      alert("Please select a user.");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: userData.user.id,
      receiver_id: messageForm.to,
      subject: messageForm.subject,
      message: messageForm.message,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Message sent successfully.");

    setSelectedConversationUserId(messageForm.to);

    setMessageForm({
      to: "",
      subject: "",
      message: "",
    });

    setShowNewMessageModal(false);
    fetchMessages();
  };

  const handleSendReply = async (e) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    if (!selectedConversationUserId) {
      alert("No conversation selected.");
      return;
    }

    if (!replyMessage.trim()) {
      alert("Please type a message.");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: userData.user.id,
      receiver_id: selectedConversationUserId,
      subject: "Reply",
      message: replyMessage.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setReplyMessage("");
    fetchMessages();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        alternate_email: profileForm.alternateEmail,
        contact_number: profileForm.contactNumber,
      })
      .eq("id", userData.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile changes saved.");
    setShowProfileSettingsModal(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully.");

    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
    });

    setShowChangePasswordModal(false);
  };

  const markNotificationsAsRead = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userData.user.id);

    fetchNotifications();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 z-40 h-[80px] bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Smart Proctoring
            </h1>
            <p className="text-xs text-gray-500">Dean Portal</p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dean/dashboard"
              className={`px-4 py-2 rounded-2xl font-semibold ${
                isActive("/dean/dashboard")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/dean/approvals"
              className={`px-4 py-2 rounded-2xl font-semibold ${
                isActive("/dean/approvals")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Exam Approvals
            </Link>

            <Link
              to="/dean/reports"
              className={`px-4 py-2 rounded-2xl font-semibold ${
                isActive("/dean/reports")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Reports
            </Link>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setShowMessages(!showMessages);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                  setSelectedConversationUserId("");
                  setReplyMessage("");
                  fetchMessages();
                }}
                className="relative bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:bg-gray-100 transition"
              >
                <MessageCircle className="w-5 h-5 text-gray-700" />

                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {showMessages && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Messages</h3>

                    <button
                      onClick={() => setShowNewMessageModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
                    >
                      New Message
                    </button>
                  </div>

                  {!selectedConversationUserId ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {conversationList.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="font-bold text-gray-900">
                            No conversations yet
                          </p>
                          <p className="text-sm text-gray-500">
                            Users with conversation will appear here.
                          </p>
                        </div>
                      ) : (
                        conversationList.map((convo) => (
                          <button
                            key={convo.userId}
                            onClick={() => {
                              setSelectedConversationUserId(convo.userId);
                              setReplyMessage("");
                            }}
                            className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition"
                          >
                            <p className="font-bold text-gray-900 truncate">
                              {convo.fullName}
                            </p>

                            <p className="text-xs text-gray-500">
                              {convo.role}
                            </p>

                            <p className="text-sm text-gray-600 truncate mt-2">
                              {convo.lastMessage.sender_id === currentUserId
                                ? "You: "
                                : ""}
                              {convo.lastMessage.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <div>
                          <p className="font-bold text-gray-900">
                            {selectedConversation?.fullName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {selectedConversation?.role}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedConversationUserId("");
                            setReplyMessage("");
                          }}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Back
                        </button>
                      </div>

                      <div className="max-h-[280px] overflow-y-auto space-y-3 pr-2">
                        {selectedConversation?.messages.map((msg) => {
                          const isMine = msg.sender_id === currentUserId;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl p-3 ${
                                  isMine
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {msg.subject && msg.subject !== "Reply" && (
                                  <p className="font-bold text-sm mb-1">
                                    {msg.subject}
                                  </p>
                                )}

                                <p className="text-sm whitespace-pre-wrap">
                                  {msg.message}
                                </p>

                                <p
                                  className={`text-[10px] mt-2 ${
                                    isMine ? "text-blue-100" : "text-gray-400"
                                  }`}
                                >
                                  {msg.created_at
                                    ? new Date(msg.created_at).toLocaleString()
                                    : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <form
                        onSubmit={handleSendReply}
                        className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3"
                      >
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />

                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMessages(false);
                  setShowProfileMenu(false);
                  markNotificationsAsRead();
                }}
                className="relative bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:bg-gray-100 transition"
              >
                <Bell className="w-5 h-5 text-gray-700" />

                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-5">
                  <h3 className="font-bold text-lg mb-4">Notifications</h3>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="font-bold text-gray-900">
                          No notifications yet
                        </p>
                        <p className="text-sm text-gray-500">
                          System notifications will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                        >
                          <p className="font-bold text-gray-900">
                            {notif.title}
                          </p>

                          <p className="text-sm text-gray-700 mt-2">
                            {notif.message}
                          </p>

                          <p className="text-xs text-gray-400 mt-3">
                            {notif.created_at
                              ? new Date(notif.created_at).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowMessages(false);
                  setShowNotifications(false);
                }}
                className="w-12 h-12 rounded-full border border-gray-200 shadow-sm bg-white flex items-center justify-center hover:bg-gray-100 transition"
              >
                <User className="w-6 h-6 text-gray-700" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-3">
                  <button
                    onClick={() => {
                      setShowProfileSettingsModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 text-gray-700 font-semibold"
                  >
                    <Settings className="w-5 h-5" />
                    Profile Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowPrivacySettingsModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 text-gray-700 font-semibold"
                  >
                    <Shield className="w-5 h-5" />
                    Security and Privacy
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-red-600 font-semibold"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>

      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">New Message</h3>

              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <select
                value={messageForm.to}
                onChange={(e) =>
                  setMessageForm({
                    ...messageForm,
                    to: e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-4 py-3"
                required
              >
                <option value="">Select User</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </option>
                ))}
              </select>

              <input
                value={messageForm.subject}
                onChange={(e) =>
                  setMessageForm({
                    ...messageForm,
                    subject: e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Message subject"
                required
              />

              <textarea
                value={messageForm.message}
                onChange={(e) =>
                  setMessageForm({
                    ...messageForm,
                    message: e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-4 py-3 min-h-32"
                placeholder="Write your message..."
                required
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="px-5 py-3 rounded-2xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>

                <button className="px-5 py-3 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileSettingsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Profile Settings</h3>

              <button
                onClick={() => setShowProfileSettingsModal(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input
                value={profileForm.firstName}
                disabled
                placeholder="First Name"
                className="w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
              />

              <input
                value={profileForm.middleName}
                disabled
                placeholder="Middle Name"
                className="w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
              />

              <input
                value={profileForm.lastName}
                disabled
                placeholder="Last Name"
                className="w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
              />

              <input
                value={profileForm.primaryEmail}
                disabled
                placeholder="Primary Email"
                className="w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
              />

              <input
                value={profileForm.alternateEmail}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    alternateEmail: e.target.value,
                  })
                }
                placeholder="Alternate Email"
                className="w-full border rounded-2xl px-4 py-3"
              />

              <input
                value={profileForm.contactNumber}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    contactNumber: e.target.value,
                  })
                }
                placeholder="Contact Number"
                className="w-full border rounded-2xl px-4 py-3"
              />

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {showPrivacySettingsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Security and Privacy</h3>

              <button
                onClick={() => setShowPrivacySettingsModal(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setShowPrivacySettingsModal(false);
                  setShowChangePasswordModal(true);
                }}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-5 flex items-center justify-between transition"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Change Password
                  </p>
                  <p className="text-sm text-gray-500">
                    Update your account password securely.
                  </p>
                </div>

                <span className="text-2xl text-gray-400">›</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPrivacySettingsModal(false);
                  setShowDeviceSessionsModal(true);
                }}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-5 flex items-center justify-between transition"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Device Sessions
                  </p>
                  <p className="text-sm text-gray-500">
                    Manage devices currently logged into your account.
                  </p>
                </div>

                <span className="text-2xl text-gray-400">›</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Change Password</h3>

              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-4 py-3"
                required
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-4 py-3"
                required
              />

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeviceSessionsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Device Sessions</h3>

              <button
                onClick={() => setShowDeviceSessionsModal(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-4">
              <p className="font-semibold text-gray-900">Current Device</p>
              <p className="text-sm text-gray-500">Current browser session</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-semibold"
            >
              Logout Current Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeanTopbarLayout;
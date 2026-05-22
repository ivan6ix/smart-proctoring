import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { supabase } from "../../lib/supabaseClient";

function MessagesPage() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    const { data: currentUser } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUser.user.id)
      .order("full_name", { ascending: true });

    if (!error) {
      setUsers(data || []);
    }
  };

  const fetchMessages = async () => {
    const { data: currentUser } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id (
          full_name,
          role
        )
      `)
      .eq("receiver_id", currentUser.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !message) {
      alert("Please complete all fields.");
      return;
    }

    const { data: currentUser } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.user.id,
        receiver_id: selectedUser,
        subject,
        message,
      });

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from("system_logs")
      .insert({
        user_id: currentUser.user.id,
        action: "Message Sent",
        description: "User sent a message.",
      });

    alert("Message sent successfully.");

    setSelectedUser("");
    setSubject("");
    setMessage("");

    fetchMessages();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    fetchMessages();
  }, []);

  return (
    <DashboardLayout role="Professor">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Messages</h2>

        <p className="text-gray-500">
          Send and receive messages from users.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-5">
            Send Message
          </h3>

          <div className="space-y-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
            >
              <option value="">Select User</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </option>
              ))}
            </select>

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Subject"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded-2xl px-4 py-4 min-h-[180px]"
              placeholder="Write your message..."
            />

            <button
              onClick={sendMessage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold"
            >
              Send Message
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-3xl shadow border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-5">
            Inbox
          </h3>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                No messages yet.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-50 border border-gray-100 rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-lg">
                        {msg.subject || "No Subject"}
                      </h4>

                      <p className="text-sm text-gray-500">
                        From: {msg.sender?.full_name} (
                        {msg.sender?.role})
                      </p>
                    </div>

                    {!msg.is_read && (
                      <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                    {msg.message}
                  </p>

                  <p className="text-xs text-gray-400 mt-4">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MessagesPage;
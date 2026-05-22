import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function Register() {
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_number: studentNumber,
          role: "student",
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.user) {
      await supabase.from("system_logs").insert({
        user_id: data.user.id,
        action: "Account Registered",
        description: "Student registered a new account.",
      });
    }

    alert("Account created. Please check your email for confirmation.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-gray-500 text-center mb-8">Register as a student</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Full Name"
          />

          <input
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Student Number"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Email Address"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Password"
          />

          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Confirm Password"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
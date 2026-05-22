import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          "http://localhost:5173/update-password",
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Password reset link sent to your email."
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold mb-2">
          Forgot Password
        </h2>

        <p className="text-gray-500 mb-6">
          Enter your registered email.
        </p>

        <form
          onSubmit={handleResetPassword}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border rounded-2xl px-4 py-3"
            required
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      setHasSession(!!data.session);
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) {
    return <div className="p-6">Checking session...</div>;
  }

  if (!hasSession) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";


function RoleProtectedRoute({ children, allowedRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data } = await supabase.auth.getUser();

      const user = data.user;

      if (user && user.user_metadata.role === allowedRole) {
        setAuthorized(true);
      }

      setLoading(false);
    };

    checkRole();
  }, [allowedRole]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default RoleProtectedRoute;
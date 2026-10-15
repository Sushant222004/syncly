import { createContext, useState, useEffect } from "react";
import API_URL from "../config";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  async function updateProfilePicture(file) {
    const token = localStorage.getItem("authToken");

    if (!token || !file) {
      throw new Error("Authentication or image is missing");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_URL}/api/me/avatar`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update profile picture");
    }

    setUser(result.data);

    return result.data;
  }

  function logout() {
    localStorage.removeItem("authToken");
    setUser(null);
  }

  async function getCurrentUser() {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Authenticated user:", result.data);
        setUser(result.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, getCurrentUser, loading , updateProfilePicture }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

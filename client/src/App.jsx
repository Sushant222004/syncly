import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import AIAssistant from "./pages/AIAssistant";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <AIAssistant />
          </ProtectedRoute>
        }
      />

      {/* Redirect unknown URLs to registration */}
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default App;
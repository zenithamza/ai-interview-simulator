import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Interview from "./pages/Interview.jsx";
import Report from "./pages/Report.jsx";
import History from "./pages/History.jsx";
import Login from "./pages/Login.jsx";
import SharedReport from "./pages/SharedReport.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-text-primary noise-overlay">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:shareId" element={<SharedReport />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

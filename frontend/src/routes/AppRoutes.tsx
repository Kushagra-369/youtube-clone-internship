import { Routes, Route } from "react-router-dom";
import ChannelPage from "../components/channel/channel_page";
import HomePage from "../components/home/HomePage";
import CommentsPage from "../components/comments/CommentsPage";
import PlayerPage from "../components/player/PlayerPage";
import DownloadsPage from "../components/downloads/DownloadsPage";
import SubscriptionPage from "../components/subscription/SubscriptionPage";
import Watchplan from "../components/watchplan/watchplan";
import ProtectedRoute from "../components/auth/ProtectedRoute";
const AppRoutes = () => {
  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* Video Player */}
      <Route
        path="/video/:id"
        element={<PlayerPage />}
      />

      {/* Comments (for testing) */}
      <Route
        path="/comments"
        element={<CommentsPage />}
      />
      <Route
        path="/downloads"
        element={
          <ProtectedRoute>
            <DownloadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/channel"
        element={
          <ProtectedRoute>
            <ChannelPage />
          </ProtectedRoute>
        }
      />
      <Route path="/premium" element={<SubscriptionPage />} />
      <Route path="/watch-plans" element={<Watchplan />} />
    </Routes>
  );
};

export default AppRoutes;
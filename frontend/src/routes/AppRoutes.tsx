import { Routes, Route } from "react-router-dom";

import HomePage from "../components/home/HomePage";
import CommentsPage from "../components/comments/CommentsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/comments" element={<CommentsPage />} />
    </Routes>
  );
};

export default AppRoutes;
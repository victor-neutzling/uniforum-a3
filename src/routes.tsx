import { BrowserRouter, Routes, Route } from "react-router";

import HomePage from "./pages/frontpage";
import CommunityPage from "./pages/community";
import PostPage from "./pages/post";
import LoginPage from "./pages/login";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/community/:communityId" element={<CommunityPage />} />
        <Route path="/post/:postId" element={<PostPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

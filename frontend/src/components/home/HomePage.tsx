import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVideos } from "../../services/video.service";
import type { Video } from "../../types/video.types";
import VideoCard from "../video/VideoCard";

const HomePage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await getVideos();
      setVideos(response.data);
    } catch (error) {
      console.error("Fetch Videos Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#272727]">
        <div className="flex items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center gap-1">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
            </svg>
            <span className="text-white text-xl font-semibold">YouTube</span>
          </Link>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 bg-[#121212] border border-[#303030] rounded-l-full text-white placeholder:text-[#aaaaaa] focus:outline-none focus:border-blue-500"
              />
              <button className="px-6 bg-[#222222] border border-[#303030] border-l-0 rounded-r-full hover:bg-[#272727]">
                <svg className="w-5 h-5 text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 bg-[#222222] text-[#3ea6ff] text-sm font-medium rounded-full hover:bg-[#272727] transition">
              Premium
            </button>
            <Link
              to="/downloads"
              className="px-4 py-1.5 bg-[#222222] text-white text-sm font-medium rounded-full hover:bg-[#272727] transition"
            >
              Downloads
            </Link>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-[#3ea6ff] text-black text-sm font-medium rounded-full hover:bg-[#65b8ff] transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Guest Banner */}
      <div className="fixed top-14 left-0 right-0 bg-[#181818] border-b border-[#272727] px-4 py-2.5 z-40">
        <p className="text-[#aaaaaa] text-xs text-center">
          Browse and watch videos as a guest. Sign in to comment, download videos, and access premium features.
        </p>
      </div>

      {/* Category Chips */}
      <div className="fixed top-27 left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-30">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
          {["All", "Music", "Gaming", "Live", "News", "Sports", "Movies", "Shows", "Learning"].map((category) => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition font-medium ${category === "All"
                  ? "bg-white text-black"
                  : "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-43 px-4 pb-8">
        <div className="max-w-500 mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
            </div>
          ) : videos.length === 0 ? (
            <p className="text-gray-400 text-center py-20">No videos found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
import { useEffect, useState } from "react";
import { getVideos } from "../../services/video.service";
import type { Video } from "../../types/video.types";
import VideoCard from "../video/VideoCard";

const HomePage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem("user") || "null")
  );

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
    
    // Listen for user changes (in case of logout from another component)
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">

      {/* Guest Banner - Only show when not logged in */}
      {!user && (
        <div className="fixed top-14 left-0 right-0 bg-[#181818] border-b border-[#272727] px-4 py-2.5 z-40">
          <p className="text-[#aaaaaa] text-xs text-center">
            Browse and watch videos as a guest. Sign in to comment, download videos, and access premium features.
          </p>
        </div>
      )}

      {/* Category Chips */}
      <div className={`fixed ${!user ? 'top-27' : 'top-14'} left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-30`}>
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
          {["All", "Music", "Gaming", "Live", "News", "Sports", "Movies", "Shows", "Learning"].map((category) => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition font-medium ${
                category === "All"
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
      <main className={`${!user ? 'pt-43' : 'pt-28'} px-4 pb-8`}>
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
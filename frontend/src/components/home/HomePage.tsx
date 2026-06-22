import { useEffect, useState } from "react";
import { getVideos } from "../../services/video.service";
import type { Video } from "../../types/video.types";
import VideoCard from "../video/VideoCard";
import { getThemeByLocationAndTime } from "../utils/theme";


const HomePage = () => {

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const theme = getThemeByLocationAndTime(user?.state || "");

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

  // Theme-based classes
  const isLight = theme === "light";
  const bgColor = isLight ? "bg-white" : "bg-[#0f0f0f]";
  const textColor = isLight ? "text-black" : "text-white";
  const borderColor = isLight ? "border-gray-200" : "border-[#272727]";
  const chipBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  const chipBgActive = isLight ? "bg-black" : "bg-white";
  const chipTextActive = isLight ? "text-white" : "text-black";
  const chipText = isLight ? "text-gray-800" : "text-white";
  const chipHover = isLight ? "hover:bg-gray-300" : "hover:bg-[#3a3a3a]";
  const bannerBg = isLight ? "bg-gray-100" : "bg-[#181818]";
  const bannerText = isLight ? "text-gray-700" : "text-[#aaaaaa]";
  const spinnerBorder = isLight ? "border-gray-300" : "border-white";
  const spinnerAccent = isLight ? "border-t-gray-600" : "border-t-transparent";
  const noVideosText = isLight ? "text-gray-600" : "text-gray-400";

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Guest Banner - Only show when not logged in */}
      {!user && (
        <div className={`fixed top-14 left-0 right-0 ${bannerBg} border-b ${borderColor} px-4 py-2.5 z-40`}>
          <p className={`${bannerText} text-xs text-center`}>
            Browse and watch videos as a guest. Sign in to comment, download videos, and access premium features.
          </p>
        </div>
      )}

      {/* Category Chips */}
      <div className={`fixed ${!user ? 'top-27' : 'top-14'} left-0 right-0 ${bgColor} border-b ${borderColor} z-30`}>
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
          {["All", "Music", "Gaming", "Live", "News", "Sports", "Movies", "Shows", "Learning"].map((category) => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition font-medium ${
                category === "All"
                  ? `${chipBgActive} ${chipTextActive}`
                  : `${chipBg} ${chipText} ${chipHover}`
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
              <div className={`animate-spin rounded-full h-10 w-10 border-3 ${spinnerBorder} ${spinnerAccent}`}></div>
            </div>
          ) : videos.length === 0 ? (
            <p className={`${noVideosText} text-center py-20`}>No videos found.</p>
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
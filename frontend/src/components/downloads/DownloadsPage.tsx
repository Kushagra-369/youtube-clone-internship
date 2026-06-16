import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDownloads } from "../../services/download.service";
import { getUserByEmail } from "../../services/user.service";
interface DownloadItem {
  _id: string;
  videoId: {
    _id: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    uploadedBy: string;
    channelName?: string;
    views: number;
    duration?: string;
  };
  downloadedAt: string;
  quality?: string;
}

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuality, setSelectedQuality] = useState<string>("all");

  const fetchDownloads = async () => {
    try {
      const localUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (!localUser?.email) {
        setDownloads([]);
        return;
      }

      const userResponse =
        await getUserByEmail(localUser.email);

      const userId =
        userResponse.data._id;

      const response =
        await getDownloads(userId);

      setDownloads(response.data || []);
    } catch (error) {
      console.error(error);
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const formatViews = (views: number = 0): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (date: string): string => {
    const downloadedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - downloadedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleDeleteDownload = async (downloadId: string) => {
    if (confirm("Remove this video from downloads?")) {
      setDownloads(downloads.filter(d => d._id !== downloadId));
    }
  };

  const filteredDownloads = downloads.filter((download) => {
    const matchesSearch = download.videoId?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuality = selectedQuality === "all" || download.quality === selectedQuality;
    return matchesSearch && matchesQuality;
  });

  const qualities = ["all", "1080p", "720p", "480p", "360p"];
  const totalSize = downloads.length * 150;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-50">
          <div className="flex items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center gap-1">
              <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
              </svg>
              <span className="text-white text-xl font-semibold">YouTube</span>
            </Link>
          </div>
        </header>
        <main className="pt-14">
          <div className="flex justify-center items-center h-[calc(100vh-56px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center gap-1">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
            </svg>
            <span className="text-white text-xl font-semibold">YouTube</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Search in downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#121212] border border-[#303030] rounded-l-full text-white placeholder:text-[#aaaaaa] focus:outline-none focus:border-blue-500"
              />
              <button className="px-6 bg-[#222222] border border-[#303030] border-l-0 rounded-r-full hover:bg-[#272727]">
                <svg className="w-5 h-5 text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 bg-[#222222] text-[#3ea6ff] text-sm font-medium rounded-full hover:bg-[#272727] transition">
              Premium
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-[#3ea6ff] text-black text-sm font-medium rounded-full hover:bg-[#65b8ff] transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header Stats */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Downloads</h1>
            <div className="flex items-center gap-4 text-sm text-[#aaaaaa]">
              <span>📁 {downloads.length} videos</span>
              <span>💾 {totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize} MB`} used</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#272727]">
            <div className="flex gap-2 flex-wrap">
              {qualities.map((quality) => (
                <button
                  key={quality}
                  onClick={() => setSelectedQuality(quality)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedQuality === quality
                    ? "bg-white text-black"
                    : "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                    }`}
                >
                  {quality === "all" ? "All Qualities" : quality}
                </button>
              ))}
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#3ea6ff] text-sm hover:text-[#65b8ff] transition"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Downloads Grid */}
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-20">
              {searchQuery || selectedQuality !== "all" ? (
                <>
                  <svg className="w-20 h-20 text-[#272727] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <p className="text-[#aaaaaa]">No matching downloads found</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedQuality("all");
                    }}
                    className="mt-4 text-[#3ea6ff] hover:text-[#65b8ff] transition"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <svg className="w-20 h-20 text-[#272727] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1h4v1h-4v1h4v1h-4v1h6V3h-6zm-2 4H5V5h5v2zm0 3H5V8h5v2zm0 3H5v-2h5v2zm8-6h-3V5h3v2zm0 3h-3V8h3v2zm0 3h-3v-2h3v2zM3 21h18v-6H3v6zm2-2v-2h4v2H5zm6 0v-2h4v2h-4zm6 0v-2h2v2h-2z" />
                  </svg>
                  <p className="text-[#aaaaaa] text-lg">No downloads yet</p>
                  <p className="text-[#aaaaaa] text-sm mt-2">Videos you download will appear here</p>
                  <Link to="/" className="inline-block mt-6 px-6 py-2 bg-[#3ea6ff] text-black rounded-full font-medium hover:bg-[#65b8ff] transition">
                    Browse Videos
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredDownloads.map((download) => (
                <div
                  key={download._id}
                  className="group bg-[#0f0f0f] rounded-xl overflow-hidden hover:bg-[#1a1a1a] transition border border-[#272727] hover:border-[#3a3a3a]"
                >
                  {/* Thumbnail */}
                  <Link to={`/video/${download.videoId?._id}`} className="relative block">
                    <img
                      src={download.videoId?.thumbnailUrl || "https://via.placeholder.com/360x202/272727/aaaaaa"}
                      alt={download.videoId?.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x202/272727/aaaaaa";
                      }}
                    />
                    {download.quality && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {download.quality}
                      </span>
                    )}
                    {/* Duration Badge */}
                    {download.videoId?.duration && (
                      <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {download.videoId.duration}
                      </span>
                    )}
                  </Link>

                  {/* Video Info */}
                  <div className="p-4">
                    <Link to={`/video/${download.videoId?._id}`}>
                      <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 hover:text-[#3ea6ff] transition">
                        {download.videoId?.title || "Untitled"}
                      </h3>
                    </Link>

                    <p className="text-[#aaaaaa] text-xs hover:text-white transition mb-1">
                      {download.videoId?.channelName || download.videoId?.uploadedBy || "Channel"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#aaaaaa] mb-3">
                      <span>👁 {formatViews(download.videoId?.views)} views</span>
                    </div>

                    {/* Download Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#272727]">
                      <div className="flex items-center gap-1 text-xs text-[#aaaaaa]">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        <span>{formatDate(download.downloadedAt)}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteDownload(download._id)}
                        className="text-[#aaaaaa] hover:text-red-500 transition p-1 rounded-full hover:bg-[#272727]"
                        title="Remove from downloads"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Storage Info Banner */}
          {downloads.length > 0 && (
            <div className="mt-8 p-4 bg-[#1a1a1a] rounded-xl border border-[#272727]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-[#3ea6ff]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 10h-2V6h-2v4h-2V6h-2v4H9V6H7v4H5V4h14v6zm0 2H5v6h14v-6z" />
                  </svg>
                  <div>
                    <p className="text-white text-sm font-medium">Storage Used</p>
                    <p className="text-[#aaaaaa] text-xs">{totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize} MB`} for {downloads.length} videos</p>
                  </div>
                </div>
                <div className="w-48 h-2 bg-[#272727] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3ea6ff] rounded-full"
                    style={{ width: `${Math.min((downloads.length / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[#aaaaaa] text-xs">
                  {downloads.length}/50 videos
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DownloadsPage;
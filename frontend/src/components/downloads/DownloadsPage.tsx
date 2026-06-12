import { useEffect, useState } from "react";
import { getDownloads } from "../../services/download.service";

interface DownloadItem {
  _id: string;
  videoId: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    uploadedBy: string;
    views: number;
  };
  downloadedAt: string;
}

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState<
    DownloadItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const fetchDownloads = async () => {
    try {
      const userId =
        "685111111111111111111111";

      const response =
        await getDownloads(userId);

      setDownloads(response.data);
    } catch (error) {
      console.error(
        "Downloads Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex justify-center items-center">
        <h2>Loading Downloads...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        My Downloads
      </h1>

      {downloads.length === 0 ? (
        <p className="text-gray-400">
          No downloaded videos yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {downloads.map((download) => (
            <div
              key={download._id}
              className="bg-[#181818] rounded-xl overflow-hidden border border-[#272727]"
            >
              <img
                src={
                  download.videoId
                    ?.thumbnailUrl
                }
                alt={
                  download.videoId?.title
                }
                className="w-full h-48 object-cover"
              />

              <div className="p-4">
                <h2 className="font-semibold text-lg">
                  {
                    download.videoId
                      ?.title
                  }
                </h2>

                <p className="text-sm text-gray-400 mt-2">
                  By{" "}
                  {
                    download.videoId
                      ?.uploadedBy
                  }
                </p>

                <p className="text-sm text-gray-400">
                  👁{" "}
                  {
                    download.videoId
                      ?.views
                  }{" "}
                  views
                </p>

                <p className="text-xs text-gray-500 mt-3">
                  Downloaded on{" "}
                  {new Date(
                    download.downloadedAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
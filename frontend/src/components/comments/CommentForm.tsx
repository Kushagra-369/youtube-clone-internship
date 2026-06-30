import { useEffect, useState } from "react";
import { createComment } from "../../services/comment.service";
import { getThemeByLocationAndTime } from "../utils/theme";

interface Props {
  onCommentCreated: () => void;
  videoId?: string;
}

const CommentForm = ({ onCommentCreated, videoId }: Props) => {
  const [text, setText] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Get theme
  const theme = getThemeByLocationAndTime(user?.state || "");
  const isLight = theme === "light";

  // Theme-based classes
  const textColor = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
  const borderColor = isLight ? "border-gray-300" : "border-[#3a3a3a]";
  const borderFocus = isLight ? "focus:border-black" : "focus:border-[#3ea6ff]";
  const placeholderColor = isLight ? "placeholder:text-gray-400" : "placeholder:text-[#aaaaaa]";
  const avatarBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  const avatarIcon = isLight ? "text-gray-600" : "text-[#aaaaaa]";
  const cancelBtn = isLight ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-[#272727]";
  const inputBg = isLight ? "bg-white" : "bg-transparent";

  const fetchCity = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setCity(
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "Unknown"
          );
        }
      );
    } catch (error) {
      console.error(error);
      setCity("Unknown");
    }
  };
  
  useEffect(() => {
    fetchCity();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;

    // Check if user is logged in
    if (!user) {
      alert("Please sign in to comment");
      return;
    }

    try {
      setIsSubmitting(true);
      // Send userId AND videoId to backend
      await createComment(text, city, videoId, user._id);
      setText("");
      await onCommentCreated();
    } catch (error) {
      console.error("Create Comment Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-4 mb-8 ${isLight ? 'border-b border-gray-200 pb-4' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0">
        <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center ${isLight ? 'border-2 border-gray-300' : ''}`}>
          <svg className={`w-5 h-5 ${avatarIcon}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          className={`w-full ${inputBg} border-b ${borderColor} ${textColor} py-2 focus:outline-none ${borderFocus} ${placeholderColor} text-sm transition`}
        />

        <div className="flex items-center justify-between mt-2">
          {city && (
            <p className={`text-xs ${mutedText} flex items-center gap-1`}>
              <span>📍</span> {city}
            </p>
          )}

          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setText("")}
              className={`px-4 py-1.5 ${textColor} text-sm font-medium rounded-full ${cancelBtn} transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim() || !user}
              className="px-4 py-1.5 bg-[#3ea6ff] text-black text-sm font-medium rounded-full hover:bg-[#65b8ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
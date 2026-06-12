import { useEffect, useState } from "react";
import { createComment } from "../../services/comment.service";

interface Props {
  onCommentCreated: () => void;
  videoId?: string;
}

const CommentForm = ({ onCommentCreated, videoId }: Props) => {
  const [text, setText] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCity = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } =
            position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const data =
            await response.json();

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

    try {
      setIsSubmitting(true);
      await createComment(text, city, videoId);
      setText("");
      await onCommentCreated();
    } catch (error) {
      console.error("Create Comment Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#272727] flex items-center justify-center">
          <svg className="w-5 h-5 text-[#aaaaaa]" fill="currentColor" viewBox="0 0 24 24">
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
          className="w-full bg-transparent border-b border-[#3a3a3a] text-white py-2 focus:outline-none focus:border-[#3ea6ff] placeholder:text-[#aaaaaa] text-sm transition"
        />

        <div className="flex items-center justify-between mt-2">
          {city && (
            <p className="text-xs text-[#aaaaaa] flex items-center gap-1">
              <span>📍</span> {city}
            </p>
          )}

          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setText("")}
              className="px-4 py-1.5 text-white text-sm font-medium rounded-full hover:bg-[#272727] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
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
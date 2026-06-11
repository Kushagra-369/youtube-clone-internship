import { useEffect, useState } from "react";
import { createComment } from "../../services/comment.service";

interface Props {
  onCommentCreated: () => void;
}

const CommentForm = ({ onCommentCreated }: Props) => {
  const [text, setText] = useState("");
  const [city, setCity] = useState("");

  const fetchCity = async () => {
    try {
      const response = await fetch(
        "https://ipapi.co/json/"
      );

      const data = await response.json();

      setCity(data.city || "Unknown");
    } catch (error) {
      console.error("City Fetch Error:", error);

      setCity("Unknown");
    }
  };

  useEffect(() => {
    fetchCity();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      await createComment(text, city);

      setText("");

      await onCommentCreated();
    } catch (error) {
      console.error("Create Comment Error:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mb-5"
    >
      <input
        type="text"
        placeholder="Enter comment"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border p-2 rounded"
      />

      <p className="text-sm text-gray-500">
        📍 City: {city}
      </p>

      <button
        type="submit"
        className="border p-2 rounded"
      >
        Post Comment
      </button>
    </form>
  );
};

export default CommentForm;
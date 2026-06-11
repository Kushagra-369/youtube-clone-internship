export interface Comment {
  _id: string;
  text: string;
  city: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  createdAt: string;
  updatedAt: string;
}
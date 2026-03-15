import { useParams } from "react-router-dom";

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Book a Class</h1>
      <p className="text-gray-400">Studio: <span className="text-indigo-400 font-mono">{slug}</span></p>
      <p className="text-gray-500 mt-2">Browse available classes and make a booking.</p>
    </div>
  );
}

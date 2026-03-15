import { Navigate, useParams } from "react-router-dom";

/** Legacy public booking stub — redirects to the real BookingPage */
export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug ?? ""}/book`} replace />;
}

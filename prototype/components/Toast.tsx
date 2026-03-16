"use client";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
};

export function Toast({ message, type = "info" }: ToastProps) {
  const bgColor = type === "success"
    ? "var(--color-success)"
    : type === "error"
    ? "var(--color-danger)"
    : "var(--color-accent)";

  return (
    <div
      className="fixed bottom-4 right-4 px-6 py-4 text-white shadow-lg z-50 slide-in max-w-md"
      style={{ backgroundColor: bgColor }}
    >
      {message}
    </div>
  );
}

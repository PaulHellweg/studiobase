"use client";

import { ReactNode } from "react";

type ModalProps = {
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ onClose, title, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white border border-[var(--color-border)] shadow-xl max-w-md w-full mx-4 fade-in-up">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="font-heading font-600 text-xl">{title}</h2>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

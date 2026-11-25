"use client";

import { useEffect, useRef } from "react";
import Modal from "@/components/Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      label={title}
      className="items-center justify-end pt-[calc(1rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(1rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:justify-center"
    >
      <div
        className="max-h-full w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-paper p-5 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-extrabold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-ink-soft">{message}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper-deep min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white min-h-[44px] ${
              danger ? "bg-bad hover:bg-red-800" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

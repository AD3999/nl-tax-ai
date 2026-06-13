import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
  /** Prevent closing on backdrop click — default: closes on click */
  noBackdropClose?: boolean;
}

/**
 * Accessible modal dialog.
 * Ch 10 + Ch 19: focus is trapped inside while open; returns to trigger on close.
 * Respects WCAG 2.1 §2.1.2 (No Keyboard Trap) and §4.1.3 (Status Messages).
 */
export default function Modal({ open, onClose, title, children, maxWidth = 480, noBackdropClose }: ModalProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Save the element that was focused before opening so we can restore it
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      // Move focus into the panel after render
      requestAnimationFrame(() => {
        const el = panelRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        el?.focus();
      });
    } else {
      // Restore focus to the element that triggered the modal
      if (triggerRef.current && "focus" in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [open]);

  // Trap focus within the modal while it is open
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.closest("[aria-hidden='true']"));

      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: "var(--z-modal)" as unknown as number,
        background: "oklch(0 0 0 / 0.60)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--sp-4)",
      }}
      onClick={noBackdropClose ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        style={{
          background: "var(--bg-2)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border-2)",
          padding: "var(--sp-6)",
          width: "100%",
          maxWidth,
          boxShadow: "var(--sh-lg)",
          maxHeight: "90svh",
          overflowY: "auto",
        }}
      >
        {title && (
          <h2
            id="modal-title"
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: "var(--sp-5)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

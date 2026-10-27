"use client";

import { ArrowUpRight, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

/**
 * The same gentle agreements apply to every study room, so they live here
 * instead of being duplicated into each room (including custom rooms).
 */
const roomGuidelines = [
  {
    title: "Be kind to every learner",
    detail: "Encourage questions and treat everyone's space with respect.",
  },
  {
    title: "Keep the room focused",
    detail: "Save long side chats for later so the shared quiet stays calm.",
  },
  {
    title: "Use notes and prompts gently",
    detail: "Share small, useful thoughts rather than messages meant for one person.",
  },
  {
    title: "Respect study time",
    detail: "Join ready to focus, and keep noise and interruptions low.",
  },
  {
    title: "No spam or pressure",
    detail: "Don't promote, flood, or misuse room features. Everyone is here to learn.",
  },
  {
    title: "Leave when you're finished",
    detail: "Close the door behind you so the table stays ready for the next learner.",
  },
];

interface RoomGuidelinesProps {
  roomName: string;
  open: boolean;
  /** Dismiss the guidelines without entering the room. */
  onClose: () => void;
  /** When provided, the primary action enters the room. */
  onConfirm?: () => void;
  confirmLabel?: string;
}

export function RoomGuidelines({
  roomName,
  open,
  onClose,
  onConfirm,
  confirmLabel = "I understand — Enter room",
}: RoomGuidelinesProps) {
  const titleId = useId();
  const introId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog-content room-guidelines-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={introId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="room-guidelines-header">
          <div>
            <span className="room-guidelines-eyebrow">
              <Sparkles size={14} aria-hidden="true" /> {onConfirm ? "Before you enter" : "Before you settle in"}
            </span>
            <h2 id={titleId}>Room guidelines</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="room-guidelines-close"
            onClick={onClose}
            aria-label="Close room guidelines"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="room-guidelines-intro" id={introId}>
          A few gentle agreements that keep {roomName} a calm place to learn.
        </p>

        <ol className="room-guidelines-list">
          {roomGuidelines.map((guideline, index) => (
            <li key={guideline.title}>
              <span className="room-guidelines-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{guideline.title}</strong>
                <span className="room-guidelines-copy">{guideline.detail}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="room-guidelines-footer">
          {onConfirm && (
            <button type="button" className="button-secondary room-guidelines-cancel" onClick={onClose}>
              Not now
            </button>
          )}
          <button
            type="button"
            className="button-primary room-guidelines-done"
            onClick={onConfirm ?? onClose}
          >
            {onConfirm ? (
              <>
                {confirmLabel} <ArrowUpRight size={15} aria-hidden="true" />
              </>
            ) : (
              "Got it"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

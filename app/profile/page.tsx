"use client";

import { SiteHeader } from "@/components/site-header";
import { categories } from "@/data/categories";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  FEEDBACK_LIMITS,
  FEEDBACK_TYPE_OPTIONS,
  hasValidationErrors,
  parseFeedbackInput,
  type FeedbackFieldErrors,
  type FeedbackType,
} from "@/lib/feedback";
import { AlertCircle, Check, LoaderCircle, MessageSquare, Pencil, Plus, Send, Sparkles, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./profile.module.css";

interface Profile {
  displayName: string;
  bio: string;
  interests: string[];
}

const emptyProfile: Profile = { displayName: "", bio: "", interests: [] };
const MAX_NAME = 40;
const MAX_BIO = 160;
const MAX_INTERESTS = 8;
const suggestions = categories.filter((category) => category !== "All maps");

function hasDetails(profile: Profile) {
  return Boolean(profile.displayName || profile.bio || profile.interests.length);
}

export default function ProfilePage() {
  const [profile, setProfile, hydrated] = useLocalStorage<Profile>("bibble-profile", emptyProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [interestInput, setInterestInput] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("feedback");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackErrors, setFeedbackErrors] = useState<FeedbackFieldErrors>({});
  const [feedbackNotice, setFeedbackNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackSubmittingRef = useRef(false);
  const feedbackTriggerRef = useRef<HTMLButtonElement>(null);
  const feedbackDialogRef = useRef<HTMLDivElement>(null);
  const feedbackCloseRef = useRef<HTMLButtonElement>(null);

  function startEditing() {
    setDraft(profile);
    setInterestInput("");
    setEditing(true);
  }

  function addInterest(raw: string) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value || draft.interests.length >= MAX_INTERESTS) return;
    if (draft.interests.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setDraft((current) => ({ ...current, interests: [...current.interests, value] }));
    setInterestInput("");
  }

  function removeInterest(value: string) {
    setDraft((current) => ({ ...current, interests: current.interests.filter((item) => item !== value) }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfile({
      displayName: draft.displayName.trim(),
      bio: draft.bio.trim(),
      interests: draft.interests,
    });
    setEditing(false);
  }

  function clearFeedbackError(field: keyof FeedbackFieldErrors) {
    setFeedbackErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const closeFeedback = useCallback(() => {
    if (feedbackSubmittingRef.current) return;
    setFeedbackOpen(false);
    setFeedbackNotice(null);
    setFeedbackErrors({});
    feedbackTriggerRef.current?.focus();
  }, []);

  function openFeedback() {
    setFeedbackOpen(true);
  }

  useEffect(() => {
    if (!feedbackOpen) return;

    const dialog = feedbackDialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    feedbackCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFeedback();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [feedbackOpen, closeFeedback]);

  async function handleFeedbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (feedbackSubmittingRef.current) return;

    const parsed = parseFeedbackInput({
      type: feedbackType,
      subject: feedbackSubject,
      message: feedbackMessage,
    });
    setFeedbackErrors(parsed.errors);

    if (hasValidationErrors(parsed.errors)) {
      setFeedbackNotice(null);
      return;
    }

    feedbackSubmittingRef.current = true;
    setFeedbackSubmitting(true);
    setFeedbackNotice(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setFeedbackNotice({
          kind: "error",
          text: result?.error ?? "We couldn't send your feedback. Please try again.",
        });
        return;
      }

      setFeedbackType("feedback");
      setFeedbackSubject("");
      setFeedbackMessage("");
      setFeedbackErrors({});
      setFeedbackNotice({
        kind: "success",
        text: "Thanks! Your feedback has been sent successfully.",
      });
    } catch {
      setFeedbackNotice({
        kind: "error",
        text: "We couldn't reach the server. Check your connection and try again.",
      });
    } finally {
      feedbackSubmittingRef.current = false;
      setFeedbackSubmitting(false);
    }
  }

  const showEmptyState = hydrated && !editing && !hasDetails(profile);

  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={styles.container}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>
            <UserRound size={14} /> Your profile
          </p>
          <h1>About you</h1>
          <p className={styles.sub}>
            Saved in this browser only for now. Account sync will come with the backend.
          </p>
        </header>

        {!hydrated && <p className={styles.sub}>Loading your profile…</p>}

        {showEmptyState && (
          <section className={styles.emptyCard} aria-labelledby="profile-empty-title">
            <div className={styles.emptyBadge} aria-hidden="true">
              <Sparkles size={28} />
            </div>
            <h2 id="profile-empty-title">No profile details yet</h2>
            <p>Add a display name, a short bio and what you like to learn so your space feels like yours.</p>
            <button type="button" className={styles.primary} onClick={startEditing}>
              <Pencil size={15} /> Add your details
            </button>
          </section>
        )}

        {hydrated && !editing && hasDetails(profile) && (
          <section className={styles.card} aria-label="Profile details">
            <div className={styles.cardTop}>
              <div className={styles.avatar} aria-hidden="true">
                {(profile.displayName || "B").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{profile.displayName || "Unnamed learner"}</h2>
                <p className={styles.bio}>{profile.bio || "No bio yet."}</p>
              </div>
              <button type="button" className={styles.secondary} onClick={startEditing}>
                <Pencil size={14} /> Edit
              </button>
            </div>
            <h3>Learning interests</h3>
            {profile.interests.length > 0 ? (
              <ul className={styles.chips}>
                {profile.interests.map((interest) => (
                  <li key={interest} className={styles.chip}>
                    {interest}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>No interests added yet.</p>
            )}
          </section>
        )}

        {hydrated && editing && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="profile-name">
              Display name
              <input
                id="profile-name"
                value={draft.displayName}
                maxLength={MAX_NAME}
                onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
                placeholder="What should we call you?"
              />
            </label>

            <label htmlFor="profile-bio">
              Short bio
              <textarea
                id="profile-bio"
                value={draft.bio}
                maxLength={MAX_BIO}
                rows={3}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                placeholder="A line or two about what you are learning."
              />
              <span className={styles.counter}>
                {draft.bio.length}/{MAX_BIO}
              </span>
            </label>

            <div className={styles.field}>
              <label htmlFor="profile-interest">Learning interests</label>
              <div className={styles.interestRow}>
                <input
                  id="profile-interest"
                  value={interestInput}
                  onChange={(event) => setInterestInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addInterest(interestInput);
                    }
                  }}
                  placeholder="Type a topic and press Enter"
                  disabled={draft.interests.length >= MAX_INTERESTS}
                />
                <button type="button" className={styles.secondary} onClick={() => addInterest(interestInput)}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className={styles.suggestions} aria-label="Suggested topics">
                {suggestions.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => addInterest(topic)}
                    disabled={draft.interests.includes(topic) || draft.interests.length >= MAX_INTERESTS}
                  >
                    + {topic}
                  </button>
                ))}
              </div>
              {draft.interests.length > 0 && (
                <ul className={styles.chips}>
                  {draft.interests.map((interest) => (
                    <li key={interest} className={styles.chip}>
                      {interest}
                      <button type="button" aria-label={`Remove ${interest}`} onClick={() => removeInterest(interest)}>
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <span className={styles.counter}>
                {draft.interests.length}/{MAX_INTERESTS} topics
              </span>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.primary}>
                Save profile
              </button>
              <button type="button" className={styles.secondary} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className={styles.feedbackPrompt}>
          <button
            ref={feedbackTriggerRef}
            type="button"
            className={styles.feedbackTrigger}
            onClick={openFeedback}
            aria-haspopup="dialog"
            aria-expanded={feedbackOpen}
          >
            <MessageSquare size={15} aria-hidden="true" />
            Give Feedback
          </button>
        </div>

        {feedbackOpen && (
          <div className="dialog-overlay" onClick={closeFeedback}>
            <div
              ref={feedbackDialogRef}
              className={`dialog-content ${styles.feedbackDialog}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-title"
              aria-describedby="feedback-intro"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.feedbackHead}>
                <div>
                  <p className={styles.eyebrow}>
                    <MessageSquare size={14} /> Help Bibble grow
                  </p>
                  <h2 id="feedback-title">Feedback &amp; Bug Report</h2>
                </div>
                <button
                  ref={feedbackCloseRef}
                  type="button"
                  className={styles.feedbackClose}
                  onClick={closeFeedback}
                  disabled={feedbackSubmitting}
                  aria-label="Close feedback form"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className={styles.feedbackIntro} id="feedback-intro">
                Share a thought, report something that feels off, or suggest what you&apos;d love to see next.
              </p>

              {feedbackNotice?.kind === "success" ? (
                <div className={styles.feedbackSuccess} role="status">
                  <span className={styles.feedbackSuccessIcon} aria-hidden="true">
                    <Check size={22} />
                  </span>
                  <h3>Feedback sent</h3>
                  <p>{feedbackNotice.text}</p>
                  <button
                    type="button"
                    className={`${styles.primary} ${styles.feedbackSubmit}`}
                    onClick={closeFeedback}
                    autoFocus
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  className={styles.feedbackForm}
                  onSubmit={handleFeedbackSubmit}
                  noValidate
                  aria-busy={feedbackSubmitting}
                >
                  <fieldset
                    className={styles.typeField}
                    disabled={feedbackSubmitting}
                    aria-describedby={feedbackErrors.type ? "feedback-type-error" : undefined}
                  >
                    <legend>Feedback type</legend>
                    <div className={styles.typeOptions}>
                      {FEEDBACK_TYPE_OPTIONS.map((option) => (
                        <label key={option.value} className={styles.typeOption}>
                          <input
                            type="radio"
                            name="feedback-type"
                            value={option.value}
                            checked={feedbackType === option.value}
                            onChange={() => {
                              setFeedbackType(option.value);
                              clearFeedbackError("type");
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {feedbackErrors.type && (
                      <p className={styles.fieldError} id="feedback-type-error" role="alert">
                        {feedbackErrors.type}
                      </p>
                    )}
                  </fieldset>

                  <div className={styles.field}>
                    <label htmlFor="feedback-subject">
                      Subject <span className={styles.requiredMark} aria-hidden="true">*</span>
                    </label>
                    <input
                      id="feedback-subject"
                      name="subject"
                      value={feedbackSubject}
                      onChange={(event) => {
                        setFeedbackSubject(event.target.value);
                        clearFeedbackError("subject");
                      }}
                      maxLength={FEEDBACK_LIMITS.subject.max}
                      placeholder="A quick summary — e.g. Focus timer stops on mobile"
                      required
                      disabled={feedbackSubmitting}
                      aria-invalid={feedbackErrors.subject ? true : undefined}
                      aria-describedby={
                        feedbackErrors.subject
                          ? "feedback-subject-error feedback-subject-count"
                          : "feedback-subject-count"
                      }
                    />
                    <div className={styles.feedbackMeta}>
                      {feedbackErrors.subject ? (
                        <p className={styles.fieldError} id="feedback-subject-error" role="alert">
                          {feedbackErrors.subject}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className={styles.counter} id="feedback-subject-count">
                        {feedbackSubject.length}/{FEEDBACK_LIMITS.subject.max}
                      </span>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="feedback-message">
                      Message <span className={styles.requiredMark} aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      name="message"
                      value={feedbackMessage}
                      onChange={(event) => {
                        setFeedbackMessage(event.target.value);
                        clearFeedbackError("message");
                      }}
                      maxLength={FEEDBACK_LIMITS.message.max}
                      rows={5}
                      placeholder="Tell us what happened, what you expected, and anything that would help us understand."
                      required
                      disabled={feedbackSubmitting}
                      aria-invalid={feedbackErrors.message ? true : undefined}
                      aria-describedby={
                        feedbackErrors.message
                          ? "feedback-message-error feedback-message-count"
                          : "feedback-message-count"
                      }
                    />
                    <div className={styles.feedbackMeta}>
                      {feedbackErrors.message ? (
                        <p className={styles.fieldError} id="feedback-message-error" role="alert">
                          {feedbackErrors.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className={styles.counter} id="feedback-message-count">
                        {feedbackMessage.length}/{FEEDBACK_LIMITS.message.max}
                      </span>
                    </div>
                  </div>

                  <div className={styles.feedbackActions}>
                    <button
                      type="submit"
                      className={`${styles.primary} ${styles.feedbackSubmit}`}
                      disabled={feedbackSubmitting}
                    >
                      {feedbackSubmitting ? (
                        <LoaderCircle size={15} className={styles.spinner} aria-hidden="true" />
                      ) : (
                        <Send size={15} aria-hidden="true" />
                      )}
                      {feedbackSubmitting ? "Sending feedback…" : "Submit Feedback"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={closeFeedback}
                      disabled={feedbackSubmitting}
                    >
                      Cancel
                    </button>
                  </div>

                  {feedbackNotice?.kind === "error" && (
                    <p className={`${styles.feedbackNotice} ${styles.errorNotice}`} role="alert">
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>{feedbackNotice.text}</span>
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

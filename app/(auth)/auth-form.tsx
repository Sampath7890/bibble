"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { login, signup } from "@/app/actions/auth";
import { passwordRequirements } from "@/lib/auth/validation";
import { ThemePicker } from "@/components/ui/theme-picker";
import { useTheme } from "@/hooks/use-theme";
import styles from "./auth.module.css";

type AuthMode = "login" | "signup";
type FieldErrors = Record<string, string | string[]>;
type FormState = { message?: string; fieldErrors?: FieldErrors; errors?: FieldErrors };

const passwordChecks = [
  (value: string) => value.length >= 12,
  (value: string) => /[A-Z]/.test(value),
  (value: string) => /[a-z]/.test(value),
  (value: string) => /\d/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
];

function errorText(errors: FieldErrors | undefined, field: string) {
  const error = errors?.[field];
  return Array.isArray(error) ? error[0] : error;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { motif } = useTheme();
  const isSignup = mode === "signup";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, boolean>>({});
  const [state, formAction, pending] = useActionState(
    isSignup ? signup : login,
    undefined,
  );
  const formState = state as FormState | undefined;
  const fieldErrors = formState?.fieldErrors ?? formState?.errors;
  const markEdited = (field: string) => {
    setEditedFields((current) => ({ ...current, [field]: true }));
  };
  const visibleError = (field: string) =>
    editedFields[field] ? undefined : errorText(fieldErrors, field);
  const passwordError = visibleError("password");
  const confirmPasswordMismatch =
    (confirmPassword.length > 0 || hasSubmitted) && password !== confirmPassword;
  const confirmPasswordError =
    visibleError("confirmPassword") ??
    (confirmPasswordMismatch ? "Passwords do not match." : undefined);
  const generalMessageVisible =
    Boolean(formState?.message) && Object.keys(editedFields).length === 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className="brand">
          <span className="brand-mark">{motif.brandEmoji}</span>
          <span>Bibble</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemePicker compact />
          <Link href="/" className={styles.back}>
            Keep browsing <ArrowRight size={15} />
          </Link>
        </div>
      </header>
      <section className={styles.shell} aria-labelledby="auth-title">
        <span className={"eyebrow " + styles.eyebrow}>
          <Sparkles size={14} /> Your little learning corner
        </span>
        <h1 id="auth-title" className={styles.title}>
          {isSignup ? "Make it yours." : "Welcome back."}
        </h1>
        <p className={styles.copy}>
          {isSignup
            ? "Create an account to keep your Bibble identity close. You can still browse every sample map and study room without one."
            : "Log in to your Bibble account. Browsing, previews, and map-making are always open."}
        </p>
        <form
          className={styles.form}
          action={formAction}
          onSubmit={() => {
            setHasSubmitted(true);
            setEditedFields({});
          }}
        >
          {isSignup && (
            <div className={styles.field}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                aria-invalid={Boolean(visibleError("name"))}
                aria-describedby={visibleError("name") ? "name-error" : undefined}
                onChange={() => markEdited("name")}
                required
              />
              {visibleError("name") && (
                <p id="name-error" style={{ margin: 0, color: "#b44444", fontSize: "12px" }} role="alert">
                  {visibleError("name")}
                </p>
              )}
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(visibleError("email"))}
              aria-describedby={visibleError("email") ? "email-error" : undefined}
              onChange={() => markEdited("email")}
              required
            />
            {visibleError("email") && (
              <p id="email-error" style={{ margin: 0, color: "#b44444", fontSize: "12px" }} role="alert">
                {visibleError("email")}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              aria-describedby={
                isSignup
                  ? passwordError
                    ? "password-help password-error"
                    : "password-help"
                  : undefined
              }
              aria-invalid={Boolean(passwordError)}
              onChange={(event) => {
                setPassword(event.target.value);
                markEdited("password");
              }}
              style={passwordError ? { borderColor: "#b44444" } : undefined}
              required
            />
            {isSignup && (
              <>
                <p id="password-help" className={styles.note} aria-live="polite">
                  Your password should have:
                </p>
                <ul style={{ margin: "-8px 0 0", paddingLeft: "18px", color: "var(--muted)", fontSize: "11px", lineHeight: 1.5 }} aria-label="Password requirements">
                  {passwordRequirements.map((requirement, index) => (
                    <li
                      key={requirement}
                      style={passwordChecks[index]?.(password) ? { color: "#32845c" } : undefined}
                    >
                      {requirement}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {passwordError && (
              <p id="password-error" style={{ margin: 0, color: "#b44444", fontSize: "12px" }} role="alert">
                {passwordError}
              </p>
            )}
          </div>
          {isSignup && (
            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(confirmPasswordError)}
                aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  markEdited("confirmPassword");
                }}
                style={confirmPasswordError ? { borderColor: "#b44444" } : undefined}
                required
              />
              {confirmPasswordError && (
                <p id="confirm-password-error" style={{ margin: 0, color: "#b44444", fontSize: "12px" }} role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          )}
          {generalMessageVisible && (
            <p className={styles.message} role="alert">
              {formState?.message}
            </p>
          )}
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className={styles.switch}>
          {isSignup ? (
            <>
              Already have an account? <Link href="/login">Log in</Link>
            </>
          ) : (
            <>
              New here? <Link href="/signup">Create an account</Link>
            </>
          )}
        </p>
        <p className={styles.note}>
          Your password is securely handled by Supabase Auth and is never stored in plaintext.
        </p>
      </section>
    </main>
  );
}

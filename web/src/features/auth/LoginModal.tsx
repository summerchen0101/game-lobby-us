import { type FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../lib/api/client";
import { requestPasswordReset } from "../../lib/api/passwordReset";
import "./AuthModals.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSwitchRegister: () => void;
};

type Screen = "signIn" | "forgot";

const FORGOT_GENERIC_MSG =
  "If that email is registered, you'll receive a password reset link shortly.";

/** Icon when password is hidden — click to reveal. */
function IconEyeOpen() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

/** Icon when password is visible — click to hide. */
function IconEyeClosed() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.27-1.13 2.2-2.5 2.7-3.9-1.73-4.39-6-7.5-11-7.5-1.4 0-2.75.25-3.99.7l2.2 2.2C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.05-.2 4.45-.55l.42.42L19.73 22 22 19.73 4.27 2 2 4.27zM7.53 9.8l1.55 1.55c-.05.3-.08.6-.08.9 0 1.66 1.34 3 3 3 .3 0 .6-.04.9-.1l1.55 1.55c-.84.3-1.75.5-2.7.5-2.76 0-5-2.24-5-5 0-.95.2-1.86.5-2.7z" />
    </svg>
  );
}

export function LoginModal({ open, onClose, onSwitchRegister }: Props) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const forgotEmailId = `${formId}-forgot-email`;

  const [screen, setScreen] = useState<Screen>("signIn");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setScreen("signIn");
      setForgotMsg(null);
      return;
    }
    setError(null);
  }, [open, screen]);

  function handleBack() {
    if (screen === "forgot") {
      setScreen("signIn");
      setForgotMsg(null);
    } else {
      onClose();
    }
  }

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(account.trim(), password);
      const redirect = searchParams.get("redirect");
      onClose();
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign-in failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotMsg(null);
    setForgotSubmitting(true);
    try {
      await requestPasswordReset({ email: forgotEmail.trim() });
      setForgotMsg(FORGOT_GENERIC_MSG);
    } catch (err) {
      // No backend or failure: do not block UX; use privacy-preserving copy (per plan)
      if (import.meta.env.DEV && err instanceof ApiError) {
        console.warn("[forgot-password]", err.message);
      }
      setForgotMsg(FORGOT_GENERIC_MSG);
    } finally {
      setForgotSubmitting(false);
    }
  }

  if (!open) return null;

  const titleId = "auth-login-dialog-title";
  const title = screen === "signIn" ? "Login" : "Forgot Password";

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal auth-modal--login"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}>
        <header className="app-modal__head-row">
          <button
            type="button"
            className="app-modal__head-btn"
            onClick={handleBack}
            aria-label={screen === "forgot" ? "Back to sign in" : "Close"}>
            <IoChevronBack aria-hidden />
          </button>
          <h2 id={titleId} className="app-modal__title--abs-center">
            {title}
          </h2>
          <button
            type="button"
            className="app-modal__head-btn auth-modal__head-btn--close"
            onClick={onClose}
            aria-label="Close">
            ×
          </button>
        </header>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          {screen === "signIn" ? (
            <>
              <form onSubmit={onSignIn} noValidate>
                <label
                  className="auth-modal__field-label auth-modal__field-label--register"
                  htmlFor={emailId}>
                  Email:
                </label>
                <input
                  id={emailId}
                  className="auth-modal__input auth-modal__input--register"
                  name="account"
                  type="email"
                  autoComplete="username"
                  placeholder="Please enter email"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />
                <label
                  className="auth-modal__field-label auth-modal__field-label--register"
                  htmlFor={passwordId}>
                  Password:
                </label>
                <div className="auth-modal__password-wrap">
                  <input
                    id={passwordId}
                    className="auth-modal__input auth-modal__input--register auth-modal__input--password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Please enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-modal__password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}>
                    {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                  </button>
                </div>
                {error ? <p className="auth-modal__error">{error}</p> : null}
                <button
                  type="submit"
                  className="auth-modal__submit"
                  disabled={submitting}>
                  {submitting ? "…" : "SIGN IN"}
                </button>
              </form>
              <p className="auth-modal__footer auth-modal__footer--center">
                <button
                  type="button"
                  className="auth-modal__link--forgot"
                  onClick={() => {
                    setScreen("forgot");
                    setForgotMsg(null);
                    if (!forgotEmail.trim() && account.trim()) {
                      setForgotEmail(account.trim());
                    }
                  }}>
                  Forgot password
                </button>
              </p>
              <p className="auth-modal__footer">
                Need an account?{" "}
                <button
                  type="button"
                  className="auth-modal__footer-link"
                  onClick={onSwitchRegister}>
                  CREATE ACCOUNT
                </button>
              </p>
            </>
          ) : (
            <form onSubmit={onForgotSubmit} noValidate>
              <p className="auth-modal__forgot-instruction">
                Please enter your registered email address to receive a password
                reset link.
              </p>
              <label
                className="auth-modal__field-label auth-modal__field-label--register"
                htmlFor={forgotEmailId}>
                Email:
              </label>
              <input
                id={forgotEmailId}
                className="auth-modal__input auth-modal__input--register"
                name="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="Please enter email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setForgotMsg(null);
                }}
                required
              />
              {forgotMsg ? (
                <p className="auth-modal__forgot-toast">{forgotMsg}</p>
              ) : null}
              <button
                type="submit"
                className="auth-modal__submit"
                disabled={forgotSubmitting}>
                {forgotSubmitting ? "…" : "SEND LINK"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { useState } from "react";

type AuthPanelProps = {
  email: string;
  username: string;
  university: string;
  department: string;
  password: string;
  authStatus: string;
  authError: string;
  isAuthLoading: boolean;
  onEmailChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onUniversityChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRegister: () => void;
  onLogin: () => void;
  onDemoLogin: () => void;
};

export function AuthPanel(props: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <>
            <div className="auth-fields">
              <div className="field-group">
                <label>Email</label>
                <input placeholder="you@university.edu" value={props.email} onChange={(e) => props.onEmailChange(e.target.value)} />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={props.password} onChange={(e) => props.onPasswordChange(e.target.value)} />
              </div>
            </div>
            <button className="auth-submit" onClick={props.onLogin} disabled={props.isAuthLoading}>
              {props.isAuthLoading ? "Signing in…" : "Sign In"}
            </button>
            <div className="auth-divider"><span>or</span></div>
            <button type="button" className="auth-demo" onClick={props.onDemoLogin} disabled={props.isAuthLoading}>
              ✨ Try Demo Account
            </button>
          </>
        ) : (
          <>
            <div className="auth-fields">
              <div className="field-group">
                <label>Email</label>
                <input placeholder="you@university.edu" value={props.email} onChange={(e) => props.onEmailChange(e.target.value)} />
              </div>
              <div className="field-group">
                <label>Username</label>
                <input placeholder="Choose a display name" value={props.username} onChange={(e) => props.onUsernameChange(e.target.value)} />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>University</label>
                  <input placeholder="MIT, Stanford…" value={props.university} onChange={(e) => props.onUniversityChange(e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Department</label>
                  <input placeholder="CS, Math…" value={props.department} onChange={(e) => props.onDepartmentChange(e.target.value)} />
                </div>
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="Min 8 characters" value={props.password} onChange={(e) => props.onPasswordChange(e.target.value)} />
              </div>
            </div>
            <button className="auth-submit" onClick={props.onRegister} disabled={props.isAuthLoading}>
              {props.isAuthLoading ? "Creating account…" : "Create Account"}
            </button>
          </>
        )}

        {props.authError && <p className="auth-error">{props.authError}</p>}
        {props.authStatus && <p className="auth-status">{props.authStatus}</p>}
        <p className="auth-hint">Demo: demo@studygroupfinder.app / DemoPass123!</p>
      </div>
    </section>
  );
}

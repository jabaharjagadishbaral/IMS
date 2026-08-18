import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  CalendarCheck,
  ClipboardList,
  UserCircle2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  RotateCcw,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

/* ---------------------------------------------------------------
   DESIGN TOKENS — "ledger book" identity: dark cover (sidebar) +
   cream pages (content), oxblood accent, rubber-stamp badges.
----------------------------------------------------------------*/
const C = {
  paper: "#F6F1E7",
  paperDim: "#EFE8D8",
  surface: "#FFFFFF",
  ink: "#241F1A",
  inkSoft: "#746B5C",
  border: "#E1D8C2",
  cover: "#211D18",
  coverSoft: "#332C24",
  coverText: "#EFE6D3",
  oxblood: "#7C2F2A",
  oxbloodDark: "#5E2320",
  teal: "#2B5D56",
  gold: "#A9791F",
  rust: "#AD4632",
};

const FONT_DISPLAY = '"Iowan Old Style", "Palatino Linotype", Georgia, serif';
const FONT_BODY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_MONO =
  'ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", monospace';

/* ---------------------------------------------------------------
   UTILITIES
----------------------------------------------------------------*/
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};
const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return "₹" + v.toLocaleString("en-IN");
};
const monthKey = (iso) => (iso || "").slice(0, 7);

const BRANCHES = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering",
];
const SEMESTERS = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];
const DEPARTMENTS = [...BRANCHES, "Administration", "Examination Cell", "Placement Cell", "Library"];

function bootstrapAdmin() {
  return { id: uid(), username: "admin", password: "admin123", role: "admin", name: "Administrator", linkedId: null };
}
function emptyData() {
  return { students: [], staff: [], fees: [], attendance: [], pending: [], users: [bootstrapAdmin()] };
}

function usernameAvailable(data, username, excludeUserId) {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  const clash = data.users.some((x) => x.id !== excludeUserId && x.username.toLowerCase() === u);
  const pendingClash = data.pending.some((p) => p.username.toLowerCase() === u);
  return !clash && !pendingClash;
}

/* ---------------------------------------------------------------
   SMALL UI ATOMS
----------------------------------------------------------------*/
function Stamp({ children, tone = "teal" }) {
  const toneColor = tone === "teal" ? C.teal : tone === "gold" ? C.gold : tone === "ink" ? C.inkSoft : C.rust;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT_MONO,
        fontSize: 10.5,
        letterSpacing: "0.09em",
        fontWeight: 700,
        color: toneColor,
        border: `1.5px solid ${toneColor}`,
        borderRadius: 3,
        padding: "2px 7px",
        transform: "rotate(-2deg)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span
        style={{
          display: "block",
          fontSize: 11.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.inkSoft,
          fontFamily: FONT_BODY,
          marginBottom: 5,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: C.paper,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "9px 11px",
  fontSize: 14.5,
  fontFamily: FONT_BODY,
  color: C.ink,
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function SelectInput({ children, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {children}
    </select>
  );
}

function Btn({ children, onClick, variant = "primary", icon: Icon, type = "button", disabled, style }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: FONT_BODY,
    fontSize: 13.5,
    fontWeight: 600,
    borderRadius: 6,
    padding: "8px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.15s",
  };
  const variants = {
    primary: { background: C.oxblood, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.rust, border: `1px solid ${C.rust}` },
    text: { background: "transparent", color: C.oxblood, padding: "4px 6px" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...(style || {}) }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = "0.82")}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = variants[variant].opacity || "1")}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(33,29,24,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 10,
          width: "100%",
          maxWidth: wide ? 560 : 420,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ label, sub }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 20px",
        color: C.inkSoft,
        fontFamily: FONT_BODY,
        border: `1px dashed ${C.border}`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink, marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

function ConfirmRow({ onConfirm, onCancel, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12.5, color: C.rust, fontFamily: FONT_BODY, fontWeight: 600 }}>{label}</span>
      <Btn variant="danger" onClick={onConfirm} style={{ padding: "4px 10px", fontSize: 12 }}>
        Delete
      </Btn>
      <Btn variant="ghost" onClick={onCancel} style={{ padding: "4px 10px", fontSize: 12 }}>
        Cancel
      </Btn>
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  const toneColor = tone === "teal" ? C.teal : tone === "gold" ? C.gold : tone === "rust" ? C.rust : C.oxblood;
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "18px 20px",
        borderTop: `3px solid ${toneColor}`,
      }}
    >
      <div style={{ fontSize: 11.5, letterSpacing: "0.07em", textTransform: "uppercase", color: C.inkSoft, fontFamily: FONT_BODY, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: C.ink, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4, fontFamily: FONT_BODY }}>{sub}</div>}
    </div>
  );
}

function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink }}>{title}</h2>
        {sub && <p style={{ margin: "4px 0 0", color: C.inkSoft, fontSize: 13.5, fontFamily: FONT_BODY }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", minWidth: 200 }}>
      <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
        style={{ paddingLeft: 32 }}
      />
    </div>
  );
}

const iconBtnStyle = {
  background: "none",
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: 6,
  cursor: "pointer",
  color: C.ink,
  display: "inline-flex",
};

const miniBtn = {
  fontFamily: FONT_BODY,
  fontSize: 12.5,
  fontWeight: 600,
  padding: "5px 12px",
  borderRadius: 5,
  border: "1.5px solid",
  cursor: "pointer",
};

/* ---------------------------------------------------------------
   AUTH — Login + Self registration
----------------------------------------------------------------*/
function LoginScreen({ data, onLogin, onRegisterSubmit }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const submitLogin = (e) => {
    e.preventDefault();
    const match = data.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!match) {
      setError("Invalid username or password.");
      return;
    }
    setError("");
    onLogin(match.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cover, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT_BODY }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: C.coverText }}>Campus Ledger</div>
          <div style={{ fontSize: 11.5, color: "#B8AD96", letterSpacing: "0.08em", marginTop: 3 }}>ENGINEERING COLLEGE REGISTER</div>
        </div>

        <div style={{ background: C.paper, borderRadius: 12, padding: 26, border: `1px solid ${C.coverSoft}` }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `2px solid ${C.border}` }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setRegSuccess(false); }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "transparent",
                  color: mode === m ? C.oxblood : C.inkSoft,
                  borderBottom: mode === m ? `2px solid ${C.oxblood}` : "2px solid transparent",
                  marginBottom: -2,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {m === "login" ? "Log in" : "Register"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={submitLogin}>
              <Field label="Username">
                <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" autoFocus />
              </Field>
              <Field label="Password">
                <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
              </Field>
              {error && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.rust, fontSize: 12.5, marginBottom: 12 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <Btn type="submit" style={{ width: "100%", justifyContent: "center" }}>Sign in</Btn>
              <p style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 16, lineHeight: 1.5 }}>
                First time here? Administrator sign-in — <strong>admin</strong> / <strong>admin123</strong>. Change this after logging in via "Change password".
                <br />Students and staff: use the Register tab to request an account.
              </p>
            </form>
          ) : regSuccess ? (
            <div style={{ textAlign: "center", padding: "20px 4px" }}>
              <Check size={30} color={C.teal} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 6 }}>Request submitted</div>
              <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>
                An administrator needs to approve your registration before you can log in.
              </p>
              <Btn variant="ghost" onClick={() => { setMode("login"); setRegSuccess(false); }}>Back to log in</Btn>
            </div>
          ) : (
            <RegisterForm data={data} onSubmit={(pending) => { onRegisterSubmit(pending); setRegSuccess(true); }} />
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ data, onSubmit }) {
  const [type, setType] = useState("student");
  const [form, setForm] = useState({
    name: "", branch: BRANCHES[0], semester: SEMESTERS[0], guardian: "", phone: "",
    role: "", department: DEPARTMENTS[0],
    username: "", password: "", confirm: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    if (type === "staff" && !form.role.trim()) return setError("Role / title is required.");
    if (!form.username.trim() || form.username.trim().length < 3) return setError("Choose a username (3+ characters).");
    if (!form.password || form.password.length < 4) return setError("Choose a password (4+ characters).");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (!usernameAvailable(data, form.username, null)) return setError("That username is already taken.");
    setError("");
    onSubmit({
      id: uid(),
      type,
      name: form.name.trim(),
      branch: form.branch,
      semester: form.semester,
      guardian: form.guardian,
      phone: form.phone,
      role: form.role,
      department: form.department,
      username: form.username.trim(),
      password: form.password,
      submittedDate: todayISO(),
    });
  };

  return (
    <form onSubmit={submit}>
      <Field label="I am a">
        <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
          <option value="student">Student</option>
          <option value="staff">Staff member</option>
        </SelectInput>
      </Field>
      <Field label="Full name">
        <TextInput value={form.name} onChange={set("name")} placeholder="Your full name" />
      </Field>

      {type === "student" ? (
        <>
          <Field label="Branch">
            <SelectInput value={form.branch} onChange={set("branch")}>
              {BRANCHES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
          <Field label="Semester">
            <SelectInput value={form.semester} onChange={set("semester")}>
              {SEMESTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
          <Field label="Guardian name">
            <TextInput value={form.guardian} onChange={set("guardian")} placeholder="Parent / guardian" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Role / title">
            <TextInput value={form.role} onChange={set("role")} placeholder="e.g. Assistant Professor" />
          </Field>
          <Field label="Department">
            <SelectInput value={form.department} onChange={set("department")}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectInput>
          </Field>
        </>
      )}

      <Field label="Phone">
        <TextInput value={form.phone} onChange={set("phone")} placeholder="Contact number" />
      </Field>
      <Field label="Choose a username">
        <TextInput value={form.username} onChange={set("username")} placeholder="username" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Password">
          <TextInput type="password" value={form.password} onChange={set("password")} />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" value={form.confirm} onChange={set("confirm")} />
        </Field>
      </div>
      {error && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.rust, fontSize: 12.5, marginBottom: 12 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <Btn type="submit" style={{ width: "100%", justifyContent: "center" }}>Submit for approval</Btn>
    </form>
  );
}

function SetupLoginModal({ person, roleType, data, persist, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    if (!username.trim() || username.trim().length < 3) return setError("Choose a username (3+ characters).");
    if (!password || password.length < 4) return setError("Choose a password (4+ characters).");
    if (password !== confirm) return setError("Passwords don't match.");
    if (!usernameAvailable(data, username, null)) return setError("That username is already taken.");
    persist({
      ...data,
      users: [...data.users, { id: uid(), username: username.trim(), password, role: roleType, linkedId: person.id, name: person.name }],
    });
    onClose();
  };

  return (
    <ModalShell title={`Set up login for ${person.name}`} onClose={onClose}>
      <Field label="Username">
        <TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm">
          <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
      </div>
      {error && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.rust, fontSize: 12.5, marginBottom: 12 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn icon={Check} onClick={save}>Create login</Btn>
      </div>
    </ModalShell>
  );
}

function ChangePasswordModal({ sessionUser, data, persist, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    if (current !== sessionUser.password) return setError("Current password is incorrect.");
    if (!next || next.length < 4) return setError("New password must be at least 4 characters.");
    if (next !== confirm) return setError("New passwords don't match.");
    persist({ ...data, users: data.users.map((u) => (u.id === sessionUser.id ? { ...u, password: next } : u)) });
    onClose();
  };

  return (
    <ModalShell title="Change password" onClose={onClose}>
      <Field label="Current password">
        <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
      </Field>
      <Field label="New password">
        <TextInput type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.rust, fontSize: 12.5, marginBottom: 12 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn icon={Check} onClick={save}>Update password</Btn>
      </div>
    </ModalShell>
  );
}

/* ---------------------------------------------------------------
   REGISTRATIONS (admin approval queue)
----------------------------------------------------------------*/
function ApproveStudentInline({ item, onConfirm, onCancel }) {
  const [rollNo, setRollNo] = useState("");
  const [error, setError] = useState("");
  return (
    <div style={{ marginTop: 10, padding: 12, background: C.paperDim, borderRadius: 8 }}>
      <Field label="Assign roll number">
        <TextInput value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="e.g. 21CS045" autoFocus />
      </Field>
      {error && <div style={{ color: C.rust, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => (rollNo.trim() ? onConfirm(rollNo.trim()) : setError("Roll number is required."))}>Confirm & enroll</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function RegistrationsView({ data, persist }) {
  const [approving, setApproving] = useState(null);
  const [confirmRejectId, setConfirmRejectId] = useState(null);

  const approveStudent = (item, rollNo) => {
    const sid = uid();
    const newStudent = { id: sid, name: item.name, branch: item.branch, semester: item.semester, rollNo, guardian: item.guardian, phone: item.phone, admissionDate: todayISO() };
    const newUser = { id: uid(), username: item.username, password: item.password, role: "student", linkedId: sid, name: item.name };
    persist({
      ...data,
      students: [...data.students, newStudent],
      users: [...data.users, newUser],
      pending: data.pending.filter((p) => p.id !== item.id),
    });
    setApproving(null);
  };

  const approveStaff = (item) => {
    const stid = uid();
    const newStaff = { id: stid, name: item.name, role: item.role, department: item.department, phone: item.phone, joinDate: todayISO() };
    const newUser = { id: uid(), username: item.username, password: item.password, role: "staff", linkedId: stid, name: item.name };
    persist({
      ...data,
      staff: [...data.staff, newStaff],
      users: [...data.users, newUser],
      pending: data.pending.filter((p) => p.id !== item.id),
    });
  };

  const reject = (id) => {
    persist({ ...data, pending: data.pending.filter((p) => p.id !== id) });
    setConfirmRejectId(null);
  };

  return (
    <div>
      <PageHeader title="Registrations" sub={`${data.pending.length} awaiting approval`} />
      {data.pending.length === 0 ? (
        <EmptyState label="Nothing pending" sub="New self-registrations from students and staff will appear here." />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {data.pending.map((item) => (
            <div key={item.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>{item.name}</span>
                    <Stamp tone={item.type === "student" ? "teal" : "gold"}>{item.type}</Stamp>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: FONT_BODY }}>
                    {item.type === "student" ? `${item.branch} · ${item.semester} · Guardian: ${item.guardian || "—"}` : `${item.role} · ${item.department}`}
                    {" · "}Phone: {item.phone || "—"} · Username: <span style={{ fontFamily: FONT_MONO }}>{item.username}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>Submitted {fmtDate(item.submittedDate)}</div>
                </div>
                {confirmRejectId === item.id ? (
                  <ConfirmRow label="Reject request?" onConfirm={() => reject(item.id)} onCancel={() => setConfirmRejectId(null)} />
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      icon={Check}
                      onClick={() => (item.type === "student" ? setApproving(item.id) : approveStaff(item))}
                    >
                      Approve
                    </Btn>
                    <Btn variant="danger" onClick={() => setConfirmRejectId(item.id)}>Reject</Btn>
                  </div>
                )}
              </div>
              {approving === item.id && (
                <ApproveStudentInline item={item} onConfirm={(rollNo) => approveStudent(item, rollNo)} onCancel={() => setApproving(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   STUDENTS
----------------------------------------------------------------*/
function StudentForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial || { name: "", branch: BRANCHES[0], semester: SEMESTERS[0], rollNo: "", guardian: "", phone: "", admissionDate: todayISO() }
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name.trim().length > 0 && form.rollNo.trim().length > 0;
  return (
    <div>
      <Field label="Full name">
        <TextInput value={form.name} onChange={set("name")} placeholder="Student's full name" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Branch">
          <SelectInput value={form.branch} onChange={set("branch")}>
            {BRANCHES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
        <Field label="Semester">
          <SelectInput value={form.semester} onChange={set("semester")}>
            {SEMESTERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
      </div>
      <Field label="Roll number">
        <TextInput value={form.rollNo} onChange={set("rollNo")} placeholder="e.g. 21CS045" />
      </Field>
      <Field label="Guardian name">
        <TextInput value={form.guardian} onChange={set("guardian")} placeholder="Parent / guardian" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Phone">
          <TextInput value={form.phone} onChange={set("phone")} placeholder="Contact number" />
        </Field>
        <Field label="Admission date">
          <TextInput type="date" value={form.admissionDate} onChange={set("admissionDate")} />
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" icon={Check} disabled={!valid} onClick={() => onSave(form)}>Save student</Btn>
      </div>
    </div>
  );
}

function StudentsView({ data, persist, mode }) {
  const [q, setQ] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [semFilter, setSemFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [loginTarget, setLoginTarget] = useState(null);
  const isAdmin = mode === "admin";

  const filtered = useMemo(() => {
    return data.students.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.rollNo.toLowerCase().includes(q.toLowerCase());
      const matchBranch = branchFilter === "All" || s.branch === branchFilter;
      const matchSem = semFilter === "All" || s.semester === semFilter;
      return matchQ && matchBranch && matchSem;
    });
  }, [data.students, q, branchFilter, semFilter]);

  const hasLogin = (id) => data.users.some((u) => u.linkedId === id);

  const addStudent = (form) => {
    persist({ ...data, students: [...data.students, { id: uid(), ...form }] });
    setModal(null);
  };
  const updateStudent = (id, form) => {
    persist({ ...data, students: data.students.map((s) => (s.id === id ? { ...s, ...form } : s)) });
    setModal(null);
  };
  const deleteStudent = (id) => {
    persist({
      ...data,
      students: data.students.filter((s) => s.id !== id),
      fees: data.fees.filter((f) => f.studentId !== id),
      attendance: data.attendance.filter((a) => a.studentId !== id),
      users: data.users.filter((u) => u.linkedId !== id),
    });
    setConfirmId(null);
  };

  const editingStudent = typeof modal === "string" && modal !== "add" ? data.students.find((s) => s.id === modal) : null;

  return (
    <div>
      <PageHeader
        title="Students"
        sub={`${data.students.length} enrolled`}
        action={isAdmin ? <Btn icon={Plus} onClick={() => setModal("add")}>Add student</Btn> : null}
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search by name or roll no." />
        <SelectInput value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ maxWidth: 210 }}>
          <option value="All">All branches</option>
          {BRANCHES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
        <SelectInput value={semFilter} onChange={(e) => setSemFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="All">All semesters</option>
          {SEMESTERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No students found" sub={data.students.length === 0 ? "Approved students will appear here." : "Try a different search or filter."} />
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
            <thead>
              <tr style={{ background: C.paperDim }}>
                {["Name", "Branch", "Semester", "Roll no.", "Guardian", "Phone", "Login", isAdmin ? "Actions" : null].filter((x) => x !== null).map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: C.ink, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.branch}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.semester}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.inkSoft, fontFamily: FONT_MONO }}>{s.rollNo}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.guardian || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink, fontFamily: FONT_MONO }}>{s.phone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {hasLogin(s.id) ? (
                      <Stamp tone="teal">Active</Stamp>
                    ) : isAdmin ? (
                      <button onClick={() => setLoginTarget(s)} style={{ ...miniBtn, background: "transparent", color: C.oxblood, borderColor: C.oxblood }}>Set up login</button>
                    ) : (
                      <Stamp tone="ink">None</Stamp>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "12px 16px" }}>
                      {confirmId === s.id ? (
                        <ConfirmRow label="Delete student?" onConfirm={() => deleteStudent(s.id)} onCancel={() => setConfirmId(null)} />
                      ) : (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => setModal(s.id)} style={iconBtnStyle} title="Edit"><Pencil size={15} /></button>
                          <button onClick={() => setConfirmId(s.id)} style={{ ...iconBtnStyle, color: C.rust }} title="Delete"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && modal === "add" && <ModalShell title="Add student" onClose={() => setModal(null)}><StudentForm onCancel={() => setModal(null)} onSave={addStudent} /></ModalShell>}
      {isAdmin && editingStudent && (
        <ModalShell title="Edit student" onClose={() => setModal(null)}>
          <StudentForm initial={editingStudent} onCancel={() => setModal(null)} onSave={(form) => updateStudent(editingStudent.id, form)} />
        </ModalShell>
      )}
      {isAdmin && loginTarget && (
        <SetupLoginModal person={loginTarget} roleType="student" data={data} persist={persist} onClose={() => setLoginTarget(null)} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   STAFF
----------------------------------------------------------------*/
function StaffForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial || { name: "", role: "", department: DEPARTMENTS[0], phone: "", joinDate: todayISO() }
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name.trim().length > 0 && form.role.trim().length > 0;
  return (
    <div>
      <Field label="Full name">
        <TextInput value={form.name} onChange={set("name")} placeholder="Staff member's name" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Role / title">
          <TextInput value={form.role} onChange={set("role")} placeholder="e.g. Assistant Professor" />
        </Field>
        <Field label="Department">
          <SelectInput value={form.department} onChange={set("department")}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectInput>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Phone">
          <TextInput value={form.phone} onChange={set("phone")} placeholder="Contact number" />
        </Field>
        <Field label="Joined on">
          <TextInput type="date" value={form.joinDate} onChange={set("joinDate")} />
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" icon={Check} disabled={!valid} onClick={() => onSave(form)}>Save staff</Btn>
      </div>
    </div>
  );
}

function StaffView({ data, persist }) {
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [loginTarget, setLoginTarget] = useState(null);

  const filtered = useMemo(() => {
    return data.staff.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.role.toLowerCase().includes(q.toLowerCase());
      const matchDept = deptFilter === "All" || s.department === deptFilter;
      return matchQ && matchDept;
    });
  }, [data.staff, q, deptFilter]);

  const hasLogin = (id) => data.users.some((u) => u.linkedId === id);

  const addStaff = (form) => {
    persist({ ...data, staff: [...data.staff, { id: uid(), ...form }] });
    setModal(null);
  };
  const updateStaff = (id, form) => {
    persist({ ...data, staff: data.staff.map((s) => (s.id === id ? { ...s, ...form } : s)) });
    setModal(null);
  };
  const deleteStaff = (id) => {
    persist({ ...data, staff: data.staff.filter((s) => s.id !== id), users: data.users.filter((u) => u.linkedId !== id) });
    setConfirmId(null);
  };

  const editing = typeof modal === "string" && modal !== "add" ? data.staff.find((s) => s.id === modal) : null;

  return (
    <div>
      <PageHeader title="Staff" sub={`${data.staff.length} on record`} action={<Btn icon={Plus} onClick={() => setModal("add")}>Add staff</Btn>} />
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search by name or role" />
        <SelectInput value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="All">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectInput>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No staff found" sub={data.staff.length === 0 ? "Approved staff will appear here." : "Try a different search or filter."} />
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
            <thead>
              <tr style={{ background: C.paperDim }}>
                {["Name", "Role", "Department", "Phone", "Joined", "Login", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: C.ink, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.role}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.department}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink, fontFamily: FONT_MONO }}>{s.phone || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.inkSoft }}>{fmtDate(s.joinDate)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {hasLogin(s.id) ? (
                      <Stamp tone="teal">Active</Stamp>
                    ) : (
                      <button onClick={() => setLoginTarget(s)} style={{ ...miniBtn, background: "transparent", color: C.oxblood, borderColor: C.oxblood }}>Set up login</button>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {confirmId === s.id ? (
                      <ConfirmRow label="Delete staff?" onConfirm={() => deleteStaff(s.id)} onCancel={() => setConfirmId(null)} />
                    ) : (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => setModal(s.id)} style={iconBtnStyle} title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => setConfirmId(s.id)} style={{ ...iconBtnStyle, color: C.rust }} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && <ModalShell title="Add staff" onClose={() => setModal(null)}><StaffForm onCancel={() => setModal(null)} onSave={addStaff} /></ModalShell>}
      {editing && (
        <ModalShell title="Edit staff" onClose={() => setModal(null)}>
          <StaffForm initial={editing} onCancel={() => setModal(null)} onSave={(form) => updateStaff(editing.id, form)} />
        </ModalShell>
      )}
      {loginTarget && <SetupLoginModal person={loginTarget} roleType="staff" data={data} persist={persist} onClose={() => setLoginTarget(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   FEES
----------------------------------------------------------------*/
function FeeForm({ students, onCancel, onSave }) {
  const [form, setForm] = useState({ studentId: students[0]?.id || "", term: "Term 1", amount: "", dueDate: todayISO() });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.studentId && Number(form.amount) > 0;
  return (
    <div>
      <Field label="Student">
        <SelectInput value={form.studentId} onChange={set("studentId")}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.branch} · {s.semester}</option>)}
        </SelectInput>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Term / label">
          <TextInput value={form.term} onChange={set("term")} placeholder="e.g. Term 1" />
        </Field>
        <Field label="Amount (₹)">
          <TextInput type="number" min="0" value={form.amount} onChange={set("amount")} placeholder="0" />
        </Field>
      </div>
      <Field label="Due date">
        <TextInput type="date" value={form.dueDate} onChange={set("dueDate")} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" icon={Check} disabled={!valid} onClick={() => onSave({ ...form, amount: Number(form.amount) })}>Save fee record</Btn>
      </div>
    </div>
  );
}

function FeesView({ data, persist, canDelete }) {
  const [modal, setModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const studentMap = useMemo(() => {
    const m = {};
    data.students.forEach((s) => (m[s.id] = s));
    return m;
  }, [data.students]);

  const rows = useMemo(() => {
    return data.fees
      .map((f) => ({ ...f, student: studentMap[f.studentId] }))
      .filter((f) => f.student)
      .filter((f) => statusFilter === "All" || f.status === statusFilter)
      .filter((f) => !q || f.student.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
  }, [data.fees, studentMap, statusFilter, q]);

  const totals = useMemo(() => {
    const paid = data.fees.filter((f) => f.status === "paid").reduce((a, f) => a + Number(f.amount || 0), 0);
    const pending = data.fees.filter((f) => f.status === "pending").reduce((a, f) => a + Number(f.amount || 0), 0);
    return { paid, pending };
  }, [data.fees]);

  const addFee = (form) => {
    persist({ ...data, fees: [...data.fees, { id: uid(), status: "pending", paidDate: null, ...form }] });
    setModal(false);
  };
  const toggleStatus = (id) => {
    persist({
      ...data,
      fees: data.fees.map((f) => f.id === id ? (f.status === "paid" ? { ...f, status: "pending", paidDate: null } : { ...f, status: "paid", paidDate: todayISO() }) : f),
    });
  };
  const deleteFee = (id) => {
    persist({ ...data, fees: data.fees.filter((f) => f.id !== id) });
    setConfirmId(null);
  };

  return (
    <div>
      <PageHeader
        title="Fees"
        sub={`${fmtMoney(totals.paid)} collected · ${fmtMoney(totals.pending)} pending`}
        action={<Btn icon={Plus} onClick={() => setModal(true)} disabled={data.students.length === 0}>Add fee record</Btn>}
      />
      {data.students.length === 0 ? (
        <EmptyState label="No students yet" sub="Fee records are linked to a student." />
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <SearchBox value={q} onChange={setQ} placeholder="Search by student name" />
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="All">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </SelectInput>
          </div>

          {rows.length === 0 ? (
            <EmptyState label="No fee records" sub="Try a different filter, or add a fee record." />
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
                <thead>
                  <tr style={{ background: C.paperDim }}>
                    {["Student", "Term", "Amount", "Due date", "Status", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: C.ink, fontWeight: 600 }}>{f.student.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{f.term}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink, fontFamily: FONT_MONO }}>{fmtMoney(f.amount)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.inkSoft }}>{fmtDate(f.dueDate)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => toggleStatus(f.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} title="Toggle status">
                          <Stamp tone={f.status === "paid" ? "teal" : "gold"}>{f.status === "paid" ? "Paid" : "Pending"}</Stamp>
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {canDelete && (confirmId === f.id ? (
                          <ConfirmRow label="Delete record?" onConfirm={() => deleteFee(f.id)} onCancel={() => setConfirmId(null)} />
                        ) : (
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setConfirmId(f.id)} style={{ ...iconBtnStyle, color: C.rust }} title="Delete"><Trash2 size={15} /></button>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {modal && <ModalShell title="Add fee record" onClose={() => setModal(false)}><FeeForm students={data.students} onCancel={() => setModal(false)} onSave={addFee} /></ModalShell>}
    </div>
  );
}

/* ---------------------------------------------------------------
   ATTENDANCE
----------------------------------------------------------------*/
function AttendanceView({ data, persist }) {
  const [date, setDate] = useState(todayISO());
  const [q, setQ] = useState("");

  const recordsForDate = useMemo(() => {
    const m = {};
    data.attendance.filter((a) => a.date === date).forEach((a) => (m[a.studentId] = a));
    return m;
  }, [data.attendance, date]);

  const students = useMemo(
    () => data.students.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase())),
    [data.students, q]
  );

  const mark = (studentId, status) => {
    const existing = data.attendance.find((a) => a.studentId === studentId && a.date === date);
    if (existing && existing.status === status) {
      persist({ ...data, attendance: data.attendance.filter((a) => a.id !== existing.id) });
    } else if (existing) {
      persist({ ...data, attendance: data.attendance.map((a) => (a.id === existing.id ? { ...a, status } : a)) });
    } else {
      persist({ ...data, attendance: [...data.attendance, { id: uid(), studentId, date, status }] });
    }
  };

  const present = Object.values(recordsForDate).filter((r) => r.status === "present").length;
  const absent = Object.values(recordsForDate).filter((r) => r.status === "absent").length;

  const last7 = useMemo(() => {
    const days = [...Array(7)].map((_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
    return data.students.map((s) => {
      const recs = data.attendance.filter((a) => a.studentId === s.id && days.includes(a.date));
      const p = recs.filter((r) => r.status === "present").length;
      const pct = recs.length ? Math.round((p / recs.length) * 100) : null;
      return { id: s.id, name: s.name, pct, marked: recs.length };
    });
  }, [data.students, data.attendance]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        sub={data.students.length ? `${present} present · ${absent} absent · ${data.students.length - present - absent} unmarked` : "No students yet"}
        action={<TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />}
      />

      {data.students.length === 0 ? (
        <EmptyState label="No students yet" sub="Attendance is tracked per student." />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <SearchBox value={q} onChange={setQ} placeholder="Search students" />
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
              <thead>
                <tr style={{ background: C.paperDim }}>
                  {["Student", "Branch / Sem", "Mark"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const rec = recordsForDate[s.id];
                  return (
                    <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: C.ink, fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{s.branch} · {s.semester}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => mark(s.id, "present")} style={{ ...miniBtn, background: rec?.status === "present" ? C.teal : "transparent", color: rec?.status === "present" ? "#fff" : C.teal, borderColor: C.teal }}>Present</button>
                          <button onClick={() => mark(s.id, "absent")} style={{ ...miniBtn, background: rec?.status === "absent" ? C.rust : "transparent", color: rec?.status === "absent" ? "#fff" : C.rust, borderColor: C.rust }}>Absent</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 10 }}>Last 7 days</h3>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
              <thead>
                <tr style={{ background: C.paperDim }}>
                  {["Student", "Attendance", "Days marked"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {last7.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 16px", fontSize: 13.5, color: C.ink }}>{r.name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13.5, color: C.ink, fontFamily: FONT_MONO }}>{r.pct === null ? "—" : `${r.pct}%`}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: C.inkSoft }}>{r.marked} / 7</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD (admin & staff)
----------------------------------------------------------------*/
function DashboardView({ data }) {
  const today = todayISO();
  const thisMonth = monthKey(today);
  const collectedThisMonth = data.fees.filter((f) => f.status === "paid" && monthKey(f.paidDate) === thisMonth).reduce((a, f) => a + Number(f.amount || 0), 0);
  const pendingTotal = data.fees.filter((f) => f.status === "pending").reduce((a, f) => a + Number(f.amount || 0), 0);
  const todayRecords = data.attendance.filter((a) => a.date === today);
  const presentToday = todayRecords.filter((r) => r.status === "present").length;
  const attendancePct = todayRecords.length ? Math.round((presentToday / todayRecords.length) * 100) : null;
  const studentMap = {};
  data.students.forEach((s) => (studentMap[s.id] = s));
  const overdueFees = data.fees.filter((f) => f.status === "pending" && f.dueDate <= today).map((f) => ({ ...f, student: studentMap[f.studentId] })).filter((f) => f.student).slice(0, 5);
  const absentToday = todayRecords.filter((r) => r.status === "absent").map((r) => studentMap[r.studentId]).filter(Boolean).slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" sub={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 30 }}>
        <StatCard label="Students" value={data.students.length} sub="Total enrolled" tone="oxblood" />
        <StatCard label="Staff" value={data.staff.length} sub="On record" tone="oxblood" />
        <StatCard label="Collected this month" value={fmtMoney(collectedThisMonth)} sub={`${fmtMoney(pendingTotal)} pending overall`} tone="teal" />
        <StatCard label="Attendance today" value={attendancePct === null ? "—" : `${attendancePct}%`} sub={todayRecords.length ? `${presentToday} of ${todayRecords.length} marked` : "Not marked yet"} tone="gold" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 10 }}>Fees due or overdue</h3>
          {overdueFees.length === 0 ? <EmptyState label="All clear" sub="No pending fees due yet." /> : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              {overdueFees.map((f, i) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${C.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: FONT_BODY }}>{f.student.name}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: FONT_BODY }}>Due {fmtDate(f.dueDate)}</div>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13.5, color: C.rust, fontWeight: 700 }}>{fmtMoney(f.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 10 }}>Absent today</h3>
          {absentToday.length === 0 ? <EmptyState label="No absences logged" sub="Mark attendance from the Attendance tab." /> : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              {absentToday.map((s, i) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: FONT_BODY }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: FONT_BODY }}>{s.branch} · {s.semester}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PORTALS — student's / staff's own record
----------------------------------------------------------------*/
function ProfileCard({ rows, title }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 26 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: C.inkSoft, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 14.5, color: C.ink, marginTop: 2, fontFamily: FONT_BODY }}>{value || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentPortal({ data, sessionUser }) {
  const student = data.students.find((s) => s.id === sessionUser.linkedId);
  if (!student) {
    return <EmptyState label="Record not found" sub="Your student record may have been removed. Contact the administrator." />;
  }
  const myFees = data.fees.filter((f) => f.studentId === student.id).sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
  const myAttendance = data.attendance.filter((a) => a.studentId === student.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const presentCount = myAttendance.filter((a) => a.status === "present").length;
  const overallPct = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : null;

  return (
    <div>
      <PageHeader title={`Welcome, ${student.name}`} sub={`${student.branch} · ${student.semester} · Roll no. ${student.rollNo}`} />
      <ProfileCard
        title="My profile"
        rows={[["Branch", student.branch], ["Semester", student.semester], ["Roll number", student.rollNo], ["Guardian", student.guardian], ["Phone", student.phone], ["Admission date", fmtDate(student.admissionDate)]]}
      />

      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 10 }}>My fees</h3>
      {myFees.length === 0 ? <EmptyState label="No fee records yet" /> : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 26 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
            <thead>
              <tr style={{ background: C.paperDim }}>
                {["Term", "Amount", "Due date", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myFees.map((f) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink }}>{f.term}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: C.ink, fontFamily: FONT_MONO }}>{fmtMoney(f.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.inkSoft }}>{fmtDate(f.dueDate)}</td>
                  <td style={{ padding: "12px 16px" }}><Stamp tone={f.status === "paid" ? "teal" : "gold"}>{f.status === "paid" ? "Paid" : "Pending"}</Stamp></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, marginBottom: 10 }}>My attendance {overallPct !== null && <span style={{ fontSize: 13, color: C.inkSoft, fontFamily: FONT_BODY }}>· {overallPct}% overall</span>}</h3>
      {myAttendance.length === 0 ? <EmptyState label="No attendance recorded yet" /> : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY }}>
            <thead>
              <tr style={{ background: C.paperDim }}>
                {["Date", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkSoft, padding: "10px 16px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myAttendance.slice(0, 20).map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 16px", fontSize: 13.5, color: C.ink }}>{fmtDate(a.date)}</td>
                  <td style={{ padding: "10px 16px" }}><Stamp tone={a.status === "present" ? "teal" : "rust"}>{a.status}</Stamp></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StaffPortal({ data, sessionUser }) {
  const staff = data.staff.find((s) => s.id === sessionUser.linkedId);
  if (!staff) {
    return <EmptyState label="Record not found" sub="Your staff record may have been removed. Contact the administrator." />;
  }
  return (
    <div>
      <PageHeader title="My profile" />
      <ProfileCard
        title={staff.name}
        rows={[["Role", staff.role], ["Department", staff.department], ["Phone", staff.phone], ["Joined on", fmtDate(staff.joinDate)]]}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   APP SHELL
----------------------------------------------------------------*/
const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "Students", icon: GraduationCap },
  { key: "staff", label: "Staff", icon: Users },
  { key: "fees", label: "Fees", icon: Wallet },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "registrations", label: "Registrations", icon: ClipboardList },
];
const STAFF_NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "Students", icon: GraduationCap },
  { key: "fees", label: "Fees", icon: Wallet },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "profile", label: "My profile", icon: UserCircle2 },
];
const STUDENT_NAV = [{ key: "portal", label: "My portal", icon: UserCircle2 }];

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await window.storage.get("ims-records", true);
        if (!mounted) return;
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          const merged = { ...emptyData(), ...parsed };
          if (!merged.users || merged.users.length === 0) merged.users = [bootstrapAdmin()];
          setData(merged);
        } else {
          const fresh = emptyData();
          setData(fresh);
          window.storage.set("ims-records", JSON.stringify(fresh), true).catch(() => {});
        }
      } catch (e) {
        if (mounted) setData(emptyData());
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    try {
      const res = await window.storage.set("ims-records", JSON.stringify(next), true);
      setSaveErr(!res);
    } catch (e) {
      setSaveErr(true);
    }
  }, []);

  const sessionUser = data ? data.users.find((u) => u.id === currentUserId) : null;

  useEffect(() => {
    if (data && currentUserId && !sessionUser) setCurrentUserId(null);
  }, [data, currentUserId, sessionUser]);

  useEffect(() => {
    if (!sessionUser) { setTab(null); return; }
    if (sessionUser.role === "admin") setTab("dashboard");
    else if (sessionUser.role === "staff") setTab("dashboard");
    else setTab("portal");
  }, [sessionUser?.id]);

  const registerSubmit = (pending) => {
    persist({ ...data, pending: [...data.pending, pending] });
  };

  const resetAll = async () => {
    setConfirmReset(false);
    const fresh = emptyData();
    setCurrentUserId(null);
    setData(fresh);
    try { await window.storage.set("ims-records", JSON.stringify(fresh), true); } catch (e) { setSaveErr(true); }
  };

  if (loading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400, background: C.paper, fontFamily: FONT_BODY, color: C.inkSoft }}>
        <Loader2 size={20} style={{ marginRight: 8 }} />
        Opening the ledger…
      </div>
    );
  }

  if (!sessionUser) {
    return <LoginScreen data={data} onLogin={setCurrentUserId} onRegisterSubmit={registerSubmit} />;
  }

  const nav = sessionUser.role === "admin" ? ADMIN_NAV : sessionUser.role === "staff" ? STAFF_NAV : STUDENT_NAV;
  const pendingCount = data.pending.length;

  return (
    <div style={{ display: "flex", minHeight: 600, background: C.paper, fontFamily: FONT_BODY }}>
      <div style={{ width: 220, background: C.cover, color: C.coverText, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.coverSoft}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21 }}>Campus Ledger</div>
          <div style={{ fontSize: 11, color: "#B8AD96", marginTop: 2, letterSpacing: "0.04em" }}>ENGINEERING COLLEGE REGISTER</div>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.coverSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            {sessionUser.role === "admin" && <ShieldCheck size={14} color="#D8B98A" />}
            <span style={{ fontSize: 14, fontWeight: 700 }}>{sessionUser.name}</span>
          </div>
          <div style={{ fontSize: 11, color: "#B8AD96", textTransform: "capitalize" }}>{sessionUser.role}</div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {nav.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            const count = key === "registrations" ? pendingCount : null;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 7, border: "none", cursor: "pointer",
                  background: active ? C.oxblood : "transparent", color: active ? "#fff" : C.coverText, fontSize: 13.5, fontFamily: FONT_BODY, fontWeight: active ? 700 : 500, textAlign: "left",
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                {count !== null && count > 0 && (
                  <span style={{ fontSize: 11, fontFamily: FONT_MONO, background: active ? "rgba(255,255,255,0.2)" : C.coverSoft, padding: "1px 6px", borderRadius: 10 }}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderTop: `1px solid ${C.coverSoft}`, display: "flex", flexDirection: "column", gap: 4 }}>
          <button onClick={() => setShowPwModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "#B8AD96", fontSize: 12, cursor: "pointer", padding: 4, textAlign: "left" }}>
            <KeyRound size={13} /> Change password
          </button>
          <button onClick={() => setCurrentUserId(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "#B8AD96", fontSize: 12, cursor: "pointer", padding: 4, textAlign: "left" }}>
            <LogOut size={13} /> Log out
          </button>
          {sessionUser.role === "admin" && (
            confirmReset ? (
              <div style={{ fontSize: 12, color: "#DDBF9A", marginTop: 4 }}>
                <div style={{ marginBottom: 6 }}>Clear all data? This removes every account except a fresh admin login.</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={resetAll} style={{ ...miniBtn, background: C.rust, color: "#fff", borderColor: C.rust }}>Yes, clear</button>
                  <button onClick={() => setConfirmReset(false)} style={{ ...miniBtn, background: "transparent", color: C.coverText, borderColor: C.coverSoft }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "#B8AD96", fontSize: 12, cursor: "pointer", padding: 4, textAlign: "left" }}>
                <RotateCcw size={13} /> Clear all data
              </button>
            )
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
        {saveErr && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FBEAE7", border: `1px solid ${C.rust}`, color: C.rust, borderRadius: 8, padding: "9px 14px", fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={15} /> Changes couldn't be saved to storage. They'll be lost on reload.
          </div>
        )}

        {sessionUser.role === "admin" && tab === "dashboard" && <DashboardView data={data} />}
        {sessionUser.role === "admin" && tab === "students" && <StudentsView data={data} persist={persist} mode="admin" />}
        {sessionUser.role === "admin" && tab === "staff" && <StaffView data={data} persist={persist} />}
        {sessionUser.role === "admin" && tab === "fees" && <FeesView data={data} persist={persist} canDelete />}
        {sessionUser.role === "admin" && tab === "attendance" && <AttendanceView data={data} persist={persist} />}
        {sessionUser.role === "admin" && tab === "registrations" && <RegistrationsView data={data} persist={persist} />}

        {sessionUser.role === "staff" && tab === "dashboard" && <DashboardView data={data} />}
        {sessionUser.role === "staff" && tab === "students" && <StudentsView data={data} persist={persist} mode="staff" />}
        {sessionUser.role === "staff" && tab === "fees" && <FeesView data={data} persist={persist} canDelete={false} />}
        {sessionUser.role === "staff" && tab === "attendance" && <AttendanceView data={data} persist={persist} />}
        {sessionUser.role === "staff" && tab === "profile" && <StaffPortal data={data} sessionUser={sessionUser} />}

        {sessionUser.role === "student" && tab === "portal" && <StudentPortal data={data} sessionUser={sessionUser} />}
      </div>

      {showPwModal && <ChangePasswordModal sessionUser={sessionUser} data={data} persist={persist} onClose={() => setShowPwModal(false)} />}
    </div>
  );
}

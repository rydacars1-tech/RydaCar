import { useMemo, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import { getAdminSnapshot, readJsonArray, writeJsonArray } from "./admin/adminData.js";

const USERS_STORAGE_KEY = "ryda.admin.users.v1";

const DEFAULT_USERS = [
  {
    id: "drv-1",
    role: "Driver",
    name: "Adeel Khan",
    phone: "+92 300 5556677",
    email: "adeel.driver@ryda.local",
    status: "Active",
    vehicle: "TX-1024",
    lastSeen: "2 min ago"
  },
  {
    id: "drv-2",
    role: "Driver",
    name: "Hamza Ali",
    phone: "+92 321 4402244",
    email: "hamza.driver@ryda.local",
    status: "Active",
    vehicle: "TX-3310",
    lastSeen: "18 min ago"
  },
  {
    id: "drv-3",
    role: "Driver",
    name: "Bilal Ahmed",
    phone: "+92 333 8877665",
    email: "bilal.driver@ryda.local",
    status: "Pending",
    vehicle: "Unassigned",
    lastSeen: "Awaiting setup"
  },
  {
    id: "adm-1",
    role: "Sub Admin",
    name: "Sarah Noor",
    phone: "+92 302 4112233",
    email: "sarah.admin@ryda.local",
    status: "Active",
    vehicle: "Admin access",
    lastSeen: "Online now"
  },
  {
    id: "adm-2",
    role: "Sub Admin",
    name: "Muneeb Hassan",
    phone: "+92 345 9090909",
    email: "muneeb.admin@ryda.local",
    status: "Inactive",
    vehicle: "Admin access",
    lastSeen: "3 days ago"
  }
];

function readUsers() {
  const stored = readJsonArray(USERS_STORAGE_KEY);
  return stored.length > 0 ? stored : DEFAULT_USERS;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function UserManagementPage() {
  const [users, setUsers] = useState(() => readUsers());
  const [searchValue, setSearchValue] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchValue.trim().toLowerCase();
      const matchesSearch = query
        ? [user.name, user.phone, user.email, user.vehicle, user.role, user.status].some((value) =>
            String(value).toLowerCase().includes(query)
          )
        : true;

      return matchesSearch;
    });
  }, [users, searchValue]);

  const counts = useMemo(() => {
    const drivers = users.filter((user) => user.role === "Driver").length;
    const subAdmins = users.filter((user) => user.role === "Sub Admin").length;
    const active = users.filter((user) => user.status === "Active").length;
    return { drivers, subAdmins, active };
  }, [users]);
  const snapshot = useMemo(() => getAdminSnapshot(), []);

  function resetForm() {
    setFormValues({ name: "", email: "", password: "" });
    setErrors({});
  }

  function closeModal() {
    setCreateModalOpen(false);
    setSubmitting(false);
    resetForm();
  }

  function validateForm() {
    const nextErrors = {};
    if (!formValues.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(formValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    } else if (users.some((user) => user.email.toLowerCase() === formValues.email.trim().toLowerCase())) {
      nextErrors.email = "This email already exists.";
    }

    if (!formValues.password) {
      nextErrors.password = "Password is required.";
    } else if (formValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextSubAdminId() {
    const count = users.filter((user) => user.role === "Sub Admin").length + 1;
    return `adm-${Date.now()}-${count}`;
  }

  function handleCreateSubAdmin(event) {
    event.preventDefault();
    setFeedback("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    window.setTimeout(() => {
      const email = formValues.email.trim().toLowerCase();
      const nextUser = {
        id: nextSubAdminId(),
        role: "Sub Admin",
        name: formValues.name.trim(),
        phone: "Not assigned",
        email,
        status: "Active",
        vehicle: "Admin access",
        lastSeen: "Just created"
      };

      const nextUsers = [nextUser, ...users];
      setUsers(nextUsers);
      writeJsonArray(USERS_STORAGE_KEY, nextUsers);
      setSubmitting(false);
      setFeedback("Sub admin created successfully.");
      closeModal();
    }, 350);
  }

  return (
    <AdminShell
      activeNav="users"
      openBookingsCount={snapshot.totals.open}
      title="User Management"
      actions={
        <button type="button" className="admin-primary-button" onClick={() => setCreateModalOpen(true)}>
          Add Sub Admin
        </button>
      }
    >
      <section className="admin-panel-card">
        <div className="admin-section-head">
          <div>
            <div className="admin-section-title">Users list</div>
          </div>
          <div className="admin-toolbar admin-toolbar-end">
            <input
              className="admin-input admin-input-search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name, email, phone, role, access"
            />
          </div>
        </div>

        <div className="admin-users-toolbar">
          <div className="admin-users-inline-stats">
            <span>{users.length} users</span>
            <span>{counts.drivers} drivers</span>
            <span>{counts.subAdmins} sub admins</span>
            <span>{counts.active} active</span>
          </div>
          {feedback ? <div className="admin-inline-feedback admin-inline-feedback-tight">{feedback}</div> : null}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-title">No users found</div>
            <div className="admin-empty-state-copy">Try another search term or create a new sub admin.</div>
          </div>
        ) : (
          <div className="admin-table-wrap admin-table-wrap-rich">
            <table className="admin-table admin-users-table">
              <thead>
                <tr>
                  <th>Users</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="admin-users-row">
                    <td>
                      <div className="admin-user-copy">
                        <div className="admin-table-title">{user.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className={user.role === "Driver" ? "admin-status-badge admin-status-badge-open" : "admin-status-badge admin-status-badge-done"}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.phone}</td>
                    <td>{user.email}</td>
                    <td>{user.vehicle}</td>
                    <td>
                      <span
                        className={
                          user.status === "Active"
                            ? "admin-status-badge admin-status-badge-done"
                            : user.status === "Pending"
                              ? "admin-status-badge admin-status-badge-open"
                              : "admin-status-badge"
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>
            <div className="modal-title">Add Sub Admin</div>
            <div className="modal-text">Create a new delegated admin account with the enforced sub-admin role.</div>

            <form className="form" onSubmit={handleCreateSubAdmin}>
              <div className="form-field">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={formValues.name}
                  onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Required"
                />
                {errors.name ? <div className="form-error">{errors.name}</div> : null}
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@example.com"
                />
                {errors.email ? <div className="form-error">{errors.email}</div> : null}
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={formValues.password}
                  onChange={(event) => setFormValues((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 6 characters"
                />
                {errors.password ? <div className="form-error">{errors.password}</div> : null}
              </div>

              <button type="submit" className="form-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create sub admin"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default UserManagementPage;

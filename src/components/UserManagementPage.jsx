import { useMemo, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import { formatDateTime } from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function UserManagementPage() {
  const { authenticatedRequest, user: sessionUser } = useAdminAuth();
  const [searchValue, setSearchValue] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const {
    data: userPageData,
    error: loadError,
    isLoading,
    isFetching,
    mutate
  } = useCachedResource({
    userId: sessionUser?.id,
    cacheKey: "users:management",
    fetcher: async () => {
      const [driversPayload, adminsPayload, statsPayload] = await Promise.all([
        authenticatedRequest("/users/drivers", { method: "GET" }),
        authenticatedRequest("/auth/admin-users", { method: "GET" }),
        authenticatedRequest("/dashboard/admin", { method: "GET" })
      ]);

      const mappedDrivers = (driversPayload.data?.items || []).map((driver) => ({
        id: driver.id,
        role: "Driver",
        name: driver.name,
        phone: driver.phone || "",
        email: driver.email,
        status: driver.status === "active" ? "Active" : "Inactive",
        vehicle: driver.vehicleNumber || "Unassigned",
        lastSeen: driver.createdAt ? formatDateTime(driver.createdAt) : "Recently added"
      }));

      const mappedAdmins = (adminsPayload.data || []).map((adminUser) => ({
        id: adminUser.id,
        role: adminUser.role === "super_admin" ? "Super Admin" : "Sub Admin",
        name: adminUser.name,
        phone: adminUser.phone || "",
        email: adminUser.email,
        status: adminUser.status === "active" ? "Active" : "Inactive",
        vehicle: "Admin access",
        lastSeen: adminUser.createdAt ? formatDateTime(adminUser.createdAt) : "Recently added"
      }));

      return {
        users: [...mappedAdmins, ...mappedDrivers],
        openBookingsCount: Number(statsPayload.data?.pendingBookings || 0)
      };
    },
    staleTime: 60_000,
    emptyValue: { users: [], openBookingsCount: 0 },
    errorMessage: "Unable to load users."
  });
  const users = userPageData.users || [];
  const openBookingsCount = userPageData.openBookingsCount || 0;

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

  async function handleCreateSubAdmin(event) {
    event.preventDefault();
    setFeedback("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = await authenticatedRequest("/auth/sub-admins", {
        method: "POST",
        body: JSON.stringify({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          phone: ""
        })
      });

      const nextUser = {
        id: payload.data.id,
        role: "Sub Admin",
        name: payload.data.name,
        phone: payload.data.phone || "",
        email: payload.data.email,
        status: payload.data.status === "active" ? "Active" : "Inactive",
        vehicle: "Admin access",
        lastSeen: payload.data.createdAt ? formatDateTime(payload.data.createdAt) : "Just created"
      };

      mutate((current) => ({
        ...current,
        users: [nextUser, ...current.users]
      }));
      setFeedback("Sub admin created successfully.");
      closeModal();
    } catch (error) {
      setFeedback(error?.message || "Unable to create sub admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell
      activeNav="users"
      openBookingsCount={openBookingsCount}
      title="User Management"
      actions={
        sessionUser?.role === "super_admin" ? (
          <button type="button" className="admin-primary-button" onClick={() => setCreateModalOpen(true)}>
            Add Sub Admin
          </button>
        ) : null
      }
      mobilePrimaryAction={
        sessionUser?.role === "super_admin" ? (
          <button type="button" className="admin-primary-button" onClick={() => setCreateModalOpen(true)}>
            Add Admin
          </button>
        ) : null
      }
    >
      <section className="admin-panel-card">
        {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing users and roles..." /> : null}

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
          {feedback || loadError ? <div className="admin-inline-feedback admin-inline-feedback-tight">{feedback || loadError}</div> : null}
        </div>

        {isLoading ? (
          <div className="admin-loading-state">
            <LoadingBlock title="Loading users" copy="Fetching admin accounts, drivers, and access levels." compact />
          </div>
        ) : filteredUsers.length === 0 ? (
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

      {createModalOpen && sessionUser?.role === "super_admin" ? (
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

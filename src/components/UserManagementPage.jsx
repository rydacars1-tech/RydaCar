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
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });
  const [editFormValues, setEditFormValues] = useState({ name: "", email: "", phone: "", password: "" });
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

  function resetForm() {
    setFormValues({ name: "", email: "", password: "" });
    setErrors({});
  }

  function resetEditForm() {
    setEditFormValues({ name: "", email: "", phone: "", password: "" });
    setErrors({});
  }

  function closeModal() {
    setCreateModalOpen(false);
    setSubmitting(false);
    resetForm();
  }

  function openEditModal(user) {
    setEditUser(user);
    setEditFormValues({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: ""
    });
    setErrors({});
  }

  function closeEditModal() {
    setEditUser(null);
    setActionSubmitting(false);
    resetEditForm();
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

  function validateEditForm() {
    const nextErrors = {};
    if (!editFormValues.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!editFormValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(editFormValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    } else if (
      users.some((user) => user.id !== editUser?.id && String(user.email || "").toLowerCase() === editFormValues.email.trim().toLowerCase())
    ) {
      nextErrors.email = "This email already exists.";
    }

    if (editFormValues.password && editFormValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleUpdateAdmin(event) {
    event.preventDefault();
    setFeedback("");

    if (!editUser || !validateEditForm()) {
      return;
    }

    setActionSubmitting(true);

    try {
      const payload = await authenticatedRequest(`/auth/admin-users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editFormValues.name.trim(),
          email: editFormValues.email.trim().toLowerCase(),
          phone: editFormValues.phone.trim(),
          ...(editFormValues.password ? { password: editFormValues.password } : {})
        })
      });

      const updatedUser = {
        ...editUser,
        id: payload.data.id,
        name: payload.data.name,
        email: payload.data.email,
        phone: payload.data.phone || "",
        role: payload.data.role === "super_admin" ? "Super Admin" : "Sub Admin",
        status: payload.data.status === "active" ? "Active" : "Inactive",
        lastSeen: payload.data.updatedAt ? formatDateTime(payload.data.updatedAt) : editUser.lastSeen
      };

      mutate((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user))
      }));
      setFeedback("Admin updated successfully.");
      closeEditModal();
    } catch (error) {
      setFeedback(error?.message || "Unable to update admin.");
      setActionSubmitting(false);
    }
  }

  async function handleDeleteAdmin() {
    if (!deleteUser) {
      return;
    }

    setActionSubmitting(true);
    setFeedback("");

    try {
      await authenticatedRequest(`/auth/admin-users/${deleteUser.id}`, {
        method: "DELETE"
      });

      mutate((current) => ({
        ...current,
        users: current.users.filter((user) => user.id !== deleteUser.id)
      }));
      setDeleteUser(null);
      setActionSubmitting(false);
      setFeedback("Admin deleted successfully.");
    } catch (error) {
      setFeedback(error?.message || "Unable to delete admin.");
      setActionSubmitting(false);
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

        {feedback || loadError ? <div className="admin-inline-feedback admin-inline-feedback-tight">{feedback || loadError}</div> : null}

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
                  {sessionUser?.role === "super_admin" ? <th>Actions</th> : null}
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
                    {sessionUser?.role === "super_admin" ? (
                      <td>
                        {user.role !== "Driver" ? (
                          <div className="admin-row-actions admin-row-actions-compact">
                            <button type="button" className="admin-table-action admin-table-action-icon" onClick={() => openEditModal(user)}>
                              Edit
                            </button>
                            {user.role !== "Super Admin" ? (
                              <button type="button" className="admin-table-action admin-table-action-danger" onClick={() => setDeleteUser(user)}>
                                Delete
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="admin-table-muted">Driver account</span>
                        )}
                      </td>
                    ) : null}
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

      {editUser && sessionUser?.role === "super_admin" ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={closeEditModal} aria-label="Close">
              ×
            </button>
            <div className="modal-title">Edit Admin</div>
            <div className="modal-text">Only the main admin can edit admin account details. Leave password blank to keep the current password.</div>

            <form className="form" onSubmit={handleUpdateAdmin}>
              <div className="form-field">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editFormValues.name}
                  onChange={(event) => setEditFormValues((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Required"
                />
                {errors.name ? <div className="form-error">{errors.name}</div> : null}
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={editFormValues.email}
                  onChange={(event) => setEditFormValues((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@example.com"
                />
                {errors.email ? <div className="form-error">{errors.email}</div> : null}
              </div>

              <div className="form-field">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={editFormValues.phone}
                  onChange={(event) => setEditFormValues((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={editFormValues.password}
                  onChange={(event) => setEditFormValues((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Leave blank to keep current password"
                />
                {errors.password ? <div className="form-error">{errors.password}</div> : null}
              </div>

              <button type="submit" className="form-primary" disabled={actionSubmitting}>
                {actionSubmitting ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {deleteUser && sessionUser?.role === "super_admin" ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={() => setDeleteUser(null)} aria-label="Close">
              ×
            </button>
            <div className="modal-title">Delete Admin</div>
            <div className="modal-text">Only the main admin can delete sub admin accounts. This action removes the admin from the list.</div>
            <div className="modal-actions">
              <button type="button" className="admin-ghost-button" onClick={() => setDeleteUser(null)} disabled={actionSubmitting}>
                Cancel
              </button>
              <button type="button" className="admin-danger-button" onClick={handleDeleteAdmin} disabled={actionSubmitting}>
                {actionSubmitting ? "Deleting..." : "Delete admin"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default UserManagementPage;

import { useEffect, useMemo, useState } from "react";
import * as QRCode from "qrcode";
import AdminShell from "./admin/AdminShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { invalidateAdminDataCache, useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";

function normalizeTaxiNumber(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function buildTaxiBookingUrl(token) {
  const base = window.location.origin;
  return `${base}/#/book?token=${encodeURIComponent(token)}`;
}

function downloadDataUrl(dataUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function formatCreatedDate(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return value || "";
  }
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function QrGeneratorPage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const [expandedTaxiId, setExpandedTaxiId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrPreviewByTaxiId, setQrPreviewByTaxiId] = useState({});
  const [copyStateByTaxiId, setCopyStateByTaxiId] = useState({});
  const [downloadingTaxiId, setDownloadingTaxiId] = useState("");
  const [editingTaxiId, setEditingTaxiId] = useState("");
  const [deletingTaxiId, setDeletingTaxiId] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [actionFeedback, setActionFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    data: qrPageData,
    error: loadError,
    isLoading,
    isFetching,
    mutate
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "qr:management",
    fetcher: async () => {
      const [qrPayload, driversPayload, statsPayload] = await Promise.all([
        authenticatedRequest("/qr", { method: "GET" }),
        authenticatedRequest("/users/drivers", { method: "GET" }),
        authenticatedRequest("/dashboard/admin", { method: "GET" })
      ]);

      const driversById = Object.fromEntries((driversPayload.data?.items || []).map((driver) => [driver.id, driver]));

      return {
        taxis: (qrPayload.data || []).map((item) => ({
          id: item.id,
          token: item.token,
          taxiNumber: item.vehicleNumber || "",
          taxiName: item.taxiName || item.label || "",
          driverName: item.driverName || "",
          driverPhone: item.driverPhone || "",
          driverEmail: item.driverEmail || driversById[item.driverId]?.email || "",
          createdAt: item.createdAt || "",
          status: item.status || "active"
        })),
        openBookingsCount: Number(statsPayload.data?.pendingBookings || 0)
      };
    },
    staleTime: 60_000,
    emptyValue: { taxis: [], openBookingsCount: 0 },
    errorMessage: "Unable to load QR codes right now."
  });
  const taxis = qrPageData.taxis || [];
  const openBookingsCount = qrPageData.openBookingsCount || 0;

  const expandedTaxi = useMemo(() => taxis.find((taxi) => taxi.id === expandedTaxiId) || null, [taxis, expandedTaxiId]);

  const [taxiNumber, setTaxiNumber] = useState("");
  const [taxiName, setTaxiName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!expandedTaxi || qrPreviewByTaxiId[expandedTaxi.id]) {
      return;
    }

    QRCode.toDataURL(buildTaxiBookingUrl(expandedTaxi.token), { width: 720, margin: 2 })
      .then((dataUrl) => {
        setQrPreviewByTaxiId((current) => ({ ...current, [expandedTaxi.id]: dataUrl }));
      })
      .catch(() => {
        setQrPreviewByTaxiId((current) => ({ ...current, [expandedTaxi.id]: "" }));
      });
  }, [expandedTaxi, qrPreviewByTaxiId]);

  function validate() {
    const nextErrors = {};
    if (!normalizeTaxiNumber(taxiNumber)) nextErrors.taxiNumber = "Taxi number is required";
    if (!driverName.trim()) nextErrors.driverName = "Driver name is required";
    if (!driverPhone.trim()) nextErrors.driverPhone = "Driver phone is required";
    const emailValue = driverEmail.trim().toLowerCase();
    if (!editingTaxiId) {
      if (!emailValue) nextErrors.driverEmail = "Driver email is required";
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) nextErrors.driverEmail = "Enter a valid email address";
      if (!driverPassword) nextErrors.driverPassword = "Driver password is required";
      if (driverPassword && driverPassword.length < 6) nextErrors.driverPassword = "Password must be at least 6 characters";
    } else {
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) nextErrors.driverEmail = "Enter a valid email address";
      if (driverPassword && driverPassword.length < 6) nextErrors.driverPassword = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetForm() {
    setTaxiNumber("");
    setTaxiName("");
    setDriverName("");
    setDriverPhone("");
    setDriverEmail("");
    setDriverPassword("");
    setErrors({});
    setEditingTaxiId("");
  }

  function openCreateModal() {
    resetForm();
    setCreateModalOpen(true);
  }

  function openEditModal(taxi) {
    setEditingTaxiId(taxi.id);
    setTaxiNumber(taxi.taxiNumber || "");
    setTaxiName(taxi.taxiName || "");
    setDriverName(taxi.driverName || "");
    setDriverPhone(taxi.driverPhone || "");
    setDriverEmail(taxi.driverEmail || "");
    setDriverPassword("");
    setErrors({});
    setCreateModalOpen(true);
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setActionFeedback("");

    try {
      const payload = {
        taxiName: taxiName.trim(),
        label: taxiName.trim() || normalizeTaxiNumber(taxiNumber),
        vehicleNumber: normalizeTaxiNumber(taxiNumber),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        driverEmail: driverEmail.trim().toLowerCase(),
        ...(driverPassword ? { driverPassword } : {})
      };

      const response = editingTaxiId
        ? await authenticatedRequest(`/qr/${editingTaxiId}`, {
            method: "PATCH",
            body: JSON.stringify(payload)
          })
        : await authenticatedRequest("/qr", {
            method: "POST",
            body: JSON.stringify(payload)
          });

      const savedTaxi = {
        id: response.data.id,
        token: response.data.token,
        taxiNumber: response.data.vehicleNumber || "",
        taxiName: response.data.taxiName || response.data.label || "",
        driverName: response.data.driverName || "",
        driverPhone: response.data.driverPhone || "",
        driverEmail: response.data.driverEmail || driverEmail.trim().toLowerCase(),
        createdAt: response.data.createdAt || new Date().toISOString(),
        status: response.data.status || "active"
      };

      mutate((current) => ({
        ...current,
        taxis: editingTaxiId ? current.taxis.map((taxi) => (taxi.id === editingTaxiId ? { ...taxi, ...savedTaxi } : taxi)) : [savedTaxi, ...current.taxis]
      }));
      invalidateAdminDataCache(user?.id, "dashboard:analytics");
      setExpandedTaxiId(savedTaxi.id);
      setCreateModalOpen(false);
      setActionFeedback(editingTaxiId ? "Taxi updated successfully." : "Taxi created successfully.");
      resetForm();
    } catch (error) {
      setActionFeedback(error?.message || "Unable to save this QR code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function getQrDataUrl(taxiId) {
    if (qrPreviewByTaxiId[taxiId]) {
      return qrPreviewByTaxiId[taxiId];
    }

    try {
      const selectedTaxi = taxis.find((item) => item.id === taxiId);
      if (!selectedTaxi?.token) {
        return "";
      }

      const dataUrl = await QRCode.toDataURL(buildTaxiBookingUrl(selectedTaxi.token), { width: 720, margin: 2 });
      setQrPreviewByTaxiId((current) => ({ ...current, [taxiId]: dataUrl }));
      return dataUrl;
    } catch {
      return "";
    }
  }

  async function handleCopyLink(taxiId) {
    const selectedTaxi = taxis.find((item) => item.id === taxiId);
    if (!selectedTaxi?.token) {
      return;
    }

    const bookingUrl = buildTaxiBookingUrl(selectedTaxi.token);
    setCopyStateByTaxiId((current) => ({ ...current, [taxiId]: "copying" }));

    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopyStateByTaxiId((current) => ({ ...current, [taxiId]: "copied" }));
    } catch {
      setCopyStateByTaxiId((current) => ({ ...current, [taxiId]: "failed" }));
    } finally {
      window.setTimeout(() => {
        setCopyStateByTaxiId((current) => ({ ...current, [taxiId]: "idle" }));
      }, 1400);
    }
  }

  async function handleDownloadQr(taxi) {
    setDownloadingTaxiId(taxi.id);
    const dataUrl = await getQrDataUrl(taxi.id);
    if (dataUrl) {
      downloadDataUrl(dataUrl, `${taxi.taxiNumber}-ryda-qr.png`);
    }
    setDownloadingTaxiId("");
  }

  async function handleTogglePreview(taxi) {
    if (expandedTaxiId === taxi.id) {
      setExpandedTaxiId("");
      return;
    }

    setExpandedTaxiId(taxi.id);
    await getQrDataUrl(taxi.id);
  }

  async function handleDeleteTaxi() {
    if (!deleteCandidate) {
      return;
    }

    setDeletingTaxiId(deleteCandidate.id);

    try {
      await authenticatedRequest(`/qr/${deleteCandidate.id}`, {
        method: "DELETE"
      });

      const nextTaxis = taxis.filter((taxi) => taxi.id !== deleteCandidate.id);
      mutate((current) => ({
        ...current,
        taxis: current.taxis.filter((taxi) => taxi.id !== deleteCandidate.id)
      }));
      invalidateAdminDataCache(user?.id, "dashboard:analytics");
      setQrPreviewByTaxiId((current) => {
        const next = { ...current };
        delete next[deleteCandidate.id];
        return next;
      });
      setCopyStateByTaxiId((current) => {
        const next = { ...current };
        delete next[deleteCandidate.id];
        return next;
      });
      if (expandedTaxiId === deleteCandidate.id) {
        setExpandedTaxiId("");
      }
      setActionFeedback("Taxi deleted successfully.");
      setDeleteCandidate(null);
    } catch (error) {
      setActionFeedback(error?.message || "Unable to delete this taxi.");
    } finally {
      setDeletingTaxiId("");
    }
  }

  return (
    <AdminShell
      activeNav="qr"
      openBookingsCount={openBookingsCount}
      title="QR Code Management"
      actions={
        <button type="button" className="admin-primary-button" onClick={openCreateModal}>
          Generate QR code
        </button>
      }
      mobilePrimaryAction={
        <button type="button" className="admin-primary-button" onClick={openCreateModal}>
          Generate QR
        </button>
      }
    >
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing QR codes..." /> : null}

          <div className="admin-section-head">
            <div>
              <div className="admin-section-title">Saved taxis</div>
              <div className="admin-section-subtitle">Manage taxi QR entries in a cleaner table with inline preview below each row.</div>
            </div>
            <div className="admin-inline-actions">
              <button type="button" className="admin-text-button" onClick={openCreateModal}>
                Add new
              </button>
              <button
                type="button"
                className="admin-text-button"
                onClick={async () => {
                  try {
                    await Promise.all(taxis.map((taxi) => authenticatedRequest(`/qr/${taxi.id}`, { method: "DELETE" })));
                    mutate((current) => ({ ...current, taxis: [] }));
                    invalidateAdminDataCache(user?.id, "dashboard:analytics");
                    setExpandedTaxiId("");
                    setQrPreviewByTaxiId({});
                    setActionFeedback("All taxis deleted successfully.");
                  } catch (error) {
                    setActionFeedback(error?.message || "Unable to clear QR entries.");
                  }
                }}
                disabled={taxis.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>

          {actionFeedback || loadError ? <div className="admin-inline-feedback">{actionFeedback || loadError}</div> : null}

          {isLoading ? (
            <div className="admin-loading-state">
              <LoadingBlock title="Loading QR codes" copy="Fetching saved taxis and their booking links." compact />
            </div>
          ) : taxis.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-state-title">No QR entries created yet</div>
              <div className="admin-empty-state-copy">Start by generating your first taxi QR code for the customer booking flow.</div>
            </div>
          ) : (
            <div className="admin-table-wrap admin-table-wrap-rich">
              <table className="admin-table admin-qr-table">
                <thead>
                  <tr>
                    <th>Taxi</th>
                    <th>Driver</th>
                    <th>Created</th>
                    <th>Buttons</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxis.map((taxi) => {
                    const bookingUrl = buildTaxiBookingUrl(taxi.token);
                    const isExpanded = expandedTaxiId === taxi.id;
                    const qrDataUrl = qrPreviewByTaxiId[taxi.id] || "";
                    const copyState = copyStateByTaxiId[taxi.id] || "idle";

                    return [
                      <tr key={taxi.id} className={isExpanded ? "admin-table-row-active" : ""}>
                        <td>
                          <div className="admin-table-title">{taxi.taxiNumber}</div>
                        </td>
                        <td>
                          <div className="admin-table-title">{taxi.driverName}</div>
                          <div className="admin-table-subtitle">{taxi.driverPhone}</div>
                        </td>
                        <td>{formatCreatedDate(taxi.createdAt)}</td>
                        <td>
                          <div className="admin-row-actions admin-row-actions-qr">
                            <button type="button" className="admin-table-action" onClick={() => handleCopyLink(taxi.id)} title="Copy booking link">
                              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy link"}
                            </button>
                            <button
                              type="button"
                              className="admin-table-action admin-table-action-primary"
                              onClick={() => handleDownloadQr(taxi)}
                              disabled={downloadingTaxiId === taxi.id}
                              title="Download QR code"
                            >
                              {downloadingTaxiId === taxi.id ? "Downloading..." : "Download QR"}
                            </button>
                            <button
                              type="button"
                              className={isExpanded ? "admin-table-action admin-table-action-active" : "admin-table-action"}
                              onClick={() => handleTogglePreview(taxi)}
                              aria-expanded={isExpanded}
                              title={isExpanded ? "Hide QR preview" : "Preview QR code"}
                            >
                              {isExpanded ? "Hide Preview" : "Preview"}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="admin-row-actions admin-row-actions-compact">
                            <button
                              type="button"
                              className="admin-table-action admin-table-action-icon"
                              onClick={() => openEditModal(taxi)}
                              title="Edit taxi"
                              disabled={deletingTaxiId === taxi.id}
                            >
                              <EditIcon />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="admin-table-action admin-table-action-danger"
                              onClick={() => setDeleteCandidate(taxi)}
                              title="Delete taxi"
                              disabled={deletingTaxiId === taxi.id}
                            >
                              <TrashIcon />
                              <span>{deletingTaxiId === taxi.id ? "Deleting..." : "Delete"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>,
                      <tr key={`${taxi.id}-preview`} className="admin-table-expand-row">
                        <td colSpan="5" className="admin-table-expand-cell">
                          <div className={isExpanded ? "admin-table-expand-inner admin-table-expand-inner-open" : "admin-table-expand-inner"}>
                            <div className="admin-qr-inline-preview">
                              <div className="admin-qr-box">
                                {qrDataUrl ? (
                                  <img src={qrDataUrl} alt={`${taxi.taxiNumber} QR code`} className="admin-qr-image" />
                                ) : (
                                  <div className="admin-qr-loading">Generating QR...</div>
                                )}
                              </div>

                              <div className="admin-qr-inline-copy">
                                <div className="admin-detail-grid">
                                  <div className="admin-detail-item">
                                    <div className="admin-detail-label">Taxi</div>
                                    <div className="admin-detail-value">
                                      {taxi.taxiNumber}
                                      {taxi.taxiName ? ` · ${taxi.taxiName}` : ""}
                                    </div>
                                  </div>
                                  <div className="admin-detail-item">
                                    <div className="admin-detail-label">Driver</div>
                                    <div className="admin-detail-value">
                                      {taxi.driverName} · {taxi.driverPhone}
                                    </div>
                                  </div>
                                  <div className="admin-detail-item">
                                    <div className="admin-detail-label">Booking link</div>
                                    <div className="admin-detail-value admin-detail-value-link">{bookingUrl}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {createModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-title">{editingTaxiId ? "Edit taxi QR" : "Generate taxi QR"}</div>
            <div className="modal-text">
              {editingTaxiId
                ? "Update taxi and driver details. The table will refresh immediately after saving."
                : "Fill taxi and driver details. You can download and print the QR after saving."}
            </div>

            <form className="form" onSubmit={handleGenerate}>
              <div className="form-field">
                <label className="form-label">Taxi number</label>
                <input
                  className="form-input"
                  value={taxiNumber}
                  onChange={(event) => setTaxiNumber(event.target.value)}
                  placeholder="e.g. TX-1024"
                />
                {errors.taxiNumber && <div className="form-error">{errors.taxiNumber}</div>}
              </div>

              <div className="form-field">
                <label className="form-label">Taxi name (optional)</label>
                <input
                  className="form-input"
                  value={taxiName}
                  onChange={(event) => setTaxiName(event.target.value)}
                  placeholder="e.g. Ryda Cab 1"
                />
              </div>

              <div className="form-two">
                <div className="form-field">
                  <label className="form-label">Driver name</label>
                  <input
                    className="form-input"
                    value={driverName}
                    onChange={(event) => setDriverName(event.target.value)}
                    placeholder="Required"
                  />
                  {errors.driverName && <div className="form-error">{errors.driverName}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Driver phone</label>
                  <input
                    className="form-input"
                    value={driverPhone}
                    onChange={(event) => setDriverPhone(event.target.value)}
                    placeholder="Required"
                  />
                  {errors.driverPhone && <div className="form-error">{errors.driverPhone}</div>}
                </div>
              </div>

              <div className="form-two">
                <div className="form-field">
                  <label className="form-label">Driver email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={driverEmail}
                    onChange={(event) => setDriverEmail(event.target.value)}
                    placeholder={editingTaxiId ? "Existing driver email" : "Required"}
                  />
                  {errors.driverEmail && <div className="form-error">{errors.driverEmail}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Driver password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={driverPassword}
                    onChange={(event) => setDriverPassword(event.target.value)}
                    placeholder={editingTaxiId ? "Leave blank to keep current password" : "Required"}
                  />
                  {errors.driverPassword && <div className="form-error">{errors.driverPassword}</div>}
                </div>
              </div>

              <button type="submit" className="form-primary" disabled={submitting}>
                {submitting ? "Saving..." : editingTaxiId ? "Save changes" : "Save & generate"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteCandidate ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={() => setDeleteCandidate(null)} aria-label="Close">
              ×
            </button>
            <div className="modal-title">Delete taxi</div>
            <div className="modal-text">
              Are you sure you want to delete taxi <strong className="modal-code">{deleteCandidate.taxiNumber}</strong>? This removes the QR entry from the table.
            </div>
            <div className="modal-actions">
              <button type="button" className="admin-ghost-button" onClick={() => setDeleteCandidate(null)} disabled={deletingTaxiId === deleteCandidate.id}>
                Cancel
              </button>
              <button type="button" className="admin-danger-button" onClick={handleDeleteTaxi} disabled={deletingTaxiId === deleteCandidate.id}>
                {deletingTaxiId === deleteCandidate.id ? "Deleting..." : "Delete taxi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default QrGeneratorPage;

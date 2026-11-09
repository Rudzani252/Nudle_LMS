
import { useEffect, useState } from "react";

import {
    registerUser,
    getUserDetails,
    updateUser,
    viewAllLearners,
    deleteUser,
    updateLearnerStatus
} from "./api.js";

import "./AdminDashboard.css";

const emptyForm = {
    full_name: "",
    email: "",
    phone_no: "",
    password: ""
};

export default function AdminLearners() {
    const [learners, setLearners] = useState([]);
    const [form, setForm] = useState({ ...emptyForm });

    const [editingId, setEditingId] = useState(null);
    const [originalLearner, setOriginalLearner] = useState(null);
    const [selectedLearner, setSelectedLearner] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // GET ALL LEARNERS
    async function loadLearners() {
        const data = await viewAllLearners();

        if (!Array.isArray(data)) {
            throw new Error("Expected a list of learners.");
        }

        setLearners(data);
    }

    useEffect(() => {
        let active = true;

        async function initialLoad() {
            setLoading(true);

            try {
                const data = await viewAllLearners();

                if (active) {
                    setLearners(
                        Array.isArray(data) ? data : []
                    );
                }

            } catch (err) {
                if (active) {
                    setError(err.message);
                }

            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        initialLoad();

        return () => {
            active = false;
        };
    }, []);

    // HANDLE FORM INPUT
    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    // OPEN ADD LEARNER FORM
    function startCreate() {
        setEditingId(null);
        setOriginalLearner(null);
        setSelectedLearner(null);
        setForm({ ...emptyForm });

        setError("");
        setMessage("");
        setShowForm(true);
    }

    // OPEN EDIT LEARNER FORM
    async function startEdit(learner) {
        setError("");
        setMessage("");

        try {
            const details = await getUserDetails(
                learner.user_id
            );

            const fullDetails = {
                ...learner,
                ...details
            };

            setOriginalLearner(fullDetails);

            setForm({
                full_name: details.full_name || "",
                email: details.email || "",
                phone_no: details.phone_no || "",
                password: ""
            });

            setEditingId(learner.user_id);
            setSelectedLearner(null);
            setShowForm(true);

        } catch (err) {
            setError(err.message);
        }
    }

    // VIEW LEARNER INFORMATION
    async function handleView(learner) {
        setError("");
        setMessage("");

        try {
            const details = await getUserDetails(
                learner.user_id
            );

            setSelectedLearner({
                ...learner,
                ...details
            });

            setShowForm(false);

        } catch (err) {
            setError(err.message);
        }
    }

    // ADD OR UPDATE LEARNER
    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const fullName = form.full_name.trim();
            const email = form.email.trim();
            const phone = form.phone_no.trim();

            if (fullName.length < 2) {
                throw new Error(
                    "Full name must contain at least 2 characters."
                );
            }

            if (!email) {
                throw new Error("Email address is required.");
            }

            if (form.password && form.password.length < 8) {
                throw new Error(
                    "Password must contain at least 8 characters."
                );
            }

            if (editingId !== null) {
                // Only send fields that actually changed
                const updatedData = {};

                if (fullName !== originalLearner.full_name) {
                    updatedData.full_name = fullName;
                }

                if (email !== originalLearner.email) {
                    updatedData.email = email;
                }

                if (
                    phone !== (originalLearner.phone_no || "")
                ) {
                    updatedData.phone_no = phone;
                }

                if (form.password) {
                    updatedData.password = form.password;
                }

                if (Object.keys(updatedData).length === 0) {
                    setMessage("No changes were made.");
                    setShowForm(false);
                    return;
                }

                await updateUser(editingId, updatedData);

                setMessage("Learner updated successfully.");

            } else {
                // REGISTER NEW LEARNER
                if (form.password.length < 8) {
                    throw new Error(
                        "Password must contain at least 8 characters."
                    );
                }

                await registerUser(
                    fullName,
                    email,
                    form.password,
                    phone
                );

                setMessage("Learner added successfully.");
            }

            await loadLearners();

            setShowForm(false);
            setEditingId(null);
            setOriginalLearner(null);
            setForm({ ...emptyForm });

        } catch (err) {
            setError(err.message);

        } finally {
            setSaving(false);
        }
    }

    // ACTIVATE OR DEACTIVATE LEARNER
    async function handleStatusChange(learner) {
        const newStatus = !learner.is_active;

        const action = newStatus
            ? "activate"
            : "deactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} "${learner.full_name}"?`
        );

        if (!confirmed) return;

        setBusyId(learner.user_id);
        setError("");
        setMessage("");

        try {
            await updateLearnerStatus(
                learner.user_id,
                newStatus
            );

            await loadLearners();

            setSelectedLearner(null);

            setMessage(
                newStatus
                    ? "Learner activated successfully."
                    : "Learner deactivated successfully."
            );

        } catch (err) {
            setError(err.message);

        } finally {
            setBusyId(null);
        }
    }

    // DELETE LEARNER
    async function handleDelete(learner) {
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${learner.full_name}"?\n\n` +
            "This action may remove their saved learning records."
        );

        if (!confirmed) return;

        setBusyId(learner.user_id);
        setError("");
        setMessage("");

        try {
            await deleteUser(learner.user_id);

            await loadLearners();

            setSelectedLearner(null);
            setShowForm(false);

            setMessage("Learner deleted successfully.");

        } catch (err) {
            setError(err.message);

        } finally {
            setBusyId(null);
        }
    }

    // CANCEL FORM
    function handleCancel() {
        setShowForm(false);
        setEditingId(null);
        setOriginalLearner(null);
        setForm({ ...emptyForm });
        setError("");
    }

    // DASHBOARD STATISTICS
    const activeCount = learners.filter(
        learner => learner.is_active
    ).length;

    const inactiveCount = learners.length - activeCount;

    return (
        <div>
            {/* PAGE HEADER */}
            <div className="admin-page-heading">
                <div>
                    <h1>Learner Management</h1>

                    <p className="admin-muted">
                        Add, view, edit and manage learner accounts.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-primary"
                    onClick={startCreate}
                >
                    + Add Learner
                </button>
            </div>

            {/* STATISTICS */}
            <div className="admin-stats">
                <div className="admin-stat">
                    <span>Total Learners</span>
                    <strong>{learners.length}</strong>
                </div>

                <div className="admin-stat">
                    <span>Active Learners</span>
                    <strong>{activeCount}</strong>
                </div>

                <div className="admin-stat">
                    <span>Inactive Learners</span>
                    <strong>{inactiveCount}</strong>
                </div>
            </div>

            {/* ERROR / SUCCESS MESSAGES */}
            {error && (
                <p className="admin-error" role="alert">
                    {error}
                </p>
            )}

            {message && (
                <p className="admin-success" role="status">
                    {message}
                </p>
            )}

            {/* ADD / EDIT FORM */}
            {showForm && (
                <section className="admin-panel">
                    <h2>
                        {editingId !== null
                            ? "Edit Learner"
                            : "Add Learner"}
                    </h2>

                    <form
                        className="admin-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="admin-field">
                            <label htmlFor="learner-name">
                                Full Name
                            </label>

                            <input
                                id="learner-name"
                                type="text"
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                minLength={2}
                                maxLength={50}
                                placeholder="Enter learner's full name"
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="learner-email">
                                Email Address
                            </label>

                            <input
                                id="learner-email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="learner@example.com"
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="learner-phone">
                                Phone Number
                            </label>

                            <input
                                id="learner-phone"
                                type="tel"
                                name="phone_no"
                                value={form.phone_no}
                                onChange={handleChange}
                                placeholder="0712345678"
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="learner-password">
                                {editingId !== null
                                    ? "New Password (Optional)"
                                    : "Password"}
                            </label>

                            <input
                                id="learner-password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                minLength={8}
                                required={editingId === null}
                                autoComplete="new-password"
                                placeholder={
                                    editingId !== null
                                        ? "Leave blank to keep current password"
                                        : "Minimum 8 characters"
                                }
                            />
                        </div>

                        <div className="admin-actions">
                            <button
                                type="submit"
                                className="admin-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Save Changes"
                                        : "Add Learner"}
                            </button>

                            <button
                                type="button"
                                className="admin-secondary"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* VIEW LEARNER DETAILS */}
            {selectedLearner && (
                <section className="admin-panel">
                    <h2>Learner Details</h2>

                    <div className="learner-details-grid">
                        <p>
                            <strong>Learner ID:</strong>{" "}
                            {selectedLearner.user_id}
                        </p>

                        <p>
                            <strong>Full Name:</strong>{" "}
                            {selectedLearner.full_name}
                        </p>

                        <p>
                            <strong>Email:</strong>{" "}
                            {selectedLearner.email}
                        </p>

                        <p>
                            <strong>Phone:</strong>{" "}
                            {selectedLearner.phone_no || "Not provided"}
                        </p>

                        <p>
                            <strong>Role:</strong>{" "}
                            {selectedLearner.role || "Learner"}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {selectedLearner.is_active
                                ? "Active"
                                : "Inactive"}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-secondary"
                        onClick={() => setSelectedLearner(null)}
                    >
                        Close
                    </button>
                </section>
            )}

            {/* ALL LEARNERS TABLE */}
            <section className="admin-panel">
                <h2>All Learners</h2>

                {loading ? (
                    <p>Loading learners...</p>
                ) : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {learners.map(learner => (
                                    <tr key={learner.user_id}>
                                        <td>{learner.user_id}</td>

                                        <td>{learner.full_name}</td>

                                        <td>{learner.email}</td>

                                        <td>
                                            <span
                                                className={
                                                    learner.is_active
                                                        ? "admin-status active"
                                                        : "admin-status inactive"
                                                }
                                            >
                                                {learner.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    type="button"
                                                    className="admin-secondary"
                                                    onClick={() =>
                                                        handleView(learner)
                                                    }
                                                >
                                                    View
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-edit"
                                                    onClick={() =>
                                                        startEdit(learner)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-status-button"
                                                    disabled={
                                                        busyId ===
                                                        learner.user_id
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(learner)
                                                    }
                                                >
                                                    {learner.is_active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-delete"
                                                    disabled={
                                                        busyId ===
                                                        learner.user_id
                                                    }
                                                    onClick={() =>
                                                        handleDelete(learner)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {learners.length === 0 && (
                            <p>No learners found.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

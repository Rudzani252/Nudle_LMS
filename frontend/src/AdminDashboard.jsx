
import { useEffect, useState } from "react";
import {
    NavLink,
    Outlet,
    useNavigate
} from "react-router-dom";

import {
    viewAllLearners,
    AddAssessment,
    updateAssessment,
    getAllAssessments,
    viewAssessment,
    deleteAssessment,
    addActivity,
    updateActivity,
    getAllActivities,
    viewActivty,
    deleteActivity,
    getAllSimulations,
    viewSimulation,
    addSimulation,
    updateSimulation,
    deleteSimulation
} from "./api.js";

import "./AdminDashboard.css";


// ADMIN SIDEBAR AND HEADER
export default function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();

    const logout = () => {
        onLogout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span className="admin-brand-icon">N</span>
                    <strong>Nudle LMS</strong>
                </div>

                <nav className="admin-navigation">
                    <NavLink to="/admin" end>
                        Home
                    </NavLink>
                    <NavLink to="/admin/learners">
                        Learner Management
                    </NavLink>

                    <NavLink to="/admin/assessments">
                        Assessments
                    </NavLink>

                    <NavLink to="/admin/activities">
                        Activities
                    </NavLink>
                    <NavLink to="/admin/simulations">
                        Simulations
                    </NavLink>
                </nav>

                <button className="admin-logout" onClick={logout}>
                    Log out
                </button>
            </aside>

            <div className="admin-main">
                <header className="admin-header">
                    <div>
                        <h2>Nudle Learning Platform</h2>
                        <p>Administration Dashboard</p>
                    </div>

                    <div className="admin-profile">
                        <span className="admin-avatar">
                            {user?.full_name?.charAt(0).toUpperCase() || "A"}
                        </span>
                        <div>
                            <strong>{user?.full_name}</strong>
                            <small>Administrator</small>
                        </div>
                    </div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


// HOME — ALL REGISTERED LEARNERS
export function AdminHome() {
    const [learners, setLearners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadLearners() {
            try {
                const data = await viewAllLearners();

                if (active) {
                    setLearners(data);
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadLearners();

        return () => {
            active = false;
        };
    }, []);

    const activeCount = learners.filter(
        learner => learner.is_active
    ).length;

    return (
        <div>
            <h1>Admin Overview</h1>
            <p className="admin-muted">
                Manage learners registered on Nudle LMS.
            </p>

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
                    <strong>{learners.length - activeCount}</strong>
                </div>
            </div>

            <section className="admin-panel">
                <h2>Registered Learners</h2>

                {loading && <p>Loading learners...</p>}

                {error && (
                    <p className="admin-error" role="alert">{error}</p>
                )}

                {!loading && !error && (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {learners.map(learner => (
                                    <tr key={learner.user_id}>
                                        <td>{learner.user_id}</td>
                                        <td>{learner.full_name}</td>
                                        <td>{learner.email}</td>
                                        <td>
                                            <span className={
                                                learner.is_active
                                                    ? "admin-status active"
                                                    : "admin-status inactive"
                                            }>
                                                {learner.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {learners.length === 0 && (
                            <p>No registered learners found.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}


// REUSABLE CRUD COMPONENT
function CrudManager({
    title,
    fields,
    getAll,
    viewOne,
    createOne,
    updateOne,
    deleteOne,
    emptyForm,
    assessments = []
}) {
    const [records, setRecords] = useState([]);
    useEffect(() => {
    console.log("CURRENT RECORDS:", records);}, [records]);

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const idKey = title === "Assessments"
        ? "assessment_id"
        : "activity_id";

    async function loadRecords() {
        setError("");
        setLoading(true);

        try {
            const data = await getAll();
            setRecords(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

   useEffect(() => {
    let active = true;

    async function initialLoad() {
        setLoading(true);

        try {
            console.log("Fetching:", title);

            const data = await getAll();

            console.log("API RESPONSE:", data);

            if (active) {
                setRecords(Array.isArray(data) ? data : []);
            }

        } catch (error) {
            console.error("FETCH ERROR:", error);

            if (active) {
                setError(error.message);
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
}, [getAll, title]);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm });
        setSelected(null);
        setError("");
        setMessage("");
        setShowForm(true);
    }

    function startEdit(record) {
        setEditingId(record[idKey]);

        const values = { ...emptyForm };

        for (const field of fields) {
            values[field.name] = record[field.name]
                ?? emptyForm[field.name];
        }

        setForm(values);
        setSelected(null);
        setError("");
        setMessage("");
        setShowForm(true);
    }

    async function handleView(id) {
        setError("");
        setMessage("");

        try {
            const record = await viewOne(id);
            setSelected(record);
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            if (editingId !== null) {
                await updateOne(editingId, form);
                setMessage("Updated successfully.");
            } else {
                await createOne(form);
                setMessage("Created successfully.");
            }

            setShowForm(false);
            setEditingId(null);
            setSelected(null);
            setForm({ ...emptyForm });

            await loadRecords();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(record) {
        const id = record[idKey];

        const confirmed = window.confirm(
            `Are you sure you want to delete "${record.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await deleteOne(id);
            setMessage("Deleted successfully.");
            setSelected(null);
            setShowForm(false);
            await loadRecords();
        } catch (err) {
            setError(err.message);
        }
    }

    function renderField(field) {
        const value = form[field.name];

        if (field.type === "checkbox") {
            return (
                <label className="admin-checkbox" key={field.name}>
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={e => setForm({
                            ...form,
                            [field.name]: e.target.checked
                        })}
                    />
                    {field.label}
                </label>
            );
        }

        if (field.type === "select") {
            return (
                <div className="admin-field" key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    <select
                        id={field.name}
                        value={value ?? ""}
                        required
                        onChange={e => setForm({
                            ...form,
                            [field.name]: Number(e.target.value)
                        })}
                    >
                        <option value="">Select an assessment</option>

                        {assessments.map(item => (
                            <option
                                key={item.assessment_id}
                                value={item.assessment_id}
                            >
                                {item.title}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div className="admin-field" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>

                {field.type === "textarea" ? (
                    <textarea
                        id={field.name}
                        value={value ?? ""}
                        required
                        onChange={e => setForm({
                            ...form,
                            [field.name]: e.target.value
                        })}
                    />
                ) : (
                    <input
                        id={field.name}
                        type="text"
                        value={value ?? ""}
                        required
                        onChange={e => setForm({
                            ...form,
                            [field.name]: e.target.value
                        })}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="admin-page-heading">
                <div>
                    <h1>Manage {title}</h1>
                    <p className="admin-muted">
                        Create, view, update and delete {title.toLowerCase()}.
                    </p>
                </div>

                <button
                    className="admin-primary"
                    onClick={startCreate}
                >
                    + Add {title === "Assessments"
                        ? "Assessment"
                        : "Activity"}
                </button>
            </div>

            {error && (
                <p className="admin-error" role="alert">{error}</p>
            )}

            {message && (
                <p className="admin-success" role="status">{message}</p>
            )}

            {showForm && (
                <section className="admin-panel">
                    <h2>
                        {editingId !== null ? "Edit" : "Add"}{" "}
                        {title === "Assessments"
                            ? "Assessment"
                            : "Activity"}
                    </h2>

                    <form onSubmit={handleSubmit} className="admin-form">
                        {fields.map(renderField)}

                        <div className="admin-actions">
                            <button
                                type="submit"
                                className="admin-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                                type="button"
                                className="admin-secondary"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {selected && (
                <section className="admin-panel">
                    <h2>Record Details</h2>

                    <p><strong>ID:</strong> {selected[idKey]}</p>

                    {fields.map(field => (
                        <p key={field.name}>
                            <strong>{field.label}:</strong>{" "}
                            {typeof selected[field.name] === "boolean"
                                ? selected[field.name] ? "Yes" : "No"
                                : String(selected[field.name] ?? "")}
                        </p>
                    ))}

                    <button
                        className="admin-secondary"
                        onClick={() => setSelected(null)}
                    >
                        Close
                    </button>
                </section>
            )}

            <section className="admin-panel">
                <h2>All {title}</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.map(record => (
                                    <tr key={record[idKey]}>
                                        <td>{record[idKey]}</td>
                                        <td>{record.title}</td>
                                        <td>{record.description}</td>

                                        <td>
                                            <span className={
                                                record.is_active
                                                    ? "admin-status active"
                                                    : "admin-status inactive"
                                            }>
                                                {record.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    className="admin-secondary"
                                                    onClick={() =>
                                                        handleView(record[idKey])
                                                    }
                                                >
                                                    View
                                                </button>

                                                <button
                                                    className="admin-edit"
                                                    onClick={() => startEdit(record)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="admin-delete"
                                                    onClick={() => handleDelete(record)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {records.length === 0 && (
                            <p>No records found.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}


// ASSESSMENTS CRUD PAGE
export function AdminAssessments() {
    return (
        <CrudManager
            title="Assessments"
            getAll={getAllAssessments}
            viewOne={viewAssessment}
            deleteOne={deleteAssessment}
            updateOne={updateAssessment}
            createOne={(data) =>
                AddAssessment(
                    data.title,
                    data.description,
                    data.is_active
                )
            }
            emptyForm={{
                title: "",
                description: "",
                is_active: true
            }}
            fields={[
                { name: "title", label: "Title", type: "text" },
                { name: "description", label: "Description", type: "textarea" },
                { name: "is_active", label: "Active", type: "checkbox" }
            ]}
        />
    );
}


// ACTIVITIES CRUD PAGE
export function AdminActivities() {
    const [assessments, setAssessments] = useState([]);
    const [assessmentError, setAssessmentError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadAssessments() {
            try {
                const data = await getAllAssessments();
                if (active) setAssessments(data);
            } catch (err) {
                if (active) setAssessmentError(err.message);
            }
        }

        loadAssessments();

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            {assessmentError && (
                <p className="admin-error">{assessmentError}</p>
            )}

            <CrudManager
                title="Activities"
                getAll={getAllActivities}
                viewOne={viewActivty}
                deleteOne={deleteActivity}
                updateOne={updateActivity}
                assessments={assessments}
                createOne={(data) =>
                    addActivity(
                        data.assessment_id,
                        data.title,
                        data.description,
                        data.scenario_type,
                        data.is_active
                    )
                }
                emptyForm={{
                    assessment_id: "",
                    title: "",
                    description: "",
                    scenario_type: "",
                    is_active: true
                }}
                fields={[
                    {
                        name: "assessment_id",
                        label: "Assessment",
                        type: "select"
                    },
                    { name: "title", label: "Title", type: "text" },
                    {
                        name: "description",
                        label: "Description",
                        type: "textarea"
                    },
                    {
                        name: "scenario_type",
                        label: "Scenario Type",
                        type: "text"
                    },
                    {
                        name: "is_active",
                        label: "Active",
                        type: "checkbox"
                    }
                ]}
            />
        </>
    );
}


import { useEffect, useState } from "react";

import {
    getAllActivities,
    getAllSimulations,
    viewSimulation,
    addSimulation,
    updateSimulation,
    deleteSimulation
} from "./api.js";

import "./AdminDashboard.css";

const emptyForm = {
    activity_id: "",
    title: "",
    expected_fault: "",
    max_score: 100,
    is_active: true,
    symptoms_json: ""
};

export default function AdminSimulations() {
    const [simulations, setSimulations] = useState([]);
    const [activities, setActivities] = useState([]);

    const [form, setForm] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadSimulations() {
        const data = await getAllSimulations();
        setSimulations(data);
    }

    useEffect(() => {
    let active = true;

    async function loadPage() {
        setLoading(true);
        setError("");

        const [simulationResult, activityResult] =
            await Promise.allSettled([
                getAllSimulations(),
                getAllActivities()
            ]);

        if (!active) return;

        if (simulationResult.status === "fulfilled") {
            console.log("SIMULATIONS:", simulationResult.value);
            setSimulations(simulationResult.value);
        } else {
            console.error(
                "SIMULATIONS ERROR:",
                simulationResult.reason
            );
            setError("Failed to load simulations.");
        }

        if (activityResult.status === "fulfilled") {
            console.log("ACTIVITIES:", activityResult.value);

            setActivities(
                Array.isArray(activityResult.value)
                    ? activityResult.value
                    : []
            );
        } else {
            console.error(
                "ACTIVITIES ERROR:",
                activityResult.reason
            );

            setError(previous =>
                `${previous} Failed to load activities.`.trim()
            );
        }

        setLoading(false);
    }

    loadPage();

    return () => {
        active = false;
    };
}, []);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function startCreate() {
        setForm({ ...emptyForm });
        setEditingId(null);
        setSelected(null);
        setError("");
        setMessage("");
        setShowForm(true);
    }

    async function startEdit(simulationId) {
        setError("");
        setMessage("");

        try {
            const simulation = await viewSimulation(simulationId);

            setForm({
                activity_id: simulation.activity_id,
                title: simulation.title,
                expected_fault: simulation.expected_fault,
                max_score: simulation.max_score,
                is_active: simulation.is_active,
                symptoms_json: JSON.stringify(
                    simulation.symptoms_json,
                    null,
                    2
                )
            });

            setEditingId(simulationId);
            setSelected(null);
            setShowForm(true);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleView(simulationId) {
        setError("");
        setMessage("");

        try {
            const data = await viewSimulation(simulationId);
            setSelected(data);
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            let scenario;

            try {
                scenario = JSON.parse(form.symptoms_json);
            } catch {
                throw new Error(
                    "Invalid scenario JSON. Check the formatting."
                );
            }

            const payload = {
                activity_id: Number(form.activity_id),
                title: form.title.trim(),
                expected_fault: form.expected_fault.trim(),
                max_score: Number(form.max_score),
                is_active: form.is_active,
                symptoms_json: scenario
            };

            if (!payload.activity_id) {
                throw new Error("Please select an activity.");
            }

            if (editingId !== null) {
                await updateSimulation(editingId, payload);
                setMessage("Simulation updated successfully.");
            } else {
                await addSimulation(
                    payload.activity_id,
                    payload.title,
                    payload.symptoms_json,
                    payload.expected_fault,
                    payload.max_score,
                    payload.is_active
                );

                setMessage("Simulation created successfully.");
            }

            await loadSimulations();

            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(simulation) {
        const confirmed = window.confirm(
            `Delete "${simulation.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            const result = await deleteSimulation(
                simulation.simulation_id
            );

            await loadSimulations();

            setSelected(null);
            setShowForm(false);

            setMessage(
                result?.message || "Simulation deleted successfully."
            );

        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div className="admin-page-heading">
                <div>
                    <h1>Manage Simulations</h1>
                    <p className="admin-muted">
                        Create, view, edit and delete simulation scenarios.
                    </p>
                </div>

                <button
                    className="admin-primary"
                    onClick={startCreate}
                >
                    + Add Simulation
                </button>
            </div>

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

            {showForm && (
                <section className="admin-panel">
                    <h2>
                        {editingId !== null
                            ? "Edit Simulation"
                            : "Add Simulation"}
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="admin-form"
                    >
                        <div className="admin-field">
                            <label htmlFor="simulation-activity">
                                Activity
                            </label>

                            <select
                                id="simulation-activity"
                                name="activity_id"
                                value={form.activity_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Select an activity
                                </option>

                                {activities.map(activity => (
                                    <option
                                        key={activity.activity_id}
                                        value={activity.activity_id}
                                    >
                                        {activity.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-field">
                            <label htmlFor="simulation-title">
                                Simulation Title
                            </label>

                            <input
                                id="simulation-title"
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="expected-fault">
                                Expected Fault
                            </label>

                            <input
                                id="expected-fault"
                                type="text"
                                name="expected_fault"
                                value={form.expected_fault}
                                onChange={handleChange}
                                placeholder="e.g. faulty_ram"
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="max-score">
                                Maximum Score
                            </label>

                            <input
                                id="max-score"
                                type="number"
                                name="max_score"
                                min="1"
                                value={form.max_score}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label htmlFor="scenario-json">
                                Simulation Scenario (JSON)
                            </label>

                            <textarea
                                id="scenario-json"
                                name="symptoms_json"
                                value={form.symptoms_json}
                                onChange={handleChange}
                                placeholder='{"start_node":"start","nodes":{...}}'
                                rows={14}
                                spellCheck={false}
                                className="simulation-json-input"
                                required
                            />

                            <small className="admin-muted">
                                Define the symptoms, diagnostic actions,
                                feedback, points and branching steps.
                            </small>
                        </div>

                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleChange}
                            />
                            Active
                        </label>

                        <div className="admin-actions">
                            <button
                                type="submit"
                                className="admin-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Simulation"}
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
                    <h2>Simulation Details</h2>

                    <p><strong>ID:</strong> {selected.simulation_id}</p>
                    <p><strong>Title:</strong> {selected.title}</p>
                    <p><strong>Activity ID:</strong> {selected.activity_id}</p>
                    <p><strong>Expected Fault:</strong> {selected.expected_fault}</p>
                    <p><strong>Maximum Score:</strong> {selected.max_score}</p>

                    <h3>Scenario JSON</h3>

                    <pre className="simulation-json-preview">
                        {JSON.stringify(
                            selected.symptoms_json,
                            null,
                            2
                        )}
                    </pre>

                    <button
                        className="admin-secondary"
                        onClick={() => setSelected(null)}
                    >
                        Close
                    </button>
                </section>
            )}

            <section className="admin-panel">
                <h2>All Simulations</h2>

                {loading ? (
                    <p>Loading simulations...</p>
                ) : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Activity</th>
                                    <th>Expected Fault</th>
                                    <th>Max Score</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {simulations.map(simulation => {
                                    const activity = activities.find(
                                        item =>
                                            item.activity_id ===
                                            simulation.activity_id
                                    );

                                    return (
                                        <tr key={simulation.simulation_id}>
                                            <td>{simulation.simulation_id}</td>

                                            <td>{simulation.title}</td>

                                            <td>
                                                {activity?.title ||
                                                    simulation.activity_id}
                                            </td>

                                            <td>{simulation.expected_fault || "—"}</td>

                                            <td>{simulation.max_score}</td>

                                            <td>
                                                <span className={
                                                    simulation.is_active
                                                        ? "admin-status active"
                                                        : "admin-status inactive"
                                                }>
                                                    {simulation.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-secondary"
                                                        onClick={() =>
                                                            handleView(
                                                                simulation.simulation_id
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        className="admin-edit"
                                                        onClick={() =>
                                                            startEdit(
                                                                simulation.simulation_id
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="admin-delete"
                                                        onClick={() =>
                                                            handleDelete(simulation)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {simulations.length === 0 && (
                            <p>No simulations found.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

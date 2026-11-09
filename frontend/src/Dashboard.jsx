
import {NavLink,Link,Outlet,useNavigate, useSearchParams} from "react-router-dom";
import "./Dashboard.css";
import { useEffect, useState } from "react";
import {getAllAssessments,getAllActivities} from "./api.js";
import {getAllSimulations,startSimulation,getSimulationAttempt,submitSimulationAction,getMySimulationAttempts,getSimulationActions,downloadSimulationReport} from "./api.js";

export default function Dashboard({ user, onLogout }) {
  const [assessmentOpen, setAssessmentOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">N</span>
          <span>Nudle LMS</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>⌂</span>
            Home
          </NavLink>

          <button
            className="nav-item nav-button"
            onClick={() => setAssessmentOpen(!assessmentOpen)}
            aria-expanded={assessmentOpen}
            aria-controls="assessment-submenu"
          >
            <span>▤</span>
            Assessment
            <span className="nav-chevron">
              {assessmentOpen ? "⌄" : "›"}
            </span>
          </button>

          {assessmentOpen && (
            <div id="assessment-submenu" className="submenu">
              <NavLink
                to="/dashboard/assessments"
                className={({ isActive }) =>
                  isActive ? "sub-item active" : "sub-item"
                }
              >
                Assessments
              </NavLink>

              <NavLink
                to="/dashboard/activities"
                className={({ isActive }) =>
                  isActive ? "sub-item active" : "sub-item"
                }
              >
                Activities
              </NavLink>

              <NavLink
                to="/dashboard/simulations"
                className={({ isActive }) =>
                  isActive ? "sub-item active" : "sub-item"
                }
              >
                Simulations
              </NavLink>
            </div>
          )}
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          Log out
        </button>
      </aside>

      {/* MAIN AREA */}
      <div className="dashboard-main">

        {/* TOP HEADER */}
        <header className="dashboard-header">
          <div className="header-brand">
            <div className="header-logo">N</div>
            <div>
              <h2>Nudle Learning Platform</h2>
              <p>Interactive Hardware Troubleshooting</p>
            </div>
          </div>

          <div className="header-user">
            <button
                type="button"
                className="dashboard-profile-button"
                onClick={() => navigate("/dashboard/profile")}
                title="View my profile">
                <span className="dashboard-avatar">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                </span>

                <span className="dashboard-profile-details">
                    <strong>{user?.full_name}</strong>
                    <small>Learner</small>
                </span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


// HOME PAGE
export function Home({ user }) {
  return (
    <div className="home-page">

      <section className="welcome-section">
        <span className="welcome-label">WELCOME TO NUDLE</span>

        <h1>
          Hello, {user?.full_name?.split(" ")[0] || "Learner"}!
        </h1>

        <h2>Learn by doing.</h2>

        <p>
          Nudle LMS is an interactive learning platform
          designed to help learners develop practical
          computer hardware troubleshooting skills.
          Explore assessments, investigate hardware
          faults, make diagnostic decisions, and receive
          immediate feedback on your performance.
        </p>

        <Link
          to="/dashboard/assessments"
          className="explore-button"
        >
          Explore Assessments →
        </Link>
      </section>

      <h2 className="section-heading">Your Learning Journey</h2>

      <div className="learning-grid">
        <Link to="/dashboard/assessments" className="learning-card">
          <span className="card-icon">▤</span>
          <h3>Assessments</h3>
          <p>Access learning assessments and develop your knowledge.</p>
          <span className="card-link">View Assessments →</span>
        </Link>

        <Link to="/dashboard/activities" className="learning-card">
          <span className="card-icon">◈</span>
          <h3>Activities</h3>
          <p>Explore interactive activities and hardware scenarios.</p>
          <span className="card-link">View Activities →</span>
        </Link>

        <Link to="/dashboard/simulations" className="learning-card">
          <span className="card-icon">▣</span>
          <h3>Simulations</h3>
          <p>Diagnose realistic faults and receive feedback.</p>
          <span className="card-link">Start Learning →</span>
        </Link>
      </div>
    </div>
  );
}



// ASSESSMENTS PAGE
export function Assessments() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadAssessments() {
            try {
                const data = await getAllAssessments();

                console.log("Assessments:", data);

                if (active) {
                    setAssessments(
                        data.filter(item => item.is_active)
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

        loadAssessments();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="content-page">
            <h1>Assessments</h1>

            <p>
                Explore your available hardware
                troubleshooting assessments.
            </p>

            {loading && <p>Loading assessments...</p>}

            {error && (
                <p className="admin-error">
                    {error}
                </p>
            )}

            {!loading && !error && assessments.length === 0 && (
                <p>No assessments are currently available.</p>
            )}

            {!loading && !error && assessments.map(assessment => (
                <div
                    className="content-panel"
                    key={assessment.assessment_id}
                >
                    <h3>{assessment.title}</h3>

                    <p>{assessment.description}</p>

                    <Link
                        to={`/dashboard/activities?assessment_id=${assessment.assessment_id}`}
                        className="explore-button"
                    >
                        View Activities →
                    </Link>
                </div>
            ))}
        </div>
    );
}


// ACTIVITIES PAGE
export function Activities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchParams] = useSearchParams();

    const assessmentId = searchParams.get("assessment_id");

    useEffect(() => {
        let active = true;

        async function loadActivities() {
            setLoading(true);
            setError("");

            try {
                const data = await getAllActivities();

                console.log("Activities:", data);

                const filteredActivities = data.filter(activity => {
                    const isActive = activity.is_active;

                    const belongsToAssessment = assessmentId
                        ? Number(activity.assessment_id) === Number(assessmentId)
                        : true;

                    return isActive && belongsToAssessment;
                });

                if (active) {
                    setActivities(filteredActivities);
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

        loadActivities();

        return () => {
            active = false;
        };
    }, [assessmentId]);

    return (
        <div className="content-page">
            <h1>Activities</h1>

            <p>
                Explore the activities available on Nudle LMS.
            </p>

            {loading && <p>Loading activities...</p>}

            {error && (
                <p className="admin-error">
                    {error}
                </p>
            )}

            {!loading && !error && activities.length === 0 && (
                <p>No activities are currently available.</p>
            )}

            {!loading && !error && activities.map(activity => (
                <div
                    className="content-panel"
                    key={activity.activity_id}
                >
                    <h3>{activity.title}</h3>

                    <p>{activity.description}</p>

                    <p className="activity-type">
                        Scenario: {activity.scenario_type.replaceAll("_", " ")}
                    </p>

                    <Link
                        to={`/dashboard/simulations?activity_id=${activity.activity_id}`}
                        className="explore-button"
                    >
                        View Simulations →
                    </Link>
                </div>
            ))}
        </div>
    );
}


// SIMULATION PAGE

export function Simulations() {
    const [searchParams] = useSearchParams();
    const activityId = searchParams.get("activity_id");

    const [simulations, setSimulations] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [currentAttempt, setCurrentAttempt] = useState(null);
    const [actions, setActions] = useState([]);
    const [feedback, setFeedback] = useState("");

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    async function loadResults() {
        const data = await getMySimulationAttempts();
        setAttempts(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        let active = true;

        async function loadPage() {
            setLoading(true);
            setError("");

            try {
                const [simulationData, attemptData] =
                    await Promise.all([
                        getAllSimulations(),
                        getMySimulationAttempts()
                    ]);

                if (!active) return;

                setSimulations(
                    Array.isArray(simulationData)
                        ? simulationData.filter(sim => {
                            const matchesActivity = activityId
                                ? Number(sim.activity_id) ===
                                  Number(activityId)
                                : true;

                            return sim.is_active && matchesActivity;
                        })
                        : []
                );

                setAttempts(
                    Array.isArray(attemptData)
                        ? attemptData
                        : []
                );

            } catch (err) {
                if (active) setError(err.message);

            } finally {
                if (active) setLoading(false);
            }
        }

        loadPage();

        return () => {
            active = false;
        };
    }, [activityId]);

    async function loadActionHistory(attemptId) {
        const data = await getSimulationActions(attemptId);
        setActions(Array.isArray(data) ? data : []);
    }

    async function handleStart(simulationId) {
        if (busy) return;

        setBusy(true);
        setError("");
        setFeedback("");
        setActions([]);

        try {
            const data = await startSimulation(simulationId);

            setCurrentAttempt(data);

            await Promise.all([
                loadResults(),
                loadActionHistory(data.attempt_id)
            ]);

        } catch (err) {
            setError(err.message);

        } finally {
            setBusy(false);
        }
    }

    async function handleResume(attemptId) {
        if (busy) return;

        setBusy(true);
        setError("");
        setFeedback("");

        try {
            const data = await getSimulationAttempt(attemptId);

            setCurrentAttempt(data);
            await loadActionHistory(attemptId);

        } catch (err) {
            setError(err.message);

        } finally {
            setBusy(false);
        }
    }

    async function handleDecision(option) {
        if (
            busy ||
            !currentAttempt ||
            currentAttempt.status !== "in_progress"
        ) {
            return;
        }

        setBusy(true);
        setError("");
        setFeedback("");

        try {
            const result = await submitSimulationAction(
                currentAttempt.attempt_id,
                option.action_type,
                option.action_value
            );

            setFeedback(result.feedback || "");

            setCurrentAttempt(previous => ({
                ...previous,
                score: result.score,
                max_score: result.max_score,
                status: result.status,
                current_step: result.current_step,
                expected_fault: result.expected_fault
                    ?? previous.expected_fault
            }));

            await Promise.all([
                loadActionHistory(currentAttempt.attempt_id),
                loadResults()
            ]);

        } catch (err) {
            setError(err.message);

        } finally {
            setBusy(false);
        }
    }

    async function handleExport() {
        setExporting(true);
        setError("");

        try {
            await downloadSimulationReport();
        } catch (err) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    }

    function backToSimulations() {
        setCurrentAttempt(null);
        setActions([]);
        setFeedback("");
        setError("");
    }

    const getLatestAttempt = simulationId => {
        return attempts.find(
            attempt =>
                Number(attempt.simulation_id) ===
                Number(simulationId)
        );
    };

    const visibleResults = attempts.filter(attempt =>
        activityId
            ? simulations.some(sim =>
                Number(sim.simulation_id) ===
                Number(attempt.simulation_id)
            )
            : true
    );

    if (loading) {
        return (
            <div className="content-page">
                <h1>Simulations</h1>
                <p>Loading simulations...</p>
            </div>
        );
    }

    return (
        <div className="content-page simulation-page">
            <h1>Simulations</h1>

            <p>
                Practice troubleshooting computer hardware
                problems through interactive scenarios.
            </p>

            {error && (
                <p className="simulation-error" role="alert">
                    {error}
                </p>
            )}

            {currentAttempt ? (
                <div className="simulation-player">
                    <button
                        type="button"
                        className="simulation-back"
                        onClick={backToSimulations}
                        disabled={busy}
                    >
                        ← Back to Simulations
                    </button>

                    <div className="simulation-progress-panel">
                        <div className="simulation-progress-header">
                            <div>
                                <h2>{currentAttempt.title}</h2>
                                <span>
                                    {currentAttempt.status === "completed"
                                        ? "Completed"
                                        : "In progress"}
                                </span>
                            </div>

                            <strong>
                                {currentAttempt.score} /{" "}
                                {currentAttempt.max_score}
                            </strong>
                        </div>

                        <div className="simulation-progress-track">
                            <div
                                className="simulation-progress-fill"
                                style={{
                                    width: `${
                                        currentAttempt.max_score > 0
                                            ? Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    currentAttempt.score /
                                                    currentAttempt.max_score *
                                                    100
                                                )
                                            )
                                            : 0
                                    }%`
                                }}
                            />
                        </div>
                    </div>

                    <section className="simulation-scenario">
                        <h3>
                            {currentAttempt.status === "completed"
                                ? "Simulation completed"
                                : "Investigate the problem"}
                        </h3>

                        <p>
                            {currentAttempt.current_step?.symptom}
                        </p>

                        {currentAttempt.status === "completed" ? (
                            <div className="simulation-completion">
                                <h3>Results saved successfully</h3>

                                <p>
                                    Final score:{" "}
                                    <strong>
                                        {currentAttempt.score} /{" "}
                                        {currentAttempt.max_score}
                                    </strong>
                                </p>

                                {currentAttempt.expected_fault && (
                                    <p>
                                        Correct fault:{" "}
                                        <strong>
                                            {currentAttempt.expected_fault
                                                .replaceAll("_", " ")}
                                        </strong>
                                    </p>
                                )}

                                <p>
                                    Your diagnostic decisions and score
                                    have been saved to your profile.
                                </p>

                                <button
                                    type="button"
                                    className="explore-button"
                                    onClick={handleExport}
                                    disabled={exporting}
                                >
                                    {exporting
                                        ? "Exporting..."
                                        : "Export My Results"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h4>Choose your next diagnostic action</h4>

                                <div className="simulation-options">
                                    {(
                                        currentAttempt.current_step?.options
                                        ?? []
                                    ).map(option => (
                                        <button
                                            type="button"
                                            className="simulation-option"
                                            key={
                                                `${option.action_type}-` +
                                                option.action_value
                                            }
                                            onClick={() =>
                                                handleDecision(option)
                                            }
                                            disabled={busy}
                                        >
                                            <span>{option.label}</span>
                                            <span>→</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {feedback && (
                            <div
                                className="simulation-feedback"
                                role="status"
                            >
                                <strong>Diagnostic Feedback</strong>
                                <p>{feedback}</p>
                            </div>
                        )}
                    </section>

                    <section className="simulation-history">
                        <h3>Your Diagnostic History</h3>

                        {actions.length === 0 ? (
                            <p>
                                No diagnostic actions recorded yet.
                            </p>
                        ) : (
                            <div className="simulation-action-list">
                                {actions.map(action => (
                                    <div
                                        className="simulation-action-item"
                                        key={action.action_id}
                                    >
                                        <div className="simulation-action-heading">
                                            <strong>
                                                {action.action_value
                                                    .replaceAll("_", " ")}
                                            </strong>

                                            <span>
                                                {action.points_awarded > 0
                                                    ? "+"
                                                    : ""}
                                                {action.points_awarded} pts
                                            </span>
                                        </div>

                                        <p>{action.feedback}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            ) : (
                <>
                    <div className="simulation-section-heading">
                        <h2>Available Simulations</h2>

                        <button
                            type="button"
                            className="simulation-export"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting
                                ? "Exporting..."
                                : "Export My Results"}
                        </button>
                    </div>

                    {simulations.length === 0 ? (
                        <div className="content-panel">
                            <p>
                                No active simulations are currently
                                available for this activity.
                            </p>
                        </div>
                    ) : (
                        <div className="simulation-grid">
                            {simulations.map(simulation => {
                                const latest = getLatestAttempt(
                                    simulation.simulation_id
                                );

                                const inProgress = attempts.find(
                                    attempt =>
                                        Number(attempt.simulation_id) ===
                                        Number(simulation.simulation_id) &&
                                        attempt.status === "in_progress"
                                );

                                return (
                                    <div
                                        className="simulation-card"
                                        key={simulation.simulation_id}
                                    >
                                        <div className="simulation-card-icon">
                                            ▣
                                        </div>

                                        <h3>{simulation.title}</h3>

                                        <p>
                                            Interactive hardware
                                            troubleshooting scenario.
                                        </p>

                                        <div className="simulation-card-meta">
                                            <span>
                                                Max score:{" "}
                                                {simulation.max_score}
                                            </span>

                                            {latest && (
                                                <span>
                                                    Latest: {latest.score} pts
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="explore-button"
                                            onClick={() =>
                                                inProgress
                                                    ? handleResume(
                                                        inProgress.attempt_id
                                                    )
                                                    : handleStart(
                                                        simulation.simulation_id
                                                    )
                                            }
                                            disabled={busy}
                                        >
                                            {inProgress
                                                ? "Resume Simulation →"
                                                : "Start Simulation →"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <section className="simulation-results-section">
                        <div className="simulation-section-heading">
                            <h2>My Simulation Results</h2>
                        </div>

                        {visibleResults.length === 0 ? (
                            <p>
                                You haven't attempted any simulations yet.
                            </p>
                        ) : (
                            <div className="simulation-results-scroll">
                                <table className="simulation-results-table">
                                    <thead>
                                        <tr>
                                            <th>Simulation</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {visibleResults.map(attempt => (
                                            <tr key={attempt.attempt_id}>
                                                <td>{attempt.title}</td>
                                                <td>
                                                    {attempt.score} /{" "}
                                                    {attempt.max_score}
                                                </td>
                                                <td>
                                                    {attempt.status.replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="simulation-table-button"
                                                        onClick={() =>
                                                            handleResume(
                                                                attempt.attempt_id
                                                            )
                                                        }
                                                        disabled={busy}
                                                    >
                                                        {attempt.status ===
                                                        "completed"
                                                            ? "View Result"
                                                            : "Resume"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}


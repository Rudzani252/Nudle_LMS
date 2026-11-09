
import { useEffect, useState } from "react";
import {Routes,Route, Navigate,useNavigate} from "react-router-dom";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import AdminSimulations from "./AdminSimulations.jsx";
import Dashboard, {Home,Assessments,Activities, Simulations} from "./Dashboard.jsx";
import AdminDashboard, {AdminHome, AdminAssessments,AdminActivities} from "./AdminDashboard.jsx";
import {getCurrentUser,logoutUser} from "./api.js";
import Profile from "./Profile.jsx";
import AdminLearners from "./AdminLearners.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        async function checkAuthentication() {
            const token = sessionStorage.getItem("access_token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await getCurrentUser();

                if (active) {
                    setUser(currentUser);
                }
            } catch {
                logoutUser();
            } finally {
                if (active) setLoading(false);
            }
        }

        checkAuthentication();

        return () => {
            active = false;
        };
    }, []);

    const homePath = user?.role === "admin"
        ? "/admin"
        : "/dashboard";

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);

        navigate(
            loggedInUser.role === "admin"
                ? "/admin"
                : "/dashboard",
            { replace: true }
        );
    };

    const handleLogout = () => {
        logoutUser();
        setUser(null);
        navigate("/login", { replace: true });
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    user
                        ? <Navigate to={homePath} replace />
                        : <Login onLogin={handleLogin} />
                }
            />

            <Route
                path="/register"
                element={
                    user
                        ? <Navigate to={homePath} replace />
                        : <Register />
                }
            />

            {/* ADMIN ROUTES */}
            <Route
                path="/admin"
                element={
                    user?.role === "admin"
                        ? (
                            <AdminDashboard
                                user={user}
                                onLogout={handleLogout}
                            />
                        )
                        : <Navigate to={user ? homePath : "/login"} replace />
                }
            >
                <Route index element={<AdminHome />} />
                <Route
                    path="learners"element={<AdminLearners />}/>
                <Route
                    path="assessments"
                    element={<AdminAssessments />}
                />

                <Route
                    path="activities"
                    element={<AdminActivities />}
                />
                <Route
                    path="simulations"
                    element={<AdminSimulations />}
                />
            </Route>

            {/* LEARNER ROUTES */}
            <Route
                path="/dashboard"
                element={
                    user?.role === "learner"
                        ? (
                            <Dashboard
                                user={user}
                                onLogout={handleLogout}
                            />
                        )
                        : <Navigate to={user ? homePath : "/login"} replace />
                }>
                <Route index element={<Home user={user} />} />

                <Route
                    path="assessments"
                    element={<Assessments />}
                />

                <Route
                    path="activities"
                    element={<Activities />}
                />

                <Route
                    path="simulations"
                    element={<Simulations />}
                />
                <Route
                  path="profile"
                  element={<Profile />}/>
            </Route>

            <Route
                path="*"
                element={<Navigate to={user ? homePath : "/login"} replace />}
            />
        </Routes>
    );
}

export default App;

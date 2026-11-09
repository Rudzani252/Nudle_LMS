import {loginUser,getCurrentUser, logoutUser} from "./api";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css"


export default function Login({onLogin}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try{
        console.log("Attempting login...");
        const loginResponse = await loginUser(email, password);

        console.log("Login successful:", {
            status: loginResponse.status,
            role: loginResponse.user?.role
        });

        console.log("Getting current user...");
        const user = await getCurrentUser();
        console.log("Current user:", user);

        onLogin(user)

    }catch(err){
        logoutUser();
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-icon">N</div>
          <h1>Nudle LMS</h1>
          <p>Learn. Practice. Improve.</p>
        </div>

        <div className="login-card">
          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to continue your learning journey.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="register-text">
            New to Nudle?{" "}
            <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );

}



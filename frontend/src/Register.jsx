
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "./api.js";
import "./Login.css";

export default function Register() {
    const navigate = useNavigate();

    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone_no, setPhoneNo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            await registerUser(
                full_name.trim(),
                email.trim(),
                password,
                phone_no.trim() || null
            );

            navigate("/login", {
                replace: true,
                state: {
                    message: "Account created successfully. Please log in."
                }
            });

        } catch (err) {
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
                    <h2>Create your account</h2>

                    <p className="login-subtitle">
                        Join Nudle LMS and develop practical
                        hardware troubleshooting skills.
                    </p>

                    <form onSubmit={handleRegister}>

                        <div className="form-group">
                            <label htmlFor="full_name">
                                Full Name
                            </label>

                            <input
                                id="full_name"
                                type="text"
                                placeholder="Enter your full name"
                                value={full_name}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_no">
                                Phone Number (Optional)
                            </label>

                            <input
                                id="phone_no"
                                type="tel"
                                placeholder="e.g. 0821234567"
                                value={phone_no}
                                onChange={(e) =>
                                    setPhoneNo(e.target.value)
                                }
                                autoComplete="tel"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            className="login-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                        </button>
                    </form>

                    <p className="register-text">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>

                <p className="login-footer">
                    © 2026 Nudle LMS. All rights reserved.
                </p>
            </div>
        </div>
    );
}

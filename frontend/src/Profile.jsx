
import { useEffect, useState } from "react";
import { getCurrentUser, getUserDetails, updateUser } from "./api.js";
import "./Profile.css";

export default function Profile() {
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone_no: "",
        password: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadProfile(id) {
        const data = await getUserDetails(id);

        setProfile(data);

        setForm({
            full_name: data.full_name || "",
            email: data.email || "",
            phone_no: data.phone_no || "",
            password: ""
        });

        return data;
    }

    useEffect(() => {
        let active = true;

        async function fetchProfile() {
            try {
                const currentUser = await getCurrentUser();

                if (!active) return;

                setUserId(currentUser.user_id);

                const data = await getUserDetails(
                    currentUser.user_id
                );

                if (!active) return;

                setProfile(data);

                setForm({
                    full_name: data.full_name || "",
                    email: data.email || "",
                    phone_no: data.phone_no || "",
                    password: ""
                });

            } catch (err) {
                if (active) setError(err.message);

            } finally {
                if (active) setLoading(false);
            }
        }

        fetchProfile();

        return () => {
            active = false;
        };
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    function handleCancel() {
        setForm({
            full_name: profile.full_name || "",
            email: profile.email || "",
            phone_no: profile.phone_no || "",
            password: ""
        });

        setEditing(false);
        setError("");
    }

    async function handleUpdate(event) {
        event.preventDefault();

        if (!userId || saving) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const updatedData = {};

            if (form.full_name.trim() !== profile.full_name) {
                updatedData.full_name = form.full_name.trim();
            }

            if (form.email.trim() !== profile.email) {
                updatedData.email = form.email.trim();
            }

            if (form.phone_no.trim() !== (profile.phone_no || "")) {
                updatedData.phone_no = form.phone_no.trim();
            }

            if (form.password) {
                if (form.password.length < 8) {
                    throw new Error(
                        "Password must contain at least 8 characters."
                    );
                }

                updatedData.password = form.password;
            }

            if (Object.keys(updatedData).length === 0) {
                setMessage("No changes were made.");
                setEditing(false);
                return;
            }

            await updateUser(userId, updatedData);

            await loadProfile(userId);

            setEditing(false);
            setMessage("Profile updated successfully!");

        } catch (err) {
            setError(err.message);

        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="content-page">
                <h1>My Profile</h1>
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="content-page profile-page">
            <h1>My Profile</h1>

            <p>
                View and manage your personal information.
            </p>

            {error && (
                <p className="profile-error" role="alert">
                    {error}
                </p>
            )}

            {message && (
                <p className="profile-success" role="status">
                    {message}
                </p>
            )}

            {profile && (
                <div className="profile-card">
                    <div className="profile-heading">
                        <span className="profile-large-avatar">
                            {profile.full_name?.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <h2>{profile.full_name}</h2>
                            <p>{profile.role || "Learner"}</p>
                        </div>
                    </div>

                    {!editing ? (
                        <>
                            <div className="profile-information">
                                <div className="profile-field">
                                    <span>Full Name</span>
                                    <strong>{profile.full_name}</strong>
                                </div>

                                <div className="profile-field">
                                    <span>Email Address</span>
                                    <strong>{profile.email}</strong>
                                </div>

                                <div className="profile-field">
                                    <span>Phone Number</span>
                                    <strong>
                                        {profile.phone_no || "Not provided"}
                                    </strong>
                                </div>

                                <div className="profile-field">
                                    <span>Account Role</span>
                                    <strong>
                                        {profile.role || "Learner"}
                                    </strong>
                                </div>

                                <div className="profile-field">
                                    <span>Account Status</span>
                                    <strong>
                                        {profile.is_active === false
                                            ? "Inactive"
                                            : "Active"}
                                    </strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="profile-primary-button"
                                onClick={() => {
                                    setEditing(true);
                                    setMessage("");
                                }}
                            >
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleUpdate}>
                            <div className="profile-edit-fields">
                                <div className="profile-input-group">
                                    <label htmlFor="full_name">
                                        Full Name
                                    </label>

                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        minLength={2}
                                        maxLength={50}
                                        value={form.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="profile-input-group">
                                    <label htmlFor="email">
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="profile-input-group">
                                    <label htmlFor="phone_no">
                                        Phone Number
                                    </label>

                                    <input
                                        id="phone_no"
                                        name="phone_no"
                                        type="tel"
                                        value={form.phone_no}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="profile-input-group">
                                    <label htmlFor="password">
                                        New Password (optional)
                                    </label>

                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        minLength={8}
                                        autoComplete="new-password"
                                        onChange={handleChange}
                                        placeholder="Leave blank to keep current password"
                                    />
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button
                                    type="submit"
                                    className="profile-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    className="profile-secondary-button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

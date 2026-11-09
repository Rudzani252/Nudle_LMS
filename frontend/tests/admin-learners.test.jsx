import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminLearners from "../src/AdminLearners.jsx";
import * as api from "../src/api.js";

vi.mock("../src/api.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    registerUser: vi.fn(),
    getUserDetails: vi.fn(),
    updateUser: vi.fn(),
    viewAllLearners: vi.fn(),
    deleteUser: vi.fn(),
    updateLearnerStatus: vi.fn(),
  };
});

const learner = { user_id: 3, full_name: "Sample Learner", email: "learner@example.com", phone_no: "0712345678", role: "learner", is_active: true };

beforeEach(() => {
  api.viewAllLearners.mockResolvedValue([learner]);
  api.getUserDetails.mockResolvedValue(learner);
  api.registerUser.mockResolvedValue({ user_id: 4 });
  api.updateUser.mockResolvedValue({ message: "Updated" });
  api.updateLearnerStatus.mockResolvedValue({ is_active: false });
  api.deleteUser.mockResolvedValue({ message: "Deleted" });
  vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("admin learner management", () => {
  it("loads a learner list", async () => {
    render(<AdminLearners />);
    expect(await screen.findByText("Sample Learner")).toBeInTheDocument();
    expect(screen.getByText("learner@example.com")).toBeInTheDocument();
  });

  it("adds a learner using the existing registerUser signature", async () => {
    render(<AdminLearners />);
    fireEvent.click(screen.getByRole("button", { name: /add learner/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "New Student" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "safePassword123" } });
    fireEvent.click(within(document.querySelector("form")).getByRole("button", { name: /^add learner$/i }));
    await waitFor(() => expect(api.registerUser).toHaveBeenCalledWith("New Student", "new@example.com", "safePassword123", ""));
  });

  it("edits a learner and only submits changed fields", async () => {
    render(<AdminLearners />);
    await screen.findByText("Sample Learner");
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(await screen.findByDisplayValue("Sample Learner")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Updated Student" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(api.updateUser).toHaveBeenCalledWith(3, { full_name: "Updated Student" }));
  });

  it("deactivates learner after confirmation", async () => {
    render(<AdminLearners />);
    fireEvent.click(await screen.findByRole("button", { name: /deactivate/i }));
    await waitFor(() => expect(api.updateLearnerStatus).toHaveBeenCalledWith(3, false));
  });

  it("deletes a learner after confirmation", async () => {
    render(<AdminLearners />);
    fireEvent.click(await screen.findByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(api.deleteUser).toHaveBeenCalledWith(3));
  });
});

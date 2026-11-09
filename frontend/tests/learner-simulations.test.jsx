import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Use your actual Dashboard.jsx; tests don't make network requests.
import { Simulations, Assessments, Activities } from "../src/Dashboard.jsx";
import * as api from "../src/api.js";

vi.mock("../src/api.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAllSimulations: vi.fn(),
    getMySimulationAttempts: vi.fn(),
    startSimulation: vi.fn(),
    getSimulationAttempt: vi.fn(),
    submitSimulationAction: vi.fn(),
    getSimulationActions: vi.fn(),
    downloadSimulationReport: vi.fn(),
    getAllAssessments: vi.fn(),
    getAllActivities: vi.fn(),
  };
});

const simulations = [
  { simulation_id: 7, activity_id: 2, title: "RAM diagnosis", max_score: 100, is_active: true },
  { simulation_id: 8, activity_id: 3, title: "PSU diagnosis", max_score: 100, is_active: true },
  { simulation_id: 9, activity_id: 2, title: "Hidden scenario", max_score: 100, is_active: false },
];
const step = {
  node_id: "start", symptom: "Computer repeatedly crashes.", terminal: false,
  options: [{ label: "Test RAM", action_type: "inspect", action_value: "ram_test" }],
};

function renderAt(ui, path) {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

beforeEach(() => {
  api.getAllSimulations.mockResolvedValue(simulations);
  api.getMySimulationAttempts.mockResolvedValue([]);
  api.getSimulationActions.mockResolvedValue([]);
  api.getAllAssessments.mockResolvedValue([
    { assessment_id: 1, title: "Hardware", description: "Learn hardware", is_active: true },
    { assessment_id: 2, title: "Inactive", description: "Hidden", is_active: false },
  ]);
  api.getAllActivities.mockResolvedValue([
    { activity_id: 2, assessment_id: 1, title: "RAM workshop", description: "Test RAM", scenario_type: "hardware_troubleshooting", is_active: true },
    { activity_id: 3, assessment_id: 2, title: "Unrelated workshop", description: "Test PSU", scenario_type: "hardware_troubleshooting", is_active: true },
  ]);
});

describe("database-driven learner pages", () => {
  it("shows only active assessments from API", async () => {
    renderAt(<Assessments />, "/dashboard/assessments");
    expect(await screen.findByText("Hardware")).toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view activities/i })).toHaveAttribute("href", "/dashboard/activities?assessment_id=1");
  });

  it("shows only activities for the selected assessment", async () => {
    renderAt(<Activities />, "/dashboard/activities?assessment_id=1");
    expect(await screen.findByText("RAM workshop")).toBeInTheDocument();
    expect(screen.queryByText("Unrelated workshop")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view simulations/i })).toHaveAttribute("href", "/dashboard/simulations?activity_id=2");
  });

  it("loads active simulations from the selected activity", async () => {
    renderAt(<Simulations />, "/dashboard/simulations?activity_id=2");
    expect(await screen.findByText("RAM diagnosis")).toBeInTheDocument();
    expect(screen.queryByText("PSU diagnosis")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden scenario")).not.toBeInTheDocument();
  });

  it("starts, submits a diagnostic action, and displays saved scoring", async () => {
    api.startSimulation.mockResolvedValue({
      attempt_id: 44, simulation_id: 7, title: "RAM diagnosis", score: 0,
      max_score: 100, status: "in_progress", current_step: step,
    });
    api.submitSimulationAction.mockResolvedValue({
      attempt_id: 44, score: 20, max_score: 100, status: "in_progress",
      feedback: "Memory errors found.", points_awarded: 20,
      current_step: { node_id: "diagnose", symptom: "Which component failed?", terminal: false,
        options: [{ label: "Faulty RAM", action_type: "diagnose", action_value: "faulty_ram" }] },
    });
    renderAt(<Simulations />, "/dashboard/simulations?activity_id=2");
    fireEvent.click(await screen.findByRole("button", { name: /start simulation/i }));
    expect(await screen.findByText("Computer repeatedly crashes.")).toBeInTheDocument();
    expect(api.startSimulation).toHaveBeenCalledWith(7);
    fireEvent.click(screen.getByRole("button", { name: /test ram/i }));
    expect(await screen.findByText("Memory errors found.")).toBeInTheDocument();
    expect(await screen.findByText("Which component failed?")).toBeInTheDocument();
    expect(api.submitSimulationAction).toHaveBeenCalledWith(44, "inspect", "ram_test");
  });

  it("resumes a saved unfinished attempt", async () => {
    api.getMySimulationAttempts.mockResolvedValue([{
      attempt_id: 44, simulation_id: 7, title: "RAM diagnosis", score: 20,
      max_score: 100, status: "in_progress",
    }]);
    api.getSimulationAttempt.mockResolvedValue({
      attempt_id: 44, simulation_id: 7, title: "RAM diagnosis", score: 20,
      max_score: 100, status: "in_progress", current_step: step,
    });
    renderAt(<Simulations />, "/dashboard/simulations?activity_id=2");
    // There are two Resume buttons (card and results table); choose first.
    const resumeButtons = await screen.findAllByRole("button", { name: /resume simulation|^resume$/i });
    fireEvent.click(resumeButtons[0]);
    expect(await screen.findByText("Computer repeatedly crashes.")).toBeInTheDocument();
    expect(api.getSimulationAttempt).toHaveBeenCalledWith(44);
  });

  it("calls CSV export when requested", async () => {
    api.downloadSimulationReport.mockResolvedValue(undefined);
    renderAt(<Simulations />, "/dashboard/simulations?activity_id=2");
    fireEvent.click(await screen.findByRole("button", { name: /export my results/i }));
    await waitFor(() => expect(api.downloadSimulationReport).toHaveBeenCalledOnce());
  });
});

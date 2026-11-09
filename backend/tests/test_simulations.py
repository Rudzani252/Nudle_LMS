"""Integration tests across scenario CRUD, branching and persistence."""
import pytest
from Models import SimulationAttempt, SimulationAction


def create_simulation(client, scenario):
    response = client.post("/simulation/add", json=scenario)
    assert response.status_code == 201, response.text
    return response.json()["simulation_id"]


def test_admin_creates_and_lists_simulation(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    response = admin.get("/all_simulations")
    assert response.status_code == 200, response.text
    assert any(s["simulation_id"] == simulation_id for s in response.json())


def test_learner_cannot_create_simulation(client_factory, scenario):
    learner = client_factory("learner")
    response = learner.post("/simulation/add", json=scenario)
    assert response.status_code == 403, response.text


def test_invalid_scenario_is_rejected(client_factory, scenario):
    admin = client_factory("admin")
    scenario["symptoms_json"]["nodes"]["start"]["options"][0]["next_node"] = "missing_node"
    response = admin.post("/simulation/add", json=scenario)
    assert response.status_code == 422, response.text


def test_admin_can_update_title_and_view_details(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    updated = admin.patch(f"/simulation/update/{simulation_id}", json={"title": "Updated title"})
    assert updated.status_code == 200, updated.text

    viewed = admin.get(f"/view_simulation/{simulation_id}")
    assert viewed.status_code == 200, viewed.text
    assert viewed.json()["title"] == "Updated title"
    assert "symptoms_json" in viewed.json()


def test_learner_view_does_not_reveal_answers(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    learner = client_factory("learner")
    response = learner.get(f"/view_simulation/{simulation_id}")
    assert response.status_code == 200, response.text
    assert "expected_fault" not in response.json()
    assert "symptoms_json" not in response.json()


def test_learners_resume_and_save_diagnostic_actions(client_factory, scenario, db_session, identities):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    learner = client_factory("learner")

    started = learner.post(f"/simulation/{simulation_id}/start")
    assert started.status_code in (200, 201), started.text
    attempt_id = started.json()["attempt_id"]
    assert started.json()["current_step"]["node_id"] == "start"

    # Start again should resume, not create another unfinished attempt.
    resumed = learner.post(f"/simulation/{simulation_id}/start")
    assert resumed.status_code in (200, 201), resumed.text
    assert resumed.json()["attempt_id"] == attempt_id

    action = learner.post(f"/simulation-attempt/{attempt_id}/action", json={"action_type": "inspect", "action_value": "ram_test"})
    assert action.status_code == 200, action.text
    assert action.json()["score"] == 20
    assert action.json()["current_step"]["node_id"] == "diagnose"

    completed = learner.post(f"/simulation-attempt/{attempt_id}/action", json={"action_type": "diagnose", "action_value": "faulty_ram"})
    assert completed.status_code == 200, completed.text
    assert completed.json()["score"] == 100
    assert completed.json()["status"] == "completed"

    saved_attempt = db_session.get(SimulationAttempt, attempt_id)
    db_session.refresh(saved_attempt)
    assert saved_attempt.learner_id == identities["learner"].user_id
    assert saved_attempt.score == 100
    assert saved_attempt.status == "completed"
    assert db_session.query(SimulationAction).filter_by(attempt_id=attempt_id).count() == 2

    history = learner.get("/simulation-attempts/me")
    assert history.status_code == 200, history.text
    assert any(item["attempt_id"] == attempt_id for item in history.json())

    actions = learner.get(f"/simulation-attempt/{attempt_id}/actions")
    assert actions.status_code == 200, actions.text
    assert len(actions.json()) == 2


def test_invalid_action_does_not_increase_score(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    learner = client_factory("learner")
    attempt_id = learner.post(f"/simulation/{simulation_id}/start").json()["attempt_id"]
    response = learner.post(f"/simulation-attempt/{attempt_id}/action", json={"action_type": "inspect", "action_value": "fabricated_action"})
    assert response.status_code == 400, response.text
    attempt = learner.get(f"/simulation-attempts/{attempt_id}")
    assert attempt.status_code == 200, attempt.text
    assert attempt.json()["score"] == 0


def test_cannot_delete_simulation_with_attempts(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    learner = client_factory("learner")
    assert learner.post(f"/simulation/{simulation_id}/start").status_code in (200, 201)
    admin = client_factory("admin")
    response = admin.delete(f"/simulation/delete/{simulation_id}")
    assert response.status_code == 200, response.text
    listing_response = admin.get("/simulations")
    print("Status:", listing_response.status_code)
    print("Response:", listing_response.json())


def test_learner_csv_export(client_factory, scenario):
    admin = client_factory("admin")
    simulation_id = create_simulation(admin, scenario)
    learner = client_factory("learner")
    learner.post(f"/simulation/{simulation_id}/start")
    response = learner.get("/reports/simulation-attempts.csv")
    assert response.status_code == 200, response.text
    assert "text/csv" in response.headers["content-type"]
    assert "RAM fault exercise" in response.text

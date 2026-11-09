"""Security and learner management endpoints using the same isolated DB fixture."""


def test_admin_lists_learners(client_factory, identities):
    admin = client_factory("admin")
    response = admin.get("/admin/learners")
    assert response.status_code == 200, response.text
    users = response.json()
    assert any(u["user_id"] == identities["learner"].user_id for u in users)


def test_learner_cannot_list_all_learners(client_factory):
    learner = client_factory("learner")
    response = learner.get("/admin/learners")
    assert response.status_code == 403, response.text


def test_admin_can_deactivate_learner(client_factory, identities, db_session):
    admin = client_factory("admin")
    learner_id = identities["learner"].user_id
    response = admin.patch(f"/admin/learners/{learner_id}/status", json={"is_active": False})
    assert response.status_code == 200, response.text
    db_session.refresh(identities["learner"])
    assert identities["learner"].is_active is False


def test_learner_cannot_change_own_status(client_factory, identities):
    learner = client_factory("learner")
    response = learner.patch(
        f"/admin/learners/{identities['learner'].user_id}/status",
        json={"is_active": False},
    )
    assert response.status_code == 403, response.text


def test_admin_edits_learner_name(client_factory, identities, db_session):
    admin = client_factory("admin")
    learner_id = identities["learner"].user_id
    
    response = admin.patch(f"/users/{learner_id}", json={"full_name": "Updated Learner"})
    assert response.status_code == 200, response.text
    db_session.refresh(identities["learner"])
    assert identities["learner"].full_name == "Updated Learner"


def test_learner_cannot_edit_other_user(client_factory, identities):
    learner = client_factory("learner")
    response = learner.patch(
        f"/users/{identities['admin'].user_id}",
        json={"full_name": "Unauthorized Change"},
    )
    assert response.status_code == 403, response.text

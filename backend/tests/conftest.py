
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Put the actual backend folder on PYTHONPATH when running from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app
import Models
from JWT_Security import get_current_user

# Change this import if your real get_db lives in a differently named module.
from Nudle_database import get_db

Base = getattr(Models, "base", None) or getattr(Models, "Base", None)
if Base is None:
    raise RuntimeError("Models.py must expose SQLAlchemy declarative base as base or Base")

@pytest.fixture()
def db_session():
    # StaticPool reuses one in-memory connection for TestClient's thread.
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

@pytest.fixture()
def identities(db_session):
    admin = Models.User(
        full_name="Test Admin", email="admin@test.local",
        password_hash="not-used-because-auth-is-overridden",
        role="admin", is_active=True,
    )
    learner = Models.User(
        full_name="Test Learner", email="learner@test.local",
        password_hash="not-used-because-auth-is-overridden",
        role="learner", is_active=True,
    )
    db_session.add_all([admin, learner])
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(learner)
    return {"admin": admin, "learner": learner}

@pytest.fixture()
def client_factory(db_session, identities):
    clients = []

    def create(role="admin"):
        user = identities[role]

        def override_db():
            # Test client requests use this test session, never the live db.
            yield db_session

        def override_user():
            return user

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        client = TestClient(app, raise_server_exceptions=True)
        clients.append(client)
        return client

    yield create
    for client in clients:
        client.close()
    app.dependency_overrides.clear()

@pytest.fixture()
def activity(db_session, identities):
    assessment = Models.Assessment(
        title="Hardware Assessment", description="Practical hardware tests",
        created_by=identities["admin"].user_id, is_active=True,
    )
    db_session.add(assessment)
    db_session.commit()
    activity = Models.Activity(
        assessment_id=assessment.assessment_id,
        title="Diagnose Hardware", description="Diagnostic exercises",
        scenario_type="hardware_troubleshooting", is_active=True,
    )
    db_session.add(activity)
    db_session.commit()
    db_session.refresh(activity)
    return activity

@pytest.fixture()
def scenario(activity):
    # At least 3 fault diagnosis options as your validator requires.
    return {
        "activity_id": activity.activity_id,
        "title": "RAM fault exercise",
        "expected_fault": "faulty_ram",
        "max_score": 100,
        "is_active": True,
        "symptoms_json": {
            "start_node": "start",
            "nodes": {
                "start": {
                    "symptom": "PC crashes. Which component do you test?",
                    "options": [
                        {"label": "Test RAM", "action_type": "inspect", "action_value": "ram_test", "next_node": "diagnose", "feedback": "Memory errors found", "points": 20}
                    ]
                },
                "diagnose": {
                    "symptom": "What failed?",
                    "options": [
                        {"label": "RAM", "action_type": "diagnose", "action_value": "faulty_ram", "next_node": "finish", "feedback": "Correct", "points": 80},
                        {"label": "PSU", "action_type": "diagnose", "action_value": "psu_failure", "next_node": "finish", "feedback": "Incorrect", "points": 0},
                        {"label": "CPU", "action_type": "diagnose", "action_value": "cpu_overheating", "next_node": "finish", "feedback": "Incorrect", "points": 0}
                    ]
                },
                "finish": {"symptom": "Complete", "terminal": True, "options": []}
            }
        }
    }

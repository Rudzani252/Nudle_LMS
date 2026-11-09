from sqlalchemy import Column, Integer,String, DECIMAL, TIMESTAMP, ForeignKey, Enum, Text, text, LargeBinary, Boolean, JSON
from sqlalchemy.orm import relationship
from Nudle_database import base

class User(base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement= True)
    full_name = Column(String(50), nullable=False)
    email = Column(String(100),unique=True ,nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone_no = Column(String(20), nullable=True)
    role = Column(String(20),default="learner", nullable=False)
    is_active = Column(Boolean,default=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    created_assessments = relationship(
    "Assessment",
    back_populates="creator")

    simulation_attempts = relationship(
        "SimulationAttempt",
        back_populates="learner")


class Assessment(base):
    __tablename__ = "assessments"

    assessment_id = Column(Integer, primary_key=True,autoincrement=True )
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer,ForeignKey("users.user_id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    creator = relationship(
        "User",
        back_populates="created_assessments"
    )

    activities = relationship(
        "Activity",
        back_populates="assessment"
    )



class Activity(base):
    __tablename__ = "activities"

    activity_id = Column(Integer,primary_key=True,autoincrement=True)
    assessment_id = Column(Integer,ForeignKey("assessments.assessment_id"),nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    scenario_type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))

    assessment = relationship(
        "Assessment",
        back_populates="activities"
    )

    simulations = relationship(
        "Simulation",
        back_populates="activity"
    )



class Simulation(base):
    __tablename__ = "simulations"

    simulation_id = Column(Integer,primary_key=True,autoincrement=True)

    activity_id = Column( Integer,ForeignKey("activities.activity_id"),nullable=False)
    title = Column(String(100), nullable=False)
    symptoms_json = Column(JSON, nullable=False)
    expected_fault = Column(String(100), nullable=False)
    max_score = Column(Integer, default=100, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))

    activity = relationship(
        "Activity",
        back_populates="simulations"
    )

    simulation_attempts = relationship(
        "SimulationAttempt",
        back_populates="simulation"
    )




class SimulationAttempt(base):
    __tablename__ = "simulation_attempts"

    attempt_id = Column(Integer,primary_key=True,autoincrement=True)
    learner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    simulation_id = Column(Integer,ForeignKey("simulations.simulation_id"), nullable=False)
    state = Column(JSON, nullable=True)
    score = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="in_progress",nullable=False)
    started_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))
    completed_at = Column(TIMESTAMP, nullable=True)

    learner = relationship(
        "User",
        back_populates="simulation_attempts"
    )

    simulation = relationship(
        "Simulation",
        back_populates="simulation_attempts"
    )

    actions = relationship(
        "SimulationAction",
        back_populates="attempt"
    )

class SimulationAction(base):
    __tablename__ = "simulation_actions"

    action_id = Column(Integer, primary_key=True, autoincrement=True )
    attempt_id = Column( Integer,ForeignKey("simulation_attempts.attempt_id"),nullable=False )
    action_type = Column(String(50), nullable=False)
    action_value = Column(String(100), nullable=False)
    feedback = Column(Text, nullable=True)
    points_awarded = Column(Integer, default=0, nullable=False)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP")
    )

    attempt = relationship(
        "SimulationAttempt",
        back_populates="actions"
    )
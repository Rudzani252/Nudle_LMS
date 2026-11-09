import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from Models import User, Simulation, SimulationAttempt
from JWT_Security import get_current_user
from Nudle_database import get_db

from Simulation_Router import public_node

router = APIRouter()


def attempt_response(attempt):
    simulation = attempt.simulation

    result = {
        "attempt_id": attempt.attempt_id,
        "simulation_id": attempt.simulation_id,
        "learner_id": attempt.learner_id,
        "title": simulation.title,
        "score": attempt.score,
        "max_score": simulation.max_score,
        "status": attempt.status,
        "state": attempt.state,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "current_step": public_node(
            simulation,
            attempt.state["current_node"]
        )
    }

    if attempt.status == "completed":
        result["expected_fault"] = simulation.expected_fault

    return result


@router.post("/simulation/{simulation_id}/start",status_code=201)
def start_simulation(simulation_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role != "learner":
        raise HTTPException(
            403, "Only learners can start simulations"
        )

    simulation = db.get(Simulation, simulation_id)

    if not simulation or not simulation.is_active:
        raise HTTPException(
            404, "Active simulation not found"
        )

    
    existing_attempt = db.query(SimulationAttempt).filter(
        SimulationAttempt.learner_id == current_user.user_id,
        SimulationAttempt.simulation_id == simulation_id,
        SimulationAttempt.status == "in_progress"
    ).order_by(
        SimulationAttempt.attempt_id.desc()
    ).first()

    if existing_attempt:
        return attempt_response(existing_attempt)

    initial_state = {
        "current_node": simulation.symptoms_json["start_node"],
        "choices_taken": []
    }

    new_attempt = SimulationAttempt(
        learner_id=current_user.user_id,
        simulation_id=simulation_id,
        state=initial_state,
        score=0,
        status="in_progress"
    )
    try:
        db.add(new_attempt)
        db.commit()
        db.refresh(new_attempt)
    except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to add new attempt")

    return attempt_response(new_attempt)


@router.get("/simulation-attempts/me")
def my_attempts(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    attempts = db.query(SimulationAttempt).filter(SimulationAttempt.learner_id == current_user.user_id).order_by(SimulationAttempt.attempt_id.desc()).all()

    return [
        {
            "attempt_id": attempt.attempt_id,
            "simulation_id": attempt.simulation_id,
            "title": attempt.simulation.title,
            "score": attempt.score,
            "max_score": attempt.simulation.max_score,
            "status": attempt.status,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at
        }
        for attempt in attempts
    ]


@router.get("/simulation-attempts/{attempt_id}")
def resume_simulation(attempt_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    attempt = db.get(SimulationAttempt, attempt_id)

    if not attempt:
        raise HTTPException(404, "Attempt not found")

    if ( current_user.role != "admin" and attempt.learner_id != current_user.user_id):
        raise HTTPException(403, "Access denied")

    return attempt_response(attempt)


@router.get("/reports/simulation-attempts.csv")
def export_performance_report(learner_id: int | None = None,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    query = db.query(SimulationAttempt)

    if current_user.role != "admin":
        query = query.filter(SimulationAttempt.learner_id == current_user.user_id)
    elif learner_id is not None:
        query = query.filter(
            SimulationAttempt.learner_id == learner_id)

    attempts = query.order_by(SimulationAttempt.attempt_id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Attempt ID",
        "Learner ID",
        "Learner Name",
        "Simulation",
        "Score",
        "Maximum Score",
        "Percentage",
        "Status",
        "Started At",
        "Completed At"
    ])

    for attempt in attempts:
        maximum = attempt.simulation.max_score

        percentage = (
            round(attempt.score / maximum * 100, 2)
            if maximum > 0 else 0
        )

        writer.writerow([
            attempt.attempt_id,
            attempt.learner_id,
            attempt.learner.full_name,
            attempt.simulation.title,
            attempt.score,
            maximum,
            percentage,
            attempt.status,
            attempt.started_at,
            attempt.completed_at
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                'attachment; filename="simulation_results.csv"'
        }
    )
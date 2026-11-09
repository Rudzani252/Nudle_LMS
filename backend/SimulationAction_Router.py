from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from Models import User,SimulationAttempt,SimulationAction
from JWT_Security import get_current_user
from Nudle_database import get_db
from Simulation_Router import public_node

router = APIRouter()


class SubmitAction(BaseModel):
    action_type: str
    action_value: str


@router.post("/simulation-attempt/{attempt_id}/action")
def submit_simulation_action(attempt_id: int, data: SubmitAction, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role != "learner":
        raise HTTPException(403, "Learner access required")

    
    attempt = db.query(SimulationAttempt).filter(
        SimulationAttempt.attempt_id == attempt_id).with_for_update().first()

    if not attempt:
        raise HTTPException(404, "Attempt not found")

    if attempt.learner_id != current_user.user_id:
        raise HTTPException(403, "Not your attempt")

    if attempt.status != "in_progress":
        raise HTTPException(
            400, "This simulation is already completed"
        )

    simulation = attempt.simulation
    state = attempt.state

    current_node_id = state["current_node"]

    current_node = simulation.symptoms_json[
        "nodes"
    ][current_node_id]

    
    selected_option = next(
        (
            option
            for option in current_node.get("options", [])
            if (
                option["action_type"] == data.action_type
                and option["action_value"] == data.action_value
            )
        ),
        None
    )

    if not selected_option:
        raise HTTPException(
            400, "Invalid action for the current scenario step"
        )

    
    action_key = (
        f"{current_node_id}:"
        f"{data.action_type}:"
        f"{data.action_value}"
    )

    choices_taken = list(state.get("choices_taken", []))

    if action_key in choices_taken:
        raise HTTPException(
            409, "This action has already been performed"
        )

    points = selected_option["points"]
    old_score = attempt.score

    
    new_score = max(
        0,
        min(simulation.max_score, old_score + points)
    )

    actual_points = new_score - old_score

    next_node_id = selected_option["next_node"]

  
    action = SimulationAction(
        attempt_id=attempt.attempt_id,
        action_type=data.action_type,
        action_value=data.action_value,
        feedback=selected_option["feedback"],
        points_awarded=actual_points
    )
    try:
        db.add(action)
    except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to add actions")

    choices_taken.append(action_key)

   
    attempt.state = {
        **state,
        "current_node": next_node_id,
        "choices_taken": choices_taken
    }

    attempt.score = new_score

    next_node = simulation.symptoms_json[
        "nodes"
    ][next_node_id]

    if next_node.get("terminal") is True:
        attempt.status = "completed"
        attempt.completed_at = datetime.now(timezone.utc)
    try:
        db.commit()
        db.refresh(attempt)
    except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to commit actions to db")

    response = {
        "attempt_id": attempt.attempt_id,
        "feedback": selected_option["feedback"],
        "points_awarded": actual_points,
        "score": attempt.score,
        "max_score": simulation.max_score,
        "status": attempt.status,
        "current_step": public_node(
            simulation, next_node_id
        )
    }

    if attempt.status == "completed":
        response["expected_fault"] = simulation.expected_fault

    return response


@router.get("/simulation-attempt/{attempt_id}/actions")
def get_attempt_actions(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.get(SimulationAttempt, attempt_id)

    if not attempt:
        raise HTTPException(404, "Attempt not found")

    if (
        current_user.role != "admin"
        and attempt.learner_id != current_user.user_id
    ):
        raise HTTPException(403, "Access denied")

    actions = db.query(SimulationAction).filter(
        SimulationAction.attempt_id == attempt_id
    ).order_by(
        SimulationAction.action_id.asc()
    ).all()

    return [
        {
            "action_id": action.action_id,
            "action_type": action.action_type,
            "action_value": action.action_value,
            "feedback": action.feedback,
            "points_awarded": action.points_awarded,
            "created_at": action.created_at
        }
        for action in actions
    ]
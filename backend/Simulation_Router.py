from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from Nudle_database import get_db, engine
from sqlalchemy.orm import Session
from Models import Activity, User, Simulation, SimulationAttempt
from pydantic import BaseModel, ConfigDict, Field
from JWT_Security import create_access_token, get_current_user

router = APIRouter()








def validate_scenario(scenario, expected_fault):
    
    if not isinstance(scenario, dict):
        raise HTTPException(422, "Scenario must be an object")

    nodes = scenario.get("nodes")
    start_node = scenario.get("start_node")

    if not isinstance(nodes, dict) or not nodes:
        raise HTTPException(422, "Scenario needs nodes")

    if start_node not in nodes:
        raise HTTPException(422, "Invalid start_node")

    diagnoses = set()
    has_correct_diagnosis = False
    has_terminal = False

    for node_id, node in nodes.items():
        if not isinstance(node, dict):
            raise HTTPException(422, f"Invalid node: {node_id}")

        options = node.get("options", [])

        if not isinstance(options, list):
            raise HTTPException(422, "Options must be a list")

        if node.get("terminal") is True:
            has_terminal = True
            if options:
                raise HTTPException(
                    422, "Terminal nodes cannot have options"
                )
        elif not options:
            raise HTTPException(
                422, f"Node {node_id} needs diagnostic options"
            )

        seen = set()

        for option in options:
            if not isinstance(option, dict):
                raise HTTPException(422, "Invalid option")

            required = [
                "label", "action_type", "action_value",
                "next_node", "feedback", "points"
            ]

            if any(key not in option for key in required):
                raise HTTPException(
                    422, f"Missing option fields in {node_id}"
                )

            if option["next_node"] not in nodes:
                raise HTTPException(
                    422, f"Invalid next_node in {node_id}"
                )

            if not isinstance(option["points"], int):
                raise HTTPException(422, "Points must be integers")

            key = (
                option["action_type"],
                option["action_value"]
            )

            if key in seen:
                raise HTTPException(
                    422, f"Duplicate action in {node_id}"
                )

            seen.add(key)

            if option["action_type"] == "diagnose":
                value = option["action_value"].strip().lower()
                diagnoses.add(value)

                if value == expected_fault.strip().lower():
                    has_correct_diagnosis = True

    if len(diagnoses) < 3:
        raise HTTPException(
            422,
            "Include at least three possible fault diagnoses"
        )

    if not has_correct_diagnosis:
        raise HTTPException(
            422,
            "One diagnosis must match expected_fault"
        )

    if not has_terminal:
        raise HTTPException(
            422, "Scenario needs a terminal node"
        )


def public_node(simulation, node_id):
    
    node = simulation.symptoms_json["nodes"][node_id]

    return {
        "node_id": node_id,
        "symptom": node.get("symptom", ""),
        "terminal": node.get("terminal", False),
        "options": [
            {
                "label": option["label"],
                "action_type": option["action_type"],
                "action_value": option["action_value"]
            }
            for option in node.get("options", [])
        ]
    }



class AddSimulatation(BaseModel):
    activity_id: int
    title: str 
    symptoms_json: dict[str,Any]
    expected_fault: str 
    max_score: int = Field(default = 100, gt=0)
    is_active: bool = True 


@router.post("/simulation/add", status_code=201)
def add_simulation(simulation: AddSimulatation, db: Session= Depends(get_db), current_user:User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
        status_code=403,
        detail="You do not have permission to add a simulation ")

    existing_simulation = db.query(Simulation).filter(Simulation.title == simulation.title).first()
    if existing_simulation:
        raise HTTPException(
            status_code= 400,
            detail= "Simulation with this title already exists"
        )
    activity = db.query(Activity).filter(
        Activity.activity_id == simulation.activity_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code =404,
            detail= "Activity not found")

    validate_scenario(
        simulation.symptoms_json,
        simulation.expected_fault
    )
  
    new_simulation = Simulation(**simulation.model_dump())

    try:
        db.add(new_simulation)
        db.commit()
        db.refresh(new_simulation)
    except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to add simulation")
    return {
        "message": "Simulation created successfully",
        "simulation_id": new_simulation.simulation_id
    }


class UpdateSimulation(BaseModel):
    activity_id: int | None = None 
    title: str | None = None
    symptoms_json: dict[str, Any] | None = None
    expected_fault: str | None = None
    max_score: int | None = Field(default=None, gt=0)
    is_active: bool | None = None

@router.patch("/simulation/update/{simulation_id}")
def update_simulation(simulation_id: int,data: UpdateSimulation,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
            raise HTTPException(
            status_code=403,
            detail="You do not have permission to add a simulation ")

    existing_simulation = db.query(Simulation).filter(Simulation.simulation_id == simulation_id).first()

    if not existing_simulation:
        raise HTTPException(404, "Simulation not found")

    changes = data.model_dump(exclude_unset=True)

    if any(value is None for value in changes.values()):
        raise HTTPException(422, "Fields cannot be null")


    if "activity_id" in changes:
        if not db.get(Activity, changes["activity_id"]):
            raise HTTPException(404, "Activity not found")

    
    has_attempts = db.query(SimulationAttempt).filter(SimulationAttempt.simulation_id == simulation_id).first()

    structural_fields = {
        "symptoms_json", "expected_fault", "max_score"
    }

    if has_attempts and structural_fields.intersection(changes):
        raise HTTPException(
            409,
            "This simulation has attempts. Create a new "
            "simulation version to change its scenario or scoring."
        )

    new_scenario = changes.get(
        "symptoms_json", existing_simulation.symptoms_json
    )
    new_fault = changes.get(
        "expected_fault", existing_simulation.expected_fault
    )

    validate_scenario(new_scenario, new_fault)

    for field, value in changes.items():
        setattr(existing_simulation, field, value)
    try:

        db.commit()
        db.refresh(existing_simulation)
    except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to update this simulation")
        

    return {"message": "Simulation updated successfully"}





@router.get("/all_simulations")
def get_simulations(db: Session = Depends(get_db)):
    simulations = db.query(Simulation).all()
    return [
        {
            "simulation_id": simulation.simulation_id,
            "activity_id": simulation.activity_id,
            "title": simulation.title,
            "max_score": simulation.max_score,
            "is_active": simulation.is_active
        }
        for simulation in simulations
    ]



@router.get("/view_simulation/{simulation_id}")
def view_simulation(simulation_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    simulation = db.query(Simulation).filter(Simulation.simulation_id== simulation_id).first()

    if not simulation:
        raise HTTPException(status_code=404,
                            detail= "Simulation not found")
    
    if current_user.role != "admin" and not simulation.is_active:
            raise HTTPException(
                status_code=404,
                detail="Simulation not found")
    

    result = {
            "simulation_id": simulation.simulation_id,
            "activity_id": simulation.activity_id,
            "title": simulation.title,
            "max_score": simulation.max_score,
            "is_active": simulation.is_active
        }
    if current_user.role == "admin":
            result["symptoms_json"] = simulation.symptoms_json
            result["expected_fault"] = simulation.expected_fault
    
    return result
    

@router.delete("/simulation/delete/{simulation_id}")
def delete_simulation(simulation_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
        status_code=403,
        detail="You do not have permission to add a simulation ")
    

    simulation = db.query(Simulation).filter(Simulation.simulation_id == simulation_id).first()

    if not simulation:
        raise HTTPException(404, "Simulation not found")

    existing_attempt = db.query(SimulationAttempt).filter(
        SimulationAttempt.simulation_id == simulation_id).first()

    if existing_attempt:
        
        simulation.is_active = False
        db.commit()

        return {
            "message": "Simulation archived because learner "
                       "attempts already exist"
        }
    try:

        db.delete(simulation)
        db.commit()
    except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to delete this simulation")

    return {"message": "Simulation deleted successfully"}
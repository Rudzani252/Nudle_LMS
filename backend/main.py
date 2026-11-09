from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
import uvicorn

from User_Router import router as user_router
from Assessment_Router import router as assessment_router 
from Activities_Router import router as activity_router 
from Simulation_Router import router as simulation_router
from SimulationAttempt_Router import router as attempt_router
from SimulationAction_Router import router as action_router 
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(user_router)
app.include_router(assessment_router )
app.include_router(activity_router )
app.include_router(simulation_router )
app.include_router(attempt_router )
app.include_router(action_router )
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
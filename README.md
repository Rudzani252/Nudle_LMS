
# Nudle LMS - Interactive Learning Management System

Nudle LMS is a full-stack Learning Management System designed to provide an interactive learning experience through computer hardware troubleshooting simulations.

The platform supports two user roles: **Administrator** and **Learner**. It provides learner management, learning activities, interactive simulations, automated scoring, and learner progress tracking.

The application was developed using **React, FastAPI, SQLAlchemy, and MySQL**.

## Features

### Administrator Features

- Secure administrator login and authentication.
- View and manage registered learners.
- Add, edit, activate, deactivate, and delete learner accounts.
- Create, update, and delete assessments.
- Create and manage learning activities.
- Create and configure interactive simulations.
- Manage active and inactive simulations.
- View individual learner progress and performance.
- Monitor learner participation and completed simulations.
- Admin account:
```bash
 rendi@gmail.com
passoword: R12345678r!
```

### Learner Features

- Register and log in securely.
- Access a personalised learner dashboard.
- View available assessments and learning activities.
- Launch interactive hardware troubleshooting simulations.
- Investigate computer hardware problems through diagnostic actions.
- Receive feedback based on selected actions.
- Earn performance scores based on diagnostic decisions.
- Save and resume simulation attempts.
- View personal progress and completion history.
- Export simulation performance reports.

## Interactive Hardware Troubleshooting Simulation

Nudle LMS includes an interactive computer hardware troubleshooting simulation that challenges learners to investigate technical problems and identify faulty components.

### Hardware Faults

The simulation includes three possible hardware faults:

- **Faulty RAM:** System freezing, unexpected crashes, and memory-related errors.
- **Power Supply Failure:** Unexpected shutdowns, power interruptions, and startup failures.
- **CPU Overheating:** Excessive temperatures, reduced performance, and unexpected shutdowns.

### Simulation Functionality

- Learners are presented with a computer experiencing a technical problem.
- Learners investigate symptoms before selecting diagnostic actions.
- Each diagnostic action produces feedback.
- Correct decisions award points based on the simulation's scoring rules.
- Incorrect decisions provide feedback and may influence the learner's final score.
- The simulation uses branching scenarios where previous decisions influence subsequent options.
- Learner progress and results are saved in the database.
- Learners can resume incomplete simulations.

The simulation focuses on meaningful decision-making rather than simply presenting multiple-choice questions.

## Technology Stack

### Frontend

- React
- JavaScript
- Vite
- HTML5
- CSS3
- React Router

### Backend

- Python
- FastAPI
- SQLAlchemy ORM
- Pydantic
- JWT Authentication
- bcrypt Password Hashing

### Database

- MySQL

### Automated Testing

- pytest
- FastAPI TestClient
- Vitest
- React Testing Library

## Project Structure



## Installation and Setup

### Prerequisites

Ensure the following software is installed:

- Python 3.11 or later
- Node.js and npm
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Nudle-LMS.git
cd Nudle-LMS
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -e .
```

### 3. Database Configuration

Create a `.env` file inside the backend directory.

Add the following environment variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB=your_database_name
```

Replace the placeholder values with your MySQL credentials.

Create the database in MySQL, then initialise the required tables using:

```bash
python create_tables.py
```

### 4. Run the Backend

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

The backend runs at:

- API: http://127.0.0.1:8000
- Swagger Documentation: http://127.0.0.1:8000/docs

### 5. Frontend Setup

Open another terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Open the URL displayed in your terminal, normally:

http://localhost:5173

## Database Design

Nudle LMS uses a relational MySQL database with SQLAlchemy ORM.

### User

- Stores administrator and learner information.
- Contains login credentials, roles, and account status.
- Passwords are stored using bcrypt hashing.

### Assessment

- Stores assessment information.
- Organises learning activities.

### Activity

- Stores learning activity information.
- Connects activities to assessments.

### Simulation

- Stores troubleshooting scenarios.
- Contains symptoms, expected faults, scoring rules, and branching decisions.
- Supports configurable simulation content.

### SimulationAttempt

- Stores learner simulation attempts.
- Tracks progress, score, status, and completion information.
- Allows learners to resume incomplete simulations.

### SimulationAction

- Records diagnostic actions performed during a simulation.
- Stores feedback and points awarded.
- Supports learner performance tracking.

## Authentication and Security

The platform includes security features such as:

- JWT-based authentication.
- bcrypt password hashing.
- Role-based access control.
- Protected administrator endpoints.
- User input validation using Pydantic.
- API error handling.
- Restricted access to sensitive simulation answers.
- Environment variables for database credentials.

Database credentials are stored in a `.env` file and excluded from version control using `.gitignore`.

## Automated Testing

Automated testing was implemented to verify the functionality and reliability of the application.

### Testing Results

| Application | Testing Framework | Passed | Failed |
|------------|-------------------|--------|--------|
| Backend | pytest | 15 | 0 |
| Frontend | Vitest | 11 | 0 |
| **Total** | | **26** | **0** |

**All 26 automated tests passed successfully, achieving a 100% pass rate for the implemented test suite.**

### Backend Tests

The backend tests cover:

- Administrator simulation creation.
- Role-based authorization.
- Simulation validation.
- Updating and retrieving simulations.
- Preventing learners from accessing hidden answers.
- Starting and resuming simulations.
- Diagnostic action processing.
- Score calculation and progress saving.
- Simulation deletion handling.
- CSV report generation.
- Learner management and account deactivation.
- Protection against unauthorized user modifications.

Run the backend tests:

```bash
cd backend
python -m pytest tests -v
```

### Frontend Tests

The frontend tests cover:

- Loading learners.
- Adding and editing learners.
- Deactivating and deleting learner accounts.
- Displaying learning activities.
- Filtering assessments and simulations.
- Starting simulations.
- Submitting diagnostic decisions.
- Resuming simulation attempts.
- Exporting results.

Run the frontend tests:

```bash
cd frontend
npx vitest --config vitest.config.js run --reporter=verbose
```

## UI and UX Design

Nudle LMS was designed to provide a consistent and user-friendly learning experience.

### Design Features

- Responsive desktop and mobile layouts.
- Consistent navigation and visual styling.
- Separate administrator and learner dashboards.
- Clear forms and interactive components.
- User-friendly assessment and simulation interfaces.
- Loading indicators and error messages.
- Visual feedback for learner actions.
- Accessible form labels and navigation controls.

The responsive design was tested across different screen sizes.

## Advanced Features Implemented

The application includes several advanced technical features:

- Branching simulation scenarios.
- Configurable hardware troubleshooting simulations.
- Simulation progress saving and resuming.
- Automated frontend and backend testing.
- Learner activity and simulation history.
- Exportable CSV performance reports.
- Role-based access control.
- API input validation and error handling.


## Future Improvements

Potential future improvements include:

- Assigning activities to specific learners.
- Adding administrator-wide completion statistics.
- Creating visual performance charts.
- Expanding the simulation library.
- Introducing detailed audit logging.
- Adding notifications for new learning activities.


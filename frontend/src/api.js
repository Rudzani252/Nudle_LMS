

const API_URL = "http://127.0.0.1:8000";

export async function apiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem("access_token");

    let response;
    try{
         response = await fetch(`${API_URL}${endpoint}`,{
        ...options, headers:{
            "Content-Type": "application/json",
            ...options.headers,
            ...(token && {
                Authorization: `Bearer ${token}`, 
            }),
        },
    });
    } catch (error) {
        console.error("API connection error:", error);
        throw new Error(
            "Cannot connect to FastAPI. Check that the backend is running and CORS is configured."
        );
    }

    if (response.status ===401){
        sessionStorage.removeItem("access_token");

    }

    const data = await response.json();
    if(!response.ok){
        throw new Error(
            typeof data.detail ==="string"
            ? data.detail
            : "Something went wrong"
        );
    }

    return data

}

export async function loginUser(email, password) { const data = await apiRequest("/login",{method: "POST",

        body:JSON.stringify({
            email, password
        }),
    });
    if(!data.access_token){
        throw new Error("No access token recieved")
    }
    sessionStorage.setItem("access_token", data.access_token);

    return data;   
}
export async function getCurrentUser() {
    return apiRequest("/auth/user");
    
}
export function logoutUser(){
    sessionStorage.removeItem("access_token");
}

export async function registerUser(full_name,email, password, phone_no ) { const data = await apiRequest("/user/register", {method: "POST",
    body:JSON.stringify({
        full_name,email, password, phone_no 
    }),
});
    return data 
    
}

export async function getUserDetails(user_id) {
    return apiRequest(`/user/${user_id}`, {
        method: "GET"
    });
}

export async function updateUser(user_id, updatedData) {
    return apiRequest(`/users/${user_id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData)
    });
}

export async function viewAllLearners() {
    return apiRequest("/admin/learners", {method:"GET"});
    
}

export async function deleteUser(user_id) {
    const data = await apiRequest (`/delete_account/${user_id}`,{
        method: "DELETE",
    });
    return data;
    
}

export async function updateLearnerStatus(user_id, is_active) {
    return apiRequest(`/admin/learners/${user_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
            is_active
        })
    });
}

//assessment//
export async function AddAssessment(title, description, is_active){const data = await apiRequest("/assessment/add", {method: "POST",
    body:JSON.stringify({
        title, description, is_active
    }),
});
    return data 

}

export async function updateAssessment(assessment_id, updatedData) {
    const data = await apiRequest( `/assessment/update/${assessment_id}`,{
        method: "PATCH",
        body: JSON.stringify(updatedData)
    });
    return data
    
}

export async function getAllAssessments() {
    return apiRequest("/all_assessments", {method: "GET"});
    
}

export async function viewAssessment(assessment_id) {
    return apiRequest(`/view_assessment/${assessment_id}`,{
        method: "GET"});
    
}

export async function deleteAssessment(assessment_id) {
    const data = await apiRequest (`/delete_assessment/${assessment_id}`,{
        method: "DELETE",
    });
    return data;
    
}

// activity//
export async function addActivity(assessment_id ,title, description, scenario_type, is_active){
    const data = await apiRequest("/activity/add",{method: "POST",
        body: JSON.stringify({assessment_id,title, description, scenario_type, is_active})
    });
    return data
}

export async function updateActivity(activity_id, updateData) {
    const data = await apiRequest(`/activity/update/${activity_id}`,{
        method: "PATCH",
        body: JSON.stringify(updateData)

    });
    return data;
}
export async function getAllActivities() {
    return apiRequest ("/all_activities", {method: "GET"});
    
}
export async function viewActivty(activity_id) {
    return apiRequest(`/view_activity/${activity_id}`,{
        method: "GET"});
}

export async function deleteActivity(activity_id) {
    const data = await apiRequest( `/delete_activity/${activity_id}`,{
        method: "DELETE"
    });  
    return data   
} 

export async function addSimulation(
    activity_id,
    title,
    symptoms_json,
    expected_fault,
    max_score = 100,
    is_active = true
) {
    return apiRequest("/simulation/add", {
        method: "POST",
        body: JSON.stringify({
            activity_id,
            title,
            symptoms_json,
            expected_fault,
            max_score,
            is_active
        })
    });
}



export async function getAllSimulations() {
    return apiRequest("/all_simulations", {
        method: "GET"
    });
}



export async function viewSimulation(simulation_id) {
    return apiRequest(`/view_simulation/${simulation_id}`, {
        method: "GET"
    });
}



export async function updateSimulation(simulation_id, updatedData) {
    return apiRequest(`/simulation/update/${simulation_id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData)
    });
}



export async function deleteSimulation(simulation_id) {
    return apiRequest(`/simulation/delete/${simulation_id}`, {
        method: "DELETE"
    });
}

// Learner: Start simulation or resume unfinished attempt
export async function startSimulation(simulation_id) {
    return apiRequest(`/simulation/${simulation_id}/start`, {
        method: "POST"
    });
}


// Learner: Get own simulation attempts
export async function getMySimulationAttempts() {
    return apiRequest("/simulation-attempts/me", {
        method: "GET"
    });
}


// Learner / Admin: View and resume an attempt
export async function getSimulationAttempt(attempt_id) {
    return apiRequest(`/simulation-attempts/${attempt_id}`, {
        method: "GET"
    });
}

// ========================================
// SIMULATION ACTION API
// ========================================

// Learner: Submit a diagnostic decision
export async function submitSimulationAction(
    attempt_id,
    action_type,
    action_value
) {
    return apiRequest(`/simulation-attempt/${attempt_id}/action`, {
        method: "POST",
        body: JSON.stringify({
            action_type,
            action_value
        })
    });
}


// Learner / Admin: Get action history for an attempt
export async function getSimulationActions(attempt_id) {
    return apiRequest(`/simulation-attempt/${attempt_id}/actions`, {
        method: "GET"
    });
}


// ========================================
// SIMULATION PERFORMANCE REPORT
// ========================================

export async function downloadSimulationReport(learner_id = null) {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
        throw new Error("Please log in first");
    }

    const params = new URLSearchParams();

    if (learner_id !== null && learner_id !== undefined) {
        params.set("learner_id", learner_id);
    }

    const query = params.toString();

    const url = `http://127.0.0.1:8000/reports/simulation-attempts.csv${
        query ? `?${query}` : ""
    }`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.detail || "Failed to download performance report"
        );
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "simulation_results.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);
}
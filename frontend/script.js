// ======================
// NAVIGATION
// ======================

function goSupervisor() {
    window.location = "supervisor-dashboard.html";
}

function goEmployee() {
    window.location = "login.html";
}

function logout() {
    localStorage.removeItem("username");
    window.location = "index.html";
}

function goAddEmployee() {
    window.location = "add-employee.html";
}

function goAttendance() {
    window.location = "attendance.html";
}

function goTaskManagement() {
    window.location = "task-management.html";
}


// ======================
// ADD EMPLOYEE
// ======================

function addEmployee() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    let role = document.getElementById("role").value;

    let selectedSkills = [];
    let skillCheckboxes = document.querySelectorAll('input[name="empSkill"]:checked');
    skillCheckboxes.forEach(cb => selectedSkills.push(cb.value));
    let skill = selectedSkills.join(", ");

    let employeeId = document.getElementById("employeeId").value.trim();
    let phoneNumber = document.getElementById("phoneNumber").value.trim();

    if (username === "" || password === "") {
        document.getElementById("msg").innerHTML = "Please fill all fields";
        return;
    }

    fetch("/api/addEmployee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, skill, employeeId, phoneNumber })
    })
        .then(async res => {
            if (res.ok) {
                return res.json();
            } else {
                let errorData = await res.json().catch(() => ({ message: "Server error" }));
                throw new Error(errorData.message || "Registration failed");
            }
        })
        .then(() => {
            document.getElementById("msg").style.color = "lightgreen";
            document.getElementById("msg").innerHTML = "Employee added successfully ✓";

            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            document.getElementById("employeeId").value = "";
            document.getElementById("phoneNumber").value = "";

            document.querySelectorAll('input[name="empSkill"]').forEach(cb => {
                cb.checked = false;
                cb.parentElement.classList.remove('selected');
            });

            setTimeout(() => {
                window.location = "attendance.html";
            }, 1000);
        })
        .catch((err) => {
            console.error("Add Employee Error:", err);
            document.getElementById("msg").style.color = "red";
            document.getElementById("msg").innerHTML = "Error: " + err.message;
        });

}


// ======================
// LOGIN
// ======================

function login() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
        document.getElementById("msg").innerHTML = "Enter username and password";
        return;
    }

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(result => {

            if (result) {
                localStorage.setItem("username", result.username);
                window.location = "employee-dashboard.html";
            } else {
                document.getElementById("msg").innerHTML = "Invalid login";
            }

        })
        .catch(() => {
            document.getElementById("msg").innerHTML = "Server error";
        });

}


// ======================
// LOAD ATTENDANCE
// ======================

function loadEmployees() {

    let today = new Date().toISOString().split('T')[0];
    let dateInput = document.getElementById("selectedDate");

    if (dateInput.value === "") {
        dateInput.value = today;
    }

    let selectedDate = dateInput.value;

    Promise.all([
        fetch("/api/employees").then(res => res.json()),
        fetch("/api/attendanceByDate?date=" + selectedDate).then(res => res.json())
    ])
        .then(([employees, attendance]) => {

            let attendanceMap = {};
            attendance.forEach(a => attendanceMap[a.employeeName] = a.status);

            let html = "";
            let present = 0;
            let absent = 0;

            employees.forEach(emp => {

                let status = attendanceMap[emp.username];

                if (status === "Present") present++;
                if (status === "Absent") absent++;

                let alreadyMarked = !!status;
                let statusColor = status === "Present" ? "#10b981" : (status === "Absent" ? "#ef4444" : "#999");

                html += `
<div class="employee-row">
<div class="employee-name">${emp.username}</div>

<div class="employee-actions">

${alreadyMarked ? `
<span style="background: ${statusColor}15; color: ${statusColor}; padding: 6px 16px;
      border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid ${statusColor}40;">
     ${status}
</span>
` : `
<button class="present-btn"
onclick="markAttendance('${emp.username}','Present')">
Present
</button>

<button class="absent-btn"
onclick="markAttendance('${emp.username}','Absent')">
Absent
</button>

<span class="attendance-status">-</span>
`}

</div>
</div>
`;
            });

            document.getElementById("employeeList").innerHTML = html;
            document.getElementById("presentCount").innerText = present;
            document.getElementById("absentCount").innerText = absent;

        });
}


// ======================
// MARK ATTENDANCE
// ======================

function markAttendance(name, status) {

    let today = new Date().toISOString().split('T')[0];

    fetch("/api/markAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            employeeName: name,
            date: today,
            status: status
        })
    })
        .then(res => res.json())
        .then(() => loadEmployees());
}


// ======================
// TASK MANAGEMENT
// ======================

let selectedTaskId = null;

const FACTORY_TASKS = {
    "Wash Vegetables": { section: "Cleaning", skills: "Cleaning, Basic Handling" },
    "Cut Vegetables": { section: "Processing", skills: "Cutting, Food Processing" },
    "Cook Food": { section: "Cooking", skills: "Cooking, Food Processing" },
    "Quality Inspection": { section: "Quality Check", skills: "Inspection, Food Safety" },
    "Pack Food": { section: "Packaging", skills: "Packing, Basic Handling" },
    "Label Packages": { section: "Labeling", skills: "Packing, Label Handling" },
    "Load Products": { section: "Dispatch", skills: "Warehouse Handling, Packing" }
};


function autoFillTaskDetails() {

    let taskName = document.getElementById("taskName").value;

    if (FACTORY_TASKS[taskName]) {

        document.getElementById("taskSection").value = FACTORY_TASKS[taskName].section;
        document.getElementById("taskSkill").value = FACTORY_TASKS[taskName].skills;

    }
}


function createTask() {

    let taskName = document.getElementById("taskName").value.trim();
    let section = document.getElementById("taskSection").value;
    let priority = document.getElementById("taskPriority").value;
    let skill = document.getElementById("taskSkill").value.trim();
    let deadline = document.getElementById("taskDeadline").value;
    let employeesNeeded = document.getElementById("employeesNeeded").value;

    if (!taskName || taskName === "") {
        alert("Please select a task name first.");
        return;
    }

    if (!skill || skill === "") {
        alert("Required skills are empty. Please select a valid task name to auto-fill skills.");
        return;
    }

    fetch("/api/createTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            taskName,
            requiredSkill: skill,
            section,
            priority,
            employeesNeeded,
            deadline
        })
    })
        .then(res => res.json())
        .then(() => {

            alert("Task Created Successfully");

            loadTasks();

        });

}


function loadTasks() {

    let today = new Date().toISOString().split('T')[0];

    fetch("/api/tasksByDate?date=" + today)
        .then(res => res.json())
        .then(tasks => {

            let html = "";
            if (tasks.length === 0) {
                html = "<p style='color:#999;'>No tasks created today.</p>";
            }

            tasks.forEach(task => {
                let isSelected = selectedTaskId === task.id ? "border: 2px solid #2196f3; background: #e3f2fd;" : "border: 1px solid #ddd;";

                let assignedListHTML = "<span style='color:red;'>Not Assigned</span>";
                if (task.assignedEmployees && task.assignedEmployees.trim() !== "") {
                    let emps = task.assignedEmployees.split(",");
                    let badges = emps.map(emp => {
                        let eName = emp.trim();
                        return `<span style="display:inline-block; background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:12px; margin:2px; font-size:12px;">
                                    ${eName} 
                                    <span onclick="unassignEmployee(event, ${task.id}, '${eName}')" style="cursor:pointer; color:#ef4444; font-weight:bold; margin-left:4px;">&times;</span>
                                </span>`;
                    });
                    assignedListHTML = badges.join("");
                }

                let hasSkill = task.requiredSkill && task.requiredSkill.trim() !== "";
                let safeSkill = hasSkill ? task.requiredSkill.replace(/'/g, "\\'") : "";
                let safeName = task.taskName ? task.taskName.replace(/'/g, "\\'") : "Untitled";

                if (hasSkill) {
                    html += `
<div class="employee-row" 
     onclick="openTaskModal(${task.id})" 
     style="cursor:pointer; margin-bottom: 10px; padding: 12px; border-radius: 8px; transition: 0.3s; ${isSelected}">
    <div style="flex: 1;">
        <b style="font-size: 16px; color: #333;">${task.taskName || 'Untitled'}</b><br>
        <small style="color: #666;">Section: ${task.section} | Priority: ${task.priority}</small><br>
        <small style="color: #667eea;">Skills: ${task.requiredSkill}</small><br>
        <div style="font-size: 13px; margin-top:5px;"><b>Assigned:</b> ${assignedListHTML}</div>
    </div>
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="background: #eee; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${task.status}</span>
        <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
    </div>
</div>
`;
                } else {
                    html += `
<div class="employee-row" 
     style="margin-bottom: 10px; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; background: #fff5f5; opacity: 0.7;">
    <div style="flex: 1;">
        <b style="font-size: 16px; color: #999;">${task.taskName || 'Untitled'}</b><br>
        <small style="color: #ef4444;">⚠ No skills set — cannot suggest employees</small>
    </div>
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="background: #fecaca; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${task.status}</span>
        <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
    </div>
</div>
`;
                }
            });

            document.getElementById("taskList").innerHTML = html;

        });

}


let selectedEmployeesForTask = new Set(); // Global selection state
let currentSuggestions = []; // Cache to allow re-rendering

function selectTask(taskId, skill, name) {
    selectedTaskId = taskId;
    selectedEmployeesForTask.clear();
    updateSelectionUI();

    document.getElementById("selectionHint").innerText = "Suggesting employees for: " + name;
    loadTasks();

    fetch("/api/employeesBySkill?skill=" + encodeURIComponent(skill))
        .then(res => res.json())
        .then(data => {
            currentSuggestions = data;
            renderSuggestedEmployees();
            document.getElementById("selectionHint").style.display = "none";
        })
        .catch((err) => {
            console.error("Fetch Error:", err);
            document.getElementById("suggestedEmployees").innerHTML =
                "<p style='color:red;'>Error fetching employees. " + (err.message || "") + "</p>";
        });
}

function renderSuggestedEmployees() {
    let html = "";
    if (currentSuggestions.length === 0) {
        html = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">👤</div>
                <p style="color: #ef4444; font-weight: 600; margin: 0;">No matching employees found.</p>
                <p style="color: #64748b; font-size: 13px; margin-top: 5px;">Adjust required skills in the task form.</p>
            </div>`;
    } else {
        html = '<p style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 15px; padding-left: 5px;">Click to select staff members:</p>';

        // Sort: selected ones first
        let sorted = [...currentSuggestions].sort((a, b) => {
            let aSel = selectedEmployeesForTask.has(a.username);
            let bSel = selectedEmployeesForTask.has(b.username);
            return bSel - aSel;
        });

        sorted.forEach(emp => {
            let isSelected = selectedEmployeesForTask.has(emp.username);
            let initial = emp.username.charAt(0).toUpperCase();
            html += `
                <div class="emp-card ${isSelected ? 'selected' : ''}" 
                     onclick="toggleEmployeeSelection('${emp.username}')"
                     style="${isSelected ? 'border-color: #6366f1; background: #f5f7ff;' : ''}">
                    <div class="emp-avatar" style="${isSelected ? 'background: #6366f1;' : ''}">${initial}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #1e293b; font-size: 15px;">${emp.username}</div>
                        <div style="color: #64748b; font-size: 12px; margin-top: 2px;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 5px;"></span>
                            Qualified Staff
                        </div>
                    </div>
                    <div style="color: #6366f1; font-weight: 800; font-size: 18px;">
                        ${isSelected ? '✓' : '+'}
                    </div>
                </div>`;
        });
    }
    document.getElementById("suggestedEmployees").innerHTML = html;
}

function toggleEmployeeSelection(username) {
    if (selectedEmployeesForTask.has(username)) {
        selectedEmployeesForTask.delete(username);
    } else {
        selectedEmployeesForTask.add(username);
    }
    updateSelectionUI();
    renderSuggestedEmployees();
}

function updateSelectionUI() {
    let count = selectedEmployeesForTask.size;
    let counter = document.getElementById("selectionCounter");
    let actions = document.getElementById("assignmentActions");

    if (count > 0) {
        counter.style.display = "block";
        counter.innerText = count + " Selected";
        actions.style.display = "block";
    } else {
        counter.style.display = "none";
        actions.style.display = "none";
    }
}

function confirmTaskAssignment() {
    if (selectedEmployeesForTask.size === 0) return;

    let employees = Array.from(selectedEmployeesForTask).join(", ");

    fetch(`/api/assignEmployees?taskId=${selectedTaskId}&employees=${encodeURIComponent(employees)}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {
            alert("Assignment successful!");
            selectedEmployeesForTask.clear();
            updateSelectionUI();
            selectedTaskId = null;
            loadTasks();
            document.getElementById("suggestedEmployees").innerHTML = "";
            document.getElementById("selectionHint").style.display = "block";
            document.getElementById("selectionHint").innerText = "Select a task on the left to see matching staff members.";
        })
        .catch(() => alert("Error assigning employees."));
}

function unassignEmployee(event, taskId, employeeName) {
    event.stopPropagation(); // Prevent row click
    if (!confirm(`Are you sure you want to remove ${employeeName} from this task?`)) {
        return;
    }

    fetch(`/api/unassignEmployee?taskId=${taskId}&employee=${encodeURIComponent(employeeName)}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {
            loadTasks();
            // If the currently selected task was updated, refresh suggestions
            if (selectedTaskId === taskId) {
                // We don't have the skill easily here, but we can clear the selection for safety
                selectedTaskId = null;
                document.getElementById("suggestedEmployees").innerHTML = "";
                document.getElementById("selectionHint").style.display = "block";
                document.getElementById("selectionHint").innerText = "Select a task on the left to see matching staff members.";
            }
        })
        .catch(err => {
            console.error("Error unassigning:", err);
            alert("Error removing employee.");
        });
}

function deleteTask(event, taskId) {
    event.stopPropagation(); // Prevent row click
    if (!confirm("Are you sure you want to permanently delete this task?")) {
        return;
    }

    fetch(`/api/deleteTask?taskId=${taskId}`, {
        method: "POST"
    })
        .then(() => {
            if (selectedTaskId === taskId) {
                selectedTaskId = null;
                document.getElementById("suggestedEmployees").innerHTML = "";
                document.getElementById("selectionHint").style.display = "block";
                document.getElementById("selectionHint").innerText = "Select a task on the left to see matching staff members.";
                if (document.getElementById("assignmentActions")) document.getElementById("assignmentActions").style.display = "none";
                if (document.getElementById("selectionCounter")) document.getElementById("selectionCounter").style.display = "none";
            }
            loadTasks();
        })
        .catch(err => {
            console.error("Error deleting task:", err);
            alert("Error deleting task.");
        });
}


// ======================
// TASK MODAL LOGIC (NEW)
// ======================

let modalSelectedEmployees = new Set();
let currentModalTask = null;

function openTaskModal(taskId) {
    selectedTaskId = taskId;
    fetch(`/api/tasksByDate?date=${new Date().toISOString().split('T')[0]}`)
        .then(res => res.json())
        .then(tasks => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            currentModalTask = task;
            modalSelectedEmployees.clear();

            // Update Modal UI
            document.getElementById("modalTitle").innerText = task.taskName;
            document.getElementById("modalSection").innerText = task.section;
            document.getElementById("modalPriority").innerText = task.priority;
            document.getElementById("modalDeadline").innerText = task.deadline || "None";
            document.getElementById("modalStatus").innerText = task.status;

            // Completion Button state
            const completeBtn = document.getElementById("completeBtn");
            if (task.status === "Completed") {
                completeBtn.innerText = "Task Completed ✓";
                completeBtn.disabled = true;
                completeBtn.style.opacity = "0.6";
                completeBtn.style.cursor = "not-allowed";
            } else {
                completeBtn.innerText = "Mark as Completed";
                completeBtn.disabled = false;
                completeBtn.style.opacity = "1";
                completeBtn.style.cursor = "pointer";
            }

            // Render assigned list
            renderModalAssigned(task);

            // Fetch suggestions
            fetch("/api/employeesBySkill?skill=" + encodeURIComponent(task.requiredSkill))
                .then(res => res.json())
                .then(data => {
                    renderModalSuggestions(data, task);
                });

            document.getElementById("taskModal").style.display = "flex";
        });
}

function closeTaskModal() {
    document.getElementById("taskModal").style.display = "none";
    loadTasks();
}

function handleOutsideClick(event) {
    if (event.target.id === "taskModal") {
        closeTaskModal();
    }
}

function renderModalAssigned(task) {
    const container = document.getElementById("modalAssignedList");
    if (!task.assignedEmployees || task.assignedEmployees.trim() === "") {
        container.innerHTML = "<p style='color:#94a3b8; font-size:13px; margin:0;'>No one assigned yet.</p>";
        return;
    }

    const emps = task.assignedEmployees.split(", ");
    container.innerHTML = emps.map(emp => `
        <span class="assigned-tag">
            ${emp}
            <span class="unassign-btn" onclick="unassignFromModal('${emp}')">&times;</span>
        </span>
    `).join("");
}

function renderModalSuggestions(employees, task) {
    const container = document.getElementById("modalSuggestionsList");
    const actions = document.getElementById("modalSelectionActions");

    if (employees.length === 0) {
        container.innerHTML = "<p style='color:#64748b; font-size:13px; text-align:center; padding:20px;'>No matching employees found.</p>";
        actions.style.display = "none";
        return;
    }

    // Filter out already assigned
    const assignedSet = new Set(task.assignedEmployees ? task.assignedEmployees.split(", ").map(e => e.trim()) : []);
    const available = employees.filter(e => !assignedSet.has(e.username));

    if (available.length === 0) {
        container.innerHTML = "<p style='color:#10b981; font-size:13px; text-align:center; padding:20px; font-weight:600;'>All qualified staff are assigned!</p>";
        actions.style.display = "none";
        return;
    }

    container.innerHTML = available.map(emp => {
        const isSelected = modalSelectedEmployees.has(emp.username);
        return `
            <div class="suggestion-item ${isSelected ? 'selected' : ''}" onclick="toggleModalEmpSelection('${emp.username}')">
                <div style="display: flex; align-items: center;">
                    <div class="status-active-badge"></div>
                    <span style="font-weight:600; color:#1e293b;">${emp.username}</span>
                </div>
                <div style="color:var(--primary); font-weight:800;">${isSelected ? '✓' : '+'}</div>
            </div>
        `;
    }).join("");

    actions.style.display = modalSelectedEmployees.size > 0 ? "block" : "none";
}

function toggleModalEmpSelection(username) {
    if (modalSelectedEmployees.has(username)) {
        modalSelectedEmployees.delete(username);
    } else {
        modalSelectedEmployees.add(username);
    }
    fetch("/api/employeesBySkill?skill=" + encodeURIComponent(currentModalTask.requiredSkill))
        .then(res => res.json())
        .then(data => renderModalSuggestions(data, currentModalTask));
}

function confirmModalAssignment() {
    if (modalSelectedEmployees.size === 0) return;
    const employees = Array.from(modalSelectedEmployees).join(", ");

    fetch(`/api/assignEmployees?taskId=${selectedTaskId}&employees=${encodeURIComponent(employees)}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(updatedTask => {
            currentModalTask = updatedTask;
            modalSelectedEmployees.clear();
            renderModalAssigned(updatedTask);
            // Refresh suggestions
            fetch("/api/employeesBySkill?skill=" + encodeURIComponent(updatedTask.requiredSkill))
                .then(res => res.json())
                .then(data => renderModalSuggestions(data, updatedTask));
        });
}

function unassignFromModal(employeeName) {
    if (!confirm(`Remove ${employeeName} from this task?`)) return;

    fetch(`/api/unassignEmployee?taskId=${selectedTaskId}&employee=${encodeURIComponent(employeeName)}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(updatedTask => {
            currentModalTask = updatedTask;
            renderModalAssigned(updatedTask);
            // Refresh suggestions
            fetch("/api/employeesBySkill?skill=" + encodeURIComponent(updatedTask.requiredSkill))
                .then(res => res.json())
                .then(data => renderModalSuggestions(data, updatedTask));
        });
}

function markTaskCompletedFromModal() {
    if (!currentModalTask) return;

    fetch(`/api/updateTaskStatus?taskId=${selectedTaskId}&status=Completed`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(updatedTask => {
            alert("Task marked as completed!");
            document.getElementById("modalStatus").innerText = "Completed";
            const completeBtn = document.getElementById("completeBtn");
            completeBtn.innerText = "Task Completed ✓";
            completeBtn.disabled = true;
            completeBtn.style.opacity = "0.6";
            completeBtn.style.cursor = "not-allowed";
            currentModalTask = updatedTask;
        });
}

function handleDeleteFromModal() {
    if (!confirm("Are you sure you want to permanently delete this task?")) return;

    fetch(`/api/deleteTask?taskId=${selectedTaskId}`, {
        method: "POST"
    })
        .then(() => {
            closeTaskModal();
        });
}


// ======================
// EMPLOYEE DASHBOARD
// ======================

function loadEmployeeStats() {

    let username = localStorage.getItem("username");

    if (!username) {
        document.getElementById("employeeName").innerText = "Not logged in";
        return;
    }

    // Set avatar and name
    document.getElementById("avatarLetter").innerText = username.charAt(0).toUpperCase();
    document.getElementById("employeeName").innerText = "Welcome, " + username;

    // Fetch profile
    fetch("/api/employeeProfile?username=" + encodeURIComponent(username))
        .then(res => res.json())
        .then(profile => {

            if (profile && profile.phoneNumber) {
                document.getElementById("empDept").innerText = "📞 " + profile.phoneNumber;
            } else if (profile && profile.department) {
                document.getElementById("empDept").innerText = "🏢 " + profile.department;
            }

            // Display skills as badges
            if (profile && profile.skill) {
                let skills = profile.skill.split(",");
                let html = "";
                skills.forEach(s => {
                    html += `<span class="skill-badge">${s.trim()}</span>`;
                });
                document.getElementById("employeeSkills").innerHTML = html;
            } else {
                document.getElementById("employeeSkills").innerHTML = "<span style='color:#999;'>No skills registered</span>";
            }

        })
        .catch(() => {
            document.getElementById("employeeSkills").innerHTML = "<span style='color:red;'>Error loading profile</span>";
        });

    // Fetch attendance stats
    fetch("/api/employeeStats?employeeName=" + encodeURIComponent(username))
        .then(res => res.json())
        .then(stats => {

            let present = stats.present || 0;
            let absent = stats.absent || 0;
            let total = present + absent;
            let pct = total > 0 ? Math.round((present / total) * 100) : 0;

            document.getElementById("presentDays").innerText = present;
            document.getElementById("absentDays").innerText = absent;
            document.getElementById("productivity").innerText = pct + "%";

            // Attendance Pie Chart
            let ctx = document.getElementById("attendancePieChart");
            if (ctx) {
                new Chart(ctx.getContext("2d"), {
                    type: "doughnut",
                    data: {
                        labels: ["Present", "Absent"],
                        datasets: [{
                            data: [present, absent],
                            backgroundColor: ["#10b981", "#ef4444"],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: "bottom" }
                        }
                    }
                });
            }

        })
        .catch(() => {
            document.getElementById("presentDays").innerText = "?";
            document.getElementById("absentDays").innerText = "?";
        });
}


function loadEmployeeTasks() {

    let username = localStorage.getItem("username");
    if (!username) return;

    fetch("/api/tasksByEmployee?employeeName=" + encodeURIComponent(username))
        .then(res => res.json())
        .then(tasks => {

            document.getElementById("totalTaskCount").innerText = tasks.length;

            // Task status counts for bar chart
            let statusCounts = { "Pending": 0, "Started": 0, "In Progress": 0, "Completed": 0 };
            tasks.forEach(t => {
                if (statusCounts.hasOwnProperty(t.status)) {
                    statusCounts[t.status]++;
                } else {
                    statusCounts[t.status] = 1;
                }
            });

            // Task Bar Chart
            let ctx = document.getElementById("taskBarChart");
            if (ctx) {
                new Chart(ctx.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: Object.keys(statusCounts),
                        datasets: [{
                            label: "Tasks",
                            data: Object.values(statusCounts),
                            backgroundColor: ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"],
                            borderRadius: 6,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } }
                        }
                    }
                });
            }

            // Task list
            let html = "";
            let assignedTasks = [];

            if (tasks.length === 0) {
                html = "<p style='color:#999;'>No tasks assigned yet.</p>";
            }

            tasks.forEach(task => {
                assignedTasks.push(task);
                let statusColor = "#f59e0b"; // Pending/Default
                if (task.status === "Completed") statusColor = "#10b981";
                if (task.status === "In Progress") statusColor = "#8b5cf6";
                if (task.status === "Started") statusColor = "#3b82f6";

                html += `
                <div class="task-item">
                    <div>
                        <div style="font-weight: 700; color: #1e293b;">${task.taskName}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            ${task.section} • Priority: ${task.priority}<br>
                            Deadline: ${task.deadline ? task.deadline : task.date}
                        </div>
                    </div>
                    <span class="status-badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
                        ${task.status}
                    </span>
                </div>`;
            });

            document.getElementById("employeeTaskList").innerHTML = html;

            // Initialize Calendar with these tasks
            window.employeeTasks = assignedTasks;
            initCalendar();

        })
        .catch((err) => {
            console.error("Error loading tasks:", err);
            document.getElementById("employeeTaskList").innerHTML = "<p style='color:red;'>Error loading tasks.</p>";
        });
}

// ======================
// EMPLOYEE CALENDAR
// ======================

let currentDate = new Date();

function initCalendar() {
    renderCalendar();

    document.getElementById("prevMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("currentMonthDisplay").innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Group tasks by date
    const tasksByDate = {};
    if (window.employeeTasks) {
        window.employeeTasks.forEach(task => {
            // Use deadline if exists, else fallback to creation date
            let dateStr = task.deadline ? task.deadline : task.date;
            if (dateStr) {
                if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
                tasksByDate[dateStr].push(task);
            }
        });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        let isToday = isCurrentMonth && today.getDate() === i;
        let dayClass = isToday ? "day-number today" : "day-number";

        // Format date string to match YYYY-MM-DD
        let m = (month + 1).toString().padStart(2, '0');
        let d = i.toString().padStart(2, '0');
        let dateKey = `${year}-${m}-${d}`;

        let tasksHtml = "";
        if (tasksByDate[dateKey]) {
            tasksByDate[dateKey].forEach(t => {
                let badgeClass = "cal-task-pending";
                if (t.status === "Started") badgeClass = "cal-task-started";
                if (t.status === "In Progress") badgeClass = "cal-task-progress";
                if (t.status === "Completed") badgeClass = "cal-task-completed";

                tasksHtml += `<div class="cal-task-pill ${badgeClass}" title="${t.taskName} - ${t.status}">${t.taskName}</div>`;
            });
        }

        grid.innerHTML += `
            <div class="calendar-day">
                <div class="${dayClass}">${i}</div>
                <div style="flex:1; margin-top:5px;">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }
}


// ======================
// MANAGER ANALYTICS
// ======================

function loadManagerAnalytics() {

    // Fetch employee count
    fetch("/api/employees")
        .then(res => res.json())
        .then(employees => {
            document.getElementById("totalEmployees").innerText = employees.length;
        })
        .catch(() => { });

    // Fetch main analytics
    fetch("/api/managerAnalytics")
        .then(res => res.json())
        .then(data => {

            let total = data.totalTasks || 0;
            let completed = data.completedTasks || 0;
            let pending = data.pendingTasks || 0;
            let present = data.presentEmployees || 0;
            let absent = data.absentEmployees || 0;
            let rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            document.getElementById("totalTasks").innerText = total;
            document.getElementById("totalCompleted").innerText = completed;
            document.getElementById("totalPending").innerText = pending;
            document.getElementById("completionRate").innerText = rate + "%";
            document.getElementById("totalPresent").innerText = present;
            document.getElementById("totalAbsent").innerText = absent;

            // Task Status Pie Chart
            new Chart(document.getElementById("taskChart").getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Completed", "Pending", "Other"],
                    datasets: [{
                        data: [completed, pending, Math.max(0, total - completed - pending)],
                        backgroundColor: ["#10b981", "#f59e0b", "#8b5cf6"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "bottom" }
                    }
                }
            });

            // Attendance Doughnut Chart
            new Chart(document.getElementById("attendanceChart").getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Present", "Absent"],
                    datasets: [{
                        data: [present, absent],
                        backgroundColor: ["#10b981", "#ef4444"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "bottom" }
                    }
                }
            });

            // Skills Demand Bar Chart
            let skillsDemand = data.skillsDemand || {};
            let skillLabels = Object.keys(skillsDemand);
            let skillValues = Object.values(skillsDemand);

            let barColors = ["#667eea", "#764ba2", "#f59e0b", "#10b981", "#ef4444",
                "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

            new Chart(document.getElementById("skillsChart").getContext("2d"), {
                type: "bar",
                data: {
                    labels: skillLabels,
                    datasets: [{
                        label: "Demand Count",
                        data: skillValues,
                        backgroundColor: barColors.slice(0, skillLabels.length),
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                        x: { ticks: { maxRotation: 45 } }
                    }
                }
            });

        })
        .catch(err => {
            console.error("Error loading manager analytics:", err);
        });
}

function loadManagerTaskReport() {
    const date = document.getElementById("reportDate").value;
    const body = document.getElementById("taskReportBody");

    if (!date) return;

    body.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center;">Loading tasks for ${date}...</td></tr>`;

    fetch(`/api/tasksByDate?date=${date}`)
        .then(res => res.json())
        .then(tasks => {
            if (tasks.length === 0) {
                body.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: #94a3b8;">No tasks found for ${date}.</td></tr>`;
                return;
            }

            body.innerHTML = tasks.map(t => {
                let statusColor = "#f59e0b"; // Pending
                if (t.status === "Completed") statusColor = "#10b981";
                if (t.status === "In Progress") statusColor = "#8b5cf6";
                if (t.status === "Started") statusColor = "#3b82f6";

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                        <td style="padding: 12px; font-weight: 600; color: #1e293b;">${t.taskName || 'Untitled'}</td>
                        <td style="padding: 12px; color: #64748b;">${t.section}</td>
                        <td style="padding: 12px;">
                            <span style="background: ${statusColor}15; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid ${statusColor}30;">
                                ${t.status}
                            </span>
                        </td>
                        <td style="padding: 12px; color: #475569;">${t.assignedEmployees || '<span style="color:#cbd5e1">None</span>'}</td>
                        <td style="padding: 12px; color: #475569; font-weight: 500;">${t.priority}</td>
                    </tr>
                `;
            }).join("");
        })
        .catch(err => {
            console.error("Error loading report:", err);
            body.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #ef4444;">Error loading tasks.</td></tr>`;
        });
}

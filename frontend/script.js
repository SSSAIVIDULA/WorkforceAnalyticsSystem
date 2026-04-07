// ======================
// CONFIGURATION
// ======================
const API_BASE_URL = 'http://localhost:8080';

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

// Global Tab Switching Logic for Classic Dashboard
function switchTab(tabId, element) {
    // Hide all tab sections in the current page
    const sections = document.querySelectorAll('.tab-section');
    sections.forEach(s => s.classList.remove('active'));

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Show the target section
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
    }

    // Set the clicked nav item as active
    if (element) {
        element.classList.add('active');
    }

    // AUTO-REFRESH DATA based on tab
    if (tabId === 'tab-overview') {
        if (typeof loadManagerAnalytics === 'function') loadManagerAnalytics();
    } else if (tabId === 'tab-sup-overview') {
        if (typeof loadSupervisorDashboard === 'function') loadSupervisorDashboard();
    } else if (tabId === 'tab-reports') {
        const reportDateInput = document.getElementById("reportDate");
        if (reportDateInput && reportDateInput.value) {
            if (typeof loadManagerTaskReport === 'function') loadManagerTaskReport();
        }
    } else if (tabId === 'tab-directory' || tabId === 'tab-sup-directory') {
        const dirId = (tabId === 'tab-directory') ? "mgrEmployeeDirectory" : "supEmployeeDirectory";
        if (typeof loadEmployeeDirectory === 'function') loadEmployeeDirectory(dirId);
    } else if (tabId === 'tab-orders') {
        if (typeof loadOrders === 'function') loadOrders();
    } else if (tabId === 'tab-order-analytics') {
        if (typeof loadOrderAnalytics === 'function') loadOrderAnalytics();
    } else if (tabId === 'tab-order-history') {
        if (typeof loadAllOrderHistory === 'function') loadAllOrderHistory();
    }
}

// Global Redirects
function goAddEmployee() { window.location.href = 'add-employee.html'; }

function goAttendance() {
    window.location = "attendance.html";
}

function goTaskManagement() {
    window.location = "task-management.html";
}

function toggleOrderGroup(orderCode) {
    let el = document.getElementById("order-tasks-" + orderCode);
    if (el) {
        if (el.style.display === "none") {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    }
}


// ======================
// ADD EMPLOYEE
// ======================

function addEmployee() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    let role = document.getElementById("role").value;

    let primarySkills = [];
    document.querySelectorAll('input[name="primarySkill"]:checked').forEach(cb => primarySkills.push(cb.value));
    
    let secondarySkills = [];
    document.querySelectorAll('input[name="secondarySkill"]:checked').forEach(cb => secondarySkills.push(cb.value));

    let employeeId = document.getElementById("employeeId").value.trim();
    let phoneNumber = document.getElementById("phoneNumber").value.trim();

    if (username === "" || password === "") {
        document.getElementById("msg").innerHTML = "Please fill all fields";
        return;
    }

    if (primarySkills.length === 0) {
        document.getElementById("msg").style.color = "red";
        document.getElementById("msg").innerHTML = "At least one Primary Skill is required";
        return;
    }

    const payload = {
        username,
        password,
        role,
        primarySkills: primarySkills.join(", "),
        secondarySkills: secondarySkills.join(", "),
        skill: primarySkills.concat(secondarySkills).join(", "), // Keep legacy field for compatibility
        employeeId,
        phoneNumber
    };

    fetch("/api/addEmployee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

            document.querySelectorAll('input[name="primarySkill"], input[name="secondarySkill"]').forEach(cb => {
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
    "Yarn Cleaning": { section: "Machine Maintenance / Cleaning", skills: "Machine Maintenance, Yarn Handling" },
    "Yarn Preparation": { section: "Yarn Preparation", skills: "Yarn Handling" },
    "Socks Knitting": { section: "Knitting", skills: "Knitting Machine Operation" },
    "Quality Inspection": { section: "Quality Check", skills: "Quality Inspection" },
    "Socks Packaging": { section: "Packaging", skills: "Packaging" },
    "Socks Labeling": { section: "Labeling & Tagging", skills: "Labeling & Tagging" },
    "Inventory Dispatch": { section: "Dispatch / Logistics", skills: "Dispatch Handling" }
};
let dynamicSectionSkills = {};

async function loadDynamicSectionsForTasks() {
    try {
        const res = await fetch("/api/settings/allSectionSkillMap");
        dynamicSectionSkills = await res.json();
        
        let sectionDropdown = document.getElementById("taskSection");
        if(sectionDropdown) {
            sectionDropdown.innerHTML = '<option value="">Select Section...</option>';
            Object.keys(dynamicSectionSkills).forEach(sec => {
                sectionDropdown.innerHTML += `<option value="${sec}">${sec}</option>`;
            });
        }
    } catch(err) {
        console.error("Error loading sections:", err);
    }
}

function autoFillSkillsBySectionDynamic() {
    let section = document.getElementById("taskSection").value;
    if (dynamicSectionSkills[section]) {
        document.getElementById("taskSkill").value = dynamicSectionSkills[section].join(", ");
    } else {
        document.getElementById("taskSkill").value = "";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if(window.location.href.includes("task-management.html")) {
        loadDynamicSectionsForTasks();
    }
});


function createTask() {

    let taskNameVal = document.getElementById("taskName").value.trim();
    let customTaskName = document.getElementById("customTaskName") ? document.getElementById("customTaskName").value.trim() : "";
    let taskName = customTaskName ? customTaskName : taskNameVal;

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
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("taskFilterDate");
    
    if (dateInput && dateInput.value === "") {
        dateInput.value = todayStr;
    }

    const selectedDate = dateInput ? dateInput.value : todayStr;

    fetch("/api/tasksByDate?date=" + selectedDate, { cache: "no-store" })
        .then(res => res.json())
        .then(tasks => {

            let html = "";
            if (tasks.length === 0) {
                html = "<p style='color:#999;'>No tasks created today.</p>";
            } else {
                let orderGroups = {};
                let manualTasks = [];

                tasks.forEach(task => {
                    let groupKey = task.orderCode || task.orderId; 
                    if (groupKey) {
                        if (!orderGroups[groupKey]) {
                            orderGroups[groupKey] = {
                                orderCode: task.orderCode || ("Order ID: " + task.orderId),
                                customerName: task.customerName || "N/A",
                                orderDescription: task.orderDescription || "Task Breakdown",
                                tasks: []
                            };
                        }
                        orderGroups[groupKey].tasks.push(task);
                    } else {
                        manualTasks.push(task);
                    }
                });

                const renderTaskHTML = (task) => {
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

                    let effectiveSkill = task.requiredSkill;
                    if (!effectiveSkill || effectiveSkill.trim() === "" || (typeof effectiveSkill === 'string' && effectiveSkill.includes("No skills set"))) {
                        effectiveSkill = SECTION_SKILLS[task.section] || "";
                    }
                    let hasSkill = effectiveSkill && effectiveSkill.trim() !== "";

                    let statusBg = task.status === 'Completed' ? '#d1fae5' : '#fef3c7';
                    let statusColor = task.status === 'Completed' ? '#065f46' : '#92400e';
                    let statusLabelHTML = `<span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${task.status}</span>`;

                    if (hasSkill) {
                        return `
                        <div class="employee-row" 
                             onclick="openTaskModal(${task.id})" 
                             style="cursor:pointer; margin-bottom: 10px; padding: 12px; border-radius: 8px; transition: 0.3s; background: #fff; ${isSelected}">
                            <div style="flex: 1;">
                                <b style="font-size: 16px; color: #333;">${task.taskName || 'Untitled'}</b><br>
                                <small style="color: #666;">Section: ${task.section} | Priority: ${task.priority}</small><br>
                                <small style="color: #667eea;">Skills: ${effectiveSkill}</small><br>
                                <div style="font-size: 13px; margin-top:5px;"><b>Assigned:</b> ${assignedListHTML}</div>
                            </div>
                            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                                ${statusLabelHTML}
                                <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
                            </div>
                        </div>`;
                    } else {
                        return `
                        <div class="employee-row" 
                             style="margin-bottom: 10px; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; background: #fff5f5; opacity: 0.7;">
                            <div style="flex: 1;">
                                <b style="font-size: 16px; color: #999;">${task.taskName || 'Untitled'}</b><br>
                                <small onclick="openTaskModal(${task.id})" style="cursor:pointer; color: #ef4444;">⚠ No skills set — click to assign section/skills</small>
                            </div>
                            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                                ${statusLabelHTML}
                                <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
                            </div>
                        </div>`;
                    }
                };

                Object.values(orderGroups).forEach(group => {
                    html += `
                    <div style="margin-bottom: 15px; border: 1px solid #c7d2fe; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        <div style="background: #e0e7ff; padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" 
                             onclick="toggleOrderGroup('${group.orderCode}')" onmouseover="this.style.background='#c7d2fe'" onmouseout="this.style.background='#e0e7ff'">
                            <div>
                                <strong style="color: #4338ca; font-size: 16px; display:flex; align-items:center; gap:8px;">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                    Production Order: ${group.orderCode}
                                </strong>
                                <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                                    <b>Customer:</b> ${group.customerName || 'N/A'} &nbsp;|&nbsp; <b>Batch Desc:</b> ${group.orderDescription || 'N/A'}
                                </div>
                            </div>
                            <div style="color: #4338ca; font-weight: bold; font-size: 14px; background: rgba(255,255,255,0.5); padding: 4px 10px; border-radius: 20px;">
                                ${group.tasks.length} Task(s)
                            </div>
                        </div>
                        <div id="order-tasks-${group.orderCode}" style="display: none; padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                            ${group.tasks.map(t => renderTaskHTML(t)).join('')}
                        </div>
                    </div>`;
                });

                if (manualTasks.length > 0) {
                    html += `
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: #64748b; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Independent Tasks</h4>
                        ${manualTasks.map(t => renderTaskHTML(t)).join('')}
                    </div>`;
                }
            }

            let taskListEl = document.getElementById("taskList");
            if (taskListEl) {
                taskListEl.innerHTML = html;
            }

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

    // Note: selectTask seems unused in the new modal-based UI, but updated for consistency.
    // We would need the date passed here if this function were ever revived.
    fetch(`/api/employeesBySkill?skill=${encodeURIComponent(skill)}`)
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
    const selectedDate = document.getElementById("taskFilterDate") ? document.getElementById("taskFilterDate").value : new Date().toISOString().split('T')[0];
    
    fetch(`/api/tasksByDate?date=${selectedDate}`)
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

            // Fetch suggestions (Filtered by presence on the task's date)
            fetch(`/api/employeesBySkill?skill=${encodeURIComponent(task.requiredSkill)}&date=${task.date}`)
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

function getEmployeeStatus(emp) {
    if (emp.todayTasks >= 3) return "Overloaded";
    if (emp.todayTasks > 0) return "Busy";
    return "Available";
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

    // Smart Suggestion Logic
    let primaryCount = available.filter(e => e.matchType === 'Primary').length;
    let secondaryCount = available.filter(e => e.matchType === 'Secondary').length;
    let recommendation = "";
    if (primaryCount > 0) {
        recommendation = `<div class="smart-suggestion">
            <i class="fas fa-lightbulb"></i>
            <span>${primaryCount} employees have primary skills, ${secondaryCount} have secondary. Recommend assigning primary-skilled employees.</span>
        </div>`;
    } else if (secondaryCount > 0) {
        recommendation = `<div class="smart-suggestion" style="background:#fff7ed; border-color:#fed7aa; color:#943412;">
            <i class="fas fa-exclamation-triangle"></i>
            <span>No primary-skilled staff available. Using secondary-skilled employees.</span>
        </div>`;
    }

    let itemsHTML = recommendation;

    available.forEach(emp => {
        const isSelected = modalSelectedEmployees.has(emp.username);
        const status = getEmployeeStatus(emp);
        const statusClass = "status-" + status.toLowerCase();
        
        const skillBadge = emp.matchType === 'Primary' 
            ? `<span class="skill-badge skill-primary">Primary</span>`
            : (emp.matchType === 'Secondary' ? `<span class="skill-badge skill-secondary">Secondary</span>` : "");

        const pendingWarning = emp.yesterdayPending > 0 
            ? `<div class="warning-text"><i class="fas fa-clock"></i> Has ${emp.yesterdayPending} unfinished task from yesterday</div>`
            : "";

        itemsHTML += `
            <div class="suggestion-item ${isSelected ? 'selected' : ''}" onclick="toggleModalEmpSelection('${emp.username}')" 
                 style="display: flex; flex-direction: column; align-items: stretch; padding: 15px; border-bottom: 1px solid #f1f5f9; position: relative;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight:700; color:#1e293b; font-size: 15px;">${emp.username}</span>
                        ${skillBadge}
                    </div>
                    <span class="status-badge ${statusClass}">${status}</span>
                </div>

                <div style="display: flex; gap: 15px; margin-bottom: 5px;">
                    <div class="info-label">Today Tasks: <span class="info-value">${emp.todayTasks}</span></div>
                    <div class="info-label">Skills: <span class="info-value" style="font-size:11px;">${emp.primarySkills || 'None'}</span></div>
                </div>

                ${pendingWarning}

                <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color:var(--primary); font-weight:800; font-size: 20px;">
                    ${isSelected ? '✓' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = itemsHTML;
    actions.style.display = modalSelectedEmployees.size > 0 ? "block" : "none";
}

function toggleModalEmpSelection(username) {
    if (modalSelectedEmployees.has(username)) {
        modalSelectedEmployees.delete(username);
    } else {
        modalSelectedEmployees.add(username);
    }
    fetch(`/api/employeesBySkill?skill=${encodeURIComponent(currentModalTask.requiredSkill)}&date=${currentModalTask.date}`)
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
            fetch(`/api/employeesBySkill?skill=${encodeURIComponent(updatedTask.requiredSkill)}&date=${updatedTask.date}`)
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
            fetch(`/api/employeesBySkill?skill=${encodeURIComponent(updatedTask.requiredSkill)}&date=${updatedTask.date}`)
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
            
            // Sync with main list
            if (typeof loadTasks === 'function' && document.getElementById('taskList')) loadTasks();
            // Sync with Hub stats
            if (typeof loadSupervisorDashboard === 'function' && document.getElementById('totalEmployees')) loadSupervisorDashboard();
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
    fetch("/api/employeeProfile?username=" + encodeURIComponent(username), { cache: "no-store" })
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
    fetch("/api/employeeStats?employeeName=" + encodeURIComponent(username), { cache: "no-store" })
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

    fetch("/api/tasksByEmployee?employeeName=" + encodeURIComponent(username), { cache: "no-store" })
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
                <div class="task-item" style="padding: 25px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: white;">
                    <div style="flex: 1;">
                        <div style="font-size: 24px; font-weight: 800; color: #1e293b; line-height: 1.4; margin-bottom: 10px;">${task.taskName}</div>
                        <div style="font-size: 16px; font-weight: 600; color: #64748b; margin-top: 4px;">
                            <span style="display:inline-block; margin-right: 15px;">📌 Section: ${task.section}</span> 
                            <span style="display:inline-block; margin-right: 15px;">⚡ Priority: ${task.priority}</span>
                            <span style="display:inline-block;">⏰ Deadline: ${task.deadline ? task.deadline : task.date}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 15px; margin-left: 20px;">
                        <span class="status-badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30; font-size: 14px; padding: 6px 16px; border-radius: 20px;">
                            ${task.status}
                        </span>
                    </div>
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

function updateTaskStatusFromDashboard(taskId, status) {
    fetch(`/api/updateTaskStatus?taskId=${taskId}&status=${status}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {
            // Refresh stats and tasks on the current dashboard
            if (typeof loadEmployeeStats === 'function' && document.getElementById('presentDays')) loadEmployeeStats();
            if (typeof loadEmployeeTasks === 'function' && document.getElementById('employeeTaskList')) loadEmployeeTasks();
            
            // If on supervisor management page
            if (typeof loadTasks === 'function' && document.getElementById('taskList')) loadTasks();
            if (typeof loadSupervisorDashboard === 'function' && document.getElementById('totalEmployees')) loadSupervisorDashboard();
        })
        .catch(err => {
            console.error("Error updating status:", err);
            alert("Error updating task status.");
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

                let nameStr = t.taskName || "Untitled";
                let shortName = nameStr.split(" ").slice(0, 2).join(" ");
                if (nameStr.split(" ").length > 2) {
                    shortName += "...";
                }
                tasksHtml += `<div class="cal-task-pill ${badgeClass}" title="${nameStr} - ${t.status}">${shortName}</div>`;
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

    // Initialize attendance calendar
    loadMgrAttendanceCalendar();
    
    // Load Employee Directory
    loadEmployeeDirectory("mgrEmployeeDirectory");

    // Fetch employee count
    fetch("/api/employees", { cache: "no-store" })
        .then(res => res.json())
        .then(employees => {
            document.getElementById("totalEmployees").innerText = employees.length;
        })
        .catch(() => { });

    // Fetch main analytics
    fetch("/api/managerAnalytics", { cache: "no-store" })
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


// ======================
// MANAGER ATTENDANCE CALENDAR
// ======================

let mgrCalDate = new Date();
let mgrCalData = {}; // Cached attendance summary data

function mgrCalPrev() {
    mgrCalDate.setMonth(mgrCalDate.getMonth() - 1);
    loadMgrAttendanceCalendar();
}

function mgrCalNext() {
    mgrCalDate.setMonth(mgrCalDate.getMonth() + 1);
    loadMgrAttendanceCalendar();
}

function loadMgrAttendanceCalendar() {
    const year = mgrCalDate.getFullYear();
    const month = mgrCalDate.getMonth() + 1; // 1-indexed for API

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById("mgrCalMonthDisplay").innerText = `${monthNames[month - 1]} ${year}`;

    // Show loading state
    document.getElementById("mgrCalGrid").innerHTML =
        '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">Loading attendance data...</div>';

    fetch(`/api/attendanceSummaryByMonth?year=${year}&month=${month}`)
        .then(res => res.json())
        .then(data => {
            mgrCalData = data.summary || {};
            renderMgrCalendar();
        })
        .catch(err => {
            console.error("Error loading attendance calendar:", err);
            document.getElementById("mgrCalGrid").innerHTML =
                '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">Error loading calendar data.</div>';
        });
}

function renderMgrCalendar() {
    const year = mgrCalDate.getFullYear();
    const month = mgrCalDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById("mgrCalGrid");
    grid.innerHTML = "";

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="mgr-cal-day empty"></div>`;
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const m = (month + 1).toString().padStart(2, '0');
        const dd = d.toString().padStart(2, '0');
        const dateKey = `${year}-${m}-${dd}`;

        const isToday = isCurrentMonth && today.getDate() === d;
        const dayClass = isToday ? "mgr-cal-day today" : "mgr-cal-day";

        const dayStat = mgrCalData[dateKey];
        let badgesHtml = "";

        if (dayStat) {
            const pCount = dayStat.present || 0;
            const aCount = dayStat.absent || 0;

            if (pCount > 0) {
                badgesHtml += `<span class="mgr-cal-badge present" onclick="showMgrAttEmployees('${dateKey}', 'present')" title="Click to see present employees">✓ ${pCount}</span>`;
            }
            if (aCount > 0) {
                badgesHtml += `<span class="mgr-cal-badge absent" onclick="showMgrAttEmployees('${dateKey}', 'absent')" title="Click to see absent employees">✗ ${aCount}</span>`;
            }
        }

        grid.innerHTML += `
            <div class="${dayClass}">
                <div class="day-num">${d}</div>
                <div class="mgr-cal-badges">${badgesHtml}</div>
            </div>
        `;
    }
}


// ======================
// SUPERVISOR DASHBOARD
// ======================

function loadSupervisorDashboard() {
    loadDynamicSectionsForTasks();
    // 1. Load Directory (cached for modal)
    loadEmployeeDirectory("supEmployeeDirectory");

    // 2. Load Stats
    fetch("/api/managerAnalytics", { cache: "no-store" }) 
        .then(res => res.json())
        .then(data => {
            document.getElementById("totalEmployees").innerText = data.totalEmployees || 0;
            document.getElementById("todayPresent").innerText = data.presentEmployees || 0;
            document.getElementById("pendingTasks").innerText = data.pendingTasks || 0;
            
            let total = data.totalTasks || 0;
            let completed = data.completedTasks || 0;
            let rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            document.getElementById("avgProductivity").innerText = rate + "%";
        })
        .catch(err => console.error("Error loading supervisor dashboard:", err));

    // 3. Start Order Polling for Notifications
    startSupervisorOrderPolling();
}

function openTeamDirectory() {
    document.getElementById("teamDirectoryModal").classList.add("active");
}

function closeTeamDirectoryModal(event) {
    if (event && event.target !== document.getElementById("teamDirectoryModal")) return;
    document.getElementById("teamDirectoryModal").classList.remove("active");
}


// ======================
// EMPLOYEE DIRECTORY & DETAILS MODAL
// ======================

let allEmployeesCache = []; // Global cache for filtering

function loadEmployeeDirectory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetch("/api/employees", { cache: "no-store" })
        .then(res => res.json())
        .then(employees => {
            allEmployeesCache = employees || [];
            renderEmployeeDirectory(containerId, allEmployeesCache);
        })
        .catch(err => {
            console.error("Error loading directory:", err);
            container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; padding: 20px; color: #ef4444;">Error loading directory.</p>`;
        });
}

function renderEmployeeDirectory(containerId, employees) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!employees || employees.length === 0) {
        container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; padding: 20px; color: #94a3b8;">No matching employees found.</p>`;
        return;
    }

    container.innerHTML = employees.map(emp => {
        const initial = emp.username.charAt(0).toUpperCase();
        
        let skillsList = (emp.skill || '').split(',').map(s => s.trim()).filter(s => s);
        let displaySkills = skillsList.slice(0, 2);
        let extraCount = skillsList.length - 2;
        
        let skillsHtml = displaySkills.map(s => 
            `<span style="background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; border: 1px solid #c7d2fe; display: inline-block; white-space: nowrap;">${s}</span>`
        ).join("");
        
        if (extraCount > 0) {
            skillsHtml += `<span style="background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid #e2e8f0; display: inline-block; white-space: nowrap;">+${extraCount}</span>`;
        }
        if (skillsList.length === 0) {
            skillsHtml = `<span style="color:#94a3b8; font-size:10px;">No skills added</span>`;
        }

        const dept = emp.department || 'General Staff';

        return `
            <div class="chart-box" onclick="openEmpDetailsModal('${emp.username}')" style="cursor: pointer; transition: all 0.2s; border: 1px solid #eef2ff; display: flex; flex-direction: column; min-height: 140px; justify-content: space-between;" 
                 onmouseover="this.style.borderColor='#6366f1'; this.style.transform='translateY(-3px)'" 
                 onmouseout="this.style.borderColor='#eef2ff'; this.style.transform='translateY(0)'">
                
                <div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 12px;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;">
                            ${initial}
                        </div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-weight: 800; color: #1e293b; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.username}</div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">${dept}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">Skills</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${skillsHtml}</div>
                    </div>
                </div>

                <div style="margin-top: auto; background: #f8fafc; border-radius: 8px; padding: 8px; display: flex; justify-content: space-between; align-items: center; min-height: 40px;">
                    <div id="prog_${containerId}_${emp.username.replace(/\s+/g, '')}" style="font-size: 11px; color: #64748b; font-weight: 600; width: 100%; text-align: center;">
                        <span style="opacity: 0.6;">Loading progress...</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    employees.forEach(emp => {
        let safeUsername = emp.username.replace(/\s+/g, '');
        fetch('/api/employeeStats?employeeName=' + encodeURIComponent(emp.username))
            .then(res => res.json())
            .then(stats => {
                let p = stats.present || 0;
                let a = stats.absent || 0;
                let total = p + a;
                let rate = total > 0 ? Math.round((p / total) * 100) : 0;
                let attdColor = rate >= 75 ? '#10b981' : (rate >= 50 ? '#f59e0b' : '#ef4444');
                
                fetch('/api/tasksByEmployee?employeeName=' + encodeURIComponent(emp.username))
                    .then(res => res.json())
                    .then(tasks => {
                        let totalTasks = tasks.length;
                        let completed = tasks.filter(t => t.status === 'Completed').length;
                        
                        const progressEl = document.getElementById(`prog_${containerId}_${safeUsername}`);
                        if (progressEl) {
                            progressEl.innerHTML = `
                                <div style="display: flex; justify-content: space-around; width: 100%; align-items: center;">
                                    <div style="display: flex; flex-direction: column; align-items: center;">
                                        <span style="color: ${attdColor}; font-size: 14px; font-weight: 800;">${rate}%</span>
                                        <span style="font-size: 9px; text-transform: uppercase;">Attd</span>
                                    </div>
                                    <div style="width: 1px; height: 20px; background: #e2e8f0;"></div>
                                    <div style="display: flex; flex-direction: column; align-items: center;">
                                        <span style="color: #6366f1; font-size: 14px; font-weight: 800;">${completed}/${totalTasks}</span>
                                        <span style="font-size: 9px; text-transform: uppercase;">Tasks</span>
                                    </div>
                                </div>
                            `;
                        }
                    });
            })
            .catch(() => {
                const progressEl = document.getElementById(`prog_${containerId}_${safeUsername}`);
                if (progressEl) {
                    progressEl.innerHTML = '<span style="color: #ef4444;">Metrics error</span>';
                }
            });
    });
}

function filterEmployeeDirectory(inputId, containerId) {
    const query = document.getElementById(inputId).value.toLowerCase();
    const filtered = allEmployeesCache.filter(emp => emp.username.toLowerCase().includes(query));
    renderEmployeeDirectory(containerId, filtered);
}

// Global scope tracker for modal charts to prevent reuse errors
let empModalAttChartObj = null;
let empModalTaskChartObj = null;

function openEmpDetailsModal(username) {
    document.getElementById("empModalTitle").innerText = `Employee Insights: ${username}`;
    document.getElementById("empModalName").innerText = username;
    document.getElementById("empModalAvatar").innerText = username.charAt(0).toUpperCase();
    document.getElementById("empDetailsModal").classList.add("active");

    // Close directory modal if open (for supervisor)
    const dirModal = document.getElementById("teamDirectoryModal");
    if (dirModal) dirModal.classList.remove("active");

    // Show loading states
    document.getElementById("empModalContact").innerText = "Loading profile...";
    document.getElementById("empModalSkills").innerHTML = "Loading...";
    document.getElementById("empModalAttendanceRate").innerText = "-%";
    document.getElementById("empModalTaskList").innerHTML = '<p style="color: #94a3b8; font-size: 13px;">Syncing task history...</p>';
    document.getElementById("empModalProgressBody").innerHTML = '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #94a3b8;">Fetching records...</td></tr>';

    // 1. Fetch Profile
    fetch(`/api/employeeProfile?username=${username}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("empModalContact").innerText = data.email || 'No email provided';
            let skillsHtml = (data.skills || "").split(",").map(skill => skill.trim()).filter(s => s).map(skill => 
                `<span class="skill-badge" style="margin: 2px; font-size: 10px; padding: 3px 8px;">${skill}</span>`
            ).join("");
            document.getElementById("empModalSkills").innerHTML = skillsHtml || '<span style="color:#94a3b8; font-size:11px;">No skills added</span>';
        });

    // 2. Fetch Attendance Stats
    fetch(`/api/employeeStats?employeeName=${username}`)
        .then(res => res.json())
        .then(data => {
            let p = data.present || 0;
            let a = data.absent || 0;
            let total = p + a;
            let rate = total > 0 ? Math.round((p / total) * 100) : 0;
            
            document.getElementById("empModalAttendanceRate").innerText = rate + "%";
            document.getElementById("empModalAttendanceRate").style.color = rate > 75 ? "#10b981" : (rate > 50 ? "#f59e0b" : "#ef4444");

            // Render Attendance Pie
            if (empModalAttChartObj) empModalAttChartObj.destroy();
            const canvas = document.getElementById("empModalAttendanceChart");
            if (canvas) {
                empModalAttChartObj = new Chart(canvas.getContext("2d"), {
                    type: 'doughnut',
                    data: {
                        labels: ['Present', 'Absent'],
                        datasets: [{
                            data: [p, a],
                            backgroundColor: ['#10b981', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } } }
                });
            }
        });

    // 3. Fetch Tasks
    fetch(`/api/tasksByEmployee?employeeName=${username}`)
        .then(res => res.json())
        .then(tasks => {
            let stats = { "Pending": 0, "Started": 0, "In Progress": 0, "Completed": 0 };
            let listHtml = "";

            if (tasks.length === 0) {
                listHtml = '<p style="color: #94a3b8; font-size: 13px; text-align: center; padding: 20px;">No tasks assigned yet.</p>';
            } else {
                tasks.forEach(t => {
                    if (stats[t.status] !== undefined) stats[t.status]++;
                    let statusColor = t.status === 'Completed' ? '#10b981' : (t.status === 'Pending' ? '#f59e0b' : '#6366f1');
                    listHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #f1f5f9;">
                            <div style="font-size: 13px; font-weight: 500;">${t.taskName}</div>
                            <span style="font-size: 10px; color: ${statusColor}; background: ${statusColor}10; padding: 2px 8px; border-radius: 10px; border: 1px solid ${statusColor}30;">${t.status}</span>
                        </div>
                    `;
                });
            }
            document.getElementById("empModalTaskList").innerHTML = listHtml;

            // Render Task Bar Chart
            if (empModalTaskChartObj) empModalTaskChartObj.destroy();
            const taskCanvas = document.getElementById("empModalTaskChart");
            if (taskCanvas) {
                empModalTaskChartObj = new Chart(taskCanvas.getContext("2d"), {
                    type: 'bar',
                    data: {
                        labels: Object.keys(stats),
                        datasets: [{
                            label: 'Tasks',
                            data: Object.values(stats),
                            backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
                            borderRadius: 4
                        }]
                    },
                    options: { 
                        responsive: true, 
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });
            }
        });

    // 4. Fetch Historical Attendance Records
    fetch(`/api/employeeAttendanceRecords?username=${username}`)
        .then(res => res.json())
        .then(records => {
            const body = document.getElementById("empModalProgressBody");
            if (!records || records.length === 0) {
                body.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8;">No historical records found.</td></tr>';
                return;
            }

            // Sort by date descending
            records.sort((a, b) => new Date(b.date) - new Date(a.date));

            body.innerHTML = records.map(r => {
                const statusColor = r.status === 'Present' ? '#10b981' : '#ef4444';
                return `
                    <tr style="border-bottom: 1px solid #f8fafc;">
                        <td style="padding: 10px; font-weight: 500; color: #1e293b;">${r.date}</td>
                        <td style="padding: 10px;">
                            <span style="color: ${statusColor}; font-weight: 700;">${r.status}</span>
                        </td>
                        <td style="padding: 10px; color: #64748b;">General</td>
                    </tr>
                `;
            }).join("");
        })
        .catch(err => {
            console.error("Error fetching attendance history:", err);
            document.getElementById("empModalProgressBody").innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #ef4444;">Error loading history.</td></tr>';
        });
}

function closeEmpDetailsModal(event) {
    if (event && event.target !== document.getElementById("empDetailsModal")) return;
    document.getElementById("empDetailsModal").classList.remove("active");
}

function showMgrAttEmployees(date, status) {
    const title = document.getElementById("mgrAttModalTitle");
    const body = document.getElementById("mgrAttModalBody");
    if (!title || !body) return;

    title.innerText = `${status.toUpperCase()} Employees - ${date}`;
    body.innerHTML = '<p style="padding:20px; text-align:center;">Fetching list...</p>';
    document.getElementById("mgrAttModal").classList.add("active");

    fetch(`/api/attendanceByDate?date=${date}`)
        .then(res => res.json())
        .then(records => {
            const filtered = records.filter(r => r.status.toLowerCase() === status.toLowerCase());
            if (filtered.length === 0) {
                body.innerHTML = `<p style="padding:30px; text-align:center; color:#94a3b8;">No ${status} employees on this day.</p>`;
                return;
            }

            body.innerHTML = filtered.map(r => `
                <div class="mgr-att-emp-item">
                    <div class="mgr-att-emp-avatar ${status === 'present' ? 'present-av' : 'absent-av'}">
                        ${r.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div class="mgr-att-emp-name">${r.employeeName}</div>
                </div>
            `).join("");
        })
        .catch(err => {
            console.error("Error fetching attendance list:", err);
            body.innerHTML = '<p style="padding:20px; text-align:center; color:#ef4444;">Error loading list.</p>';
        });
}

function closeMgrAttModal(event) {
    if (event && event.target !== document.getElementById("mgrAttModal")) return;
    document.getElementById("mgrAttModal").classList.remove("active");
}

// ===================================
// ORDER MANAGEMENT (SUPERVISOR)
// ===================================

function loadOrders() {
    fetch(API_BASE_URL + "/api/ordersByStatus?status=Pending")
        .then(res => res.json())
        .then(orders => {
            const container = document.getElementById("orderList");
            const countEl = document.getElementById("orderCount");
            if (!container) return;

            if (countEl) countEl.innerText = orders.length;

            if (orders.length === 0) {
                container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: #94a3b8;">No pending orders available.</p>';
                return;
            }

            container.innerHTML = orders.map(o => {
                const priorityColor = o.priority === 'Urgent' ? '#ef4444' : (o.priority === 'High' ? '#f59e0b' : '#3b82f6');
                const skill = o.requiredSkill || '';
                const phone = o.customerPhone || 'N/A';
                const address = o.customerAddress || 'N/A';
                const safeDesc = (o.orderDescription || '').replace(/'/g, "\\'").replace(/\n/g, " ");
                const safeName = (o.customerName || '').replace(/'/g, "\\'");
                const safeSkill = skill.replace(/'/g, "\\'");
                return `
                    <div class="hub-card" style="text-align: left; padding: 25px; border-radius: 16px; cursor: default;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <span style="font-size: 11px; font-weight: 800; color: #1e293b; background: #e2e8f0; padding: 4px 10px; border-radius: 6px;">${o.orderId}</span>
                            <span style="font-size: 11px; font-weight: 800; color: white; background: ${priorityColor}; padding: 4px 10px; border-radius: 6px;">${o.priority}</span>
                        </div>
                        <h4 style="margin: 0; font-size: 18px; color: #1e293b;">${o.customerName}</h4>
                        <div style="margin: 8px 0; display: flex; flex-direction: column; gap: 4px;">
                            <div style="font-size: 12px; color: #475569;">📞 ${phone}</div>
                            <div style="font-size: 12px; color: #475569;">📍 ${address}</div>
                        </div>
                        <p style="margin: 10px 0; font-size: 13px; color: #64748b; line-height: 1.5;">${o.orderDescription}</p>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Units Produced</div>
                                <div style="font-size: 13px; font-weight: 600; color: #475569;">${o.quantity}</div>
                            </div>
                            <button onclick="openConvertOrderModal(${o.id}, '${safeName}', '${safeSkill}', '${safeDesc}', ${o.quantity}, '${o.priority}')" 
                                    style="background: #6366f1; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                                Convert to Task
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        })
        .catch(err => {
            console.error("Error loading orders:", err);
            const container = document.getElementById("orderList");
            if (container) container.innerHTML = '<p style="text-align:center; padding:40px; color:#ef4444;">Error loading orders.</p>';
        });
}

function rejectOrder(orderId) {
    if (!confirm("Are you sure you want to reject this order?")) return;

    fetch(API_BASE_URL + `/api/rejectOrder?orderId=${orderId}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(() => {
        alert("Order rejected successfully.");
        loadOrders();
    })
    .catch(err => alert("Error rejecting order."));
}

// ===================================
// MULTI-TASK BREAKDOWN BUILDER
// ===================================

let _subTaskCounter = 0;

function openConvertOrderModal(id, cust, skill, desc, qty, prio) {
    const modal = document.getElementById("convertOrderModal");
    if (!modal) return;

    document.getElementById("convOrderId").value = id;
    document.getElementById("convCustName").innerText = cust;
    document.getElementById("convOrderDesc").innerText = desc || '';

    // Reset builder
    _subTaskCounter = 0;
    const list = document.getElementById("subTasksList");
    if (list) list.innerHTML = '';

    // Pre-fill tasks based on dynamic sections
    if (dynamicSectionSkills && Object.keys(dynamicSectionSkills).length > 0) {
        Object.keys(dynamicSectionSkills).forEach(sec => {
            const secSkills = dynamicSectionSkills[sec].join(", ");
            const taskName = `${cust} - ${sec}`;
            addSubTask(taskName, sec, secSkills);
        });
    } else {
        const defaultName = skill ? skill : 'Production Task';
        addSubTask(defaultName, 'General', skill || '');
    }

    modal.classList.add("active");
}

function addSubTask(name = '', section = '', skill = '') {
    _subTaskCounter++;
    const idx = _subTaskCounter;
    const isFirst = idx === 1;

    // If name is one of FACTORY_TASKS or section is in dynamicSectionSkills, auto-fill skill
    if (!skill) {
        let match = Object.keys(FACTORY_TASKS).find(k => k.toLowerCase() === (name || '').trim().toLowerCase());
        if (match) {
            skill = FACTORY_TASKS[match].skills;
            if (!section) section = FACTORY_TASKS[match].section;
        } else if (dynamicSectionSkills && dynamicSectionSkills[section]) {
            skill = dynamicSectionSkills[section].join(", ");
        }
    }

    let sectionOptions = `<option value="">Select Section</option>`;
    if (dynamicSectionSkills) {
        Object.keys(dynamicSectionSkills).forEach(sec => {
            sectionOptions += `<option value="${sec}" ${section === sec ? 'selected' : ''}>${sec}</option>`;
        });
    }

    const badge = document.getElementById('taskCountBadge');

    const html = `
        <div id="subTask_${idx}" class="subtask-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; color: #6366f1; background: #eef2ff; padding: 3px 10px; border-radius: 20px;">Task #${idx}</span>
                ${!isFirst ? `<button onclick="removeSubTask(${idx})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">✕ Remove</button>` : '<span style="font-size:11px; color:#94a3b8;">Primary task</span>'}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="grid-column: 1 / -1;">
                    <label class="subtask-label">Task Name *</label>
                    <input type="text" id="st_name_${idx}" class="subtask-input" value="${name}" placeholder="e.g. Wash Vegetables" onchange="autoFillSubTaskSkill(${idx})">
                </div>
                <div>
                    <label class="subtask-label">Section</label>
                    <select id="st_section_${idx}" class="subtask-input" onchange="autoFillSubTaskSkill(${idx})">
                        ${sectionOptions}
                    </select>
                </div>
                <div>
                    <label class="subtask-label">Priority</label>
                    <select id="st_priority_${idx}" class="subtask-input">
                        <option value="High">High</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div style="grid-column: 1 / -1;">
                    <label class="subtask-label">Required Skills *</label>
                    <input type="text" id="st_skill_${idx}" class="subtask-input" value="${skill}" placeholder="e.g. Knitting, Dyeing Process">
                </div>
            </div>
        </div>
    `;
    const container = document.getElementById('subTasksList');
    if (container) container.insertAdjacentHTML('beforeend', html);

    // Update badge count
    const count = document.querySelectorAll('#subTasksList .subtask-card').length;
    if (badge) badge.innerText = count;
}

function autoFillSubTaskSkill(idx) {
    const nameInput = document.getElementById(`st_name_${idx}`);
    const name = nameInput ? nameInput.value.trim().toLowerCase() : '';
    const sectionInput = document.getElementById(`st_section_${idx}`);
    const section = sectionInput ? sectionInput.value : '';
    const skillInput = document.getElementById(`st_skill_${idx}`);

    let match = Object.keys(FACTORY_TASKS).find(k => k.toLowerCase() === name);

    if (match) {
        if (skillInput) skillInput.value = FACTORY_TASKS[match].skills;
        if (sectionInput) sectionInput.value = FACTORY_TASKS[match].section;
    } else if (dynamicSectionSkills && dynamicSectionSkills[section]) {
        if (skillInput) skillInput.value = dynamicSectionSkills[section].join(", ");
    }
}

function removeSubTask(idx) {
    const el = document.getElementById('subTask_' + idx);
    if (el) el.remove();
    // Update badge with remaining count
    const badge = document.getElementById('taskCountBadge');
    const count = document.querySelectorAll('#subTasksList .subtask-card').length;
    if (badge) badge.innerText = count;
}

async function confirmMultiTaskCreation() {
    const orderId = document.getElementById('convOrderId').value;
    const taskEls = document.querySelectorAll('#subTasksList .subtask-card');

    if (taskEls.length === 0) {
        alert('Please add at least one task.');
        return;
    }

    const tasks = [];
    for (const el of taskEls) {
        const idx = el.id.replace('subTask_', '');
        const name = (document.getElementById(`st_name_${idx}`) || {}).value?.trim();
        const section = (document.getElementById(`st_section_${idx}`) || {}).value?.trim() || 'General';
        const skill = (document.getElementById(`st_skill_${idx}`) || {}).value?.trim();
        const priority = (document.getElementById(`st_priority_${idx}`) || {}).value || 'Medium';

        if (!name || !skill) {
            alert(`Task #${idx}: Task Name and Required Skills are required.`);
            return;
        }
        tasks.push({ name, section, skill, priority });
    }

    const btn = document.querySelector('#convertOrderModal button[onclick="confirmMultiTaskCreation()"]');
    if (btn) { btn.disabled = true; btn.innerText = 'Creating Tasks...'; }

    try {
        // First task: uses convertOrderToTask — marks order as "In Progress"
        const first = tasks[0];
        await fetch(API_BASE_URL + `/api/convertOrderToTask?orderId=${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskName: first.name,
                section: first.section,
                requiredSkill: first.skill,
                employeesNeeded: 1,
                priority: first.priority,
                status: 'Pending'
            })
        });

        // Remaining tasks: convertOrderToTask so they all link to the order
        for (let i = 1; i < tasks.length; i++) {
            const t = tasks[i];
            await fetch(API_BASE_URL + `/api/convertOrderToTask?orderId=${orderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskName: t.name,
                    section: t.section,
                    requiredSkill: t.skill,
                    employeesNeeded: 1,
                    priority: t.priority,
                    status: 'Pending'
                })
            });
        }

        alert(`✅ ${tasks.length} task${tasks.length > 1 ? 's' : ''} created successfully!`);
        document.getElementById('convertOrderModal').classList.remove('active');
        loadOrders();

    } catch (err) {
        console.error('Error creating tasks:', err);
        alert('Error creating tasks. Please try again.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = '✓ Create All Tasks from This Order'; }
    }
}

// ===================================
// ORDER ANALYTICS (MANAGER)
// ===================================

let orderFulfillmentChartObj = null;

function loadOrderAnalytics() {
    fetch(API_BASE_URL + "/api/orderAnalytics")
        .then(res => res.json())
        .then(data => {
            document.getElementById("anaTotalOrders").innerText = data.totalOrders;
            document.getElementById("anaCompletedOrders").innerText = data.completedOrders;
            document.getElementById("anaPendingOrders").innerText = data.pendingOrders;
            
            const rate = data.totalOrders > 0 ? Math.round((data.completedOrders / data.totalOrders) * 100) : 0;
            const rateEl = document.getElementById("anaFulfillmentRate");
            if (rateEl) rateEl.innerText = rate + "%";

            // Render Chart
            if (orderFulfillmentChartObj) orderFulfillmentChartObj.destroy();
            const canvas = document.getElementById("orderFulfillmentChart");
            if (canvas) {
                const ctx = canvas.getContext("2d");
                orderFulfillmentChartObj = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
                        datasets: [{
                            data: [data.pendingOrders, data.inProgressOrders, data.completedOrders, data.cancelledOrders],
                            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }

            // Render Recent Orders Table
            const list = document.getElementById("managerOrderList");
            if (!list) return;

            if (!data.recentOrders || data.recentOrders.length === 0) {
                list.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">No orders found.</td></tr>';
                return;
            }

            list.innerHTML = data.recentOrders.map(o => {
                const statusColor = o.status === 'Completed' ? '#10b981' : (o.status === 'Pending' ? '#f59e0b' : '#3b82f6');
                return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 15px; font-weight: 700; color: #6366f1;">${o.orderId}</td>
                        <td style="padding: 15px;">${o.customerName}</td>
                        <td style="padding: 15px;">${o.requiredSkill}</td>
                        <td style="padding: 15px;">
                            <span style="background: ${statusColor}10; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid ${statusColor}30;">${o.status}</span>
                        </td>
                        <td style="padding: 15px;">${o.priority}</td>
                        <td style="padding: 15px; color: #64748b;">${o.createdAt}</td>
                    </tr>
                `;
            }).join("");
        });
}

// ===================================
// SUPERVISOR ORDER NOTIFICATIONS
// ===================================

let lastOrderCount = -1;
let pollingInterval = null;

function startSupervisorOrderPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Initial check
    checkNewOrders();
    
    // Poll every 30 seconds
    pollingInterval = setInterval(checkNewOrders, 30000);
}

function checkNewOrders() {
    fetch(API_BASE_URL + "/api/ordersByStatus?status=Pending")
        .then(res => res.json())
        .then(orders => {
            if (!Array.isArray(orders)) return;
            const currentCount = orders.length;
            const badge = document.getElementById("order-badge");
            
            // Update badge regardless of whether it's "new"
            if (badge) {
                if (currentCount > 0) {
                    badge.innerText = currentCount;
                    badge.style.display = "flex";
                } else {
                    badge.style.display = "none";
                }
            }

            // Notify if count increased
            if (lastOrderCount !== -1 && currentCount > lastOrderCount) {
                const newOrders = orders.slice(0, currentCount - lastOrderCount);
                newOrders.forEach(order => {
                    showOrderNotification(order);
                });
            }

            lastOrderCount = currentCount;
        })
        .catch(err => console.error("Polling Error:", err));
}

function showOrderNotification(order) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "notification-toast";
    toast.innerHTML = `
        <div class="toast-icon">📦</div>
        <div class="toast-content">
            <div class="toast-title">New Order Received!</div>
            <div class="toast-desc">${order.customerName}: ${order.requiredSkill || 'General'}</div>
        </div>
    `;

    toast.onclick = () => {
        switchTab('tab-orders');
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 300);
    };

    container.appendChild(toast);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add("toast-exit");
            setTimeout(() => toast.remove(), 300);
        }
    }, 8000);
}

function loadAllOrderHistory() {
    fetch(API_BASE_URL + '/api/orders')
        .then(res => res.json())
        .then(data => {
            const renderTable = (listId) => {
                const list = document.getElementById(listId);
                if (!list) return;
                if (!data || data.length === 0) {
                    list.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8;">No orders found.</td></tr>';
                    return;
                }
                list.innerHTML = data.map(o => {
                    let statusColor = '#f59e0b';
                    if (o.status === 'Completed') statusColor = '#10b981';
                    if (o.status === 'In Progress') statusColor = '#3b82f6';
                    if (o.status === 'Cancelled') statusColor = '#ef4444';
                    
                    const priorityColor = o.priority === 'Urgent' ? '#ef4444' : (o.priority === 'High' ? '#f59e0b' : '#3b82f6');
                    
                    return `
                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                            <td style="padding: 15px; font-weight: 700; color: #1e293b;">${o.orderId}</td>
                            <td style="padding: 15px; font-weight: 600; color: #475569;">${o.customerName}</td>
                            <td style="padding: 15px; color: #64748b;">${o.orderDescription}</td>
                            <td style="padding: 15px; font-weight: 700; color: #1e293b;">${o.quantity}</td>
                            <td style="padding: 15px;">
                                <span style="background: ${statusColor}15; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid ${statusColor}30;">${o.status}</span>
                            </td>
                            <td style="padding: 15px;">
                                <span style="background: ${priorityColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">${o.priority}</span>
                            </td>
                            <td style="padding: 15px; color: #94a3b8; font-size: 12px;">${o.createdAt || 'N/A'}</td>
                        </tr>
                    `;
                }).join('');
            };

            renderTable('fullOrderHistoryList');
            renderTable('supFullOrderHistoryList');
        })
        .catch(err => {
            console.error('Error loading complete order history', err);
            const errStr = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #ef4444;">Error loading history.</td></tr>';
            const table1 = document.getElementById('fullOrderHistoryList');
            const table2 = document.getElementById('supFullOrderHistoryList');
            if (table1) table1.innerHTML = errStr;
            if (table2) table2.innerHTML = errStr;
        });
}


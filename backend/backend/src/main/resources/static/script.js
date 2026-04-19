// ======================
// CONFIGURATION
// ======================
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '') 
    ? 'http://localhost:8080' 
    : (window.location.hostname.includes('render.com') ? 'https://workforceanalyticssystem.onrender.com' : '');

// 🔥 IMPORTANT FUNCTION (ADD THIS)
function api(url) {
    return API_BASE_URL + url;
}

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
    localStorage.removeItem("userRole");
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
    } else if (tabId === 'tab-attendance') {
        if (typeof loadAttendanceMarkingPage === 'function') loadAttendanceMarkingPage();
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
    let department = document.getElementById("department") ? document.getElementById("department").value : "";

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
        phoneNumber,
        department
    };

    fetch(api("/api/addEmployee"), {
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

            // Success - stay on page for multiple additions
            // setTimeout(() => { window.location = "attendance.html"; }, 1000);
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

    // Check hardcoded accounts FIRST to bypass any offline servers
    if (username === "mgr") {
        localStorage.setItem("username", "Manager");
        window.location = "manager-dashboard.html";
        return;
    }
    if (username === "sup") {
        localStorage.setItem("username", "Supervisor");
        window.location = "supervisor-dashboard.html";
        return;
    }

    if (username === "" || password === "") {
        document.getElementById("msg").innerHTML = "Enter username and password";
        return;
    }

    fetch(api("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(result => {

            if (result) {
                localStorage.setItem("username", result.username);
                if (result.role === "manager") {
                    window.location = "manager-dashboard.html";
                } else if (result.role === "supervisor") {
                    window.location = "supervisor-dashboard.html";
                } else {
                    window.location = "employee-dashboard.html";
                }
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
        fetch(api("/api/employees")).then(res => res.json()),
        fetch(api("/api/attendanceByDate?date=" + selectedDate)).then(res => res.json())
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
    let dateInput = document.getElementById("selectedDate");
    let targetDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];

    fetch(api("/api/markAttendance"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            employeeName: name,
            date: targetDate,
            status: status
        })
    })
        .then(res => res.json())
        .then(() => loadEmployees())
        .catch(err => {
            console.error("Error marking attendance:", err);
            document.getElementById("attMsg").innerText = "Error marking attendance.";
        });
}


// ======================
// TASK MANAGEMENT
// ======================

let selectedTaskId = null;

async function loadDynamicSectionsForTasks() {
    try {
        const res = await fetch(api("/api/sections"));
        const sections = await res.json();
        
        let sectionDropdown = document.getElementById("taskSection");
        if(sectionDropdown) {
            sectionDropdown.innerHTML = '<option value="">Select Section...</option>';
            sections.forEach(sec => {
                // Use data-name for easy retrieval of the name later
                sectionDropdown.innerHTML += `<option value="${sec.id}" data-name="${sec.name}">${sec.name}</option>`;
            });
        }
    } catch(err) {
        console.error("Error loading sections:", err);
    }
}

async function autoFillSkillsBySectionDynamic() {
    let sectionId = document.getElementById("taskSection").value;
    if (!sectionId) {
        document.getElementById("taskSkill").value = "";
        document.getElementById("liveMatchPreview").innerHTML = '<p style="color: #94a3b8; font-size: 13px; margin: 0;">Select a section to see available staff...</p>';
        return;
    }
    try {
        const res = await fetch(api(`/api/sections/${sectionId}/skills`));
        const skills = await res.json();
        const skillNames = skills.map(s => s.name).join(", ");
        document.getElementById("taskSkill").value = skillNames;

        // Fetch matches for these skills
        if (skillNames) {
            const date = document.getElementById("taskDeadline").value || new Date().toISOString().split('T')[0];
            const session = document.getElementById("taskSessionFilter").value;
            
            const empRes = await fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(skillNames)}&date=${date}`));
            let emps = await empRes.json();
            
            if (session) {
                emps = emps.filter(e => e.session === session);
            }

            const preview = document.getElementById("liveMatchPreview");
            if (emps.length === 0) {
                preview.innerHTML = '<p style="color: #ef4444; font-size: 13px; margin: 0;">No matching staff found for today/shift.</p>';
            } else {
                preview.innerHTML = emps.map(e => `
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${e.matchType === 'Primary' ? '#10b981' : '#f59e0b'};"></span>
                        <b>${e.username}</b>
                        <span style="color: #64748b; font-size: 10px;">(${e.matchType})</span>
                    </div>
                `).join("");
            }
        }
    } catch(err) {
        console.error("Error fetching section skills:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if(window.location.href.includes("task-management.html")) {
        loadDynamicSectionsForTasks();
        
        // Load sessions into the dropdown
        fetch(api("/api/sessions"))
            .then(res => res.json())
            .then(sessions => {
                let sessionDropdown = document.getElementById("taskSessionFilter");
                if (sessionDropdown) {
                    sessionDropdown.innerHTML = '<option value="">Any Session</option>';
                    sessions.forEach(s => {
                        sessionDropdown.innerHTML += `<option value="${s.name}">${s.name}</option>`;
                    });
                    sessionDropdown.addEventListener('change', renderSuggestedEmployees);
                }
            });
    }
});


function createTask() {
    let taskName = document.getElementById("taskName").value.trim();

    let sectionSelect = document.getElementById("taskSection");
    let sectionId = sectionSelect.value;
    let selectedOption = sectionSelect.options[sectionSelect.selectedIndex];
    let section = selectedOption ? selectedOption.getAttribute('data-name') : "";
    
    let priority = document.getElementById("taskPriority").value;
    let skill = document.getElementById("taskSkill").value.trim();
    let deadline = document.getElementById("taskDeadline").value;
    let employeesNeeded = document.getElementById("employeesNeeded").value;

    if (!taskName) {
        alert("Please provide a task name.");
        return;
    }

    if (!sectionId) {
        alert("Please select a section.");
        return;
    }

    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Creating...";

    fetch(api("/api/createTask"), {
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
    .then(res => {
        if (!res.ok) throw new Error("Failed to create task");
        return res.json();
    })
    .then(() => {
        alert("Task Created Successfully ✓");
        document.getElementById("taskName").value = "";
        loadTasks();
    })
    .catch(err => {
        alert("Error: " + err.message);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = originalText;
    });
}


function loadTasks() {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("taskFilterDate");
    
    if (dateInput && dateInput.value === "") {
        dateInput.value = todayStr;
    }

    const selectedDate = dateInput ? dateInput.value : todayStr;

    fetch(api("/api/tasksByDate?date=" + selectedDate), { cache: "no-store" })
        .then(res => res.json())
        .then(tasks => {

            let html = "";
            let htmlAssign = "";
            let htmlExec = "";
            
            if (tasks.length === 0) {
                let emptyMsg = "<p style='color:#999;'>No tasks created today.</p>";
                if (document.getElementById("taskListAssignment")) document.getElementById("taskListAssignment").innerHTML = emptyMsg;
                if (document.getElementById("taskListExecution")) document.getElementById("taskListExecution").innerHTML = emptyMsg;
            } else {
                const renderTaskHTML = (task) => {
                    let isSelected = selectedTaskId === task.id ? "border: 2px solid #2196f3; background: #e3f2fd;" : "border: 1px solid #ddd;";

                    let assignedListHTML = "<span style='color:red;'>Not Assigned</span>";
                    let isAssigned = false;
                    if (task.assignedEmployees && task.assignedEmployees.trim() !== "") {
                        isAssigned = true;
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
                        effectiveSkill = "";
                    }
                    let hasSkill = effectiveSkill && effectiveSkill.trim() !== "";

                    let statusBg = task.status === 'Completed' ? '#d1fae5' : '#fef3c7';
                    let statusColor = task.status === 'Completed' ? '#065f46' : '#92400e';
                    let statusLabelHTML = `<span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${task.status}</span>`;

                    if (hasSkill) {
                        return `
                        <div class="employee-row" 
                             onclick="selectTask(${task.id}, '${effectiveSkill}', '${task.date}')" 
                             style="cursor:pointer; margin-bottom: 10px; padding: 12px; border-radius: 8px; transition: 0.3s; background: #fff; ${isSelected}">
                            <div style="flex: 1;">
                                <b style="font-size: 16px; color: #333;">${task.taskName || 'Untitled'}</b><br>
                                <small style="color: #666;">Section: ${task.section} | Priority: ${task.priority}</small><br>
                                <small style="color: #667eea;">Skills: ${effectiveSkill}</small><br>
                                <div style="font-size: 13px; margin-top:5px;"><b>Assigned:</b> ${assignedListHTML}</div>
                            </div>
                            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                                ${statusLabelHTML}
                                <div style="display: flex; gap: 6px;">
                                    ${task.status !== 'Completed' && isAssigned ? `<button onclick="markTaskCompletedInline(event, ${task.id})" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">✓ Mark Complete</button>` : ''}
                                    <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
                                </div>
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
                                <div style="display: flex; gap: 6px;">
                                    <button onclick="deleteTask(event, ${task.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;">Discard</button>
                                </div>
                            </div>
                        </div>`;
                    }
                };

                const renderGroupedTasks = (taskArray, prefix) => {
                    if (taskArray.length === 0) return "<p style='color:#999; font-size:13px;'>No tasks.</p>";
                    let groupedHtml = "";
                    let orderGroups = {};
                    let manualTasks = [];

                    taskArray.forEach(task => {
                        let groupKey = task.orderCode || task.orderId; 
                        if (groupKey) {
                            if (!orderGroups[groupKey]) {
                                orderGroups[groupKey] = { orderCode: task.orderCode || ("Order ID: " + task.orderId), customerName: task.customerName || "N/A", orderDescription: task.orderDescription || "Task Breakdown", tasks: [] };
                            }
                            orderGroups[groupKey].tasks.push(task);
                        } else {
                            manualTasks.push(task);
                        }
                    });

                    Object.values(orderGroups).forEach(group => {
                        let containerId = `order-tasks-${prefix}-${(group.orderCode || "").toString().replace(/[^a-zA-Z0-9]/g, '')}`;
                        groupedHtml += `
                        <div style="margin-bottom: 15px; border: 1px solid #c7d2fe; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                            <div style="background: #e0e7ff; padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" 
                                 onclick="document.getElementById('${containerId}').style.display = document.getElementById('${containerId}').style.display === 'none' ? 'block' : 'none'" onmouseover="this.style.background='#c7d2fe'" onmouseout="this.style.background='#e0e7ff'">
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
                            <div id="${containerId}" style="display: block; padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                                ${group.tasks.map(t => renderTaskHTML(t)).join('')}
                            </div>
                        </div>`;
                    });

                    if (manualTasks.length > 0) {
                        groupedHtml += `<div style="margin-bottom: 15px;">${manualTasks.map(t => renderTaskHTML(t)).join('')}</div>`;
                    }
                    return groupedHtml;
                };

                let assignTasks = tasks.filter(t => !t.assignedEmployees || t.assignedEmployees.trim() === "");
                let execTasks = tasks.filter(t => t.assignedEmployees && t.assignedEmployees.trim() !== "");

                if (document.getElementById("taskListAssignment")) {
                    document.getElementById("taskListAssignment").innerHTML = renderGroupedTasks(assignTasks, 'assign');
                }
                if (document.getElementById("taskListExecution")) {
                    document.getElementById("taskListExecution").innerHTML = renderGroupedTasks(execTasks, 'exec');
                }
                // Fallback for older layout
                if (document.getElementById("taskList")) {
                    document.getElementById("taskList").innerHTML = renderGroupedTasks(tasks, 'all');
                }
            }

        });

}


let selectedEmployeesForTask = new Set(); // Global selection state
let currentSuggestions = []; // Cache to allow re-rendering

function selectTask(taskId, skill, date) {
    selectedTaskId = taskId;
    selectedEmployeesForTask.clear();
    updateSelectionUI();

    const hint = document.getElementById("selectionHint");
    if (hint) {
        hint.innerText = "Suggesting employees for current task...";
        hint.style.display = "none";
    }
    
    // Highlight in list
    loadTasks();

    const targetDate = date || document.getElementById("taskFilterDate").value || new Date().toISOString().split('T')[0];
    fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(skill)}&date=${targetDate}`))
        .then(res => res.json())
        .then(data => {
            currentSuggestions = data;
            renderSuggestedEmployees();
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

        let filtered = [...currentSuggestions];
        const sessionFilter = document.getElementById("taskSessionFilter") ? document.getElementById("taskSessionFilter").value : "";
        if (sessionFilter) {
            filtered = filtered.filter(e => e.session === sessionFilter);
        }

        if (filtered.length === 0) {
            document.getElementById("suggestedEmployees").innerHTML = `<p style="padding:20px; color:#ef4444; text-align:center;">No employees match the selected session shift.</p>`;
            return;
        }

        // Sort: selected ones first
        let sorted = filtered.sort((a, b) => {
            let aSel = selectedEmployeesForTask.has(a.username);
            let bSel = selectedEmployeesForTask.has(b.username);
            return bSel - aSel;
        });

        sorted.forEach(emp => {
            let isSelected = selectedEmployeesForTask.has(emp.username);
            let initial = emp.username.charAt(0).toUpperCase();
            
            const status = emp.status || "Available";
            const statusClass = "status-" + status.toLowerCase();
            const skillBadge = emp.matchType === 'Primary' 
                ? `<span style="background:var(--primary); color:white; padding:2px 6px; border-radius:4px; font-size:10px;">Primary Match</span>`
                : (emp.matchType === 'Secondary' ? `<span style="background:#f59e0b; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">Secondary Match</span>` : "");

            html += `
                <div class="emp-card ${isSelected ? 'selected' : ''}" 
                     onclick="toggleEmployeeSelection('${emp.username}')"
                     style="display: flex; flex-direction: column; align-items: stretch; padding: 15px; border-bottom: 1px solid #f1f5f9; position: relative; cursor: pointer; ${isSelected ? 'border-color: #6366f1; background: #f5f7ff;' : ''}">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="emp-avatar" style="width: 30px; height: 30px; ${isSelected ? 'background: #6366f1;' : ''}">${initial}</div>
                            <span style="font-weight:700; color:#1e293b; font-size: 15px;">${emp.username}</span>
                            ${skillBadge}
                        </div>
                        <span style="font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 12px; background: #e2e8f0; color: #475569;">
                            Session: ${emp.session || 'None'}
                        </span>
                    </div>

                    <!-- SKILLS HIDDEN AS REQUESTED -->

                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div><strong>Today Tasks:</strong> ${emp.todayTasks || 0}</div>
                        <div><strong>Pending:</strong> ${emp.yesterdayPending || 0}</div>
                        <div><strong>Status:</strong> <span style="font-weight:700; ${status === 'Available' ? 'color:#10b981;' : (status === 'Busy' ? 'color:#f59e0b;' : 'color:#ef4444;')}">${status}</span></div>
                    </div>

                    <div style="position: absolute; right: 15px; top: 15px; color:var(--primary); font-weight:800; font-size: 20px;">
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

    fetch(api(`/api/assignEmployees?taskId=${selectedTaskId}&employees=${encodeURIComponent(employees)}`), {
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

    fetch(api(`/api/unassignEmployee?taskId=${taskId}&employee=${encodeURIComponent(employeeName)}`), {
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

    fetch(api(`/api/deleteTask?taskId=${taskId}`), {
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

function markTaskCompletedInline(event, taskId) {
    event.stopPropagation(); // Prevent row selection
    if (!confirm("Confirm completing this task?")) {
        return;
    }
    fetch(api(`/api/updateTaskStatus?taskId=${taskId}&status=Completed`), {
        method: "POST"
    })
    .then(res => res.json())
    .then(() => {
        loadTasks();
    })
    .catch(err => {
        console.error("Error completing task:", err);
        alert("Server error completing task.");
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
    
    fetch(api(`/api/tasksByDate?date=${selectedDate}`))
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
            fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(task.requiredSkill)}&date=${task.date}`))
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
                    <span style="font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 12px; background: #e2e8f0; color: #475569;">
                        Session: ${emp.session || 'None'}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; font-size: 11px;">
                    <div><strong style="color:#64748b;">Primary:</strong> ${emp.primarySkills || 'None'}</div>
                    <div><strong style="color:#64748b;">Secondary:</strong> ${emp.secondarySkills || 'None'}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 5px; font-size: 11px; background: #f8fafc; padding: 8px; border-radius: 6px;">
                    <div><strong style="color:#64748b;">Today:</strong> ${emp.todayTasks} tasks</div>
                    <div><strong style="color:#64748b;">Status:</strong> <span style="font-weight:700; ${status === 'Available' ? 'color:#10b981;' : (status === 'Busy' ? 'color:#f59e0b;' : 'color:#ef4444;')}">${status}</span></div>
                    <div><strong style="color:#64748b;">Pending:</strong> ${emp.yesterdayPending}</div>
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
    fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(currentModalTask.requiredSkill)}&date=${currentModalTask.date}`))
        .then(res => res.json())
        .then(data => renderModalSuggestions(data, currentModalTask));
}

function confirmModalAssignment() {
    if (modalSelectedEmployees.size === 0) return;
    const employees = Array.from(modalSelectedEmployees).join(", ");

    fetch(api(`/api/assignEmployees?taskId=${selectedTaskId}&employees=${encodeURIComponent(employees)}`), {
        method: "POST"
    })
        .then(res => res.json())
        .then(updatedTask => {
            currentModalTask = updatedTask;
            modalSelectedEmployees.clear();
            renderModalAssigned(updatedTask);
            // Refresh suggestions
            fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(updatedTask.requiredSkill)}&date=${updatedTask.date}`))
                .then(res => res.json())
                .then(data => renderModalSuggestions(data, updatedTask));
        });
}

function unassignFromModal(employeeName) {
    if (!confirm(`Remove ${employeeName} from this task?`)) return;

    fetch(api(`/api/unassignEmployee?taskId=${selectedTaskId}&employee=${encodeURIComponent(employeeName)}`), {
        method: "POST"
    })
        .then(res => res.json())
        .then(updatedTask => {
            currentModalTask = updatedTask;
            renderModalAssigned(updatedTask);
            // Refresh suggestions
            fetch(api(`/api/employeesBySkill?skill=${encodeURIComponent(updatedTask.requiredSkill)}&date=${updatedTask.date}`))
                .then(res => res.json())
                .then(data => renderModalSuggestions(data, updatedTask));
        });
}

function markTaskCompletedFromModal() {
    if (!currentModalTask) return;

    fetch(api(`/api/updateTaskStatus?taskId=${selectedTaskId}&status=Completed`), {
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

    fetch(api(`/api/deleteTask?taskId=${selectedTaskId}`), {
        method: "POST"
    })
        .then(() => {
            closeTaskModal();
        });
}


// ======================
// EMPLOYEE DASHBOARD
// ======================
let currentUpdatingTaskId = null;

function updateMainFocus(type) {
    if (!currentUpdatingTaskId) return;
    // Employees cannot mark tasks as Completed — only supervisors can
    const focusName = document.getElementById("focusTaskName")?.innerText || '';
    openUpdateModal(currentUpdatingTaskId, focusName);
}

function switchEmpTab(tabId, element) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    if (element) element.classList.add('active');
    
    if (tabId === 'calendar') renderEmpCalendar();
    if (tabId === 'assignments') loadEmployeeTasks();
}

function loadEmployeeStats() {
    let username = localStorage.getItem("username") || localStorage.getItem("user");
    if (!username) return;

    fetch(api("/api/employeeProfile?username=" + encodeURIComponent(username)), { cache: "no-store" })
        .then(res => res.json())
        .then(profile => {
            if (!profile) return;

            // Header & Profile Tab
            const deptStr = profile.department || 'Operations';
            const empIdStr = profile.employeeId || 'Staff';
            
            if (document.getElementById("empDeptSummary")) 
                document.getElementById("empDeptSummary").innerText = `${deptStr} • ${empIdStr}`;
            
            if (document.getElementById("userInitials"))
                document.getElementById("userInitials").innerText = username.charAt(0).toUpperCase();

            // Profile Tab Population
            if (document.getElementById("profileName")) document.getElementById("profileName").innerText = username;
            if (document.getElementById("profileAvatarLarge")) document.getElementById("profileAvatarLarge").innerText = username.charAt(0).toUpperCase();
            if (document.getElementById("displayEmpId")) document.getElementById("displayEmpId").innerText = empIdStr;
            if (document.getElementById("displayDept")) document.getElementById("displayDept").innerText = deptStr;
            if (document.getElementById("profileRoleLabel")) document.getElementById("profileRoleLabel").innerText = profile.role === 'employee' ? 'Production Staff' : profile.role;

            // Set Skill Tags
            const skillContainer = document.getElementById("userSkills");
            const displaySkills = document.getElementById("displaySkills");
            if (profile.primarySkills) {
                let skillsHtml = profile.primarySkills.split(",").map(s => `<span class="skill-tag">${s.trim()}</span>`).join("");
                if (profile.secondarySkills) {
                    skillsHtml += profile.secondarySkills.split(",").map(s => `<span class="skill-tag secondary">${s.trim()}</span>`).join("");
                }
                if (skillContainer) skillContainer.innerHTML = skillsHtml;
                if (displaySkills) displaySkills.innerHTML = skillsHtml;
            }
        })
        .catch(err => {
            console.error("Profile fetch error:", err);
            const summary = document.getElementById("empDeptSummary");
            if (summary) summary.innerText = "Welcome back to your productivity hub";
        });

    // Fetch attendance stats
    fetch(api("/api/employeeStats?employeeName=" + encodeURIComponent(username)), { cache: "no-store" })
        .then(res => res.json())
        .then(stats => {
            let present = stats.present || 0;
            let absent = stats.absent || 0;
            let total = present + absent;
            let pct = total > 0 ? Math.round((present / total) * 100) : 0;

            document.getElementById("presentDays").innerText = present;
            document.getElementById("absentDays").innerText = absent;
            document.getElementById("attendanceRate").innerText = pct + "%";

            // AI Insight for attendance
            const attInsight = document.getElementById("attInsight");
            if (attInsight) {
                if (pct > 90) attInsight.innerText = "Exceptional consistency! Your attendance rate is 15% higher than the team average.";
                else if (pct > 70) attInsight.innerText = "Steady attendance pattern. Maintaining this level ensures project stability.";
                else attInsight.innerText = "Recent irregularities detected. Improving attendance will positively impact your performance metrics.";
            }
        });
}

function loadEmployeeTasks() {
    let username = localStorage.getItem("username") || localStorage.getItem("user");
    if (!username) return;

    fetch(api("/api/tasksByEmployee?employeeName=" + encodeURIComponent(username)), { cache: "no-store" })
        .then(res => res.json())
        .then(tasks => {
            document.getElementById("totalTasks").innerText = tasks.length;

            // 1. Identify Focus Task
            const activeTasks = tasks.filter(t => t.status !== 'Completed');
            activeTasks.sort((a, b) => {
                const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
            });

            if (activeTasks.length > 0) {
                const focus = activeTasks[0];
                currentUpdatingTaskId = focus.id;
                document.getElementById("focusTaskName").innerText = focus.taskName;
                document.getElementById("focusDeadline").innerText = focus.deadline || 'Today';
                document.getElementById("focusSection").innerText = focus.section || 'General';
                
                let progress = focus.status === 'In Progress' ? 60 : (focus.status === 'Started' ? 20 : 0);
                document.getElementById("focusProgressPct").innerText = progress + "%";
                if(document.getElementById("focusProgressBar")) document.getElementById("focusProgressBar").style.width = progress + "%";
                
                if (focus.status === 'Started' || focus.status === 'In Progress') {
                    if (document.getElementById("focusUpdateBtn"))
                        document.getElementById("focusUpdateBtn").innerHTML = '<i class="fas fa-sync"></i> Continue';
                }
            } else {
                document.getElementById("focusTaskName").innerText = "All Caught Up! 🎉";
                const focusHeader = document.getElementById("heroFocusSection");
                if (focusHeader) focusHeader.style.display = "none";
            }

            // 2. Render Pipeline Columns
            const listNew = document.getElementById("taskListNew");
            const listOngoing = document.getElementById("taskListOngoing");
            const listCompleted = document.getElementById("taskListCompleted");

            if (listNew && listOngoing && listCompleted) {
                listNew.innerHTML = "";
                listOngoing.innerHTML = "";
                listCompleted.innerHTML = "";

                tasks.forEach(t => {
                    const card = renderPipelineCard(t);
                    if (t.status === 'Pending') listNew.innerHTML += card;
                    else if (t.status === 'Completed') listCompleted.innerHTML += card;
                    else listOngoing.innerHTML += card;
                });
            }

            // 3. Update Charts
            let statusCounts = { "Pending": 0, "Started": 0, "In Progress": 0, "Completed": 0 };
            tasks.forEach(t => { if (statusCounts.hasOwnProperty(t.status)) statusCounts[t.status]++; });

            // Calculate REAL Weekly Performance
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const weeklyData = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0 };
            
            const todayDate = new Date();
            const currentDay = todayDate.getDay();
            const diff = todayDate.getDate() - currentDay + (currentDay == 0 ? -6 : 1); // Get Monday
            const monday = new Date(todayDate.setDate(diff));
            monday.setHours(0, 0, 0, 0);

            let tasksDoneThisWeek = 0;
            tasks.forEach(t => {
                if (t.status === 'Completed' && t.completedDate) {
                    const cDate = new Date(t.completedDate);
                    if (cDate >= monday) {
                        tasksDoneThisWeek++;
                        const dayName = dayNames[cDate.getDay()];
                        if (weeklyData.hasOwnProperty(dayName)) {
                            weeklyData[dayName]++;
                        }
                    }
                }
            });

            // Donut Chart
            const donutCtx = document.getElementById("empTaskStatusChart")?.getContext("2d");
            if (donutCtx) {
                new Chart(donutCtx, {
                    type: "doughnut",
                    data: {
                        labels: ["Pending", "Active", "Done"],
                        datasets: [{
                            data: [statusCounts.Pending, statusCounts.Started + statusCounts["In Progress"], statusCounts.Completed],
                            backgroundColor: ["#f59e0b", "#6366f1", "#10b981"],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, cutout: "75%", plugins: { legend: { display: false } } }
                });
            }

            // Weekly Bar Chart (Performance)
            const barCtx = document.getElementById("weeklyPerformanceChart")?.getContext("2d");
            if (barCtx) {
                new Chart(barCtx, {
                    type: "bar",
                    data: {
                        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                        datasets: [{
                            label: "Tasks Done",
                            data: [weeklyData.Mon, weeklyData.Tue, weeklyData.Wed, weeklyData.Thu, weeklyData.Fri],
                            backgroundColor: "#6366f1",
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { display: false, beginAtZero: true, ticks: { stepSize: 1 } },
                            x: { grid: { display: false }, ticks: { font: { family: "Outfit", weight: "700" } } }
                        }
                    }
                });
            }

            // 4. Achievement & Performance Score
            const achievementMsg = document.getElementById("achievementText");
            if (achievementMsg) achievementMsg.innerText = `🔥 ${tasksDoneThisWeek} Tasks completed this week!`;

            // Score Calculation
            let totalT = tasks.length || 1;
            let compScore = Math.round((statusCounts.Completed / totalT) * 100);
            
            // Attendance Score (Fetching from global if available, else 75 mock)
            let attScore = 75;
            const attVal = document.getElementById("attendanceRate")?.innerText;
            if (attVal) attScore = parseInt(attVal) || 75;

            // Efficiency (Ratio of completed tasks that weren't overdue)
            let effScore = 80;
            const completed = tasks.filter(t => t.status === 'Completed');
            if (completed.length > 0) {
                const onTime = completed.filter(t => {
                    if (!t.deadline || !t.completedDate) return true;
                    return new Date(t.completedDate) <= new Date(t.deadline);
                }).length;
                effScore = Math.round((onTime / completed.length) * 100);
            }

            const totalScore = Math.round((compScore + attScore + effScore) / 3);
            
            // Update UI Score
            if (document.getElementById("perfTotalScore")) document.getElementById("perfTotalScore").innerText = `${totalScore}/100`;
            if (document.getElementById("scoreCompletion")) document.getElementById("scoreCompletion").innerText = `${compScore}%`;
            if (document.getElementById("scoreAttendance")) document.getElementById("scoreAttendance").innerText = `${attScore}%`;
            if (document.getElementById("scoreEfficiency")) document.getElementById("scoreEfficiency").innerText = `${effScore}%`;
            
            if (document.getElementById("barCompletion")) document.getElementById("barCompletion").style.width = `${compScore}%`;
            if (document.getElementById("barAttendance")) document.getElementById("barAttendance").style.width = `${attScore}%`;
            if (document.getElementById("barEfficiency")) document.getElementById("barEfficiency").style.width = `${effScore}%`;

            // 5. Smart Alerts
            const alertsList = document.getElementById("smartAlertsList");
            if (alertsList) {
                let alerts = [];
                
                // Alert 1: Deadline coming up
                const urgent = tasks.filter(t => t.status !== 'Completed' && t.deadline && new Date(t.deadline) <= new Date());
                if (urgent.length > 0) alerts.push({ icon: 'fa-exclamation-triangle', title: 'Task Overdue/Today', text: `${urgent[0].taskName} needs attention.` });

                // Alert 2: New Tasks
                if (statusCounts.Pending > 0) alerts.push({ icon: 'fa-box-open', title: 'New Tasks', text: `You have ${statusCounts.Pending} unstarted assignments.` });

                // Alert 3: Attendance
                if (attScore < 80) alerts.push({ icon: 'fa-chart-line', title: 'Attendance Alert', text: 'Average below 80%. Check your calendar.' });

                if (alerts.length > 0) {
                    alertsList.innerHTML = alerts.map(a => `
                        <div class="alert-item">
                            <i class="fas ${a.icon}"></i>
                            <div><h6>${a.title}</h6><p>${a.text}</p></div>
                        </div>
                    `).join("");
                    
                    const badge = document.getElementById("notifBadge");
                    if (badge) {
                        badge.innerText = alerts.length;
                        badge.style.display = "block";
                    }
                }
            }

            // 6. Deadlines Sidebar
            const deadlinesList = document.getElementById("upcomingDeadlinesList");
            if (deadlinesList) {
                const upcoming = tasks.filter(t => t.status !== 'Completed' && t.deadline).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3);
                deadlinesList.innerHTML = upcoming.map(u => {
                    const dateObj = new Date(u.deadline);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('default', { month: 'short' });
                    return `
                    <div class="deadline-item">
                        <div class="date-box"><span>${day}</span><span>${month}</span></div>
                        <div class="deadline-info-small"><h5>${u.taskName.substring(0,20)}...</h5><p>${u.section}</p></div>
                    </div>`;
                }).join("");
            }
        });
}

function renderPipelineCard(t) {
    const isNew = t.status === 'Pending';
    const isOngoing = t.status === 'Started' || t.status === 'In Progress';
    const isWaiting = t.status === 'Waiting Verification';
    const accent = t.status === 'Completed' ? 'var(--success)' : (t.status === 'Pending' ? 'var(--warning)' : 'var(--primary)');
    
    return `
    <div class="pipeline-card" style="border-top: 3px solid ${accent}">
        <h5 style="margin: 0 0 5px; font-size: 14px;">${t.taskName}</h5>
        <div class="meta" style="margin-bottom: 10px;">
            <span><i class="far fa-clock"></i> ${t.deadline || 'Today'}</span>
            <span><i class="fas fa-layer-group"></i> ${t.section || 'General'}</span>
        </div>
        ${isNew ? `
            <button class="btn-mini start" onclick="updateTaskStatusFromDashboard('${t.id}', 'Started')">
                <i class="fas fa-play"></i> Start Working
            </button>
        ` : ''}
        ${isOngoing ? `
            <button class="btn-mini done" onclick="updateTaskStatusFromDashboard('${t.id}', 'Waiting Verification')">
                <i class="fas fa-paper-plane"></i> Submit for Review
            </button>
        ` : ''}
        ${isWaiting ? `
            <div style="margin-top: 5px; color: var(--primary); font-size: 11px; font-weight: 800; background: var(--primary-light); padding: 5px; border-radius: 6px; text-align: center;">
                <i class="fas fa-hourglass-half"></i> Waiting Verification
            </div>
        ` : ''}
        ${t.status === 'Completed' ? `
            <div style="margin-top: 5px; color: var(--success); font-size: 11px; font-weight: 800; background: var(--success-light); padding: 5px; border-radius: 6px; text-align: center;">
                <i class="fas fa-check-circle"></i> Completed & Verified
            </div>
        ` : ''}
    </div>`;
}

function openUpdateModal(taskId, taskName) {
    currentUpdatingTaskId = taskId;
    document.getElementById("modalTaskName").innerText = taskName;
    document.getElementById("statusModal").classList.add("active");
}

function updateTaskStatusFromDashboard(taskId, status) {
    fetch(api(`/api/updateTaskStatus?taskId=${taskId}&status=${encodeURIComponent(status)}`), {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {
            // Refresh stats and tasks on the current dashboard
            if (typeof loadEmployeeStats === 'function' && document.getElementById('presentDays')) loadEmployeeStats();
            if (typeof loadEmployeeTasks === 'function' && document.getElementById('totalTasks')) loadEmployeeTasks();
            
            // If on supervisor management page
            if (typeof loadTasks === 'function' && document.getElementById('taskList')) loadTasks();
            if (typeof loadSupervisorDashboard === 'function' && document.getElementById('totalEmployees')) loadSupervisorDashboard();
        })
        .catch(err => {
            console.error("Error updating status:", err);
            alert("Error updating task status.");
        });
}

let empCalendarDate = new Date();

function renderEmpCalendar() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    
    // Add navigation listeners once
    document.getElementById("prevMonth")?.addEventListener("click", () => {
        empCalendarDate.setMonth(empCalendarDate.getMonth() - 1);
        renderEmpCalendar();
    }, { once: true });
    
    document.getElementById("nextMonth")?.addEventListener("click", () => {
        empCalendarDate.setMonth(empCalendarDate.getMonth() + 1);
        renderEmpCalendar();
    }, { once: true });

    const month = empCalendarDate.getMonth();
    const year = empCalendarDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const display = document.getElementById("currentMonthDisplay");
    if (display) display.innerText = `${monthNames[month]} ${year}`;
        
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    grid.innerHTML = "";
    
    // Previous month buffering (empty cells)
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="calendar-day-box empty"></div>`;
    }
    
    // Days Rendering
    const username = localStorage.getItem("username") || localStorage.getItem("user");
    fetch(api(`/api/tasksByEmployee?employeeName=${username}`))
        .then(res => res.json())
        .then(tasks => {
            const todayNow = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                const day = i;
                const isToday = todayNow.getDate() === i && todayNow.getMonth() === month && todayNow.getFullYear() === year;
                const mStr = (month + 1).toString().padStart(2, '0');
                const dStr = day.toString().padStart(2, '0');
                const dateKey = `${year}-${mStr}-${dStr}`;
                
                const dayTasks = tasks.filter(t => t.deadline === dateKey);
                const taskPills = dayTasks.map(t => `<div class="cal-task-pill ${t.status}" title="${t.taskName}">${t.taskName}</div>`).join("");
                
                grid.innerHTML += `
                    <div class="calendar-day-box ${isToday ? 'today' : ''}">
                        <span class="day-num">${day}</span>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            ${taskPills}
                        </div>
                    </div>
                `;
            }
        });
}

function updateEmpPassword() {
    const pass = document.getElementById("newEmpPassword").value;
    if (!pass || pass.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    const username = localStorage.getItem("username");
    alert("Password updated successfully (Demo)!");
    document.getElementById("newEmpPassword").value = "";
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
    fetch(api("/api/employees"), { cache: "no-store" })
        .then(res => res.json())
        .then(employees => {
            document.getElementById("totalEmployees").innerText = employees.length;
        })
        .catch(() => { });

    // Fetch main analytics
    fetch(api("/api/managerAnalytics"), { cache: "no-store" })
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

            // Update Progress Bars
            let pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
            if(document.getElementById("progCompleted")) {
                setTimeout(() => document.getElementById("progCompleted").style.width = rate + "%", 100);
            }
            if(document.getElementById("progPending")) {
                setTimeout(() => document.getElementById("progPending").style.width = pendingRate + "%", 100);
            }
            if(document.getElementById("progRate")) {
                setTimeout(() => document.getElementById("progRate").style.width = rate + "%", 100);
            }

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
                    },
                    onClick: function(evt, elements) {
                        if (elements && elements.length > 0) {
                            const index = elements[0].index;
                            const label = this.data.labels[index];
                            const searchInput = document.getElementById("mgrTaskSearch");
                            if (searchInput) {
                                searchInput.value = label;
                                if(typeof renderMgrTaskTable === 'function') {
                                    renderMgrTaskTable();
                                }
                            }
                        }
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

            // (Skills chart removed per design requirement)

            // Fetch tasks for Section Performance Chart
            fetch(api("/api/tasks"), { cache: "no-store" })
                .then(res => res.json())
                .then(tasks => {
                    let sectionVolume = {};
                    tasks.forEach(t => {
                        let sec = t.section || "Unassigned Section";
                        sectionVolume[sec] = (sectionVolume[sec] || 0) + 1;
                    });
                    
                    let secLabels = Object.keys(sectionVolume);
                    let secValues = Object.values(sectionVolume);
                    
                    let secCanvas = document.getElementById("sectionPerformanceChart");
                    if (secCanvas) {
                        new Chart(secCanvas.getContext("2d"), {
                            type: "bar",
                            data: {
                                labels: secLabels,
                                datasets: [{
                                    label: "Tasks Volume",
                                    data: secValues,
                                    backgroundColor: "rgba(99, 102, 241, 0.8)",
                                    borderColor: "rgba(99, 102, 241, 1)",
                                    borderWidth: 1,
                                    borderRadius: 6
                                }]
                            },
                            options: {
                                responsive: true,
                                indexAxis: 'y', // Makes it a horizontal bar chart
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { beginAtZero: true, ticks: { stepSize: 1 } }
                                }
                            }
                        });
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

    fetch(api(`/api/tasksByDate?date=${date}`))
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

    fetch(api(`/api/attendanceSummaryByMonth?year=${year}&month=${month}`))
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

let allTasksCache = []; // Shared cache for redesigned dashboard tasks
let taskStatusChartInstance = null;
let sectionOutputChartInstance = null;

function loadSupervisorDashboard() {
    console.log("Initializing Real-Time Supervisor Hub...");
    
    // Update timestamp
    const nowTimestamp = new Date();
    const timeStr = nowTimestamp.toLocaleTimeString('en-US', { hour12: false });
    if (document.getElementById("lastUpdatedTime")) {
        document.getElementById("lastUpdatedTime").innerHTML = `<i class="fas fa-circle" style="font-size: 8px; color: var(--success); margin-right: 5px;"></i> Live updated at ${timeStr}`;
    }

    loadDynamicSectionsForTasks();
    loadAllDynamicSectionMappings();
    
    // 1. Load Team Directory
    loadEmployeeDirectory("supEmployeeDirectory");

    // 2. Fetch Summary Statistics
    fetch(api("/api/dashboard/summary"), { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            if (document.getElementById("presentCount")) document.getElementById("presentCount").innerText = data.activeStaff;
            if (document.getElementById("absentCount")) document.getElementById("absentCount").innerText = data.absentStaff;
            
            if (document.getElementById("pendingTasks")) document.getElementById("pendingTasks").innerText = data.totalPendingTasks;
            if (document.getElementById("sectionHealthPct")) document.getElementById("sectionHealthPct").innerText = data.shiftOutput + "%";
            
            // Header Mini Progress
            if (document.getElementById("headerProgressVal")) document.getElementById("headerProgressVal").innerText = data.shiftOutput + "%";
            if (document.getElementById("headerProgressFill")) document.getElementById("headerProgressFill").style.width = data.shiftOutput + "%";
        }).catch(e => console.error("Summary API failed", e));

    // 3. Fetch Today's Control Panel
    fetch(api("/api/dashboard/today"), { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            if (document.getElementById("cpTotalTasks")) document.getElementById("cpTotalTasks").innerText = data.totalTasks;
            if (document.getElementById("cpInProgress")) document.getElementById("cpInProgress").innerText = data.inProgress;
            
            const delayedVal = document.getElementById("cpDelayed");
            if (delayedVal) delayedVal.innerText = data.delayed;

            const delayedRow = document.getElementById("cpDelayedRow");
            const delayedIcon = document.getElementById("cpDelayedIcon");
            if (data.delayed > 0) {
                if (delayedRow) {
                    delayedRow.style.background = "#fff1f2";
                    delayedRow.style.borderColor = "#fda4af";
                    delayedRow.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.1)";
                }
                if (delayedIcon) delayedIcon.style.display = "inline-block";
            } else {
                if (delayedRow) {
                    delayedRow.style.background = "#f8fafc";
                    delayedRow.style.borderColor = "transparent";
                    delayedRow.style.boxShadow = "none";
                }
                if (delayedIcon) delayedIcon.style.display = "none";
            }

            if (document.getElementById("cpActiveStaff")) document.getElementById("cpActiveStaff").innerText = `${data.activeStaffCount}/${data.totalStaffCount}`;
        }).catch(e => console.error("Today API failed", e));

    // 4. Fetch Team Performance
    fetch(api("/api/dashboard/team-performance"), { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            if (document.getElementById("teamPerfTotal")) {
                const total = Math.round((data.completionRate + data.attendanceRate + data.efficiencyRate) / 3);
                document.getElementById("teamPerfTotal").innerText = `${total}/100`;
            }
            if (document.getElementById("teamScoreComp")) document.getElementById("teamScoreComp").innerText = `${data.completionRate}%`;
            if (document.getElementById("teamScoreAtt")) document.getElementById("teamScoreAtt").innerText = `${data.attendanceRate}%`;
            if (document.getElementById("teamScoreEff")) document.getElementById("teamScoreEff").innerText = `${data.efficiencyRate}%`;

            if (document.getElementById("teamBarComp")) document.getElementById("teamBarComp").style.width = `${data.completionRate}%`;
            if (document.getElementById("teamBarAtt")) document.getElementById("teamBarAtt").style.width = `${data.attendanceRate}%`;
            if (document.getElementById("teamBarEff")) document.getElementById("teamBarEff").style.width = `${data.efficiencyRate}%`;
        }).catch(e => console.error("Performance API failed", e));

    // 5. Fetch Alerts
    fetch(api("/api/dashboard/alerts"), { cache: "no-store" })
        .then(res => res.json())
        .then(alerts => {
            const heroSection = document.getElementById("heroAlertSystem");
            const criticalList = document.getElementById("criticalAlertsList");
            if (alerts && alerts.length > 0) {
                if (heroSection) heroSection.style.display = "block";
                if (criticalList) {
                    criticalList.innerHTML = alerts.map(a => `
                        <div class="critical-item" style="border-bottom: 1px solid #f1f5f9; padding: 15px; background: white; transition: all 0.3s ease; display: flex; align-items: center; gap: 15px;">
                            <div style="flex: 1;">
                                <h6 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b;">${a.title}</h6>
                                <p style="margin: 3px 0 0; font-size: 13px; color: #64748b; font-weight: 600;">Task: ${a.text}</p>
                            </div>
                            <span style="background: ${a.color}15; color: ${a.color}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">Urgent</span>
                        </div>
                    `).join("");
                }
            } else {
                if (heroSection) heroSection.style.display = "none";
            }
        }).catch(e => console.error("Alerts API failed", e));

    // 6. Section Performance & Audit
    fetch(api("/api/sections/performance"))
        .then(res => res.json())
        .then(sections => { 
            renderSectionOutputChart(sections); 
            renderSectionAuditTable(sections);
        })
        .catch(e => console.error("Sections API failed", e));

    // 7. Load Tasks Table
    // 7. Load Tasks Table
    loadAllTasksForSupervisor();

    // 8. Administrative Init
    startSupervisorOrderPolling();
    setTimeout(populateSectionFilters, 1000); 
    const d = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (document.getElementById("currentDateDisplay")) {
        document.getElementById("currentDateDisplay").innerText = d.toLocaleDateString('en-US', options);
    }
}

// Global variable for dashboard interval
if (window.dashboardRefreshInterval) clearInterval(window.dashboardRefreshInterval);
window.dashboardRefreshInterval = setInterval(loadSupervisorDashboard, 15000);

function loadAllTasksForSupervisor() {
    fetch(api("/api/tasks"), { cache: "no-store" })
        .then(res => res.json())
        .then(tasks => {
            allTasksCache = tasks;
            renderRedesignedTasks(tasks);
            updateTaskStatusChart(tasks);
            renderAssignmentQueue(tasks);
        }).catch(err => console.error("Task load failed", err));
}

function renderAssignmentQueue(tasks) {
    const queueList = document.getElementById("assignmentQueueList");
    if (!queueList) return;

    const unassigned = tasks.filter(t => t.status !== 'Completed' && (!t.assignedEmployees || t.assignedEmployees.trim() === ""));

    if (unassigned.length === 0) {
        queueList.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #10b981; font-size: 13px;">
                <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p style="font-weight: 700;">All tasks assigned!</p>
            </div>
        `;
        return;
    }

    queueList.innerHTML = unassigned.map(t => `
        <div style="padding: 12px; background: #fef2f2; border-radius: 12px; border-left: 4px solid var(--danger); display: flex; justify-content: space-between; align-items: center;">
            <div style="overflow: hidden;">
                <h5 style="margin: 0; font-size: 13px; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.taskName}</h5>
                <p style="margin: 2px 0 0; font-size: 11px; font-weight: 600; color: #ef4444; opacity: 0.8;">${t.section}</p>
            </div>
            <button onclick="goTaskManagement()" style="background: white; border: 1px solid var(--danger); color: var(--danger); padding: 5px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='var(--danger)'; this.style.color='white'">
                Assign
            </button>
        </div>
    `).join("");
}

function renderSectionAuditTable(sections) {
    const body = document.getElementById("sectionAuditBody");
    if (!body || !sections) return;

    body.innerHTML = sections.map(s => {
        const delayedColor = s.delayed > 0 ? '#ef4444' : '#64748b';
        return `
            <tr style="background: #f8fafc; border-radius: 10px; transition: all 0.2s;">
                <td style="padding: 12px 10px; font-size: 13px; font-weight: 700; color: #1e293b; border-radius: 10px 0 0 10px;">${s.section}</td>
                <td style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 700; color: #475569;">${s.total}</td>
                <td style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 700; color: #10b981;">${s.completed}</td>
                <td style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 700; color: #f59e0b;">${s.pending}</td>
                <td style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 800; color: ${delayedColor}; border-radius: 0 10px 10px 0;">
                    ${s.delayed > 0 ? `<span style="background: #fee2e2; padding: 4px 8px; border-radius: 8px;"><i class="fas fa-exclamation-triangle"></i> ${s.delayed}</span>` : '0'}
                </td>
            </tr>
        `;
    }).join("");
}

function updateTaskStatusChart(tasks) {
    const counts = {
        Completed: tasks.filter(t => t.status === 'Completed').length,
        'In Progress': tasks.filter(t => t.status === 'Started' || t.status === 'In Progress' || t.status === 'Waiting Verification').length,
        Pending: tasks.filter(t => t.status === 'Pending').length
    };

    const renderChart = (id, type, cutout) => {
        const ctx = document.getElementById(id)?.getContext("2d");
        if (!ctx) return;

        if (window[id + 'Obj']) window[id + 'Obj'].destroy();

        window[id + 'Obj'] = new Chart(ctx, {
            type: type,
            data: {
                labels: ['Completed', 'Active', 'Pending'],
                datasets: [{
                    data: [counts.Completed, counts['In Progress'], counts.Pending],
                    backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: cutout,
                plugins: { legend: { display: type === 'pie' || type === 'doughnut', position: 'bottom' } },
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const labels = ['Completed', 'In Progress', 'Pending'];
                        filterTasksByStatus(labels[idx]);
                    }
                }
            }
        });
    };

    renderChart('taskStatusChart', 'doughnut', '75%');
    renderChart('taskDistributionChart', 'pie', '0%');
}

function renderSectionOutputChart(sections) {
    const ctx = document.getElementById("sectionPerformanceChart")?.getContext("2d");
    if (!ctx || !sections) return;

    if (window.sectionPerfChartObj) window.sectionPerfChartObj.destroy();

    window.sectionPerfChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sections.map(s => s.section),
            datasets: [{
                label: 'Section Performance %',
                data: sections.map(s => s.output),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { font: { family: 'Outfit' } } },
                x: { ticks: { font: { family: 'Outfit' } } }
            }
        }
    });
}

function filterRedesignedTasks() {
    const search = document.getElementById("taskSearch").value.toLowerCase();
    const section = document.getElementById("sectionFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const date = document.getElementById("dateFilter").value;

    let filtered = allTasksCache.filter(t => {
        const matchesSearch = t.taskName.toLowerCase().includes(search) || (t.assignedEmployees && t.assignedEmployees.toLowerCase().includes(search));
        const matchesSection = section === "All" || t.section === section;
        const matchesPriority = priority === "All" || t.priority === priority;
        return matchesSearch && matchesSection && matchesPriority;
    });

    if (date) {
        filtered = filtered.filter(t => t.date === date || (t.deadline && t.deadline.startsWith(date)));
    }

    renderRedesignedTasks(filtered);
}

function filterTasksByStatus(status) {
    console.log("Filtering by status:", status);
    let filtered = [];
    if (status === 'All') {
        filtered = allTasksCache;
    } else if (status === 'In Progress') {
        filtered = allTasksCache.filter(t => t.status === 'Started' || t.status === 'In Progress' || t.status === 'Waiting Verification');
    } else if (status === 'Waiting Verification') {
        filtered = allTasksCache.filter(t => t.status === 'Waiting Verification');
    } else if (status === 'Pending') {
        filtered = allTasksCache.filter(t => t.status === 'Pending');
    } else if (status === 'Completed') {
        filtered = allTasksCache.filter(t => t.status === 'Completed');
    } else {
        filtered = allTasksCache.filter(t => t.status === status);
    }
    renderRedesignedTasks(filtered);
    
    // Scroll to grid
    document.getElementById("redesignedTaskGrid").scrollIntoView({ behavior: 'smooth' });
}

function loadRedesignedTasks() {
    const todayStr = new Date().toISOString().split('T')[0];
    fetch(api("/api/tasksByDate?date=" + todayStr), { cache: "no-store" })
        .then(res => res.json())
        .then(tasks => {
            allTasksCache = tasks || [];
            renderRedesignedTasks(allTasksCache);
        })
        .catch(err => console.error("Error loading tasks:", err));
}

function filterRedesignedTasks() {
    const search = document.getElementById("taskSearch").value.toLowerCase();
    const section = document.getElementById("sectionFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const date = document.getElementById("dateFilter").value;

    let filtered = allTasksCache.filter(t => {
        const matchesSearch = t.taskName.toLowerCase().includes(search) || (t.assignedEmployees && t.assignedEmployees.toLowerCase().includes(search));
        const matchesSection = section === "All" || t.section === section;
        const matchesPriority = priority === "All" || t.priority === priority;
        return matchesSearch && matchesSection && matchesPriority;
    });

    renderRedesignedTasks(filtered);

    if (date && date !== new Date().toISOString().split('T')[0]) {
        fetch(api("/api/tasksByDate?date=" + date))
            .then(res => res.json())
            .then(tasks => {
                allTasksCache = tasks || [];
                filterRedesignedTasks();
            });
    }
}

function renderRedesignedTasks(tasks) {
    const grid = document.getElementById("redesignedTaskGrid");
    if (!grid) return;

    if (tasks.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 20px;">
                            <i class="fas fa-search" style="font-size: 40px; color: #cbd5e1; margin-bottom: 20px;"></i>
                            <p style="color: #64748b; font-weight: 600;">No tasks found matching your criteria.</p>
                          </div>`;
        return;
    }

    grid.innerHTML = tasks.map(t => {
        const isWaiting = t.status === 'Waiting Verification';
        const progress = t.status === 'Completed' ? 100 : (t.status === 'In Progress' ? 60 : (t.status === 'Started' || isWaiting ? 40 : 0));
        
        let membersHtml = "";
        if (t.assignedEmployees) {
            const members = t.assignedEmployees.split(",");
            membersHtml = members.slice(0, 3).map(m => {
                const initial = m.trim().charAt(0).toUpperCase();
                return `<div class="member-avatar">${initial}</div>`;
            }).join("");
            if (members.length > 3) {
                membersHtml += `<div class="member-avatar" style="background:#f1f5f9; color:#64748b;">+${members.length - 3}</div>`;
            }
        } else {
            membersHtml = `<span style="font-size: 11px; color:#cbd5e1; font-weight:600;">Unassigned</span>`;
        }

        return `
            <div class="task-card animate-up">
                <div class="task-header">
                    <div class="task-title-box">
                        <h4>${t.taskName}</h4>
                        <p><i class="fas fa-layer-group"></i> ${t.section}</p>
                    </div>
                    <span class="priority-badge priority-${t.priority}">${t.priority}</span>
                </div>

                <div class="assigned-members">
                    ${membersHtml}
                </div>

                <div class="progress-box">
                    <div class="progress-info">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="task-footer">
                    <div class="deadline-info">
                        <i class="far fa-clock"></i>
                        <span>${t.deadline || 'Today'}</span>
                    </div>
                    ${isWaiting ? `
                        <button class="btn-view-task" style="background:var(--success); color:white;" onclick="updateTaskStatusFromDashboard('${t.id}', 'Completed')">
                            <i class="fas fa-check-circle"></i> Verify
                        </button>
                    ` : `
                        <button class="btn-view-task" onclick="openRedesignedTaskDetail(${t.id})">Details</button>
                    `}
                </div>
            </div>
        `;
    }).join("");
}

function openRedesignedTaskDetail(taskId) {
    const task = allTasksCache.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById("taskSidePanel").classList.add("active");
    document.getElementById("taskSidePanelOverlay").classList.add("active");
    document.getElementById("panelTaskName").innerText = task.taskName;

    document.getElementById("panelContent").innerHTML = `
        <div class="chart-card" style="background: var(--primary-light); border: none;">
            <div style="font-size: 11px; color: var(--primary); font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Current Status</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${task.status}</div>
        </div>

        <div>
            <h5 style="margin: 0 0 10px; font-size: 14px; font-weight: 700;">Operational Timeline</h5>
            <div style="display: flex; flex-direction: column; gap: 15px; border-left: 2px solid #f1f5f9; padding-left: 15px; margin-left: 5px;">
                <div style="position: relative;">
                    <div style="position: absolute; left: -21px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--success); border: 2px solid white;"></div>
                    <div style="font-size: 13px; font-weight: 700;">Task Created</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${task.deadline || 'Today'}</div>
                </div>
            </div>
        </div>

        <div>
            <h5 style="margin: 0 0 10px; font-size: 14px; font-weight: 700;">Assigned Team Members</h5>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                ${(task.assignedEmployees || 'None').split(',').map(m => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${m.trim().charAt(0).toUpperCase()}</div>
                        <span style="font-size: 13px; font-weight: 600;">${m.trim()}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <button onclick="deleteTask(event, ${task.id})" style="margin-top: 20px; width: 100%; padding: 12px; background: var(--danger-light); color: var(--danger); border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">Discard Task</button>
    `;
}

function closeRedesignedTaskDetail() {
    document.getElementById("taskSidePanel").classList.remove("active");
    document.getElementById("taskSidePanelOverlay").classList.remove("active");
}

function filterTasksByStatus(status) {
    document.getElementById("taskSearch").value = (status === 'All') ? '' : status;
    filterRedesignedTasks();
}

function populateSectionFilters() {
    const filter = document.getElementById("sectionFilter");
    if (!filter) return;

    fetch(api("/api/sections"))
        .then(res => res.json())
        .then(sections => {
            filter.innerHTML = '<option value="All">All Sections</option>';
            sections.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.name;
                opt.innerText = s.name;
                filter.appendChild(opt);
            });
        });
}


function openTeamDirectory() {
    document.getElementById("teamDirectoryModal").classList.add("active");
}

function closeTeamDirectoryModal(event) {
    if (event && event.target !== document.getElementById("teamDirectoryModal")) return;
    document.getElementById("teamDirectoryModal").classList.remove("active");
}

let attEmployeesCache = [];

function loadAttendanceMarkingPage() {
    const dateInput = document.getElementById("attMarkingDate");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    const date = dateInput.value;
    const body = document.getElementById("attendanceMarkingList");
    if (!body) return;

    body.innerHTML = `<tr><td colspan="5" style="padding: 40px; text-align: center; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Syncing workforce registry...</td></tr>`;

    // Fetch both employees and attendance for the date
    Promise.all([
        fetch(api("/api/employees")).then(r => r.json()),
        fetch(api(`/api/attendanceByDate?date=${date}`)).then(r => r.json())
    ]).then(([employees, attendance]) => {
        attEmployeesCache = employees;
        const attMap = {};
        attendance.forEach(a => attMap[a.employeeName] = a.status);

        body.innerHTML = employees.map(emp => {
            const status = attMap[emp.username] || "Not Marked";
            const isPresent = status === 'Present';
            const isAbsent = status === 'Absent';
            const isNotMarked = !isPresent && !isAbsent;
            
            const rowBg = isPresent ? '#f0fdf4' : (isAbsent ? '#fef2f2' : 'white');
            const initial = emp.username.charAt(0).toUpperCase();

            // Avatar Color Logic: Neutral if not marked, Status color if marked
            const avatarBg = isPresent ? 'var(--success)' : (isAbsent ? 'var(--danger)' : 'var(--primary)');

            // Exclusive Selection Styles: Solid White initially, Status Color only if active
            const presentBtnStyle = isPresent 
                ? 'background: var(--success); color: white; border: none; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);' 
                : 'background: white; color: #64748b; border: 2px solid #e2e8f0;';
            
            const absentBtnStyle = isAbsent 
                ? 'background: var(--danger); color: white; border: none; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);' 
                : 'background: white; color: #64748b; border: 2px solid #e2e8f0;';

            return `
                <tr style="background: ${rowBg}; border-bottom: 1px solid #f1f5f9; transition: all 0.2s;">
                    <td style="padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 42px; height: 42px; border-radius: 12px; background: ${avatarBg}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                ${initial}
                            </div>
                            <div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 16px;">${emp.username}</div>
                                ${!isNotMarked ? `
                                <div style="font-size: 10px; font-weight: 800; color: ${isPresent ? 'var(--success)' : 'var(--danger)'}; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas ${isPresent ? 'fa-check' : 'fa-times'}"></i> ${status}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 15px; text-align: right;">
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button onclick="markSingleAttendance('${emp.username}', 'Present')" 
                                    style="padding: 10px 22px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; ${presentBtnStyle}">
                                <i class="fas ${isPresent ? 'fa-check-circle' : 'fa-circle-notch'}"></i> Present
                            </button>
                            <button onclick="markSingleAttendance('${emp.username}', 'Absent')" 
                                    style="padding: 10px 22px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; ${absentBtnStyle}">
                                <i class="fas ${isAbsent ? 'fa-times-circle' : 'fa-circle-notch'}"></i> Absent
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }).catch(err => {
        console.error("Attendance load error:", err);
        body.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #ef4444;">Error syncing registry. Please retry.</td></tr>`;
    });
}

function markSingleAttendance(username, status) {
    const date = document.getElementById("attMarkingDate").value;
    fetch(api("/api/markAttendance"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName: username, date: date, status: status })
    }).then(res => {
        if (res.ok) loadAttendanceMarkingPage();
        else alert("Failed to mark attendance.");
    });
}

async function bulkMarkAttendance(status) {
    const date = document.getElementById("attMarkingDate").value;
    if (!confirm(`Mark all ${attEmployeesCache.length} employees as ${status}?`)) return;

    for (const emp of attEmployeesCache) {
        await fetch(api("/api/markAttendance"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeName: emp.username, date: date, status: status })
        });
    }
    loadAttendanceMarkingPage();
    alert(`Bulk update complete: All staff marked as ${status}.`);
}


// ======================
// EMPLOYEE DIRECTORY & DETAILS MODAL
// ======================

let allEmployeesCache = []; // Global cache for filtering

function loadEmployeeDirectory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetch(api("/api/employees"), { cache: "no-store" })
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
        const dept = emp.department || 'General Staff';

        return `
            <div class="chart-box" onclick="openEmpDetailsModal('${emp.username}')" 
                 style="cursor: pointer; transition: all 0.2s; border: 1px solid #eef2ff; display: flex; align-items: center; gap: 15px; padding: 20px; border-radius: 16px; background: white; box-shadow: var(--card-shadow);" 
                 onmouseover="this.style.borderColor='#6366f1'; this.style.transform='translateY(-3px)'" 
                 onmouseout="this.style.borderColor='#eef2ff'; this.style.transform='translateY(0)'">
                
                <div style="width: 50px; height: 50px; border-radius: 12px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; flex-shrink: 0;">
                    ${initial}
                </div>
                
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-weight: 800; color: #1e293b; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.username}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">${dept}</div>
                </div>

                <div style="color: var(--primary); opacity: 0.4;">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }).join("");
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
    console.log("Employee details view disabled for:", username);
    return; // Removed per user request
    document.getElementById("empModalName").innerText = username;

    // Close directory modal if open (for supervisor)
    const dirModal = document.getElementById("teamDirectoryModal");
    if (dirModal) dirModal.classList.remove("active");

    // Show loading states
    document.getElementById("empModalContact").innerText = "Syncing profile...";
    document.getElementById("empModalSkills").innerHTML = "Loading...";
    document.getElementById("aiInsights").innerHTML = "Analyzing productivity patterns...";
    document.getElementById("empModalTaskList").innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Fetching assignments...</p>';
    document.getElementById("empModalProgressBody").innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Retrieving history...</p>';

    // 1. Fetch Profile
    fetch(api(`/api/employeeProfile?username=${username}`))
        .then(res => res.json())
        .then(data => {
            document.getElementById("empModalDept").innerText = data.department || 'General Staff';
            document.getElementById("empModalContact").innerText = data.email || 'No email provided';
            let skills = (data.skills || "").split(",").map(s => s.trim()).filter(s => s);
            document.getElementById("empModalSkills").innerHTML = skills.length > 0 
                ? skills.map(s => `<span class="skill-badge" style="background: var(--primary-light); color: var(--primary); border: 1px solid #c7d2fe; font-size: 11px; padding: 4px 10px;">${s}</span>`).join("")
                : '<span style="color:var(--text-muted); font-size:11px;">No skills listed. Click + to add.</span>';
        });

    // 2. Fetch Tasks & KPIs
    fetch(api(`/api/tasksByEmployee?employeeName=${username}`))
        .then(res => res.json())
        .then(tasks => {
            const completed = tasks.filter(t => t.status === 'Completed').length;
            const inProgress = tasks.filter(t => t.status === 'In Progress' || t.status === 'Started').length;
            const delayed = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
            const efficiency = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

            document.getElementById("kpi-completed").innerText = completed;
            document.getElementById("kpi-progress").innerText = inProgress;
            document.getElementById("kpi-delayed").innerText = delayed;
            document.getElementById("kpi-efficiency").innerText = efficiency + "%";

            // Task Chart
            if (empModalTaskChartObj) empModalTaskChartObj.destroy();
            const taskCtx = document.getElementById("empModalTaskChart").getContext("2d");
            empModalTaskChartObj = new Chart(taskCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress', 'Pending'],
                    datasets: [{
                        data: [completed, inProgress, Math.max(0, tasks.length - completed - inProgress)],
                        backgroundColor: ['#10b981', '#6366f1', '#f1f5f9'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', weight: '600' } } } },
                    cutout: '70%',
                    layout: { padding: 10 }
                }
            });

            // Recent Assignments List
            document.getElementById("empModalTaskList").innerHTML = tasks.slice(0, 3).map(t => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #eef2ff;">
                    <div style="flex: 1; overflow: hidden; margin-right: 15px;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.taskName}</div>
                        <div style="font-size: 11px; color: var(--text-muted);"><i class="far fa-clock"></i> Due: ${t.deadline || 'Today'}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                        <span class="priority-badge priority-${t.priority}" style="font-size: 9px; padding: 2px 6px;">${t.priority}</span>
                        <span style="font-size: 11px; font-weight: 700; color: ${t.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}">${t.status}</span>
                    </div>
                </div>
            `).join("") || '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">No recent assignments.</p>';

            // AI Insights
            let insightText = "";
            if (efficiency > 80) insightText = `${username} exhibits exceptional productivity, consistently completing tasks ahead of schedule. Ideal for high-priority leadership roles.`;
            else if (delayed > 2) insightText = `Noticeable delay pattern detected in high-priority tasks for ${username}. Recommended for section-specific training or workload re-balancing.`;
            else insightText = `${username} shows steady performance with consistent output. Maintains operational stability across assigned sections.`;
            document.getElementById("aiInsights").innerText = insightText;
        });

    // 3. Fetch Attendance & Timeline
    fetch(api(`/api/employeeStats?employeeName=${username}`))
        .then(res => res.json())
        .then(data => {
            let p = data.present || 0;
            let a = data.absent || 0;
            let total = p + a;
            let rate = total > 0 ? Math.round((p / total) * 100) : 0;
            
            document.getElementById("empModalAttendanceRate").innerText = rate + "%";
            document.getElementById("empModalAttendanceBar").style.width = rate + "%";
            document.getElementById("empModalAttendanceBar").style.backgroundColor = rate > 75 ? "var(--success)" : (rate > 50 ? "var(--warning)" : "var(--danger)");

            if (empModalAttChartObj) empModalAttChartObj.destroy();
            const attCtx = document.getElementById("empModalAttendanceChart").getContext("2d");
            empModalAttChartObj = new Chart(attCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Present', 'Absent'],
                    datasets: [{
                        data: [p, a],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 5
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '80%'
                }
            });

            // Timeline Log
            fetch(api(`/api/employeeAttendanceRecords?username=${username}`))
                .then(res => res.json())
                .then(history => {
                    document.getElementById("empModalProgressBody").innerHTML = history.slice(0, 5).map(h => `
                        <div style="display: flex; gap: 15px; position: relative;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${h.status === 'Present' ? 'var(--success)' : 'var(--danger)'}; margin-top: 5px; z-index: 1;"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${h.date}</div>
                                <div style="font-size: 11px; color: var(--text-muted);">${h.status} • Shift: General</div>
                            </div>
                        </div>
                    `).join("") || '<p style="color: var(--text-muted); font-size: 13px;">No history records found.</p>';
                });
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

    fetch(api(`/api/attendanceByDate?date=${date}`))
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
    fetch(api("/api/ordersByStatus?status=Pending"))
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

    fetch(api(`/api/rejectOrder?orderId=${orderId}`), {
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
        await fetch(api(`/api/convertOrderToTask?orderId=${orderId}`), {
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
            await fetch(api(`/api/convertOrderToTask?orderId=${orderId}`), {
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
    fetch(api("/api/orderAnalytics"))
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
    fetch(api("/api/ordersByStatus?status=Pending"))
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
    fetch(api('/api/orders'))
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


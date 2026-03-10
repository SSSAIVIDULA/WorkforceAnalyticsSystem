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
    let department = document.getElementById("department").value.trim();

    if (username === "" || password === "") {
        document.getElementById("msg").innerHTML = "Please fill all fields";
        return;
    }

    fetch("http://localhost:8080/api/addEmployee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, skill, employeeId, department })
    })
        .then(res => res.json())
        .then(() => {

            document.getElementById("msg").innerHTML = "Employee added successfully";

            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            document.getElementById("employeeId").value = "";
            document.getElementById("department").value = "";

            document.querySelectorAll('input[name="empSkill"]').forEach(cb => cb.checked = false);

            setTimeout(() => {
                window.location = "attendance.html";
            }, 1000);

        })
        .catch(() => {
            document.getElementById("msg").innerHTML = "Error adding employee";
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

    fetch("http://localhost:8080/api/login", {
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
        fetch("http://localhost:8080/api/employees").then(res => res.json()),
        fetch("http://localhost:8080/api/attendanceByDate?date=" + selectedDate).then(res => res.json())
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

    fetch("http://localhost:8080/api/markAttendance", {
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

    fetch("http://localhost:8080/api/createTask", {
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

    fetch("http://localhost:8080/api/tasksByDate?date=" + today)
        .then(res => res.json())
        .then(tasks => {

            let html = "";
            if (tasks.length === 0) {
                html = "<p style='color:#999;'>No tasks created today.</p>";
            }

            tasks.forEach(task => {
                let isSelected = selectedTaskId === task.id ? "border: 2px solid #2196f3; background: #e3f2fd;" : "border: 1px solid #ddd;";
                let assignedList = task.assignedEmployees ? task.assignedEmployees : "<span style='color:red;'>Not Assigned</span>";
                let hasSkill = task.requiredSkill && task.requiredSkill.trim() !== "";
                let safeSkill = hasSkill ? task.requiredSkill.replace(/'/g, "\\'") : "";
                let safeName = task.taskName ? task.taskName.replace(/'/g, "\\'") : "Untitled";

                if (hasSkill) {
                    html += `
<div class="employee-row" 
     onclick="selectTask(${task.id}, '${safeSkill}', '${safeName}')" 
     style="cursor:pointer; margin-bottom: 10px; padding: 12px; border-radius: 8px; transition: 0.3s; ${isSelected}">
    <div style="flex: 1;">
        <b style="font-size: 16px; color: #333;">${task.taskName || 'Untitled'}</b><br>
        <small style="color: #666;">Section: ${task.section} | Priority: ${task.priority}</small><br>
        <small style="color: #667eea;">Skills: ${task.requiredSkill}</small><br>
        <span style="font-size: 13px;"><b>Assigned:</b> ${assignedList}</span>
    </div>
    <div style="text-align: right;">
        <span style="background: #eee; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${task.status}</span>
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
    <div style="text-align: right;">
        <span style="background: #fecaca; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${task.status}</span>
    </div>
</div>
`;
                }
            });

            document.getElementById("taskList").innerHTML = html;

        });

}


function selectTask(taskId, skill, name) {

    selectedTaskId = taskId;
    document.getElementById("selectionHint").innerText = "Suggesting employees for: " + name;

    // Refresh task list UI to show selection highlight
    loadTasks();

    fetch("http://localhost:8080/api/employeesBySkill?skill=" + encodeURIComponent(skill))
        .then(res => res.json())
        .then(data => {
            console.log("Skill queried:", skill);
            console.log("Employees found:", data.length, data);

            let html = "";
            if (data.length === 0) {
                html = "<p style='color:red; padding: 10px;'>No matching employees found for this task's skills.</p>";
            } else {
                html = "<p style='font-size: 13px; margin-bottom: 10px;'>Click an employee name to assign them:</p>";
                data.forEach(emp => {
                    html += `
<div onclick="assignSingleEmployee('${emp.username}')"
     style="display: flex; align-items: center; background: #fff; padding: 10px; margin-bottom: 6px;
            border-radius: 6px; border: 1px solid #ddd; cursor: pointer; transition: 0.2s;"
     onmouseover="this.style.background='#e3f2fd'; this.style.borderColor='#2196f3';"
     onmouseout="this.style.background='#fff'; this.style.borderColor='#ddd';">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: #667eea; color: #fff;
                display: flex; align-items: center; justify-content: center; font-weight: bold;
                margin-right: 12px; font-size: 16px;">
        ${emp.username.charAt(0).toUpperCase()}
    </div>
    <div style="flex: 1;">
        <b style="color: #333; font-size: 15px;">${emp.username}</b><br>
        <small style="color: #888;">Skills: ${emp.skill}</small>
    </div>
    <span style="color: #2196f3; font-size: 20px;">➜</span>
</div>
`;
                });
            }

            document.getElementById("suggestedEmployees").innerHTML = html;

        })
        .catch(() => {
            document.getElementById("suggestedEmployees").innerHTML =
                "<p style='color:red;'>Error fetching employees. Is the server running?</p>";
        });

}


function assignSingleEmployee(employeeName) {

    if (!selectedTaskId) {
        alert("Please select a task first.");
        return;
    }

    fetch(`http://localhost:8080/api/assignEmployees?taskId=${selectedTaskId}&employees=${encodeURIComponent(employeeName)}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {

            alert(employeeName + " assigned successfully!");
            document.getElementById("suggestedEmployees").innerHTML =
                "<p style='color:green; font-weight: bold;'>✔ " + employeeName + " has been assigned.</p>";
            selectedTaskId = null;
            loadTasks();

        })
        .catch(() => alert("Error assigning employee. Please check server."));

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
    fetch("http://localhost:8080/api/employeeProfile?username=" + encodeURIComponent(username))
        .then(res => res.json())
        .then(profile => {

            if (profile && profile.department) {
                document.getElementById("empDept").innerText = "Department: " + profile.department;
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
    fetch("http://localhost:8080/api/employeeStats?employeeName=" + encodeURIComponent(username))
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

    fetch("http://localhost:8080/api/tasksByEmployee?employeeName=" + encodeURIComponent(username))
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
            if (tasks.length === 0) {
                html = "<p style='color:#999;'>No tasks assigned yet.</p>";
            }

            tasks.forEach(task => {
                let statusColor = "#f59e0b";
                if (task.status === "Completed") statusColor = "#10b981";
                if (task.status === "In Progress") statusColor = "#8b5cf6";
                if (task.status === "Started") statusColor = "#3b82f6";

                html += `
<div class="task-item">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <b>${task.taskName}</b><br>
            <small style="color: #666;">Section: ${task.section} | Priority: ${task.priority}</small>
        </div>
        <span class="task-status-badge" style="background: ${statusColor}20; color: ${statusColor};">${task.status}</span>
    </div>
</div>
`;
            });

            document.getElementById("employeeTaskList").innerHTML = html;

        })
        .catch(() => {
            document.getElementById("employeeTaskList").innerHTML = "<p style='color:red;'>Error loading tasks.</p>";
        });
}


// ======================
// MANAGER ANALYTICS
// ======================

function loadManagerAnalytics() {

    // Fetch employee count
    fetch("http://localhost:8080/api/employees")
        .then(res => res.json())
        .then(employees => {
            document.getElementById("totalEmployees").innerText = employees.length;
        })
        .catch(() => { });

    // Fetch main analytics
    fetch("http://localhost:8080/api/managerAnalytics")
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
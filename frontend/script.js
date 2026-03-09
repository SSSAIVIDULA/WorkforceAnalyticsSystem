// ======================
// NAVIGATION
// ======================

function goSupervisor(){
window.location="supervisor-dashboard.html";
}

function goEmployee(){
window.location="login.html";
}

function logout(){
localStorage.removeItem("username");
window.location="index.html";
}

function goAddEmployee(){
window.location="add-employee.html";
}

function goAttendance(){
window.location="attendance.html";
}

function goTaskManagement(){
window.location="task-management.html";
}


// ======================
// ADD EMPLOYEE
// ======================

function addEmployee(){

let username=document.getElementById("username").value.trim();
let password=document.getElementById("password").value.trim();
let role=document.getElementById("role").value;
let skill=document.getElementById("skill").value;

if(username===""||password===""){
document.getElementById("msg").innerHTML="Please fill all fields";
return;
}

fetch("http://localhost:8080/api/addEmployee",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password,role,skill})
})
.then(res=>res.json())
.then(()=>{
document.getElementById("msg").innerHTML="Employee added successfully";
})
.catch(()=>{
document.getElementById("msg").innerHTML="Error adding employee";
});

}


// ======================
// LOGIN
// ======================

function login(){

let username=document.getElementById("username").value.trim();
let password=document.getElementById("password").value.trim();

if(username===""||password===""){
document.getElementById("msg").innerHTML="Enter username and password";
return;
}

fetch("http://localhost:8080/api/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password})
})
.then(res=>res.json())
.then(result=>{

if(result){
localStorage.setItem("username",result.username);
window.location="employee-dashboard.html";
}else{
document.getElementById("msg").innerHTML="Invalid login";
}

})
.catch(()=>{
document.getElementById("msg").innerHTML="Server error";
});

}


// ======================
// EMPLOYEE STATS
// ======================

function loadEmployeeStats(){

let username=localStorage.getItem("username");
if(!username) return;

document.getElementById("employeeName").innerText="Welcome "+username;

fetch("http://localhost:8080/api/employeeStats?employeeName="+username)
.then(res=>res.json())
.then(data=>{
document.getElementById("presentDays").innerText=data.present;
document.getElementById("absentDays").innerText=data.absent;
});

}


// ======================
// LOAD ATTENDANCE
// ======================

function loadEmployees(){

let today=new Date().toISOString().split('T')[0];
let dateInput=document.getElementById("selectedDate");

if(dateInput.value===""){
dateInput.value=today;
}

let selectedDate=dateInput.value;

document.getElementById("todayDate").innerHTML=
"Attendance Date : "+selectedDate;

Promise.all([

fetch("http://localhost:8080/api/employees").then(res=>res.json()),
fetch("http://localhost:8080/api/attendanceByDate?date="+selectedDate).then(res=>res.json())

])
.then(([employees,attendance])=>{

let attendanceMap={};

attendance.forEach(a=>{
attendanceMap[a.employeeName]=a.status;
});

let html="";
let present=0;
let absent=0;

employees.forEach(emp=>{

let status=attendanceMap[emp.username];

if(status==="Present") present++;
if(status==="Absent") absent++;

let disableButtons=(selectedDate!==today||status)?"disabled":"";

let statusColor="black";
if(status==="Present") statusColor="green";
if(status==="Absent") statusColor="red";

html+=`

<div class="employee-row">

<div class="employee-name">
${emp.username}
</div>

<div class="employee-actions">

<button class="present-btn"
${disableButtons}
onclick="markAttendance('${emp.username}','Present')">
Present
</button>

<button class="absent-btn"
${disableButtons}
onclick="markAttendance('${emp.username}','Absent')">
Absent
</button>

<span class="attendance-status"
style="color:${statusColor}">
${status ? status : "-"}
</span>

</div>

</div>

`;

});

document.getElementById("employeeList").innerHTML=html;
document.getElementById("presentCount").innerText=present;
document.getElementById("absentCount").innerText=absent;

});

}


// ======================
// MARK ATTENDANCE
// ======================

function markAttendance(name,status){

let today=new Date().toISOString().split('T')[0];

fetch("http://localhost:8080/api/markAttendance",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
employeeName:name,
date:today,
status:status
})
})
.then(res=>res.json())
.then(()=>{
document.getElementById("attMsg").innerHTML="Attendance updated successfully";
loadEmployees();
})
.catch(()=>{
document.getElementById("attMsg").innerHTML="Error updating attendance";
});

}

// ======================
// MANAGER ANALYTICS
// ======================
function loadManagerAnalytics() {
    fetch("http://localhost:8080/api/managerAnalytics")
    .then(res => res.json())
    .then(data => {
        document.getElementById("totalTasks").innerText = data.totalTasks;
        document.getElementById("totalCompleted").innerText = data.completedTasks;
        document.getElementById("totalPending").innerText = data.pendingTasks;
        document.getElementById("totalPresent").innerText = data.presentEmployees;
        document.getElementById("totalAbsent").innerText = data.absentEmployees;

        const taskCtx = document.getElementById('taskChart').getContext('2d');
        new Chart(taskCtx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [data.completedTasks, data.pendingTasks],
                    backgroundColor: ['#4caf50', '#ff9800']
                }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: "Today's Task Status" } } }
        });

        const attCtx = document.getElementById('attendanceChart').getContext('2d');
        new Chart(attCtx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [data.presentEmployees, data.absentEmployees],
                    backgroundColor: ['#2196f3', '#f44336']
                }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Workforce Attendance' } } }
        });
    })
    .catch(err => console.log("Error loading analytics: ", err));
}

// ======================
// TASK MANAGEMENT
// ======================
function loadSuggestedEmployees() {
    let skill = document.getElementById("taskSkill").value;
    if(!skill) {
        document.getElementById("suggestedEmployees").innerHTML = "Select a skill to see suggestions...";
        return;
    }
    fetch("http://localhost:8080/api/employeesBySkill?skill=" + skill)
    .then(res => res.json())
    .then(data => {
        if(data.length === 0) {
            document.getElementById("suggestedEmployees").innerHTML = "No employees found with this skill.";
            return;
        }
        let html = "";
        data.forEach(emp => {
            html += `<div class="employee-checkbox"><input type="checkbox" name="assignee" value="${emp.username}"> ${emp.username} </div>`;
        });
        document.getElementById("suggestedEmployees").innerHTML = html;
    });
}

function createTask() {
    let taskName = document.getElementById("taskName").value.trim();
    let section = document.getElementById("taskSection").value;
    let priority = document.getElementById("taskPriority").value;
    let skill = document.getElementById("taskSkill").value;

    let assignees = [];
    let checkboxes = document.querySelectorAll('input[name="assignee"]:checked');
    checkboxes.forEach(cb => assignees.push(cb.value));

    if(taskName === "" || skill === "" || assignees.length === 0){
        alert("Please fill task details and select at least one employee.");
        return;
    }

    let assignedEmployees = assignees.join(",");

    fetch("http://localhost:8080/api/createTask",{
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ taskName: taskName, requiredSkill: skill, section: section, priority: priority, assignedEmployees: assignedEmployees })
    })
    .then(res => res.json())
    .then(() => {
        alert("Task Assigned Successfully!");
        document.getElementById("taskName").value = "";
        document.getElementById("suggestedEmployees").innerHTML = "Select a skill to see suggestions...";
        document.getElementById("taskSkill").value = "";
        loadTasks();
    });
}

function loadTasks() {
    let today = new Date().toISOString().split('T')[0];
    fetch("http://localhost:8080/api/tasksByDate?date=" + today)
    .then(res => res.json())
    .then(data => {
        let html = "";
        data.forEach(task => {
            html += `<div class="employee-row" style="margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
                <div style="flex:2"><b>${task.taskName}</b> (${task.priority} - ${task.section})<br>Assigned to: ${task.assignedEmployees}</div>
                <div>Status: <b>${task.status}</b></div>
                <div class="employee-actions">
                    <button class="present-btn" onclick="updateTaskStatus(${task.id}, 'Completed')">Completed</button>
                    <button class="absent-btn" onclick="updateTaskStatus(${task.id}, 'Pending')">Pending</button>
                </div>
            </div>`;
        });
        if(html === "") html = "No tasks assigned today.";
        document.getElementById("taskList").innerHTML = html;
    });
}

function updateTaskStatus(taskId, status) {
    fetch(`http://localhost:8080/api/updateTaskStatus?taskId=${taskId}&status=${status}`,{ method: "POST" })
    .then(res => res.json())
    .then(() => loadTasks());
}

function loadEmployeeTasks() {
    let username=localStorage.getItem("username");
    if(!username) return;

    fetch("http://localhost:8080/api/tasksByEmployee?employeeName="+username)
    .then(res => res.json())
    .then(tasks => {
        let html = "";
        let completed = 0;
        let total = tasks.length;

        tasks.forEach(task => {
            if(task.status === "Completed") completed++;
            
            let color = task.status === "Completed" ? "green" : "orange";
            html += `<div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:4px;">
                <h4 style="margin: 0 0 5px 0;">${task.taskName} <span style="font-size:12px; float:right; color:${color}; margin-top: 2px;">${task.status}</span></h4>
                <p style="margin:5px 0; font-size:14px; color: #555;">Section: ${task.section} | Priority: ${task.priority}</p>
                <div style="margin-top: 10px;">
                    ${task.status !== 'Completed' ? `<button onclick="updateEmployeeTaskStatus(${task.id}, 'Completed')" style="padding:5px 10px; font-size:12px; background: #4caf50;">Mark Completed</button>` : `<button onclick="updateEmployeeTaskStatus(${task.id}, 'Pending')" style="padding:5px 10px; font-size:12px; background: #ff9800;">Mark Pending</button>`}
                </div>
            </div>`;
        });

        if(total === 0) html = "<p>No tasks assigned.</p>";
        document.getElementById("employeeTaskList").innerHTML = html;

        let productivity = total === 0 ? "0%" : Math.round((completed / total) * 100) + "%";
        document.getElementById("productivity").innerText = productivity + " (" + completed + "/" + total + " completed)";
    });
}

function updateEmployeeTaskStatus(taskId, status) {
    fetch(`http://localhost:8080/api/updateTaskStatus?taskId=${taskId}&status=${status}`,{ method: "POST" })
    .then(res => res.json())
    .then(() => loadEmployeeTasks());
}
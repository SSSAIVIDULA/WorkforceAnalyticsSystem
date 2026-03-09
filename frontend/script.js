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


// ======================
// ADD EMPLOYEE
// ======================

function addEmployee(){

let username=document.getElementById("username").value.trim();
let password=document.getElementById("password").value.trim();
let role=document.getElementById("role").value;

if(username===""||password===""){
document.getElementById("msg").innerHTML="Please fill all fields";
return;
}

fetch("http://localhost:8080/api/addEmployee",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password,role})
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
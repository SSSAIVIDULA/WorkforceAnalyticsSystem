
// ======================
// NAVIGATION
// ======================

function goSupervisor(){
    window.location = "supervisor-dashboard.html";
}

function goEmployee(){
    window.location = "login.html";
}

function logout(){
    window.location = "index.html";
}

function goAddEmployee(){
    window.location = "add-employee.html";
}

function goAttendance(){
    window.location = "attendance.html";
}


// ======================
// ADD EMPLOYEE
// ======================

function addEmployee(){

  let data = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value
  };

  fetch("http://localhost:8080/api/addEmployee",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
      document.getElementById("msg").innerHTML =
      "Employee Added Successfully!";
  });
}


// ======================
// EMPLOYEE LOGIN
// ======================

function login(){

  let data = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value
  };

  fetch("http://localhost:8080/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {

      if(result != null){
          window.location = "employee-dashboard.html";
      }else{
          document.getElementById("msg").innerHTML =
          "Invalid Login";
      }

  });
}


// ======================
// LOAD EMPLOYEES + ATTENDANCE
// ======================

function loadEmployees(){

let today = new Date().toISOString().split('T')[0];

let dateInput = document.getElementById("selectedDate");

// first load -> today
if(dateInput.value === ""){
    dateInput.value = today;
}

let selectedDate = dateInput.value;

document.getElementById("todayDate").innerHTML =
"Showing Attendance : " + selectedDate;


// FETCH EMPLOYEES + ATTENDANCE
Promise.all([
fetch("http://localhost:8080/api/employees").then(res=>res.json()),
fetch("http://localhost:8080/api/attendanceByDate?date="+selectedDate)
.then(res=>res.json())
])
.then(([employees, attendance])=>{

let attendanceMap = {};

attendance.forEach(a=>{
    attendanceMap[a.employeeName] = a.status;
});

let html = "";

let present = 0;
let absent = 0;

employees.forEach(emp=>{

let status = attendanceMap[emp.username];

// COUNT PRESENT / ABSENT
if(status === "Present") present++;
if(status === "Absent") absent++;

let disableButtons =
(selectedDate !== today || status)
? "disabled style='opacity:0.5'"
: "";

html += `
<div>
<b>${emp.username}</b>

<button ${disableButtons}
onclick="markAttendance('${emp.username}','Present')">
Present
</button>

<button ${disableButtons}
onclick="markAttendance('${emp.username}','Absent')">
Absent
</button>

<span style="margin-left:10px;color:green;">
${status ? "Marked: "+status : ""}
</span>
</div><br>
`;

});

document.getElementById("employeeList").innerHTML = html;

// SHOW SUMMARY
document.getElementById("presentCount").innerHTML = present;
document.getElementById("absentCount").innerHTML = absent;

});
}


// ======================
// MARK ATTENDANCE
// ======================

function markAttendance(name,status){

let today = new Date().toISOString().split('T')[0];

let data = {
employeeName:name,
date:today,
status:status
};

fetch("http://localhost:8080/api/markAttendance",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify(data)
})
.then(res=>res.json())
.then(result=>{

document.getElementById("attMsg").innerHTML =
"Attendance Updated!";

// reload data
loadEmployees();

});
}
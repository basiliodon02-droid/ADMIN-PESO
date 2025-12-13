if (localStorage.getItem("isLoggedIn") == "FALSE") {
  window.location.href = "./index.html";
}

function toggleProfileMenu() {
  const profileMenu = document.getElementById("profile-menu");
  profileMenu.classList.toggle("show");
}

document.addEventListener("DOMContentLoaded", (event) => {
  document.querySelectorAll(".toggle-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = btn.nextElementSibling;

      document.querySelectorAll(".submenu").forEach((list) => {
        if (list !== submenu) list.classList.remove("show");
      });

      submenu.classList.toggle("show");
    });
  });
});

const workers = document.getElementById("workers");
const establishments = document.getElementById("establishments");
const vacancies = document.getElementById("vacancies");
const applicants = document.getElementById("applicants");
const pendingVerifications = document.getElementById("pendingVerifications");

window.onload = async function () {
  //FETCH AND DISPLAY WORKERS COUNT
  const employeeList = await getEmployeeList();
  if (employeeList.success) {
    workers.innerText = employeeList.data.length;
  } else {
    workers.innerText = "0";
  }
  const establishmentList = await getEstablishmentList();
  if (establishmentList.success) {
    establishments.innerText = establishmentList.data.length;
  } else {
    establishments.innerText = "0";
  }
  const vacancyList = await getVacancyList();
  if (vacancyList.success) {
    vacancies.innerText = vacancyList.data.length;
  } else {
    vacancies.innerText = "0";
  }
  const applicantList = await getApplicantList();
  if (applicantList.success) {
    applicants.innerText = applicantList.data.length;
  } else {
    applicants.innerText = "0";
  }
  const pendingUsersList = await getPendingUsersList();
  if (pendingUsersList.success) {
    pendingVerifications.innerText = pendingUsersList.data.length;
  } else {
    pendingVerifications.innerText = "0";
  }
};



//GET LIST OF ACtive EMPLOYEE/WORKER FUNCTION
async function getEmployeeList() {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("role", "Worker")
    .neq("status", "Deleted") // STATUS NOT EQUAL TO DELETED - only display non-deleted employees
    .order("user_id", { ascending: true });

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}

//GET LIST OF EMPLOYEE/WORKER FUNCTION FOR PENDING VERIFICATIONS
async function getPendingUsersList() {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("status", "Pending")
    .order("user_id", { ascending: true });

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}

//get list of active establishments function
async function getEstablishmentList() {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .eq("status", "Active")
    .order("establishment_id", { ascending: true });

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}

//GET LIST OF ACTIVE JOB VACANCIES FUNCTION
async function getVacancyList() {
  const { data, error } = await supabase
    .from("JobVacancy")
    .select("*")
    .eq("status", "Active")
    .order("vacancy_id", { ascending: true });

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}


//GET LIST OF BRGY FUNCTION
async function getApplicantList() {
  const { data, error } = await supabase
    .from("JobApplication")
    .select("*")
    .order("application_id", { ascending: true });

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}

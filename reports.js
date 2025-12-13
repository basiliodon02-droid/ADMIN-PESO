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

// const workers = document.getElementById("workers");
const establishments = document.getElementById("establishments");
const vacancies = document.getElementById("vacancies");
const applicants = document.getElementById("applicants");
const pendingVerifications = document.getElementById("pendingVerifications");


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

// GET LIST OF EMPLOYERS WITH DATE RANGE + COUNTS
async function getEmployerListByDate(dateFrom, dateTo) {
  let query = supabase
    .from("Users")
    .select("*")
    .eq("role", "Employer")
    .order("user_id", { ascending: true });

  // Apply date filters if provided
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  }

  // Overall count (regardless of status, except Deleted)
  const totalCount = data.length;

  // Active employers count
  const activeCount = data.filter(
    (item) => item.status === "Active"
  ).length;

  return {
    message: "got it",
    success: true,
    data,
    totalCount,
    activeCount,
  };
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
    .eq("applicationStatus", "For Review")
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


// GET LIST OF APPLICANTS WITH DATE RANGE + COUNTS
async function getApplicantListByDate(dateFrom, dateTo) {
  let query = supabase
    .from("JobApplication")
    .select("*")
    .order("application_id", { ascending: true });

  // Apply date filters if provided
  if (dateFrom) {
    query = query.gte("createdDate", dateFrom);
  }

  if (dateTo) {
    query = query.lte("createdDate", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  }

  // Overall total (regardless of status)
  const totalCount = data.length;

  // Status-based counts
  const hiredCount = data.filter(
    (item) => item.applicationStatus === "Hired"
  ).length;

  const notHiredCount = data.filter(
    (item) => item.applicationStatus !== "Hired"
  ).length;

  // List to display (For Review only)
  const forReviewList = data.filter(
    (item) => item.applicationStatus === "For Review"
  );

  return {
    message: "got it",
    success: true,
    data: forReviewList,
    totalCount,
    hiredCount,
    notHiredCount,
  };
}



// GET LIST OF WORKERS WITH DATE RANGE + COUNTS
async function getWorkersListByDate(dateFrom, dateTo) {
  let query = supabase
    .from("Users")
    .select("*")
    .eq('role', 'Worker')
    .order("user_id", { ascending: true });

  // Apply date filters if provided
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  }

  // Overall total (regardless of status)
  const totalCount = data.length;

  // Status-based counts
  const activeCount = data.filter(
    (item) => item.status === "Active"
  ).length;

  const pendingCount = data.filter(
    (item) => item.status === "Pending"
  ).length;

  const deletedCount = data.filter(
    (item) => item.status !== "Deleted"
  ).length;

  // List to display (Workers)
  const workerList = data.filter(
    (item) => item.role === "Worker"
  );

  return {
    message: "got it",
    success: true,
    data: workerList,
    totalCount,
    activeCount,
    pendingCount,
    deletedCount
  };
}


// GET LIST OF JOB VACANCIES WITH DATE RANGE + COUNTS
async function getVacanciesListByDate(dateFrom, dateTo) {
  let query = supabase
    .from("JobVacancy")
    .select("*")
    .order("vacancy_id", { ascending: true });

  // Apply date filters if provided
  if (dateFrom) {
    query = query.gte("created_date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_date", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return {
      message: error.message,
      success: false,
      data: {},
    };
  }

  // Overall total (regardless of status)
  const totalCount = data.length;

  // Status-based counts
  const activeCount = data.filter(
    (item) => item.status === "Active"
  ).length;

  const closedCount = data.filter(
    (item) => item.status === "Closed"
  ).length;


  return {
    message: "got it",
    success: true,
    data: data,
    totalCount,
    activeCount,
    closedCount,
  };
}


const dateFromInput = document.getElementById("dateFrom");
const dateToInput = document.getElementById("dateTo");
dateToInput.value = new Date().toISOString().split("T")[0];
dateFromInput.value = new Date("2025-10-01").toISOString().split("T")[0];

async function onDateChange() {
  const dateFrom = dateFromInput.value || null;
  const dateTo = dateToInput.value || null;

  //initially hide stats numbers
  document.getElementById("workerStats").style.display = "none";
  document.getElementById("employerStats").style.display = "none";
  document.getElementById("vacanciesStats").style.display = "none";
  document.getElementById("applicationsStats").style.display = "none";

  //show loaders
  document.getElementById("workerLoader").style.display = "flex";
  document.getElementById("employerLoader").style.display = "flex";
  document.getElementById("vacanciesLoader").style.display = "flex";
  document.getElementById("applicationsLoader").style.display = "flex";

  //get worker list list based on date filter - used created_at column in supabase
  const workerResults = await getWorkersListByDate(dateFrom, dateTo);
  if (workerResults.success == true) {
    document.getElementById("workers").innerText = workerResults.activeCount;
    document.getElementById("workers-inactive").innerText = workerResults.totalCount - workerResults.activeCount;
    document.getElementById("workerLoader").style.display = "none";
    document.getElementById("workerStats").style.display = "flex";
  } else {
    document.getElementById("workers").innerText = 0;
    document.getElementById("workers-inactive").innerText = 0;
    document.getElementById("workerLoader").style.display = "none";
    document.getElementById("workerStats").style.display = "flex";
  }


  //get employer list based on date filter - used created_at column in supabase
  const employerResponse = await getEmployerListByDate(dateFrom, dateTo);
  if (employerResponse.success == true) {
    document.getElementById("employers").innerText = employerResponse.activeCount;
    document.getElementById("employers-inactive").innerText = employerResponse.totalCount - employerResponse.activeCount;
    document.getElementById("employerLoader").style.display = "none";
    document.getElementById("employerStats").style.display = "flex";
  } else {
    document.getElementById("employers").innerText = 0;
    document.getElementById("employers-inactive").innerText = 0;
    document.getElementById("employerLoader").style.display = "none";
    document.getElementById("employerStats").style.display = "flex";
  }

  //get job vacancies list list based on date filter - used created_date column in supabase
  const vacanciesResults = await getVacanciesListByDate(dateFrom, dateTo);
  if (vacanciesResults.success == true) {
    document.getElementById("postedVacancies").innerText = vacanciesResults.activeCount;
    document.getElementById("closedVacancies").innerText = vacanciesResults.closedCount;
    document.getElementById("vacanciesLoader").style.display = "none";
    document.getElementById("vacanciesStats").style.display = "flex";
  } else {
    document.getElementById("postedVacancies").innerText = 0;
    document.getElementById("closedVacancies").innerText = 0;
    document.getElementById("vacanciesLoader").style.display = "none";
    document.getElementById("vacanciesStats").style.display = "flex";
  }

  //get applicantions list based on date filter - used createdDate column in supabase
  const applicantResults = await getApplicantListByDate(dateFrom, dateTo);
  if (applicantResults.success == true) {
    document.getElementById("applicationsSubmitted").innerText = applicantResults.totalCount;
    document.getElementById("applicationsHired").innerText = applicantResults.hiredCount;
    document.getElementById("applicationsLoader").style.display = "none";
    document.getElementById("applicationsStats").style.display = "flex";
  } else {
    document.getElementById("applicationsSubmitted").innerText = 0;
    document.getElementById("applicationsHired").innerText = 0;
    document.getElementById("applicationsLoader").style.display = "none";
    document.getElementById("applicationsStats").style.display = "flex";
  }






}

dateFromInput.addEventListener("change", onDateChange);
dateToInput.addEventListener("change", onDateChange);

window.onload = async function () {

  //initially hide stats numbers
  document.getElementById("workerStats").style.display = "none";
  document.getElementById("employerStats").style.display = "none";
  document.getElementById("vacanciesStats").style.display = "none";
  document.getElementById("applicationsStats").style.display = "none";

  document.getElementById("activeVacanciesStats").style.display = "none";
  document.getElementById("activeEstablishmentsStats").style.display = "none";
  document.getElementById("activeApplicationsStats").style.display = "none";
  document.getElementById("pendingUsersStats").style.display = "none";

  //show loaders
  document.getElementById("workerLoader").style.display = "flex";
  document.getElementById("employerLoader").style.display = "flex";
  document.getElementById("vacanciesLoader").style.display = "flex";
  document.getElementById("applicationsLoader").style.display = "flex";

  document.getElementById("activeVacanciesLoader").style.display = "flex";
  document.getElementById("activeEstablishmentsLoader").style.display = "flex";
  document.getElementById("activeApplicationsLoader").style.display = "flex";
  document.getElementById("pendingUsersLoader").style.display = "flex";


  const workerResults = await getWorkersListByDate(dateFromInput.value, dateToInput.value);
  if (workerResults.success == true) {
    document.getElementById("workers").innerText = workerResults.activeCount;
    document.getElementById("workers-inactive").innerText = workerResults.totalCount - workerResults.activeCount;
    document.getElementById("workerLoader").style.display = "none";
    document.getElementById("workerStats").style.display = "flex";
  } else {
    document.getElementById("workers").innerText = 0;
    document.getElementById("workers-inactive").innerText = 0;
    document.getElementById("workerLoader").style.display = "none";
    document.getElementById("workerStats").style.display = "flex";
  }
  console.log("worker data:", workerResults);


  const employerResponse = await getEmployerListByDate(dateFromInput.value, dateToInput.value);
  if (employerResponse.success == true) {
    document.getElementById("employers").innerText = employerResponse.activeCount;
    document.getElementById("employers-inactive").innerText = employerResponse.totalCount - employerResponse.activeCount;
    document.getElementById("employerLoader").style.display = "none";
    document.getElementById("employerStats").style.display = "flex";
  } else {
    document.getElementById("employers").innerText = 0;
    document.getElementById("employers-inactive").innerText = 0;
    document.getElementById("employerLoader").style.display = "none";
    document.getElementById("employerStats").style.display = "flex";
  }
  console.log("employer data:", employerResponse);


  const vacanciesResults = await getVacanciesListByDate(dateFromInput.value, dateToInput.value);
  if (vacanciesResults.success == true) {
    document.getElementById("postedVacancies").innerText = vacanciesResults.activeCount;
    document.getElementById("closedVacancies").innerText = vacanciesResults.closedCount;
    document.getElementById("vacanciesLoader").style.display = "none";
    document.getElementById("vacanciesStats").style.display = "flex";
  } else {
    document.getElementById("postedVacancies").innerText = 0;
    document.getElementById("closedVacancies").innerText = 0;
    document.getElementById("vacanciesLoader").style.display = "none";
    document.getElementById("vacanciesStats").style.display = "flex";
  }
  console.log("job vacancies data:", vacanciesResults);


  const applicantResults = await getApplicantListByDate(dateFromInput.value, dateToInput.value);
  if (applicantResults.success == true) {
    document.getElementById("applicationsSubmitted").innerText = applicantResults.totalCount;
    document.getElementById("applicationsHired").innerText = applicantResults.hiredCount;
    document.getElementById("applicationsLoader").style.display = "none";
    document.getElementById("applicationsStats").style.display = "flex";
  } else {
    document.getElementById("applicationsSubmitted").innerText = 0;
    document.getElementById("applicationsHired").innerText = 0;
    document.getElementById("applicationsLoader").style.display = "none";
    document.getElementById("applicationsStats").style.display = "flex";
  }
  console.log("applicants data:", applicantResults);



  //fetch current stants / second row of cards

  const vacancyList = await getVacancyList();
  if (vacancyList.success) {
    vacancies.innerText = vacancyList.data.length;
    document.getElementById("activeVacanciesLoader").style.display = "none";
    document.getElementById("activeVacanciesStats").style.display = "flex";
  } else {
    vacancies.innerText = "0";
    document.getElementById("activeVacanciesLoader").style.display = "none";
    document.getElementById("activeVacanciesStats").style.display = "flex";
  }

  const establishmentList = await getEstablishmentList();
  if (establishmentList.success) {
    establishments.innerText = establishmentList.data.length;
    document.getElementById("activeEstablishmentsLoader").style.display = "none";
    document.getElementById("activeEstablishmentsStats").style.display = "flex";
  } else {
    establishments.innerText = "0";
    document.getElementById("activeEstablishmentsLoader").style.display = "none";
    document.getElementById("activeEstablishmentsStats").style.display = "flex";
  }

  const applicantList = await getApplicantList();
  if (applicantList.success) {
    applicants.innerText = applicantList.data.length;
    document.getElementById("activeApplicationsLoader").style.display = "none";
    document.getElementById("activeApplicationsStats").style.display = "flex";
  } else {
    applicants.innerText = "0";
    document.getElementById("activeApplicationsLoader").style.display = "none";
    document.getElementById("activeApplicationsStats").style.display = "flex";
  }

  const pendingUsersList = await getPendingUsersList();
  if (pendingUsersList.success) {
    pendingVerifications.innerText = pendingUsersList.data.length;
    document.getElementById("pendingUsersLoader").style.display = "none";
    document.getElementById("pendingUsersStats").style.display = "flex";
  } else {
    pendingVerifications.innerText = "0";
    document.getElementById("pendingUsersLoader").style.display = "none";
    document.getElementById("pendingUsersStats").style.display = "flex";
  }
}


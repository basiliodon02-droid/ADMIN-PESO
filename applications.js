/* ===========================
   LOGIN CHECK
=========================== */
if (localStorage.getItem("isLoggedIn") === "FALSE") {
  window.location.href = "./index.html";
}

/* ===========================
   DOM READY
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const on = (el, evt, fn) => el && el.addEventListener(evt, fn);

  /* ===========================
     PROFILE DROPDOWN
  =========================== */
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");

  on(profileIcon, "click", () => {
    profileDropdown.classList.toggle("show");
  });

  window.addEventListener("click", (e) => {
    if (
      profileIcon &&
      profileDropdown &&
      !profileIcon.contains(e.target) &&
      !profileDropdown.contains(e.target)
    ) {
      profileDropdown.classList.remove("show");
    }
  });

  /* ===========================
     SIDEBAR MENU
  =========================== */
  document.querySelectorAll(".toggle-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const submenu = btn.nextElementSibling;

      document.querySelectorAll(".submenu").forEach((list) => {
        if (list !== submenu) list.classList.remove("show");
      });

      document.querySelectorAll(".toggle-menu").forEach((b) => {
        if (b !== btn) b.classList.remove("open");
      });

      submenu.classList.toggle("show");
      btn.classList.toggle("open");
    });
  });

  /* ===========================
     SEARCH BAR (WORKING)
  =========================== */
  const searchInput = document.getElementById("searchInput");
  const tableBody = document.querySelector("#applicationsTable tbody");

  on(searchInput, "keyup", function () {
    const value = this.value.toLowerCase();

    [...tableBody.rows].forEach((row) => {
      row.style.display = row.textContent
        .toLowerCase()
        .includes(value)
        ? ""
        : "none";
    });
  });
});

/* ===========================
   LOAD APPLICANTS
=========================== */
window.onload = loadApplicants;

async function loadApplicants() {
  const results = await getApplicantsList();

  if (!results.success) {
    alert(results.message);
    return;
  }

  const tableBody = document.querySelector("#applicationsTable tbody");
  tableBody.innerHTML = "";

  let index = 0;

  for (let i = 0; i < results.data.length; i++) {
    const vacancyResults = await getVacancyDetailsById(
      results.data[i].job_vacancy_id
    );

    if (!vacancyResults.success || vacancyResults.data.length === 0) continue;

    const establishmentResults = await getEstablishmentDetailsById(
      vacancyResults.data[0].establishment_id
    );

    if (
      !establishmentResults.success ||
      establishmentResults.data.length === 0
    )
      continue;

    index++;

    tableBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${index}</td>
        <td>${results.data[i].firstName}</td>
        <td>${results.data[i].middleName ?? ""}</td>
        <td>${results.data[i].lastName ?? ""}</td>
        <td>${results.data[i].suffix ?? ""}</td>
        <td>${vacancyResults.data[0].job_title}</td>
        <td>${establishmentResults.data[0].establishmentName}</td>
        <td>${results.data[i].applicationStatus}</td>
        <td>${results.data[i].createdDate}</td>
      </tr>
      `
    );
  }
}

/* ===========================
   SUPABASE FUNCTIONS
=========================== */
async function getApplicantsList() {
  const { data, error } = await supabase
    .from("JobApplication")
    .select("*")
    .order("application_id", { ascending: true });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

async function getVacancyDetailsById(vacancyId) {
  const { data, error } = await supabase
    .from("JobVacancy")
    .select("*")
    .eq("vacancy_id", vacancyId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

async function getEstablishmentDetailsById(establishmentId) {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .eq("establishment_id", establishmentId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

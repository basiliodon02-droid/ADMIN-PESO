(() => {
  // -----------------------
  // ✅ Ensure Supabase is initialized
  // -----------------------
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", async () => {
    // -----------------------
    // Login check
    // -----------------------
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
    }

    // -----------------------
    // DOM elements
    // -----------------------
    const profileMenu = document.getElementById("profile-menu");
    const establishments = document.getElementById("establishments");
    const vacancies = document.getElementById("vacancies");
    const applicants = document.getElementById("applicants");
    const pendingVerifications = document.getElementById(
      "pendingVerifications"
    );
    const dateFromInput = document.getElementById("dateFrom");
    const dateToInput = document.getElementById("dateTo");

    dateToInput.value = new Date().toISOString().split("T")[0];
    dateFromInput.value = new Date("2025-10-01").toISOString().split("T")[0];

    // -----------------------
    // Sidebar submenu toggle
    // -----------------------
    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        document.querySelectorAll(".submenu").forEach((list) => {
          if (list !== submenu) list.classList.remove("show");
        });
        submenu?.classList.toggle("show");
      });
    });

    // -----------------------
    // Profile toggle
    // -----------------------
    window.toggleProfileMenu = () => profileMenu?.classList.toggle("show");

    // -----------------------
    // Date change handler
    // -----------------------
    async function onDateChange() {
      const dateFrom = dateFromInput.value || null;
      const dateTo = dateToInput.value || null;

      // hide stats and show loaders
      const statsIds = [
        "workerStats",
        "employerStats",
        "vacanciesStats",
        "applicationsStats",
      ];
      const loaderIds = [
        "workerLoader",
        "employerLoader",
        "vacanciesLoader",
        "applicationsLoader",
      ];
      statsIds.forEach(
        (id) => (document.getElementById(id).style.display = "none")
      );
      loaderIds.forEach(
        (id) => (document.getElementById(id).style.display = "flex")
      );

      // -----------------------
      // Workers
      // -----------------------
      const workerResults = await getWorkersListByDate(dateFrom, dateTo);
      document.getElementById("workers").innerText = workerResults.success
        ? workerResults.activeCount
        : 0;
      document.getElementById("workers-inactive").innerText =
        workerResults.success
          ? workerResults.totalCount - workerResults.activeCount
          : 0;
      document.getElementById("workerLoader").style.display = "none";
      document.getElementById("workerStats").style.display = "flex";

      // -----------------------
      // Employers
      // -----------------------
      const employerResults = await getEmployerListByDate(dateFrom, dateTo);
      document.getElementById("employers").innerText = employerResults.success
        ? employerResults.activeCount
        : 0;
      document.getElementById("employers-inactive").innerText =
        employerResults.success
          ? employerResults.totalCount - employerResults.activeCount
          : 0;
      document.getElementById("employerLoader").style.display = "none";
      document.getElementById("employerStats").style.display = "flex";

      // -----------------------
      // Job Vacancies
      // -----------------------
      const vacancyResults = await getVacanciesListByDate(dateFrom, dateTo);
      document.getElementById("postedVacancies").innerText =
        vacancyResults.success ? vacancyResults.activeCount : 0;
      document.getElementById("closedVacancies").innerText =
        vacancyResults.success ? vacancyResults.closedCount : 0;
      document.getElementById("vacanciesLoader").style.display = "none";
      document.getElementById("vacanciesStats").style.display = "flex";

      // -----------------------
      // Applicants
      // -----------------------
      const applicantResults = await getApplicantListByDate(dateFrom, dateTo);
      document.getElementById("applicationsSubmitted").innerText =
        applicantResults.success ? applicantResults.totalCount : 0;
      document.getElementById("applicationsHired").innerText =
        applicantResults.success ? applicantResults.hiredCount : 0;
      document.getElementById("applicationsLoader").style.display = "none";
      document.getElementById("applicationsStats").style.display = "flex";
    }

    dateFromInput.addEventListener("change", onDateChange);
    dateToInput.addEventListener("change", onDateChange);

    // -----------------------
    // Initial load on window
    // -----------------------
    window.onload = async () => {
      await onDateChange();

      // -----------------------
      // Second row stats
      // -----------------------
      const [vacancyList, establishmentList, applicantList, pendingUsersList] =
        await Promise.all([
          getVacancyList(),
          getEstablishmentList(),
          getApplicantList(),
          getPendingUsersList(),
        ]);

      if (vacancyList.success) {
        vacancies.innerText = vacancyList.data.length;
        document.getElementById("activeVacanciesLoader").style.display = "none";
        document.getElementById("activeVacanciesStats").style.display = "flex";
      }

      if (establishmentList.success) {
        establishments.innerText = establishmentList.data.length;
        document.getElementById("activeEstablishmentsLoader").style.display =
          "none";
        document.getElementById("activeEstablishmentsStats").style.display =
          "flex";
      }

      if (applicantList.success) {
        applicants.innerText = applicantList.data.length;
        document.getElementById("activeApplicationsLoader").style.display =
          "none";
        document.getElementById("activeApplicationsStats").style.display =
          "flex";
      }

      if (pendingUsersList.success) {
        pendingVerifications.innerText = pendingUsersList.data.length;
        document.getElementById("pendingUsersLoader").style.display = "none";
        document.getElementById("pendingUsersStats").style.display = "flex";
      }
    };
  });

  // -----------------------
  // Supabase helpers
  // -----------------------
  async function safeQuery(queryFunc) {
    try {
      return await queryFunc();
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message || "Error", data: [] };
    }
  }

  async function getWorkersListByDate(dateFrom, dateTo) {
    return safeQuery(async () => {
      let query = supabase
        .from("Users")
        .select("*")
        .eq("role", "Worker")
        .order("user_id", { ascending: true });
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      const { data, error } = await query;
      if (error) throw error;

      const totalCount = data.length;
      const activeCount = data.filter((u) => u.status === "Active").length;
      const pendingCount = data.filter((u) => u.status === "Pending").length;
      const deletedCount = data.filter((u) => u.status !== "Deleted").length;
      const workerList = data.filter((u) => u.role === "Worker");

      return {
        success: true,
        data: workerList,
        totalCount,
        activeCount,
        pendingCount,
        deletedCount,
      };
    });
  }

  async function getEmployerListByDate(dateFrom, dateTo) {
    return safeQuery(async () => {
      let query = supabase
        .from("Users")
        .select("*")
        .eq("role", "Employer")
        .order("user_id", { ascending: true });
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      const { data, error } = await query;
      if (error) throw error;

      const totalCount = data.length;
      const activeCount = data.filter((u) => u.status === "Active").length;
      return { success: true, data, totalCount, activeCount };
    });
  }

  async function getVacanciesListByDate(dateFrom, dateTo) {
    return safeQuery(async () => {
      let query = supabase
        .from("JobVacancy")
        .select("*")
        .order("vacancy_id", { ascending: true });
      if (dateFrom) query = query.gte("created_date", dateFrom);
      if (dateTo) query = query.lte("created_date", dateTo);
      const { data, error } = await query;
      if (error) throw error;

      const totalCount = data.length;
      const activeCount = data.filter((v) => v.status === "Active").length;
      const closedCount = data.filter((v) => v.status === "Closed").length;
      return { success: true, data, totalCount, activeCount, closedCount };
    });
  }

  async function getApplicantListByDate(dateFrom, dateTo) {
    return safeQuery(async () => {
      let query = supabase
        .from("JobApplication")
        .select("*")
        .order("application_id", { ascending: true });
      if (dateFrom) query = query.gte("createdDate", dateFrom);
      if (dateTo) query = query.lte("createdDate", dateTo);
      const { data, error } = await query;
      if (error) throw error;

      const totalCount = data.length;
      const hiredCount = data.filter(
        (a) => a.applicationStatus === "Hired"
      ).length;
      const notHiredCount = data.filter(
        (a) => a.applicationStatus !== "Hired"
      ).length;
      const forReviewList = data.filter(
        (a) => a.applicationStatus === "For Review"
      );

      return {
        success: true,
        data: forReviewList,
        totalCount,
        hiredCount,
        notHiredCount,
      };
    });
  }

  async function getVacancyList() {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from("JobVacancy")
        .select("*")
        .eq("status", "Active")
        .order("vacancy_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    });
  }

  async function getEstablishmentList() {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from("Establishment")
        .select("*")
        .eq("status", "Active")
        .order("establishment_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    });
  }

  async function getApplicantList() {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from("JobApplication")
        .select("*")
        .eq("applicationStatus", "For Review")
        .order("application_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    });
  }

  async function getPendingUsersList() {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .eq("status", "Pending")
        .order("user_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    });
  }
})();

document.getElementById("activeVacanciesStats").style.display = "none";
document.getElementById("activeEstablishmentsStats").style.display = "none";
document.getElementById("activeApplicationsStats").style.display = "none";
document.getElementById("pendingUsersStats").style.display = "none";
const statsIds = [
  "workerStats",
  "employerStats",
  "vacanciesStats",
  "applicationsStats",
];
const loaderIds = [
  "workerLoader",
  "employerLoader",
  "vacanciesLoader",
  "applicationsLoader",
];
statsIds.forEach((id) => (document.getElementById(id).style.display = "none"));
loaderIds.forEach((id) => (document.getElementById(id).style.display = "flex"));

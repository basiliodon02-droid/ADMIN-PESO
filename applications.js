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

    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");
    const searchInput = document.getElementById("searchInput");
    const tableBody = document.querySelector("#applicationsTable tbody");

    const printButton = document.getElementById("print");
    printButton.addEventListener("click", printVisibleApplicants);

    // -----------------------
    // Profile dropdown
    // -----------------------
    profileIcon?.addEventListener("click", () =>
      profileDropdown?.classList.toggle("show")
    );
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

    // -----------------------
    // Sidebar toggle
    // -----------------------
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

        submenu?.classList.toggle("show");
        btn.classList.toggle("open");
      });
    });

    // -----------------------
    // Search filter
    // -----------------------
    searchInput?.addEventListener("keyup", (e) => {
      const filter = e.target.value.toLowerCase();
      Array.from(tableBody?.rows || []).forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(filter)
          ? ""
          : "none";
      });
    });

    // -----------------------
    // Load applicants
    // -----------------------
    await loadApplicants();
  });

  // -----------------------
  // Load Applicants
  // -----------------------
  async function loadApplicants() {
    try {
      const results = await getApplicantsList();
      if (!results.success) {
        alert(results.message);
        return;
      }

      const tableBody = document.querySelector("#applicationsTable tbody");
      tableBody.innerHTML = "";

      let index = 0;

      for (const applicant of results.data) {
        // Get vacancy (safe fallback)
        const vacancyRes = await getVacancyDetailsById(
          applicant.job_vacancy_id
        );
        const vacancy =
          vacancyRes.success && vacancyRes.data?.[0]
            ? vacancyRes.data[0]
            : null;

        // Get establishment (safe fallback)
        const estRes = vacancy?.establishment_id
          ? await getEstablishmentDetailsById(vacancy.establishment_id)
          : null;

        const establishment =
          estRes?.success && estRes.data?.[0] ? estRes.data[0] : null;

        index++;

        tableBody.insertAdjacentHTML(
          "beforeend",
          `<tr>
          <td>${index}</td>
          <td>${applicant.firstName ?? ""}</td>
          <td>${applicant.middleName ?? ""}</td>
          <td>${applicant.lastName ?? ""}</td>
          <td>${applicant.suffix ?? ""}</td>
          <td>${vacancy?.job_title ?? "No Data"}</td>
          <td>${establishment?.establishmentName ?? "No Data"}</td>
          <td>${applicant.applicationStatus ?? "-"}</td>
          <td>${
            applicant.createdDate
              ? new Date(applicant.createdDate).toLocaleDateString()
              : "-"
          }</td>
        </tr>`
        );
      }
    } catch (error) {
      console.error("Error loading applicants:", error);
      alert("Failed to load applicants. Check console for details.");
    }
  }

  // -----------------------
  // Supabase functions
  // -----------------------
  async function getApplicantsList() {
    try {
      const { data, error } = await supabase
        .from("JobApplication")
        .select("*")
        .order("application_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Error fetching applicants.",
      };
    }
  }

  async function getVacancyDetailsById(vacancyId) {
    try {
      const { data, error } = await supabase
        .from("JobVacancy")
        .select("*")
        .eq("vacancy_id", vacancyId);
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Error fetching vacancy details.",
      };
    }
  }

  async function getEstablishmentDetailsById(establishmentId) {
    try {
      const { data, error } = await supabase
        .from("Establishment")
        .select("*")
        .eq("establishment_id", establishmentId);
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Error fetching establishment details.",
      };
    }
  }

  function printVisibleApplicants() {
    const tableBody = document.querySelector("#applicationsTable tbody");

    const rows = Array.from(tableBody.querySelectorAll("tr")).filter(
      (row) => row.style.display !== "none"
    );

    if (rows.length === 0) {
      alert("No visible data to print.");
      return;
    }

    let tableRows = "";

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");

      tableRows += `
      <tr>
        <td>${cells[0].textContent}</td>
        <td>${cells[1].textContent}</td>
        <td>${cells[2].textContent}</td>
        <td>${cells[3].textContent}</td>
        <td>${cells[4].textContent}</td>
        <td>${cells[5].textContent}</td>
        <td>${cells[6].textContent}</td>
        <td>${cells[7].textContent}</td>
        <td>${cells[8].textContent}</td>
      </tr>
    `;
    });

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Job Applicants</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h2 {
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
          }
          th {
            background: #f2f2f2;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <h2>Job Applicant List</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Last Name</th>
              <th>Suffix</th>
              <th>Job Title</th>
              <th>Establishment</th>
              <th>Status</th>
              <th>Date Applied</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
})();

(() => {
  // ✅ Ensure Supabase is initialized
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", async () => {
    // Redirect if not logged in
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
    }

    const userId = localStorage.getItem("userId");
    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");
    const vacancyBody = document.getElementById("vacancyBody");
    const jobModal = document.getElementById("jobModal");
    const addBtn = document.getElementById("addBtn");
    const cancelModal = document.getElementById("cancelModal");
    const jobForm = document.getElementById("jobForm");
    const viewOverlay = document.getElementById("viewOverlay");
    const viewDetails = document.getElementById("viewDetails");
    const closeView = document.getElementById("closeView");
    const deleteOverlay = document.getElementById("deleteOverlay");

    // -----------------------
    // Profile dropdown toggle
    // -----------------------
    profileIcon.addEventListener("click", () => {
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
      if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove("show");
      }
    });

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
        submenu.classList.toggle("show");
      });
    });

    // -----------------------
    // Load dropdowns & vacancies
    // -----------------------
    await getAllIndustry();
    await getAllEstablishment();
    await renumberJobVacancy();

    // -----------------------
    // JOB VACANCY FUNCTIONS
    // -----------------------
    async function renumberJobVacancy() {
      vacancyBody.innerHTML = `<tr><td colspan=10 style='text-align:center;'>LOADING...</td></tr>`;

      const result = await getVacancyList();
      if (!result.success) {
        alert(result.message);
        return;
      }

      vacancyBody.innerHTML = "";

      for (const item of result.data) {
        const { vacancy_id, job_title, industry_id, establishment_id, location, employment_type, status, created_date } = item;

        const industryRes = await getIndustryById(industry_id);
        const establishmentRes = await getEstablishmentById(establishment_id);

        const industryName = (industryRes.success && industryRes.data[0]) ? industryRes.data[0].industry_name : "-";
        const establishmentName = (establishmentRes.success && establishmentRes.data[0]) ? establishmentRes.data[0].establishmentName : "-";
        console.log(establishmentRes);
        const index = vacancyBody.rows.length + 1;

        vacancyBody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${index}</td>
            <td>${job_title ?? "-"}</td>
            <td>${industryName}</td>
            <td>${establishmentName}</td>
            <td>${location ?? "-"}</td>
            <td>${employment_type ?? "-"}</td>
            <td><span class="badge ${status === "Active" ? "active" : "pending"}">${status ?? '-'}</span></td>
            <td>${created_date ? new Date(created_date).toISOString().split("T")[0] : "-"}</td>
            <td class="action-icons">
              <i class="bi bi-eye-fill icon-view" title="View"></i>
              <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
              <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
            </td>
            <td style="display:none;">${vacancy_id}</td>
            <td style="display:none;">${industry_id}</td>
            <td style="display:none;">${establishment_id}</td>
          </tr>
        `);
      }
    }

    // -----------------------
    // CRUD FUNCTIONS
    // -----------------------
    async function getIndustryList() {
      const { data, error } = await supabase.from("Industry").select("*").order("industry_id", { ascending: true });
      return error ? { success: false, message: error.message, data: [] } : { success: true, message: "got it", data };
    }

    async function getEstablishmentList() {
      const { data, error } = await supabase.from("Establishment").select("*").order("establishment_id", { ascending: true });
      return error ? { success: false, message: error.message, data: [] } : { success: true, message: "got it", data };
    }

    async function getVacancyList() {
      const { data, error } = await supabase.from("JobVacancy").select("*").neq("status", "Deleted").order("vacancy_id", { ascending: true });
      return error ? { success: false, message: error.message, data: [] } : { success: true, message: "got it", data };
    }

    async function getIndustryById(industry_id) {
      const { data, error } = await supabase.from("Industry").select("*").eq("industry_id", industry_id);
      return error ? { success: false, message: error.message, data: [] } : { success: true, message: "got it", data };
    }

    async function getEstablishmentById(establishment_id) {
      const { data, error } = await supabase.from("Establishment").select("*").eq("establishment_id", establishment_id);
      return error ? { success: false, message: error.message, data: [] } : { success: true, message: "got it", data };
    }

    async function addVacancy(job_title, industry_id, establishment_id, location, employmentType, status, user_id) {
      const { error } = await supabase.from("JobVacancy").insert([{ job_title, industry_id, establishment_id, location, employment_type: employmentType, status, user_id }]);
      return error ? { success: false, message: error.message } : { success: true, message: "Job Vacancy Added!" };
    }

    async function editVacancy(vacancy_id, job_title, industry_id, establishment_id, location, employmentType, status) {
      const { error } = await supabase.from("JobVacancy").update({ job_title, industry_id, establishment_id, location, employment_type: employmentType, status }).eq("vacancy_id", vacancy_id);
      return error ? { success: false, message: error.message } : { success: true, message: "Job Vacancy Updated!" };
    }

    async function deleteVacancy(vacancy_id) {
      const { data, error } = await supabase.from("JobVacancy").update({ status: "Deleted" }).eq("vacancy_id", vacancy_id).select();
      if (error || data.length === 0) return { success: false, message: error?.message || "Deletion failed" };
      return { success: true, message: "Job Vacancy Deleted!" };
    }

    // -----------------------
    // Fill dropdowns
    // -----------------------
    async function getAllIndustry() {
      const result = await getIndustryList();
      if (!result.success) return alert(result.message);
      const select = document.getElementById("industry");
      result.data.forEach(i => select.appendChild(new Option(i.industry_name, i.industry_id)));
    }

    async function getAllEstablishment() {
      const result = await getEstablishmentList();
      if (!result.success) return alert(result.message);
      const select = document.getElementById("establishment");
      result.data.forEach(e => select.appendChild(new Option(e.establishmentName, e.establishment_id)));
    }

    // -----------------------
    // Add/Edit modal
    // -----------------------
    addBtn.onclick = () => {
      document.getElementById("modalTitle").textContent = "Add Job Vacancy";
      jobForm.reset();
      document.getElementById("jobVacancyId").value = "";
      jobModal.style.display = "flex";
    };

    cancelModal.onclick = () => jobModal.style.display = "none";

    jobForm.onsubmit = async (e) => {
      e.preventDefault();
      const vacancyData = {
        user_id: userId,
        jobTitle: jobForm.jobTitle.value,
        industry: jobForm.industry.value,
        establishment: jobForm.establishment.value,
        location: jobForm.location.value,
        employmentType: jobForm.employmentType.value,
        status: jobForm.status.value
      };

      const jobVacancyId = document.getElementById("jobVacancyId").value;
      let result;
      if (jobVacancyId) {
        result = await editVacancy(jobVacancyId, vacancyData.jobTitle, vacancyData.industry, vacancyData.establishment, vacancyData.location, vacancyData.employmentType, vacancyData.status);
      } else {
        result = await addVacancy(vacancyData.jobTitle, vacancyData.industry, vacancyData.establishment, vacancyData.location, vacancyData.employmentType, vacancyData.status, userId);
      }

      alert(result.message);
      if (result.success) {
        renumberJobVacancy();
        jobModal.style.display = "none";
      }
    };

    // -----------------------
    // View/Edit/Delete handlers
    // -----------------------
    vacancyBody.addEventListener("click", (e) => {
      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");

      if (iconView) {
        const row = iconView.closest("tr");
        viewDetails.innerHTML = `
          <p><b>Job Title:</b> ${row.children[1].textContent}</p>
          <p><b>Industry:</b> ${row.children[2].textContent}</p>
          <p><b>Establishment:</b> ${row.children[3].textContent}</p>
          <p><b>Location:</b> ${row.children[4].textContent}</p>
          <p><b>Employment Type:</b> ${row.children[5].textContent}</p>
          <p><b>Status:</b> ${row.children[6].textContent}</p>
          <p><b>Date Posted:</b> ${row.children[7].textContent}</p>
        `;
        viewOverlay.style.display = "flex";
        viewOverlay.setAttribute("aria-hidden", "false");
      }

      if (iconEdit) {
        const row = iconEdit.closest("tr");
        document.getElementById("modalTitle").textContent = "Edit Job Vacancy";
        jobForm.jobTitle.value = row.children[1].textContent;
        jobForm.industry.value = row.children[10].textContent;
        jobForm.establishment.value = row.children[11].textContent;
        jobForm.location.value = row.children[4].textContent;
        jobForm.employmentType.value = row.children[5].textContent;
        jobForm.status.value = row.children[6].textContent;
        document.getElementById("jobVacancyId").value = row.children[9].textContent;
        jobModal.style.display = "flex";
      }

      if (iconDelete) {
        const row = iconDelete.closest("tr");
        deleteOverlay.style.display = "flex";
        deleteOverlay.setAttribute("aria-hidden", "false");
        document.getElementById("jobVacancyId").value = row.children[9].textContent;
        document.getElementById("deleteLabel").textContent = `Are you sure you want to delete "${row.children[1].textContent}"?`;
        document.getElementById("confirmDelete").onclick = async () => {
          const result = await deleteVacancy(row.children[9].textContent);
          alert(result.message);
          if (result.success) {
            renumberJobVacancy();
            deleteOverlay.style.display = "none";
            deleteOverlay.setAttribute("aria-hidden", "true");
          }
        };
      }
    });

    // Close modals
    document.getElementById("cancelDelete").onclick = () => {
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
    };
    closeView.onclick = () => {
      viewOverlay.style.display = "none";
      viewOverlay.setAttribute("aria-hidden", "true");
    };

    window.onclick = (e) => {
      if (e.target.classList.contains("modal")) e.target.style.display = "none";
      if (e.target === viewOverlay) viewOverlay.style.display = "none";
      if (e.target === deleteOverlay || e.target.classList.contains("skl-overlay")) deleteOverlay.style.display = "none";
    };

    // Search filter
    document.getElementById("searchInput").addEventListener("keyup", (e) => {
      const filter = e.target.value.toLowerCase();
      Array.from(vacancyBody.children).forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
      });
    });
  });
})();

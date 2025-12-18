(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", async function () {
    // -----------------------------
    // LOGIN CHECK
    // -----------------------------
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
    }

    // -----------------------------
    // PROFILE MENU TOGGLE
    // -----------------------------
    const profileIcon = document.getElementById("profile-icon");
    const profileMenu = document.getElementById("profile-menu");

    profileIcon.addEventListener("click", () => {
      profileMenu.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
      if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("show");
      }
    });

    // -----------------------------
    // SIDEBAR SUBMENU TOGGLE
    // -----------------------------
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

    // -----------------------------
    // DOM ELEMENTS
    // -----------------------------
    const tableBody = document.getElementById("skilledTableBody");
    const addEditModal = document.getElementById("addEditModal");
    const addEditTitle = document.getElementById("addEditTitle");
    const jobTitleInput = document.getElementById("jobTitleInput");
    const industryInput = document.getElementById("industryInput");
    const skilledJobIdInput = document.getElementById("skilledJobIdInput");

    const viewOverlay = document.getElementById("viewOverlay");
    const viewDetails = document.getElementById("viewDetails");

    const deleteOverlay = document.getElementById("deleteOverlay");
    const deleteLabel = document.getElementById("deleteLabel");
    const deleteSkilledJobIdInput = document.getElementById(
      "deleteSkilledJobIdInput"
    );

    let editingRowIndex = null;
    let deleteRowIndex = null;

    // -----------------------------
    // INITIAL LOAD
    // -----------------------------
    await getAllIndustry();
    await renumberSkilledJobs();

    // -----------------------------
    // OPEN ADD MODAL
    // -----------------------------
    document.getElementById("openAddModalBtn").addEventListener("click", () => {
      editingRowIndex = null;
      addEditTitle.textContent = "Add Skilled Job";
      jobTitleInput.value = "";
      industryInput.value = "";
      addEditModal.style.display = "flex";
      addEditModal.setAttribute("aria-hidden", "false");
      jobTitleInput.focus();
    });

    // -----------------------------
    // CANCEL ADD/EDIT
    // -----------------------------
    document
      .getElementById("cancelAddEditBtn")
      .addEventListener("click", () => {
        addEditModal.style.display = "none";
        addEditModal.setAttribute("aria-hidden", "true");
      });

    // -----------------------------
    // SAVE SKILLED JOB (ADD/EDIT)
    // -----------------------------
    document.getElementById("saveJobBtn").addEventListener("click", async () => {
      const title = jobTitleInput.value.trim();
      const industry = industryInput.value.trim();
      if (!title) return jobTitleInput.focus();
      if (!industry) return industryInput.focus();

      const industryId = await getSelectedindustryId(industry);

      if (editingRowIndex === null) {
        // ADD
        const checkIndustryJobResult = await checkIndustryJob(
          industryId.data[0].industry_id
        );
        if (checkIndustryJobResult.data.length > 0) {
          alert(
            "Industry is already assigned to another job. Please choose a different industry."
          );
          return;
        }

        const result = await addSkilledJob(title);
        if (!result.success) return alert(result.message);

        const jobId = await getNewJobId();
        const assignment = await setJobIndustryAssignment(
          industryId.data[0].industry_id,
          jobId.data[0].job_id
        );
        if (!assignment.success) return alert(assignment.message);

        await renumberSkilledJobs();
        addEditModal.style.display = "none";
        addEditModal.setAttribute("aria-hidden", "true");
        alert(assignment.message);
      } else {
        // EDIT
        const skillsId = skilledJobIdInput.value.trim();
        const result = await editSkilledJob(
          skillsId,
          title,
          industryId.data[0].industry_id
        );
        if (!result.success) return alert(result.message);

        const editIndustryJobResult = await editJobIndustryAssignment(
          industryId.data[0].industry_id,
          skillsId
        );
        if (!editIndustryJobResult.success) return alert(editIndustryJobResult.message);

        alert(result.message);
        alert(editIndustryJobResult.message);
        await renumberSkilledJobs();
        addEditModal.style.display = "none";
        addEditModal.setAttribute("aria-hidden", "true");
      }
    });

    // -----------------------------
    // TABLE ACTIONS (VIEW/EDIT/DELETE)
    // -----------------------------
    tableBody.addEventListener("click", async (e) => {
      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");

      if (iconView) {
        const row = iconView.closest("tr");
        const title = row.children[1].textContent.trim();
        const industry = row.children[2].textContent.trim();
        viewDetails.innerHTML = `
          <p><b>Job Title:</b> <span>${title}</span></p>
          <p><b>Industry:</b> <span>${industry}</span></p>
        `;
        viewOverlay.style.display = "flex";
        viewOverlay.setAttribute("aria-hidden", "false");
        return;
      }

      if (iconEdit) {
        const row = iconEdit.closest("tr");
        editingRowIndex = row.rowIndex - 1;
        addEditTitle.textContent = "Edit Skilled Job";
        jobTitleInput.value = row.children[1].textContent.trim();
        skilledJobIdInput.value = row.children[4].textContent.trim();
        industryInput.value = row.children[2].textContent.trim() === "-" ? "" : row.children[2].textContent.trim();
        addEditModal.style.display = "flex";
        addEditModal.setAttribute("aria-hidden", "false");
        jobTitleInput.focus();
        return;
      }

      if (iconDelete) {
        const row = iconDelete.closest("tr");
        deleteRowIndex = row.rowIndex - 1;
        const title = row.children[1].textContent.trim();
        deleteSkilledJobIdInput.value = row.children[4].textContent.trim();
        deleteLabel.textContent = `Are you sure you want to delete "${title}"?`;
        deleteOverlay.style.display = "flex";
        deleteOverlay.setAttribute("aria-hidden", "false");
        return;
      }
    });

    // -----------------------------
    // CLOSE MODALS
    // -----------------------------
    document.getElementById("closeView").addEventListener("click", () => {
      viewOverlay.style.display = "none";
      viewOverlay.setAttribute("aria-hidden", "true");
    });

    document
      .getElementById("cancelDeleteBtn")
      .addEventListener("click", () => {
        deleteOverlay.style.display = "none";
        deleteOverlay.setAttribute("aria-hidden", "true");
        deleteRowIndex = null;
      });

    document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
      const job_id = deleteSkilledJobIdInput.value.trim();
      if (!job_id) return;

      const checkSkillAssignmentResult = await checkIfSkilledJobIsUsed(job_id);
      if (checkSkillAssignmentResult.data.length > 0) {
        return alert(
          "Some Skills are using this Job Role. Please modify the said Skills first."
        );
      }

      const result = await deleteJobIndustryAssignment(job_id);
      if (!result.success) return alert(result.message);

      const skilledJobResult = await deleteSkilledJob(job_id);
      if (!skilledJobResult.success) return alert(skilledJobResult.message);

      await renumberSkilledJobs();
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
      deleteRowIndex = null;
    });

    window.addEventListener("click", (e) => {
      [addEditModal, viewOverlay, deleteOverlay].forEach((modal) => {
        if (e.target === modal) {
          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
          deleteRowIndex = null;
        }
      });
    });

    // -----------------------------
    // SEARCH FILTER
    // -----------------------------
    document.getElementById("searchInput").addEventListener("input", () => {
      const q = document.getElementById("searchInput").value.toLowerCase();
      [...tableBody.rows].forEach((row) => {
        const title = row.children[1].textContent.toLowerCase();
        const industry = row.children[2].textContent.toLowerCase();
        row.style.display = title.includes(q) || industry.includes(q) ? "" : "none";
      });
    });

    // -----------------------------
    // HELPER FUNCTIONS
    // -----------------------------
    async function renumberSkilledJobs() {
      const result = await getSkilledJobList();
      if (!result.success) return alert(result.message);

      tableBody.innerHTML = "";
      result.data.forEach((item, i) => {
        tableBody.insertAdjacentHTML(
          "beforeend",
          `<tr>
            <td>${i + 1}</td>
            <td>${item.SkilledJob.job_name}</td>
            <td>${item.Industry.industry_name}</td>
            <td class="action-icons">
              <i class="bi bi-eye-fill icon-view" title="View"></i>
              <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
              <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
            </td>
            <td style='display:none;'>${item.SkilledJob.job_id}</td>
          </tr>`
        );
      });
    }

    async function getAllIndustry() {
      const result = await getIndustryList();
      if (!result.success) return alert(result.message);

      industryInput.innerHTML = '<option value="" disabled>Select Industry</option>';
      result.data.forEach((item) => {
        const option = document.createElement("option");
        option.text = item.industry_name;
        option.value = item.industry_name;
        industryInput.appendChild(option);
      });
    }

    // -----------------------------
    // DATABASE FUNCTIONS
    // -----------------------------
    async function getIndustryList() {
      const { data, error } = await supabase.from("Industry").select("*").order("industry_id");
      return error ? { success: false, message: error.message } : { success: true, data };
    }

    async function getSkilledJobList() {
      const { data, error } = await supabase
        .from("IndustryJobs")
        .select("industry_id,job_id,Industry(*),SkilledJob(*)")
        .order("job_id");
      return error ? { success: false, message: error.message } : { success: true, data };
    }

    async function checkIndustryJob(industry_id) {
      const { data, error } = await supabase.from("IndustryJobs").select("industry_id").eq("industry_id", industry_id);
      return error ? { success: false, message: error.message } : { success: true, data };
    }

    async function getSelectedindustryId(industry) {
      const { data, error } = await supabase.from("Industry").select("industry_id").eq("industry_name", industry);
      return error ? { success: false, message: error.message } : { success: true, data };
    }

    async function getNewJobId() {
      const { data, error } = await supabase.from("SkilledJob").select("job_id").order("createdAt", { ascending: false }).limit(1);
      return error ? { success: false, message: error.message } : { success: true, data };
    }

    async function setJobIndustryAssignment(industryid, jobid) {
      const { error } = await supabase.from("IndustryJobs").insert([{ industry_id: industryid, job_id: jobid }]);
      return error ? { success: false, message: error.message } : { success: true, message: "Industry Job Assignment Added!" };
    }

    async function editJobIndustryAssignment(industry_id, job_id) {
      const { error } = await supabase.from("IndustryJobs").update({ industry_id }).eq("job_id", parseInt(job_id));
      return error ? { success: false, message: error.message } : { success: true, message: "Industry Job Assignment Updated!" };
    }

    async function deleteJobIndustryAssignment(job_id) {
      const { error } = await supabase.from("IndustryJobs").delete().eq("job_id", parseInt(job_id));
      return error ? { success: false, message: error.message } : { success: true, message: "Industry Job Deleted!" };
    }

    async function addSkilledJob(name) {
      const { error } = await supabase.from("SkilledJob").insert([{ job_name: name }]);
      return error ? { success: false, message: error.message } : { success: true, message: "Skilled Job Added!" };
    }

    async function editSkilledJob(job_id, name) {
      const { error } = await supabase.from("SkilledJob").update({ job_name: name }).eq("job_id", job_id);
      return error ? { success: false, message: error.message } : { success: true, message: "Skilled Job Updated!" };
    }

    async function deleteSkilledJob(job_id) {
      const { data, error } = await supabase.from("SkilledJob").delete().eq("job_id", job_id).select();
      if (error || data.length === 0) return { success: false, message: error?.message || "Foreign key prevents deletion." };
      return { success: true, message: "Skilled Job Deleted!" };
    }

    async function checkIfSkilledJobIsUsed(job_id) {
      const { data, error } = await supabase.from("SkillAssignment").select("*").eq("job_id", job_id);
      return error ? { success: false, message: error.message, data: {} } : { success: true, data };
    }
  });
})();

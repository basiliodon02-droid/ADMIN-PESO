(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }

  let addModal, editModal, viewOverlay, viewDetails, deleteOverlay, deleteRowIndex = null;

  document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTS
    const profileIcon = document.getElementById("profile-icon");
    const profileMenu = document.getElementById("profile-menu");

    addModal = document.getElementById("addModal");
    editModal = document.getElementById("editModal");
    viewOverlay = document.getElementById("viewOverlay");
    viewDetails = document.getElementById("viewDetails");
    deleteOverlay = document.getElementById("deleteOverlay");

    const tableBody = document.getElementById("employeeTableBody");

    const addEmployeeForm = document.getElementById("addEmployeeForm");
    const editEmployeeForm = document.getElementById("editEmpForm");

    // -----------------------
    // PROFILE MENU TOGGLE
    // -----------------------
    profileIcon?.addEventListener("click", () => {
      profileMenu?.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!profileIcon?.contains(e.target) && !profileMenu?.contains(e.target)) {
        profileMenu?.classList.remove("show");
      }
    });

    // -----------------------
    // SIDEBAR SUBMENU TOGGLE
    // -----------------------
    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const submenu = btn.nextElementSibling;
        if (submenu && submenu.classList.contains("submenu")) {
          e.preventDefault();
          document.querySelectorAll(".submenu").forEach((list) => {
            if (list !== submenu) list.classList.remove("show");
          });
          submenu.classList.toggle("show");
        }
      });
    });

    // -----------------------
    // MODAL BUTTONS
    // -----------------------
    document.getElementById("openAddModalBtn").addEventListener("click", () => {
      openModal(addModal);
    });

    document.getElementById("closeEmpModalBtn")?.addEventListener("click", () => closeModal(addModal));
    document.getElementById("cancelEmpEditBtn")?.addEventListener("click", () => closeModal(editModal));
    document.getElementById("closeView")?.addEventListener("click", () => closeModal(viewOverlay));
    document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => closeModal(deleteOverlay));

    // -----------------------
    // MODAL FUNCTIONS
    // -----------------------
    function openModal(modal) {
      modal.style.display = "flex";
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
    }

    window.addEventListener("click", (e) => {
      if (e.target === viewOverlay) closeModal(viewOverlay);
      if (e.target === deleteOverlay) closeModal(deleteOverlay);
      if (e.target === addModal) closeModal(addModal);
      if (e.target === editModal) closeModal(editModal);
    });

    // -----------------------
    // SEARCH
    // -----------------------
    document.getElementById("searchInput").addEventListener("keyup", (e) => {
      const q = e.target.value.toLowerCase();
      Array.from(tableBody.rows).forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });

    // -----------------------
    // EMPLOYEE LIST
    // -----------------------
    window.onload = renumberEmployees;

    async function renumberEmployees() {
      const getEmployees = await getEmployeeList();
      if (!getEmployees.success) {
        alert(getEmployees.message);
        return;
      }

      tableBody.innerHTML = "";
      getEmployees.data.forEach((emp, i) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${emp.firstName}</td>
          <td>${emp.middleName ?? ""}</td>
          <td>${emp.lastName ?? ""}</td>
          <td>${emp.suffix ?? ""}</td>
          <td>${emp.email}</td>
          <td>${statusBadge(emp.status)}</td>
          <td>${new Date(emp.created_at).toISOString().split("T")[0]}</td>
          <td style='font-size:14px;'>
            ${emp.street ? emp.street + ", " : ""}
            ${emp.barangay ? emp.barangay + ", " : ""}
            ${emp.city ? emp.city + ", " : ""}
            ${emp.municipality ?? ""}
          </td>
          <td>
            <div class="action-icons">
              <i class="bi bi-eye-fill icon-view" title="View"></i>
              <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
              <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
            </div>
          </td>
          <td style='display:none;'>${emp.user_id}</td>
          <td style='display:none;'>${emp.firstName}</td>
          <td style='display:none;'>${emp.lastName}</td>`;
      });
    }

    function statusBadge(text) {
      const t = (text || "").toLowerCase();
      if (t === "active") return '<span class="badge active">Active</span>';
      if (t === "pending") return '<span class="badge pending">Pending</span>';
      return '<span class="badge inactive">Inactive</span>';
    }

    // -----------------------
    // EMPLOYEE ACTIONS (VIEW, EDIT, DELETE)
    // -----------------------
    document.addEventListener("click", async (e) => {
      const row = e.target.closest("tr");
      if (!row) return;

      // VIEW
      if (e.target.classList.contains("icon-view")) {
        const fullName = `${row.children[1].textContent} ${row.children[2].textContent} ${row.children[3].textContent} ${row.children[4].textContent}`;
        viewDetails.innerHTML = `
          <p><b>Employee Name: </b><span>${fullName}</span></p>
          <p><b>Email: </b><span>${row.children[5].innerText}</span></p>
          <p><b>Status: </b><span>${row.children[6].innerText}</span></p>
          <p><b>Date Registered: </b><span>${row.children[7].innerText}</span></p>`;
        openModal(viewOverlay);
      }

      // EDIT
      if (e.target.classList.contains("icon-edit")) {
        editModal.dataset.row = row.rowIndex;
        document.getElementById("editEmpFirst").value = row.children[11].textContent;
        document.getElementById("editEmpLast").value = row.children[12].textContent;
        document.getElementById("editEmpEmail").value = row.children[5].textContent;
        document.getElementById("editEmpStatus").value = row.children[6].textContent;
        document.getElementById("editEmpUserId").value = row.children[10].textContent;
        openModal(editModal);
      }

      // DELETE
      if (e.target.classList.contains("icon-delete")) {
        deleteRowIndex = row.rowIndex;
        const fullName = `${row.children[1].textContent} ${row.children[2].textContent} ${row.children[3].textContent} ${row.children[4].textContent}`;
        document.getElementById("deleteEmpUserId").value = row.children[10].innerText;
        document.getElementById("deleteEmpBody").textContent = `Are you sure you want to delete "${fullName}"?`;
        openModal(deleteOverlay);
      }
    });

    // -----------------------
    // FORM SUBMISSIONS
    // -----------------------
    addEmployeeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const first = document.getElementById("empFirstName").value.trim();
      const last = document.getElementById("empLastName").value.trim();
      const email = document.getElementById("empEmail").value.trim();
      const stat = document.getElementById("empStatus").value;
      const result = await addEmployee(first, last, email, stat);
      alert(result.message);
      if (result.success) {
        renumberEmployees();
        closeModal(addModal);
        addEmployeeForm.reset();
      }
    });

    editEmployeeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("editEmpUserId").value;
      const first = document.getElementById("editEmpFirst").value.trim();
      const last = document.getElementById("editEmpLast").value.trim();
      const email = document.getElementById("editEmpEmail").value.trim();
      const stat = document.getElementById("editEmpStatus").value;
      const result = await editEmployee(userId, first, last, email, stat);
      alert(result.message);
      if (result.success) {
        renumberEmployees();
        closeModal(editModal);
      }
    });

    document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
      const userId = document.getElementById("deleteEmpUserId").value;
      const result = await deleteEmployer(userId);
      alert(result.message);
      if (result.success) {
        renumberEmployees();
        closeModal(deleteOverlay);
      }
    });

    // -----------------------
    // SUPABASE FUNCTIONS
    // -----------------------
    async function getEmployeeList() {
      const { data, error } = await supabase.from("Users").select("*").eq("role", "Worker").neq("status", "Deleted").order("user_id", { ascending: true });
      return error ? { message: error.message, success: false, data: {} } : { message: "got it", success: true, data };
    }

    async function addEmployee(first, last, email, stat) {
      const { data, error } = await supabase.from("Users").insert([{ email, password: "1234", role: "Worker", firstName: first, lastName: last, status: stat, created_at: new Date().toLocaleString() }]);
      if (error) return { message: error.message, success: false };
      return { message: "Employee Added!", success: true };
    }

    async function editEmployee(userId, first, last, email, stat) {
      const { error } = await supabase.from("Users").update({ email, firstName: first, lastName: last, status: stat }).eq("user_id", userId).select();
      if (error) return { message: error.message, success: false };
      return { message: "Worker Updated!", success: true };
    }

    async function deleteEmployer(userId) {
      const { error } = await supabase.from("Users").update({ status: "Deleted" }).eq("user_id", userId).select();
      return error ? { message: error.message, success: false } : { message: "Worker Deleted!", success: true };
    }
  });
})();

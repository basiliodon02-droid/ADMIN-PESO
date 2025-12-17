(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  let addModal, editModal, viewOverlay, viewDetails, deleteOverlay;
  let deleteRowIndex = null;

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
    const tableBody = document.getElementById("barangayTableBody");
    const openAddBtn = document.getElementById("openAddModalBtn");
    const closeViewBtn = document.getElementById("closeView");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const saveBarangayBtn = document.getElementById("saveBarangayBtn");
    const updateBarangayBtn = document.getElementById("updateBarangayBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const searchInput = document.getElementById("searchInput");

    addModal = document.getElementById("addModal");
    editModal = document.getElementById("editModal");
    viewOverlay = document.getElementById("viewOverlay");
    viewDetails = document.getElementById("viewDetails");
    deleteOverlay = document.getElementById("deleteOverlay");

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
    // Initial load
    // -----------------------
    await renumberBarangays();

    // -----------------------
    // Add Modal
    // -----------------------
    openAddBtn.onclick = () => showLayer(addModal);
    closeViewBtn.onclick = closeViewModal;
    cancelDeleteBtn.onclick = closeDeleteModal;

    saveBarangayBtn.onclick = async () => {
      const name = document.getElementById("addBarangayInput").value.trim();
      if (!name) return;
      const result = await addBarangay(name);
      alert(result.message);
      if (result.success) {
        document.getElementById("addBarangayInput").value = "";
        closeAddModal();
        await renumberBarangays();
      }
    };

    // -----------------------
    // Edit Modal
    // -----------------------
    updateBarangayBtn.onclick = async () => {
      const newName = document.getElementById("editBarangayInput").value.trim();
      const barangayId = document.getElementById("editBarangayId").value;
      if (!newName || !barangayId) return;
      const result = await editBarangay(barangayId, newName);
      alert(result.message);
      if (result.success) {
        document.getElementById("editBarangayInput").value = "";
        closeEditModal();
        await renumberBarangays();
      }
    };

    // -----------------------
    // Delete Barangay
    // -----------------------
    confirmDeleteBtn.onclick = async () => {
      const barangayId = document.getElementById("deleteBarangayId").value;
      if (!barangayId) return;
      const result = await deleteBarangay(barangayId);
      alert(result.message);
      if (result.success) {
        document.getElementById("deleteBarangayId").value = "";
        closeDeleteModal();
        await renumberBarangays();
      }
    };

    // -----------------------
    // Table row click (View/Edit/Delete)
    // -----------------------
    document.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row) return;

      if (e.target.classList.contains("icon-view")) {
        viewDetails.innerHTML = `<p><b>Barangay Name:</b><span>${row.children[1].innerText}</span></p>`;
        showLayer(viewOverlay);
      }

      if (e.target.classList.contains("icon-edit")) {
        editModal.dataset.row = row.rowIndex;
        document.getElementById("editBarangayInput").value = row.children[1].innerText;
        document.getElementById("editBarangayId").value = row.children[3].innerText;
        showLayer(editModal);
      }

      if (e.target.classList.contains("icon-delete")) {
        deleteRowIndex = row.rowIndex;
        document.getElementById("deleteBarangayId").value = row.children[3].innerText;
        showLayer(deleteOverlay);
      }
    });

    // -----------------------
    // Search filter
    // -----------------------
    searchInput.addEventListener("keyup", (e) => {
      const q = e.target.value.toLowerCase();
      Array.from(tableBody.rows).forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });

    // -----------------------
    // Close modals by clicking outside
    // -----------------------
    window.addEventListener("click", (e) => {
      if (e.target === viewOverlay) closeViewModal();
      if (e.target === deleteOverlay) closeDeleteModal();
      if (e.target === addModal) closeAddModal();
      if (e.target === editModal) closeEditModal();
    });
  });

  // -----------------------
  // Utility functions
  // -----------------------
  const showLayer = (el) => {
    el.style.display = "flex";
    el.setAttribute("aria-hidden", "false");
  };
  const closeAddModal = () => { addModal.style.display = "none"; addModal.setAttribute("aria-hidden", "true"); };
  const closeEditModal = () => { editModal.style.display = "none"; editModal.setAttribute("aria-hidden", "true"); };
  const closeViewModal = () => { viewOverlay.style.display = "none"; viewOverlay.setAttribute("aria-hidden", "true"); };
  const closeDeleteModal = () => { deleteOverlay.style.display = "none"; deleteOverlay.setAttribute("aria-hidden", "true"); deleteRowIndex = null; };

  // -----------------------
  // Load barangays
  // -----------------------
  async function renumberBarangays() {
    const result = await getBarangayList();
    if (!result.success) return alert(result.message);
    const tbody = document.getElementById("barangayTableBody");
    tbody.innerHTML = "";
    result.data.forEach((b, i) => {
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${i + 1}</td>
          <td>${b.name}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style='display:none;'>${b.barangay_id}</td>
        </tr>
      `);
    });
  }

  // -----------------------
  // Supabase CRUD functions
  // -----------------------
  async function getBarangayList() {
    try {
      const { data, error } = await supabase.from("Barangay").select("*").order("barangay_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, message: err.message || "Error", data: [] };
    }
  }

  async function addBarangay(name) {
    try {
      await supabase.from("Barangay").insert([{ name, createdAt: new Date().toISOString() }]);
      return { success: true, message: "Barangay Added!" };
    } catch (err) {
      return { success: false, message: err.message || "Error" };
    }
  }

  async function editBarangay(id, name) {
    try {
      await supabase.from("Barangay").update({ name, modifiedAt: new Date().toISOString() }).eq("barangay_id", id);
      return { success: true, message: "Barangay Updated!" };
    } catch (err) {
      return { success: false, message: err.message || "Error" };
    }
  }

  async function deleteBarangay(id) {
    try {
      const { data, error } = await supabase.from("Barangay").delete().eq("barangay_id", id).select();
      if (error || !data.length) throw error || new Error("Cannot delete barangay due to foreign key constraint");
      return { success: true, message: "Barangay Deleted!" };
    } catch (err) {
      return { success: false, message: err.message || "Error" };
    }
  }

})();

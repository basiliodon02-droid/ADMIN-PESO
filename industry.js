(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
    }

    const qs = (s, d = document) => d.querySelector(s);
    const qsa = (s, d = document) => Array.from(d.querySelectorAll(s));

    const addModal = qs("#addIndustryModal");
    const editModal = qs("#editIndustryModal");
    const viewOverlay = qs("#viewOverlay");
    const viewDetails = qs("#viewDetails");
    const deleteOverlay = qs("#deleteOverlay");
    const tableBody = qs("#industryTableBody");
    const profileMenu = qs("#profile-menu");
    const profileIcon = qs("#profile-icon");

    let rowToEdit = null;
    let rowToDelete = null;

    // --------------------------
    // PROFILE MENU
    // --------------------------
    profileIcon.addEventListener("click", () => {
      profileMenu.classList.toggle("show");
    });
    window.addEventListener("click", (e) => {
      if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("show");
      }
    });

    // --------------------------
    // SIDEBAR TOGGLE MENUS
    // --------------------------
    qsa(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        qsa(".submenu").forEach((list) => {
          if (list !== submenu) list.classList.remove("show");
        });
        submenu.classList.toggle("show");
      });
    });

    // --------------------------
    // MODAL HANDLING
    // --------------------------
    function show(el) {
      el.style.display = "flex";
      el.setAttribute("aria-hidden", "false");
    }
    function hide(el) {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }

    qs("#openAddModalBtn").addEventListener("click", () => show(addModal));
    qsa(".btn-cancel[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = qs(btn.getAttribute("data-close"));
        if (target) hide(target);
      });
    });

    // --------------------------
    // ADD INDUSTRY
    // --------------------------
    qs("#saveIndustryBtn").addEventListener("click", async () => {
      const name = qs("#addIndustryName").value.trim();
      const desc = qs("#addIndustryDesc").value.trim();
      if (!name) return qs("#addIndustryName").focus();

      const result = await addIndustry(name, desc);
      alert(result.message);
      if (result.success) {
        qs("#addIndustryName").value = "";
        qs("#addIndustryDesc").value = "";
        hide(addModal);
        await renumberRows();
      }
    });

    // --------------------------
    // TABLE ACTIONS (VIEW, EDIT, DELETE)
    // --------------------------
    document.addEventListener("click", (e) => {
      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");

      if (iconView) {
        const row = iconView.closest("tr");
        viewDetails.innerHTML = `
          <p><b>Industry Name:</b> <span>${row.children[1].innerText}</span></p>
          <p><b>Description:</b> <span>${row.children[2].innerText || "—"}</span></p>
        `;
        show(viewOverlay);
      }

      if (iconEdit) {
        const row = iconEdit.closest("tr");
        rowToEdit = row;
        qs("#editIndustryName").value = row.children[1].innerText;
        qs("#editIndustryDesc").value = row.children[2].innerText;
        qs("#editIndustryId").value = row.children[4].innerText;
        show(editModal);
      }

      if (iconDelete) {
        const row = iconDelete.closest("tr");
        rowToDelete = row;
        qs("#deleteIndustryId").value = row.children[4].innerText;
        qs("#deleteIndustryText").textContent = `Are you sure you want to delete "${row.children[1].innerText}"?`;
        show(deleteOverlay);
      }
    });

    qs("#updateIndustryBtn").addEventListener("click", async () => {
      if (!rowToEdit) return;
      const newName = qs("#editIndustryName").value.trim();
      const newDesc = qs("#editIndustryDesc").value.trim();
      const industryId = qs("#editIndustryId").value.trim();
      if (!newName) return;

      const result = await editIndustry(industryId, newName, newDesc);
      alert(result.message);
      if (result.success) {
        hide(editModal);
        rowToEdit = null;
        await renumberRows();
      }
    });

    qs("#cancelDeleteBtn").addEventListener("click", () => {
      hide(deleteOverlay);
      rowToDelete = null;
    });

    qs("#confirmDeleteBtn").addEventListener("click", async () => {
      if (!rowToDelete) return;
      const industryId = qs("#deleteIndustryId").value;
      const result = await deleteIndustry(industryId);
      alert(result.message);
      if (result.success) {
        hide(deleteOverlay);
        rowToDelete = null;
        qs("#deleteIndustryId").value = "";
        await renumberRows();
      }
    });

    qs("#closeView").addEventListener("click", () => hide(viewOverlay));

    window.addEventListener("click", (e) => {
      if ([viewOverlay, deleteOverlay, addModal, editModal].includes(e.target)) {
        hide(e.target);
      }
    });

    // --------------------------
    // SEARCH
    // --------------------------
    qs("#searchInput").addEventListener("keyup", (e) => {
      const q = e.target.value.toLowerCase();
      Array.from(tableBody.rows).forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });

    // --------------------------
    // FETCH & RENDER INDUSTRY
    // --------------------------
    async function renumberRows() {
      const result = await getIndustryList();
      if (!result.success) {
        alert(result.message);
        return;
      }
      tableBody.innerHTML = "";
      result.data.forEach((industry, i) => {
        tableBody.insertAdjacentHTML(
          "beforeend",
          `<tr>
            <td>${i + 1}</td>
            <td>${industry.industry_name}</td>
            <td>${industry.description}</td>
            <td class="action-icons">
              <i class="bi bi-eye-fill icon-view" title="View"></i>
              <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
              <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
            </td>
            <td style="display:none;">${industry.industry_id}</td>
          </tr>`
        );
      });
    }

    await renumberRows();

    // --------------------------
    // SUPABASE FUNCTIONS
    // --------------------------
    async function getIndustryList() {
      const { data, error } = await supabase.from("Industry").select("*").order("industry_id", { ascending: true });
      return error
        ? { success: false, message: error.message, data: [] }
        : { success: true, message: "Success", data };
    }

    async function addIndustry(name, desc) {
      const { error } = await supabase.from("Industry").insert([{ industry_name: name, description: desc, createdAt: new Date().toLocaleString() }]);
      return error ? { success: false, message: error.message } : { success: true, message: "Industry Added!" };
    }

    async function editIndustry(id, name, desc) {
      const { error } = await supabase.from("Industry").update({ industry_name: name, description: desc, modifiedAt: new Date().toLocaleString() }).eq("industry_id", id);
      return error ? { success: false, message: error.message } : { success: true, message: "Industry Updated!" };
    }

    async function deleteIndustry(id) {
      const { data, error } = await supabase.from("Industry").delete().eq("industry_id", id).select();
      if (error || data.length === 0) return { success: false, message: error?.message || "Foreign key prevents deletion." };
      return { success: true, message: "Industry Deleted!" };
    }
  });
})();

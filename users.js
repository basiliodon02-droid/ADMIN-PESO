(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------
    // Login check
    // -----------------------
    if (localStorage.getItem('isLoggedIn') === 'FALSE') {
      window.location.href = "./index.html";
    }

    // -----------------------
    // DOM elements
    // -----------------------
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    const usersTableBody = document.getElementById("usersTableBody");
    const userModal = document.getElementById("userModal");
    const viewOverlay = document.getElementById("viewOverlay");
    const viewDetails = document.getElementById("viewDetails");
    const deleteOverlay = document.getElementById("deleteOverlay");
    const deleteUserText = document.getElementById("deleteUserText");

    const openAddUserBtn = document.getElementById("openAddUserBtn");
    const closeUserModal = document.getElementById("closeUserModal");
    const closeViewBtn = document.getElementById("closeView");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const modalTitle = document.getElementById("modalTitle");
    const searchInput = document.getElementById("searchInput");

    const lastnameInput = document.getElementById("lastname");
    const firstnameInput = document.getElementById("firstname");
    const miInput = document.getElementById("mi");
    const emailInput = document.getElementById("email");
    const roleInput = document.getElementById("role");
    const statusInput = document.getElementById("status");
    const editUserId = document.getElementById("editUserId");
    const deleteUserId = document.getElementById("deleteUserId");

    let editingRow = null;
    let rowToDelete = null;

    // -----------------------
    // Utility functions
    // -----------------------
    const statusBadge = (text) => {
      const t = (text || "").toLowerCase();
      if (t === "active") return '<span class="badge active">Active</span>';
      if (t === "pending") return '<span class="badge pending">Pending</span>';
      return '<span class="badge inactive">Inactive</span>';
    };

    const showLayer = (el) => {
      el.style.display = "flex";
      el.setAttribute("aria-hidden", "false");
    };
    const hideLayer = (el) => {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    };

    const safeQuery = async (queryFunc) => {
      try {
        return await queryFunc();
      } catch (err) {
        console.error(err);
        return { success: false, message: err.message || "Error", data: [] };
      }
    };

    // -----------------------
    // Profile dropdown
    // -----------------------
    profileIcon.addEventListener('click', () => profileDropdown?.classList.toggle('show'));
    window.addEventListener('click', (e) => {
      if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown?.classList.remove('show');
      }
    });

    // -----------------------
    // Sidebar submenu toggle
    // -----------------------
    document.querySelectorAll('.toggle-menu').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        document.querySelectorAll('.submenu').forEach(list => {
          if (list !== submenu) list.classList.remove('show');
        });
        submenu?.classList.toggle('show');
      });
    });

    // -----------------------
    // Load users into table
    // -----------------------
    async function renumberUsers() {
      const getUsers = await getUserList();
      if (!getUsers.success) return alert(getUsers.message);

      const tableBody = document.getElementById("usersTable").querySelector("tbody");
      tableBody.innerHTML = "";

      getUsers.data.forEach((user, i) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${user.lastName}</td>
          <td>${user.firstName}</td>
          <td>${user.middleName ? user.middleName.charAt(0).toUpperCase() + '.' : ''}</td>
          <td>${user.suffix ?? ''}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${statusBadge(user.status)}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style="display:none;">${user.user_id}</td>
          <td style="display:none;">${user.middleName}</td>
        `;
      });
    }

    // -----------------------
    // Modal controls
    // -----------------------
    openAddUserBtn.onclick = () => {
      editingRow = null;
      modalTitle.textContent = "Add New User";
      lastnameInput.value = firstnameInput.value = miInput.value = emailInput.value = "";
      roleInput.value = "Worker";
      statusInput.value = "Active";
      showLayer(userModal);
    };
    closeUserModal.onclick = () => hideLayer(userModal);
    closeViewBtn.onclick = () => hideLayer(viewOverlay);
    cancelDeleteBtn.onclick = () => { hideLayer(deleteOverlay); rowToDelete = null; };
    window.addEventListener("click", e => {
      if ([userModal, viewOverlay, deleteOverlay].includes(e.target)) hideLayer(e.target);
      if (e.target === deleteOverlay) rowToDelete = null;
    });

    // -----------------------
    // Form submit (add/edit)
    // -----------------------
    document.getElementById("userForm").onsubmit = async (e) => {
      e.preventDefault();
      const lastname = lastnameInput.value.trim();
      const firstname = firstnameInput.value.trim();
      const mi = miInput.value.trim();
      const email = emailInput.value.trim();
      const role = roleInput.value;
      const status = statusInput.value;

      if (!lastname || !firstname || !email || !role || !status) {
        return alert("Please fill in Lastname, Firstname, Email, Role, and Status.");
      }

      if (!editingRow) {
        const result = await addUser(firstname, lastname, mi, email, role, status);
        alert(result.message);
        if (result.success) {
          renumberUsers();
          hideLayer(userModal);
        }
      } else {
        const id = Number(editUserId.value);
        const result = await editUser(id, firstname, lastname, mi, email, role, status);
        alert(result.message);
        if (result.success) {
          renumberUsers();
          hideLayer(userModal);
        }
      }
    };

    // -----------------------
    // Row actions: View/Edit/Delete
    // -----------------------
    document.addEventListener("click", async (e) => {
      const row = e.target.closest("tr");
      if (!row) return;

      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");
      if (!iconView && !iconEdit && !iconDelete) return;

      const userId = Number(row.children[9].textContent);

      if (iconView) {
        viewDetails.innerHTML = `
          <p><b>Lastname:</b> ${row.children[1].textContent}</p>
          <p><b>Firstname:</b> ${row.children[2].textContent}</p>
          <p><b>Middlename:</b> ${row.children[10].textContent || "—"}</p>
          <p><b>Email:</b> ${row.children[5].textContent}</p>
          <p><b>Role:</b> ${row.children[6].textContent}</p>
          <p><b>Status:</b> ${row.children[7].innerText}</p>
        `;
        showLayer(viewOverlay);
        return;
      }

      if (iconEdit) {
        editingRow = row;
        modalTitle.textContent = "Edit User";
        lastnameInput.value = row.children[1].textContent;
        firstnameInput.value = row.children[2].textContent;
        miInput.value = row.children[10].textContent;
        emailInput.value = row.children[5].textContent;
        roleInput.value = row.children[6].textContent;
        statusInput.value = row.children[7].innerText.trim();
        editUserId.value = userId;
        showLayer(userModal);
        return;
      }

      if (iconDelete) {
        rowToDelete = row;
        deleteUserId.value = userId;
        deleteUserText.textContent = `Are you sure you want to delete "${row.children[1].textContent}, ${row.children[2].textContent}"?`;
        showLayer(deleteOverlay);
        return;
      }
    });

    // -----------------------
    // Confirm Delete
    // -----------------------
    confirmDeleteBtn.onclick = async () => {
      const id = Number(deleteUserId.value);
      const result = await deleteUser(id);
      alert(result.message);
      if (result.success) {
        renumberUsers();
        hideLayer(deleteOverlay);
        rowToDelete = null;
        deleteUserId.value = "";
      }
    };

    // -----------------------
    // Search filter
    // -----------------------
    searchInput.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      Array.from(usersTableBody.rows).forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });

    // Initial load
    renumberUsers();
  });

  // -----------------------
  // Supabase helpers
  // -----------------------
  async function getUserList() {
    return safeQuery(async () => {
      const { data, error } = await supabase.from("Users").select("*").neq("status", "Deleted").order("user_id", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    });
  }

  async function addUser(first, last, middle, email, role, stat) {
    return safeQuery(async () => {
      const { data, error } = await supabase.from("Users").insert([{
        email, password: "1234", role, firstName: first, middleName: middle, lastName: last, status: stat, created_at: new Date().toISOString()
      }]);
      if (error) throw error;

      // Insert into JobApplicationDetails
      const newUser = data[0];
      const fullName = `${first} ${middle ? middle + " " : ""}${last}`;
      const { error: e2 } = await supabase.from("JobApplicationDetails").insert([{ user_id: newUser.user_id, fullName }]);
      if (e2) throw e2;

      return { success: true, message: "User Added!" };
    });
  }

  async function editUser(userId, first, last, middle, email, role, stat) {
    return safeQuery(async () => {
      const { error } = await supabase.from("Users").update({ email, role, firstName: first, middleName: middle, lastName: last, status: stat }).eq("user_id", userId);
      if (error) throw error;

      const { data } = await supabase.from("JobApplicationDetails").select("*").eq("user_id", userId);
      if (!data.length) {
        const fullName = `${first} ${middle ? middle + " " : ""}${last}`;
        const { error: e2 } = await supabase.from("JobApplicationDetails").insert([{ user_id: userId, fullName }]);
        if (e2) throw e2;
      }

      return { success: true, message: "User Updated!" };
    });
  }

  async function deleteUser(userId) {
    return safeQuery(async () => {
      if (userId === 1) return { success: false, message: "Cannot delete main admin user." };
      const { error } = await supabase.from("Users").update({ status: "Deleted" }).eq("user_id", userId);
      if (error) throw error;
      return { success: true, message: "User Deleted!" };
    });
  }

  async function safeQuery(queryFunc) {
    try { return await queryFunc(); }
    catch (err) { console.error(err); return { success: false, message: err.message || "Error", data: [] }; }
  }

})();

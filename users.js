document.addEventListener('DOMContentLoaded', function () {

  function statusBadge(text) {
    const t = (text || "").toLowerCase();
    if (t === "active") return '<span class="badge active">Active</span>';
    if (t === "pending") return '<span class="badge pending">Pending</span>';
    return '<span class="badge inactive">Inactive</span>';
  }


  if (localStorage.getItem('isLoggedIn') == 'FALSE') {
    window.location.href = "./index.html";
  }
  const profileIcon = document.getElementById('profileIcon');
  const profileDropdown = document.getElementById('profileDropdown');

  profileIcon.addEventListener('click', () => {
    profileDropdown.classList.toggle('show');
  });

  window.addEventListener('click', (e) => {
    if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove('show');
    }
  });

  document.querySelectorAll('.toggle-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const submenu = btn.nextElementSibling;
      document.querySelectorAll('.submenu').forEach(list => {
        if (list !== submenu) list.classList.remove('show');
      });
      submenu.classList.toggle('show');
    });
  });

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

  window.onload = renumberUsers();

  async function renumberUsers() {
    // if (!usersTableBody) return;
    // Array.from(usersTableBody.rows).forEach((tr, i) => {
    //   if (tr.children[0]) tr.children[0].textContent = i + 1;
    // });
    const getUsers = await getUserList();
    if (getUsers.success === false) {
      alert(getUsers.message); //browser alert message
    } else {
      //added td for establishment_id but only hidden
      const tableBody = document
        .getElementById("usersTable")
        .getElementsByTagName("tbody")[0];
      tableBody.innerHTML = "";
      for (i = 0; i < getUsers.data.length; i++) {
        const row = tableBody.insertRow();
        row.innerHTML = `
          <td>${tableBody.rows.length}</td>
          <td>${getUsers.data[i].lastName}</td>
          <td>${getUsers.data[i].firstName}</td>
          <td>${getUsers.data[i].middleName ? getUsers.data[i].middleName.charAt(0).toUpperCase() + '.' : ''}</td>
          <td>${getUsers.data[i].email}</td>
          <td>${getUsers.data[i].role}</td>
          <td>${statusBadge(getUsers.data[i].status)}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style='display:none;'>${getUsers.data[i].user_id}</td>
          <td style='display:none;'>${getUsers.data[i].middleName}</td>
          `;
      }
    }
  }

  function showLayer(el) {
    el.style.display = "flex";
    el.setAttribute("aria-hidden", "false");
  }
  function hideLayer(el) {
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  openAddUserBtn.onclick = () => {
    editingRow = null;
    modalTitle.textContent = "Add New User";
    lastnameInput.value = "";
    firstnameInput.value = "";
    miInput.value = "";
    emailInput.value = "";
    roleInput.value = "Worker";
    statusInput.value = "Active";
    showLayer(userModal);
  };

  closeUserModal.onclick = () => hideLayer(userModal);
  closeViewBtn.onclick = () => hideLayer(viewOverlay);
  cancelDeleteBtn.onclick = () => {
    hideLayer(deleteOverlay);
    rowToDelete = null;
  };

  window.addEventListener("click", (e) => {
    if (e.target === userModal) hideLayer(userModal);
    if (e.target === viewOverlay) hideLayer(viewOverlay);
    if (e.target === deleteOverlay) {
      hideLayer(deleteOverlay);
      rowToDelete = null;
    }
  });

  document.getElementById("userForm").onsubmit = async function (e) {
    e.preventDefault();

    const lastname = lastnameInput.value.trim();
    const firstname = firstnameInput.value.trim();
    const mi = miInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleInput.value;
    const status = statusInput.value;

    if (!lastname || !firstname || !email || !role || !status) {
      alert("Please fill in Lastname, Firstname, Email, Role, and Status.");
      return;
    }

    if (!editingRow) {
      //   const rowIndex = usersTableBody.rows.length + 1;
      //   const tr = document.createElement("tr");
      //   tr.innerHTML = `
      //   <td>${rowIndex}</td>
      //   <td>${lastname}</td>
      //   <td>${firstname}</td>
      //   <td>${mi}</td>
      //   <td>${email}</td>
      //   <td>${role}</td>
      //   <td><span class="badge ${status.toLowerCase()}">${status}</span></td>
      //   <td class="action-icons text-center">
      //     <i class="bi bi-eye-fill icon-view" title="View"></i>
      //     <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
      //     <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
      //   </td>
      // `;
      //   usersTableBody.appendChild(tr);

      const addUserResult = await addUser(firstname, lastname, mi, email, role, status);
      if (addUserResult.success === false) {
        alert(addUserResult.message); //browser alert message
      } else {
        alert(addUserResult.message); //browser alert message
        renumberUsers();
        hideLayer(userModal);
        editingRow = null;
      }


    } else {
      // editingRow.children[1].textContent = lastname;
      // editingRow.children[2].textContent = firstname;
      // editingRow.children[3].textContent = mi;
      // editingRow.children[4].textContent = email;
      // editingRow.children[5].textContent = role;
      // editingRow.children[6].innerHTML = `<span class="badge ${status.toLowerCase()}">${status}</span>`;
      const editUserId = Number(document.getElementById("editUserId").value);
      const editUserResult = await editUser(editUserId, firstname, lastname, mi, email, role, status);
      if (editUserResult.success === false) {
        alert(editUserResult.message); //browser alert message
      } else {
        const checkForBioData = await getUserBioDataById(editUserId);
        if (checkForBioData.success && checkForBioData.data.length > 0) {
          //no need to do anything
          alert(editUserResult.message); //browser alert message
          renumberUsers();
          hideLayer(userModal);
          editingRow = null;
        } else if (checkForBioData.success && checkForBioData.data.length === 0) {
          //add to JobApplicationDetails table
          const fullName = firstname + " " + (mi ? mi + " " : "") + lastname;
          const { error } = await supabase.from("JobApplicationDetails").insert([
            {
              user_id: editUserId,
              fullName: fullName,
            }]);

          if (error) {
            alert(error.message); //browser alert message
          } else {
            alert(editUserResult.message); //browser alert message
            renumberUsers();
            hideLayer(userModal);
            editingRow = null;
          }
        }

      }

    }


  };

  document.addEventListener("click", (e) => {
    const iconView = e.target.closest(".icon-view");
    const iconEdit = e.target.closest(".icon-edit");
    const iconDelete = e.target.closest(".icon-delete");

    if (!iconView && !iconEdit && !iconDelete) return;

    const row = e.target.closest("tr");
    if (!row) return;

    if (iconView) {
      const lastname = row.children[1].textContent;
      const firstname = row.children[2].textContent;
      const mi = row.children[9].textContent || "—";
      const email = row.children[4].textContent;
      const role = row.children[5].textContent;
      const status = row.children[6].innerText;

      viewDetails.innerHTML = `
      <p><b>Lastname:</b><span>${lastname}</span></p>
      <p><b>Firstname:</b><span>${firstname}</span></p>
      <p><b>Middlename:</b><span>${mi !== null ? mi : "—"}</span></p>
      <p><b>Email:</b><span>${email}</span></p>
      <p><b>Role:</b><span>${role}</span></p>
      <p><b>Status:</b><span>${status}</span></p>
    `;
      showLayer(viewOverlay);
      return;
    }

    if (iconEdit) {
      editingRow = row;
      modalTitle.textContent = "Edit User";
      lastnameInput.value = row.children[1].textContent;
      firstnameInput.value = row.children[2].textContent;
      miInput.value = row.children[9].textContent;
      emailInput.value = row.children[4].textContent;
      roleInput.value = row.children[5].textContent;
      statusInput.value = row.children[6].innerText.trim();
      editUserId.value = row.children[8].textContent;
      showLayer(userModal);
      return;
    }

    if (iconDelete) {
      rowToDelete = row;
      const lname = row.children[1].textContent;
      const fname = row.children[2].textContent;
      deleteUserId.value = row.children[8].textContent;
      deleteUserText.textContent = `Are you sure you want to delete "${lname}, ${fname}"?`;
      showLayer(deleteOverlay);
      return;
    }
  });

  confirmDeleteBtn.onclick = async () => {

    // if (rowToDelete) {
    //   const tbody = rowToDelete.parentElement;
    //   tbody.removeChild(rowToDelete);
    //   Array.from(tbody.rows).forEach((tr, i) => {
    //     tr.children[0].textContent = i + 1;
    //   });
    // }
    const deleteUserId = Number(document.getElementById("deleteUserId").value);

    const deleteUserResult = await deleteUser(deleteUserId);
    if (deleteUserResult.success === false) {
      alert(deleteUserResult.message); //browser alert message
    } else {
      alert(deleteUserResult.message); //browser alert message
      document.getElementById("deleteUserId").value = "";
      renumberUsers();
      hideLayer(deleteOverlay);
      rowToDelete = null;
    }
  };

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    Array.from(usersTableBody.rows).forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
  });

  renumberUsers();

});




//GET LIST OF USERS FUNCTION
async function getUserList() {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .neq("status", "Deleted") // STATUS NOT EQUAL TO DELETED - only display non-deleted employers
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

// ADD USER FUNCTION
async function addUser(first, last, middle, email, role, stat) {
  const { data, error } = await supabase.from("Users").insert([
    {
      email: email,
      password: "1234", // default password
      role: role,
      firstName: first,
      middleName: middle,
      lastName: last,
      status: stat,
      created_at: new Date().toLocaleString(),
    },
  ]);

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {

    //get details of new user
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .order("user_id", { ascending: false }) // highest ID first
      .limit(1); // only 1 row

    if (error) {
      return {
        message: error.message,
        success: false,
        data: {},
      };
    } else {
      //got the latest user added
      //now insert to JobApplicationDetails table
      const fullName = first + " " + (middle ? middle + " " : "") + last;
      console.log(data);
      //add also to JobAplication table
      const { error } = await supabase.from("JobApplicationDetails").insert([
        {
          user_id: data[0].user_id,
          fullName: fullName,

        },
      ]);

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {

        return {
          message: `User Added!`,
          success: true,
        };
      }
    }
  }
}

//EDIT USER FUNCTION
async function editUser(userId, first, last, middle, email, role, stat) {
  const { error } = await supabase
    .from("Users")
    .update({
      email: email,
      role: role,
      firstName: first,
      middleName: middle,
      lastName: last,
      status: stat,
    })
    .eq("user_id", userId) // your condition
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: `${role} Updated!`,
      success: true,
    };
  }
}

// DELETE USER FUNCTION
async function deleteUser(userId) {
  //does not delete the actual row but just changes the status to "Deleted"
  const { error } = await supabase
    .from("Users")
    .update({
      status: "Deleted",
    })
    .eq("user_id", userId) // your condition
    .neq("user_id", "1") // must be able to delete main admin
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    if (userId === 1) {
      return {
        message: "Cannot delete main admin user.",
      }
    } else {
      return {
        message: `User Deleted!`,
        success: true,
      };
    }

  }
}



//GET LIST OF USERS FUNCTION
async function getUserBioDataById(id) {
  const { data, error } = await supabase
    .from("JobApplicationDetails")
    .select("*")
    .eq("user_id", id)
    ;

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
if (localStorage.getItem("isLoggedIn") == "FALSE") {
  window.location.href = "./index.html";
}

function toggleProfileMenu() {
  const profileMenu = document.getElementById("profile-menu");
  profileMenu.classList.toggle("show");
}

function statusBadge(text) {
  const t = (text || "").toLowerCase();
  if (t === "active") return '<span class="badge active">Active</span>';
  if (t === "pending") return '<span class="badge pending">Pending</span>';
  return '<span class="badge inactive">Inactive</span>';
}

const addEmployeeForm = document.getElementById("addEmployeeForm");

const tableBody = document.getElementById("employeeTableBody");
let deleteRowIndex = null;

var addModal, editModal, viewOverlay, viewDetails, deleteOverlay;
window.onload = renumberEmployees(); //load renumber function on page load

async function renumberEmployees() {
  // const tbody = document.getElementById("employeeTableBody");
  // if (!tbody) return;
  // Array.from(tbody.rows).forEach((tr, i) => {
  //   if (tr.children[0]) tr.children[0].innerText = i + 1;
  // });
  const getEmployees = await getEmployeeList();
  if (getEmployees.success === false) {
    alert(getEmployees.message); //browser alert message
  } else {
    //added td for establishment_id but only hidden
    const tableBody = document.getElementById("employeeTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = "";
    for (i = 0; i < getEmployees.data.length; i++) {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${tableBody.rows.length}</td>
        <td>${getEmployees.data[i].firstName}</td>
        <td>${getEmployees.data[i].middleName ?? ""}</td>
        <td>${getEmployees.data[i].lastName ?? ""} </td>
        <td>${getEmployees.data[i].suffix ?? ""}</td>
        <td>${getEmployees.data[i].email}</td>
        <td>${statusBadge(getEmployees.data[i].status)}</td>
        <td>${new Date(getEmployees.data[i].created_at).toISOString().split("T")[0]}</td>  
        <td style='font-size:14px;'>
          ${getEmployees.data[i].street ? getEmployees.data[i].street + ", " : ""}
          ${getEmployees.data[i].barangay ? getEmployees.data[i].barangay + ", " : ""}
          ${getEmployees.data[i].city ? getEmployees.data[i].city + ", " : ""}
          ${getEmployees.data[i].municipality ?? ""}
        </td>        
        <td >
          <div class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </div>  
        </td>
        <td style='display:none;'>${getEmployees.data[i].user_id}</td>
        <td style='display:none;'>${getEmployees.data[i].firstName}</td>
        <td style='display:none;'>${getEmployees.data[i].lastName}</td> `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const submenu = btn.nextElementSibling;
      const hasSubmenu = submenu && submenu.classList.contains("submenu");

      if (hasSubmenu) {
        e.preventDefault();
        document.querySelectorAll(".submenu").forEach((list) => {
          if (list !== submenu) list.classList.remove("show");
        });
        submenu.classList.toggle("show");
      }
    });
  });

  const tableBody = document.getElementById("employeeTableBody");

  const addModalEl = document.getElementById("addModal");
  const editModalEl = document.getElementById("editModal");
  const viewOverlayEl = document.getElementById("viewOverlay");
  const viewDetailsEl = document.getElementById("viewDetails");
  const deleteOverlayEl = document.getElementById("deleteOverlay");

  addModal = addModalEl;
  editModal = editModalEl;
  viewOverlay = viewOverlayEl;
  viewDetails = viewDetailsEl;
  deleteOverlay = deleteOverlayEl;

  document.getElementById("openAddModalBtn").onclick = () => {
    addModal.style.display = "flex";
    addModal.setAttribute("aria-hidden", "false");
  };

  document.getElementById("closeView").onclick = closeViewModal;
  document.getElementById("cancelDeleteBtn").onclick = closeDeleteModal;

  const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");

  const addEmployeeForm = document.getElementById("addEmployeeForm");
  addEmployeeForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const first = document.getElementById("empFirstName").value.trim();
    const last = document.getElementById("empLastName").value.trim();
    const email = document.getElementById("empEmail").value.trim();
    const stat = document.getElementById("empStatus").value;

    const addEmployeeResult = await addEmployee(first, last, email, stat);
    if (addEmployeeResult.success === false) {
      alert(addEmployeeResult.message); //browser alert message
    } else {
      alert(addEmployeeResult.message); //browser alert message
      renumberEmployees();
      closeAddModal();
      addEmployeeForm.reset();
    }
  });

  const editEmployeeForm = document.getElementById("editEmpForm");
  editEmployeeForm.addEventListener("submit", async function (e) {
    e.preventDefault();


    const first = document.getElementById("editEmpFirst").value.trim();
    const last = document.getElementById("editEmpLast").value.trim();
    const email = document.getElementById("editEmpEmail").value.trim();
    const stat = document.getElementById("editEmpStatus").value;
    const userId = document.getElementById("editEmpUserId").value;

    const editEmployeeResult = await editEmployee(
      userId,
      first,
      last,
      email,
      stat
    );
    if (editEmployeeResult.success === false) {
      alert(editEmployeeResult.message); //browser alert message
    } else {
      alert(editEmployeeResult.message); //browser alert message
      renumberEmployees();
      closeEditModal();
    }
  });

  document.getElementById("confirmDeleteBtn").onclick = async () => {
    // if (deleteRowIndex !== null) {
    //   tableBody.deleteRow(deleteRowIndex - 1);
    //   Array.from(tableBody.rows).forEach(
    //     (tr, i) => (tr.children[0].innerText = i + 1)
    //   );
    // }


    const selectedUserId = document.getElementById("deleteEmpUserId").value;
    const deleteEmployeeResult = await deleteEmployer(selectedUserId);
    if (deleteEmployeeResult.success === false) {
      alert(deleteEmployeeResult.message); //browser alert message
    } else {
      alert(deleteEmployeeResult.message); //browser alert message
      document.getElementById("deleteEmpUserId").value = "";
      renumberEmployees();
      closeDeleteModal();
    }
  }



  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    const q = e.target.value.toLowerCase();
    Array.from(tableBody.rows).forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
  });
});

function closeAddModal() {
  addModal.style.display = "none";
  addModal.setAttribute("aria-hidden", "true");
}

function closeEditModal() {
  editModal.style.display = "none";
  editModal.setAttribute("aria-hidden", "true");
}

function closeViewModal() {
  viewOverlay.style.display = "none";
  viewOverlay.setAttribute("aria-hidden", "true");
}

function closeDeleteModal() {
  deleteOverlay.style.display = "none";
  deleteOverlay.setAttribute("aria-hidden", "true");
  deleteRowIndex = null;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("icon-view")) {
    const row = e.target.closest("tr");
    const fName = row.children[1].textContent;
    const mName = row.children[2].textContent;
    const lName = row.children[3].textContent;
    const suffix = row.children[4].textContent;
    const fullName = `${fName} ${mName} ${lName} ${suffix}`;
    const email = row.children[5].innerText;
    const status = row.children[6].innerText;
    const dateRegistered = row.children[7].innerText;

    viewDetails.innerHTML = `
      <p><b>Employee Name: </b><span>${fullName}</span></p>
      <p><b>Email: </b><span>${email}</span></p>
      <p><b>Status: </b><span>${status}</span></p>
      <p><b>Date Registered: </b><span>${dateRegistered}</span></p>
    `;
    viewOverlay.style.display = "flex";
    viewOverlay.setAttribute("aria-hidden", "false");
  }

  if (e.target.classList.contains("icon-edit")) {
    const row = e.target.closest("tr");
    editModal.dataset.row = row.rowIndex;
    document.getElementById("editEmpFirst").value =
      row.children[11].textContent; //hidden td for first name
    document.getElementById("editEmpLast").value =
      row.children[12].textContent; //hidden td for last name
    document.getElementById("editEmpEmail").value =
      row.children[5].textContent;
    document.getElementById("editEmpStatus").value =
      row.children[6].textContent;
    document.getElementById("editEmpUserId").value =
      row.children[10].textContent;
    editModal.style.display = "flex";
    editModal.setAttribute("aria-hidden", "false");
  }

  if (e.target.classList.contains("icon-delete")) {
    const row = e.target.closest("tr");
    deleteRowIndex = row.rowIndex;
    const fName = row.children[1].textContent;
    const mName = row.children[2].textContent;
    const lName = row.children[3].textContent;
    const suffix = row.children[4].textContent;
    const fullName = `${fName} ${mName} ${lName} ${suffix}`;
    document.getElementById("deleteEmpUserId").value = row.children[10].innerText; // also get user_id as reference for db to delete
    deleteEmpBody.textContent = `Are you sure you want to delete "${fullName}"?`;
    deleteOverlay.style.display = "flex";
    deleteOverlay.setAttribute("aria-hidden", "false");
  }
});

window.addEventListener("click", (e) => {
  if (e.target === viewOverlay) closeViewModal();
  if (e.target === deleteOverlay) closeDeleteModal();
  if (e.target === addModal) closeAddModal();
  if (e.target === editModal) closeEditModal();
});

//GET LIST OF EMPLOYEE/WORKER FUNCTION
async function getEmployeeList() {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("role", "Worker")
    .neq("status", "Deleted") // STATUS NOT EQUAL TO DELETED - only display non-deleted employees
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

// ADD EMPLOYEE/WORKER FUNCTION
async function addEmployee(first, last, email, stat) {
  const { data, error } = await supabase.from("Users").insert([
    {
      email: email,
      password: "1234", // default password
      role: "Worker",
      firstName: first,
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
      const fullName = first + " " + last;
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
          message: `Employee Added!`,
          success: true,
        };
      }
    }

  }
}

//EDIT EMPLOYEE/WORKER FUNCTION
async function editEmployee(userId, first, last, email, stat) {
  const { error } = await supabase
    .from("Users")
    .update({
      email: email,
      firstName: first,
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
    const result = await checkIfUserHasApplicationDetails(userId);
    if (result.data.length > 0) {
      //already has job application details row
      return {
        message: `Worker Updated!`,
        success: true,
      };
    } else {
      const fullName = first + " " + last;

      //add also to JobAplication table
      const { error } = await supabase.from("JobApplicationDetails").insert([
        {
          user_id: userId,
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
          message: `Worker Updated!`,
          success: true,
        };
      }
    }
  }
}

// DELETE EMPLOYEE/WORKER FUNCTION
async function deleteEmployer(userId) {
  // const { data, error } = await supabase
  //   .from("Users")
  //   .delete()
  //   .eq("user_id", userId)
  //   .select() // optional: returns deleted row
  //   .throwOnError();

  // if (error || data.length === 0) {
  //   return {
  //     message: error?.message || "Foreign key prevents deletion.",
  //     success: false,
  //   };
  // } else {
  //   return {
  //     message: `Employer Deleted!`,
  //     success: true,
  //   };
  // }

  //does not delete the actual row but just changes the status to "Deleted"
  const { error } = await supabase
    .from("Users")
    .update({
      status: "Deleted",
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
      message: `Worker Deleted!`,
      success: true,
    };
  }
}


//check if user has JobApplicationDetails
async function checkIfUserHasApplicationDetails(user_id) {
  const { data, error } = await supabase
    .from("JobApplicationDetails")
    .select('*')
    .eq("user_id", user_id);
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
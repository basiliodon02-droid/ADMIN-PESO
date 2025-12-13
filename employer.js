document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }

  const userId = localStorage.getItem("userId");

  function toggleProfileMenu() {
    const profileMenu = document.getElementById("profile-menu");
    profileMenu.classList.toggle("show");
  }
  window.toggleProfileMenu = toggleProfileMenu;

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

  const openModalBtn = document.getElementById("openModalBtn");
  const addModal = document.getElementById("addModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");

  openModalBtn.onclick = () => (addModal.style.display = "flex");
  closeModalBtn.onclick = () => (addModal.style.display = "none");
  cancelModalBtn.onclick = () => (addModal.style.display = "none");

  const addEstablishmentForm = document.getElementById("addEstablishmentForm");

  //ON WINDOW LOAD, GET REBUILD TABLES FROM DB
  window.onload = renumberEmployers();
  window.onload = renumberEstablishments(); //get list of establishments
  window.onload = getAllIndustry(); //get list of industry for industry drop down

  async function renumberEstablishments() {
    // const tbody = document
    //   .getElementById("establishmentTable")
    //   .getElementsByTagName("tbody")[0];
    // Array.from(tbody.rows).forEach((tr, i) => {
    //   tr.children[0].textContent = i + 1;
    // });
    const getEstablishment = await getEstablishmentList();
    if (getEstablishment.success === false) {
      alert(getEstablishment.message); //browser alert message
    } else {
      //added td for establishment_id but only hidden
      const tableBody = document
        .getElementById("establishmentTable")
        .getElementsByTagName("tbody")[0];
      tableBody.innerHTML = "";
      for (i = 0; i < getEstablishment.data.length; i++) {
        const row = tableBody.insertRow();
        row.innerHTML = `
                  <td>${tableBody.rows.length}</td>
                  <td>${getEstablishment.data[i].establishmentName}</td>
                  <td>${getEstablishment.data[i].contactPerson}</td>
                  
                  <td>${getEstablishment.data[i].industryType}</td>
                  <td>${statusBadge(getEstablishment.data[i].status)}</td>
                  <td>${new Date(getEstablishment.data[i].createdAt)
            .toISOString()
            .split("T")[0]
          }</td>
                  <td class="action-icons">
                    <i class="bi bi-eye-fill icon-view" title="View"></i>
                    <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
                    <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
                  </td>
                  <td style='display:none;'>${getEstablishment.data[i].email
          }</td>
                  <td style='display:none;'>${getEstablishment.data[i].contactNumber
          }</td> 
                  <td style='display:none;'>${getEstablishment.data[i].address
          }</td> 
                  <td style='display:none;'>${getEstablishment.data[i].establishment_id
          }</td>     
            `;
      }
    }
  }

  addEstablishmentForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const establishmentName =
      document.getElementById("establishmentName").value;
    const ownerName = document.getElementById("ownerName").value;
    const industry = document.getElementById("industry").value;
    const address = document.getElementById("address").value;

    const addEstablishmentResult = await addEstablishment(
      establishmentName,
      industry,
      ownerName,
      address
    );
    if (addEstablishmentResult.success === false) {
      alert(addEstablishmentResult.message); //browser alert message
    } else {
      alert(addEstablishmentResult.message); //browser alert message
      renumberEstablishments();

      addModal.style.display = "none";
      addEstablishmentForm.reset();
    }

    // const tableBody = document
    //   .getElementById("establishmentTable")
    //   .getElementsByTagName('tbody')[0];

    // const row = tableBody.insertRow();
    // row.innerHTML = `
    //   <td>${tableBody.rows.length + 1}</td>
    //   <td>${establishmentName}</td>
    //   <td>${ownerName}</td>
    //   <td>${industry}</td>
    //   <td>Pending</td>
    //   <td>${new Date().toLocaleDateString()}</td>
    //   <td class="action-icons">
    //     <i class="bi bi-eye-fill icon-view" title="View"></i>
    //     <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
    //     <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
    //   </td>
    // `;

    // row.dataset.address = address;

    // renumberEstablishments();

    // addModal.style.display = "none";
    // addEstablishmentForm.reset();
  });

  const viewOverlay = document.getElementById("viewOverlay");
  const viewDetails = document.getElementById("viewDetails");
  const closeViewBtn = document.getElementById("closeView");

  const editModal = document.getElementById("editModal");
  const closeEditBtn = document.getElementById("closeEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const deleteOverlay = document.getElementById("deleteOverlay");
  const deleteBody = document.getElementById("deleteBody");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let rowToDelete = null;
  let rowToEdit = null;

  document.addEventListener("click", (e) => {
    const icon = e.target;

    if (icon.closest(".icon-view")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#establishmentTable")) return;

      const name = row.children[1].textContent;
      const owner = row.children[2].textContent;
      const industry = row.children[3].textContent;
      const status = row.children[4].textContent;
      const dateReg = row.children[5].textContent;

      viewDetails.innerHTML = `
        <p><b>Establishment Name:</b><span>${name}</span></p>
        <p><b>Owner / Contact:</b><span>${owner}</span></p>
        <p><b>Industry:</b><span>${industry}</span></p>
        <p><b>Status:</b><span>${status}</span></p>
        <p><b>Date Registered:</b><span>${dateReg}</span></p>
      `;
      viewOverlay.style.display = "flex";
      viewOverlay.setAttribute("aria-hidden", "false");
    }

    if (icon.closest(".icon-edit")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#establishmentTable")) return;

      rowToEdit = row;

      document.getElementById("editName").value = row.children[1].textContent;
      document.getElementById("editOwner").value = row.children[2].textContent;
      document.getElementById("editIndustry").value =
        row.children[3].textContent;
      document.getElementById("editAddress").value =
        row.children[9].textContent;
      // document.getElementById('editAddress').value  = row.dataset.address || '';
      document.getElementById("editEstablishmentId").value =
        row.children[10].textContent;

      editModal.style.display = "flex";
      editModal.setAttribute("aria-hidden", "false");
    }

    if (icon.closest(".icon-delete")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#establishmentTable")) return;

      rowToDelete = row;
      const name = row.children[1].textContent;
      document.getElementById("deleteEstablishmentId").value =
        row.children[10].innerText; // also get establishment_id as reference for db delete
      deleteBody.textContent = `Are you sure you want to delete "${name}"?`;
      deleteOverlay.style.display = "flex";
      deleteOverlay.setAttribute("aria-hidden", "false");
    }
  });

  closeViewBtn.onclick = () => {
    viewOverlay.style.display = "none";
    viewOverlay.setAttribute("aria-hidden", "true");
  };

  closeEditBtn.onclick = cancelEditBtn.onclick = () => {
    editModal.style.display = "none";
    editModal.setAttribute("aria-hidden", "true");
  };

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!rowToEdit) return;

    // rowToEdit.children[1].textContent = document.getElementById('editName').value;
    // rowToEdit.children[2].textContent = document.getElementById('editOwner').value;
    // rowToEdit.children[3].textContent = document.getElementById('editIndustry').value;
    // rowToEdit.dataset.address         = document.getElementById('editAddress').value;

    // editModal.style.display = 'none';
    // editModal.setAttribute('aria-hidden', 'true');

    const selectedEstablishmentName = document.getElementById("editName").value;
    // const selectedEmail =  document.getElementById("editEmail").value;
    const selectedIndustry = document.getElementById("editIndustry").value;
    const selectedOwnerName = document.getElementById("editOwner").value;
    // const selectedContactNumber =  document.getElementById("editContact").value;
    const selectedAddress = document.getElementById("editAddress").value;
    const establishment_id = document.getElementById(
      "editEstablishmentId"
    ).value;

    const editEstablishmentResult = await editEstablishment(
      establishment_id,
      selectedEstablishmentName,
      selectedIndustry,
      selectedOwnerName,
      selectedAddress
    );
    if (editEstablishmentResult.success === false) {
      alert(editEstablishmentResult.message); //browser alert message
    } else {
      alert(editEstablishmentResult.message); //browser alert message
      renumberEstablishments();
      editModal.style.display = "none";
      editModal.setAttribute("aria-hidden", "true");
    }
  });

  cancelDeleteBtn.onclick = () => {
    deleteOverlay.style.display = "none";
    deleteOverlay.setAttribute("aria-hidden", "true");
    rowToDelete = null;
  };

  confirmDeleteBtn.onclick = async () => {
    // if (rowToDelete) {
    //   const tbody = rowToDelete.parentElement;
    //   tbody.removeChild(rowToDelete);
    //   Array.from(tbody.rows).forEach((tr, i) => tr.children[0].textContent = i + 1);
    // }
    // renumberEstablishments();

    // deleteOverlay.style.display = 'none';
    // deleteOverlay.setAttribute('aria-hidden', 'true');
    // rowToDelete = null;
    const selectedEstablishmentId = document.getElementById(
      "deleteEstablishmentId"
    ).value;
    const deleteEstablishmentResult = await deleteEstablishment(
      selectedEstablishmentId
    );
    if (deleteEstablishmentResult.success === false) {
      alert(deleteEstablishmentResult.message); //browser alert message
    } else {
      alert(deleteEstablishmentResult.message); //browser alert message
      document.getElementById("deleteEstablishmentId").value = "";
      renumberEstablishments();
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
    }
  };

  window.addEventListener("click", (e) => {
    if (e.target === viewOverlay) {
      closeViewBtn.click();
    }
    if (e.target === deleteOverlay) {
      cancelDeleteBtn.click();
    }
    if (e.target === addModal) {
      addModal.style.display = "none";
    }
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });

  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const tbody = document
      .getElementById("establishmentTable")
      .getElementsByTagName("tbody")[0];
    Array.from(tbody.rows).forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
  });

  const employerTable = document.getElementById("employersTable");
  const employerTbody = employerTable.tBodies[0];
  const employerSearchInput = document.getElementById("employerSearchInput");

  const openEmpModalBtn = document.getElementById("openEmpModalBtn");
  const addEmpModal = document.getElementById("addEmpModal");
  const closeEmpModalBtn = document.getElementById("closeEmpModalBtn");
  const cancelEmpModalBtn = document.getElementById("cancelEmpModalBtn");
  const addEmployerForm = document.getElementById("addEmployerForm");

  const empViewOverlay = document.getElementById("empViewOverlay");
  const empViewDetails = document.getElementById("empViewDetails");
  const closeEmpViewBtn = document.getElementById("closeEmpView");

  const editEmpModal = document.getElementById("editEmpModal");
  const closeEmpEditBtn = document.getElementById("closeEmpEditBtn");
  const cancelEmpEditBtn = document.getElementById("cancelEmpEditBtn");
  const editEmpForm = document.getElementById("editEmpForm");

  const deleteEmpOverlay = document.getElementById("deleteEmpOverlay");
  const deleteEmpBody = document.getElementById("deleteEmpBody");
  const cancelDeleteEmpBtn = document.getElementById("cancelDeleteEmpBtn");
  const confirmDeleteEmpBtn = document.getElementById("confirmDeleteEmpBtn");

  let empRowToEdit = null;
  let empRowToDelete = null;

  async function renumberEmployers() {
    // Array.from(employerTbody.rows).forEach((tr, i) => {
    //   if (tr.children[0]) tr.children[0].textContent = i + 1;
    // });
    const getEmployers = await getEmployerList();
    if (getEmployers.success === false) {
      alert(getEmployers.message); //browser alert message
    } else {
      //added td for establishment_id but only hidden
      const tableBody = document
        .getElementById("employersTable")
        .getElementsByTagName("tbody")[0];
      tableBody.innerHTML = "";
      for (i = 0; i < getEmployers.data.length; i++) {
        const row = tableBody.insertRow();
        row.innerHTML = `
                  <td>${tableBody.rows.length}</td>
                  <td>
                  ${getEmployers.data[i].firstName} ${getEmployers.data[i].middleName ?? ""
          } ${getEmployers.data[i].lastName ?? ""} ${getEmployers.data[i].suffix ?? ""
          }
                  </td>
                  <td>${getEmployers.data[i].email}</td>
                  <td>${statusBadge(getEmployers.data[i].status)}</td>
                  <td>${new Date(getEmployers.data[i].created_at)
            .toISOString()
            .split("T")[0]}
                  </td>
                  <td style='font-size:14px;'>
                    ${getEmployers.data[i].street ? getEmployers.data[i].street + ", " : ""}
                    ${getEmployers.data[i].barangay ? getEmployers.data[i].barangay + ", " : ""}
                    ${getEmployers.data[i].city ? getEmployers.data[i].city + ", " : ""}
                    ${getEmployers.data[i].municipality ?? ""}
                  </td>
                  <td>
                    <div class="action-icons">
                    <i class="bi bi-eye-fill icon-view-emp" title="View"></i>
                    <i class="bi bi-pencil-square icon-edit-emp" title="Edit"></i>
                    <i class="bi bi-trash3-fill icon-delete-emp" title="Delete"></i>
                    </div>
                  </td>
                  <td style='display:none;'>${getEmployers.data[i].user_id}</td>
                  <td style='display:none;'>${getEmployers.data[i].firstName
          }</td>
                  <td style='display:none;'>${getEmployers.data[i].lastName
          }</td>

            `;
      }
    }
  }

  function statusBadge(text) {
    const t = (text || "").toLowerCase();
    if (t === "active") return '<span class="badge active">Active</span>';
    if (t === "pending") return '<span class="badge pending">Pending</span>';
    return '<span class="badge inactive">Inactive</span>';
  }

  openEmpModalBtn.onclick = () => (addEmpModal.style.display = "flex");
  closeEmpModalBtn.onclick = () => (addEmpModal.style.display = "none");
  cancelEmpModalBtn.onclick = () => (addEmpModal.style.display = "none");

  addEmployerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const first = document.getElementById("empFirstName").value.trim();
    const last = document.getElementById("empLastName").value.trim();
    const email = document.getElementById("empEmail").value.trim();
    const stat = document.getElementById("empStatus").value;

    // const fullName = [first, last].filter(Boolean).join(' ') || email;
    // const date = new Date().toLocaleDateString();

    // const tr = employerTbody.insertRow();
    // tr.innerHTML = `
    //   <td>${employerTbody.rows.length}</td>
    //   <td>${fullName}</td>
    //   <td>${email}</td>
    //   <td>${statusBadge(stat)}</td>
    //   <td>${date}</td>
    //   <td class="action-icons">
    //     <i class="bi bi-eye-fill icon-view-emp" title="View"></i>
    //     <i class="bi bi-pencil-square icon-edit-emp" title="Edit"></i>
    //     <i class="bi bi-trash3-fill icon-delete-emp" title="Delete"></i>
    //   </td>
    // `;

    // tr.dataset.first  = first;
    // tr.dataset.last   = last;
    // tr.dataset.email  = email;
    // tr.dataset.status = stat;
    // tr.dataset.date   = date;

    // renumberEmployers();
    // addEmpModal.style.display = "none";
    // addEmployerForm.reset();

    const addEmployerResult = await addEmployer(first, last, email, stat);
    if (addEmployerResult.success === false) {
      alert(addEmployerResult.message); //browser alert message
    } else {
      alert(addEmployerResult.message); //browser alert message
      renumberEmployers();
      addEmpModal.style.display = "none";
      addEmployerForm.reset();
    }
  });

  document.addEventListener("click", (e) => {
    const icon = e.target;

    if (icon.closest(".icon-view-emp")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#employersTable")) return;

      const fullName = row.children[1].textContent;
      const email = row.children[2].textContent;
      const status = row.dataset.status || row.children[3].textContent;
      const date = row.dataset.date || row.children[4].textContent;
      const address = row.dataset.date || row.children[5].textContent;

      empViewDetails.innerHTML = `
        <p><b>Employer Name:  </b><span>${fullName}</span></p>
        <p><b>Email:  </b><span>${email}</span></p>
        <p><b>Status:  </b><span>${typeof status === "string" ? status : row.children[3].innerText
        }</span></p>
        <p><b>Date Registered:  </b><span>${date}</span></p>
        <p><b>Address:  </b><span>${address}</span></p>
      `;
      empViewOverlay.style.display = "flex";
      empViewOverlay.setAttribute("aria-hidden", "false");
    }

    if (icon.closest(".icon-edit-emp")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#employersTable")) return;

      empRowToEdit = row;

      document.getElementById("editEmpFirst").value =
        row.children[8].textContent; //hidden td for first name
      document.getElementById("editEmpLast").value =
        row.children[9].textContent; //hidden td for last name
      document.getElementById("editEmpEmail").value =
        row.children[2].textContent;
      document.getElementById("editEmpStatus").value =
        row.children[3].textContent;
      document.getElementById("editEmpUserId").value =
        row.children[7].textContent;
      editEmpModal.style.display = "flex";
      editEmpModal.setAttribute("aria-hidden", "false");
    }

    if (icon.closest(".icon-delete-emp")) {
      const row = icon.closest("tr");
      if (!row || !row.closest("#employersTable")) return;

      empRowToDelete = row;
      const name = row.children[1].textContent;
      document.getElementById("deleteEmpUserId").value =
        row.children[7].innerText; // also get user_id as reference for db to delete
      deleteEmpBody.textContent = `Are you sure you want to delete "${name}"?`;
      deleteEmpOverlay.style.display = "flex";
      deleteEmpOverlay.setAttribute("aria-hidden", "false");
    }
  });

  closeEmpViewBtn.onclick = () => {
    empViewOverlay.style.display = "none";
    empViewOverlay.setAttribute("aria-hidden", "true");
  };

  closeEmpEditBtn.onclick = cancelEmpEditBtn.onclick = () => {
    editEmpModal.style.display = "none";
    editEmpModal.setAttribute("aria-hidden", "true");
  };

  cancelDeleteEmpBtn.onclick = () => {
    deleteEmpOverlay.style.display = "none";
    deleteEmpOverlay.setAttribute("aria-hidden", "true");
    empRowToDelete = null;
  };

  editEmpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!empRowToEdit) return;

    const first = document.getElementById("editEmpFirst").value.trim();
    const last = document.getElementById("editEmpLast").value.trim();
    const email = document.getElementById("editEmpEmail").value.trim();
    const stat = document.getElementById("editEmpStatus").value;
    const userId = document.getElementById("editEmpUserId").value;

    // const fullName = [first, last].filter(Boolean).join(' ') || email;

    // empRowToEdit.children[1].textContent = fullName;
    // empRowToEdit.children[2].textContent = email;
    // empRowToEdit.children[3].innerHTML   = statusBadge(stat);

    // empRowToEdit.dataset.first  = first;
    // empRowToEdit.dataset.last   = last;
    // empRowToEdit.dataset.email  = email;
    // empRowToEdit.dataset.status = stat;

    const editEmployerResult = await editEmployer(
      userId,
      first,
      last,
      email,
      stat
    );
    if (editEmployerResult.success === false) {
      alert(editEmployerResult.message); //browser alert message
    } else {
      alert(editEmployerResult.message); //browser alert message
      renumberEmployers();
      editEmpModal.style.display = "none";
      editEmpModal.setAttribute("aria-hidden", "true");
    }
  });

  confirmDeleteEmpBtn.onclick = async () => {
    // if (empRowToDelete) {
    //   const tbody = empRowToDelete.parentElement;
    //   tbody.removeChild(empRowToDelete);
    //   Array.from(tbody.rows).forEach((tr, i) => tr.children[0].textContent = i + 1);
    // }
    // deleteEmpOverlay.style.display = 'none';
    // deleteEmpOverlay.setAttribute('aria-hidden', 'true');
    // empRowToDelete = null;

    const selectedUserId = document.getElementById("deleteEmpUserId").value;
    const deleteEmployerResult = await deleteEmployer(selectedUserId);
    if (deleteEmployerResult.success === false) {
      alert(deleteEmployerResult.message); //browser alert message
    } else {
      alert(deleteEmployerResult.message); //browser alert message
      document.getElementById("deleteEmpUserId").value = "";
      renumberEmployers();
      deleteEmpOverlay.style.display = "none";
      deleteEmpOverlay.setAttribute("aria-hidden", "true");
    }
  };

  window.addEventListener("click", (e) => {
    if (e.target === empViewOverlay) {
      closeEmpViewBtn.click();
    }
    if (e.target === addEmpModal) {
      addEmpModal.style.display = "none";
    }
    if (e.target === editEmpModal) {
      editEmpModal.style.display = "none";
    }
    if (e.target === deleteEmpOverlay) {
      cancelDeleteEmpBtn.click();
    }
  });

  function filterEmployerRows(q) {
    const query = (q || "").toLowerCase().trim();
    Array.from(employerTbody.rows).forEach((row) => {
      const name = row.cells[1]?.textContent?.toLowerCase() || "";
      const email = row.cells[2]?.textContent?.toLowerCase() || "";
      row.style.display =
        !query || name.includes(query) || email.includes(query) ? "" : "none";
    });
  }
  if (employerSearchInput) {
    let t = null;
    employerSearchInput.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => filterEmployerRows(e.target.value), 120);
    });
  }
});

//GET LIST OF BRGY FUNCTION
async function getEstablishmentList() {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .order("establishment_id", { ascending: true });

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

// ADD ESTABLISHMENT FUNCTION
async function addEstablishment(
  establishmentName,
  industry,
  ownerName,
  address
) {
  const { data, error } = await supabase.from("Establishment").insert([
    {
      establishmentName: establishmentName,
      industryType: industry,
      contactPerson: ownerName,
      address: address,
      status: "Pending",
      user_id: localStorage.getItem("userId"), //set as admin's user_id who added the establishment
      createdAt: new Date().toLocaleString(),
    },
  ]);

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: "Establishment Added!",
      success: true,
    };
  }
}

//EDIT ESTABLISHMENT FUNCTION
async function editEstablishment(
  establishment_id,
  establishmentName,
  industry,
  ownerName,
  address
) {
  const { error } = await supabase
    .from("Establishment")
    .update({
      establishmentName: establishmentName,
      industryType: industry,
      contactPerson: ownerName,
      address: address,
      modifiedAt: new Date().toLocaleString(),
    })
    .eq("establishment_id", establishment_id) // your condition
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: `Establishment Updated!`,
      success: true,
    };
  }
}

// DELETE ESTABLISHMENT FUNCTION
async function deleteEstablishment(establishment_id) {
  const { data, error } = await supabase
    .from("Establishment")
    .delete()
    .eq("establishment_id", establishment_id)
    .select()
  // .throwOnError();

  if (error || data.length === 0) {
    return {
      message: error?.message || "Foreign key prevents deletion.",
      success: false,
    };
  } else {
    return {
      message: `Establishment Deleted!`,
      success: true,
    };
  }
}

//GET LIST OF INDUSTRY FUNCTION FOR ADD ESTABLISHMENT DROPDOWN
async function getIndustryList() {
  const { data, error } = await supabase
    .from("Industry")
    .select("*")
    .order("industry_id", { ascending: true });

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

//fill up industry drop down with list from Industry table (db)
async function getAllIndustry() {
  const result = await getIndustryList();
  if (result.success === false) {
    alert(result.message); //browser alert message
  } else {
    //added td for industry_id but only hidden
    for (i = 0; i < result.data.length; i++) {
      // Get the select element
      const addIndustrySelect = document.getElementById("industry");
      const editIndustrySelect = document.getElementById("editIndustry");

      // Create a new option element
      const option = document.createElement("option");
      const option2 = document.createElement("option");

      // Set the text and value for the option
      option.text = result.data[i].industry_name;
      option.value = result.data[i].industry_name;
      // Append the option to the select element
      addIndustrySelect.appendChild(option);

      // Set the text and value for the option
      option2.text = result.data[i].industry_name;
      option2.value = result.data[i].industry_name;
      // Append the option to the select element
      editIndustrySelect.appendChild(option2);
    }
  }
}

//GET LIST OF EMPLOYERS FUNCTION
async function getEmployerList() {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("role", "Employer")
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

// ADD EMPLOYER FUNCTION
async function addEmployer(first, last, email, stat) {
  const { data, error } = await supabase.from("Users").insert([
    {
      email: email,
      password: "1234", // default password
      role: "Employer",
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
          message: `Employer Added!`,
          success: true,
        };
      }
    }

  }
}

//EDIT EMPLOYER FUNCTION
async function editEmployer(userId, first, last, email, stat) {
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
        message: `Employer Updated!`,
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
          message: `Employer Updated!`,
          success: true,
        };
      }
    }
  }
}

// DELETE EMPLOYER FUNCTION
async function deleteEmployer(userId) {
  // const { data, error } = await supabase
  //   .from("Users")
  //   .delete()
  //   .eq("user_id", userId)
  //   .select() // optional: returns deleted row
  // // .throwOnError();

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
      message: `Employer Deleted!`,
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
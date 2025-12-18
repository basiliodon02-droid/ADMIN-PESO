(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  let addEstModal, editEstModal, viewEstOverlay, viewEstDetails, deleteEstOverlay;
  let addEmpModal, editEmpModal, viewEmpOverlay, viewEmpDetails, deleteEmpOverlay;

  document.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
    }

    // -------------------------------
    // DOM Elements
    // -------------------------------
    const estTableBody = document.getElementById("establishmentTable").tBodies[0];
    const empTableBody = document.getElementById("employersTable").tBodies[0];

    addEstModal = document.getElementById("addModal");
    editEstModal = document.getElementById("editModal");
    viewEstOverlay = document.getElementById("viewOverlay");
    viewEstDetails = document.getElementById("viewDetails");
    deleteEstOverlay = document.getElementById("deleteOverlay");

    addEmpModal = document.getElementById("addEmpModal");
    editEmpModal = document.getElementById("editEmpModal");
    viewEmpOverlay = document.getElementById("empViewOverlay");
    viewEmpDetails = document.getElementById("empViewDetails");
    deleteEmpOverlay = document.getElementById("deleteEmpOverlay");

    // -------------------------------
    // Sidebar toggle
    // -------------------------------
    document.querySelectorAll(".toggle-menu").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        document.querySelectorAll(".submenu").forEach(list => {
          if (list !== submenu) list.classList.remove("show");
        });
        submenu?.classList.toggle("show");
      });
    });

    // -------------------------------
    // Load tables
    // -------------------------------
    await renderEstablishments();
    await renderEmployers();
    await getAllIndustry();

    // -------------------------------
    // Add / Edit / View / Delete Modals
    // -------------------------------
    setupEstablishmentModals();
    setupEmployerModals();

    // -------------------------------
    // Search filtering
    // -------------------------------
    const estSearch = document.getElementById("searchInput");
    estSearch?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      Array.from(estTableBody.rows).forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });

    const empSearch = document.getElementById("employerSearchInput");
    empSearch?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      Array.from(empTableBody.rows).forEach(row => {
        const name = row.cells[1]?.textContent?.toLowerCase() || "";
        const email = row.cells[5]?.textContent?.toLowerCase() || "";
        row.style.display = !q || name.includes(q) || email.includes(q) ? "" : "none";
      });
    });

  }); // DOMContentLoaded

  // -------------------------------
  // Status Badge
  // -------------------------------
  function statusBadge(text) {
    const t = (text || "").toLowerCase();
    if (t === "active") return '<span class="badge active">Active</span>';
    if (t === "pending") return '<span class="badge pending">Pending</span>';
    return '<span class="badge inactive">Inactive</span>';
  }

  // -------------------------------
  // Render Establishments
  // -------------------------------
  async function renderEstablishments() {
    const result = await getEstablishmentList();
    if (!result.success) return alert(result.message);
    const estTableBody = document.getElementById("establishmentTable").tBodies[0];
    estTableBody.innerHTML = "";

    for (let i = 0; i < result.data.length; i++) {
      const est = result.data[i];
      const row = estTableBody.insertRow();
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${est.establishmentName}</td>
        <td>${est.contactPerson}</td>
        <td>${est.industryType}</td>
        <td>${statusBadge(est.status)}</td>
        <td>${new Date(est.createdAt).toISOString().split("T")[0]}</td>
        <td>
          <div class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </div>
        </td>
        <td style="display:none;">${est.email}</td>
        <td style="display:none;">${est.contactNumber}</td>
        <td style="display:none;">${est.address}</td>
        <td style="display:none;">${est.establishment_id}</td>
      `;
    }
  }

  // -------------------------------
  // Render Employers
  // -------------------------------
  async function renderEmployers() {
    const result = await getEmployerList();
    if (!result.success) return alert(result.message);
    const empTableBody = document.getElementById("employersTable").tBodies[0];
    empTableBody.innerHTML = "";

    for (let i = 0; i < result.data.length; i++) {
      const emp = result.data[i];
      const row = empTableBody.insertRow();
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
            <i class="bi bi-eye-fill icon-view-emp" title="View"></i>
            <i class="bi bi-pencil-square icon-edit-emp" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete-emp" title="Delete"></i>
          </div>
        </td>
        <td style='display:none;'>${emp.user_id}</td>
        <td style='display:none;'>${emp.firstName}</td>
        <td style='display:none;'>${emp.lastName}</td>
      `;
    }
  }

  // -------------------------------
  // Setup modals for Establishments
  // -------------------------------
  function setupEstablishmentModals() {
    const openAddBtn = document.getElementById("openModalBtn");
    const closeAddBtn = document.getElementById("closeModalBtn");
    const cancelAddBtn = document.getElementById("cancelModalBtn");
    const addForm = document.getElementById("addEstablishmentForm");

    const closeViewBtn = document.getElementById("closeView");
    const editForm = document.getElementById("editForm");
    const closeEditBtn = document.getElementById("closeEditBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    let rowToEdit = null;
    let rowToDelete = null;

    openAddBtn.onclick = () => showLayer(addEstModal);
    closeAddBtn.onclick = cancelAddBtn.onclick = () => closeLayer(addEstModal);

    addForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("establishmentName").value.trim();
      const owner = document.getElementById("ownerName").value.trim();
      const industry = document.getElementById("industry").value.trim();
      const address = document.getElementById("address").value.trim();

      const res = await addEstablishment(name, industry, owner, address);
      alert(res.message);
      if (res.success) {
        closeLayer(addEstModal);
        addForm.reset();
        await renderEstablishments();
      }
    });

    // Click handlers for view/edit/delete icons
    document.addEventListener("click", e => {
      const icon = e.target;
      const row = icon.closest("tr");
      if (!row || !row.closest("#establishmentTable")) return;

      // View
      if (icon.closest(".icon-view")) {
        viewEstDetails.innerHTML = `
          <p><b>Establishment Name:</b> ${row.children[1].textContent}</p>
          <p><b>Owner:</b> ${row.children[2].textContent}</p>
          <p><b>Industry:</b> ${row.children[3].textContent}</p>
          <p><b>Status:</b> ${row.children[4].innerHTML}</p>
          <p><b>Date Registered:</b> ${row.children[5].textContent}</p>
          <p><b>Address:</b> ${row.children[9].textContent}</p>
        `;
        showLayer(viewEstOverlay);
      }

      // Edit
      if (icon.closest(".icon-edit")) {
        rowToEdit = row;
        document.getElementById("editName").value = row.children[1].textContent;
        document.getElementById("editOwner").value = row.children[2].textContent;
        document.getElementById("editIndustry").value = row.children[3].textContent;
        document.getElementById("editAddress").value = row.children[9].textContent;
        document.getElementById("editEstablishmentId").value = row.children[10].textContent;
        showLayer(editEstModal);
      }

      // Delete
      if (icon.closest(".icon-delete")) {
        rowToDelete = row;
        document.getElementById("deleteEstablishmentId").value = row.children[10].textContent;
        deleteEstOverlay.querySelector("#deleteBody").textContent = `Are you sure you want to delete "${row.children[1].textContent}"?`;
        showLayer(deleteEstOverlay);
      }
    });

    closeViewBtn.onclick = () => closeLayer(viewEstOverlay);
    closeEditBtn.onclick = cancelEditBtn.onclick = () => closeLayer(editEstModal);
    cancelDeleteBtn.onclick = () => closeLayer(deleteEstOverlay);

    editForm.addEventListener("submit", async e => {
      e.preventDefault();
      const id = document.getElementById("editEstablishmentId").value;
      const name = document.getElementById("editName").value.trim();
      const owner = document.getElementById("editOwner").value.trim();
      const industry = document.getElementById("editIndustry").value.trim();
      const address = document.getElementById("editAddress").value.trim();

      const res = await editEstablishment(id, name, industry, owner, address);
      alert(res.message);
      if (res.success) {
        closeLayer(editEstModal);
        await renderEstablishments();
      }
    });

    confirmDeleteBtn.onclick = async () => {
      const id = document.getElementById("deleteEstablishmentId").value;
      const res = await deleteEstablishment(id);
      alert(res.message);
      if (res.success) {
        closeLayer(deleteEstOverlay);
        await renderEstablishments();
      }
    };
  }

  // -------------------------------
  // Setup modals for Employers
  // -------------------------------
  function setupEmployerModals() {
    const openAddBtn = document.getElementById("openEmpModalBtn");
    const closeAddBtn = document.getElementById("closeEmpModalBtn");
    const cancelAddBtn = document.getElementById("cancelEmpModalBtn");
    const addForm = document.getElementById("addEmployerForm");

    const closeViewBtn = document.getElementById("closeEmpView");
    const editForm = document.getElementById("editEmpForm");
    const closeEditBtn = document.getElementById("closeEmpEditBtn");
    const cancelEditBtn = document.getElementById("cancelEmpEditBtn");

    const cancelDeleteBtn = document.getElementById("cancelDeleteEmpBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteEmpBtn");

    let rowToEdit = null;
    let rowToDelete = null;

    openAddBtn.onclick = () => showLayer(addEmpModal);
    closeAddBtn.onclick = cancelAddBtn.onclick = () => closeLayer(addEmpModal);

    addForm.addEventListener("submit", async e => {
      e.preventDefault();
      const first = document.getElementById("empFirstName").value.trim();
      const last = document.getElementById("empLastName").value.trim();
      const email = document.getElementById("empEmail").value.trim();
      const status = document.getElementById("empStatus").value;

      const res = await addEmployer(first, last, email, status);
      alert(res.message);
      if (res.success) {
        closeLayer(addEmpModal);
        addForm.reset();
        await renderEmployers();
      }
    });

    // Click handlers for view/edit/delete
    document.addEventListener("click", e => {
      const icon = e.target;
      const row = icon.closest("tr");
      if (!row || !row.closest("#employersTable")) return;

      // View
      if (icon.closest(".icon-view-emp")) {
        viewEmpDetails.innerHTML = `
          <p><b>Name:</b> ${row.children[1].textContent} ${row.children[2].textContent} ${row.children[3].textContent} ${row.children[4].textContent}</p>
          <p><b>Email:</b> ${row.children[5].textContent}</p>
          <p><b>Status:</b> ${row.children[6].innerHTML}</p>
          <p><b>Date Registered:</b> ${row.children[7].textContent}</p>
          <p><b>Address:</b> ${row.children[8].textContent}</p>
        `;
        showLayer(viewEmpOverlay);
      }

      // Edit
      if (icon.closest(".icon-edit-emp")) {
        rowToEdit = row;
        document.getElementById("editEmpFirst").value = row.children[1].textContent;
        document.getElementById("editEmpLast").value = row.children[3].textContent;
        document.getElementById("editEmpEmail").value = row.children[5].textContent;
        document.getElementById("editEmpStatus").value = row.children[6].textContent;
        document.getElementById("editEmpUserId").value = row.children[10].textContent;
        showLayer(editEmpModal);
      }

      // Delete
      if (icon.closest(".icon-delete-emp")) {
        rowToDelete = row;
        document.getElementById("deleteEmpUserId").value = row.children[10].textContent;
        deleteEmpOverlay.querySelector("#deleteEmpBody").textContent = `Are you sure you want to delete "${row.children[1].textContent} ${row.children[3].textContent}"?`;
        showLayer(deleteEmpOverlay);
      }
    });

    closeViewBtn.onclick = () => closeLayer(viewEmpOverlay);
    closeEditBtn.onclick = cancelEditBtn.onclick = () => closeLayer(editEmpModal);
    cancelDeleteBtn.onclick = () => closeLayer(deleteEmpOverlay);

    editForm.addEventListener("submit", async e => {
      e.preventDefault();
      const userId = document.getElementById("editEmpUserId").value;
      const first = document.getElementById("editEmpFirst").value.trim();
      const last = document.getElementById("editEmpLast").value.trim();
      const email = document.getElementById("editEmpEmail").value.trim();
      const status = document.getElementById("editEmpStatus").value;

      const res = await editEmployer(userId, first, last, email, status);
      alert(res.message);
      if (res.success) {
        closeLayer(editEmpModal);
        await renderEmployers();
      }
    });

    confirmDeleteBtn.onclick = async () => {
      const userId = document.getElementById("deleteEmpUserId").value;
      const res = await deleteEmployer(userId);
      alert(res.message);
      if (res.success) {
        closeLayer(deleteEmpOverlay);
        await renderEmployers();
      }
    };
  }

  // -------------------------------
  // Show / Close Layer
  // -------------------------------
  const showLayer = el => { el.style.display = "flex"; el.setAttribute("aria-hidden", "false"); };
  const closeLayer = el => { el.style.display = "none"; el.setAttribute("aria-hidden", "true"); };


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
      .select();
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
      .select("*")
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

})();

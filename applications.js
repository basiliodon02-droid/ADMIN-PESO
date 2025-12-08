if (localStorage.getItem("isLoggedIn") == "FALSE") {
  window.location.href = "./index.html";
}
document.addEventListener("DOMContentLoaded", () => {
  const on = (el, evt, fn) => {
    if (el) el.addEventListener(evt, fn);
  };

  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");

  on(profileIcon, "click", () => {
    profileDropdown?.classList.toggle("show");
  });
  window.addEventListener("click", (e) => {
    if (profileIcon && profileDropdown) {
      if (
        !profileIcon.contains(e.target) &&
        !profileDropdown.contains(e.target)
      ) {
        profileDropdown.classList.remove("show");
      }
    }
  });

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

  const tableBody = document.querySelector("#applicationsTable tbody");
  const appModal = document.getElementById("appModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const applicationForm = document.getElementById("applicationForm");
  const appModalTitle = document.getElementById("appModalTitle");
  const editIndexInput = document.getElementById("editIndex");

  const applicantNameInp = document.getElementById("applicantName");
  const jobTitleInp = document.getElementById("jobTitle");
  const establishmentInp = document.getElementById("establishment");
  const statusInp = document.getElementById("status");
  const dateAppliedInp = document.getElementById("dateApplied");

  const viewOverlay = document.getElementById("viewOverlay");
  const viewDetails = document.getElementById("viewDetails");
  const closeViewBtn = document.getElementById("closeView");

  const deleteOverlay = document.getElementById("deleteOverlay");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  const searchInput = document.getElementById("searchInput");

  let applications = JSON.parse(localStorage.getItem("applications") || "[]");
  let deleteIndex = null;

  function saveApplications() {
    localStorage.setItem("applications", JSON.stringify(applications));
  }

  // function renumber() {
  //   if (!tableBody) return;
  //   Array.from(tableBody.rows).forEach((tr, i) => {
  //     if (tr.children[0]) tr.children[0].textContent = i + 1;
  //   });
  // }

  // function renderTable() {
  //   if (!tableBody) return;
  //   tableBody.innerHTML = "";
  //   applications.forEach((app, index) => {
  //     const tr = document.createElement("tr");
  //     tr.dataset.index = index;
  //     tr.innerHTML = `
  //       <td>${index + 1}</td>
  //       <td>${app.applicantName}</td>
  //       <td>${app.jobTitle}</td>
  //       <td>${app.establishment}</td>
  //       <td>${app.status}</td>
  //       <td>${app.dateApplied}</td>
  //       <td class="action-icons">
  //         <i class="bi bi-eye-fill icon-view" title="View"></i>
  //         <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
  //         <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
  //       </td>
  //     `;
  //     tableBody.appendChild(tr);
  //   });
  //   renumber();
  // }

  // renderTable();

  function openAddModal() {
    if (!appModal || !applicationForm) return;
    applicationForm.reset();
    editIndexInput.value = "";
    appModalTitle.innerHTML =
      '<i class="bi bi-file-earmark-plus"></i> Add Application';
    appModal.style.display = "flex";
  }

  on(openModalBtn, "click", openAddModal);

  function closeAppModal() {
    if (appModal) appModal.style.display = "none";
  }
  on(closeModalBtn, "click", closeAppModal);
  on(cancelModalBtn, "click", closeAppModal);

  on(applicationForm, "submit", (e) => {
    e.preventDefault();
    const appData = {
      applicantName: applicantNameInp?.value.trim() ?? "",
      jobTitle: jobTitleInp?.value.trim() ?? "",
      establishment: establishmentInp?.value.trim() ?? "",
      status: statusInp?.value ?? "",
      dateApplied: dateAppliedInp?.value ?? "",
    };

    const editIndex = editIndexInput.value;
    if (editIndex !== "") {
      applications[parseInt(editIndex, 10)] = appData;
    } else {
      applications.push(appData);
    }

    saveApplications();
    // renderTable();
    closeAppModal();
    applicationForm.reset();
    editIndexInput.value = "";
  });

  on(tableBody, "click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    const app = applications[index];
    if (!app) return;

    if (e.target.classList.contains("icon-view")) {
      if (!viewOverlay || !viewDetails) return;
      viewDetails.innerHTML = `
        <p><b>Applicant Name:</b><span>${app.applicantName}</span></p>
        <p><b>Job Title:</b><span>${app.jobTitle}</span></p>
        <p><b>Establishment:</b><span>${app.establishment}</span></p>
        <p><b>Status:</b><span>${app.status}</span></p>
        <p><b>Date Applied:</b><span>${app.dateApplied}</span></p>
      `;
      viewOverlay.style.display = "flex";
      viewOverlay.setAttribute("aria-hidden", "false");
    }

    if (e.target.classList.contains("icon-edit")) {
      if (!appModal || !applicationForm) return;
      if (applicantNameInp) applicantNameInp.value = app.applicantName;
      if (jobTitleInp) jobTitleInp.value = app.jobTitle;
      if (establishmentInp) establishmentInp.value = app.establishment;
      if (statusInp) statusInp.value = app.status;
      if (dateAppliedInp) dateAppliedInp.value = app.dateApplied;

      editIndexInput.value = index.toString();
      appModalTitle.innerHTML =
        '<i class="bi bi-pencil-square"></i> Edit Application';
      appModal.style.display = "flex";
    }

    if (e.target.classList.contains("icon-delete")) {
      if (!deleteOverlay) return;
      deleteIndex = index;
      deleteOverlay.style.display = "flex";
      deleteOverlay.setAttribute("aria-hidden", "false");
    }
  });

  on(closeViewBtn, "click", () => {
    if (!viewOverlay) return;
    viewOverlay.style.display = "none";
    viewOverlay.setAttribute("aria-hidden", "true");
  });

  on(cancelDeleteBtn, "click", () => {
    if (!deleteOverlay) return;
    deleteOverlay.style.display = "none";
    deleteOverlay.setAttribute("aria-hidden", "true");
    deleteIndex = null;
  });

  on(confirmDeleteBtn, "click", () => {
    if (deleteIndex !== null) {
      applications.splice(deleteIndex, 1);
      saveApplications();
      // renderTable(); // re-render also re-numbers
    }
    if (deleteOverlay) {
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
    }
    deleteIndex = null;
  });

  on(searchInput, "keyup", (e) => {
    const q = e.target.value.toLowerCase();
    if (!tableBody) return;
    [...tableBody.rows].forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === viewOverlay) {
      viewOverlay.style.display = "none";
      viewOverlay.setAttribute("aria-hidden", "true");
    }
    if (e.target === deleteOverlay) {
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
      deleteIndex = null;
    }
    if (e.target === appModal) {
      closeAppModal();
    }
  });
});


window.onload = loadApplicants();

async function loadApplicants() {
  const results = await getApplicantsList();
  if (results.success === false) {
    alert(results.message); //browser alert message
  } else {
    console.log(results);
    const tableBody = document.getElementById("applicationsTable");
    // tableBody.innerHTML = "";
    let index = 0;
    for (i = 0; i < results.data.length; i++) {

      const vacancyResults = await getVacancyDetailsById(results.data[i].job_vacancy_id);
      if (vacancyResults.success === false) {
        alert(vacancyResults.message); //browser alert message
      } else {
        console.log(vacancyResults);

        if (vacancyResults.data.length > 0) {
          const establishmentResults = await getEstablishmentDetailsById(vacancyResults.data[0].establishment_id);
          if (establishmentResults.success === false) {
            alert(establishmentResults.message); //browser alert message
          } else {

            if (establishmentResults.data.length > 0) {
              index++;
              tableBody.insertAdjacentHTML(
                "beforeend",
                `
          <td>${index}</td>
          <td>${results.data[i].firstName} ${results.data[i].middleName} ${results.data[i].lastName}</td>
          <td>${vacancyResults.data[0].job_title}</td>
          <td>${establishmentResults.data[0].establishmentName}</td>
          <td>${results.data[i].applicationStatus}</td>
          <td>${results.data[i].createdDate}</td>

            `
                //             <td class="action-icons">
                //   <i style='display:none;' class="bi bi-eye-fill icon-view" title="View"></i>
                //   <i style='display:none;' class="bi bi-pencil-square icon-edit" title="Edit"></i>
                //   <i style='display:none;' class="bi bi-trash3-fill icon-delete" title="Delete"></i>
                // </td>
              );
            }


          }
        }


      }
    }


  }
}



//GET LIST OF BRGY FUNCTION
async function getApplicantsList() {
  const { data, error } = await supabase
    .from("JobApplication")
    .select("*")
    .order("application_id", { ascending: true });

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



async function getVacancyDetailsById(vacancyId) {
  const { data, error } = await supabase
    .from("JobVacancy")
    .select("*")
    .eq("vacancy_id", vacancyId)
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


async function getEstablishmentDetailsById(establishmentId) {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .eq("establishment_id", establishmentId)
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
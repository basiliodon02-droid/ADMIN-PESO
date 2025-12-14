document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }

  const userId = localStorage.getItem("userId");
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");

  profileIcon.addEventListener("click", () => {
    profileDropdown.classList.toggle("show");
  });

  window.addEventListener("click", (e) => {
    if (
      !profileIcon.contains(e.target) &&
      !profileDropdown.contains(e.target)
    ) {
      profileDropdown.classList.remove("show");
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

  const vacancyBody = document.getElementById("vacancyBody");
  let vacancies = JSON.parse(localStorage.getItem("vacancies")) || [];

  // function renderTable() {
  //   vacancyBody.innerHTML = "";
  //   vacancies.forEach((v, i) => {
  //     const row = `
  //     <tr>
  //       <td>${i + 1}</td>
  //       <td>${v.jobTitle}</td>
  //       <td>${v.industry}</td>
  //       <td>${v.establishment}</td>
  //       <td>${v.location}</td>
  //       <td>${v.employmentType}</td>
  //       <td><span class="badge ${
  //         v.status === "Active" ? "active" : "pending"
  //       }">${v.status}</span></td>
  //       <td>${v.datePosted}</td>
  //       <td class="action-icons">
  //         <i class="bi bi-eye-fill icon-view" title="View" data-index="${i}"></i>
  //         <i class="bi bi-pencil-square icon-edit" title="Edit" data-index="${i}"></i>
  //         <i class="bi bi-trash3-fill icon-delete" title="Delete" data-index="${i}"></i>
  //       </td>
  //     </tr>`;
  //     vacancyBody.insertAdjacentHTML("beforeend", row);
  //   });
  //   localStorage.setItem("vacancies", JSON.stringify(vacancies));
  // }
  // renderTable();


  window.onload = getAllIndustry();
  window.onload = getAllEstablishment();
  window.onload = renumberJobVacancy();


  async function renumberJobVacancy() {
    // if (!tableBody) return;
    // [...tableBody.rows].forEach((r, i) => {
    //   if (r.children[0]) r.children[0].textContent = i + 1;
    // });
    vacancyBody.insertAdjacentHTML(
      "beforeend",
      `
                <tr>
                  <td colspan=10 style='text-align:center;'>LOADING...</td>  
                </tr>
                `
    );

    const result = await getVacancyList();
    if (result.success === false) {
      alert(result.message); //browser alert message
    } else {
      //added td for industry_id but only hidden
      console.log(1);
      vacancyBody.innerHTML = "";
      result.data.forEach(async (item, i) => {
        console.log(i, "this is i");
        let establishmentId = result?.data[i]?.establishment_id;
        let industryId = result?.data[i]?.industry_id;
        let vacancyId = result?.data[i]?.vacancy_id;
        let jobTitle = result?.data[i]?.job_title;
        let location = result?.data[i]?.location;
        let employmentType = result?.data[i]?.employment_type;
        let status = result?.data[i]?.status;
        let createdDate = result?.data[i]?.created_date;

        let establishmentName = "";
        let industryName = "";

        let foundIndustryName = false;
        let foundEstablishmentName = false;

        //get industry name
        const jobIndustry = await getIndustryById(industryId);
        if (jobIndustry.success === false) {
          foundIndustryName = false;
        } else {
          console.log(2);
          industryName = jobIndustry.data[0].industry_name;
          foundIndustryName = true;

          const jobEstablishment = await getEstablishmentById(establishmentId);

          if (jobEstablishment.success === false) {
            foundEstablishmentName = false;
          } else {
            console.log(3);
            foundEstablishmentName = true;
            establishmentName = jobEstablishment.data[0].establishmentName;

            if (foundIndustryName && foundEstablishmentName) {
              console.log(jobTitle, i)
              const index = vacancyBody.rows.length + 1;
              vacancyBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr>
                  <td>${index}</td>
                  <td>${jobTitle ?? "-"}</td>
                  <td>${industryName ?? "-"}</td>
                  <td>${establishmentName ?? "-"}</td>
                  <td>${location ?? "-"}</td>
                  <td>${employmentType ?? "-"}</td>
                  <td><span class="badge ${status === "Active" ? "active" : "pending"}">${status != undefined ? status : '-'}</span></td>
                  <td>${createdDate != undefined ? new Date(createdDate).toISOString().split("T")[0] : "-"} </td>
                  <td class="action-icons">
                    <i class="bi bi-eye-fill icon-view" title="View" data-index="${i}"></i>
                    <i class="bi bi-pencil-square icon-edit" title="Edit" data-index="${i}"></i>
                    <i class="bi bi-trash3-fill icon-delete" title="Delete" data-index="${i}"></i>
                  </td>
                  <td style='display:none;'>${vacancyId ?? 0}</td>
                  <td style='display:none;'>${industryId ?? 0}</td>
                  <td style='display:none;'>${establishmentId ?? 0}</td>
                </tr>
                `
              );


            }
          }
        }

      });
      // for (i = 0; i < result.data.length; i++) {
      //         }
    }
  }


  const jobModal = document.getElementById("jobModal");
  const addBtn = document.getElementById("addBtn");
  const cancelModal = document.getElementById("cancelModal");
  const jobForm = document.getElementById("jobForm");

  addBtn.onclick = () => {
    document.getElementById("modalTitle").textContent = "Add Job Vacancy";
    jobForm.reset();
    document.getElementById("editIndex").value = "";
    document.getElementById("jobVacancyId").value = "";
    jobModal.style.display = "flex";
  };
  cancelModal.onclick = () => (jobModal.style.display = "none");

  jobForm.onsubmit = async (e) => {
    e.preventDefault();
    console.log(userId)
    const vacancyData = {
      user_id: userId,
      jobTitle: jobForm.jobTitle.value,
      industry: jobForm.industry.value,
      establishment: jobForm.establishment.value,
      location: jobForm.location.value,
      employmentType: jobForm.employmentType.value,
      status: jobForm.status.value,
      datePosted: new Date().toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    if (!jobForm.jobTitle.value) return;

    const jobVacancyId = document.getElementById("jobVacancyId").value;
    if (jobVacancyId) {
      // vacancies[editIndex] = vacancyData;
      const result = await editVacancy(
        jobVacancyId,
        vacancyData.jobTitle,
        vacancyData.industry,
        vacancyData.establishment,
        vacancyData.location,
        vacancyData.employmentType,
        vacancyData.status
      );
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberJobVacancy();
        jobModal.style.display = "none";
      }
    } else {
      // vacancies.push(vacancyData);
      const result = await addVacancy(
        vacancyData.jobTitle,
        vacancyData.industry,
        vacancyData.establishment,
        vacancyData.location,
        vacancyData.employmentType,
        vacancyData.status,
        vacancyData.user_id
      );
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberJobVacancy();
        jobModal.style.display = "none";
      }
    }
  };

  const viewOverlay = document.getElementById("viewOverlay");
  const viewDetails = document.getElementById("viewDetails");
  const closeView = document.getElementById("closeView");
  const deleteOverlay = document.getElementById("deleteOverlay");

  closeView.onclick = () => {
    viewOverlay.style.display = "none";
    viewOverlay.setAttribute("aria-hidden", "true");
  };

  vacancyBody.addEventListener("click", (e) => {
    // const index = e.target.dataset.index;
    const iconView = e.target.closest(".icon-view");
    const iconEdit = e.target.closest(".icon-edit");
    const iconDelete = e.target.closest(".icon-delete");

    if (e.target.classList.contains("icon-view")) {
      // const v = vacancies[index];
      // viewDetails.innerHTML = `
      // <p><b>Job Title:</b><span>${v.jobTitle}</span></p>
      // <p><b>Industry:</b><span>${v.industry}</span></p>
      // <p><b>Establishment:</b><span>${v.establishment}</span></p>
      // <p><b>Location:</b><span>${v.location}</span></p>
      // <p><b>Employment Type:</b><span>${v.employmentType}</span></p>
      // <p><b>Status:</b><span>${v.status}</span></p>
      // <p><b>Date Posted:</b><span>${v.datePosted}</span></p>`;
      // viewOverlay.style.display = "flex";
      // viewOverlay.setAttribute("aria-hidden", "false");

      const row = iconView.closest("tr");
      const title = row.children[1].textContent.trim();
      const industry = row.children[2].textContent.trim();
      const establishment = row.children[3].textContent.trim();
      const location = row.children[4].textContent.trim();
      const employmentType = row.children[5].textContent.trim();
      const status = row.children[6].textContent.trim();
      const datePosted = row.children[7].textContent.trim();

      viewDetails.innerHTML = `
      <p><b>Job Title:</b><span>${title}</span></p>
      <p><b>Industry:</b><span>${industry}</span></p>
      <p><b>Establishment:</b><span>${establishment}</span></p>
      <p><b>Location:</b><span>${location}</span></p>
      <p><b>Employment Type:</b><span>${employmentType}</span></p>
      <p><b>Status:</b><span>${status}</span></p>
      <p><b>Date Posted:</b><span>${datePosted}</span></p>`;

      viewOverlay.style.display = "flex";
      viewOverlay.setAttribute("aria-hidden", "false");
    }

    if (e.target.classList.contains("icon-edit")) {
      // const v = vacancies[index];
      document.getElementById("modalTitle").textContent = "Edit Job Vacancy";

      const row = iconEdit.closest("tr");
      const title = row.children[1].textContent.trim();
      const industry = row.children[10].textContent.trim();
      const establishment = row.children[11].textContent.trim();
      const location = row.children[4].textContent.trim();
      const employmentType = row.children[5].textContent.trim();
      const status = row.children[6].textContent.trim();
      const datePosted = row.children[7].textContent.trim();

      jobForm.jobTitle.value = title;
      jobForm.industry.value = industry;
      jobForm.establishment.value = establishment;
      jobForm.location.value = location;
      jobForm.employmentType.value = employmentType;
      jobForm.status.value = status;
      document.getElementById("jobVacancyId").value =
        row.children[9].textContent.trim();
      jobModal.style.display = "flex";
    }

    if (e.target.classList.contains("icon-delete")) {
      deleteOverlay.style.display = "flex";
      deleteOverlay.setAttribute("aria-hidden", "false");
      const row = iconDelete.closest("tr");
      document.getElementById("jobVacancyId").value =
        row.children[9].textContent.trim();
      deleteLabel = document.getElementById("deleteLabel");
      deleteLabel.textContent = `Are you sure you want to delete "${row.children[1].textContent.trim()}"?`;

      document.getElementById("confirmDelete").onclick = async () => {
        const result = await deleteVacancy(document.getElementById("jobVacancyId").value);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          document.getElementById("jobVacancyId").value = "";
          renumberJobVacancy();
          deleteOverlay.style.display = "none";
          deleteOverlay.setAttribute("aria-hidden", "true");
        }
      };
    }
  });

  document.getElementById("cancelDelete").onclick = () => {
    deleteOverlay.style.display = "none";
    deleteOverlay.setAttribute("aria-hidden", "true");
  };

  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    const filter = e.target.value.toLowerCase();
    Array.from(vacancyBody.children).forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  });

  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
    if (e.target === viewOverlay) {
      viewOverlay.style.display = "none";
      viewOverlay.setAttribute("aria-hidden", "true");
    }
    if (
      e.target === deleteOverlay ||
      e.target.classList.contains("skl-overlay")
    ) {
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
    }
  };
});

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

      // Create a new option element
      const option = document.createElement("option");

      // Set the text and value for the option
      option.text = result.data[i].industry_name;
      option.value = result.data[i].industry_id;
      // Append the option to the select element
      addIndustrySelect.appendChild(option);
    }
  }
}

//fill up establishment drop down with list from Establishment table (db)
async function getAllEstablishment() {
  const result = await getEstablishmentList();
  if (result.success === false) {
    alert(result.message); //browser alert message
  } else {
    //added td for industry_id but only hidden
    for (i = 0; i < result.data.length; i++) {
      // Get the select element
      const addEstablishmentSelect = document.getElementById("establishment");

      // Create a new option element
      const option = document.createElement("option");

      // Set the text and value for the option
      option.text = result.data[i].establishmentName;
      option.value = result.data[i].establishment_id;
      // Append the option to the select element
      addEstablishmentSelect.appendChild(option);
    }
  }
}

//GET LIST OF INDUSTRY FUNCTION
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

//GET LIST OF JOB VACANCIES FUNCTION
async function getVacancyList() {
  const { data, error } = await supabase
    .from("JobVacancy")
    .select("*")
    .neq("status", "Deleted")
    .order("vacancy_id", { ascending: true });

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

async function getIndustryById(industry_id) {
  const { data, error } = await supabase
    .from("Industry")
    .select("*")
    .eq("industry_id", industry_id);

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

async function getEstablishmentById(establishment_id) {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .eq("establishment_id", establishment_id);

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

// ADD VACANCY FUNCTION
async function addVacancy(
  job_title,
  industry_id,
  establishment_id,
  location,
  employmentType,
  status,
  user_id
) {
  const { data, error } = await supabase.from("JobVacancy").insert([
    {
      job_title: job_title,
      industry_id: industry_id,
      establishment_id: establishment_id,
      location: location,
      employment_type: employmentType,
      status: status,
      user_id: user_id,
    },
  ]);

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: "Job Vacancy Added!",
      success: true,
    };
  }
}

//EDIT JOB VACANCY FUNCTION
async function editVacancy(
  vacancy_id,
  job_title,
  industry_id,
  establishment_id,
  location,
  employmentType,
  status
) {
  const { error } = await supabase
    .from("JobVacancy")
    .update({
      job_title: job_title,
      industry_id: industry_id,
      establishment_id: establishment_id,
      location: location,
      employment_type: employmentType,
      status: status,
    })
    .eq("vacancy_id", vacancy_id) // your condition
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: `Job Vacancy Updated!`,
      success: true,
    };
  }
}

// DELETE SKILL FUNCTION
async function deleteVacancy(vacancy_id) {
  const { data, error } = await supabase
    .from("JobVacancy")
    .update({
      status: "Deleted",
    })
    .eq("vacancy_id", vacancy_id)
    .select() // optional: returns deleted row
    .throwOnError();

  if (error || data.length === 0) {
    return {
      message: error?.message || "Foreign key prevents deletion.",
      success: false,
    };
  } else {
    return {
      message: `Job Vacancy Deleted!`,
      success: true,
    };
  }
}

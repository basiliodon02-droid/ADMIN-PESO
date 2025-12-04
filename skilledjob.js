document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }
  function toggleProfileMenu() {
    const profileMenu = document.getElementById("profile-menu");
    profileMenu.classList.toggle("show");
  }
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

  const tableBody = document.getElementById("skilledTableBody");
  const addEditModal = document.getElementById("addEditModal");
  const addEditTitle = document.getElementById("addEditTitle");
  const jobTitleInput = document.getElementById("jobTitleInput");
  const industryInput = document.getElementById("industryInput");

  const viewOverlay = document.getElementById("viewOverlay");
  const viewDetails = document.getElementById("viewDetails");
  const deleteOverlay = document.getElementById("deleteOverlay");
  const deleteLabel = document.getElementById("deleteLabel");
  const skilledJobIdInput = document.getElementById("skilledJobIdInput");
  const deleteSkilledJobIdInput = document.getElementById(
    "deleteSkilledJobIdInput"
  );

  let editingRowIndex = null;
  let deleteRowIndex = null;

  window.onload = getAllIndustry(); //get list of industry for industry drop down
  window.onload = renumberSkilledJobs();

  async function renumberSkilledJobs() {
    // if (!tableBody) return;
    // [...tableBody.rows].forEach((r, i) => {
    //   if (r.children[0]) r.children[0].textContent = i + 1;
    // });
    const result = await getSkilledJobList();
    if (result.success === false) {
      
      alert(result.message); //browser alert message
    } else {
      //added td for industry_id but only hidden
      tableBody.innerHTML = "";
      var i=0;
     result.data.forEach(item => {
        tableBody.insertAdjacentHTML(
          "beforeend",
          `
        <tr>
          <td>${i + 1}</td>
          <td>${item.SkilledJob.job_name}</td>
          <td>${item.Industry.industry_name}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style='display:none;'>${item.SkilledJob.job_id}</td>
        </tr>
        `
        );
        i++;
      });
    }
  }

  document.getElementById("openAddModalBtn").onclick = () => {
    editingRowIndex = null;
    addEditTitle.textContent = "Add Skilled Job";
    jobTitleInput.value = "";
    industryInput.value = "";
    addEditModal.style.display = "flex";
    addEditModal.setAttribute("aria-hidden", "false");
    jobTitleInput.focus();
  };

  document.getElementById("cancelAddEditBtn").onclick = () => {
    addEditModal.style.display = "none";
    addEditModal.setAttribute("aria-hidden", "true");
  };

  document.getElementById("saveJobBtn").onclick = async () => {
    const title = jobTitleInput.value.trim();
    const industry = industryInput.value.trim();
    if (!title) {
      jobTitleInput.focus();
      return;
    }
    if (!industry) {
      jobTitleInput.focus();
      return;
    }

    if (editingRowIndex === null) {
      //   const newIndex = tableBody.rows.length + 1;
      //   const tr = document.createElement("tr");
      //   tr.innerHTML = `
      //   <td>${newIndex}</td>
      //   <td>${title}</td>
      //   <td>${industry || "-"}</td>
      //   <td class="action-icons">
      //     <i class="bi bi-eye-fill icon-view" title="View"></i>
      //     <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
      //     <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
      //   </td>
      // `;
      //   tableBody.appendChild(tr);

  const industryId= await getSelectedindustryId(industry);
      
      const result = await addSkilledJob(title);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberSkilledJobs();
        addEditModal.style.display = "none";
        addEditModal.setAttribute("aria-hidden", "true");
      }

      const jobId= await getNewJobId();
      const assignment=await setJobIndustryAssignment(industryId.data[0].industry_id,jobId.data[0].job_id);
      if (assignment.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
      }
    } else {
      const skillsId = skilledJobIdInput.value.trim();

      const result = await editSkilledJob(skillsId, title, industry);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberSkilledJobs();
        addEditModal.style.display = "none";
        addEditModal.setAttribute("aria-hidden", "true");
      }

      // const row = tableBody.rows[editingRowIndex];
      // row.children[1].textContent = title;
      // row.children[2].textContent = industry || "-";
    }
  };

  document.addEventListener("click", (e) => {
    const iconView = e.target.closest(".icon-view");
    const iconEdit = e.target.closest(".icon-edit");
    const iconDelete = e.target.closest(".icon-delete");

    if (iconView) {
      const row = iconView.closest("tr");
      const title = row.children[1].textContent.trim();
      const industry = row.children[2].textContent.trim();

      viewDetails.innerHTML = `
      <p><b>Job Title:</b><span>${title}</span></p>
      <p><b>Industry:</b><span>${industry}</span></p>
    `;
      viewOverlay.style.display = "flex";
      viewOverlay.setAttribute("aria-hidden", "false");
      return;
    }

    if (iconEdit) {
      const row = iconEdit.closest("tr");
      editingRowIndex = row.rowIndex - 1; // tbody index
      addEditTitle.textContent = "Edit Skilled Job";
      jobTitleInput.value = row.children[1].textContent.trim();
      const indText = row.children[2].textContent.trim();
      skilledJobIdInput.value = row.children[4].textContent.trim();
      industryInput.value = indText === "-" ? "" : indText;
      addEditModal.style.display = "flex";
      addEditModal.setAttribute("aria-hidden", "false");
      jobTitleInput.focus();
      return;
    }

    if (iconDelete) {
      const row = iconDelete.closest("tr");
      deleteRowIndex = row.rowIndex - 1;
      const title = row.children[1].textContent.trim();
      deleteSkilledJobIdInput.value = row.children[4].textContent.trim();
      deleteLabel.textContent = `Are you sure you want to delete "${title}"?`;
      deleteOverlay.style.display = "flex";
      deleteOverlay.setAttribute("aria-hidden", "false");
      return;
    }
  });

  document.getElementById("closeView").onclick = () => {
    viewOverlay.style.display = "none";
    viewOverlay.setAttribute("aria-hidden", "true");
  };

  document.getElementById("cancelDeleteBtn").onclick = () => {
    deleteOverlay.style.display = "none";
    deleteOverlay.setAttribute("aria-hidden", "true");
    deleteRowIndex = null;
  };

  document.getElementById("confirmDeleteBtn").onclick = async () => {
    // if (deleteRowIndex !== null) {
    //   tableBody.deleteRow(deleteRowIndex);
    //   [...tableBody.rows].forEach(
    //     (r, i) => (r.children[0].textContent = i + 1)
    //   );
    // }

    const skillsId = deleteSkilledJobIdInput.value.trim();
    if (skillsId !== null) {
      const result = await deleteSkilledJob(skillsId);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberSkilledJobs();
        deleteOverlay.style.display = "none";
        deleteOverlay.setAttribute("aria-hidden", "true");
        deleteRowIndex = null;
      }
    }
  };

  window.addEventListener("click", (e) => {
    if (e.target === addEditModal) {
      addEditModal.style.display = "none";
      addEditModal.setAttribute("aria-hidden", "true");
    }
    if (e.target === viewOverlay) {
      viewOverlay.style.display = "none";
      viewOverlay.setAttribute("aria-hidden", "true");
    }
    if (e.target === deleteOverlay) {
      deleteOverlay.style.display = "none";
      deleteOverlay.setAttribute("aria-hidden", "true");
      deleteRowIndex = null;
    }
  });

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    [...tableBody.rows].forEach((row) => {
      const title = row.children[1].textContent.toLowerCase();
      const industry = row.children[2].textContent.toLowerCase();
      row.style.display =
        title.includes(q) || industry.includes(q) ? "" : "none";
    });
  });

  renumberSkilledJobs();
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
      const addIndustrySelect = document.getElementById("industryInput");
      // const editIndustrySelect = document.getElementById("editIndustry");

      // Create a new option element
      const option = document.createElement("option");

      // Set the text and value for the option
      option.text = result.data[i].industry_name;
      option.value = result.data[i].industry_name;
      // Append the option to the select element
      addIndustrySelect.appendChild(option);
    }
  }
}

//GET LIST OF INDUSTRY FUNCTION FOR DROPDOWN
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

//GET LIST OF SKILLS FUNCTION
async function getSkilledJobList() {
  const { data, error } = await supabase
    .from("IndustryJobs")
    .select("industry_id,job_id,Industry(*),SkilledJob(*)")
    .order("job_id", { ascending: true });

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

//get selected industry ID 
async function getSelectedindustryId(industry) {
  const { data, error } = await supabase
    .from("Industry")
    .select("industry_id")
    .eq("industry_name", industry)
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

//get newly added Job Id
async function getNewJobId() {
  const { data, error } = await supabase
    .from("SkilledJob")
    .select("job_id")
    .order("createdAt", { ascending: false })
    .limit(1);


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

//set Job Industry Assignment
async function setJobIndustryAssignment(industryid,jobid) {
  /*const { data, error } = await supabase
    .from("IndustryJobs")
    .insert({industry_id: industryid,job_id: jobid})*/
    const {data, error } = await supabase.from("IndustryJobs").insert([
        {
          industry_id: industryid,job_id: jobid,
        },
  ]);
    

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: "got it",
      success: true,
    };
  }
}

// ADD SKILL FUNCTION
async function addSkilledJob(name) {

  const { data, error } = await supabase.from("SkilledJob").insert([
    {
      job_name: name,
    },
  ]);


  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: "Skilled Job Added!",
      success: true,
    };
  }
  
}

//EDIT SKILL FUNCTION
async function editSkilledJob(job_id, name, industry) {
  const { error } = await supabase
    .from("SkilledJob")
    .update({
      job_name: name,
      industry: industry,
    })
    .eq("job_id", job_id) // your condition
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: `Skilled Job Updated!`,
      success: true,
    };
  }
}

// DELETE SKILL FUNCTION
async function deleteSkilledJob(job_id) {
  const { data, error } = await supabase
    .from("SkilledJob")
    .delete()
    .eq("job_id", job_id)
    .select() // optional: returns deleted row
    .throwOnError();

  if (error || data.length === 0) {
    return {
      message: error?.message || "Foreign key prevents deletion.",
      success: false,
    };
  } else {
    return {
      message: `Skilled Job Deleted!`,
      success: true,
    };
  }
}


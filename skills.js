(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("isLoggedIn") == "FALSE") {
      window.location.href = "./index.html";
    }
    function toggleProfileMenu() {
      const profileMenu = document.getElementById("profile-menu");
      profileMenu.classList.toggle("show");
    }

    (function openDefault() {
      const master = document.querySelector(".nav-item > .toggle-menu");
      const submenu = master && master.nextElementSibling;
      if (submenu && !submenu.classList.contains("show"))
        submenu.classList.add("show");
    })();

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

    const skillsTableBody = document.getElementById("skillsTableBody");

    const addModal = document.getElementById("addModal");
    const editModal = document.getElementById("editModal");
    const viewOverlay = document.getElementById("viewOverlay");
    const viewDetails = document.getElementById("viewDetails");
    const deleteOverlay = document.getElementById("deleteOverlay");
    const deleteLabel = document.getElementById("deleteLabel");

    const addSkillName = document.getElementById("addSkillName");
    const addRelatedJob = document.getElementById("addRelatedJob");
    const editSkillName = document.getElementById("editSkillName");
    const editRelatedJob = document.getElementById("editRelatedJob");
    const editSkillsId = document.getElementById("editSkillsId");
    const deleteSkillsId = document.getElementById("deleteSkillsId");
    const deleteSkillsAssignmentId = document.getElementById(
      "deleteSkillAssignmentId"
    );

    const editAssignJob = document.getElementById("editAssignJob");
    const assignJob = document.getElementById("assignJob");

    let editIndex = null;
    let deleteIndex = null;

    async function renumberSkills() {
      // if (!skillsTableBody) return;
      // Array.from(skillsTableBody.rows).forEach((r, i) => {
      //   if (r.children[0]) r.children[0].innerText = i + 1;
      // });

      const result = await getSkillsList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        //added td for industry_id but only hidden
        skillsTableBody.innerHTML = "";
        console.log(result.data);
        for (i = 0; i < result.data.length; i++) {
          skillsTableBody.insertAdjacentHTML(
            "beforeend",
            `
        <tr>
          <td>${i + 1}</td>
          <td>${result.data[i].name}</td>
          <td>${result.data[i].related_job}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style='display:none;'>${result.data[i].skills_id}</td>
          <td style='display:none;'>${
            result.data[i].SkillAssignment[0].job_id
          }</td>
          <td style='display:none;'>${
            result.data[i].SkillAssignment[0].skill_assignment_id
          }</td>
        </tr>
        `
          );
        }
      }
    }

    function show(el) {
      el.style.display = "flex";
      el.setAttribute("aria-hidden", "false");
    }
    function hide(el) {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }

    document.getElementById("openAddModalBtn").onclick = () => {
      renderJobOptions();
      editIndex = null;
      addSkillName.value = "";
      addRelatedJob.value = "";
      show(addModal);
      addSkillName.focus();
    };

    document.getElementById("cancelAddBtn").onclick = () => hide(addModal);

    document.getElementById("cancelEditBtn").onclick = () => {
      hide(editModal);
      editIndex = null;
    };

    document.getElementById("saveSkillBtn").onclick = async () => {
      const name = addSkillName.value.trim();
      const desc = addRelatedJob.value.trim();
      const job_id = document.getElementById("assignJob").value.trim();
      if (!name) return;

      //check if skill name already exist
      const skillDetails = await checkIfSkillNameExist(name);
      if (skillDetails.data.length > 0) {
        console.log("skill name exist");
        const skills_id = skillDetails.data[0].skills_id;
        //then check if skill id and job id pair already exist in skillassignment
        const checkSkillAssignmentResult = await checkSkillAssignment(
          job_id,
          skills_id
        );
        console.log(checkSkillAssignmentResult.data);
        if (checkSkillAssignmentResult.data.length > 0) {
          alert(
            "This Skill with Job Role is already assigned. Please choose a different Job Role or Skill."
          );
          return;
        } else {
          //proceed to add skill and skill assignment
          const result = await addSkill(name, desc);
          if (result.success === false) {
            alert(result.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            const newSkillId = await getNewSkillId();
            const assignment = await setJobSkillAssignment(
              job_id,
              newSkillId.data[0].skills_id
            );
            if (assignment.success === false) {
              alert(assignment.message); //browser alert message
            } else {
              alert(assignment.message); //browser alert message
              renumberSkills();
              addSkillName.value = "";
              addRelatedJob.value = "";
              hide(addModal);
            }
          }
        }
      } else {
        console.log("skill name doesn't exist yet");
        //proceed to add skill and skill assignment
        const result = await addSkill(name, desc);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          const newSkillId = await getNewSkillId();
          const assignment = await setJobSkillAssignment(
            job_id,
            newSkillId.data[0].skills_id
          );
          if (assignment.success === false) {
            alert(assignment.message); //browser alert message
          } else {
            alert(assignment.message); //browser alert message
            renumberSkills();
            addSkillName.value = "";
            addRelatedJob.value = "";
            hide(addModal);
          }
        }
      }
    };

    document.addEventListener("click", (e) => {
      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");

      if (iconView) {
        const row = iconView.closest("tr");
        const skill = row.children[1].innerText;
        const job = row.children[2].innerText;

        viewDetails.innerHTML = `
      <p><b>Skill Name:</b><span>${skill}</span></p>
      <p><b>Related Job:</b><span>${job}</span></p>
    `;

        show(viewOverlay);
        return;
      }

      if (iconEdit) {
        renderJobOptions();
        const row = iconEdit.closest("tr");
        editIndex = row.rowIndex - 1;
        console.log(row.children[5].innerText);
        editSkillName.value = row.children[1].innerText;
        editRelatedJob.value = row.children[2].innerText;
        editSkillsId.value = row.children[4].innerText;
        editAssignJob.value = row.children[5].innerText;
        document.getElementById("editJobId").value = row.children[5].innerText;
        show(editModal);
        return;
      }

      if (iconDelete) {
        const row = iconDelete.closest("tr");
        deleteIndex = row.rowIndex - 1;

        const skill = row.children[1].innerText;
        const job = row.children[2].innerText;
        deleteSkillsId.value = row.children[4].innerText;
        deleteSkillsAssignmentId.value = row.children[6].innerText;
        deleteLabel.textContent = `Are you sure you want to delete "${skill} — ${job}"?`;

        show(deleteOverlay);
        return;
      }
    });

    document.getElementById("updateSkillBtn").onclick = async () => {
      if (editIndex === null) return;

      const name = editSkillName.value.trim();
      const desc = editRelatedJob.value.trim();
      const skillId = editSkillsId.value.trim();
      const job_id = editAssignJob.value.trim();

      if (!name) return;

      // const result = await editSkill(skillsId, name, job);
      // if (result.success === false) {
      //   alert(result.message); //browser alert message
      // } else {
      //   alert(result.message); //browser alert message

      // }

      //edit skill in db
      //check if skill name already exist
      const skillDetails = await checkIfSkillNameExist(name);
      if (skillDetails.data.length > 0) {
        console.log("edited skill name exist");
        const skills_id = skillDetails.data[0].skills_id;
        //then check if skill id and job id pair already exist in skillassignment
        const checkSkillAssignmentResult = await checkSkillAssignment(
          job_id,
          skills_id
        );
        //if a duplicate skills_id and job_id pair is found and is NOT the current one being edited
        if (
          checkSkillAssignmentResult.data.length > 0 &&
          checkSkillAssignmentResult.data[0].skills_id !== skillId
        ) {
          alert(
            "This Skill with Job Role is already assigned. Please choose a different Job Role or Skill."
          );
          return;
        } else {
          //proceed to EDIT skill and skill assignment
          console.log(1);
          const result = await editSkill(skillId, name, desc);
          if (result.success === false) {
            alert(result.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            //edit JobSkillAssignment
            const assignment = await editJobSkillAssignment(job_id, skillId);
            if (assignment.success === false) {
              alert(assignment.message); //browser alert message
            } else {
              alert(assignment.message); //browser alert message
              renumberSkills(); //reloads the table data
              hide(editModal);
              editIndex = null;
            }
          }
        }
      } else {
        //editing skill with new name
        //proceed to EDIT skill and skill assignment
        console.log(2);
        const result = await editSkill(skillId, name, desc);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          //edit JobSkillAssignment
          const assignment = await editJobSkillAssignment(job_id, skillId);
          if (assignment.success === false) {
            alert(assignment.message); //browser alert message
          } else {
            alert(assignment.message); //browser alert message
            renumberSkills(); //reloads the table data
            hide(editModal);
            editIndex = null;
          }
        }
      }
    };

    document.getElementById("cancelDeleteBtn").onclick = () => {
      hide(deleteOverlay);
      deleteIndex = null;
    };

    document.getElementById("confirmDeleteBtn").onclick = async () => {
      // const skillsId = deleteSkillsId.value.trim();
      // if (skillsId !== null) {
      //   const result = await deleteSkill(skillsId);
      //   if (result.success === false) {
      //     alert(result.message); //browser alert message
      //   } else {
      //     alert(result.message); //browser alert message
      //     renumberSkills(); //reloads the table data
      //     hide(deleteOverlay);
      //     deleteIndex = null;
      //   }
      // }

      const skill_assignment_id = deleteSkillsAssignmentId.value;

      //delete skill from job skill assignment first
      const jobSkillAssignmentResult = await deleteJobSkillAssignment(
        skill_assignment_id
      );
      if (jobSkillAssignmentResult.success === false) {
        alert(jobSkillAssignmentResult.message);
        return;
      } else {
        alert(jobSkillAssignmentResult.message);
        const skill_id = deleteSkillsId.value;
        const result = await deleteSkill(skill_id);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          renumberSkills(); //reloads the table data
          hide(deleteOverlay);
          deleteIndex = null;
        }
      }
    };

    document.getElementById("closeView").onclick = () => hide(viewOverlay);

    window.addEventListener("click", (e) => {
      if (e.target === addModal) hide(addModal);
      if (e.target === editModal) hide(editModal);
      if (e.target === viewOverlay) hide(viewOverlay);
      if (e.target === deleteOverlay) hide(deleteOverlay);
    });

    document.getElementById("searchInput").addEventListener("input", () => {
      const q = document.getElementById("searchInput").value.toLowerCase();
      Array.from(skillsTableBody.rows).forEach((row) => {
        const skill = row.children[1].innerText.toLowerCase();
        const job = row.children[2].innerText.toLowerCase();
        row.style.display = skill.includes(q) || job.includes(q) ? "" : "none";
      });
    });

    function escapeHtml(str = "") {
      return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    renumberSkills();

    //GET LIST OF SKILLS FUNCTION
    async function getSkillsList() {
      const { data, error } = await supabase
        .from("Skills")
        .select("*, SkillAssignment(*)")
        .order("skills_id", { ascending: true });

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

    // ADD SKILL FUNCTION
    async function addSkill(name, related_job) {
      const { data, error } = await supabase.from("Skills").insert([
        {
          name: name,
          related_job: related_job,
        },
      ]);

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: "Skill Added!",
          success: true,
        };
      }
    }

    //EDIT SKILL FUNCTION
    async function editSkill(skills_id, name, related_job) {
      const { error } = await supabase
        .from("Skills")
        .update({
          name: name,
          related_job: related_job,
        })
        .eq("skills_id", skills_id) // your condition
        .select();

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: `Skill Updated!`,
          success: true,
        };
      }
    }

    // DELETE SKILL FUNCTION
    async function deleteSkill(skills_id) {
      const { data, error } = await supabase
        .from("Skills")
        .delete()
        .eq("skills_id", skills_id)
        .select() // optional: returns deleted row
        .throwOnError();

      if (error || data.length === 0) {
        return {
          message: error?.message || "Foreign key prevents deletion.",
          success: false,
        };
      } else {
        return {
          message: `Skill Deleted!`,
          success: true,
        };
      }
    }

    fetchedJobRoles = [];

    window.onload = getSkilledJobList();

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
        fetchedJobRoles = data; //update fetched job roles local array
        return {
          message: "got it",
          success: true,
          data: data,
        };
      }
    }

    async function renderJobOptions() {
      const assignJob = document.getElementById("assignJob");
      const editAssignJob = document.getElementById("editAssignJob");
      assignJob.innerHTML = "";
      editAssignJob.innerHTML = "";
      console.log(fetchedJobRoles);
      for (i = 0; i < fetchedJobRoles.length; i++) {
        // Get the select element

        // Create a new option element
        const option = document.createElement("option");

        // Set the text and value for the option
        option.text = `${
          fetchedJobRoles[i].SkilledJob.job_name +
          " (" +
          (fetchedJobRoles[i].Industry.industry_name
            ? fetchedJobRoles[i].Industry.industry_name
            : "No industry") +
          ")"
        }`;
        option.value = `${fetchedJobRoles[i].job_id}`;
        // Append the option to the select element
        assignJob.appendChild(option);

        // Create a new option element
        const option2 = document.createElement("option");

        // Set the text and value for the option
        option2.text = `${
          fetchedJobRoles[i].SkilledJob.job_name +
          " (" +
          (fetchedJobRoles[i].Industry.industry_name
            ? fetchedJobRoles[i].Industry.industry_name
            : "No industry") +
          ")"
        }`;
        option2.value = `${fetchedJobRoles[i].job_id}`;
        editAssignJob.appendChild(option2);
      }
    }

    //CHECK IF SKILL NAME ALREADY EXISTS FUNCTION
    async function checkIfSkillNameExist(name) {
      const { data, error } = await supabase
        .from("Skills")
        .select("*")
        .eq("name", name);

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

    //CHECK IF SKILL ASSIGNMENT ALREADY EXISTS FUNCTION
    async function checkSkillAssignment(job_id, skills_id) {
      let new_skills_id = parseInt(skills_id);
      console.log("inside", job_id, new_skills_id);
      const { data, error } = await supabase
        .from("SkillAssignment")
        .select("*")
        .eq("job_id", job_id)
        .eq("skills_id", new_skills_id);

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

    //get newly added Skill Id
    async function getNewSkillId() {
      const { data, error } = await supabase
        .from("Skills")
        .select("skills_id")
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

    //set Job Skill Assignment
    async function setJobSkillAssignment(job_id, skills_id) {
      const { data, error } = await supabase.from("SkillAssignment").insert([
        {
          job_id: job_id,
          skills_id: skills_id,
        },
      ]);
      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: "Job Skill Assignment Added!",
          success: true,
        };
      }
    }

    async function editJobSkillAssignment(job_id, skills_id) {
      //will not edit the skill id since its really the skill name being changed
      const { error } = await supabase
        .from("SkillAssignment")
        .update({
          job_id: job_id,
        })
        .eq("skills_id", skills_id) // your condition
        .select();

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: `Job Skill Assignment Updated!`,
          success: true,
        };
      }
    }

    async function deleteJobSkillAssignment(skill_assignment_id) {
      //will not edit the skill id since its really the skill name being changed
      const { error } = await supabase
        .from("SkillAssignment")
        .delete()
        .eq("skill_assignment_id", skill_assignment_id)
        .select() // optional: returns deleted row
        .throwOnError();

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: `Job Skill Assignment Deleted!`,
          success: true,
        };
      }
    }
  });
})();

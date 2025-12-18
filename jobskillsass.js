(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isLoggedIn") == "FALSE") {
      window.location.href = "./index.html";
    }

    function byId(id) {
      return document.getElementById(id);
    }

    function toggleProfileMenu() {
      const profileMenu = document.getElementById("profile-menu");
      profileMenu.classList.toggle("show");
    }
    window.toggleProfileMenu = toggleProfileMenu;

    const submenuMasterData = byId("submenuMasterData");
    const submenuDataAssignment = byId("submenuDataAssignment");

    if (submenuMasterData) submenuMasterData.classList.remove("show");
    if (submenuDataAssignment) submenuDataAssignment.classList.add("show");

    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const mySub = btn.nextElementSibling;
        document.querySelectorAll(".submenu").forEach((list) => {
          list.classList.remove("show");
        });
        if (mySub) mySub.classList.add("show");
      });
    });

    const linkJobSkillsAss = byId("linkJobSkillsAss");
    if (linkJobSkillsAss) {
      linkJobSkillsAss.addEventListener("click", () => {
        if (submenuMasterData) submenuMasterData.classList.remove("show");
        if (submenuDataAssignment) submenuDataAssignment.classList.add("show");
      });
    }

    const STORE_KEYS = {
      jobs: "skillocal_js_jobs",
      skills: "skillocal_js_skills",
      assigns: "skillocal_js_assigns",
      idCounters: "skillocal_js_idcounters",
    };

    const defaultData = {
      jobs: [],
      skills: [],
      assigns: [],
      idCounters: { job: 0, skill: 0, assign: 0 },
    };

    function loadStore() {
      const jobsRaw = JSON.parse(localStorage.getItem(STORE_KEYS.jobs));
      const skillsRaw = JSON.parse(localStorage.getItem(STORE_KEYS.skills));
      const assignsRaw = JSON.parse(localStorage.getItem(STORE_KEYS.assigns));
      const ctrRaw = JSON.parse(localStorage.getItem(STORE_KEYS.idCounters));

      let jobs = jobsRaw || defaultData.jobs;
      let skills = skillsRaw || defaultData.skills;
      let assigns = assignsRaw || defaultData.assigns;
      let idCounters = ctrRaw || defaultData.idCounters;

      jobs = jobs.filter((j) => j && j.id != null);
      skills = skills.filter((s) => s && s.id != null);
      assigns = assigns.filter((a) => a && a.id != null);

      return { jobs, skills, assigns, idCounters };
    }

    function saveStore({ jobs, skills, assigns, idCounters }) {
      localStorage.setItem(STORE_KEYS.jobs, JSON.stringify(jobs));
      localStorage.setItem(STORE_KEYS.skills, JSON.stringify(skills));
      localStorage.setItem(STORE_KEYS.assigns, JSON.stringify(assigns));
      localStorage.setItem(STORE_KEYS.idCounters, JSON.stringify(idCounters));
    }

    let state = loadStore();

    const modalJob = window.bootstrap
      ? new bootstrap.Modal(byId("modalJob"))
      : null;
    const modalSkill = window.bootstrap
      ? new bootstrap.Modal(byId("modalSkill"))
      : null;
    // const modalAssign = window.bootstrap
    //   ? new bootstrap.Modal(byId("modalAssign"))
    //   : null;

    function displayId(val) {
      return val === null || val === undefined || Number.isNaN(val) ? "" : val;
    }
    function jobTitle(id) {
      return (state.jobs.find((j) => j.id === id) || {}).title || "—";
    }
    function skillName(id) {
      return (state.skills.find((s) => s.id === id) || {}).name || "—";
    }

    function renumberFirstCol(tbody) {
      if (!tbody) return;
      Array.from(tbody.rows).forEach((tr, i) => {
        if (tr.children[0]) tr.children[0].textContent = i + 1;
      });
    }

    fetchedJobRoles = [];
    fetchedSkills = [];
    fetchedSkillAssignments = [];

    window.load = renderIndustryOptions();
    // window.load = renderJobOptions();

    async function renderIndustryOptions() {
    // selectEl, withEmpty = true
      const result = await getIndustryList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        const jobIndustry = document.getElementById("jobIndustry");

        jobIndustry.innerHTML = "";

        for (i = 0; i < result.data.length; i++) {
          // Get the select element

          // Create a new option element
          const option = document.createElement("option");
          const option2 = document.createElement("option");

          // Set the text and value for the option
          option.text = result.data[i].industry_name;
          option.value = result.data[i].industry_id;
          // Append the option to the select element
          jobIndustry.appendChild(option);
        }
      }
    }

    async function renderJobsTable() {
      const tbody = byId("tblJobs")?.querySelector("tbody");
      const result = await getSkilledJobList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        fetchedJobRoles = result.data; //update fetched job roles local array
        tbody.innerHTML = "";
        for (i = 0; i < result.data.length; i++) {
          tbody.insertAdjacentHTML(
            "beforeend",
            `
        <tr>
          <td style='width:8%'>${i + 1}</td>
          <td style='width:30%'>
            <div class="fw-semibold">${result.data[i].SkilledJob.job_name}</div>
          </td>
          <td style='width:20%' class="d-none d-lg-table-cell">
            ${
              result.data[i].Industry.industry_name
                ? result.data[i].Industry.industry_name
                : '<span class="text-muted">—</span>'
            }
          </td>
          <td class="text-end" style="width:100px;">
            <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${
              result.data[i].job_id
            }"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${
              result.data[i].job_id
            }"><i class="bi bi-trash"></i></button>
          </td>
          <td style='display:none;'>${result.data[i].job_id}</td>
        </tr>  
        `
          );
        }
      }
    }

    async function renderSkillsTable() {
      const tbody = byId("tblSkills")?.querySelector("tbody");
      // if (!tbody) return;
      // tbody.innerHTML = "";
      // state.skills.forEach((skill) => {
      //   const tr = document.createElement("tr");
      //   tr.innerHTML = `
      //     <td>${displayId(skill.id)}</td>
      //     <td>${skill.name}</td>
      //     <td class="text-end">
      //       <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${
      //         skill.id
      //       }">
      //         <i class="bi bi-pencil"></i>
      //       </button>
      //       <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${
      //         skill.id
      //       }">
      //         <i class="bi bi-trash"></i>
      //       </button>
      //     </td>
      //   `;
      //   tbody.appendChild(tr);
      // });
      // renumberFirstCol(tbody);

      const result = await getSkillsList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        fetchedSkills = result.data; //update fetched skills local array
        //added td for industry_id but only hidden
        console.log("skills", result.data);
        tbody.innerHTML = "";
        for (i = 0; i < result.data.length; i++) {
          tbody.insertAdjacentHTML(
            "beforeend",
            `
        <tr>
          <td>${i + 1}</td>
          <td>${result.data[i].name}</td>
          <td style='display:none;'>${result.data[i].related_job}</td>
          <td class="text-end" style="width:100px;">
          <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${
            result.data[i].skills_id
          }">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${
            result.data[i].skills_id
          }">
            <i class="bi bi-trash"></i>
          </button>
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

    async function renderAssignmentsTable() {
      const tbody = byId("tblAssignments")?.querySelector("tbody");
      if (!tbody) return;
      const q = (byId("searchInput")?.value || "").trim().toLowerCase();

      const result = await getSkillAssignmentList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        fetchedSkillAssignments = result.data; //update fetched skill assignment local array
        tbody.innerHTML = "";
        for (i = 0; i < result.data.length; i++) {
          tbody.insertAdjacentHTML(
            "beforeend",
            `
          <td>${i}</td>
          <td>${result.data[i].SkilledJob.job_name}</td>
          <td>${result.data[i]?.Skills.name}</td>
        `
          );
        }
      }
    }

    byId("tblJobs")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");

      if (!btn) return;

      const job_id = Number(btn.dataset.id);
      const action = btn.dataset.action;

      if (action === "edit") {
        const job = fetchedJobRoles.find((j) => j.job_id === job_id);
        if (!job) return;
        byId("jobId").value = job.job_id;
        byId("jobTitle").value = job.SkilledJob.job_name;
        // byId('jobDesc').value = job.description || '';
        byId("jobIndustry").value = job.industry_id;

        byId("modalJob").querySelector(".modal-title").textContent =
          "Edit Job Role";
        modalJob?.show();
      }
      if (action === "del") {
        if (
          !confirm(
            "Delete this job role? Related Industry Jobs Assignment will also be removed."
          )
        )
          return;

        if (job_id !== null) {
          //check first if some Skills are using this Skilled Job/Job Role
          const checkSkillAssignmentResult = await checkIfSkilledJobIsUsed(
            job_id
          );

          if (checkSkillAssignmentResult.data.length > 0) {
            alert(
              "Some Skills are using this Job Role. Please modify the said Skills first."
            );
            return;
          }

          //delete industry job assignment first before deleting skilled job
          const result = await deleteJobIndustryAssignment(job_id);
          if (result.success === false) {
            alert(result.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            //delete skilled job
            const skilledJobResult = await deleteSkilledJob(job_id);
            if (skilledJobResult.success === false) {
              alert(skilledJobResult.message); //browser alert message
            } else {
              alert(skilledJobResult.message); //browser alert message
              renderJobsTable();
              renderAssignmentsTable();
            }
          }
          renderJobsTable();
          renderAssignmentsTable();
        }
      }
    });

    byId("btnAddJob")?.addEventListener("click", () => {
      byId("jobId").value = "";
      byId("jobTitle").value = "";
      byId("modalJob").querySelector(".modal-title").textContent =
        "Add Job Role";
      modalJob?.show();
    });

    byId("formJob")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const job_id = byId("jobId").value;
      const title = byId("jobTitle").value.trim();
      if (!title) return;
      // const desc = byId('jobDesc').value.trim();
      const indVal = byId("jobIndustry").value;
      const industryId = indVal ? Number(indVal) : null;
      const industrySelect = document.getElementById("jobIndustry");
      const industryName =
        industrySelect.options[industrySelect.selectedIndex].text;

      if (job_id) {
        //edit skilled job
        // const industryId = await getSelectedindustryId(industryName);

        const result = await editSkilledJob(job_id, title, industryId);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          const editIndustryJobResult = await editJobIndustryAssignment(
            industryId,
            job_id
          );

          if (editIndustryJobResult.success === false) {
            alert(editIndustryJobResult.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            alert(editIndustryJobResult.message); //browser alert message
            renderJobsTable();
            modalJob?.hide();
          }
        }
      } else {
        //add skilled job
        const industryId = await getSelectedindustryId(industryName);

        //check first if industry is already being used in industry jobs assignment
        const checkIndustryJobResult = await checkIndustryJob(
          industryId.data[0].industry_id
        );
        if (checkIndustryJobResult.data.length > 0) {
          alert(
            "Industry is already assigned to another job. Please choose a different industry."
          );
          return;
        } else {
          //proceed
          const result = await addSkilledJob(title);
          if (result.success === false) {
            alert(result.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            const jobId = await getNewJobId();
            const assignment = await setJobIndustryAssignment(
              industryId.data[0].industry_id,
              jobId.data[0].job_id
            );
            if (assignment.success === false) {
              alert(assignment.message); //browser alert message
            } else {
              renderJobsTable();
              modalJob?.hide();
              alert(assignment.message); //browser alert message
            }
          }
        }
      }
      // saveStore(state);
      renderAssignmentsTable();
    });

    byId("btnAddSkill")?.addEventListener("click", () => {
      renderJobOptions();
      byId("skillId").value = "";
      byId("skillName").value = "";
      byId("skillDesc").value = "";
      byId("modalSkill").querySelector(".modal-title").textContent =
        "Add Skill";
      modalSkill?.show();
    });

    byId("formSkill")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const skillId = byId("skillId").value;
      const name = byId("skillName").value.trim();
      const desc = byId("skillDesc").value.trim();
      const job_id = byId("assignJob").value.trim();
      if (!name) return;

      if (skillId) {
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
                renderSkillsTable();
                renderAssignmentsTable();
                modalSkill?.hide();
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
              renderSkillsTable();
              renderAssignmentsTable();
              modalSkill?.hide();
            }
          }
        }
      } else {
        //add skill to db

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
                renderSkillsTable();
                renderAssignmentsTable();
                modalSkill?.hide();
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
              renderSkillsTable();
              renderAssignmentsTable();
              modalSkill?.hide();
            }
          }
        }
      }
    });

    byId("tblSkills")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      renderJobOptions();
      if (action === "edit") {
        const row = e.target.closest("tr");
        // editModal.dataset.row = row.rowIndex;
        document.getElementById("skillId").value = row.children[4].innerText;
        document.getElementById("skillName").value = row.children[1].innerText;
        document.getElementById("skillDesc").value =
          row.children[2].innerText || "";
        document.getElementById("assignJob").value = row.children[5].innerText;

        byId("modalSkill").querySelector(".modal-title").textContent =
          "Edit Skill";
        modalSkill?.show();
      }
      if (action === "del") {
        const row = e.target.closest("tr");
        if (!confirm("Delete this skill?")) return;
        const skill_assignment_id = row.children[6].innerText;

        //delete skill from job skill assignment first
        const jobSkillAssignmentResult = await deleteJobSkillAssignment(
          skill_assignment_id
        );
        if (jobSkillAssignmentResult.success === false) {
          alert(jobSkillAssignmentResult.message);
          return;
        } else {
          alert(jobSkillAssignmentResult.message);
          const skill_id = row.children[4].innerText;
          const result = await deleteSkill(skill_id);
          if (result.success === false) {
            alert(result.message); //browser alert message
          } else {
            alert(result.message); //browser alert message
            renderSkillsTable();
            renderAssignmentsTable();
            renderJobsTable();
          }
        }
      }
    });

    // function openAssignModal(editId = null) {
    //   renderJobOptions();
    //   renderSkillOptions();

    //   const skillSelect = byId('assignSkill');
    //   const jobRoleSelect = byId('assignJob');

    //   byId("assignId").value = "";
    //   byId("assignProficiency").value = "";
    //   byId("modalAssign").querySelector(".modal-title").textContent = editId
    //     ? "Edit Job ⇄ Skill Assignment"
    //     : "Add Job ⇄ Skill Assignment";

    //   if (editId) {
    //     const rec = fetchedSkillAssignments.find((a) => a.skill_assignment_id === editId);
    //     if (!rec) return;

    //     skillSelect.value = `${rec.skill_id}/${rec.skill_name}`.trim();
    //     jobRoleSelect.value = `${rec.job_role_id}/${rec.job_title}/${rec.job_industry_id}/${rec.job_industry_name}`;

    //     byId("assignJob").value = jobRoleSelect.value;
    //     byId("assignSkill").value = skillSelect.value;
    //     byId("assignProficiency").value = rec.proficiency;
    //     byId("assignId").value = rec.skill_assignment_id;

    //   }
    //   modalAssign?.show();
    // }

    // byId("btnAddAssign")?.addEventListener("click", () => openAssignModal());

    // byId("formAssign")?.addEventListener("submit", async (e) => {
    //   e.preventDefault();
    //   const idVal = byId("assignId").value;
    //   // const jobId = Number(byId("assignJob").value);
    //   // const skillId = Number(byId("assignSkill").value);
    //   const proficiency = byId("assignProficiency").value.trim();
    //   if (!proficiency) return;

    //   const [jobRoleId, jobTitle, jobIndustryId, jobIndustryName] = byId('assignJob').value.split("/");
    //   const [skillId, skillName] = byId('assignSkill').value.split("/");

    //   if (idVal) {
    //     // const idx = fetchedSkillAssignments.findIndex((a) => a.skill_assignment_id === Number(idVal));
    //     // if (idx >= 0) {
    //     //   state.assigns[idx].jobId = jobId;
    //     //   state.assigns[idx].skillId = skillId;
    //     //   state.assigns[idx].proficiency = proficiency;
    //     // }

    //     //check for duplicate skill assignment
    //     const dup = fetchedSkillAssignments.some(a => a.job_role_id == jobRoleId && a.skill_id == skillId && a.skill_assignment_id != idVal);
    //     if (dup) {
    //       alert('This Job ⇄ Skill link already exists.');
    //       return;
    //     }

    //     const result = await editSkillAssignment(idVal, jobRoleId, jobTitle, skillId, skillName, jobIndustryId, jobIndustryName, proficiency);
    //     if (result.success === false) {
    //       alert(result.message); //browser alert message
    //     } else {
    //       alert(result.message); //browser alert message
    //       renderAssignmentsTable();
    //       modalAssign?.hide();
    //     }
    //   } else {
    //     // state.idCounters.assign += 1;
    //     // const newId = state.idCounters.assign;
    //     // state.assigns.push({
    //     //   id: newId,
    //     //   jobId,
    //     //   skillId,
    //     //   proficiency,
    //     // });

    //     //check for duplicate skill assignment
    //     const dup = fetchedSkillAssignments.some(a => a.job_role_id == jobRoleId && a.skill_id == skillId);
    //     if (dup) {
    //       alert('This Job ⇄ Skill link already exists.');
    //       return;
    //     }

    //     const result = await addSkillAssignment(jobRoleId, jobTitle, skillId, skillName, jobIndustryId, jobIndustryName, proficiency);
    //     if (result.success === false) {
    //       alert(result.message); //browser alert message
    //     } else {
    //       alert(result.message); //browser alert message
    //       renderAssignmentsTable();
    //       modalAssign?.hide();
    //     }
    //   }
    //   // saveStore(state);

    // });

    byId("tblAssignments")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;

      if (action === "edit") openAssignModal(id);
      if (action === "del") {
        if (!confirm("Delete this assignment?")) return;

        const row = e.target.closest("tr");
        byId("assignId").value = row.children[5].innerText;
        const result = await deleteSkillAssignment(row.children[5].innerText);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          renderAssignmentsTable();
        }
      }
    });

    (function init() {
      renderJobsTable();
      renderSkillsTable();
      renderAssignmentsTable();
    })();

    const searchInput = byId("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();

        const jobsTbody = byId("tblJobs")?.querySelector("tbody");
        if (jobsTbody) {
          Array.from(jobsTbody.rows).forEach((row) => {
            row.style.display = row.innerText.toLowerCase().includes(q)
              ? ""
              : "none";
          });
        }

        const skillsTbody = byId("tblSkills")?.querySelector("tbody");
        if (skillsTbody) {
          Array.from(skillsTbody.rows).forEach((row) => {
            row.style.display = row.innerText.toLowerCase().includes(q)
              ? ""
              : "none";
          });
        }

        renderAssignmentsTable();
      });
    }

    ["tblJobs", "tblSkills", "tblAssignments"].forEach((id) => {
      const tbody = byId(id)?.querySelector("tbody");
      if (!tbody) return;
      const mo = new MutationObserver((muts) => {
        if (muts.some((m) => m.type === "childList")) renumberFirstCol(tbody);
      });
      mo.observe(tbody, { childList: true });
    });
  });

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

  //CHECK IF INDUSTRY JOB ASSIGNMENT EXISTS FUNCTION
  async function checkIndustryJob(industry_id) {
    const { data, error } = await supabase
      .from("IndustryJobs")
      .select("industry_id")
      .eq("industry_id", industry_id)
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

  //set Job Industry Assignment
  async function setJobIndustryAssignment(industryid, jobid) {
    /*const { data, error } = await supabase
    .from("IndustryJobs")
    .insert({industry_id: industryid,job_id: jobid})*/
    const { data, error } = await supabase.from("IndustryJobs").insert([
      {
        industry_id: industryid,
        job_id: jobid,
      },
    ]);

    if (error) {
      return {
        message: error.message,
        success: false,
      };
    } else {
      return {
        message: "Industry Job Assignment Added!",
        success: true,
      };
    }
  }

  async function editJobIndustryAssignment(industry_id, job_id) {
    let job_id_int = parseInt(job_id);

    const { error } = await supabase
      .from("IndustryJobs")
      .update({
        industry_id: industry_id,
      })
      .eq("job_id", job_id_int) // your condition
      .select();

    if (error) {
      return {
        message: error.message,
        success: false,
      };
    } else {
      return {
        message: `Industry Job Assignment Updated!`,
        success: true,
      };
    }
  }

  async function deleteJobIndustryAssignment(job_id) {
    let job_id_int = parseInt(job_id);
    const { error } = await supabase
      .from("IndustryJobs")
      .delete()
      .eq("job_id", job_id_int)
      .select();

    if (error) {
      return {
        message: error.message,
        success: false,
      };
    } else {
      return {
        message: `Industry Job Deleted!`,
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
  async function editSkilledJob(job_id, name, industry_id) {
    const { error } = await supabase
      .from("SkilledJob")
      .update({
        job_name: name,
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
      .select(); // optional: returns deleted row
    // .throwOnError();

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

  //check if skilled job is used by a skill
  async function checkIfSkilledJobIsUsed(job_id) {
    const { data, error } = await supabase
      .from("SkillAssignment")
      .select("*")
      .eq("job_id", job_id);
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
  async function getSkillsList() {
    const { data, error } = await supabase
      .from("Skills")
      .select("*")
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

  async function renderJobOptions() {
    const assignJob = document.getElementById("assignJob");
    assignJob.innerHTML = "";
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
    }
  }

  // async function renderSkillOptions() {
  //   const assignSkill = document.getElementById("assignSkill");
  //   assignSkill.innerHTML = "";
  //   for (i = 0; i < fetchedSkills.length; i++) {
  //     // Get the select element

  //     // Create a new option element
  //     const option = document.createElement("option");
  //     console.log(`${fetchedSkills[i].skills_id}/${fetchedSkills[i].name}`);
  //     // Set the text and value for the option
  //     option.text = `${fetchedSkills[i].name}`;
  //     //value is divided by / to easily extract job role id, job title, industry id, industry name during add and delete of job assignment
  //     option.value = `${fetchedSkills[i].skills_id}/${fetchedSkills[i].name}`;
  //     // Append the option to the select element
  //     assignSkill.appendChild(option);
  //   }
  // }

  // //GET LIST OF SKILL ASSIGNMENT FUNCTION
  async function getSkillAssignmentList() {
    const { data, error } = await supabase
      .from("SkillAssignment")
      .select("skills_id,job_id,Skills(*),SkilledJob(*)")
      .order("skill_assignment_id", { ascending: true });

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

  // ADD SKILL ASSIGNMENT FUNCTION
  // async function addSkillAssignment(job_role_id, job_title, skill_id, skill_name, job_industry_id, job_industry_name, proficiency) {
  //   const { data, error } = await supabase.from("SkillAssignment").insert([
  //     {
  //       job_role_id: job_role_id,
  //       job_title: job_title,
  //       skill_id: skill_id,
  //       skill_name: skill_name,
  //       job_industry_id: job_industry_id,
  //       job_industry_name: job_industry_name,
  //       proficiency: proficiency,
  //     },
  //   ]);

  //   if (error) {
  //     return {
  //       message: error.message,
  //       success: false,
  //     };
  //   } else {
  //     return {
  //       message: "Skill Assignment Added!",
  //       success: true,
  //     };
  //   }
  // }

  // //EDIT SKILL ASSIGNMENT FUNCTION
  // async function editSkillAssignment(skill_assignment_id, job_role_id, job_title, skill_id, skill_name, job_industry_id, job_industry_name, proficiency) {
  //   const { error } = await supabase
  //     .from("SkillAssignment")
  //     .update({
  //       job_role_id: job_role_id,
  //       job_title: job_title,
  //       skill_id: skill_id,
  //       skill_name: skill_name,
  //       job_industry_id: job_industry_id,
  //       job_industry_name: job_industry_name,
  //       proficiency: proficiency,
  //     })
  //     .eq("skill_assignment_id", skill_assignment_id) // your condition
  //     .select();

  //   if (error) {
  //     return {
  //       message: error.message,
  //       success: false,
  //     };
  //   } else {
  //     return {
  //       message: `Skill Assignment Updated!`,
  //       success: true,
  //     };
  //   }
  // }

  // // DELETE SKILL ASSIGNMENT FUNCTION
  // async function deleteSkillAssignment(skill_assignment_id) {
  //   const { data, error } = await supabase
  //     .from("SkillAssignment")
  //     .delete()
  //     .eq("skill_assignment_id", skill_assignment_id)
  //     .select() // optional: returns deleted row
  //     .throwOnError();

  //   if (error || data.length === 0) {
  //     return {
  //       message: error?.message || "Foreign key prevents deletion.",
  //       success: false,
  //     };
  //   } else {
  //     return {
  //       message: `Skill Assignment Deleted!`,
  //       success: true,
  //     };
  //   }
  // }
})();

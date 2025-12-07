if (localStorage.getItem('isLoggedIn') == 'FALSE') {
  window.location.href = "./index.html";
}

document.addEventListener('DOMContentLoaded', () => {
  const byId = (id) => document.getElementById(id);

  function toggleProfileMenu() {
    const profileMenu = document.getElementById('profile-menu');
    profileMenu.classList.toggle('show');
  }
  window.toggleProfileMenu = toggleProfileMenu;

  function enforceDataAssignmentOpen() {
    const master = byId('submenuMasterData');
    const data = byId('submenuDataAssignment');
    if (master) master.classList.remove('show');
    if (data) data.classList.add('show');
  }
  enforceDataAssignmentOpen();

  document.querySelectorAll('.toggle-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const mySubmenu = btn.nextElementSibling;

      document.querySelectorAll('.submenu').forEach(list => list.classList.remove('show'));
      if (mySubmenu) mySubmenu.classList.add('show');
    });
  });

  const linkIndustryAss = document.getElementById('linkIndustryAss');
  if (linkIndustryAss) {
    linkIndustryAss.addEventListener('click', () => {
      enforceDataAssignmentOpen();
    });
  }

  const STORE_KEYS = {
    industries: 'skillocal_industries',
    jobs: 'skillocal_jobs',
    assigns: 'skillocal_assigns',
    idCounters: 'skillocal_idcounters'
  };

  const defaultData = {
    industries: [],
    jobs: [],
    assigns: [],
    idCounters: { industry: 0, job: 0, assign: 0 }
  };

  //all fetched data arrays
  fetchedIndustries = [];
  fetchedJobRoles = [];
  fetchedIndustryJobAssignments = [];

  window.load = renderIndustryOptions();
  window.load = renderJobOptions();

  function loadStore() {
    const industries = JSON.parse(localStorage.getItem(STORE_KEYS.industries)) || defaultData.industries;
    const jobs = JSON.parse(localStorage.getItem(STORE_KEYS.jobs)) || defaultData.jobs;
    const assigns = JSON.parse(localStorage.getItem(STORE_KEYS.assigns)) || defaultData.assigns;
    const idCounters = JSON.parse(localStorage.getItem(STORE_KEYS.idCounters)) || defaultData.idCounters;
    return { industries, jobs, assigns, idCounters };
  }

  function saveStore({ industries, jobs, assigns, idCounters }) {
    localStorage.setItem(STORE_KEYS.industries, JSON.stringify(industries));
    localStorage.setItem(STORE_KEYS.jobs, JSON.stringify(jobs));
    localStorage.setItem(STORE_KEYS.assigns, JSON.stringify(assigns));
    localStorage.setItem(STORE_KEYS.idCounters, JSON.stringify(idCounters));
  }

  let state = loadStore();
  let assignIndustryChangeHandler = null;

  const modalIndustry = window.bootstrap ? new bootstrap.Modal(byId('modalIndustry')) : null;
  const modalJob = window.bootstrap ? new bootstrap.Modal(byId('modalJob')) : null;
  const modalAssign = window.bootstrap ? new bootstrap.Modal(byId('modalAssign')) : null;

  function industryName(id) {
    return (state.industries.find(i => i.id === id) || {}).name || '—';
  }
  function jobTitle(id) {
    return (state.jobs.find(j => j.id === id) || {}).title || '—';
  }

  function renumberFirstCol(tbody) {
    if (!tbody) return;
    Array.from(tbody.rows).forEach((tr, i) => {
      if (tr.children[0]) tr.children[0].textContent = i + 1;
    });
  }

  async function renderIndustryOptions(
    // selectEl, withEmpty = true
  ) {

    const result = await getIndustryList();
    if (result.success === false) {
      alert(result.message); //browser alert message
    } else {

      const jobIndustry = document.getElementById("jobIndustry");
      const assignIndustry = document.getElementById("assignIndustry");

      jobIndustry.innerHTML = '';
      assignIndustry.innerHTML = '';

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

        // Set the text and value for the option
        option2.text = result.data[i].industry_name;
        option2.value = `${result.data[i].industry_id}/${result.data[i].industry_name}`;
        // Append the option to the select element
        assignIndustry.appendChild(option2);

      }

    }

  }

  async function renderJobOptions(
    // selectEl, filterIndustryId = null

  ) {
    // if (!selectEl) return;
    // selectEl.innerHTML = '';

    // if (!state.jobs.length) {
    //   const opt = document.createElement('option');
    //   opt.value = '';
    //   opt.textContent = 'No jobs available';
    //   selectEl.appendChild(opt);
    //   return;
    // }

    // const preferred = [];
    // const others = [];

    // state.jobs.forEach(job => {
    //   if (filterIndustryId && job.industryId === Number(filterIndustryId)) preferred.push(job);
    //   else others.push(job);
    // });

    // const ordered = [...preferred, ...others];

    // ordered.forEach(job => {
    //   const opt = document.createElement('option');
    //   opt.value = job.id;
    //   const indName = job.industryId ? industryName(job.industryId) : 'No industry';
    //   opt.textContent = `${job.title} (${indName})`;
    //   selectEl.appendChild(opt);
    // });


    const assignJob = document.getElementById("assignJob");
    assignJob.innerHTML = '';
    for (i = 0; i < fetchedJobRoles.length; i++) {
      // Get the select element

      // Create a new option element
      const option = document.createElement("option");

      // Set the text and value for the option
      option.text = `${fetchedJobRoles[i].job_title + " (" + (fetchedJobRoles[i].industry ? fetchedJobRoles[i].industry : "No industry") + ")"}`;
      //value is divided by / to easily extract job role id, job title, industry id, industry name during add and delete of job assignment
      option.value = `${fetchedJobRoles[i].job_role_id}/${fetchedJobRoles[i].job_title}/${fetchedJobRoles[i].industry_id}/${fetchedJobRoles[i].industry}`;
      // Append the option to the select element
      assignJob.appendChild(option);

    }

  }

  async function renderIndustriesTable() {
    const tbody = byId('tblIndustries')?.querySelector('tbody');
    // if (!tbody) return;
    // tbody.innerHTML = '';
    // state.industries.forEach(ind => {
    //   const tr = document.createElement('tr');
    //   tr.innerHTML = `
    //     <td>${ind.id}</td>
    //     <td>
    //       <div class="fw-semibold">${ind.name}</div>
    //       <div class="text-muted small">${ind.desc || ''}</div>
    //     </td>
    //     <td class="text-end">
    //       <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${ind.id}"><i class="bi bi-pencil"></i></button>
    //       <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${ind.id}"><i class="bi bi-trash"></i></button>
    //     </td>
    //   `;
    //   tbody.appendChild(tr);
    // });
    // renumberFirstCol(tbody);
    const result = await getIndustryList();
    if (result.success === false) {
      alert(result.message); //browser alert message
    } else {
      //added td for industry_id but only hidden
      tbody.innerHTML = "";
      fetchedIndustries = result.data; //update fetched industries
      for (i = 0; i < result.data.length; i++) {
        tbody.insertAdjacentHTML(
          "beforeend",
          `
        <tr>
          <td>${i + 1}</td>
          <td>${result.data[i].industry_name}</td>
          <td class="text-end" style="width:100px;">
            <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${result.data[i].industry_id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${result.data[i].industry_id}"><i class="bi bi-trash"></i></button>
          </td>
          <td style='display:none;'>${result.data[i].description}</td>
          <td style='display:none;'>${result.data[i].industry_id}</td>
        </tr>  
        `
        );
      }
    }
  }

  async function renderJobsTable() {
    const tbody = byId('tblJobs')?.querySelector('tbody');
    // if (!tbody) return;
    // tbody.innerHTML = '';
    // state.jobs.forEach(job => {
    //   const tr = document.createElement('tr');
    //   tr.innerHTML = `
    //     <td>${job.id}</td>
    //     <td>
    //       <div class="fw-semibold">${job.title}</div>
    //       <div class="text-muted small">${job.desc || ''}</div>
    //     </td>
    //     <td class="d-none d-lg-table-cell">
    //       ${job.industryId ? industryName(job.industryId) : '<span class="text-muted">—</span>'}
    //     </td>
    //     <td class="text-end">
    //       <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${job.id}"><i class="bi bi-pencil"></i></button>
    //       <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${job.id}"><i class="bi bi-trash"></i></button>
    //     </td>
    //   `;
    //   tbody.appendChild(tr);
    // });
    // renumberFirstCol(tbody);
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
            ${result.data[i].Industry.industry_name ? result.data[i].Industry.industry_name : '<span class="text-muted">—</span>'}
          </td>
          <td class="text-end" style="width:100px;">
            <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${result.data[i].job_id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${result.data[i].job_id}"><i class="bi bi-trash"></i></button>
          </td>
          <td style='display:none;'>${result.data[i].job_id}</td>
        </tr>  
        `
        );


      }
    }
  }

  async function renderAssignmentsTable() {
    const tbody = byId('tblAssignments')?.querySelector('tbody');
    const q = byId('searchInput')?.value.trim().toLowerCase() || '';
    if (!tbody) return;
    tbody.innerHTML = '';
    // state.assigns
    //   .filter(a => {
    //     if (!q) return true;
    //     const iName = industryName(a.industryId).toLowerCase();
    //     const jTitle = jobTitle(a.jobId).toLowerCase();
    //     return iName.includes(q) || jTitle.includes(q);
    //   })
    //   .forEach(a => {
    //     const tr = document.createElement('tr');
    //     tr.innerHTML = `
    //       <td>${a.id}</td>
    //       <td>${industryName(a.industryId)}</td>
    //       <td>${jobTitle(a.jobId)}</td>
    //       <td>
    //         <span class="badge ${a.active ? 'bg-success' : 'bg-secondary'}">${a.active ? 'Active' : 'Inactive'}</span>
    //       </td>
    //       <td class="text-end">
    //         <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${a.id}"><i class="bi bi-pencil"></i></button>
    //         <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${a.id}"><i class="bi bi-trash"></i></button>
    //       </td>
    //     `;
    //     tbody.appendChild(tr);
    //   });
    // renumberFirstCol(tbody);
    const result = await getIndustryJobAssignmentList();
    if (result.success === false) {
      alert(result.message); //browser alert message
    } else {
      // fetchedIndustryJobAssignments = result.data; //update fetched job assignments local array

      tbody.innerHTML = "";
      for (i = 0; i < result.data.length; i++) {
        tbody.insertAdjacentHTML(
          "beforeend",
          `
        <td>${i + 1}</td>
        <td>${result.data[i].Industry.industry_name}</td>
        <td>${result.data[i].SkilledJob.job_name}</td>
        `
          // <td class="text-end" style="width:100px;">
          //   <button class="btn btn-sm btn-light me-1" data-action="edit" data-id="${result.data[i].job_assignment_id}"><i class="bi bi-pencil"></i></button>
          //   <button class="btn btn-sm btn-light text-danger" data-action="del" data-id="${result.data[i].job_assignment_id}"><i class="bi bi-trash"></i></button>
          // </td>
        );
      }
    }
  }

  byId('btnAddIndustry')?.addEventListener('click', () => {
    byId('industryId').value = '';
    byId('industryName').value = '';
    byId('industryDesc').value = '';
    byId('modalIndustry').querySelector('.modal-title').textContent = 'Add Industry';
    modalIndustry?.show();
  });

  byId('formIndustry')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = byId('industryId').value;
    const name = byId('industryName').value.trim();
    if (!name) return;
    const desc = byId('industryDesc').value.trim();

    //save edits to supabase
    if (id) {
      // const idx = state.industries.findIndex(i => i.id === Number(id));
      // if (idx >= 0) {
      //   state.industries[idx].name = name;
      //   state.industries[idx].desc = desc;
      // }
      const result = await editIndustry(id, name, desc);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderIndustriesTable();
        modalIndustry?.hide();
      }
    } else {
      //add new industry to supabase
      // state.idCounters.industry += 1;
      // state.industries.push({ id: state.idCounters.industry, name, desc });
      const result = await addIndustry(name, desc);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderIndustriesTable();
        modalIndustry?.hide();
      }
    }
    // saveStore(state);
    // renderIndustryOptions(byId('jobIndustry'));
    // renderIndustryOptions(byId('assignIndustry'), false);
    // renderIndustriesTable();
    renderAssignmentsTable();
    renderIndustryOptions();
    renderJobsTable();

  });

  byId('tblIndustries')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'edit') {
      // const ind = state.industries.find(i => i.id === id);
      const ind = fetchedIndustries.find(i => i.industry_id === id);

      if (!ind) return;
      byId('industryId').value = ind.industry_id;
      byId('industryName').value = ind.industry_name;
      byId('industryDesc').value = ind.description || '';
      byId('modalIndustry').querySelector('.modal-title').textContent = 'Edit Industry';
      modalIndustry?.show();
    }
    if (action === 'del') {
      if (!confirm('Delete this Industry? Related jobs/assignments may still depend on this Industry.')) return;
      // state.industries = state.industries.filter(i => i.id !== id);
      // saveStore(state);
      // renderIndustryOptions(byId('jobIndustry'));
      // renderIndustryOptions(byId('assignIndustry'), false);
      // renderIndustriesTable();
      // renderJobsTable();
      // renderAssignmentsTable();
      // renderIndustryOptions();

      const result = await deleteIndustry(id);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderIndustriesTable();
        renderJobsTable();
        renderAssignmentsTable();
        renderIndustryOptions();
      }
    }
  });

  byId('btnAddJob')?.addEventListener('click', () => {
    byId('jobId').value = '';
    byId('jobTitle').value = '';
    // byId('jobDesc').value = '';
    byId('modalJob').querySelector('.modal-title').textContent = 'Add Job Role';
    modalJob?.show();
  });

  byId('formJob')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const job_id = byId('jobId').value;
    const title = byId('jobTitle').value.trim();
    if (!title) return;
    // const desc = byId('jobDesc').value.trim();
    const indVal = byId('jobIndustry').value;
    const industryId = indVal ? Number(indVal) : null;
    const industrySelect = document.getElementById("jobIndustry");
    const industryName = industrySelect.options[industrySelect.selectedIndex].text;

    if (job_id) {
      //edit skilled job
      // const industryId = await getSelectedindustryId(industryName);

      const result = await editSkilledJob(job_id, title, industryId);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        const editIndustryJobResult = await editJobIndustryAssignment(industryId, job_id);

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
      const checkIndustryJobResult = await checkIndustryJob(industryId.data[0].industry_id);
      if (checkIndustryJobResult.data.length > 0) {
        alert("Industry is already assigned to another Job Role. Please choose a different Industry.");
        return
      } else {
        //proceed
        const result = await addSkilledJob(title);
        if (result.success === false) {
          alert(result.message); //browser alert message

        } else {
          alert(result.message); //browser alert message
          const jobId = await getNewJobId();
          const assignment = await setJobIndustryAssignment(industryId.data[0].industry_id, jobId.data[0].job_id);
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

  byId('tblJobs')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    console.log(fetchedJobRoles);
    if (!btn) return;

    const job_id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'edit') {

      const job = fetchedJobRoles.find(j => j.job_id === job_id);
      if (!job) return;
      byId('jobId').value = job.job_id;
      byId('jobTitle').value = job.SkilledJob.job_name;
      // byId('jobDesc').value = job.description || '';
      byId('jobIndustry').value = job.industry_id;

      byId('modalJob').querySelector('.modal-title').textContent = 'Edit Job Role';
      modalJob?.show();


    }
    if (action === 'del') {
      if (!confirm('Delete this job role? Related Industry Jobs Assignment will also be removed.')) return;

      if (job_id !== null) {
        //check first if some Skills are using this Skilled Job/Job Role
        const checkSkillAssignmentResult = await checkIfSkilledJobIsUsed(job_id);

        if (checkSkillAssignmentResult.data.length > 0) {
          alert("Some Skills are using this Job Role. Please modify the said Skills first.");
          return
        }

        //delete industry job assignment first before deleting skilled job
        const result = await deleteJobIndustryAssignment(job_id);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          console.log(result);
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
      }
    }
  });



  function openAssignModal(editId = null) {
    // renderIndustryOptions(byId('assignIndustry'), false);

    renderJobOptions();
    const industrySelect = byId('assignIndustry');
    const jobSelect = byId('assignJob');
    // if (assignIndustryChangeHandler && industrySelect) {
    //   industrySelect.removeEventListener('change', assignIndustryChangeHandler);
    // }

    // assignIndustryChangeHandler = () => {
    //   const filter = industrySelect.value ? Number(industrySelect.value) : null;
    //   renderJobOptions(jobSelect, filter);
    // };

    // industrySelect?.addEventListener('change', assignIndustryChangeHandler);


    byId('assignActive').checked = true;

    if (editId) {
      const rec = fetchedIndustryJobAssignments.find(a => a.job_assignment_id == editId);
      if (!rec) return;

      industrySelect.value = `${rec.industry_id}/${rec.industry_name}`.trim();
      jobSelect.value = `${rec.job_role_id}/${rec.job_title}/${rec.job_industry_id}/${rec.job_industry_name}`;
      byId('assignId').value = editId;
      byId('assignActive').checked = rec.isActive;
      byId('modalAssign').querySelector('.modal-title').textContent = 'Edit Assignment';

      // for (let option of industrySelect.options) {
      //   if (option.value === `${rec.industry_id}/${rec.industry_name}`) {
      //     option.selected = true;
      //     break; // stop loop after selecting
      //   }
      // }
    } else {
      byId('assignId').value = '';
      renderIndustryOptions();
      byId('modalAssign').querySelector('.modal-title').textContent = 'Add Industry ⇄ Job Assignment';
    }
    modalAssign?.show();
  }

  const select = document.getElementById("assignIndustry");

  select.addEventListener("change", () => {
    console.log("Value:", select.value);
  });

  byId('openAssignModalBtn')?.addEventListener('click', () => openAssignModal());

  byId('formAssign')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idVal = byId('assignId').value;
    // const industryId = Number(byId('assignIndustry').value);
    // const jobId = Number(byId('assignJob').value);
    const active = byId('assignActive').checked; //isActive check box
    //extract job role id and industry id from the value split by / in the <select>
    const [jobRoleId, jobTitle, jobIndustryId, jobIndustryName] = byId('assignJob').value.split("/");
    const [industryId, industryName] = byId('assignIndustry').value.split("/");



    if (idVal) {
      //edit existing assignment in supabase
      // const idx = state.assigns.findIndex(a => a.id === Number(idVal));
      // state.assigns[idx].industryId = industryId;
      // state.assigns[idx].jobId = jobId;
      // state.assigns[idx].active = active;

      //check for duplicate industry-job assignment
      const dup = fetchedIndustryJobAssignments.some(a => a.industry_id == industryId && a.job_role_id == jobRoleId && a.job_assignment_id != idVal);
      if (dup) {
        alert('This Industry ⇄ Job link already exists.');
        return;
      }

      const result = await editIndustryJobAssignment(idVal, industryId, industryName, jobRoleId, jobTitle, jobIndustryId, jobIndustryName, active);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderAssignmentsTable();
        modalAssign?.hide();
      }
    } else {

      //check for duplicate industry-job assignment
      const dup = fetchedIndustryJobAssignments.some(a => a.industry_id == industryId && a.job_role_id == jobRoleId);
      if (dup) {
        alert('This Industry ⇄ Job link already exists.');
        return;
      }

      //add job assignment to supabase
      const result = await addIndustryJobAssignment(industryId, industryName, jobRoleId, jobTitle, jobIndustryId, jobIndustryName, active);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderAssignmentsTable();
        modalAssign?.hide();
      }
      // state.idCounters.assign += 1;
      // state.assigns.push({
      //   id: state.idCounters.assign,
      //   industryId,
      //   jobId,
      //   active,
      //   date: new Date().toISOString()
      // });
    }

    // saveStore(state);
    renderAssignmentsTable();
    renderJobsTable();
    renderIndustriesTable();
    modalAssign?.hide();
  });

  byId('tblAssignments')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const job_assignment_id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'edit') openAssignModal(job_assignment_id);
    if (action === 'del') {
      if (!confirm('Delete this assignment?')) return;
      // state.assigns = state.assigns.filter(a => a.id !== id);
      // saveStore(state);
      const result = await deleteIndustryJobAssignment(job_assignment_id);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renderAssignmentsTable();

      }

    }
  });

  byId('searchInput')?.addEventListener('input', renderAssignmentsTable);

  (function init() {
    renderIndustriesTable();
    renderJobsTable();
    // renderIndustryOptions(byId('jobIndustry'), true);
    // renderIndustryOptions(byId('assignIndustry'), false);
    // renderIndustryOptions();
    renderAssignmentsTable();
  })();

  ['tblIndustries', 'tblJobs', 'tblAssignments'].forEach(id => {
    const tbody = byId(id)?.querySelector('tbody');
    if (!tbody) return;
    const mo = new MutationObserver(muts => {
      if (muts.some(m => m.type === 'childList')) renumberFirstCol(tbody);
    });
    mo.observe(tbody, { childList: true });
  });
});




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

//ADD INDUSTRY FUNCTION
async function addIndustry(industryName, industryDescription) {
  const { data, error } = await supabase.from("Industry").insert([
    {
      industry_name: industryName,
      description: industryDescription,
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
      message: "Industry Added!",
      success: true,
    };
  }
}

//EDIT INDUSTRY FUNCTION
async function editIndustry(industryId, industryName, industryDescription) {
  const { error } = await supabase
    .from("Industry")
    .update({
      industry_name: industryName,
      description: industryDescription,
      modifiedAt: new Date().toLocaleString(),
    })
    .eq("industry_id", industryId) // your condition
    .select();

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  } else {
    return {
      message: `Industry Updated!`,
      success: true,
    };
  }
}

//DELETE INDUSTRY FUNCTION
async function deleteIndustry(industryId) {
  const { data, error } = await supabase
    .from("Industry")
    .delete()
    .eq("industry_id", industryId)
    .select()
  // .throwOnError();
  if (error || data.length === 0) {
    return {
      message: error?.message || "Foreign key prevents deletion.",
      success: false,
    };
  } else {
    return {
      message: `Industry Deleted!`,
      success: true,
    };
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


//check if skilled job is used by a skill
async function checkIfSkilledJobIsUsed(job_id) {
  const { data, error } = await supabase
    .from("SkillAssignment")
    .select('*')
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

//set Job Industry Assignment
async function setJobIndustryAssignment(industryid, jobid) {
  /*const { data, error } = await supabase
    .from("IndustryJobs")
    .insert({industry_id: industryid,job_id: jobid})*/
  const { data, error } = await supabase.from("IndustryJobs").insert([
    {
      industry_id: industryid, job_id: jobid,
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
  console.log(industry_id, job_id_int);
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
    .select() // optional: returns deleted row
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





//GET LIST OF JOB ASSIGNMENT FUNCTION
async function getIndustryJobAssignmentList() {
  const { data, error } = await supabase
    .from("IndustryJobs")
    .select("industry_id,job_id,Industry(*),SkilledJob(*)")
    .order("industryjobs_id", { ascending: true });

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

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("keyup", function () {
  const filter = searchInput.value.toLowerCase();

  filterTable("tblIndustries", filter);
  filterTable("tblJobs", filter);
  filterTable("tblAssignments", filter);
});

function filterTable(tableId, filter) {
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    let text = rows[i].textContent.toLowerCase();

    if (text.includes(filter)) {
      rows[i].style.display = "";
    } else {
      rows[i].style.display = "none";
    }
  }
}


if (localStorage.getItem("isLoggedIn") == "FALSE") {
  window.location.href = "./index.html";
}


document.addEventListener("DOMContentLoaded", () => {

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

  /* ===============================
     SHORTCUTS & ELEMENTS
  =============================== */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const tableBody = $("#tableBody");
  const runBtn = $("#runMatching");
  const spinner = $("#spinner");
  const runText = $("#runText");
  const jobSearch = $("#searchInput");

  /* ===============================
     MODAL SETUP (CREATED VIA JS)
  =============================== */
  const modalHTML = `
    <div id="jobModal" class="modal hidden">
      <div class="modal-content">
        <span id="closeModal" class="close">&times;</span>
        <h2 id="modalJobTitle"></h2>
        <p><strong>Establishment:</strong> <span id="modalEstablishment"></span></p>
        <hr />
        <p><strong>Remarks:</strong></p>
        <div id="modalRemarks" class="modal-remarks"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const jobModal = $("#jobModal");
  const closeModal = $("#closeModal");
  const modalJobTitle = $("#modalJobTitle");
  const modalEstablishment = $("#modalEstablishment");
  const modalRemarks = $("#modalRemarks");

  closeModal.onclick = () => jobModal.classList.add("hidden");
  window.onclick = e => e.target === jobModal && jobModal.classList.add("hidden");

  /* ===============================
     EVENTS
  =============================== */
  runBtn.addEventListener("click", runHandler);
  jobSearch.addEventListener("keydown", e => e.key === "Enter" && runHandler());

  tableBody.addEventListener("click", e => {
    if (!e.target.classList.contains("view-btn")) return;

    const keywords = tokenize(jobSearch.value);
    openJobModal({
      jobTitle: e.target.dataset.title,
      establishment: e.target.dataset.establishment,
      remarks: e.target.dataset.remarks,
      keywords
    });
  });

  // -------------------------------
  // SIDEBAR SUBMENU TOGGLE
  // -------------------------------
   document.querySelectorAll(".toggle-menu").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const submenu = btn.nextElementSibling;

    document.querySelectorAll(".submenu").forEach((list) => {
      if (list !== submenu) list.classList.remove("show");
    });

    document.querySelectorAll(".toggle-menu").forEach((b) => {
      if (b !== btn) b.classList.remove("open");
    });

    submenu.classList.toggle("show");
    btn.classList.toggle("open"); // ⭐ IMPORTANT
  });
});

  // -------------------------------
  // RUN JOB MATCHING
  // -------------------------------
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    spinner.style.display = "inline-block";
    runText.textContent = "Running...";
    tableBody.innerHTML = "";

    const searchValue = jobSearch.value.trim();

    if (searchValue === "") {
      await runJobMatching();
    } else {
      await runJobMatching(searchValue.toLowerCase());
    }

    spinner.style.display = "none";
    runText.textContent = "Run Matching";
    runBtn.disabled = false;
    alert("✅ Matching complete!");
  }

  // -------------------------------
  // HELPER FUNCTIONS
  // -------------------------------
  async function fetchTable(tableName) {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      console.error(`Error fetching ${tableName}:`, error.message);
      return [];
    }
    return data ?? [];
  }

  function highlight(text, keywords) {
    if (!text || !keywords.length) return text ?? "";
    let result = text;
    keywords.forEach(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(
        new RegExp(escaped, "gi"),
        m => `<mark>${m}</mark>`
      );
    });
    return result;
  }

  async function fetchTable(table) {
    const { data } = await supabase.from(table).select("*");
    return data ?? [];
  }

  async function getById(table, key, value) {
    const { data } = await supabase.from(table).select("*").eq(key, value);
    return data?.[0] ?? {};
  }

  /* ===============================
     MODAL LOGIC
  =============================== */
  function openJobModal({ jobTitle, establishment, remarks, keywords }) {
    modalJobTitle.innerHTML = highlight(jobTitle, keywords);
    modalEstablishment.innerHTML = highlight(establishment, keywords);
    modalRemarks.innerHTML = highlight(remarks || "N/A", keywords);
    jobModal.classList.remove("hidden");
  }

  function scoreField(text, terms, weight) {
    if (!text) return 0;
    let score = 0;
    const lower = text.toLowerCase();
    for (const t of terms) {
      const term = t.toLowerCase();
      if (lower === term || lower.includes(term)) score += 1 * weight;
    }
    return score;
  }

  async function searchWorkExperience(terms) {
    const { data, error } = await supabase.from("WorkExperience").select("*");
    if (error) return [];
    return data
      .map(row => ({
        user_id: row.user_id,
        points: scoreField(row.position, terms, 2) +
                scoreField(row.address, terms, 2) +
                scoreField(row.company, terms, 2)
      }))
      .filter(item => item.points > 0);
  }

  async function searchEligibility(terms) {
    const { data, error } = await supabase.from("Eligibility").select("*");
    if (error) return [];
    return data
      .map(row => ({ user_id: row.user_id, points: scoreField(row.name, terms, 1) }))
      .filter(item => item.points > 0);
  }

  async function searchTraining(terms) {
    const { data, error } = await supabase.from("Trainings").select("*");
    if (error) return [];
    return data
      .map(row => ({
        user_id: row.user_id,
        points: scoreField(row.name, terms, 1.5) + scoreField(row.skills_acquired, terms, 1.5)
      }))
      .filter(item => item.points > 0);
  }

  // -------------------------------
  // MAIN JOB MATCHING
  // -------------------------------
  async function runJobMatching() {
    const { data: vacancies } = await supabase
      .from("JobVacancy")
      .select("*")
      .eq("status", "Active")
      .order("vacancy_id");

    if (!vacancies?.length) return;

    const [workExps, eligibilities, trainings] = await Promise.all([
      fetchTable("WorkExperience"),
      fetchTable("Eligibility"),
      fetchTable("Trainings"),
    ]);

    const applicantText = {};

    [...workExps, ...eligibilities, ...trainings].forEach(r => {
      applicantText[r.user_id] ??= "";
    });

    workExps.forEach(w => {
      applicantText[w.user_id] += ` ${w.position} ${w.company} ${w.address}`;
    });
    eligibilities.forEach(e => {
      applicantText[e.user_id] += ` ${e.name}`;
    });
    trainings.forEach(t => {
      applicantText[t.user_id] += ` ${t.name} ${t.skills_acquired}`;
    });

    let index = 1;
    for (const vac of vacancies) {
      const { vacancy_id, job_title, remarks, industry_id, establishment_id, status } = vac;
      const industry = await getIndustryById(industry_id);
      const establishment = await getEstablishmentById(establishment_id);

      const searchableText = `
        ${vac.job_title}
        ${vac.remarks}
        ${industry.industry_name}
        ${establishment.establishmentName}
      `.toLowerCase();

      if (keywords.length && !keywords.every(k => searchableText.includes(k))) {
        continue;
      }

      const vacancyWords = tokenize(searchableText);
      const scores = {};

      Object.entries(applicantText).forEach(([uid, text]) => {
        const matched = vacancyWords.filter(w =>
          text.toLowerCase().includes(w)
        ).length;
        if (matched > 0) {
          scores[uid] = (matched / vacancyWords.length) * 100;
        }
      });

      const top3 = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (!top3.length) {
        tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td colspan="7" style="color:red">No Match Found</td>
          </tr>`;
        continue;
      }

      for (const [uid, pct] of top3) {
        const user = await getById("Users", "user_id", uid);
        const fullName = `${user.firstName ?? ""} ${user.middleName ?? ""} ${user.lastName ?? ""} ${user.suffix ?? ""}`.trim();

        tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td>${user.firstName ?? ""}</td>
            <td>${user.middleName ?? ""}</td>
            <td>${user.lastName ?? ""} ${user.suffix ?? ""}</td>
            <td>${highlight(vac.job_title, keywords)}</td>
            <td>${highlight(industry.industry_name, keywords)}</td>
            <td>${highlight(establishment.establishmentName, keywords)}</td>
            <td>
              <button class="view-btn"
                data-title="${vac.job_title ?? ""}"
                data-establishment="${establishment.establishmentName ?? ""}"
                data-remarks="${vac.remarks ?? ""}">
                View Details
              </button>
            </td>
            <td><span class="badge active">${vac.status}</span></td>
            <td align="center">${pct.toFixed(2)}%</td>
          </tr>`;
      }
    }
  }

  // -------------------------------
  // LIVE SEARCH
  // -------------------------------
  jobSearch.addEventListener("input", () => {
    const q = jobSearch.value.toLowerCase();
    $$("tr", tableBody).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q)
        ? ""
        : "none";
    });
  });
});

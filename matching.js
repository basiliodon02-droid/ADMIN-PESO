(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  document.addEventListener("DOMContentLoaded", async function () {
    // ===== LOGIN CHECK =====
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
      return;
    }

    // ===== SHORTCUTS =====
    const byId = (id) => document.getElementById(id);
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    // ===== NAVBAR ELEMENTS =====
    const profileIcon = byId("profileIcon");
    const profileDropdown = byId("profileDropdown");
    const submenuMasterData = byId("submenuMasterData");
    const submenuDataAssignment = byId("submenuDataAssignment");
    const linkJobSkillsAss = byId("linkJobSkillsAss");

    // ===== PROFILE DROPDOWN =====
    if (profileIcon && profileDropdown) {
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
    }

    // ===== SIDEBAR TOGGLE =====
    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        document.querySelectorAll(".submenu").forEach((list) => {
          if (list !== submenu) list.classList.remove("show");
        });
        if (submenu) submenu.classList.toggle("show");
      });
    });

    // ===== LINK JOB SKILLS ASSIGNMENT =====
    if (linkJobSkillsAss) {
      linkJobSkillsAss.addEventListener("click", () => {
        if (submenuMasterData) submenuMasterData.classList.remove("show");
        if (submenuDataAssignment) submenuDataAssignment.classList.add("show");
      });
    }

    // ===== MATCHING ELEMENTS =====
    const tableBody = $("#tableBody");
    const runBtn = $("#runMatching");
    const spinner = $("#spinner");
    const runText = $("#runText");
    const jobSearch = $("#searchInput");

    // ===== MODAL SETUP =====
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

    const jobModal = byId("jobModal");
    const closeModal = byId("closeModal");
    const modalJobTitle = byId("modalJobTitle");
    const modalEstablishment = byId("modalEstablishment");
    const modalRemarks = byId("modalRemarks");

    if (closeModal && jobModal) {
      closeModal.onclick = () => jobModal.classList.add("hidden");
      window.addEventListener("click", (e) => {
        if (e.target === jobModal) jobModal.classList.add("hidden");
      });
    }

    // ===== EVENTS =====
    if (runBtn) runBtn.addEventListener("click", runHandler);
    if (jobSearch)
      jobSearch.addEventListener(
        "keydown",
        (e) => e.key === "Enter" && runHandler()
      );

    if (tableBody) {
      tableBody.addEventListener("click", (e) => {
        if (!e.target.classList.contains("view-btn")) return;

        const keywords = tokenize(jobSearch.value);
        openJobModal({
          jobTitle: e.target.dataset.title,
          establishment: e.target.dataset.establishment,
          remarks: e.target.dataset.remarks,
          keywords,
        });
      });
    }

    // ===== HELPERS =====
    function tokenize(text) {
      return text ? text.toLowerCase().split(/\s+/).filter(Boolean) : [];
    }

    function highlight(text, keywords) {
      if (!text || !keywords.length) return text ?? "";
      let result = text;
      keywords.forEach((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        result = result.replace(
          new RegExp(escaped, "gi"),
          (m) => `<mark>${m}</mark>`
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

    function openJobModal({ jobTitle, establishment, remarks, keywords }) {
      if (!modalJobTitle || !modalEstablishment || !modalRemarks) return;
      modalJobTitle.innerHTML = highlight(jobTitle, keywords);
      modalEstablishment.innerHTML = highlight(establishment, keywords);
      modalRemarks.innerHTML = highlight(remarks || "N/A", keywords);
      jobModal.classList.remove("hidden");
    }

    // ===== MAIN RUN HANDLER =====
    async function runHandler() {
      if (!runBtn) return;

      runBtn.disabled = true;
      if (spinner) spinner.style.display = "inline-block";
      if (runText) runText.textContent = "Running...";
      if (tableBody) tableBody.innerHTML = "";

      const searchValue = jobSearch?.value.trim() ?? "";

      if (searchValue === "") {
        await runJobMatching();
      } else {
        await runJobMatching(searchValue.toLowerCase());
      }

      if (spinner) spinner.style.display = "none";
      if (runText) runText.textContent = "Run Matching";
      runBtn.disabled = false;
      alert("✅ Matching complete!");
    }

    // ===== JOB MATCHING CORE =====
    async function runJobMatching(searchTerm = null) {
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
      [...workExps, ...eligibilities, ...trainings].forEach((r) => {
        applicantText[r.user_id] ??= "";
      });

      workExps.forEach(
        (w) =>
          (applicantText[
            w.user_id
          ] += ` ${w.position} ${w.company} ${w.address}`)
      );
      eligibilities.forEach((e) => (applicantText[e.user_id] += ` ${e.name}`));
      trainings.forEach(
        (t) => (applicantText[t.user_id] += ` ${t.name} ${t.skills_acquired}`)
      );

      const keywords = searchTerm ? tokenize(searchTerm) : [];
      let index = 1;

      for (const vac of vacancies) {
        const industry = await getById(
          "Industry",
          "industry_id",
          vac.industry_id
        );
        const establishment = await getById(
          "Establishment",
          "establishment_id",
          vac.establishment_id
        );

        const searchableText = `
        ${vac.job_title}
        ${vac.remarks}
        ${industry.industry_name}
        ${establishment.establishmentName}
      `.toLowerCase();

        if (
          keywords.length &&
          !keywords.every((k) => searchableText.includes(k))
        )
          continue;

        const vacancyWords = tokenize(searchableText);
        const scores = {};

        Object.entries(applicantText).forEach(([uid, text]) => {
          const matched = vacancyWords.filter((w) =>
            text.toLowerCase().includes(w)
          ).length;
          if (matched > 0) scores[uid] = (matched / vacancyWords.length) * 100;
        });

        const top3 = Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        if (!top3.length && tableBody) {
          tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td colspan="7" style="color:red">No Match Found</td>
          </tr>`;
          continue;
        }

        for (const [uid, pct] of top3) {
          const user = await getById("Users", "user_id", uid);
          const fullName = `${user.firstName ?? ""} ${user.middleName ?? ""} ${
            user.lastName ?? ""
          } ${user.suffix ?? ""}`.trim();

          if (tableBody) {
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
    }

    // ===== LIVE FILTER =====
    if (jobSearch && tableBody) {
      jobSearch.addEventListener("input", () => {
        const q = jobSearch.value.toLowerCase();
        $$("tr", tableBody).forEach((row) => {
          row.style.display = row.textContent.toLowerCase().includes(q)
            ? ""
            : "none";
        });
      });
    }
  });
})();

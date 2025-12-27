(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client not initialized");

  let isMatching = false;
  let CACHE = null;
  const payloadStore = new Map();

  /* ================= DOM READY ================= */
  document.addEventListener("DOMContentLoaded", async () => {

    /* ================= LOGIN CHECK ================= */
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
      return;
    }

    /* ================= PROFILE MENU ================= */
    const profileIcon = document.getElementById("profile-icon");
    const profileMenu = document.getElementById("profile-menu");

    if (profileIcon && profileMenu) {
      profileIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("show");
      });

      profileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      document.addEventListener("click", () => {
        profileMenu.classList.remove("show");
      });
    }

    /* ================= SIDEBAR SUBMENU ================= */
    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const submenu = btn.nextElementSibling;

        document.querySelectorAll(".submenu").forEach((menu) => {
          if (menu !== submenu) menu.classList.remove("show");
        });

        submenu.classList.toggle("show");
      });
    });

    /* ================= BUTTONS ================= */
    document.getElementById("print")?.addEventListener("click", printRenderedMatches);
    document.getElementById("printModal")?.addEventListener("click", printModalDetails);

    /* ================= STOP WORDS ================= */
    const STOP_WORDS = new Set([
      "the","and","of","to","for","with","in","on","at","by",
      "is","are","was","were","be","been","being",
      "he","she","they","it","his","her","their","its",
      "this","that","these","those","from","as","an","a","or","but","if","then","so"
    ]);

    /* ================= HELPERS ================= */
    const byId = (id) => document.getElementById(id);

    const tokenize = (text) =>
      text?.toLowerCase().split(/\s+/).filter(w => w && !STOP_WORDS.has(w)) ?? [];

    const highlight = (text, words) => {
      if (!text || !words.length) return text ?? "";
      let out = text;
      words.forEach(w => {
        const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        out = out.replace(new RegExp(esc, "gi"), "<mark>$&</mark>");
      });
      return out;
    };

    /* ================= ELEMENTS ================= */
    const tableBody = byId("tableBody");
    const runBtn = byId("runMatching");
    const spinner = byId("spinner");
    const runText = byId("runText");
    const searchInput = byId("searchInput");

    /* ================= MODAL ================= */
    document.body.insertAdjacentHTML("beforeend", `
      <div id="jobModal" class="modal hidden">
        <div class="modal-content">
          <span id="closeModal" class="close">&times;</span>
          <h2 id="mJob"></h2>
          <p><b>Applicant:</b> <span id="mApplicant"></span></p>
          <p><b>Establishment:</b> <span id="mEst"></span></p>
          <p><b>Status:</b> <span id="mStatus"></span></p>
          <p><b>Job Remarks:</b></p>
          <div id="mRemarks"></div>
          <hr/>
          <h3>Applicant Background</h3>
          <b>Work Experience</b><ul id="mWork"></ul>
          <b>Eligibilities</b><ul id="mElig"></ul>
          <b>Trainings</b><ul id="mTrain"></ul>
          <hr/>
          <h3>Weighted Matching Computation</h3>
          <div id="mComp"></div>
          <h3>ℹ️ Scoring Notes</h3>
          <div id="mNote">
            <p><b>Final %:</b> (Applicant Score ÷ Max Score) × 100</p>
          </div>
        </div>
      </div>
    `);

    const modal = byId("jobModal");
    byId("closeModal").onclick = () => modal.classList.add("hidden");
    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });

    /* ================= PRELOAD DATA ================= */
    async function preloadData() {
      const [
        vacanciesRes, industriesRes, establishmentsRes, usersRes,
        workRes, eligRes, trainRes
      ] = await Promise.all([
        supabase.from("JobVacancy").select("*").eq("status", "Active"),
        supabase.from("Industry").select("*"),
        supabase.from("Establishment").select("*"),
        supabase.from("Users").select("*"),
        supabase.from("WorkExperience").select("*"),
        supabase.from("Eligibility").select("*"),
        supabase.from("Trainings").select("*")
      ]);

      const applicant = {};
      [...workRes.data, ...eligRes.data, ...trainRes.data].forEach(
        r => applicant[r.user_id] ??= { work: [], elig: [], train: [] }
      );

      workRes.data.forEach(w => applicant[w.user_id].work.push(`${w.position} ${w.company}`));
      eligRes.data.forEach(e => applicant[e.user_id].elig.push(e.name));
      trainRes.data.forEach(t => applicant[t.user_id].train.push(t.name));

      CACHE = {
        vacancies: vacanciesRes.data,
        industries: Object.fromEntries(industriesRes.data.map(i => [i.industry_id, i])),
        establishments: Object.fromEntries(establishmentsRes.data.map(e => [e.establishment_id, e])),
        users: Object.fromEntries(usersRes.data.map(u => [u.user_id, u])),
        applicant
      };
      return CACHE;
    }

    /* ================= RENDER TABLE ================= */
    function renderTable(words = []) {
      tableBody.innerHTML = "";
      let i = 1;

      for (const [id, d] of payloadStore) {
        const text = `${d.job} ${d.industry} ${d.est}`.toLowerCase();
        if (words.length && !words.every(w => text.includes(w))) continue;

        tableBody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${i++}</td>
            <td>${d.applicantName}</td>
            <td>${d.job}</td>
            <td>${d.industry}</td>
            <td>${d.est}</td>
            <td>${d.percent.toFixed(2)}%</td>
            <td><button class="view-btn" data-id="${id}">View</button></td>
          </tr>
        `);
      }
    }

    /* ================= RUN MATCHING ================= */
    runBtn.onclick = async () => {
      if (isMatching) return;
      isMatching = true;

      spinner.style.display = "inline-block";
      runText.textContent = "Running...";
      payloadStore.clear();
      tableBody.innerHTML = "";

      try {
        const cache = await preloadData();

        for (const v of cache.vacancies) {
          const industry = cache.industries[v.industry_id];
          const est = cache.establishments[v.establishment_id];

          const weighted = [
            ...tokenize(v.job_title).map(w => ({ word: w, weight: 5 })),
            ...tokenize(industry.industry_name).map(w => ({ word: w, weight: 3 })),
            ...tokenize(v.remarks).map(w => ({ word: w, weight: 2 })),
            ...tokenize(est.establishmentName).map(w => ({ word: w, weight: 1 }))
          ];

          const maxScore = weighted.reduce((a,b) => a + b.weight, 0);

          for (const [uid, a] of Object.entries(cache.applicant)) {
            const text = [...a.work, ...a.elig, ...a.train].join(" ").toLowerCase();
            let score = 0;
            const matched = [];

            weighted.forEach(w => {
              if (text.includes(w.word)) {
                score += w.weight;
                matched.push(w);
              }
            });

            if (score > 0) {
              const u = cache.users[uid];
              payloadStore.set(crypto.randomUUID(), {
                applicantName: `${u.firstName} ${u.lastName}`,
                job: v.job_title,
                industry: industry.industry_name,
                est: est.establishmentName,
                percent: (score / maxScore) * 100,
                matched,
                work: a.work,
                elig: a.elig,
                train: a.train,
                remarks: v.remarks,
                status: v.status,
                maxScore
              });
            }
          }
        }

        renderTable(tokenize(searchInput.value));
      } catch (e) {
        console.error(e);
        alert("Job matching failed");
      } finally {
        spinner.style.display = "none";
        runText.textContent = "Run Matching";
        isMatching = false;
      }
    };

    /* ================= SEARCH ================= */
    searchInput?.addEventListener("input", () => {
      renderTable(tokenize(searchInput.value));
    });

    /* ================= VIEW MODAL ================= */
    tableBody.onclick = (e) => {
      if (!e.target.classList.contains("view-btn")) return;
      const d = payloadStore.get(e.target.dataset.id);
      if (!d) return;

      const words = d.matched.map(m => m.word);

      byId("mJob").innerHTML = highlight(d.job, words);
      byId("mApplicant").textContent = d.applicantName;
      byId("mEst").innerHTML = highlight(d.est, words);
      byId("mStatus").textContent = d.status;
      byId("mRemarks").innerHTML = highlight(d.remarks, words);

      byId("mWork").innerHTML = d.work.map(w => `<li>${highlight(w, words)}</li>`).join("");
      byId("mElig").innerHTML = d.elig.map(e => `<li>${highlight(e, words)}</li>`).join("");
      byId("mTrain").innerHTML = d.train.map(t => `<li>${highlight(t, words)}</li>`).join("");

      modal.classList.remove("hidden");
    };

  });

  /* ================= PRINT FUNCTIONS ================= */
  function printRenderedMatches() { window.print(); }
  function printModalDetails() { window.print(); }

})();

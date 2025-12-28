(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client not initialized");

  let isMatching = false;
  let CACHE = null;
  const payloadStore = new Map();

  document.addEventListener("DOMContentLoaded", async () => {
    // -----------------------
    // Login check
    // -----------------------
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
      return;
    }

    // -----------------------
    // ELEMENT REFERENCES
    // -----------------------
    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");
    const tableBody = document.getElementById("tableBody");
    const runBtn = document.getElementById("runMatching");
    const spinner = document.getElementById("spinner");
    const runText = document.getElementById("runText");
    const searchInput = document.getElementById("searchInput");
    const printButton = document.getElementById("print");
    const printModalBtn = document.getElementById("printModal");

    // -----------------------
    // PROFILE DROPDOWN
    // -----------------------
    profileIcon?.addEventListener("click", () =>
      profileDropdown?.classList.toggle("show")
    );

    window.addEventListener("click", (e) => {
      if (
        profileIcon &&
        profileDropdown &&
        !profileIcon.contains(e.target) &&
        !profileDropdown.contains(e.target)
      ) {
        profileDropdown.classList.remove("show");
      }
    });

    // -----------------------
    // SIDEBAR MENU + SUBMENU TOGGLE
    // -----------------------
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

        submenu?.classList.toggle("show");
        btn.classList.toggle("open");
      });
    });

    // -----------------------
    // NAVIGATION LINKS
    // -----------------------
    document.querySelectorAll(".sidebar a").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && href !== "#") {
          window.location.href = href;
        }
      });
    });

    // -----------------------
    // PRINT BUTTONS
    // -----------------------
    printButton?.addEventListener("click", printRenderedMatches);
    printModalBtn?.addEventListener("click", printModalDetails);

    // -----------------------
    // SEARCH FILTER
    // -----------------------
    searchInput?.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      const words = tokenize(q);
      renderTable(words);
    });

    // -----------------------
    // MODAL SETUP
    // -----------------------
    setupJobModal();

    // -----------------------
    // RUN MATCHING BUTTON
    // -----------------------
    runBtn?.addEventListener("click", runJobMatching);
  });

  // ============================
  // STOP WORDS
  // ============================
  const STOP_WORDS = new Set([
    "the","and","of","to","for","with","in","on","at","by",
    "is","are","was","were","be","been","being","he","she",
    "they","it","his","her","their","its","this","that","these",
    "those","from","as","an","a","or","but","if","then","so"
  ]);

  const byId = (id) => document.getElementById(id);
  const tokenize = (text) =>
    text?.toLowerCase().split(/\s+/).filter((w) => w && !STOP_WORDS.has(w)) ?? [];

  const highlight = (text, words) => {
    if (!text || !words.length) return text ?? "";
    let out = text;
    words.forEach((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(esc, "gi"), "<mark>$&</mark>");
    });
    return out;
  };

  // ============================
  // MODAL SETUP
  // ============================
  function setupJobModal() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
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
          <div id="mNote" style="font-size:0.9em; line-height:1.5; color:#444;">
            <p><b>Max Score</b> = sum of weights for all relevant job keywords</p>
            <ul>
              <li>Job Title words → 5 points each</li>
              <li>Industry words → 3 points each</li>
              <li>Job Remarks words → 2 points each</li>
              <li>Establishment words → 1 point each</li>
            </ul>
            <p>Applicant Score = sum of points from matched keywords in work, eligibilities, trainings</p>
            <p><b>Final % Formula:</b> (Applicant Score ÷ Max Score) × 100</p>
          </div>
        </div>
      </div>
    `
    );

    const modal = byId("jobModal");
    byId("closeModal").onclick = () => modal.classList.add("hidden");
    window.onclick = (e) => e.target === modal && modal.classList.add("hidden");

    byId("tableBody")?.addEventListener("click", (e) => {
      if (!e.target.classList.contains("view-btn")) return;
      const d = payloadStore.get(e.target.dataset.id);
      if (!d) return;
      renderModalDetails(d);
      modal.classList.remove("hidden");
    });
  }

  // ============================
  // RUN MATCHING
  // ============================
  async function runJobMatching() {
    if (isMatching) return;
    isMatching = true;

    const runBtn = byId("runMatching");
    const spinner = byId("spinner");
    const runText = byId("runText");

    runBtn.disabled = true;
    spinner.style.display = "inline-block";
    runText.textContent = "Running...";
    tableBody.innerHTML = "";
    payloadStore.clear();

    try {
      const cache = await preloadData();
      const searchTerm = byId("searchInput")?.value?.trim().toLowerCase() ?? "";
      const searchWords = tokenize(searchTerm);

      for (const v of cache.vacancies) {
        const industry = cache.industries[v.industry_id];
        const est = cache.establishments[v.establishment_id];
        const searchableText = `${v.job_title} ${industry.industry_name} ${v.remarks} ${est.establishmentName}`.toLowerCase();

        if (searchWords.length && !searchWords.every((w) => searchableText.includes(w)))
          continue;

        const weightedWords = [
          ...tokenize(v.job_title).map((w) => ({ word: w, weight: 5 })),
          ...tokenize(industry.industry_name).map((w) => ({ word: w, weight: 3 })),
          ...tokenize(v.remarks).map((w) => ({ word: w, weight: 2 })),
          ...tokenize(est.establishmentName).map((w) => ({ word: w, weight: 1 }))
        ];

        const maxScore = weightedWords.reduce((a, b) => a + b.weight, 0);

        for (const [uid, a] of Object.entries(cache.applicant)) {
          const text = [...a.work, ...a.elig, ...a.train].join(" ").toLowerCase();
          let score = 0;
          const matchedWords = [];
          weightedWords.forEach((w) => {
            if (text.includes(w.word)) {
              score += w.weight;
              matchedWords.push(w);
            }
          });

          if (score > 0) {
            const u = cache.users[uid];
            const fullName = [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" ");
            const id = crypto.randomUUID();
            payloadStore.set(id, {
              applicantName: fullName,
              job: v.job_title,
              industry: industry.industry_name,
              est: est.establishmentName,
              status: v.status,
              remarks: v.remarks,
              work: a.work,
              elig: a.elig,
              train: a.train,
              matched: matchedWords,
              percent: (score / maxScore) * 100,
              maxScore,
            });
          }
        }
      }

      renderTable(searchWords);
    } catch (err) {
      console.error(err);
      alert("❌ Job matching failed");
    } finally {
      spinner.style.display = "none";
      runText.textContent = "Run Matching";
      runBtn.disabled = false;
      isMatching = false;
    }
  }

  // ============================
  // PRELOAD DATA
  // ============================
  async function preloadData() {
    const [
      vacanciesRes,
      industriesRes,
      establishmentsRes,
      usersRes,
      workRes,
      eligRes,
      trainRes,
    ] = await Promise.all([
      supabase.from("JobVacancy").select("*").eq("status", "Active"),
      supabase.from("Industry").select("*"),
      supabase.from("Establishment").select("*"),
      supabase.from("Users").select("*"),
      supabase.from("WorkExperience").select("*"),
      supabase.from("Eligibility").select("*"),
      supabase.from("Trainings").select("*"),
    ]);

    const applicant = {};
    [...workRes.data, ...eligRes.data, ...trainRes.data].forEach(
      (r) => (applicant[r.user_id] ??= { work: [], elig: [], train: [] })
    );
    workRes.data.forEach((w) => applicant[w.user_id].work.push(`${w.position} ${w.company}`));
    eligRes.data.forEach((e) => applicant[e.user_id].elig.push(e.name));
    trainRes.data.forEach((t) => applicant[t.user_id].train.push(t.name));

    CACHE = {
      vacancies: vacanciesRes.data,
      industries: Object.fromEntries(industriesRes.data.map((i) => [i.industry_id, i])),
      establishments: Object.fromEntries(establishmentsRes.data.map((e) => [e.establishment_id, e])),
      users: Object.fromEntries(usersRes.data.map((u) => [u.user_id, u])),
      applicant,
    };
    return CACHE;
  }

  // ============================
  // RENDER TABLE
  // ============================
  function renderTable(searchWords = []) {
    tableBody.innerHTML = "";
    let idx = 1;
    for (const [id, d] of payloadStore) {
      const searchableText = `${d.job} ${d.industry} ${d.est} ${d.remarks}`.toLowerCase();
      if (searchWords.length && !searchWords.every((w) => searchableText.includes(w)))
        continue;

      tableBody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${idx++}</td>
          <td>${d.applicantName.split(" ")[0]}</td>
          <td>${d.applicantName.split(" ")[1] ?? ""}</td>
          <td>${d.applicantName.split(" ").slice(2).join(" ")}</td>
          <td>${d.job}</td>
          <td>${d.industry}</td>
          <td>${d.est}</td>
          <td><button class="view-btn" data-id="${id}">View</button></td>
          <td><span class="badge active">${d.status}</span></td>
          <td>${d.percent.toFixed(2)}%</td>
        </tr>`
      );
    }
  }

  // ============================
  // MODAL DETAIL RENDER
  // ============================
  function renderModalDetails(d) {
    const words = d.matched.map((m) => m.word);
    const totalScore = d.matched.reduce((a, b) => a + b.weight, 0);
    const formula = d.matched.map((m) => m.weight).join(" + ");

    byId("mJob").innerHTML = highlight(d.job, words);
    byId("mApplicant").textContent = d.applicantName;
    byId("mEst").innerHTML = highlight(d.est, words);
    byId("mStatus").textContent = d.status;
    byId("mRemarks").innerHTML = highlight(d.remarks, words);

    byId("mWork").innerHTML = d.work.map((w) => `<li>${highlight(w, words)}</li>`).join("");
    byId("mElig").innerHTML = d.elig.map((e) => `<li>${highlight(e, words)}</li>`).join("");
    byId("mTrain").innerHTML = d.train.map((t) => `<li>${highlight(t, words)}</li>`).join("");

    byId("mComp").innerHTML = `
      <table style='min-width:500px;'>
        <tr><th>Matched Word</th><th>Weight</th></tr>
        ${d.matched.map((m) => `<tr><td>${m.word}</td><td>${m.weight}</td></tr>`).join("")}
      </table>
      <p><b>Formula:</b> (${formula}) / ${d.maxScore} × 100</p>
      <p><b>Result:</b> (${totalScore}) / ${d.maxScore} × 100 = <b>${d.percent.toFixed(2)}%</b></p>
    `;
  }

  // ============================
  // PRINT FUNCTIONS
  // ============================
  function printRenderedMatches() {
    const tableBody = byId("tableBody");
    if (!tableBody) return;

    const rows = Array.from(tableBody.querySelectorAll("tr"));
    if (!rows.length) { alert("No data to print."); return; }

    let tableRows = "";
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      tableRows += `
      <tr>
        <td>${cells[0].textContent}</td>
        <td>${cells[1].textContent}</td>
        <td>${cells[2].textContent}</td>
        <td>${cells[3].textContent}</td>
        <td>${cells[4].textContent}</td>
        <td>${cells[5].textContent}</td>
        <td>${cells[6].textContent}</td>
        <td>${cells[8].textContent}</td>
        <td>${cells[9].textContent}</td>
      </tr>`;
    });

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Matching Results</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: Arial; font-size:12px; }
            table { border-collapse: collapse; width:100%; }
            th, td { border:1px solid #000; padding:6px; text-align:left; }
            th { background:#f2f2f2; }
            @media print { body { margin:0; } }
          </style>
        </head>
        <body>
          <h2>Job Matching Results</h2>
          <table>
            <thead>
              <tr>
                <th>#</th><th>First Name</th><th>Middle Name</th><th>Last Name</th>
                <th>Job Title</th><th>Industry</th><th>Establishment</th>
                <th>Status</th><th>Match %</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function printModalDetails() {
    const modal = byId("jobModal");
    if (!modal || modal.classList.contains("hidden")) { alert("No job details open to print."); return; }

    const getHTML = (id) => byId(id)?.innerHTML || "";
    const getText = (id) => byId(id)?.textContent || "";

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Matching Details</title>
          <style>
            @page { size: portrait; margin: 20mm; }
            body { font-family: Arial; padding:24px; font-size:13px; }
            h2,h3 { margin-top:20px; }
            ul { padding-left:20px; }
            table { border-collapse: collapse; width:100%; margin-top:10px; }
            th,td { border:1px solid #000; padding:6px; }
            th { background:#f2f2f2; }
            mark { background:#ffe58a; padding:0 2px; }
            hr { margin:20px 0; }
            @media print { body { margin:0; } }
          </style>
        </head>
        <body>
          <h2>${getHTML("mJob")}</h2>
          <p><b>Applicant:</b> ${getText("mApplicant")}</p>
          <p><b>Establishment:</b> ${getHTML("mEst")}</p>
          <p><b>Status:</b> ${getText("mStatus")}</p>
          <p><b>Job Remarks:</b> ${getHTML("mRemarks")}</p>
          <hr/>
          <h3>Applicant Background</h3>
          <b>Work Experience</b><ul>${getHTML("mWork")}</ul>
          <b>Eligibilities</b><ul>${getHTML("mElig")}</ul>
          <b>Trainings</b><ul>${getHTML("mTrain")}</ul>
          <hr/>
          <h3>Weighted Matching Computation</h3>
          ${getHTML("mComp")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

})();

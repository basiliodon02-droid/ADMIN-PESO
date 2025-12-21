(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client not initialized");

  let isMatching = false;
  let CACHE = null;
  const payloadStore = new Map();

  document.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("isLoggedIn") === "FALSE") {
      window.location.href = "./index.html";
      return;
    }

    /* ================= STOP WORDS ================= */
    const STOP_WORDS = new Set([
      "the", "and", "of", "to", "for", "with", "in", "on", "at", "by",
      "is", "are", "was", "were", "be", "been", "being",
      "he", "she", "they", "it", "his", "her", "their", "its",
      "this", "that", "these", "those",
      "from", "as", "an", "a", "or", "but", "if", "then", "so"
    ]);

    /* ================= HELPERS ================= */
    const byId = (id) => document.getElementById(id);

    const tokenize = (text) =>
      text?.toLowerCase()
        .split(/\s+/)
        .filter(w => w && !STOP_WORDS.has(w)) ?? [];

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
          <b>Work Experience</b>
          <ul id="mWork"></ul>

          <b>Eligibilities</b>
          <ul id="mElig"></ul>

          <b>Trainings</b>
          <ul id="mTrain"></ul>

          <hr/>

          <h3>Weighted Matching Computation</h3>
          <div id="mComp"></div>
          <h3>ℹ️ Scoring Notes</h3>
        <div id="mNote" style="font-size: 0.9em; line-height: 1.5; color: #444;">
          <p>
            <b>Max Score</b> represents a <b>100% match</b> for this job.
            It is computed by summing the weights of all relevant job-related keywords.
          </p>

          <ul>
            <li><b>Job Title words</b> → 5 points each</li>
            <li><b>Industry words</b> → 3 points each</li>
            <li><b>Job Remarks words</b> → 2 points each</li>
            <li><b>Establishment words</b> → 1 point each</li>
          </ul>

          <p>
            The applicant’s score is the total points of matched keywords found in
            their <b>work experience</b>, <b>eligibilities</b>, and <b>trainings</b>.
          </p>

          <p>
            <b>Final Percentage Formula:</b><br/>
            <code>(Applicant Score ÷ Max Score) × 100</code>
          </p>
        </div>
        </div>
        
      </div>
    `);

    const modal = byId("jobModal");
    byId("closeModal").onclick = () => modal.classList.add("hidden");
    window.onclick = e => e.target === modal && modal.classList.add("hidden");

    /* ================= FAST PRELOAD ================= */
    async function preloadData() {
      if (CACHE) return CACHE;

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
        r => applicant[r.user_id] ??= { work: [], elig: [], train: [] }
      );

      workRes.data.forEach(w =>
        applicant[w.user_id].work.push(`${w.position} ${w.company}`)
      );
      eligRes.data.forEach(e =>
        applicant[e.user_id].elig.push(e.name)
      );
      trainRes.data.forEach(t =>
        applicant[t.user_id].train.push(t.name)
      );

      CACHE = {
        vacancies: vacanciesRes.data,
        industries: Object.fromEntries(industriesRes.data.map(i => [i.industry_id, i])),
        establishments: Object.fromEntries(establishmentsRes.data.map(e => [e.establishment_id, e])),
        users: Object.fromEntries(usersRes.data.map(u => [u.user_id, u])),
        applicant,
      };

      return CACHE;
    }

    /* ================= RUN MATCHING ================= */
    runBtn.onclick = async () => {
      if (isMatching) return;

      isMatching = true;
      runBtn.disabled = true;
      spinner.style.display = "inline-block";
      runText.textContent = "Running...";
      tableBody.innerHTML = "";
      payloadStore.clear();

      try {
        const cache = await preloadData();
        let idx = 1;

        for (const v of cache.vacancies) {
          const industry = cache.industries[v.industry_id];
          const est = cache.establishments[v.establishment_id];

          const weightedWords = [
            ...tokenize(v.job_title).map(w => ({ word: w, weight: 5 })),
            ...tokenize(industry.industry_name).map(w => ({ word: w, weight: 3 })),
            ...tokenize(v.remarks).map(w => ({ word: w, weight: 2 })),
            ...tokenize(est.establishmentName).map(w => ({ word: w, weight: 1 })),
          ];

          const maxScore = weightedWords.reduce((a, b) => a + b.weight, 0);
          const scores = [];

          for (const [uid, a] of Object.entries(cache.applicant)) {
            const text = [...a.work, ...a.elig, ...a.train].join(" ").toLowerCase();
            let score = 0;
            const matchedWords = [];

            for (const w of weightedWords) {
              if (text.includes(w.word)) {
                score += w.weight;
                matchedWords.push(w);
              }
            }

            if (score > 0) {
              scores.push({
                uid,
                score,
                percent: (score / maxScore) * 100,
                matchedWords,
              });
            }
          }

          scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .forEach(s => {
              const u = cache.users[s.uid];
              const fullName = [
                u.firstName,
                u.middleName,
                u.lastName,
                u.suffix
              ].filter(Boolean).join(" ");

              const id = crypto.randomUUID();

              payloadStore.set(id, {
                applicantName: fullName,
                job: v.job_title,
                est: est.establishmentName,
                status: v.status,
                remarks: v.remarks,
                work: cache.applicant[s.uid].work,
                elig: cache.applicant[s.uid].elig,
                train: cache.applicant[s.uid].train,
                matched: s.matchedWords,
                percent: s.percent,
                maxScore,
              });

              tableBody.insertAdjacentHTML("beforeend", `
                <tr>
                  <td>${idx++}</td>
                  <td>${u.firstName}</td>
                  <td>${u.middleName ?? ""}</td>
                  <td>${u.lastName}</td>
                  <td>${v.job_title}</td>
                  <td>${industry.industry_name}</td>
                  <td>${est.establishmentName}</td>
                  <td><button class="view-btn" data-id="${id}">View</button></td>
                  <td><span class="badge active">${v.status}</span></td>
                  <td>${s.percent.toFixed(2)}%</td>
                </tr>
              `);
            });
        }
      } catch (err) {
        console.error(err);
        alert("❌ Job matching failed");
      } finally {
        spinner.style.display = "none";
        runText.textContent = "Run Matching";
        runBtn.disabled = false;
        isMatching = false;
      }
    };

    /* ================= MODAL CLICK ================= */
    tableBody.onclick = (e) => {
      if (!e.target.classList.contains("view-btn")) return;
      const d = payloadStore.get(e.target.dataset.id);
      if (!d) return;

      const words = d.matched.map(m => m.word);
      const totalScore = d.matched.reduce((a, b) => a + b.weight, 0);
      const formula = d.matched.map(m => m.weight).join(" + ");

      byId("mJob").innerHTML = highlight(d.job, words);
      byId("mApplicant").textContent = d.applicantName;
      byId("mEst").innerHTML = highlight(d.est, words);
      byId("mStatus").textContent = d.status;
      byId("mRemarks").innerHTML = highlight(d.remarks, words);

      byId("mWork").innerHTML =
        d.work.map(w => `<li>${highlight(w, words)}</li>`).join("");

      byId("mElig").innerHTML =
        d.elig.map(e => `<li>${highlight(e, words)}</li>`).join("");

      byId("mTrain").innerHTML =
        d.train.map(t => `<li>${highlight(t, words)}</li>`).join("");

      byId("mComp").innerHTML = `
        <table style='min-width:500px;'>
          <tr><th>Matched Word</th><th>Weight</th></tr>
          ${d.matched.map(m =>
        `<tr><td>${m.word}</td><td>${m.weight}</td></tr>`
      ).join("")}
        </table>

        <p>
          <b>Formula:</b><br>
          (${formula}) / ${d.maxScore} × 100
        </p>

        <p>
          <b>Result:</b><br>
          (${totalScore}) / ${d.maxScore} × 100 =
          <b>${d.percent.toFixed(2)}%</b>
        </p>
      `;

      modal.classList.remove("hidden");
    };
  });
})();

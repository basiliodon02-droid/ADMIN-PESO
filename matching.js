document.addEventListener("DOMContentLoaded", async () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const tableBody = $("#matchingTable tbody");
  const runBtn = $("#runMatching");
  const spinner = $("#spinner");
  const runText = $("#runText");

  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    spinner.style.display = "inline-block";
    runText.textContent = "Running...";

    tableBody.innerHTML = ""; // Clear previous results
    await runJobMatching();

    spinner.style.display = "none";
    runText.textContent = "Run Matching";
    runBtn.disabled = false;
    alert("✅ Matching complete! New potential matches found.");
  });

  // -------------------------------
  // Helper functions
  // -------------------------------
  async function fetchTable(tableName) {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      console.error(`Error fetching ${tableName}:`, error.message);
      return [];
    }
    return data ?? [];
  }

  async function getIndustryById(industry_id) {
    const { data } = await supabase.from("Industry").select("*").eq("industry_id", industry_id);
    return data?.[0] ?? {};
  }

  async function getEstablishmentById(establishment_id) {
    const { data } = await supabase.from("Establishment").select("*").eq("establishment_id", establishment_id);
    return data?.[0] ?? {};
  }

  async function getUserById(user_id) {
    const { data } = await supabase.from("Users").select("*").eq("user_id", user_id);
    return data?.[0] ?? {};
  }

  function tokenize(text) {
    return text ? text.toLowerCase().split(/\s+/).filter(w => w) : [];
  }

  // -------------------------------
  // Main job matching logic
  // -------------------------------
  async function runJobMatching() {
    // Fetch all active vacancies
    const { data: vacancies } = await supabase.from("JobVacancy")
      .select("*")
      .eq("status", "Active")
      .order("vacancy_id", { ascending: true });

    if (!vacancies || vacancies.length === 0) return;

    // Preload applicant tables
    const [workExps, eligibilities, trainings] = await Promise.all([
      fetchTable("WorkExperience"),
      fetchTable("Eligibility"),
      fetchTable("Trainings")
    ]);

    // Build combined applicant text
    const allUserIds = new Set([
      ...workExps.map(w => w.user_id),
      ...eligibilities.map(e => e.user_id),
      ...trainings.map(t => t.user_id)
    ]);

    const applicantTextMap = {};
    allUserIds.forEach(uid => applicantTextMap[uid] = "");

    workExps.forEach(w => {
      let txt = applicantTextMap[w.user_id];
      txt += ` ${w.position ?? ""} ${w.company ?? ""} ${w.address ?? ""}`;
      applicantTextMap[w.user_id] = txt.toLowerCase();
    });

    eligibilities.forEach(e => {
      let txt = applicantTextMap[e.user_id];
      txt += ` ${e.name ?? ""}`;
      applicantTextMap[e.user_id] = txt.toLowerCase();
    });

    trainings.forEach(t => {
      let txt = applicantTextMap[t.user_id];
      txt += ` ${t.name ?? ""} ${t.skills_acquired ?? ""}`;
      applicantTextMap[t.user_id] = txt.toLowerCase();
    });

    // Process each vacancy
    let index = 1;
    for (const vac of vacancies) {
      const { vacancy_id, job_title, remarks, industry_id, establishment_id, status } = vac;

      const industry = await getIndustryById(industry_id);
      const establishment = await getEstablishmentById(establishment_id);

      const vacancyWords = [
        ...tokenize(job_title),
        ...tokenize(remarks),
        ...tokenize(establishment.establishmentName),
        ...tokenize(industry.industry_name)
      ];

      if (vacancyWords.length === 0) {
        tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td colspan="6">No Match Found</td>
          </tr>`;
        continue;
      }

      // Compute match percentage per applicant
      const matchPercentMap = {};
      Object.entries(applicantTextMap).forEach(([uid, text]) => {
        const matched = vacancyWords.filter(w => text.includes(w)).length;
        if (matched > 0) matchPercentMap[uid] = (matched / vacancyWords.length) * 100;
      });

      const ranked = Object.entries(matchPercentMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (ranked.length === 0) {
        tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td colspan="6">No Match Found</td>
          </tr>`;
        continue;
      }

      // Render top 3
      for (const [uid, pct] of ranked) {
        const user = await getUserById(uid);
        const fullName = `${user.firstName ?? ""} ${user.middleName ?? ""} ${user.lastName ?? ""} ${user.suffix ?? ""}`.trim();
        tableBody.innerHTML += `
          <tr>
            <td>${index++}</td>
            <td>${fullName || "User ID: " + uid}</td>
            <td>${job_title}</td>
            <td>${industry.industry_name ?? ""}</td>
            <td>${establishment.establishmentName ?? ""}</td>
            <td>${status}</td>
            <td align="center">${pct.toFixed(2)}%</td>
          </tr>`;
      }
    }
  }
});

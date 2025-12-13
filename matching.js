document.addEventListener("DOMContentLoaded", async () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const tableBody = $("#tableBody"); // tbody where rows go
  const runBtn = $("#runMatching");
  const spinner = $("#spinner");
  const runText = $("#runText");
  const jobSearch = $("#searchInput"); // search input

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

    tableBody.innerHTML = ""; // Clear previous results
    await runJobMatching();

    spinner.style.display = "none";
    runText.textContent = "Run Matching";
    runBtn.disabled = false;
    alert("✅ Matching complete! New potential matches found.");
  });

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
      applicantTextMap[w.user_id] += ` ${w.position ?? ""} ${w.company ?? ""} ${w.address ?? ""}`.toLowerCase();
    });
    eligibilities.forEach(e => {
      applicantTextMap[e.user_id] += ` ${e.name ?? ""}`.toLowerCase();
    });
    trainings.forEach(t => {
      applicantTextMap[t.user_id] += ` ${t.name ?? ""} ${t.skills_acquired ?? ""}`.toLowerCase();
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
        tableBody.innerHTML += `<tr><td>${index++}</td><td colspan="6">No Match Found</td></tr>`;
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
        tableBody.innerHTML += `<tr><td>${index++}</td><td colspan="6">No Match Found</td></tr>`;
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
            <td><span class="${status == "Active" ? "badge active" : "badge pending"}">${status}</span></td>
            <td align="center">${pct.toFixed(2)}%</td>
          </tr>`;
      }
    }
  }

  // -------------------------------
  // LIVE SEARCH
  // -------------------------------
  jobSearch.addEventListener("input", () => {
    const query = jobSearch.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  });
});


//GET LIST OF JOB VACANCIES FUNCTION
async function getVacancyList() {
  const { data, error } = await supabase
    .from("JobVacancy")
    .select("*")
    .eq("status", "Active")
    .order("vacancy_id", { ascending: true });

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

async function getIndustryById(industry_id) {
  const { data, error } = await supabase
    .from("Industry")
    .select("*")
    .eq("industry_id", industry_id);

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

async function getEstablishmentById(establishment_id) {
  const { data, error } = await supabase
    .from("Establishment")
    .select("*")
    .eq("establishment_id", establishment_id);

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


// window.onload = runJobMatching();

async function runJobMatching() {
  const tbody = document.getElementById("matchingTable");
  // tbody.innerHTML = "";
  const result = await getVacancyList();
  if (!result.success) {
    alert(result.message);
    return;
  }

  let index = 1; // for table indexing

  for (const vacancy of result.data) {
    let {
      establishment_id,
      industry_id,
      vacancy_id,
      job_title,
      remarks,
      status,
    } = vacancy;

    const industryRes = await getIndustryById(industry_id);
    if (!industryRes.success) continue;

    const establishmentRes = await getEstablishmentById(establishment_id);
    if (!establishmentRes.success) continue;

    const industryName = industryRes.data[0].industry_name;
    const establishmentName = establishmentRes.data[0].establishmentName;

    if (remarks == null || remarks.trim() === "") {
      remarks = "N/A";
    }
    const searchTerms = [
      remarks,
      establishmentName,
      industryName,
      job_title,
    ].filter(Boolean);
    console.log(remarks, 'remarks');
    console.log("Terms for matching:", searchTerms);

    // Fetch matches
    const workExpMatches = await searchWorkExperience(searchTerms);
    const eligibilityMatches = await searchEligibility(searchTerms);
    const trainingMatches = await searchTraining(searchTerms);

    const allMatches = [
      ...workExpMatches,
      ...eligibilityMatches,
      ...trainingMatches,
    ];

    // No matches found
    if (!allMatches.length) {
      console.log(
        `%cNo users found for vacancy_id ${vacancy_id}`,
        "color:red;font-weight:bold"
      );

      document.getElementById("matchingTable").innerHTML += `
        <tr>
          <td>${index++}</td>
          <td style='color:red'>No Match Found</td>
          <td>${searchTerms[3]}</td>
          <td>${searchTerms[2]}</td>
          <td>${searchTerms[1]}</td>
          <td><span class="${status == "Active" ? "badge active" : "badge pending"
        }">${status}</span></td>
          <td align=center>N/A</td>
        </tr>  
        `;
      await recordMatchResults(vacancy_id, []);
      continue;
    }

    // GROUP POINTS BY USER
    const scores = {};

    for (const match of allMatches) {
      if (!scores[match.user_id]) scores[match.user_id] = 0;
      scores[match.user_id] += match.points;
    }

    // SORT descending
    const rankedUsers = Object.entries(scores)
      .map(([user_id, points]) => ({ user_id, points }))
      .sort((a, b) => b.points - a.points);

    // TOP 3 USERS
    const top3 = rankedUsers.slice(0, 3);

    console.log(
      `%cTOP matches for vacancy_id ${vacancy_id}:`,
      "color:green;font-weight:bold"
    );
    console.table("top", top3);
    console.table("user", top3[0].user_id);
    const foundUser = await getUserById(top3[0].user_id);
    console.log(foundUser);
    document.getElementById("matchingTable").innerHTML += `
        <tr>
          <td>${index++}</td>
          <td>${foundUser.data[0]?.firstName} ${foundUser.data[0]?.middleName ?? ""
      } ${foundUser.data[0]?.lastName} ${foundUser.data[0]?.suffix ?? ""}</td>
          <td>${searchTerms[3]}</td>
          <td>${searchTerms[2]}</td>
          <td>${searchTerms[1]}</td>
          <td><span class="${status == "Active" ? "badge active" : "badge pending"
      }">${status}</span></td>
          <td align=center>${top3[0].points}</td>
        </tr>  
        `;

    // SAVE MATCH RESULTS TO DB
    // await recordMatchResults(vacancy_id, top3);
  }
}

function scoreField(text, terms, weight) {
  if (!text) return 0;

  let score = 0;
  const lower = text.toLowerCase();

  for (const t of terms) {
    const term = t.toLowerCase();

    if (lower === term) score += 1 * weight; // exact match
    else if (lower.includes(term)) score += 1 * weight; // partial match
  }

  return score;
}

async function searchWorkExperience(terms) {
  const { data, error } = await supabase.from("WorkExperience").select("*");
  if (error) return [];

  const list = [];

  for (const row of data) {
    const points =
      scoreField(row.position, terms, 2) +
      scoreField(row.address, terms, 2) +
      scoreField(row.company, terms, 2);

    if (points > 0) list.push({ user_id: row.user_id, points });
  }

  return list;
}

async function searchEligibility(terms) {
  const { data, error } = await supabase.from("Eligibility").select("*");
  if (error) return [];

  const list = [];

  for (const row of data) {
    const points = scoreField(row.name, terms, 1);
    if (points > 0) list.push({ user_id: row.user_id, points });
  }

  return list;
}

async function searchTraining(terms) {
  const { data, error } = await supabase.from("Trainings").select("*");
  if (error) return [];

  const list = [];

  for (const row of data) {
    const points =
      scoreField(row.name, terms, 1.5) +
      scoreField(row.skills_acquired, terms, 1.5);

    if (points > 0) list.push({ user_id: row.user_id, points });
  }

  return list;
}

async function recordMatchResults(vacancy_id, topList) {
  // Clear previous results for this vacancy
  // await supabase.from("MatchResults").delete().eq("vacancy_id", vacancy_id);

  // if (!topList.length) {
  //   // Save "no user found"
  //   await supabase.from("MatchResults").insert([
  //     {
  //       vacancy_id,
  //       user_id: null,
  //       points: 0,
  //       rank: 0
  //     }
  //   ]);
  //   return;
  // }

  // // Insert ranked results
  // const rows = topList.map((item, index) => ({
  //   vacancy_id,
  //   user_id: item.user_id,
  //   points: item.points,
  //   rank: index + 1
  // }));

  // await supabase.from("MatchResults").insert(rows);
  console.log(topList);
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", id);
  if (error) {
    console.log("failed to get user");
    return {
      message: error.message,
      success: false,
      data: {},
    };
  } else {
    console.log("found user", data);
    return {
      message: "got it",
      success: true,
      data: data,
    };
  }
}

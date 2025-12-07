document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const addOverlay = $("#addOverlay");
  const viewOverlay = $("#viewOverlay");
  const deleteOverlay = $("#deleteOverlay");

  const addModalBox = $("#addModalBox");

  const cancelAdd = $("#cancelAdd");
  const closeView = $("#closeView");
  const cancelDelete = $("#cancelDelete");
  const confirmDelete = $("#confirmDelete");

  const tableBody = $("#tableBody");
  const form = $("#addMatchForm");
  const formTitle = $("#formTitle");
  const editIndex = $("#editIndex");
  const applicant = $("#applicant");
  const appliedJob = $("#appliedJob");
  const vacancy = $("#vacancy");
  const establishment = $("#establishment");
  const score = $("#score");

  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");

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

  const open = (ov) => {
    ov.style.display = "flex";
    ov.setAttribute("aria-hidden", "false");
  };
  const close = (ov) => {
    ov.style.display = "none";
    ov.setAttribute("aria-hidden", "true");
  };

  let deleteRow = null;

  cancelAdd.addEventListener("click", () => close(addOverlay));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = new Date().toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const cells = `
    <td></td>
    <td>${applicant.value}</td>
    <td>${appliedJob.value}</td>
    <td>${vacancy.value}</td>
    <td>${establishment.value}</td>
    <td>${score.value}</td>
    <td><span class="badge pending">Pending</span></td>
    <td>${date}</td>
    <td class="action-icons">
      <i class="bi bi-eye-fill icon-view" title="View"></i>
      <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
      <i class="bi bi-check2-square icon-accept" title="Accept"></i>
      <i class="bi bi-x-square icon-reject" title="Reject"></i>
      <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
    </td>`;

    if (editIndex.value !== "") {
      const row = tableBody.rows[parseInt(editIndex.value, 10)];
      row.innerHTML = cells;
    } else {
      const tr = document.createElement("tr");
      tr.innerHTML = cells;
      tableBody.appendChild(tr);
    }

    [...tableBody.rows].forEach((r, i) => (r.cells[0].textContent = i + 1));

    close(addOverlay);
    form.reset();
    editIndex.value = "";
  });

  // document.addEventListener("click", (e) => {
  //   if (e.target.classList.contains("icon-view")) {
  //     const row = e.target.closest("tr");
  //     const c = row.cells;
  //     const pairs = [
  //       ["Applicant:", c[1].innerText],
  //       ["Applied Job:", c[2].innerText],
  //       ["Matched Vacancy:", c[3].innerText],
  //       ["Establishment:", c[4].innerText],
  //       ["Score:", c[5].innerText],
  //       ["Status:", c[6].innerText],
  //       ["Date:", c[7].innerText],
  //     ];
  //     $("#viewDetails").innerHTML = pairs
  //       .map(([l, v]) => `<p><b>${l}</b><span>${v}</span></p>`)
  //       .join("");
  //     open(viewOverlay);
  //   }

  //   if (e.target.classList.contains("icon-edit")) {
  //     const row = e.target.closest("tr");
  //     const c = row.cells;
  //     applicant.value = c[1].innerText;
  //     appliedJob.value = c[2].innerText;
  //     vacancy.value = c[3].innerText;
  //     establishment.value = c[4].innerText;
  //     score.value = c[5].innerText;
  //     editIndex.value = row.rowIndex - 1;
  //     formTitle.textContent = "✏️ Edit Match";
  //     addModalBox.classList.remove("new-modal");
  //     addModalBox.classList.add("edit-modal");
  //     open(addOverlay);
  //   }

  //   if (e.target.classList.contains("icon-accept")) {
  //     const badge = e.target.closest("tr").querySelector(".badge");
  //     badge.textContent = "Matched";
  //     badge.className = "badge active";
  //   }

  //   if (e.target.classList.contains("icon-reject")) {
  //     const badge = e.target.closest("tr").querySelector(".badge");
  //     badge.textContent = "Rejected";
  //     badge.className = "badge inactive";
  //   }

  //   if (e.target.classList.contains("icon-delete")) {
  //     deleteRow = e.target.closest("tr");
  //     open(deleteOverlay);
  //   }
  // });

  // closeView.addEventListener("click", () => close(viewOverlay));
  // cancelDelete.addEventListener("click", () => close(deleteOverlay));
  // confirmDelete.addEventListener("click", () => {
  //   if (deleteRow) {
  //     deleteRow.remove();
  //     deleteRow = null;
  //     [...tableBody.rows].forEach((r, i) => (r.cells[0].textContent = i + 1));
  //   }
  //   close(deleteOverlay);
  // });

  $("#searchInput").addEventListener("keyup", (e) => {
    const q = e.target.value.toLowerCase();
    [...tableBody.rows].forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
  });

  const runBtn = $("#runMatching");
  const runText = $("#runText");
  const spinner = $("#spinner");
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    spinner.style.display = "inline-block";
    runText.textContent = "Running...";

    // document.getElementById("tableBody").innerHTML = "";

    const table = document.getElementById("matchingTable");

    while (table.rows.length > 1) {
      table.deleteRow(1); // Keep header (index 0)
    }

    await runJobMatching();
    spinner.style.display = "none";
    runText.textContent = "Run Matching";
    runBtn.disabled = false;
    alert("✅ Matching simulation complete! New potential matches found.");

    // setTimeout(() => {
    //   spinner.style.display = "none";
    //   runText.textContent = "Run Matching";
    //   runBtn.disabled = false;
    //   alert("✅ Matching simulation complete! New potential matches found.");
    // }, 200);
  });

  $$(".toggle-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = btn.nextElementSibling;
      $$(".submenu").forEach((list) => {
        if (list !== submenu) list.classList.remove("show");
      });
      submenu.classList.toggle("show");
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("skl-overlay")) {
      e.target.style.display = "none";
    }
  });

  [...tableBody.rows].forEach((r, i) => (r.cells[0].textContent = i + 1));
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
    console.log("faled to get user");
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

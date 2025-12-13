// Supabase client (from supabaseClient.js)
const supabase = window.supabaseClient;

/* ===============================
   COUNT EMPLOYERS
================================ */
async function loadEmployerCount() {
  const { count, error } = await supabase
    .from("employers")
    .select("*", { count: "exact", head: true });

  if (!error) {
    document.getElementById("employerCount").textContent = count;
  }
}

/* ===============================
   COUNT EMPLOYEES
================================ */
async function loadEmployeeCount() {
  const { count, error } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });

  if (!error) {
    document.getElementById("employeeCount").textContent = count;
  }
}

/* ===============================
   RECENT ACTIVITIES (MAX 10)
================================ */
async function loadRecentActivities() {
  const { data, error } = await supabase
    .from("activities")
    .select("description, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const list = document.getElementById("recentActivitiesList");
  list.innerHTML = "";

  if (error || data.length === 0) {
    list.innerHTML = "<li>No recent activities</li>";
    return;
  }

  data.forEach(activity => {
    const li = document.createElement("li");
    li.textContent = `${activity.description} • ${formatDateTime(activity.created_at)}`;
    list.appendChild(li);
  });
}

/* ===============================
   SYSTEM LAST UPDATE
================================ */
function loadSystemLastUpdate() {
  const now = new Date();
  document.getElementById("systemLastUpdate").textContent =
    formatDateTime(now);
}

/* ===============================
   SYSTEM ONLINE / OFFLINE
================================ */
function updateSystemStatus() {
  const statusEl = document.getElementById("systemStatus");

  if (navigator.onLine) {
    statusEl.textContent = "Online";
    statusEl.classList.remove("status-offline");
    statusEl.classList.add("status-online");
  } else {
    statusEl.textContent = "Offline";
    statusEl.classList.remove("status-online");
    statusEl.classList.add("status-offline");
  }
}

/* ===============================
   DATE FORMATTER
================================ */
function formatDateTime(date) {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/* ===============================
   PROFILE MENU
================================ */
function toggleProfileMenu() {
  document.getElementById("profile-menu").classList.toggle("show");
}

/* ===============================
   INIT LOAD
================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadEmployerCount();
  loadEmployeeCount();
  loadRecentActivities();
  loadSystemLastUpdate();
  updateSystemStatus();

  // auto detect online/offline
  window.addEventListener("online", updateSystemStatus);
  window.addEventListener("offline", updateSystemStatus);
});

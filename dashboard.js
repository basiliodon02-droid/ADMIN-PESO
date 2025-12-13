// ===== DASHBOARD.JS =====

// ===== PROFILE MENU TOGGLE =====
function toggleProfileMenu() {
  const profileMenu = document.getElementById("profile-menu");
  profileMenu.classList.toggle("show");
}

// Close profile menu when clicking outside
document.addEventListener("click", function (event) {
  const profileMenu = document.getElementById("profile-menu");
  const profileIcon = document.getElementById("profile-icon");

  if (!profileMenu.contains(event.target) && !profileIcon.contains(event.target)) {
    profileMenu.classList.remove("show");
  }
});

// ===== SIDEBAR SUBMENU TOGGLE =====
document.querySelectorAll(".toggle-menu").forEach((toggle) => {
  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    const submenu = this.nextElementSibling;
    submenu.classList.toggle("show");
    const icon = this.querySelector("i");
    if (submenu.classList.contains("show")) {
      icon.style.transform = "rotate(180deg)";
    } else {
      icon.style.transform = "rotate(0deg)";
    }
  });
});

// ===== SYSTEM STATUS LAST UPDATE =====
function updateSystemStatus() {
  const lastUpdateSpan = document.getElementById("lastUpdate");
  if (lastUpdateSpan) {
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    lastUpdateSpan.textContent = formattedDate;
  }
}

// Initial call
updateSystemStatus();

// Optionally, update every minute
setInterval(updateSystemStatus, 60000);

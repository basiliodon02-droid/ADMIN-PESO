// 🚨 Redirect if not logged in
if (localStorage.getItem("isLoggedIn") === "FALSE") {
  window.location.href = "./index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  
  // ===== PROFILE DROPDOWN =====
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");

  profileIcon.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent body click
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    profileDropdown.classList.remove("show");
  });

  // ===== SIDEBAR SUBMENU TOGGLE =====
  const toggleMenus = document.querySelectorAll(".toggle-menu");

  toggleMenus.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); 

      const submenu = btn.nextElementSibling;

      // Close other submenus
      document.querySelectorAll(".submenu").forEach((menu) => {
        if (menu !== submenu) {
          menu.classList.remove("show");
          menu.previousElementSibling?.classList.remove("open");
        }
      });

      // Toggle current submenu
      submenu.classList.toggle("show");
      btn.classList.toggle("open");
    });
  });

  // ===== Highlight active submenu based on URL =====
  const currentPath = window.location.pathname.split("/").pop();
  document.querySelectorAll(".submenu-item").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
      link.closest(".submenu").classList.add("show");
      link.closest(".submenu").previousElementSibling.classList.add("open");
    }
  });

  // ===== LIVE SYSTEM LAST UPDATE =====
  const systemLastUpdate = document.getElementById("systemLastUpdate");

  function updateSystemTime() {
    const now = new Date();
    const formattedTime = now.toLocaleString(); // You can customize format
    systemLastUpdate.textContent = `Last updated: ${formattedTime}`;
  }

  // Update immediately
  updateSystemTime();

  // Update every 1 second
  setInterval(updateSystemTime, 1000);
});

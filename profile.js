(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }

  const userId = localStorage.getItem("userId");
  let currentPwd = "";

  // ---------------------------
  // Sidebar Master Data Dropdown
  // ---------------------------
  document.querySelectorAll(".toggle-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = btn.nextElementSibling;

      // Close all other submenus
      document.querySelectorAll(".submenu").forEach((list) => {
        if (list !== submenu) list.classList.remove("show");
      });

      // Toggle clicked submenu
      submenu.classList.toggle("show");
    });
  });

  // Automatically expand submenu for current page
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".submenu-item").forEach((item) => {
    if (item.getAttribute("href") === currentPage) {
      item.classList.add("active");        // highlight
      const submenu = item.closest(".submenu");
      if (submenu) submenu.classList.add("show"); // expand parent
    }
  });

  // ---------------------------
  // Profile menu toggle
  // ---------------------------
  function toggleProfileMenu() {
    const profileMenu = document.getElementById("profile-menu");
    profileMenu.classList.toggle("show");
  }

  document.addEventListener("click", function (event) {
    const profileMenu = document.getElementById("profile-menu");
    if (
      !profileMenu.contains(event.target) &&
      !event.target.matches("#profile-icon")
    ) {
      profileMenu.classList.remove("show");
    }
  });

  // ---------------------------
  // Edit Profile Modal
  // ---------------------------
  const modal = document.getElementById("editModal");
  const openBtn = document.getElementById("editBtn");
  const closeBtn = document.getElementById("closeModal");
  const form = document.getElementById("editForm");

  openBtn.onclick = async () => {
    modal.style.display = "flex";
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    const result = await getUserDetails(userId);
    if (result.success) {
      const firstName = result.data[0].firstName ?? "";
      const middleName = result.data[0].middleName ?? "";
      const lastName = result.data[0].lastName ?? "";
      const suffix = result.data[0].suffix ?? "";
      const fullName = `${firstName} ${middleName} ${lastName} ${suffix}`;
      currentPwd = result.data[0].password;

      document.getElementById("displayName").innerText = fullName;
      document.getElementById("role").innerText = result.data[0].role;
      document.getElementById("nameCell").innerText = fullName;
      document.getElementById("emailCell").innerText = result.data[0].email;
      document.getElementById("contactCell").innerText =
        result.data[0].contact_number ?? "-";
      document.getElementById("roleCell").innerText = result.data[0].role;
      document.getElementById("createDateCell").innerText =
        result.data[0].created_at;

      document.getElementById("editFName").value = firstName;
      document.getElementById("editMName").value = middleName;
      document.getElementById("editLName").value = lastName;
      document.getElementById("editSuffix").value = suffix;
      document.getElementById("editEmail").value = result.data[0].email;
      document.getElementById("editContact").value =
        result.data[0].contact_number ?? "";
    }
  };

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (currentPassword !== currentPwd) {
      alert("Current Password is incorrect!");
      return;
    }

    let firstName = document.getElementById("editFName").value;
    let middleName = document.getElementById("editMName").value;
    let lastName = document.getElementById("editLName").value;
    let suffix = document.getElementById("editSuffix").value;
    let email = document.getElementById("editEmail").value;
    let contact_number = document.getElementById("editContact").value;
    let password = document.getElementById("newPassword").value;

    const result = await editProfile(
      userId,
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      contact_number,
      password
    );

    if (result.success) {
      alert("Profile and password updated successfully!");
      modal.style.display = "none";
      form.reset();
      await loadUserData();
    } else {
      alert("Profile update failed!");
    }
  });

  // ---------------------------
  // Load user data
  // ---------------------------
  async function loadUserData() {
    document.getElementById("displayName").innerText = "-";
    document.getElementById("role").innerText = "-";
    document.getElementById("nameCell").innerText = "-";
    document.getElementById("emailCell").innerText = "-";
    document.getElementById("contactCell").innerText = "-";
    document.getElementById("roleCell").innerText = "-";
    document.getElementById("createDateCell").innerText = "-";

    const result = await getUserDetails(userId);
    if (result.success) {
      const firstName = result.data[0].firstName ?? "";
      const middleName = result.data[0].middleName ?? "";
      const lastName = result.data[0].lastName ?? "";
      const suffix = result.data[0].suffix ?? "";
      const fullName = `${firstName} ${middleName} ${lastName} ${suffix}`;
      currentPwd = result.data[0].password;

      document.getElementById("displayName").innerText = fullName;
      document.getElementById("role").innerText = result.data[0].role;
      document.getElementById("nameCell").innerText = fullName;
      document.getElementById("emailCell").innerText = result.data[0].email;
      document.getElementById("contactCell").innerText =
        result.data[0].contact_number ?? "-";
      document.getElementById("roleCell").innerText = result.data[0].role;
      document.getElementById("createDateCell").innerText =
        result.data[0].created_at;

      document.getElementById("editFName").value = firstName;
      document.getElementById("editMName").value = middleName;
      document.getElementById("editLName").value = lastName;
      document.getElementById("editSuffix").value = suffix;
      document.getElementById("editEmail").value = result.data[0].email;
      document.getElementById("editContact").value =
        result.data[0].contact_number ?? "";
    }
  }

  window.onload = loadUserData;

  // ---------------------------
  // Supabase API functions
  // ---------------------------
  async function getUserDetails(user_id) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", user_id);
    if (error) {
      return { message: error.message, success: false, data: {} };
    }
    return { message: "got it", success: true, data };
  }

  async function editProfile(
    user_id,
    firstName,
    middleName,
    lastName,
    suffix,
    email,
    contact_number,
    password
  ) {
    const { error } = await supabase
      .from("Users")
      .update({
        firstName,
        middleName,
        lastName,
        suffix,
        email,
        contact_number,
        password,
      })
      .eq("user_id", user_id)
      .select();

    if (error) {
      return { message: error.message, success: false };
    }
    return { message: "Profile Updated!", success: true };
  }
})();

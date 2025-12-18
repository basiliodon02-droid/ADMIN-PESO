(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  if (localStorage.getItem("isLoggedIn") == "FALSE") {
    window.location.href = "./index.html";
  }

  const userId = localStorage.getItem("userId");
  let currentPwd = "";

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
    if (result.success == true) {
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
    } else {
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

    // document.getElementById("editFName").value = document.getElementById("nameCell").textContent;
    // document.getElementById("editEmail").value = document.getElementById("emailCell").textContent;
    // // document.getElementById("usernameCell").textContent = document.getElementById("editUsername").value;
    // document.getElementById("editContact").value = document.getElementById("contactCell").textContent;
    // document.getElementById("editName").value = document.getElementById("displayName").textContent;

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
    if (result.success == true) {
      alert("Profile and password updated successfully!");
      modal.style.display = "none";
      form.reset();

      const result = await getUserDetails(userId);
      if (result.success == true) {
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
      } else {
      }
    } else {
      alert("Profile and password updated failed!");
    }
  });

  window.onload = async function () {
    //initially hide stats numbers
    document.getElementById("displayName").innerText = "-";
    document.getElementById("role").innerText = "-";
    document.getElementById("nameCell").innerText = "-";
    document.getElementById("emailCell").innerText = "-";
    document.getElementById("contactCell").innerText = "-";
    document.getElementById("roleCell").innerText = "-";
    document.getElementById("createDateCell").innerText = "-";

    const result = await getUserDetails(userId);
    if (result.success == true) {
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
    } else {
    }
  };

  async function getUserDetails(user_id) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", user_id);
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
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        suffix: suffix,
        email: email,
        contact_number: contact_number,
        password: password,
      })
      .eq("user_id", user_id) // your condition
      .select();

    if (error) {
      return {
        message: error.message,
        success: false,
      };
    } else {
      return {
        message: `Profile Updated!`,
        success: true,
      };
    }
  }
})();

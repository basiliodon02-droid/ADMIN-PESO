if (localStorage.getItem('isLoggedIn')=='FALSE'){
  window.location.href="./index.html";
}

    function toggleProfileMenu() {
      const profileMenu = document.getElementById('profile-menu');
      profileMenu.classList.toggle('show');
    }

    document.addEventListener('click', function (event) {
      const profileMenu = document.getElementById('profile-menu');
      if (!profileMenu.contains(event.target) && !event.target.matches('#profile-icon')) {
        profileMenu.classList.remove('show');
      }
    });

    const modal = document.getElementById("editModal");
    const openBtn = document.getElementById("editBtn");
    const closeBtn = document.getElementById("closeModal");
    const form = document.getElementById("editForm");

    openBtn.onclick = () => {
      modal.style.display = "flex";
    };

    closeBtn.onclick = () => modal.style.display = "none";

    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      document.getElementById("nameCell").textContent = document.getElementById("editName").value;
      document.getElementById("emailCell").textContent = document.getElementById("editEmail").value;
      document.getElementById("usernameCell").textContent = document.getElementById("editUsername").value;
      document.getElementById("contactCell").textContent = document.getElementById("editContact").value;
      document.getElementById("displayName").textContent = document.getElementById("editName").value;

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return; 
      }

      alert("Profile and password updated successfully!");

      modal.style.display = "none";
      form.reset();
    });
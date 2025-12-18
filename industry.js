(() => {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is not initialized!");

  // ADDED ↓ run everything after DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    // ADDED ↑

    if (localStorage.getItem("isLoggedIn") == "FALSE") {
      window.location.href = "./index.html";
    }
    document.querySelectorAll(".toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        document.querySelectorAll(".submenu").forEach((list) => {
          if (list !== submenu) list.classList.remove("show");
        });
        submenu.classList.toggle("show");
      });
    });

    function toggleProfileMenu() {
      const profileMenu = document.getElementById("profile-menu");
      profileMenu.classList.toggle("show");
    }

    const qs = (s, d = document) => d.querySelector(s);
    const qsa = (s, d = document) => Array.from(d.querySelectorAll(s));

    const addModal = qs("#addIndustryModal");
    const editModal = qs("#editIndustryModal");
    const viewOverlay = qs("#viewOverlay");
    const viewDetails = qs("#viewDetails");
    const deleteOverlay = qs("#deleteOverlay");
    const tableBody = qs("#industryTableBody");

    function show(el) {
      el.style.display = "flex";
      el.setAttribute("aria-hidden", "false");
    }
    function hide(el) {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }

    qs("#openAddModalBtn").onclick = () => show(addModal);

    qsa(".btn-cancel[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetSelector = btn.getAttribute("data-close");
        const target = qs(targetSelector);
        if (target) hide(target);
      });
    });

    qs("#saveIndustryBtn").onclick = async () => {
      // const name = qs("#addIndustryName").value.trim();
      //   const desc = qs("#addIndustryDesc").value.trim();
      //   if(!name){
      //     qs("#addIndustryName").focus();
      //     return;
      //   }
      //   addRow({ name, desc });
      //   qs("#addIndustryName").value = "";
      //   qs("#addIndustryDesc").value = "";
      //   hide(addModal);
      // };

      //   async function addRow({name, desc}) {
      //   const rowCount = tableBody.querySelectorAll("tr").length + 1;
      //   const tr = document.createElement("tr");
      //   tr.innerHTML = `
      //     <td>${rowCount}</td>
      //     <td>${escapeHtml(name)}</td>
      //     <td>${escapeHtml(desc)}</td>
      //     <td class="action-icons">
      //       <i class="bi bi-eye-fill icon-view" title="View"></i>
      //       <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
      //       <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
      //     </td>
      //   `;
      //   tableBody.appendChild(tr);
      //   // ADDED ↓ keep numbering consistent even after mixed add/delete
      //   renumberRows();
      //   // ADDED ↑

      const name = qs("#addIndustryName").value.trim();
      const desc = qs("#addIndustryDesc").value.trim();
      if (!name) {
        qs("#addIndustryName").focus();
        return;
      }

      const result = await addIndustry(name, desc);
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        alert(result.message); //browser alert message
        renumberRows(); //re fetch all industry and rebuild table
        qs("#addIndustryName").value = "";
        qs("#addIndustryDesc").value = "";
        hide(addModal);
      }
    };

    let rowToEdit = null;
    let rowToDelete = null;

    document.addEventListener("click", (e) => {
      const iconView = e.target.closest(".icon-view");
      const iconEdit = e.target.closest(".icon-edit");
      const iconDelete = e.target.closest(".icon-delete");

      if (iconView) {
        const row = iconView.closest("tr");
        const name = row.children[1].innerText;
        const desc = row.children[2].innerText || "—";

        viewDetails.innerHTML = `
      <p><b>Industry Name:</b><span>${name}</span></p>
      <p><b>Description:</b><span>${desc}</span></p>
    `;
        show(viewOverlay);
      }

      if (iconEdit) {
        const row = iconEdit.closest("tr");
        rowToEdit = row;

        qs("#editIndustryName").value = row.children[1].innerText;
        qs("#editIndustryDesc").value = row.children[2].innerText;
        qs("#editIndustryId").value = row.children[4].innerText; //row of hidden td for industry_id

        show(editModal);
      }

      if (iconDelete) {
        const row = iconDelete.closest("tr");
        rowToDelete = row;
        qs("#deleteIndustryId").value = row.children[4].innerText; //row of hidden td for industry_id
        const name = row.children[1].innerText;
        qs(
          "#deleteIndustryText"
        ).textContent = `Are you sure you want to delete "${name}"?`;

        show(deleteOverlay);
      }
    });

    qs("#updateIndustryBtn").onclick = async () => {
      if (!rowToEdit) return;

      const newName = qs("#editIndustryName").value.trim();
      const newDesc = qs("#editIndustryDesc").value.trim();
      const industryId = qs("#editIndustryId").value.trim();

      if (newName) {
        // rowToEdit.children[1].innerText = newName;
        const result = await editIndustry(industryId, newName, newDesc);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          renumberRows(); //reloads the table data
          hide(editModal);
          rowToEdit = null;
        }
      }
      // rowToEdit.children[2].innerText = newDesc;
    };

    const cancelDeleteBtn = qs("#cancelDeleteBtn");
    const confirmDeleteBtn = qs("#confirmDeleteBtn");

    cancelDeleteBtn.onclick = () => {
      hide(deleteOverlay);
      rowToDelete = null;
    };

    confirmDeleteBtn.onclick = async () => {
      if (rowToDelete) {
        // const tbody = rowToDelete.parentElement;
        // tbody.removeChild(rowToDelete);

        const selectedIndustryId =
          document.getElementById("deleteIndustryId").value;
        const result = await deleteIndustry(selectedIndustryId);
        if (result.success === false) {
          alert(result.message); //browser alert message
        } else {
          alert(result.message); //browser alert message
          document.getElementById("deleteIndustryId").value = "";
          renumberRows(); // you already had this
          hide(deleteOverlay);
          rowToDelete = null;
        }
      }
    };

    qs("#closeView").onclick = () => hide(viewOverlay);

    window.addEventListener("click", (e) => {
      if (e.target === viewOverlay) hide(viewOverlay);
      if (e.target === deleteOverlay) hide(deleteOverlay);
      if (e.target === addModal) hide(addModal);
      if (e.target === editModal) hide(editModal);
    });

    qs("#searchInput").addEventListener("keyup", (e) => {
      const q = e.target.value.toLowerCase();
      Array.from(tableBody.rows).forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(q)
          ? ""
          : "none";
      });
    });

    async function renumberRows() {
      // Array.from(tableBody.rows).forEach((tr, i) => {
      //   tr.children[0].innerText = i + 1;
      // });
      const result = await getIndustryList();
      if (result.success === false) {
        alert(result.message); //browser alert message
      } else {
        //added td for industry_id but only hidden
        tableBody.innerHTML = "";
        for (i = 0; i < result.data.length; i++) {
          tableBody.insertAdjacentHTML(
            "beforeend",
            `
        <tr>
          <td>${i + 1}</td>
          <td>${result.data[i].industry_name}</td>
          <td>${result.data[i].description}</td>
          <td class="action-icons">
            <i class="bi bi-eye-fill icon-view" title="View"></i>
            <i class="bi bi-pencil-square icon-edit" title="Edit"></i>
            <i class="bi bi-trash3-fill icon-delete" title="Delete"></i>
          </td>
          <td style='display:none;'>${result.data[i].industry_id}</td>
        </tr>  
        `
          );
        }
      }
    }

    // ADDED ↓ initial renumber on load (covers any pre-rendered rows)
    renumberRows();
    // ADDED ↑

    function escapeHtml(str = "") {
      return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    //GET LIST OF INDUSTRY FUNCTION
    async function getIndustryList() {
      const { data, error } = await supabase
        .from("Industry")
        .select("*")
        .order("industry_id", { ascending: true });

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

    //ADD INDUSTRY FUNCTION
    async function addIndustry(industryName, industryDescription) {
      const { data, error } = await supabase.from("Industry").insert([
        {
          industry_name: industryName,
          description: industryDescription,
          createdAt: new Date().toLocaleString(),
        },
      ]);

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: "Industry Added!",
          success: true,
        };
      }
    }

    //EDIT INDUSTRY FUNCTION
    async function editIndustry(industryId, industryName, industryDescription) {
      const { error } = await supabase
        .from("Industry")
        .update({
          industry_name: industryName,
          description: industryDescription,
          modifiedAt: new Date().toLocaleString(),
        })
        .eq("industry_id", industryId) // your condition
        .select();

      if (error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: `Industry Updated!`,
          success: true,
        };
      }
    }

    //DELETE INDUSTRY FUNCTION
    async function deleteIndustry(industryId) {
      const { data, error } = await supabase
        .from("Industry")
        .delete()
        .eq("industry_id", industryId)
        .select();
      // .throwOnError();
      if (error || data.length === 0) {
        return {
          message: error?.message || "Foreign key prevents deletion.",
          success: false,
        };
      } else {
        return {
          message: `Industry Deleted!`,
          success: true,
        };
      }
    }
  });
})();

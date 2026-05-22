// ============================================================
//  ADMIN.JS — Logique du panneau d'administration
// ============================================================

let currentAdmin = null;

// Helper : vérifie si l'admin connecté est superadmin
function isSuperAdmin() {
  return currentAdmin && currentAdmin.role === "superadmin";
}

// Bloque une action si pas superadmin et affiche un message
function requireSuperAdmin(action) {
  if (!isSuperAdmin()) {
    showToast("⛔ Accès refusé — réservé au Super Administrateur.", "error");
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initSidebar();
  initAutoLogout();
  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// ============================================================
//  AUTH
// ============================================================

function initLogin() {
  const s = getSettings();
  const loginServerName = document.getElementById("loginServerName");
  if (loginServerName) loginServerName.textContent = s.serverName;

  if (s.logoUrl) {
    const loginLogo = document.querySelector(".login-logo");
    if (loginLogo) loginLogo.src = s.logoUrl;
  }

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const admins = getAdmins();
    const found = admins.find(a => a.username === user && a.password === pass);
    if (found) {
      currentAdmin = found;
      document.getElementById("loginOverlay").classList.add("hidden");
      document.getElementById("adminPanel").classList.remove("hidden");
      initAdminPanel();
    } else {
      document.getElementById("loginError").textContent = "Identifiants incorrects.";
    }
  });
}

function logout() {
  currentAdmin = null;
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("loginOverlay").classList.remove("hidden");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginError").textContent = "";
}

// ============================================================
//  DÉCONNEXION AUTOMATIQUE (30 min d'inactivité)
// ============================================================

let _inactivityTimer = null;

function initAutoLogout() {
  const TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const reset = () => {
    clearTimeout(_inactivityTimer);
    if (!currentAdmin) return;
    _inactivityTimer = setTimeout(() => {
      showToast("Déconnecté pour inactivité.", "error");
      setTimeout(logout, 1500);
    }, TIMEOUT);
  };
  ["mousemove", "keydown", "click", "scroll"].forEach(ev => document.addEventListener(ev, reset));
}

// ============================================================
//  INIT PANEL
// ============================================================

function initAdminPanel() {
  const s = getSettings();

  document.getElementById("sidebarServerName").textContent = s.serverName;
  document.getElementById("currentAdminName").textContent = currentAdmin.username;

  if (s.logoUrl) {
    document.querySelectorAll(".sidebar-logo").forEach(img => img.src = s.logoUrl);
  }

  // Afficher/masquer les onglets selon le rôle
  applyRoleUI();

  renderDashboard();
  renderCategoriesTable();
  renderRulesTable();
  renderAdminsTable();
  loadSettings();
  populateCategorySelects();
}

// ============================================================
//  RESTRICTIONS D'INTERFACE PAR RÔLE
// ============================================================

function applyRoleUI() {
  const superAdmin = isSuperAdmin();

  // Badge de rôle dans la sidebar
  const roleEl = document.getElementById("sidebarRoleBadge");
  if (roleEl) {
    roleEl.textContent = superAdmin ? "Super Admin" : "Admin";
    roleEl.className = superAdmin ? "role-badge role-superadmin" : "role-badge role-admin";
  }

  // Onglets Admins, Paramètres et Recrutement : visibles seulement pour superadmin
  const superOnlyTabs = ["admins", "settings", "recruitment", "staffmembers", "sanctions", "faqadmin", "changelogadmin", "actionlog"];
  superOnlyTabs.forEach(tabId => {
    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (btn) btn.style.display = superAdmin ? "" : "none";
  });

  // Boutons d'ajout catégorie/règle : visibles pour tous
  // Bouton "Nouvel admin" dans le dashboard : superadmin seulement
  const quickAdminBtn = document.getElementById("quickAddAdminBtn");
  if (quickAdminBtn) quickAdminBtn.style.display = superAdmin ? "" : "none";
}

// ============================================================
//  SIDEBAR NAVIGATION
// ============================================================

function initSidebar() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Sous-onglets recrutement
  document.querySelectorAll(".recruit-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchRecruitTab(btn.dataset.rtab));
  });
}

function switchTab(tabId) {
  const superOnlyTabs = ["admins", "settings", "recruitment", "staffmembers", "sanctions", "faqadmin", "changelogadmin", "actionlog"];
  if (superOnlyTabs.includes(tabId) && !isSuperAdmin()) {
    showToast("⛔ Accès refusé — réservé au Super Administrateur.", "error");
    return;
  }

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

  const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  const tab = document.getElementById("tab-" + tabId);
  if (btn) btn.classList.add("active");
  if (tab) tab.classList.add("active");

  if (tabId === "recruitment")    { renderApplications(); renderQuestionsList(); loadRecruitSettings(); }
  if (tabId === "staffmembers")   renderStaffMembersTable();
  if (tabId === "sanctions")      renderSanctionsTable();
  if (tabId === "faqadmin")       renderFaqTable();
  if (tabId === "changelogadmin") renderChangelogTable();
  if (tabId === "actionlog")      renderActionLog();
}

function switchRecruitTab(rtabId) {
  document.querySelectorAll(".recruit-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".rtab-content").forEach(t => t.classList.remove("active"));
  const btn = document.querySelector(`.recruit-tab-btn[data-rtab="${rtabId}"]`);
  const tab = document.getElementById("rtab-" + rtabId);
  if (btn) btn.classList.add("active");
  if (tab) tab.classList.add("active");
}

// ============================================================
//  DASHBOARD
// ============================================================

function renderDashboard() {
  document.getElementById("statCategories").textContent = getCategories().length;
  document.getElementById("statRules").textContent = getRules().length;
  document.getElementById("statAdmins").textContent = getAdmins().length;
}

// ============================================================
//  CATEGORIES
// ============================================================

function renderCategoriesTable() {
  const tbody = document.getElementById("categoriesTableBody");
  const categories = getCategories();
  const rules = getRules();

  tbody.innerHTML = "";

  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#555;padding:24px">Aucune catégorie</td></tr>';
    return;
  }

  categories.forEach(cat => {
    const count = rules.filter(r => r.categoryId === cat.id).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-size:1.4rem">${escapeHtml(cat.icon)}</td>
      <td>${escapeHtml(cat.name)}</td>
      <td><span class="color-dot" style="background:${cat.color}"></span> ${cat.color}</td>
      <td>${count}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editCategory('${cat.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('category','${cat.id}','la catégorie « ${escapeHtml(cat.name)} »')">🗑 Supprimer</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function editCategory(id) {
  const cat = getCategories().find(c => c.id === id);
  if (!cat) return;
  document.getElementById("modalCategoryTitle").textContent = "Modifier la catégorie";
  document.getElementById("editCategoryId").value = cat.id;
  document.getElementById("catName").value = cat.name;
  document.getElementById("catIcon").value = cat.icon;
  document.getElementById("catColor").value = cat.color;
  document.getElementById("catDesc").value = cat.description || "";
  openModal("modalAddCategory");
}

function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById("editCategoryId").value;
  const name = document.getElementById("catName").value.trim();
  const icon = document.getElementById("catIcon").value.trim();
  const color = document.getElementById("catColor").value;
  const description = document.getElementById("catDesc").value.trim();

  let categories = getCategories();

  if (id) {
    categories = categories.map(c => c.id === id ? { ...c, name, icon, color, description } : c);
    logAction(currentAdmin?.username, "Catégorie modifiée", name);
    showToast("Catégorie modifiée ✓", "success");
  } else {
    categories.push({ id: generateId("cat"), name, icon, color, description });
    logAction(currentAdmin?.username, "Catégorie ajoutée", name);
    showToast("Catégorie ajoutée ✓", "success");
  }

  setCategories(categories);
  closeModal("modalAddCategory");
  resetCategoryForm();
  renderCategoriesTable();
  renderDashboard();
  populateCategorySelects();
}

function resetCategoryForm() {
  document.getElementById("editCategoryId").value = "";
  document.getElementById("catName").value = "";
  document.getElementById("catIcon").value = "";
  document.getElementById("catColor").value = "#5865f2";
  document.getElementById("catDesc").value = "";
  document.getElementById("modalCategoryTitle").textContent = "Ajouter une catégorie";
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#modalAddCategory .modal-close").addEventListener("click", resetCategoryForm);
});

// ============================================================
//  RULES
// ============================================================

function populateCategorySelects() {
  const categories = getCategories();
  const selects = [
    document.getElementById("ruleCategory"),
    document.getElementById("filterCategory")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const firstOpt = sel.options[0];
    sel.innerHTML = "";
    sel.appendChild(firstOpt);
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.icon + " " + cat.name;
      sel.appendChild(opt);
    });
  });
}

function renderRulesTable() {
  const tbody = document.getElementById("rulesTableBody");
  const filterVal = document.getElementById("filterCategory")?.value || "";
  const categories = getCategories();
  let rules = getRules();

  if (filterVal) rules = rules.filter(r => r.categoryId === filterVal);

  tbody.innerHTML = "";

  if (rules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#555;padding:24px">Aucune règle</td></tr>';
    return;
  }

  rules.forEach((rule, i) => {
    const cat = categories.find(c => c.id === rule.categoryId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${cat ? `<span style="color:${cat.color}">${escapeHtml(cat.icon)} ${escapeHtml(cat.name)}</span>` : "—"}</td>
      <td>${escapeHtml(rule.title)}</td>
      <td class="desc-cell">${escapeHtml(rule.description)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editRule('${rule.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('rule','${rule.id}','la règle « ${escapeHtml(rule.title)} »')">🗑 Supprimer</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editRule(id) {
  const rule = getRules().find(r => r.id === id);
  if (!rule) return;
  document.getElementById("modalRuleTitle").textContent = "Modifier la règle";
  document.getElementById("editRuleId").value = rule.id;
  document.getElementById("ruleCategory").value = rule.categoryId;
  document.getElementById("ruleTitle").value = rule.title;
  document.getElementById("ruleDesc").value = rule.description;
  openModal("modalAddRule");
}

function saveRule(e) {
  e.preventDefault();
  const id = document.getElementById("editRuleId").value;
  const categoryId = document.getElementById("ruleCategory").value;
  const title = document.getElementById("ruleTitle").value.trim();
  const description = document.getElementById("ruleDesc").value.trim();

  let rules = getRules();

  if (id) {
    rules = rules.map(r => r.id === id ? { ...r, categoryId, title, description } : r);
    logAction(currentAdmin?.username, "Règle modifiée", title);
    showToast("Règle modifiée ✓", "success");
  } else {
    rules.push({ id: generateId("r"), categoryId, title, description });
    logAction(currentAdmin?.username, "Règle ajoutée", title);
    showToast("Règle ajoutée ✓", "success");
  }

  setRules(rules);
  closeModal("modalAddRule");
  resetRuleForm();
  renderRulesTable();
  renderDashboard();
}

function resetRuleForm() {
  document.getElementById("editRuleId").value = "";
  document.getElementById("ruleCategory").value = "";
  document.getElementById("ruleTitle").value = "";
  document.getElementById("ruleDesc").value = "";
  document.getElementById("modalRuleTitle").textContent = "Ajouter une règle";
}

// ============================================================
//  ADMINS — Superadmin seulement
// ============================================================

function renderAdminsTable() {
  const tbody = document.getElementById("adminsTableBody");
  const admins = getAdmins();

  tbody.innerHTML = "";

  admins.forEach(admin => {
    const isSelf = currentAdmin && admin.id === currentAdmin.id;
    const tr = document.createElement("tr");

    // Un admin normal ne voit que son propre compte (en lecture seule)
    if (!isSuperAdmin() && !isSelf) return;

    // Un admin normal peut seulement modifier son propre mot de passe, pas le rôle
    const canEditRole = isSuperAdmin();
    const canDelete   = isSuperAdmin() && !isSelf;

    tr.innerHTML = `
      <td>${escapeHtml(admin.username)} ${isSelf ? '<span style="color:#888;font-size:12px">(vous)</span>' : ""}</td>
      <td><span class="badge badge-${admin.role}">${admin.role === "superadmin" ? "Super Admin" : "Admin"}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editAdmin('${admin.id}')">✏️ ${isSelf && !isSuperAdmin() ? "Changer mot de passe" : "Modifier"}</button>
          ${canDelete ? `<button class="btn-icon danger" data-del-id="${admin.id}" onclick="confirmDeleteAdmin(this)">🗑 Retirer</button>` : ""}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editAdmin(id) {
  const admin = getAdmins().find(a => a.id === id);
  if (!admin) return;

  // Un admin normal ne peut modifier que son propre compte
  if (!isSuperAdmin() && admin.id !== currentAdmin.id) {
    showToast("⛔ Accès refusé.", "error");
    return;
  }

  document.getElementById("modalAdminTitle").textContent = "Modifier l'administrateur";
  document.getElementById("editAdminId").value = admin.id;
  document.getElementById("adminUsername").value = admin.username;
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminRole").value = admin.role;
  document.getElementById("adminPassHint").style.display = "block";

  // Masquer le champ rôle pour un admin normal
  const roleGroup = document.getElementById("adminRoleGroup");
  if (roleGroup) roleGroup.style.display = isSuperAdmin() ? "" : "none";

  // Masquer le champ username pour un admin normal (il ne peut que changer son mdp)
  const usernameGroup = document.getElementById("adminUsernameGroup");
  if (usernameGroup) usernameGroup.style.display = isSuperAdmin() ? "" : "none";

  openModal("modalAddAdmin");
}

function saveAdmin(e) {
  e.preventDefault();
  const id       = document.getElementById("editAdminId").value;
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  const role     = document.getElementById("adminRole").value;

  // Création d'un nouvel admin : superadmin seulement
  if (!id && !requireSuperAdmin()) return;

  let admins = getAdmins();

  if (id) {
    // Un admin normal ne peut modifier que son propre mot de passe
    if (!isSuperAdmin() && id !== currentAdmin.id) {
      showToast("⛔ Accès refusé.", "error");
      return;
    }

    admins = admins.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...(password ? { password } : {}) };
      // Seul le superadmin peut changer le username et le rôle
      if (isSuperAdmin()) {
        updated.username = username;
        updated.role = role;
      }
      return updated;
    });

    if (currentAdmin && currentAdmin.id === id) {
      currentAdmin = admins.find(a => a.id === id);
      document.getElementById("currentAdminName").textContent = currentAdmin.username;
    }
    showToast("Administrateur modifié ✓", "success");
  } else {
    if (!password) { showToast("Le mot de passe est requis.", "error"); return; }
    const exists = admins.find(a => a.username === username);
    if (exists) { showToast("Ce nom d'utilisateur existe déjà.", "error"); return; }
    admins.push({ id: generateId("admin"), username, password, role });
    showToast("Administrateur ajouté ✓", "success");
  }

  setAdmins(admins);
  closeModal("modalAddAdmin");
  resetAdminForm();
  renderAdminsTable();
  renderDashboard();
}

// Helper pour la suppression d'admin — évite les problèmes d'apostrophes dans onclick
function confirmDeleteAdmin(btn) {
  const id = btn.getAttribute("data-del-id");
  const admin = getAdmins().find(a => a.id === id);
  const label = admin ? `l'administrateur « ${admin.username} »` : "cet administrateur";
  confirmDelete("admin", id, label);
}

function resetAdminForm() {
  document.getElementById("editAdminId").value = "";
  document.getElementById("adminUsername").value = "";
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminRole").value = "admin";
  document.getElementById("adminPassHint").style.display = "none";
  document.getElementById("modalAdminTitle").textContent = "Ajouter un administrateur";

  const roleGroup = document.getElementById("adminRoleGroup");
  if (roleGroup) roleGroup.style.display = "";
  const usernameGroup = document.getElementById("adminUsernameGroup");
  if (usernameGroup) usernameGroup.style.display = "";
}

// ============================================================
//  SETTINGS — Superadmin seulement
// ============================================================

function loadSettings() {
  if (!isSuperAdmin()) return;
  const s = getSettings();
  document.getElementById("settingServerName").value  = s.serverName  || "";
  document.getElementById("settingSubtitle").value    = s.subtitle    || "";
  document.getElementById("settingFooter").value      = s.footer      || "";
  document.getElementById("settingLogoUrl").value     = s.logoUrl     || "";
  document.getElementById("settingDiscordUrl").value  = s.discordUrl  || "";
  document.getElementById("settingBannerImg").value   = s.bannerImg   || "";
  document.getElementById("settingAccentColor").value = s.accentColor || "#5865f2";
  document.getElementById("settingTheme").value       = s.theme       || "dark";
}

function saveSettings() {
  if (!requireSuperAdmin()) return;
  const s = {
    serverName:  document.getElementById("settingServerName").value.trim(),
    subtitle:    document.getElementById("settingSubtitle").value.trim(),
    footer:      document.getElementById("settingFooter").value.trim(),
    logoUrl:     document.getElementById("settingLogoUrl").value.trim() || "assets/logo.png",
    discordUrl:  document.getElementById("settingDiscordUrl").value.trim(),
    bannerImg:   document.getElementById("settingBannerImg").value.trim(),
    accentColor: document.getElementById("settingAccentColor").value,
    theme:       document.getElementById("settingTheme").value,
    // Conserver les paramètres recrutement
    staffRecruitmentOpen: getSettings().staffRecruitmentOpen,
    staffBannerTitle:     getSettings().staffBannerTitle,
    staffBannerDesc:      getSettings().staffBannerDesc,
    staffIntro:           getSettings().staffIntro
  };
  setSettings(s);
  document.getElementById("sidebarServerName").textContent = s.serverName;
  document.querySelectorAll(".sidebar-logo").forEach(img => img.src = s.logoUrl);
  logAction(currentAdmin?.username, "Paramètres modifiés", "Paramètres du site mis à jour");
  showToast("Paramètres sauvegardés ✓", "success");
}

// ============================================================
//  DELETE CONFIRMATION
// ============================================================

let pendingDelete = null;

function confirmDelete(type, id, label) {
  // Suppression d'admin : superadmin seulement
  if (type === "admin" && !requireSuperAdmin()) return;

  document.getElementById("deleteConfirmText").textContent = `Êtes-vous sûr de vouloir supprimer ${label} ?`;
  pendingDelete = { type, id };
  openModal("modalConfirmDelete");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;

    if (type === "category") {
      let categories = getCategories().filter(c => c.id !== id);
      let rules = getRules().filter(r => r.categoryId !== id);
      setCategories(categories);
      setRules(rules);
      renderCategoriesTable();
      renderRulesTable();
      populateCategorySelects();
      showToast("Catégorie supprimée ✓", "success");
    } else if (type === "rule") {
      setRules(getRules().filter(r => r.id !== id));
      renderRulesTable();
      showToast("Règle supprimée ✓", "success");
    } else if (type === "admin") {
      if (!isSuperAdmin()) { showToast("⛔ Accès refusé.", "error"); return; }
      const deletedAdmin = getAdmins().find(a => a.id === id);
      setAdmins(getAdmins().filter(a => a.id !== id));
      logAction(currentAdmin?.username, "Administrateur supprimé", deletedAdmin?.username || id);
      renderAdminsTable();
      showToast("Administrateur retiré ✓", "success");
    } else if (type === "application") {
      setApplications(getApplications().filter(a => a.id !== id));
      renderApplications();
      showToast("Candidature supprimée ✓", "success");
    } else if (type === "question") {
      setStaffQuestions(getStaffQuestions().filter(q => q.id !== id));
      renderQuestionsList();
      showToast("Question supprimée ✓", "success");
    } else if (type === "staffmember") {
      setStaffMembers(getStaffMembers().filter(m => m.id !== id));
      renderStaffMembersTable();
      logAction(currentAdmin?.username, "Membre staff supprimé", id);
      showToast("Membre supprimé ✓", "success");
    } else if (type === "sanction") {
      setSanctions(getSanctions().filter(s => s.id !== id));
      renderSanctionsTable();
      logAction(currentAdmin?.username, "Sanction supprimée", id);
      showToast("Sanction supprimée ✓", "success");
    } else if (type === "faq") {
      setFaq(getFaq().filter(f => f.id !== id));
      renderFaqTable();
      logAction(currentAdmin?.username, "FAQ supprimée", id);
      showToast("Question supprimée ✓", "success");
    } else if (type === "changelog") {
      setChangelog(getChangelog().filter(e => e.id !== id));
      renderChangelogTable();
      logAction(currentAdmin?.username, "Changelog supprimé", id);
      showToast("Entrée supprimée ✓", "success");
    }
    renderDashboard();
    pendingDelete = null;
    closeModal("modalConfirmDelete");
  });
});

// ============================================================
//  RECRUTEMENT STAFF — Superadmin seulement
// ============================================================

// ---- Candidatures ----

function renderApplications() {
  const list = document.getElementById("applicationsList");
  if (!list) return;

  const filterVal = document.getElementById("filterAppStatus")?.value || "";
  let apps = getApplications();
  if (filterVal) apps = apps.filter(a => a.status === filterVal);

  // Trier par date décroissante
  apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  // Badge compteur en attente
  const badge = document.getElementById("appCountBadge");
  if (badge) {
    const pending = getApplications().filter(a => a.status === "pending").length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? "inline-flex" : "none";
  }

  if (apps.length === 0) {
    list.innerHTML = '<div class="empty-apps">Aucune candidature pour le moment.</div>';
    return;
  }

  list.innerHTML = "";
  apps.forEach(app => {
    const date = new Date(app.submittedAt).toLocaleString("fr-FR");
    const firstAnswer = app.answers?.[0]?.answer || "—";
    const statusInfo = {
      pending:  { label: "En attente", cls: "status-pending" },
      accepted: { label: "Acceptée",   cls: "status-accepted" },
      rejected: { label: "Refusée",    cls: "status-rejected" }
    }[app.status] || { label: app.status, cls: "" };

    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <div class="app-card-header">
        <div class="app-card-info">
          <span class="app-status ${statusInfo.cls}">${statusInfo.label}</span>
          <span class="app-date">📅 ${date}</span>
          ${app.trackingCode ? `<span class="app-tracking-code">🔑 ${escapeHtml(app.trackingCode)}</span>` : ""}
        </div>
        <div class="app-card-actions">
          <button class="btn-icon" onclick="viewApplication('${app.id}')">👁 Voir</button>
          <button class="btn-icon danger" onclick="confirmDelete('application','${app.id}','cette candidature')">🗑</button>
        </div>
      </div>
      <div class="app-card-preview">${escapeHtml(firstAnswer.substring(0, 120))}${firstAnswer.length > 120 ? "…" : ""}</div>
    `;    list.appendChild(card);
  });
}

function viewApplication(id) {
  const app = getApplications().find(a => a.id === id);
  if (!app) return;

  const date = new Date(app.submittedAt).toLocaleString("fr-FR");
  const content = document.getElementById("modalAppContent");
  const actions = document.getElementById("modalAppActions");

  content.innerHTML = `
    <p style="color:#666;font-size:13px;margin-bottom:20px">Soumise le ${date}${app.trackingCode ? ` &nbsp;·&nbsp; <span style="color:#5865f2;font-weight:600">🔑 ${escapeHtml(app.trackingCode)}</span>` : ""}</p>
    ${(app.answers || []).map((a, i) => `
      <div class="app-answer-block">
        <div class="app-answer-q"><span class="cand-num-sm">${i + 1}</span> ${escapeHtml(a.question)}</div>
        <div class="app-answer-a">${escapeHtml(a.answer)}</div>
      </div>
    `).join("")}
  `;

  actions.innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal('modalViewApp')">Fermer</button>
    ${app.status !== "accepted" ? `<button class="btn btn-accent" onclick="setAppStatus('${app.id}','accepted')">✅ Accepter</button>` : ""}
    ${app.status !== "rejected" ? `<button class="btn btn-danger"  onclick="setAppStatus('${app.id}','rejected')">❌ Refuser</button>` : ""}
    ${app.status !== "pending"  ? `<button class="btn btn-secondary" onclick="setAppStatus('${app.id}','pending')">🔄 Remettre en attente</button>` : ""}
  `;

  openModal("modalViewApp");
}

function setAppStatus(id, status) {
  let apps = getApplications();
  apps = apps.map(a => a.id === id ? { ...a, status } : a);
  setApplications(apps);
  closeModal("modalViewApp");
  renderApplications();
  const labels = { accepted: "Candidature acceptée ✓", rejected: "Candidature refusée", pending: "Remise en attente" };
  showToast(labels[status] || "Statut mis à jour", status === "accepted" ? "success" : "error");
}

// ---- Questions ----

function renderQuestionsList() {
  const list = document.getElementById("questionsList");
  if (!list) return;

  const questions = getStaffQuestions();

  if (questions.length === 0) {
    list.innerHTML = '<div class="empty-apps">Aucune question. Ajoutez-en une.</div>';
    return;
  }

  list.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <div class="question-item-left">
        <span class="q-num">${i + 1}</span>
        <span class="q-text">${escapeHtml(q.question)}</span>
      </div>
      <div class="table-actions">
        <button class="btn-icon" onclick="editQuestion('${q.id}')">✏️</button>
        <button class="btn-icon danger" onclick="confirmDelete('question','${q.id}','cette question')">🗑</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function openAddQuestion() {
  document.getElementById("modalQuestionTitle").textContent = "Ajouter une question";
  document.getElementById("editQuestionId").value = "";
  document.getElementById("questionText").value = "";
  openModal("modalQuestion");
}

function editQuestion(id) {
  const q = getStaffQuestions().find(q => q.id === id);
  if (!q) return;
  document.getElementById("modalQuestionTitle").textContent = "Modifier la question";
  document.getElementById("editQuestionId").value = q.id;
  document.getElementById("questionText").value = q.question;
  openModal("modalQuestion");
}

function saveQuestion(e) {
  e.preventDefault();
  const id   = document.getElementById("editQuestionId").value;
  const text = document.getElementById("questionText").value.trim();
  let questions = getStaffQuestions();

  if (id) {
    questions = questions.map(q => q.id === id ? { ...q, question: text } : q);
    showToast("Question modifiée ✓", "success");
  } else {
    questions.push({ id: generateId("q"), question: text });
    showToast("Question ajoutée ✓", "success");
  }

  setStaffQuestions(questions);
  closeModal("modalQuestion");
  renderQuestionsList();
}

// ---- Paramètres recrutement ----

function loadRecruitSettings() {
  const s = getSettings();
  const toggle = document.getElementById("settingRecruitOpen");
  const label  = document.getElementById("recruitOpenLabel");
  if (toggle) {
    toggle.checked = s.staffRecruitmentOpen === true;
    if (label) label.textContent = toggle.checked ? "Ouvert" : "Fermé";
    toggle.addEventListener("change", () => {
      label.textContent = toggle.checked ? "Ouvert" : "Fermé";
    });
  }
  const bt = document.getElementById("settingBannerTitle");
  const bd = document.getElementById("settingBannerDesc");
  const si = document.getElementById("settingStaffIntro");
  if (bt) bt.value = s.staffBannerTitle || "";
  if (bd) bd.value = s.staffBannerDesc  || "";
  if (si) si.value = s.staffIntro       || "";
}

function saveRecruitSettings() {
  if (!requireSuperAdmin()) return;
  const s = getSettings();
  s.staffRecruitmentOpen = document.getElementById("settingRecruitOpen").checked;
  s.staffBannerTitle     = document.getElementById("settingBannerTitle").value.trim();
  s.staffBannerDesc      = document.getElementById("settingBannerDesc").value.trim();
  s.staffIntro           = document.getElementById("settingStaffIntro").value.trim();
  setSettings(s);
  showToast("Paramètres recrutement sauvegardés ✓", "success");
}

// ============================================================
//  NOUVEAUX ONGLETS — switchTab étendu
// ============================================================

// Patch switchTab pour les nouveaux onglets
const _origSwitchTab = switchTab;
// On redéfinit switchTab plus bas — voir version complète ci-dessous

// ============================================================
//  ÉQUIPE STAFF
// ============================================================

function renderStaffMembersTable() {
  const tbody = document.getElementById("staffMembersTableBody");
  if (!tbody) return;
  const members = getStaffMembers().sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = "";
  if (members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#555;padding:24px">Aucun membre</td></tr>';
    return;
  }
  members.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.avatar ? `<img src="${escapeHtml(m.avatar)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'" />` : "—"}</td>
      <td>${escapeHtml(m.pseudo)}</td>
      <td>${escapeHtml(m.role)}</td>
      <td class="desc-cell">${escapeHtml(m.description || "")}</td>
      <td>${m.order || 0}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editStaffMember('${m.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('staffmember','${m.id}','le membre « ${escapeHtml(m.pseudo)} »')">🗑</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editStaffMember(id) {
  const m = getStaffMembers().find(x => x.id === id);
  if (!m) return;
  document.getElementById("modalStaffMemberTitle").textContent = "Modifier le membre";
  document.getElementById("editStaffMemberId").value = m.id;
  document.getElementById("smPseudo").value  = m.pseudo || "";
  document.getElementById("smRole").value    = m.role   || "";
  document.getElementById("smAvatar").value  = m.avatar || "";
  document.getElementById("smDesc").value    = m.description || "";
  document.getElementById("smOrder").value   = m.order  || 0;
  openModal("modalStaffMember");
}

function saveStaffMember(e) {
  e.preventDefault();
  const id = document.getElementById("editStaffMemberId").value;
  const data = {
    pseudo:      document.getElementById("smPseudo").value.trim(),
    role:        document.getElementById("smRole").value.trim(),
    avatar:      document.getElementById("smAvatar").value.trim(),
    description: document.getElementById("smDesc").value.trim(),
    order:       parseInt(document.getElementById("smOrder").value) || 0
  };
  let members = getStaffMembers();
  if (id) {
    members = members.map(m => m.id === id ? { ...m, ...data } : m);
    logAction(currentAdmin?.username, "Membre staff modifié", data.pseudo);
    showToast("Membre modifié ✓", "success");
  } else {
    members.push({ id: generateId("sm"), ...data });
    logAction(currentAdmin?.username, "Membre staff ajouté", data.pseudo);
    showToast("Membre ajouté ✓", "success");
  }
  setStaffMembers(members);
  closeModal("modalStaffMember");
  document.getElementById("editStaffMemberId").value = "";
  document.getElementById("modalStaffMemberTitle").textContent = "Ajouter un membre staff";
  renderStaffMembersTable();
}

// ============================================================
//  SANCTIONS
// ============================================================

function renderSanctionsTable() {
  const tbody = document.getElementById("sanctionsTableBody");
  if (!tbody) return;
  const sanctions = getSanctions();
  const sevLabel = { low: "Faible", medium: "Moyen", high: "Élevé", critical: "Critique" };
  tbody.innerHTML = "";
  if (sanctions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#555;padding:24px">Aucune sanction</td></tr>';
    return;
  }
  sanctions.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(s.infraction)}</td>
      <td>${escapeHtml(s.sanction)}</td>
      <td><span class="sev-badge sev-${s.severity}">${sevLabel[s.severity] || s.severity}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editSanction('${s.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('sanction','${s.id}','la sanction « ${escapeHtml(s.infraction)} »')">🗑</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editSanction(id) {
  const s = getSanctions().find(x => x.id === id);
  if (!s) return;
  document.getElementById("modalSanctionTitle").textContent = "Modifier la sanction";
  document.getElementById("editSanctionId").value       = s.id;
  document.getElementById("sanctionInfraction").value   = s.infraction;
  document.getElementById("sanctionResult").value       = s.sanction;
  document.getElementById("sanctionSeverity").value     = s.severity;
  openModal("modalSanction");
}

function saveSanction(e) {
  e.preventDefault();
  const id = document.getElementById("editSanctionId").value;
  const data = {
    infraction: document.getElementById("sanctionInfraction").value.trim(),
    sanction:   document.getElementById("sanctionResult").value.trim(),
    severity:   document.getElementById("sanctionSeverity").value
  };
  let sanctions = getSanctions();
  if (id) {
    sanctions = sanctions.map(s => s.id === id ? { ...s, ...data } : s);
    logAction(currentAdmin?.username, "Sanction modifiée", data.infraction);
    showToast("Sanction modifiée ✓", "success");
  } else {
    sanctions.push({ id: generateId("san"), ...data });
    logAction(currentAdmin?.username, "Sanction ajoutée", data.infraction);
    showToast("Sanction ajoutée ✓", "success");
  }
  setSanctions(sanctions);
  closeModal("modalSanction");
  document.getElementById("editSanctionId").value = "";
  document.getElementById("modalSanctionTitle").textContent = "Ajouter une sanction";
  renderSanctionsTable();
}

// ============================================================
//  FAQ
// ============================================================

function renderFaqTable() {
  const tbody = document.getElementById("faqTableBody");
  if (!tbody) return;
  const items = getFaq().sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = "";
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#555;padding:24px">Aucune question</td></tr>';
    return;
  }
  items.forEach((f, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(f.question)}</td>
      <td class="desc-cell">${escapeHtml(f.answer)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editFaqItem('${f.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('faq','${f.id}','la question FAQ')">🗑</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editFaqItem(id) {
  const f = getFaq().find(x => x.id === id);
  if (!f) return;
  document.getElementById("modalFaqTitle").textContent = "Modifier la question";
  document.getElementById("editFaqId").value    = f.id;
  document.getElementById("faqQuestion").value  = f.question;
  document.getElementById("faqAnswer").value    = f.answer;
  document.getElementById("faqOrder").value     = f.order || 0;
  openModal("modalFaq");
}

function saveFaqItem(e) {
  e.preventDefault();
  const id = document.getElementById("editFaqId").value;
  const data = {
    question: document.getElementById("faqQuestion").value.trim(),
    answer:   document.getElementById("faqAnswer").value.trim(),
    order:    parseInt(document.getElementById("faqOrder").value) || 0
  };
  let items = getFaq();
  if (id) {
    items = items.map(f => f.id === id ? { ...f, ...data } : f);
    logAction(currentAdmin?.username, "FAQ modifiée", data.question);
    showToast("Question modifiée ✓", "success");
  } else {
    items.push({ id: generateId("faq"), ...data });
    logAction(currentAdmin?.username, "FAQ ajoutée", data.question);
    showToast("Question ajoutée ✓", "success");
  }
  setFaq(items);
  closeModal("modalFaq");
  document.getElementById("editFaqId").value = "";
  document.getElementById("modalFaqTitle").textContent = "Ajouter une question FAQ";
  renderFaqTable();
}

// ============================================================
//  CHANGELOG
// ============================================================

function renderChangelogTable() {
  const tbody = document.getElementById("changelogTableBody");
  if (!tbody) return;
  const entries = getChangelog().sort((a, b) => new Date(b.date) - new Date(a.date));
  const typeLabel = { major: "Majeure", minor: "Mineure", patch: "Correctif", hotfix: "Hotfix" };
  tbody.innerHTML = "";
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#555;padding:24px">Aucune entrée</td></tr>';
    return;
  }
  entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span style="font-family:monospace;color:var(--accent)">v${escapeHtml(e.version)}</span></td>
      <td>${escapeHtml(e.date)}</td>
      <td>${escapeHtml(e.title)}</td>
      <td><span class="cl-type cl-${e.type}">${typeLabel[e.type] || e.type}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editChangelogEntry('${e.id}')">✏️ Modifier</button>
          <button class="btn-icon danger" onclick="confirmDelete('changelog','${e.id}','l\'entrée v${escapeHtml(e.version)}')">🗑</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editChangelogEntry(id) {
  const e = getChangelog().find(x => x.id === id);
  if (!e) return;
  document.getElementById("modalChangelogTitle").textContent = "Modifier l'entrée";
  document.getElementById("editChangelogId").value = e.id;
  document.getElementById("clVersion").value       = e.version;
  document.getElementById("clDate").value          = e.date;
  document.getElementById("clTitle").value         = e.title;
  document.getElementById("clType").value          = e.type;
  document.getElementById("clContent").value       = e.content;
  openModal("modalChangelog");
}

function saveChangelogEntry(e) {
  e.preventDefault();
  const id = document.getElementById("editChangelogId").value;
  const data = {
    version: document.getElementById("clVersion").value.trim(),
    date:    document.getElementById("clDate").value,
    title:   document.getElementById("clTitle").value.trim(),
    type:    document.getElementById("clType").value,
    content: document.getElementById("clContent").value.trim()
  };
  let entries = getChangelog();
  if (id) {
    entries = entries.map(x => x.id === id ? { ...x, ...data } : x);
    logAction(currentAdmin?.username, "Changelog modifié", `v${data.version}`);
    showToast("Entrée modifiée ✓", "success");
  } else {
    entries.push({ id: generateId("cl"), ...data });
    logAction(currentAdmin?.username, "Changelog ajouté", `v${data.version}`);
    showToast("Entrée ajoutée ✓", "success");
  }
  setChangelog(entries);
  closeModal("modalChangelog");
  document.getElementById("editChangelogId").value = "";
  document.getElementById("modalChangelogTitle").textContent = "Ajouter une entrée";
  renderChangelogTable();
}

// ============================================================
//  HISTORIQUE DES ACTIONS
// ============================================================

function renderActionLog() {
  const tbody = document.getElementById("actionLogTableBody");
  if (!tbody) return;
  const logs = getActionLog();
  tbody.innerHTML = "";
  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#555;padding:24px">Aucune action enregistrée</td></tr>';
    return;
  }
  logs.forEach(l => {
    const date = new Date(l.at).toLocaleString("fr-FR");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-size:12px;color:#666;white-space:nowrap">${date}</td>
      <td><strong style="color:var(--accent)">${escapeHtml(l.admin)}</strong></td>
      <td>${escapeHtml(l.action)}</td>
      <td class="desc-cell" style="color:#888">${escapeHtml(l.detail)}</td>`;
    tbody.appendChild(tr);
  });
}

function clearActionLog() {
  if (!requireSuperAdmin()) return;
  setActionLog([]);
  renderActionLog();
  showToast("Historique vidé ✓", "success");
}

// ============================================================
//  TOAST
// ============================================================

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("show")));
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 2800);
}

// ============================================================
//  UTILS
// ============================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}
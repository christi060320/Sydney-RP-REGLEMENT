// ============================================================
//  PAGES.JS — Logique des pages publiques secondaires
//  (staff.html, sanctions.html, faq.html, changelog.html)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  applyCommonSettings();
  const page = detectPage();
  if (page === "staff")     renderStaffPage();
  if (page === "sanctions") renderSanctionsPage();
  if (page === "faq")       renderFaqPage();
  if (page === "changelog") renderChangelogPage();
});

function detectPage() {
  const path = window.location.pathname;
  if (path.includes("staff"))     return "staff";
  if (path.includes("sanctions")) return "sanctions";
  if (path.includes("faq"))       return "faq";
  if (path.includes("changelog")) return "changelog";
  return "";
}

function applyCommonSettings() {
  const s = getSettings();
  const headerName = document.getElementById("serverNameHeader");
  const footerText = document.getElementById("footerText");
  if (headerName) headerName.textContent = s.serverName;
  if (footerText) footerText.textContent = s.footer;
  if (s.logoUrl) document.querySelectorAll(".header-logo").forEach(img => img.src = s.logoUrl);

  // Bannière hero
  const hero = document.querySelector(".hero-page");
  if (hero && s.bannerImg) {
    hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.55)), url('${s.bannerImg}')`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  }

  const discordBtn = document.getElementById("navDiscordLink");
  if (discordBtn && s.discordUrl) {
    discordBtn.href = s.discordUrl;
    discordBtn.style.display = "inline-flex";
  }

  // Thème
  applyTheme(s.theme);
}

// ============================================================
//  STAFF
// ============================================================

function renderStaffPage() {
  const s = getSettings();
  document.title = "Équipe Staff — " + s.serverName;
  const grid = document.getElementById("staffGrid");
  if (!grid) return;
  const members = getStaffMembers().sort((a, b) => (a.order || 0) - (b.order || 0));

  if (members.length === 0) {
    grid.innerHTML = '<p class="empty-msg">Aucun membre staff affiché pour le moment.</p>';
    return;
  }

  grid.innerHTML = members.map(m => `
    <div class="staff-card animate-in">
      <div class="staff-avatar">
        ${m.avatar
          ? `<img src="${escapeHtml(m.avatar)}" alt="${escapeHtml(m.pseudo)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="staff-avatar-fallback" style="display:none">${escapeHtml(m.pseudo.charAt(0).toUpperCase())}</span>`
          : `<span class="staff-avatar-fallback">${escapeHtml(m.pseudo.charAt(0).toUpperCase())}</span>`
        }
      </div>
      <div class="staff-info">
        <div class="staff-pseudo">${escapeHtml(m.pseudo)}</div>
        <div class="staff-role">${escapeHtml(m.role)}</div>
        ${m.description ? `<p class="staff-desc">${escapeHtml(m.description)}</p>` : ""}
      </div>
    </div>
  `).join("");
}

// ============================================================
//  SANCTIONS
// ============================================================

function renderSanctionsPage() {
  const s = getSettings();
  document.title = "Sanctions — " + s.serverName;
  const list = document.getElementById("sanctionsList");
  if (!list) return;
  const sanctions = getSanctions();

  if (sanctions.length === 0) {
    list.innerHTML = '<p class="empty-msg">Aucune sanction définie pour le moment.</p>';
    return;
  }

  const sevLabel = { low: "Faible", medium: "Moyen", high: "Élevé", critical: "Critique" };

  list.innerHTML = sanctions.map((s, i) => `
    <div class="sanction-card animate-in sev-border-${s.severity}">
      <div class="sanction-num">${i + 1}</div>
      <div class="sanction-body">
        <div class="sanction-infraction">${escapeHtml(s.infraction)}</div>
        <div class="sanction-result">🔨 ${escapeHtml(s.sanction)}</div>
      </div>
      <span class="sev-badge sev-${s.severity}">${sevLabel[s.severity] || s.severity}</span>
    </div>
  `).join("");
}

// ============================================================
//  FAQ
// ============================================================

let allFaq = [];

function renderFaqPage() {
  const s = getSettings();
  document.title = "FAQ — " + s.serverName;
  allFaq = getFaq().sort((a, b) => (a.order || 0) - (b.order || 0));
  renderFaqItems(allFaq);
}

function renderFaqItems(items) {
  const list = document.getElementById("faqList");
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = '<p class="empty-msg">Aucune question pour le moment.</p>';
    return;
  }

  list.innerHTML = items.map((f, i) => `
    <div class="faq-item animate-in" onclick="toggleFaq(this)">
      <div class="faq-question">
        <span>${escapeHtml(f.question)}</span>
        <span class="faq-chevron">▼</span>
      </div>
      <div class="faq-answer">${escapeHtml(f.answer)}</div>
    </div>
  `).join("");
}

function toggleFaq(el) {
  el.classList.toggle("open");
}

function filterFaq() {
  const q = document.getElementById("faqSearch").value.toLowerCase();
  const filtered = allFaq.filter(f =>
    f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
  );
  renderFaqItems(filtered);
}

// ============================================================
//  CHANGELOG
// ============================================================

function renderChangelogPage() {
  const s = getSettings();
  document.title = "Changelog — " + s.serverName;
  const list = document.getElementById("changelogList");
  if (!list) return;
  const entries = getChangelog().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (entries.length === 0) {
    list.innerHTML = '<p class="empty-msg">Aucune mise à jour pour le moment.</p>';
    return;
  }

  const typeLabel = { major: "Majeure", minor: "Mineure", patch: "Correctif", hotfix: "Hotfix" };
  const typeCls   = { major: "cl-major", minor: "cl-minor", patch: "cl-patch", hotfix: "cl-hotfix" };

  list.innerHTML = entries.map(e => {
    const d = new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    return `
      <div class="cl-entry animate-in">
        <div class="cl-meta">
          <span class="cl-version">v${escapeHtml(e.version)}</span>
          <span class="cl-type ${typeCls[e.type] || ''}">${typeLabel[e.type] || e.type}</span>
          <span class="cl-date">📅 ${d}</span>
        </div>
        <h3 class="cl-title">${escapeHtml(e.title)}</h3>
        <p class="cl-content">${escapeHtml(e.content)}</p>
      </div>
    `;
  }).join("");
}

// ============================================================
//  THÈME
// ============================================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
}

// ============================================================
//  UTILS
// ============================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

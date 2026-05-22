// ============================================================
//  APP.JS — Page d'accueil (index.html)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  renderCategoryCards();
  renderRecruitBanner();
  initThemeToggle();
});

// ============================================================
//  PARAMÈTRES
// ============================================================

function applySettings() {
  const s = getSettings();
  document.title = s.serverName + " — Règlements";

  const headerName = document.getElementById("serverNameHeader");
  const heroTitle  = document.getElementById("heroTitle");
  const heroSub    = document.getElementById("heroSubtitle");
  const footerText = document.getElementById("footerText");

  if (headerName) headerName.textContent = s.serverName;
  if (heroTitle)  heroTitle.textContent  = "Règlements — " + s.serverName;
  if (heroSub)    heroSub.textContent    = s.subtitle;
  if (footerText) footerText.textContent = s.footer;

  if (s.logoUrl) document.querySelectorAll(".header-logo, .hero-logo").forEach(img => img.src = s.logoUrl);

  // Bannière hero
  const hero = document.querySelector(".hero");
  if (hero && s.bannerImg) {
    hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%), url('${s.bannerImg}')`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
    hero.style.backgroundRepeat = "no-repeat";
  }

  // Discord
  const discordBtn = document.getElementById("navDiscordLink");
  if (discordBtn) {
    if (s.discordUrl) { discordBtn.href = s.discordUrl; discordBtn.style.display = "inline-flex"; }
    else discordBtn.style.display = "none";
  }

  // Couleur d'accentuation
  if (s.accentColor) document.documentElement.style.setProperty("--accent", s.accentColor);

  // Thème
  applyTheme(s.theme);
}

// ============================================================
//  THÈME
// ============================================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "light" ? "🌙" : "☀️";
}

function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const s = getSettings();
  applyTheme(s.theme);
  btn.addEventListener("click", () => {
    const s = getSettings();
    s.theme = s.theme === "light" ? "dark" : "light";
    setSettings(s);
    applyTheme(s.theme);
  });
}

// ============================================================
//  CARTES CATÉGORIES
// ============================================================

function renderCategoryCards() {
  const container = document.getElementById("categoriesContainer");
  if (!container) return;

  const categories = getCategories();
  const rules      = getRules();

  container.innerHTML = "";

  if (categories.length === 0) {
    container.innerHTML = '<p class="empty-msg">Aucune catégorie disponible pour le moment.</p>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "cards-grid";

  categories.forEach((cat, i) => {
    const count = rules.filter(r => r.categoryId === cat.id).length;
    const card  = document.createElement("a");
    card.className = "cat-card animate-in";
    card.style.animationDelay = (i * 0.07) + "s";
    card.href = "reglement.html?cat=" + encodeURIComponent(cat.id);
    card.style.setProperty("--cat-color", cat.color);

    card.innerHTML = `
      <div class="cat-card-icon">${escapeHtml(cat.icon)}</div>
      <div class="cat-card-body">
        <h2 class="cat-card-title">${escapeHtml(cat.name)}</h2>
        ${cat.description ? `<p class="cat-card-desc">${escapeHtml(cat.description)}</p>` : ""}
        <span class="cat-card-count">${count} règle${count !== 1 ? "s" : ""}</span>
      </div>
      <div class="cat-card-arrow">→</div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ============================================================
//  RECHERCHE GLOBALE
// ============================================================

function handleSearch() {
  const q = document.getElementById("globalSearch").value.trim().toLowerCase();
  const resultsEl = document.getElementById("searchResults");
  const clearBtn  = document.getElementById("clearSearch");
  const container = document.getElementById("categoriesContainer");

  if (!q) {
    resultsEl.classList.add("hidden");
    clearBtn.classList.add("hidden");
    container.style.display = "";
    return;
  }

  clearBtn.classList.remove("hidden");
  container.style.display = "none";

  const rules      = getRules();
  const categories = getCategories();
  const matches    = rules.filter(r =>
    r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = '<p class="search-empty">Aucun résultat pour "<strong>' + escapeHtml(q) + '</strong>"</p>';
  } else {
    resultsEl.innerHTML = `
      <p class="search-count">${matches.length} résultat${matches.length > 1 ? "s" : ""} pour "<strong>${escapeHtml(q)}</strong>"</p>
      <div class="rules-list search-rules-list" style="--cat-color:#5865f2">
        ${matches.map((rule, i) => {
          const cat = categories.find(c => c.id === rule.categoryId);
          return `
            <div class="rule-card animate-in" style="--cat-color:${cat ? cat.color : "#5865f2"}">
              <div class="rule-number">${i + 1}</div>
              <div class="rule-content">
                ${cat ? `<div class="rule-cat-tag" style="color:${cat.color}">${escapeHtml(cat.icon)} ${escapeHtml(cat.name)}</div>` : ""}
                <h3 class="rule-title">${highlight(escapeHtml(rule.title), q)}</h3>
                <p class="rule-desc">${highlight(escapeHtml(rule.description), q)}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  resultsEl.classList.remove("hidden");
}

function clearSearch() {
  document.getElementById("globalSearch").value = "";
  handleSearch();
}

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  return text.replace(re, '<mark>$1</mark>');
}

// ============================================================
//  BANNIÈRE RECRUTEMENT
// ============================================================

function renderRecruitBanner() {
  const banner = document.getElementById("recruitBanner");
  if (!banner) return;
  const s = getSettings();
  if (s.staffRecruitmentOpen === true) {
    banner.style.display = "";
    const t = document.getElementById("recruitTitle");
    const d = document.getElementById("recruitDesc");
    if (t && s.staffBannerTitle) t.textContent = s.staffBannerTitle;
    if (d && s.staffBannerDesc)  d.textContent = s.staffBannerDesc;
  } else {
    banner.style.display = "none";
  }
}

// ============================================================
//  UTILS
// ============================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

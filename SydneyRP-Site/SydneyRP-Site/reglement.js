// ============================================================
//  REGLEMENT.JS — Page d'un règlement (reglement.html)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  renderRules();
});

function applySettings() {
  const s = getSettings();

  const headerName = document.getElementById("serverNameHeader");
  const footerText = document.getElementById("footerText");

  if (headerName) headerName.textContent = s.serverName;
  if (footerText) footerText.textContent = s.footer;

  if (s.logoUrl) {
    document.querySelectorAll(".header-logo").forEach(img => img.src = s.logoUrl);
  }

  const discordBtn = document.getElementById("navDiscordLink");
  if (discordBtn) {
    if (s.discordUrl) {
      discordBtn.href = s.discordUrl;
      discordBtn.style.display = "inline-flex";
    } else {
      discordBtn.style.display = "none";
    }
  }
}

function renderRules() {
  const container = document.getElementById("rulesContainer");
  if (!container) return;

  // Récupérer l'ID de catégorie depuis l'URL (?cat=xxx)
  const params = new URLSearchParams(window.location.search);
  const catId  = params.get("cat");

  const categories = getCategories();
  const cat = categories.find(c => c.id === catId);

  if (!cat) {
    container.innerHTML = `
      <div class="not-found">
        <p>Catégorie introuvable.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:16px">← Retour à l'accueil</a>
      </div>
    `;
    return;
  }

  // Titre de la page
  document.title = cat.name + " — Règlement";

  const rules = getRules().filter(r => r.categoryId === cat.id);

  container.style.setProperty("--cat-color", cat.color);

  container.innerHTML = `
    <div class="rules-page-header">
      <a href="index.html" class="back-btn">← Retour</a>
      <div class="rules-page-title-area">
        <span class="rules-page-icon">${escapeHtml(cat.icon)}</span>
        <div>
          <h1 class="rules-page-title" style="color:${cat.color}">${escapeHtml(cat.name)}</h1>
          ${cat.description ? `<p class="rules-page-desc">${escapeHtml(cat.description)}</p>` : ""}
        </div>
      </div>
      <div class="rules-page-count">${rules.length} règle${rules.length !== 1 ? "s" : ""}</div>
    </div>

    <div class="rules-list">
      ${rules.length === 0
        ? '<p class="no-rules">Aucune règle dans cette catégorie pour le moment.</p>'
        : rules.map((rule, i) => `
          <div class="rule-card">
            <div class="rule-number">${i + 1}</div>
            <div class="rule-content">
              <h3 class="rule-title">${escapeHtml(rule.title)}</h3>
              <p class="rule-desc">${escapeHtml(rule.description)}</p>
            </div>
          </div>
        `).join("")
      }
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

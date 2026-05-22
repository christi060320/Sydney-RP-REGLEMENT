// ============================================================
//  CANDIDATURE.JS — Page publique de candidature staff
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  checkAndRender();
});

function applySettings() {
  const s = getSettings();
  document.title = "Candidature Staff — " + s.serverName;

  const headerName = document.getElementById("serverNameHeader");
  const heroTitle  = document.getElementById("heroTitle");
  const heroSub    = document.getElementById("heroSubtitle");
  const footerText = document.getElementById("footerText");

  if (headerName) headerName.textContent = s.serverName;
  if (heroTitle)  heroTitle.textContent  = "Rejoindre le Staff — " + s.serverName;
  if (heroSub && s.staffIntro) heroSub.textContent = s.staffIntro;
  if (footerText) footerText.textContent = s.footer;

  if (s.logoUrl) {
    document.querySelectorAll(".header-logo").forEach(img => img.src = s.logoUrl);
  }

  // Bannière hero staff
  const hero = document.querySelector(".hero-staff");
  if (hero && s.bannerImg) {
    hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%), url('${s.bannerImg}')`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
    hero.style.backgroundRepeat = "no-repeat";
  }

  const discordBtn = document.getElementById("navDiscordLink");
  if (discordBtn && s.discordUrl) {
    discordBtn.href = s.discordUrl;
    discordBtn.style.display = "inline-flex";
  }
}

function checkAndRender() {
  const s = getSettings();

  if (s.staffRecruitmentOpen === false) {
    document.getElementById("stateForm").classList.add("hidden");
    document.getElementById("stateClosed").classList.remove("hidden");
    document.getElementById("stateCheck").style.display = "";
    return;
  }

  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  const questions = getStaffQuestions();

  container.innerHTML = "";

  if (questions.length === 0) {
    container.innerHTML = '<p style="color:#888;text-align:center;padding:24px">Aucune question configurée.</p>';
    return;
  }

  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "cand-question";
    div.innerHTML = `
      <label class="cand-label">
        <span class="cand-num">${i + 1}</span>
        ${escapeHtml(q.question)}
        <span class="cand-required">*</span>
      </label>
      <textarea
        id="q_${q.id}"
        class="cand-textarea"
        placeholder="Ta réponse..."
        rows="3"
        required
      ></textarea>
    `;
    container.appendChild(div);
  });
}

function submitApplication(e) {
  e.preventDefault();
  const questions = getStaffQuestions();
  const answers   = [];

  questions.forEach(q => {
    const el = document.getElementById("q_" + q.id);
    answers.push({
      questionId: q.id,
      question:   q.question,
      answer:     el ? el.value.trim() : ""
    });
  });

  // Générer un code de suivi lisible
  const trackingCode = generateTrackingCode();

  const application = {
    id:           generateId("app"),
    trackingCode: trackingCode,
    submittedAt:  new Date().toISOString(),
    status:       "pending",
    answers
  };

  const apps = getApplications();
  apps.push(application);
  setApplications(apps);

  // Afficher le succès avec le code
  document.getElementById("stateForm").classList.add("hidden");
  document.getElementById("stateCheck").style.display = "none";
  document.getElementById("displayTrackingCode").textContent = trackingCode;
  document.getElementById("stateSuccess").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
//  SUIVI DE CANDIDATURE
// ============================================================

function checkStatus() {
  const code   = document.getElementById("trackingCodeInput").value.trim().toUpperCase();
  const result = document.getElementById("trackingResult");

  if (!code) {
    result.innerHTML = '<p class="track-error">Entre ton code de suivi.</p>';
    return;
  }

  const apps = getApplications();
  const app  = apps.find(a => a.trackingCode && a.trackingCode.toUpperCase() === code);

  if (!app) {
    result.innerHTML = '<p class="track-error">❌ Code introuvable. Vérifie que tu as bien copié ton code.</p>';
    return;
  }

  const statusConfig = {
    pending:  {
      icon:  "⏳",
      label: "En attente",
      cls:   "track-pending",
      msg:   "Ta candidature a bien été reçue et est en cours d'examen par l'équipe staff. Merci de patienter !"
    },
    accepted: {
      icon:  "✅",
      label: "Acceptée",
      cls:   "track-accepted",
      msg:   "Félicitations ! Ta candidature a été acceptée. L'équipe staff va te contacter prochainement."
    },
    rejected: {
      icon:  "❌",
      label: "Refusée",
      cls:   "track-rejected",
      msg:   "Ta candidature n'a pas été retenue cette fois-ci. N'hésite pas à repostuler plus tard !"
    }
  };

  const cfg  = statusConfig[app.status] || statusConfig.pending;
  const date = new Date(app.submittedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  result.innerHTML = `
    <div class="track-result-card ${cfg.cls}">
      <div class="track-result-icon">${cfg.icon}</div>
      <div>
        <div class="track-result-status">${cfg.label}</div>
        <div class="track-result-date">Soumise le ${date}</div>
        <p class="track-result-msg">${cfg.msg}</p>
      </div>
    </div>
  `;
}

// Permettre la touche Entrée dans le champ code
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("trackingCodeInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); checkStatus(); }
    });
  }
});

// ============================================================
//  UTILS
// ============================================================

function generateTrackingCode() {
  // Format : APP-XXXXXXXX (8 caractères alphanumériques majuscules)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "APP-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

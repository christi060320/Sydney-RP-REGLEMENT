// ============================================================
//  DATA.JS — Données par défaut et gestion du localStorage
// ============================================================

const DEFAULT_SETTINGS = {
  serverName: "Mon Serveur",
  subtitle: "Bienvenue ! Veuillez lire attentivement tous les règlements avant de jouer.",
  footer: "© 2026 Mon Serveur — Tous droits réservés",
  logoUrl: "assets/logo.svg",
  discordUrl: "",
  bannerImg: "",
  accentColor: "#5865f2",
  theme: "dark"
};

const DEFAULT_CATEGORIES = [
  { id: "cat-staff",   name: "Règlement Staff",   icon: "👥", color: "#5865f2", description: "Règles applicables aux membres du staff du serveur." },
  { id: "cat-legal",   name: "Règlement Légal",   icon: "⚖️", color: "#57f287", description: "Activités autorisées et encadrées par la loi du serveur." },
  { id: "cat-illegal", name: "Règlement Illégal", icon: "🚫", color: "#ed4245", description: "Activités interdites pouvant entraîner des sanctions." },
  { id: "cat-discord", name: "Règlement Discord", icon: "💬", color: "#fee75c", description: "Règles de conduite sur le serveur Discord officiel." }
];

const DEFAULT_RULES = [
  { id: "r1",  categoryId: "cat-staff",   title: "Respect de la hiérarchie",  description: "Tout membre du staff doit respecter les décisions prises par les membres de rang supérieur. Les désaccords se règlent en privé, jamais en public." },
  { id: "r5",  categoryId: "cat-legal",   title: "Commerce autorisé",          description: "La vente et l'achat de biens légaux entre joueurs est autorisée. Tout commerce doit respecter les prix du marché officiel." },
  { id: "r10", categoryId: "cat-illegal", title: "Meurtre et violence",        description: "Les actes de violence doivent avoir une justification RP valable. Le RDM (Random Death Match) est strictement interdit." },
  { id: "r11", categoryId: "cat-discord", title: "Respect mutuel",             description: "Tout membre doit faire preuve de respect envers les autres. Les insultes, harcèlements et discriminations sont interdits." },
];

const DEFAULT_ADMINS = [
  { id: "admin-1", username: "admin", password: "admin1234", role: "superadmin" }
];

// ---- Staff membres ----
const DEFAULT_STAFF_MEMBERS = [
  { id: "sm-1", pseudo: "Admin", role: "Fondateur", avatar: "", description: "Fondateur du serveur.", order: 0 }
];

// ---- Sanctions ----
const DEFAULT_SANCTIONS = [
  { id: "san-1", infraction: "RDM (Random Death Match)", sanction: "Kick + Avertissement", severity: "medium" },
  { id: "san-2", infraction: "Insultes / Harcèlement",   sanction: "Ban temporaire 24h",   severity: "high" },
  { id: "san-3", infraction: "Triche / Hack",            sanction: "Ban définitif",         severity: "critical" },
  { id: "san-4", infraction: "Spam vocal / textuel",     sanction: "Mute 1h",               severity: "low" },
  { id: "san-5", infraction: "Publicité non autorisée",  sanction: "Kick + Avertissement",  severity: "medium" }
];

// ---- FAQ ----
const DEFAULT_FAQ = [
  { id: "faq-1", question: "Comment rejoindre le serveur ?",       answer: "Rejoins notre Discord et suis les instructions dans le salon #rejoindre.",  order: 0 },
  { id: "faq-2", question: "Comment faire une demande de staff ?", answer: "Rends-toi sur la page Recrutement et remplis le formulaire de candidature.", order: 1 },
  { id: "faq-3", question: "Comment signaler un joueur ?",         answer: "Ouvre un ticket sur notre Discord en mentionnant les preuves nécessaires.",  order: 2 }
];

// ---- Changelog ----
const DEFAULT_CHANGELOG = [
  { id: "cl-1", version: "1.0.0", date: "2026-05-20", title: "Lancement du serveur", content: "Ouverture officielle du serveur. Bienvenue à tous !", type: "major" }
];

// ---- Candidatures recrutement ----
const DEFAULT_STAFF_QUESTIONS = [
  { id: "q1", question: "Quel est ton pseudo en jeu ?" },
  { id: "q2", question: "Quel est ton âge ?" },
  { id: "q3", question: "Depuis combien de temps joues-tu sur le serveur ?" },
  { id: "q4", question: "Pourquoi veux-tu rejoindre le staff ?" },
  { id: "q5", question: "Quelle est ta disponibilité par semaine (en heures) ?" },
  { id: "q6", question: "As-tu déjà été staff sur un autre serveur ? Si oui, lequel et quel rôle ?" },
  { id: "q7", question: "Comment gèrerais-tu un conflit entre deux joueurs ?" }
];

// ---- Helpers ----

function getData(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch { return defaultValue; }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCategories()    { return getData("categories",    DEFAULT_CATEGORIES); }
function setCategories(v)   { setData("categories", v); }

function getRules()         { return getData("rules",         DEFAULT_RULES); }
function setRules(v)        { setData("rules", v); }

function getAdmins()        { return getData("admins",        DEFAULT_ADMINS); }
function setAdmins(v)       { setData("admins", v); }

function getSettings()      { return getData("settings",      DEFAULT_SETTINGS); }
function setSettings(v)     { setData("settings", v); }

function getStaffMembers()  { return getData("staffMembers",  DEFAULT_STAFF_MEMBERS); }
function setStaffMembers(v) { setData("staffMembers", v); }

function getSanctions()     { return getData("sanctions",     DEFAULT_SANCTIONS); }
function setSanctions(v)    { setData("sanctions", v); }

function getFaq()           { return getData("faq",           DEFAULT_FAQ); }
function setFaq(v)          { setData("faq", v); }

function getChangelog()     { return getData("changelog",     DEFAULT_CHANGELOG); }
function setChangelog(v)    { setData("changelog", v); }

function getStaffQuestions()   { return getData("staffQuestions",  DEFAULT_STAFF_QUESTIONS); }
function setStaffQuestions(v)  { setData("staffQuestions", v); }

function getApplications()     { return getData("applications",    []); }
function setApplications(v)    { setData("applications", v); }

// ---- Historique des actions admin ----
function getActionLog()        { return getData("actionLog", []); }
function setActionLog(v)       { setData("actionLog", v); }

function logAction(admin, action, detail) {
  const log = getActionLog();
  log.unshift({
    id: generateId("log"),
    admin: admin || "?",
    action,
    detail: detail || "",
    at: new Date().toISOString()
  });
  // Garder max 200 entrées
  if (log.length > 200) log.splice(200);
  setActionLog(log);
}

function generateId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
}

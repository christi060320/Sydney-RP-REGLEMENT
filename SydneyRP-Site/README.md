# Site de Règlements — Guide de démarrage

## Structure des fichiers

```
index.html    → Page publique (règlements visibles par tous)
admin.html    → Panneau d'administration (protégé par login)
style.css     → Styles de la page publique
admin.css     → Styles du panneau admin
app.js        → Logique de la page publique
admin.js      → Logique du panneau admin
data.js       → Données et localStorage
assets/
  logo.png    → Logo de votre serveur (à remplacer)
```

## Comment démarrer

### Option 1 — Ouvrir directement (le plus simple)
Double-cliquez sur `index.html` dans votre explorateur de fichiers.
Le site s'ouvre dans votre navigateur sans rien installer.

### Option 2 — Avec un serveur local (recommandé)
Si vous avez Node.js installé :
```bash
npx serve .
```
Puis ouvrez http://localhost:3000

Ou avec Python :
```bash
python -m http.server 8080
```
Puis ouvrez http://localhost:8080

## Connexion admin

URL : `admin.html`  
Identifiant : `admin`  
Mot de passe : `admin1234`

⚠️ Changez le mot de passe dès la première connexion via l'onglet "Administrateurs".

## Ajouter votre logo

Remplacez le fichier `assets/logo.png` par le logo de votre serveur.
Ou changez l'URL dans Admin → Paramètres → URL du logo.

## Personnaliser le nom du serveur

Admin → Paramètres → Nom du serveur

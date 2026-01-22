# Guide de Développement et Déploiement - BmadDash

Ce document explique comment configurer l'environnement de développement, exécuter l'application et la construire pour la production.

## Prérequis

- **Node.js** (v18+)
- **Rust** et **Cargo** (via [rustup](https://rustup.rs/))
- **Outils système pour Tauri** :
  - macOS: Xcode Command Line Tools
  - Windows: Build Tools for Visual Studio 2022
  - Linux: divers paquets système (libwebkit2gtk, etc.)

## Installation

1. Clonez le dépôt.
2. Installez les dépendances Node.js :
   ```bash
   npm install
   ```

## Commandes de Développement

L'application utilise Vite pour le frontend et Tauri pour l'application desktop native.

### Lancer en mode développement
Cette commande lance le serveur Vite de développement et l'application Tauri simultanément :
```bash
npm run dev
```

### Vérifier les types TypeScript
```bash
npm run type-check # (ou tsc)
```

## Construction pour la Production

### Créer un binaire de production
```bash
npm run tauri build
```
Les installateurs (.app, .dmg, .msi, etc.) seront générés dans `src-tauri/target/release/bundle/`.

## Architecture de Déploiement

- **Plateformes supportées :** macOS, Windows, Linux.
- **Backend :** Binaire natif Rust compilé.
- **Frontend :** SPA React pré-compilée et servie par le noyau WebView de Tauri.
- **Stockage :** L'application lit directement les fichiers Markdown et YAML sur le système de fichiers de l'utilisateur.

## Tests

Pour le moment, les tests sont intégrés aux builds de développement.
- **Rust :** `cargo test` dans le répertoire `src-tauri`.
- **Frontend :** Des tests unitaires peuvent être ajoutés via Vitest.

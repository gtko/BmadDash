# Arborescence Annotée du Projet - BmadDash

Ce document fournit une vue d'ensemble de la structure du projet BmadDash, une application de bureau utilisant Tauri et React.

## Structure Globale

```
BmadDash/
├── src-tauri/               # Backend Rust (Logique Tauri)
│   ├── src/
│   │   ├── commands/        # Commandes IPC appelables depuis le Frontend
│   │   ├── models/          # Structures de données partagées (Serde)
│   │   ├── parser/          # Logique d'analyse des fichiers BMAD
│   │   ├── main.rs          # Point d'entrée de l'application desktop
│   │   └── watcher.rs       # Surveillance du système de fichiers en temps réel
│   ├── Cargo.toml           # Manifeste des dépendances Rust
│   └── tauri.conf.json      # Configuration du framework Tauri
├── src/                     # Frontend React
│   ├── components/          # Composants UI React
│   │   ├── dashboard/       # Vues statistiques et sélection de projet
│   │   ├── documents/       # Éditeur et visionneuse de documents
│   │   ├── kanban/          # Tableau de bord agile pour les Stories
│   │   ├── timeline/        # Visualisation chronologique des Epics
│   │   └── ui/              # Composants atomiques (Boutons, Inputs, etc.)
│   ├── hooks/               # Hooks personnalisés (ex: useTauri)
│   ├── stores/              # Gestion de l'état global (Zustand)
│   ├── types/               # Définitions TypeScript pour le domaine BMAD
│   ├── App.tsx              # Composant racine et routage
│   └── main.tsx             # Point d'entrée du Frontend
├── docs/                    # Documentation générée (ici même)
├── public/                  # Actifs statiques pour le Frontend
├── index.html               # Template HTML principal
├── package.json             # Dépendances et scripts Node.js
├── tailwind.config.ts       # Configuration du style CSS
├── tsconfig.json            # Configuration TypeScript
└── vite.config.ts           # Configuration du bundler Vite
```

## Points d'Entrée Critiques

- **Desktop (Backend) :** `src-tauri/src/main.rs` - Initialise Tauri et enregistre les gestionnaires de commandes.
- **Web (Frontend) :** `src/main.tsx` - Monte l'application React dans le DOM.
- **Intégration :** Les fichiers dans `src-tauri/src/commands/` définissent l'API accessible via `invoke()` depuis le Frontend (voir `src/hooks/useTauri.ts`).

## Répertoires de Données

- **_bmad/ :** Bien que non présent dans l'arborescence source, c'est le répertoire cible par défaut que l'application analyse pour extraire les données de projet (PRD, Epics, Stories).

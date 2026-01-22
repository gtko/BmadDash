# Architecture de l'Application - BmadDash

Ce document détaille l'architecture logicielle de BmadDash, une application desktop construite avec Tauri, Rust et React.

## Vue d'Ensemble

BmadDash suit une architecture découplée typique d'une application Tauri, où le **Processus Principal (Backend)** en Rust gère l'accès au système de fichiers et la logique métier lourde, tandis que le **Processus de Rendu (Frontend)** en React fournit l'interface utilisateur.

## Architecture Logique

### Backend (Rust - `src-tauri/`)
- **Main/Lib :** Point d'entrée qui configure le runtime Tauri, gère l'état global (watcher) et enregistre les commandes.
- **Commands (`commands/mod.rs`) :** API IPC (Inter-Process Communication). Elle expose des fonctions Rust au Frontend pour scanner des projets, lire/écrire des documents et gérer le monitoring.
- **Parser (`parser/mod.rs`) :** Le "cœur" intelligent qui sait interpréter la structure BMAD (PRD, Epics, Stories) à partir de fichiers Markdown et YAML.
- **Models (`models/mod.rs`) :** Structures de données fortement typées utilisées pour la désérialisation (Serde) et partagées avec le Frontend.
- **Watcher (`watcher.rs`) :** Utilise la bibliothèque `notify` pour surveiller les changements de fichiers en temps réel et avertir le Frontend via des événements Tauri.

### Frontend (React - `src/`)
- **Interface Utilisateur :** Structurée par domaines (Dashboard, Kanban, Timeline, Documents).
- **Gestion de l'État (`stores/projectStore.ts`) :** Utilise Zustand pour maintenir la liste des projets, le projet actif et l'état de l'interface avec une persistance locale.
- **Abstraction API (`hooks/useTauri.ts`) :** Fournit une interface typée pour appeler les commandes Rust via `invoke`.
- **Composants UI :** Basés sur Radix UI pour l'accessibilité et Tailwind CSS pour le style.

## Flux de Données

1.  **Scan :** L'utilisateur sélectionne un dossier → `scan_projects` (Rust) parcourt le disque → Retourne une liste de chemins de projets.
2.  **Analyse :** Sélection d'un projet → `parse_project` (Rust) lit les fichiers BMAD → Retourne un objet `BmadProject` complet.
3.  **Visualisation :** Le Frontend stocke le projet dans le Store Zustand → Les vues Kanban/Timeline se mettent à jour.
4.  **Synchronisation :** Le Watcher Rust détecte une modification de fichier → Émet un événement `file-changed` → Le Frontend recharge les données sélectivement.

## Intégrations Clefs

- **Tauri Plugins :** 
  - `opener` pour ouvrir des liens/dossiers dans le système.
  - `dialog` pour la sélection native de dossiers.
  - `fs` pour les opérations de fichiers de base.
- **Persistence :** Le store Zustand est persisté via `localStorage` pour conserver la liste des projets entre les sessions.

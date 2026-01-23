---
stepsCompleted: [1, 2]
inputDocuments:
  - 'docs/planning-artifacts/prd.md'
  - 'docs/architecture.md'
  - 'docs/component-inventory.md'
  - 'docs/development-guide.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/analysis/brainstorming-session-2026-01-22.md'
workflowType: 'architecture'
project_name: 'BmadDash'
user_name: 'Gtko'
date: '2026-01-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (46 FR):**
Architecture articulée autour de 7 domaines fonctionnels :
1. **Dashboard & Visibilité** — Vue centralisée sprint/epics/stories avec progression et suggestions intelligentes
2. **Orchestration Agents** — Interface conversationnelle single-agent avec widgets interactifs pour workflows BMAD
3. **Navigation & Recherche** — Command palette universel (Cmd+K), sidebar collapsible, raccourcis clavier
4. **Visualisation Documents** — Rendu Linear-style avec métadonnées, labels et historique
5. **BMAD File Management** — Parser Rust pour structure BMAD, file watcher temps réel, sync UI-filesystem
6. **Gestion Multi-Projets** — Hub projets avec switch et vue globale (V1 Complete)
7. **Collaboration CRDT** — Temps réel, permissions-as-code (V2+)

**Non-Functional Requirements (46 NFR):**
Contraintes architecturales critiques :
- **Performance** : Startup < 2s, bundle < 50MB, mémoire < 200MB, 60 FPS
- **Offline-first** : Dashboard 100% fonctionnel sans réseau
- **Sécurité** : Sandbox Tauri, permissions filesystem minimales, code signing
- **Accessibilité** : WCAG AA, keyboard nav, screen reader via Radix UI
- **Fiabilité** : Auto-save (30s max data loss), crash recovery, file conflict detection

**Scale & Complexity:**
- Primary domain: Desktop Native (Tauri/Rust + React WebView)
- Complexity level: High
- Estimated architectural components: 12-15 modules majeurs

### Technical Constraints & Dependencies

**Stack imposée (Brownfield) :**
- Tauri v2 runtime avec backend Rust
- React 19 + TypeScript frontend
- Zustand pour state management
- Radix UI + Tailwind CSS 4 pour design system
- File-based storage (Markdown/YAML) — pas de base de données

**Dépendances externes :**
- Claude Code API pour agents IA
- GitHub Releases pour updates
- WebView2 (Windows) / WebKit (macOS)

**Contraintes techniques :**
- IPC Tauri pour communication Rust ↔ React
- Sandboxing limite l'accès filesystem aux dossiers sélectionnés
- Offline-first impose local-first architecture

### Cross-Cutting Concerns Identified

1. **State Synchronization** — Zustand ↔ Filesystem ↔ File Watcher
2. **Error Handling** — Graceful degradation offline/online
3. **Performance** — Lazy loading, virtualization pour listes longues
4. **Accessibility** — Focus management, ARIA, keyboard navigation
5. **Theming** — Dark mode first, accent colors, high contrast
6. **CRDT Preparation** — Architecture extensible pour V2 collaboration


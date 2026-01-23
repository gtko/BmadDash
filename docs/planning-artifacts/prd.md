---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
documentStatus: 'complete'
inputDocuments:
  - 'docs/analysis/brainstorming-session-2026-01-22.md'
  - 'docs/architecture.md'
  - 'docs/index.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 2
projectType: 'brownfield'
classification:
  projectType: 'desktop_app'
  domain: 'developer_productivity'
  complexity: 'high'
  projectContext: 'brownfield'
---

# Product Requirements Document - BmadDash

**Author:** Gtko
**Date:** 2026-01-22
**Version:** 1.0
**Status:** Complete

---

## Executive Summary

**BmadDash** est un dashboard d'orchestration IA pour développeurs, conçu pour résoudre le problème central du développement assisté par IA : "Je ne sais jamais où j'en suis quand je reviens sur mon projet."

### Vision

Permettre aux développeurs de piloter des projets IA avec une visibilité totale, une UX minimaliste Linear-style, et une méthode structurée (BMAD). L'humain reste le chef d'orchestre — définissant le QUOI via specs-as-code, pendant que l'IA exécute le COMMENT.

### Core Value Proposition

| Pour | Valeur |
|------|--------|
| **Dev Solo** | Productivité 10x, zéro friction de contexte |
| **Équipes** | Collaboration structurée, visibilité partagée |
| **Tech Leads** | Qualité garantie via specs et critères |

### Key Metrics Target (6 mois)

- 5 000 utilisateurs payants
- 9€/mois (freemium)
- 45 000€ MRR
- NPS > 50

### Technical Foundation

- **Stack :** Tauri v2 (Rust + React 19)
- **Plateformes :** macOS, Windows
- **Architecture :** Offline-first, fichiers BMAD comme source de vérité

### MVP Scope

Dashboard sprint/epics/US, single-agent conversation avec widgets, command palette (Cmd+K), dark mode, fichiers BMAD comme source de vérité.

---

## Success Criteria

### User Success

- **Clarté BMAD** — L'utilisateur comprend la méthode BMAD comme si une équipe entière l'accompagnait
- **Productivité 10x** — Capacité de produire des centaines de Pull Requests en 3 semaines d'utilisation
- **Rétention** — Utilisation continue et engagement après 3+ semaines
- **Orchestration fluide** — Toutes les informations visibles pour piloter l'IA efficacement depuis le dashboard

### Business Success

| Métrique | Cible 6 mois |
|----------|--------------|
| Utilisateurs payants | 5 000 |
| Prix mensuel | 9€/mois |
| MRR | 45 000€ |
| Modèle | Freemium |
| Segments cibles | Dev solo, petites équipes, équipes avec PM |

### Technical Success

- **Maintenabilité** — Code propre et maintenable après 6+ mois de développement assisté par IA
- **Collaboration humain-IA** — Équipes complètes (devs + PM) travaillant efficacement avec l'orchestration IA
- **Qualité long terme** — Pas d'accumulation de dette technique malgré la vélocité élevée

### Measurable Outcomes

| Indicateur | Mesure de succès |
|------------|------------------|
| Time-to-productivity | Utilisateur productif en < 1 heure |
| Vélocité de développement | 10x par rapport au dev solo sans outil |
| Rétention M1 | > 60% des utilisateurs actifs après 1 mois |
| NPS | > 50 (promoteurs enthousiastes) |

### Emotional Success

- **Sérénité** — L'utilisateur ne se sent jamais perdu, tout est sous contrôle
- **Efficacité** — Gain de temps tangible ressenti au quotidien
- **Qualité long terme** — Confiance que le code restera maintenable

## Product Scope

### MVP - Minimum Viable Product (V1 Core)

- Dashboard sprint/epics/US avec progression visuelle
- Single-agent conversation avec bulles de dialogue et widgets interactifs
- Application Tauri desktop (Mac + Windows) avec dark mode
- Command palette universel (Cmd+K)
- Fichiers BMAD comme source de vérité de l'UI
- Architecture offline-first

### Growth Features - Post-MVP (V1 Complete)

- Hub multi-projets avec vue globale
- Undo/Redo global sur toutes les actions
- Sauvegardes automatiques (zero data loss)
- Pipeline de statuts visuels (Kanban-style)

### Vision - Future (V2+)

- Collaboration temps réel CRDT (style Linear/Figma)
- Permissions-as-code versionnées
- Télémétrie et observabilité (BetterStack)
- Thèmes couleur personnalisables

## User Journeys

### Parcours 1 : Alex, Dev Solo — Retour sur Projet

**Persona :** Alex, 32 ans, développeur freelance full-stack. Jongle entre 3 projets clients. Utilise Claude Code quotidiennement mais se sent parfois submergé.

**Scène d'ouverture :**
Lundi matin, Alex ouvre son laptop. Il n'a pas touché au projet "ClientAPI" depuis jeudi. Avant BmadDash, il passait 20 minutes à relire ses notes, ouvrir les fichiers BMAD, se rappeler où il en était.

**Rising Action :**
Alex lance BmadDash. En 2 secondes, le dashboard affiche : Sprint 2 à 65%, US-007 "Endpoint authentification" en cours. Suggestion : "Continuer US-007 avec l'agent Dev ?" Il clique. L'agent Dev s'ouvre avec le contexte déjà chargé.

**Climax :**
En 1 clic, Alex reprend exactement là où il s'était arrêté. L'agent lui pose une question pertinente sur l'implémentation OAuth. Alex répond, l'agent code.

**Résolution :**
En 2 heures, Alex a terminé l'US-007, passé les tests, et créé sa PR. Il switch sur "MonSaaS" — même fluidité. Il se sent en contrôle, serein.

### Parcours 2 : Alex, Dev Solo — Nouveau Projet

**Scène d'ouverture :**
Alex vient de signer un nouveau client. Projet from scratch. Avant, il créait manuellement les fichiers BMAD, galérait avec la structure.

**Rising Action :**
Dans BmadDash, Alex clique "Nouveau Projet". Il choisit le workflow "Create PRD". L'agent PM le guide à travers les questions. En 30 minutes, il a un PRD structuré. Il enchaîne avec "Create Architecture", puis "Create Epics & Stories".

**Climax :**
2 heures après avoir démarré, Alex a une structure projet complète : PRD, architecture, 3 epics, 12 stories. Tout est versionné, prêt.

**Résolution :**
Alex commence le développement avec une clarté totale. Chaque US a ses critères d'acceptation. L'IA sait exactement quoi faire. Zéro chaos.

### Parcours 3 : Marie, PM en Équipe

**Persona :** Marie, 35 ans, Product Manager dans une startup de 8 personnes. 3 devs utilisent BmadDash. Marie n'est pas technique mais veut suivre l'avancement.

**Scène d'ouverture :**
Réunion de sprint planning ce matin. Marie doit savoir où en est chaque epic. Avant, elle demandait aux devs ou fouillait dans les fichiers markdown.

**Rising Action :**
Marie ouvre BmadDash (version viewer/PM). Le dashboard meta affiche les 2 projets : Projet Alpha (Sprint 3, 80%), Projet Beta (Sprint 1, 30%). Elle drill-down sur Alpha.

**Climax :**
En 5 minutes, Marie a toutes les infos. Elle voit que US-012 est bloquée (critères non validés malgré tasks complétées). Elle peut en parler avec le dev.

**Résolution :**
Marie anime son sprint planning avec confiance. L'équipe gagne 30 minutes de réunion.

### Parcours 4 : Thomas, Tech Lead — Supervision Qualité

**Persona :** Thomas, 40 ans, Tech Lead supervisant 4 devs juniors qui utilisent l'IA intensivement. Inquiet de la qualité long terme.

**Scène d'ouverture :**
Thomas veut s'assurer que le code produit par IA respecte l'architecture définie. Il ne peut pas review chaque PR.

**Rising Action :**
Dans BmadDash, Thomas consulte architecture.md en mode Linear-style. Il voit l'historique des modifications. Il check les stories récentes : critères validés, tests passés.

**Climax :**
Thomas fait un code review ciblé. Le code est propre, conforme. L'IA a respecté les specs.

**Résolution :**
Thomas a confiance dans le processus. Il peut se concentrer sur les décisions architecture. Sérénité.

### Journey Requirements Summary

| Parcours | Capacités révélées |
|----------|-------------------|
| Dev Solo - Retour | Dashboard sprint, suggestion intelligente, switch projet, contexte BMAD |
| Dev Solo - Nouveau | Workflows 1-clic, orchestration agents, création guidée |
| PM - Suivi | Vue multi-projets, statuts visuels, mode viewer, tasks vs critères |
| Tech Lead - Qualité | Historique docs, vue architecture, specs-as-code, garde-fous qualité |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Paradigme Specs-as-Code**
- **Innovation :** Inversion du contrôle — l'humain définit les spécifications exécutables, l'IA implémente
- **Différenciateur :** Contrairement à Cursor/Copilot qui sont des "assistants de code", BmadDash est un "framework de contrôle"
- **Nouveauté :** On ne review plus le code, on review les specs. Le code devient un détail d'implémentation

**2. Orchestration Human-Centric**
- **Innovation :** Zéro autonomie IA-to-IA — chaque décision passe par l'humain
- **Différenciateur :** À contre-courant des "agents autonomes" qui prennent des décisions seuls
- **Nouveauté :** L'humain reste le chef d'orchestre, pas un spectateur

**3. Dual-Mode Collaboration (CRDT + Git)**
- **Innovation :** Collaboration temps réel ET merge git classique coexistent
- **Différenciateur :** La plupart des outils forcent un choix (temps réel OU git)
- **Nouveauté :** Flexibilité maximale selon le contexte de travail

**4. Permissions-as-Code**
- **Innovation :** Rôles et permissions versionnés dans des fichiers, pas dans une UI
- **Différenciateur :** Auditable, mergeable, portable — comme le reste du projet
- **Nouveauté :** Cohérence totale avec la philosophie specs-as-code

### Market Context & Competitive Landscape

| Concurrent | Approche | Différence BmadDash |
|------------|----------|---------------------|
| Cursor | Assistant code inline | BmadDash = orchestration projet complet |
| GitHub Copilot | Autocomplétion IA | BmadDash = framework méthodologique |
| Linear | Gestion de projet | BmadDash = intégration IA native |
| Windsurf | IDE IA | BmadDash = dashboard + méthode BMAD |

**Positionnement unique :** BmadDash n'est pas un IDE ni un assistant — c'est un dashboard d'orchestration qui impose une méthode (BMAD) pour garantir la qualité long terme.

### Validation Approach

| Hypothèse | Validation |
|-----------|------------|
| Specs-as-code fonctionne | Gtko l'utilise déjà quotidiennement avec BMAD |
| Productivité 10x atteignable | Mesurer PR/semaine des early adopters |
| PM peuvent utiliser l'outil | Tests utilisateurs avec non-devs |
| La méthode n'est pas trop rigide | Feedback utilisateurs sur la friction perçue |

### Risk Mitigation

| Risque | Mitigation |
|--------|------------|
| Courbe d'apprentissage BMAD | Onboarding guidé, templates pré-configurés |
| Paradigme trop différent | Documentation claire, exemples concrets |
| Dépendance à Claude Code | Architecture modulaire, support futur d'autres LLMs |
| Complexité CRDT | V2+ feature, pas MVP — temps de maturation |

## Desktop App Specific Requirements

### Project-Type Overview

BmadDash est une application desktop native construite avec **Tauri v2** (Rust backend + React frontend). L'architecture privilégie la performance native, l'accès système complet, et le fonctionnement offline.

### Platform Support

| Plateforme | Support | Notes |
|------------|---------|-------|
| macOS | Primary | Intel + Apple Silicon (Universal Binary) |
| Windows | Primary | Windows 10+ (x64) |
| Linux | Future | Considéré pour V2+ |

**Distribution :**
- macOS : DMG signé + notarisé (Apple Developer Program)
- Windows : MSI/EXE signé (Code Signing Certificate)

### System Integration

| Intégration | Implémentation | Plugin Tauri |
|-------------|----------------|--------------|
| File System | Lecture/écriture fichiers BMAD | `fs` |
| File Watcher | Détection modifications temps réel | `notify` (Rust) |
| Native Dialogs | Sélection dossiers, confirmations | `dialog` |
| System Opener | Ouverture liens/dossiers externes | `opener` |
| Clipboard | Copier/coller | `clipboard` |
| Notifications | Alertes système (V1 Complete) | `notification` |

### Update Strategy

| Aspect | Stratégie |
|--------|-----------|
| Mécanisme | Tauri Updater via GitHub Releases |
| Fréquence | Check au démarrage, notification non-intrusive |
| Téléchargement | Background download, install au prochain restart |
| Rollback | Backup automatique de la version précédente |
| Release Notes | Affichées avant update, lien vers changelog |

### Offline Capabilities

| Fonctionnalité | Comportement Offline |
|----------------|---------------------|
| Dashboard | 100% fonctionnel — lit fichiers locaux |
| Navigation | 100% fonctionnel |
| Édition fichiers | 100% fonctionnel |
| Agents IA | Nécessite connexion (appels API LLM) |
| Sync CRDT | Queued, sync au retour online (V2+) |

**Indicateur visuel :** Badge "Offline" visible quand déconnecté, avec liste des actions en attente.

### Implementation Considerations

**Performance :**
- Bundle size cible : < 50 MB
- Startup time : < 2 secondes
- Memory footprint : < 200 MB idle

**Sécurité :**
- Sandboxing Tauri par défaut
- Permissions minimales requises
- Pas de données sensibles stockées (tokens API = environnement utilisateur)

**Accessibilité :**
- Keyboard navigation complète
- Screen reader support (via Radix UI)
- High contrast mode support

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach :** Problem-Solving MVP — Résoudre le pain point #1 : "Je ne sais jamais où j'en suis quand je reviens sur le projet"

**Philosophie :** Lancer avec le minimum qui apporte une valeur immédiate et mesurable aux dev solo utilisant BMAD. La collaboration et les features avancées viennent après validation du core.

### MVP Feature Set (Phase 1 - V1 Core)

**Core User Journey Supported :** Dev Solo — Retour sur Projet

**Must-Have Capabilities :**

| Feature | Justification |
|---------|---------------|
| Dashboard sprint/epics/US | Pain point central |
| Progression visuelle (%) | Feedback immédiat |
| Suggestion prochaine action | Valeur différenciante |
| Single-agent conversation | Core value prop |
| Bulles + widgets | UX différenciante |
| Tauri Mac + Windows | Reach marché |
| Dark mode + Cmd+K | Standard attendu |
| Fichiers BMAD = source vérité | Architecture fondamentale |
| Offline dashboard | Fiabilité |

**Explicitly OUT of MVP :** Multi-projets, CRDT collaboration, Permissions-as-code, Thèmes couleur

### Post-MVP Features

**Phase 2 — V1 Complete (Growth) :**
- Hub multi-projets
- Undo/Redo global
- Sauvegardes automatiques
- Pipeline statuts Kanban
- Vue PM (viewer)

**Phase 3 — V2+ (Expansion) :**
- CRDT temps réel
- Permissions-as-code
- Télémétrie BetterStack
- Thèmes couleur
- Support Linux

### Risk Mitigation Strategy

**Technical Risks :**
- Performance parser BMAD → Benchmarks early, lazy loading
- Tauri cross-platform bugs → CI/CD multi-OS, beta testers
- UX conversation widgets → Prototypes utilisateurs avant dev

**Market Risks :**
- Paradigme BMAD trop complexe → Onboarding guidé, templates, docs claires
- Marché niche trop petit → Cibler communauté Claude Code existante
- Concurrence IDE IA → Positionner comme complémentaire, pas concurrent

**Resource Risks :**
- Dev solo uniquement → MVP reste faisable, timeline allongée
- Budget limité → Focus MVP strict
- Moins de temps → Couper vue PM, focus dev solo uniquement

## Functional Requirements

### Project Visibility (Dashboard)

- **FR1:** User can view current sprint with completion percentage
- **FR2:** User can view list of epics with their status and progress
- **FR3:** User can view list of user stories within an epic
- **FR4:** User can view user story details including tasks and acceptance criteria
- **FR5:** User can distinguish between completed tasks and validated acceptance criteria
- **FR6:** User can see suggested next action upon returning to a project
- **FR7:** User can view sprint timeline with milestones

### Agent Orchestration

- **FR8:** User can start a conversation with a single agent at a time
- **FR9:** User can view agent responses in styled chat bubbles
- **FR10:** User can respond to agent questions via interactive widgets (buttons, inputs)
- **FR11:** User can see agent working progress in real-time
- **FR12:** User can switch to a different agent (with context reset)
- **FR13:** User can trigger BMAD workflows via agent selection (PRD, Architecture, etc.)
- **FR14:** User can view agent avatar and identity for cognitive clarity

### Navigation & Search

- **FR15:** User can open command palette via keyboard shortcut (Cmd+K)
- **FR16:** User can search across projects, epics, stories, and documents
- **FR17:** User can navigate via collapsible sidebar
- **FR18:** User can collapse/expand sidebar to maximize workspace
- **FR19:** User can use keyboard shortcuts for common actions

### Document Viewing

- **FR20:** User can view BMAD documents (PRD, Architecture, etc.) in Linear-style layout
- **FR21:** User can see document metadata and labels in sidebar
- **FR22:** User can view document modification history
- **FR23:** User can drill-down from story to full document view

### BMAD File Management

- **FR24:** System can parse BMAD project structure from filesystem
- **FR25:** System can detect file changes in real-time via watcher
- **FR26:** System can extract sprint status from sprint-status.yaml
- **FR27:** System can parse epic files and story files
- **FR28:** System can sync UI state with filesystem source of truth

### Project Management

- **FR29:** User can add a new project by selecting a folder
- **FR30:** User can switch between multiple projects (V1 Complete)
- **FR31:** User can view global dashboard of all projects (V1 Complete)
- **FR32:** User can remove a project from the application

### Settings & Personalization

- **FR33:** User can toggle between dark and light mode
- **FR34:** User can select accent color theme (V2)
- **FR35:** User can configure keyboard shortcuts
- **FR36:** User can set default agent preferences

### System & Reliability

- **FR37:** System can function fully offline for dashboard and navigation
- **FR38:** System can indicate offline status to user
- **FR39:** System can check for updates via GitHub Releases
- **FR40:** System can download and install updates
- **FR41:** System can automatically save work to prevent data loss
- **FR42:** User can undo/redo actions globally (V1 Complete)

### Team Collaboration (V2+)

- **FR43:** User can see who is currently viewing a document (V2)
- **FR44:** User can see other users' cursors in real-time (V2)
- **FR45:** System can sync changes via CRDT without conflicts (V2)
- **FR46:** User can define team permissions via code files (V2)

## Non-Functional Requirements

### Performance

- **NFR1:** Application startup time < 2 seconds on standard hardware
- **NFR2:** Bundle size < 50 MB (compressed installer)
- **NFR3:** Memory footprint < 200 MB idle, < 500 MB under active use
- **NFR4:** File parsing response time < 500ms for projects with 50+ stories
- **NFR5:** UI interactions respond within 100ms (60 FPS target)
- **NFR6:** File watcher latency < 1 second for detecting changes
- **NFR7:** Command palette search results appear within 200ms

### Security

- **NFR8:** Application runs in Tauri sandboxed environment
- **NFR9:** No sensitive data (API keys, tokens) stored by application — user manages via environment
- **NFR10:** Code signing certificates for both macOS and Windows distributions
- **NFR11:** macOS notarization for Gatekeeper compliance
- **NFR12:** Minimal filesystem permissions — only access to user-selected project folders
- **NFR13:** No telemetry or analytics without explicit user consent (V2 opt-in)

### Reliability & Availability

- **NFR14:** Dashboard functional 100% offline (no network dependency for core features)
- **NFR15:** Auto-save mechanism prevents data loss (max 30s data loss window)
- **NFR16:** Graceful degradation when network unavailable (clear offline indicator)
- **NFR17:** Application crash recovery restores last known state
- **NFR18:** File conflict detection when external changes occur
- **NFR19:** Backup mechanism for user data before updates

### Accessibility

- **NFR20:** Full keyboard navigation for all features
- **NFR21:** Screen reader compatibility via semantic HTML and Radix UI
- **NFR22:** High contrast mode support
- **NFR23:** Minimum touch target size 44x44px
- **NFR24:** Color contrast ratio ≥ 4.5:1 for text (WCAG AA)
- **NFR25:** Focus indicators visible on all interactive elements

### Usability

- **NFR26:** First-time user can complete onboarding in < 5 minutes
- **NFR27:** Core actions (view sprint, switch story) achievable in ≤ 3 clicks
- **NFR28:** Error messages provide actionable guidance
- **NFR29:** Consistent visual language across all views (Linear-style)
- **NFR30:** Dark mode as default, light mode available

### Maintainability

- **NFR31:** Codebase follows Rust and TypeScript best practices
- **NFR32:** Frontend component library documented (Storybook optional for V2)
- **NFR33:** Backend commands have unit test coverage ≥ 80%
- **NFR34:** CI/CD pipeline validates builds on macOS and Windows
- **NFR35:** Semantic versioning for releases (SemVer)

### Scalability

- **NFR36:** Support projects with up to 100 epics and 500 stories without performance degradation
- **NFR37:** Multi-project hub supports up to 20 projects (V1 Complete)
- **NFR38:** CRDT sync handles 10+ concurrent users per document (V2)

### Compatibility

- **NFR39:** macOS 11+ (Big Sur and later)
- **NFR40:** Windows 10 version 1903+ (64-bit)
- **NFR41:** BMAD file format v1 compatibility guaranteed
- **NFR42:** Backward compatibility maintained for minor version updates
- **NFR43:** WebView2 runtime auto-installed on Windows if missing

### Internationalization (V2+)

- **NFR44:** UI text externalized for future localization
- **NFR45:** Date/time formats respect system locale
- **NFR46:** UTF-8 support for all text content and filenames

## Glossary & Definitions

| Terme | Définition |
|-------|------------|
| **BMAD** | Build Methodically, Architect Decisively — Méthode de développement assisté par IA |
| **Specs-as-Code** | Paradigme où les spécifications sont exécutables et validables automatiquement |
| **PRD** | Product Requirements Document — Document de spécification produit |
| **Epic** | Regroupement fonctionnel de user stories |
| **User Story (US)** | Unité de travail décrivant une fonctionnalité du point de vue utilisateur |
| **Acceptance Criteria** | Conditions de validation définissant quand une story est terminée |
| **CRDT** | Conflict-free Replicated Data Type — Structure de données pour collaboration temps réel |
| **Tauri** | Framework pour applications desktop (Rust + WebView) |
| **Command Palette** | Interface de recherche et commandes accessible via Cmd+K |
| **File Watcher** | Système de surveillance des modifications fichiers en temps réel |
| **MRR** | Monthly Recurring Revenue — Revenu mensuel récurrent |
| **Human-Centric** | Philosophie où l'humain reste le décisionnaire central |

## Document Summary

### Requirements Count

| Catégorie | Nombre |
|-----------|--------|
| Functional Requirements | 46 |
| Non-Functional Requirements | 46 |
| **Total** | **92** |

### Phase Distribution

| Phase | FRs | Description |
|-------|-----|-------------|
| MVP (V1 Core) | FR1-FR28, FR33, FR37-FR41 | Dashboard, agents, navigation, BMAD, settings core |
| V1 Complete | FR29-FR32, FR42 | Multi-projets, undo/redo |
| V2+ | FR43-FR46 | Collaboration CRDT, permissions |

### Key Constraints

- **Timeline :** MVP livrable en phases itératives
- **Team :** Développement solo initial
- **Budget :** Freemium, infrastructure minimale avant revenus
- **Dependencies :** Claude Code API, GitHub Releases, Tauri ecosystem

## Next Steps

1. **Architecture Document** — Définir l'architecture technique détaillée (Rust commands, React components, state management)
2. **UX Design** — Créer wireframes Linear-inspired pour les vues clés
3. **Epics & Stories** — Décomposer le MVP en epics et user stories actionnables
4. **Technical Spike** — Valider le parser BMAD et le file watcher
5. **Alpha Release** — Build interne pour validation du core workflow

---

*Document généré le 2026-01-22 | Version 1.0 | Statut: Draft*


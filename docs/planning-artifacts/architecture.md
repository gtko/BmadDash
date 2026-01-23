---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-01-23'
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

## Starter Template Evaluation

### Primary Technology Domain

**Desktop Native (Tauri v2)** — Application desktop hybride avec backend Rust et frontend React WebView.

### Starter Options Considered

**Option évaluée : Projet Brownfield Existant**

Ce projet n'utilise pas de starter externe — il s'agit d'un projet brownfield avec une architecture déjà établie via `create-tauri-app`. L'évaluation porte sur la validation et l'extension du stack existant.

### Stack Actuel Validé

**Fondations établies :**

| Technologie | Version | Rôle |
|-------------|---------|------|
| Tauri | v2.x | Runtime desktop + IPC |
| React | 19.1.0 | UI Framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 7.0.4 | Bundler + Dev server |
| Tailwind CSS | 4.1.18 | Styling utility-first |
| Zustand | 5.0.10 | State management |
| Radix UI | Multiple | Primitives accessibles |
| TanStack Router | 1.153.2 | Routing type-safe |
| Recharts | 3.6.0 | Visualisation données |
| dnd-kit | 6.3.1 | Drag & Drop |

**Backend Rust :**

| Crate | Version | Rôle |
|-------|---------|------|
| serde + serde_yaml | 1.x / 0.9 | Serialization BMAD files |
| notify | 6.x | File watcher temps réel |
| walkdir | 2.x | Directory traversal |
| chrono | 0.4 | Date/Time handling |
| thiserror | 1.x | Error handling idiomatique |

### Extensions Recommandées

**Commandes d'installation :**

```bash
# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/coverage-v8

# Linting & Formatting
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier

# Animations (UX fluide Linear-style)
npm install motion

# Command Palette (Cmd+K)
npm install cmdk
```

### Architectural Decisions - Tooling

| Domaine | Décision | Version | Justification |
|---------|----------|---------|---------------|
| **Testing** | Vitest + Testing Library | 4.x | Intégration native Vite, rapide, React 19 compatible |
| **E2E Testing** | Différé post-MVP | - | Limitations macOS WebDriver, complexité Tauri |
| **Linting** | ESLint 9 flat config | 9.x | Nouvelle architecture, meilleure perf |
| **Formatting** | Prettier | 3.x | Standard industrie, intégration ESLint |
| **Animations** | Motion (ex Framer Motion) | 12.x | UX fluide Linear-style, React 19 natif |
| **Command Palette** | cmdk | 1.x | Utilisé par Vercel, unstyled = flexible Tailwind |

**Note:** Ces extensions s'ajoutent au stack existant sans le remplacer. L'initialisation de ces outils sera la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Décisions Critiques (Bloquent l'Implémentation) :**
- Pré-requis LLM CLI détecté au démarrage
- Pattern IPC Domain-Based avec StructuredError
- Stratégie de parsing hybride pour performance

**Décisions Importantes (Façonnent l'Architecture) :**
- Dual Cache (Rust + Zustand)
- Multi-Store Zustand par domaine
- Custom Hooks pour fetching IPC
- Organisation composants hybride

**Décisions Différées (Post-MVP) :**
- Code Signing (Apple + Windows)
- E2E Testing Tauri

### Data Architecture

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **Parsing Strategy** | Hybride | Index au load + lazy-load détails — équilibre startup/navigation |
| **Cache Strategy** | Dual Cache | Rust (`parking_lot::RwLock`) pour données parsées + Zustand pour UI state |
| **File Watcher** | Debounced (500ms) | Évite rafales lors de saves multiples, UX fluide |

**Implémentation Rust :**
```rust
// Cache structure
pub struct BmadCache {
    projects: RwLock<HashMap<PathBuf, ProjectIndex>>,
    // Lazy-loaded on demand
    epics: RwLock<HashMap<String, Epic>>,
    stories: RwLock<HashMap<String, Story>>,
}
```

### Authentication & Security

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **API Keys** | Délégation CLI | Réutilise le LLM CLI installé (Claude Code, Codex, Gemini, Crush, OpenCode) |
| **Pré-requis Startup** | Vérification LLM | App = orchestrateur, nécessite un "cerveau" externe |
| **Permissions Tauri** | Minimal | Sélection explicite dossier projet via dialog natif |
| **Validation BMAD** | Graceful Degradation | Warning visuel sans bloquer, données partielles acceptées |

**LLM CLI Detection (au démarrage) :**
```rust
const SUPPORTED_LLM_CLIS: &[&str] = &[
    "claude",      // Claude Code
    "codex",       // OpenAI Codex
    "gemini",      // Google Gemini
    "crush",       // Crush
    "opencode",    // OpenCode
];
```

### API & Communication Patterns

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **IPC Commands** | Domain-Based | `bmad::project::*`, `bmad::sprint::*`, `bmad::epic::*` |
| **Error Handling** | StructuredError | `{code, message, context, recoverable}` — UI informative |
| **File Events** | Tauri Events | `emit()` Rust → `listen()` React — pattern natif réactif |

**StructuredError Type :**
```typescript
interface TauriError {
  code: string;           // "BMAD_PARSE_ERROR"
  message: string;        // "Failed to parse sprint-status.yaml"
  context?: string;       // File path or additional info
  recoverable: boolean;   // Can user retry or continue?
}
```

**Command Namespacing :**
```rust
// src-tauri/src/commands/mod.rs
pub mod project;  // bmad::project::open, ::close, ::list
pub mod sprint;   // bmad::sprint::get, ::refresh
pub mod epic;     // bmad::epic::list, ::get
pub mod story;    // bmad::story::get, ::update_status
pub mod agent;    // bmad::agent::start, ::stop, ::send
```

### Frontend Architecture

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **Component Organization** | Hybride | `ui/` (primitifs Radix) + `features/` (domaines métier) |
| **State Management** | Multi-Store | Un store Zustand par domaine — testabilité, re-renders optimisés |
| **IPC Fetching** | Custom Hooks | `useSprintData()`, `useEpics()` — encapsulation, réutilisabilité |
| **Theming** | Tailwind Dark Mode | `dark:` prefix natif, dark-first comme spécifié PRD |

**Structure Dossiers :**
```
src/
├── components/
│   ├── ui/              # Primitifs Radix + custom atoms
│   └── features/
│       ├── dashboard/   # Sprint overview, stats
│       ├── epic/        # Epic list, detail
│       ├── story/       # Story cards, kanban
│       ├── agent/       # Chat interface, widgets
│       └── command/     # Command palette (cmdk)
├── hooks/
│   ├── useProject.ts
│   ├── useSprintData.ts
│   ├── useEpics.ts
│   └── useTauriEvents.ts
├── stores/
│   ├── projectStore.ts
│   ├── sprintStore.ts
│   ├── agentStore.ts
│   └── uiStore.ts
```

### Infrastructure & Deployment

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **CI/CD** | GitHub Actions | Workflows Tauri prêts à l'emploi, gratuit |
| **Release** | Tauri Updater | Auto-update transparent via GitHub Releases |
| **Code Signing** | Différé MVP | Validation produit avant investissement (~300€/an) |
| **Environments** | Combiné | Vite `.env.*` + Tauri `tauri.conf.json` overrides |

**GitHub Actions Workflow :**
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: tauri-apps/tauri-action@v0
```

### Decision Impact Analysis

**Séquence d'Implémentation Recommandée :**

1. **Setup Tooling** — ESLint, Prettier, Vitest, Motion, cmdk
2. **Error Types** — Définir `StructuredError` Rust + TypeScript
3. **IPC Refactor** — Restructurer commandes en domain-based
4. **Cache Layer** — Implémenter `BmadCache` avec `parking_lot`
5. **Stores Refactor** — Migrer vers multi-store Zustand
6. **Custom Hooks** — Créer hooks IPC avec gestion erreurs
7. **LLM Detection** — Vérification startup + onboarding
8. **CI/CD** — GitHub Actions pour builds automatisés

**Dépendances Cross-Component :**
- StructuredError → requis par Custom Hooks → requis par Stores
- BmadCache → requis par IPC Commands → requis par File Watcher Events
- LLM Detection → requis par Agent feature

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Points de conflit potentiels identifiés :** 12 zones où les agents IA pourraient faire des choix différents — toutes résolues par les patterns ci-dessous.

### Naming Patterns

#### Rust Backend Conventions

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Functions** | `snake_case` | `fn get_sprint_data()` |
| **Structs** | `PascalCase` | `struct ProjectIndex` |
| **Struct Fields** | `snake_case` | `project_path: PathBuf` |
| **Enums** | `PascalCase` | `enum EpicStatus` |
| **Enum Variants** | `PascalCase` | `EpicStatus::InProgress` |
| **Modules** | `snake_case` | `mod sprint_parser` |
| **Constants** | `SCREAMING_SNAKE` | `const MAX_FILE_SIZE: usize` |
| **Tauri Commands** | `snake_case` | `#[tauri::command] fn get_epic_list()` |

```rust
// ✅ Correct
#[tauri::command]
pub fn get_sprint_data(project_path: PathBuf) -> Result<SprintStatus, BmadError> { ... }

// ❌ Anti-pattern
#[tauri::command]
pub fn getSprintData(projectPath: PathBuf) -> Result<sprintStatus, bmadError> { ... }
```

#### TypeScript Frontend Conventions

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Components** | `PascalCase` | `SprintDashboard` |
| **Component Files** | `PascalCase.tsx` | `SprintDashboard.tsx` |
| **Hooks** | `camelCase` + `use` | `useSprintData` |
| **Hook Files** | `camelCase.ts` | `useSprintData.ts` |
| **Stores** | `camelCase` + `Store` | `sprintStore` |
| **Store Files** | `camelCase.ts` | `sprintStore.ts` |
| **Types/Interfaces** | `PascalCase` | `interface Sprint` |
| **Utilities** | `camelCase` | `formatDate()` |
| **Constants** | `SCREAMING_SNAKE` | `MAX_RETRIES` |

```typescript
// ✅ Correct
export function SprintDashboard({ projectId }: SprintDashboardProps) { ... }
export function useSprintData(projectId: string): SprintDataResult { ... }

// ❌ Anti-pattern
export function sprintDashboard({ project_id }: sprint_dashboard_props) { ... }
```

### Structure Patterns

#### Test Organization (Co-located)

```
src/
├── components/
│   └── features/
│       └── sprint/
│           ├── SprintCard.tsx
│           ├── SprintCard.test.tsx      # ✅ Co-located
│           ├── SprintDashboard.tsx
│           └── SprintDashboard.test.tsx # ✅ Co-located
├── hooks/
│   ├── useSprintData.ts
│   └── useSprintData.test.ts            # ✅ Co-located
```

**Règle :** Chaque fichier `.tsx` ou `.ts` contenant de la logique testable a son fichier `.test.tsx` ou `.test.ts` adjacent.

#### Rust Test Organization

```rust
// Tests inline dans le même fichier
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_sprint() { ... }
}
```

### Communication Patterns

#### Tauri Events (Namespaced)

**Format de nommage :** `bmad:{domain}:{action}`

| Event | Description |
|-------|-------------|
| `bmad:file:changed` | Fichier BMAD modifié |
| `bmad:file:created` | Nouveau fichier détecté |
| `bmad:file:deleted` | Fichier supprimé |
| `bmad:sprint:updated` | Sprint data rafraîchi |
| `bmad:project:loaded` | Projet chargé avec succès |
| `bmad:agent:message` | Message de l'agent LLM |
| `bmad:agent:status` | Changement de statut agent |

**Payload Structure :**

```typescript
interface BmadEvent<T> {
  type: string;           // "bmad:file:changed"
  timestamp: string;      // ISO 8601
  payload: T;
}
```

```rust
#[derive(Serialize, Clone)]
pub struct BmadEvent<T: Serialize> {
    #[serde(rename = "type")]
    pub event_type: String,
    pub timestamp: String,
    pub payload: T,
}
```

### Module Patterns

#### Named Exports Only

```typescript
// ✅ Correct - Named exports
export function SprintCard({ sprint }: SprintCardProps) { ... }
export type { SprintCardProps };

// ❌ Anti-pattern - Default exports
export default function SprintCard() { ... }
```

**Rationale :** Tree-shaking optimisé, refactoring sûr, pas d'ambiguïté.

### State Patterns

#### Loading State Enum

```typescript
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SprintState {
  status: AsyncStatus;
  data: Sprint | null;
  error: TauriError | null;
}
```

**Usage :**

```typescript
function SprintDashboard() {
  const { status, data, error } = useSprintStore();

  if (status === 'idle') return <EmptyState />;
  if (status === 'loading') return <Skeleton />;
  if (status === 'error') return <ErrorDisplay error={error} />;
  if (status === 'success' && data) return <SprintView sprint={data} />;
}
```

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**

1. ✅ Suivre les conventions de nommage Rust/TypeScript définies
2. ✅ Co-localiser les tests avec leurs fichiers source
3. ✅ Utiliser le format namespaced `bmad:{domain}:{action}` pour les events
4. ✅ Utiliser uniquement des named exports (jamais de default export)
5. ✅ Implémenter les états async avec le pattern `AsyncStatus` enum
6. ✅ Structurer les payloads d'events avec `BmadEvent<T>`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
BmadDash/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, build check
│       └── release.yml               # Tauri build multi-plateforme
├── docs/
│   ├── planning-artifacts/           # PRD, Architecture, etc.
│   └── implementation-artifacts/     # Docs générées
├── public/
│   └── assets/
│       ├── icons/                    # App icons
│       └── images/                   # Static images
├── src/                              # Frontend React
│   ├── components/
│   │   ├── ui/                       # Primitifs Radix + atoms
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── index.ts
│   │   └── features/
│   │       ├── dashboard/
│   │       │   ├── SprintOverview.tsx
│   │       │   ├── EpicProgress.tsx
│   │       │   ├── StatsCards.tsx
│   │       │   ├── SuggestedAction.tsx
│   │       │   └── index.ts
│   │       ├── epic/
│   │       │   ├── EpicList.tsx
│   │       │   ├── EpicCard.tsx
│   │       │   ├── EpicDetail.tsx
│   │       │   └── index.ts
│   │       ├── story/
│   │       │   ├── StoryCard.tsx
│   │       │   ├── StoryKanban.tsx
│   │       │   ├── StoryDetail.tsx
│   │       │   ├── TaskList.tsx
│   │       │   └── index.ts
│   │       ├── agent/
│   │       │   ├── AgentChat.tsx
│   │       │   ├── ChatBubble.tsx
│   │       │   ├── AgentSelector.tsx
│   │       │   ├── WidgetRenderer.tsx
│   │       │   └── index.ts
│   │       ├── document/
│   │       │   ├── DocumentViewer.tsx
│   │       │   ├── MarkdownRenderer.tsx
│   │       │   ├── DocumentMeta.tsx
│   │       │   └── index.ts
│   │       ├── project/
│   │       │   ├── ProjectSelector.tsx
│   │       │   ├── ProjectCard.tsx
│   │       │   ├── NewProjectDialog.tsx
│   │       │   └── index.ts
│   │       └── command/
│   │           ├── CommandPalette.tsx
│   │           ├── CommandItem.tsx
│   │           └── index.ts
│   ├── hooks/
│   │   ├── useProject.ts
│   │   ├── useSprintData.ts
│   │   ├── useEpics.ts
│   │   ├── useStories.ts
│   │   ├── useAgent.ts
│   │   ├── useTauriEvents.ts
│   │   ├── useCommandPalette.ts
│   │   └── index.ts
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── sprintStore.ts
│   │   ├── epicStore.ts
│   │   ├── storyStore.ts
│   │   ├── agentStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── bmad.ts                   # Sprint, Epic, Story, Task
│   │   ├── tauri.ts                  # TauriError, BmadEvent
│   │   ├── agent.ts                  # AgentMessage, AgentStatus
│   │   └── index.ts
│   ├── lib/
│   │   ├── tauri.ts                  # invoke wrapper
│   │   ├── formatters.ts             # Date, status formatters
│   │   ├── constants.ts              # ASYNC_STATUS, EVENT_NAMES
│   │   └── cn.ts                     # Tailwind classname utility
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── main.tsx
│   └── routeTree.gen.ts
├── src-tauri/                        # Backend Rust
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── project.rs
│   │   │   ├── sprint.rs
│   │   │   ├── epic.rs
│   │   │   ├── story.rs
│   │   │   └── agent.rs
│   │   ├── parser/
│   │   │   ├── mod.rs
│   │   │   ├── sprint_parser.rs
│   │   │   ├── epic_parser.rs
│   │   │   ├── story_parser.rs
│   │   │   └── yaml_utils.rs
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── project.rs
│   │   │   ├── sprint.rs
│   │   │   ├── epic.rs
│   │   │   ├── story.rs
│   │   │   └── error.rs
│   │   ├── cache/
│   │   │   ├── mod.rs
│   │   │   └── bmad_cache.rs
│   │   ├── watcher/
│   │   │   ├── mod.rs
│   │   │   └── file_watcher.rs
│   │   ├── llm/
│   │   │   ├── mod.rs
│   │   │   ├── detector.rs
│   │   │   └── bridge.rs
│   │   ├── events.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json
├── .env.development
├── .env.production
├── .env.example
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

### Architectural Boundaries

#### IPC Boundary (Rust ↔ React)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  Stores ◄── Hooks ◄── Types        UI Components            │
│       │         │                                            │
│       ▼         ▼                                            │
│  ┌─────────────────────────────────────────────┐            │
│  │            lib/tauri.ts (invoke wrapper)     │            │
│  └─────────────────────────┬───────────────────┘            │
└────────────────────────────┼────────────────────────────────┘
                             │ IPC
┌────────────────────────────┼────────────────────────────────┐
│                      BACKEND (Rust)                          │
│  ┌─────────────────────────▼───────────────────┐            │
│  │              commands/*.rs                   │            │
│  └────────────────────┬────────────────────────┘            │
│       ┌───────────────┼───────────────┐                     │
│       ▼               ▼               ▼                     │
│    Parser          Cache          Watcher                   │
│       └───────────────┴───────────────┘                     │
│                       ▼                                      │
│              Filesystem (BMAD files)                        │
└─────────────────────────────────────────────────────────────┘
```

#### Data Flow

```
User Action → Component → Hook → Store → invoke() → Command → Parser → Cache
                                                         ↓
                                                    Filesystem
                                                         ↓
                                              File Watcher (debounced)
                                                         ↓
                                              emit("bmad:file:changed")
                                                         ↓
                                              useTauriEvents() → Store.refresh()
```

### Requirements to Structure Mapping

| Feature Domain | Frontend Location | Backend Location |
|----------------|-------------------|------------------|
| **Sprint Dashboard** | `features/dashboard/` | `commands/sprint.rs` |
| **Epic Management** | `features/epic/` | `commands/epic.rs`, `parser/epic_parser.rs` |
| **Story Kanban** | `features/story/` | `commands/story.rs`, `parser/story_parser.rs` |
| **Agent Chat** | `features/agent/` | `commands/agent.rs`, `llm/` |
| **Command Palette** | `features/command/` | N/A (frontend only) |
| **Document Viewer** | `features/document/` | `parser/*.rs` |
| **Project Selection** | `features/project/` | `commands/project.rs` |
| **File Watching** | `hooks/useTauriEvents.ts` | `watcher/file_watcher.rs` |
| **Error Handling** | `types/tauri.ts` | `models/error.rs` |

### Cross-Cutting Concerns Location

| Concern | Files |
|---------|-------|
| **State Types** | `src/types/bmad.ts`, `src-tauri/src/models/*.rs` |
| **Error Types** | `src/types/tauri.ts`, `src-tauri/src/models/error.rs` |
| **Event Types** | `src/types/tauri.ts`, `src-tauri/src/events.rs` |
| **IPC Wrapper** | `src/lib/tauri.ts` |
| **Styling** | `src/styles/globals.css`, `tailwind.config.ts` |
| **Routing** | `src/App.tsx`, `src/routeTree.gen.ts` |

## Architecture Validation Results

### Coherence Validation ✅

**Compatibilité Décisions :**
Toutes les technologies choisies sont compatibles et leurs versions vérifiées :
- Tauri v2 + React 19 : Stack supportée officiellement
- Vite 7 + Vitest 4 : Intégration native
- Tailwind 4 + Radix UI : Compatibles
- Zustand 5 + React 19 : Support complet
- Motion 12 + React 19 : Compatibilité confirmée

**Cohérence Patterns :**
Les patterns d'implémentation sont alignés avec le stack technique :
- snake_case Rust : Idiomatique
- PascalCase React : Standard
- Domain-based IPC : Cohérent avec structure features/
- Namespaced events : Suit le pattern domain-based

**Alignement Structure :**
La structure projet supporte toutes les décisions architecturales avec des emplacements clairs pour chaque domaine fonctionnel.

### Requirements Coverage ✅

**Couverture Domaines Fonctionnels (PRD) :**

| Domaine | Couverture |
|---------|------------|
| Dashboard & Visibilité | ✅ 100% |
| Orchestration Agents | ✅ 100% |
| Navigation & Recherche | ✅ 100% |
| Visualisation Documents | ✅ 100% |
| BMAD File Management | ✅ 100% |
| Gestion Multi-Projets | ✅ 100% |
| Collaboration CRDT | ⏳ Différé V2+ |

**Couverture NFRs Critiques :**

| NFR | Solution |
|-----|----------|
| Startup < 2s | Parsing hybride |
| Bundle < 50MB | Tauri natif |
| Mémoire < 200MB | Dual cache, lazy loading |
| 60 FPS | Motion animations |
| Offline-first | File-based storage |
| WCAG AA | Radix UI |

### Implementation Readiness ✅

**Complétude Décisions :** Toutes les décisions critiques documentées avec versions vérifiées et exemples de code.

**Complétude Structure :** Structure projet complète et spécifique — pas de placeholders génériques.

**Complétude Patterns :** Tous les points de conflit potentiels adressés avec conventions claires.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé
- [x] Complexité évaluée (High)
- [x] Contraintes techniques identifiées
- [x] Cross-cutting concerns mappés

**✅ Architectural Decisions**
- [x] Décisions critiques documentées avec versions
- [x] Stack technique spécifiée
- [x] Patterns d'intégration définis
- [x] Performance adressée

**✅ Implementation Patterns**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de process documentés

**✅ Project Structure**
- [x] Structure complète définie
- [x] Boundaries établies
- [x] Points d'intégration mappés
- [x] Mapping exigences → structure complet

### Architecture Readiness Assessment

**Statut Global :** ✅ PRÊT POUR IMPLÉMENTATION

**Niveau de Confiance :** ÉLEVÉ

**Forces Clés :**
- Stack moderne et cohérente (Tauri v2, React 19, TypeScript 5.8)
- Patterns clairs pour agents IA
- Structure spécifique avec fichiers nommés
- Décisions bien documentées avec rationale
- Pré-requis LLM CLI comme garde-fou qualité

**Améliorations Futures (Post-MVP) :**
- Storybook pour design system
- E2E testing quand Tauri WebDriver mature sur macOS
- Code signing avant release publique
- Clippy configuration pour qualité Rust

### Implementation Handoff

**Directives pour Agents IA :**
1. Suivre toutes les décisions architecturales exactement comme documentées
2. Utiliser les patterns d'implémentation de manière cohérente
3. Respecter la structure projet et les boundaries
4. Référencer ce document pour toute question architecturale

**Première Priorité d'Implémentation :**
```bash
# Setup Tooling (Story 1)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier
npm install motion cmdk
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow :** COMPLETED ✅
**Total Steps Completed :** 8
**Date Completed :** 2026-01-23
**Document Location :** docs/planning-artifacts/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- 18+ décisions architecturales documentées avec versions spécifiques
- 6 catégories de patterns d'implémentation définis
- Structure projet complète avec tous les fichiers et dossiers
- Mapping exigences → architecture
- Validation confirmant cohérence et complétude

**🏗️ Implementation Ready Foundation**
- Stack : Tauri v2 + React 19 + TypeScript 5.8
- State : Zustand 5 multi-store
- UI : Radix UI + Tailwind CSS 4 + Motion 12
- Testing : Vitest 4 + Testing Library
- IPC : Domain-based commands avec StructuredError

**📚 AI Agent Implementation Guide**
- Conventions de nommage Rust/TypeScript
- Patterns de tests co-localisés
- Events namespaced `bmad:{domain}:{action}`
- AsyncStatus enum pour états loading
- Named exports uniquement

### Quality Assurance Final

**✅ Architecture Coherence**
- [x] Toutes les décisions compatibles
- [x] Technologies versions vérifiées
- [x] Patterns supportent les décisions
- [x] Structure alignée

**✅ Requirements Coverage**
- [x] 6/7 domaines fonctionnels couverts (CRDT V2+)
- [x] NFRs critiques adressés
- [x] Cross-cutting concerns gérés

**✅ Implementation Readiness**
- [x] Décisions spécifiques et actionnables
- [x] Patterns préviennent les conflits
- [x] Structure complète et non-ambiguë
- [x] Exemples fournis

---

**Architecture Status :** ✅ PRÊT POUR IMPLÉMENTATION

**Next Phase :** Créer les Epics & Stories basées sur cette architecture

---

*Document généré le 2026-01-23 | Version 1.0 | Statut : Complet*


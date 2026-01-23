---
project_name: 'BmadDash'
user_name: 'Gtko'
date: '2026-01-23'
version: '1.0'
status: 'active'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents MUST follow when implementing code in BmadDash. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**CRITICAL: Use these exact versions. Do NOT upgrade without explicit approval.**

| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | v2.x | Desktop runtime |
| React | 19.1.0 | UI Framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 7.0.4 | Bundler |
| Tailwind CSS | 4.1.18 | Styling |
| Zustand | 5.0.10 | State management |
| Radix UI | Latest | Accessible primitives |
| TanStack Router | 1.153.2 | Type-safe routing |
| Motion | 12.x | Animations |
| cmdk | 1.x | Command palette |
| Vitest | 4.x | Testing |

**Rust Backend:**
- Tauri v2, serde 1.x, serde_yaml 0.9, notify 6.x, parking_lot 0.12

---

## Critical Implementation Rules

### TypeScript Rules

```typescript
// ✅ ALWAYS use strict mode (already configured in tsconfig.json)
// ✅ ALWAYS use path alias @/* for imports
import { SprintCard } from '@/components/features/sprint/SprintCard';

// ❌ NEVER use relative imports beyond one level
import { SprintCard } from '../../../components/sprint/SprintCard'; // WRONG

// ❌ NEVER use `any` type - use `unknown` and type guards instead
// ❌ NEVER use non-null assertion (!) unless absolutely necessary
```

### Naming Conventions

**Files:**
| Type | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `SprintCard.tsx` |
| Hooks | `camelCase.ts` | `useSprintData.ts` |
| Stores | `camelCase.ts` | `sprintStore.ts` |
| Types | `camelCase.ts` | `bmad.ts` |
| Utils | `camelCase.ts` | `formatDate.ts` |
| Tests | `*.test.ts(x)` | `SprintCard.test.tsx` |

**Code:**
| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `SprintDashboard` |
| Functions | camelCase | `getSprintData` |
| Variables | camelCase | `sprintStatus` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `interface Sprint` |
| Enums | PascalCase | `EpicStatus.InProgress` |

**Rust:**
| Element | Convention | Example |
|---------|------------|---------|
| Functions | snake_case | `get_sprint_data` |
| Structs | PascalCase | `SprintStatus` |
| Fields | snake_case | `project_path` |
| Modules | snake_case | `sprint_parser` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

---

## Component Patterns

### Named Exports ONLY

```typescript
// ✅ CORRECT
export function SprintCard({ sprint }: SprintCardProps) { ... }
export type { SprintCardProps };

// ❌ NEVER use default exports
export default function SprintCard() { ... } // WRONG
```

### Co-located Tests

```
src/components/features/sprint/
├── SprintCard.tsx
├── SprintCard.test.tsx    # ✅ Test next to component
└── index.ts
```

### Component Structure

```typescript
// Standard component structure
import { type ComponentProps } from 'react';

interface SprintCardProps {
  sprint: Sprint;
  onSelect?: (id: string) => void;
}

export function SprintCard({ sprint, onSelect }: SprintCardProps) {
  // hooks first
  const { status } = useSprintStore();

  // handlers
  const handleClick = () => onSelect?.(sprint.id);

  // early returns for loading/error states
  if (status === 'loading') return <Skeleton />;

  // render
  return (
    <Card onClick={handleClick}>
      {/* content */}
    </Card>
  );
}
```

---

## State Management Patterns

### AsyncStatus Enum (MANDATORY)

```typescript
// ✅ ALWAYS use this pattern for async states
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface StoreState {
  status: AsyncStatus;
  data: DataType | null;
  error: TauriError | null;
}

// ❌ NEVER use boolean isLoading
interface BadState {
  isLoading: boolean; // WRONG
  data: DataType | null;
}
```

### Multi-Store Pattern

```typescript
// One store per domain - NOT a single global store
export const useSprintStore = create<SprintState>(...);
export const useEpicStore = create<EpicState>(...);
export const useAgentStore = create<AgentState>(...);
```

---

## IPC Patterns (Tauri)

### Domain-Based Commands

```typescript
// Commands follow pattern: domain_action
await invoke('project_open', { path });      // ✅
await invoke('sprint_get_data', { id });     // ✅
await invoke('getSprintData', { id });       // ❌ WRONG naming
```

### StructuredError Handling

```typescript
// ✅ ALWAYS handle errors with this structure
interface TauriError {
  code: string;           // "BMAD_PARSE_ERROR"
  message: string;        // Human-readable
  context?: string;       // File path or details
  recoverable: boolean;   // Can user retry?
}

try {
  const data = await invoke<Sprint>('sprint_get_data', { id });
} catch (error) {
  const tauriError = error as TauriError;
  if (tauriError.recoverable) {
    // Show retry option
  } else {
    // Show error message
  }
}
```

### Namespaced Events

```typescript
// Event format: bmad:{domain}:{action}
listen('bmad:file:changed', handler);     // ✅
listen('bmad:sprint:updated', handler);   // ✅
listen('fileChanged', handler);           // ❌ WRONG

// Event payload structure
interface BmadEvent<T> {
  type: string;
  timestamp: string;  // ISO 8601
  payload: T;
}
```

---

## Testing Rules

### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SprintCard } from './SprintCard';

describe('SprintCard', () => {
  it('renders sprint title', () => {
    render(<SprintCard sprint={mockSprint} />);
    expect(screen.getByText(mockSprint.title)).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<SprintCard sprint={mockSprint} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockSprint.id);
  });
});
```

### What to Test

- ✅ Component renders correctly with props
- ✅ User interactions trigger callbacks
- ✅ Loading/error states display correctly
- ✅ Store actions update state
- ❌ Don't test implementation details
- ❌ Don't test Radix UI internals

---

## Anti-Patterns to AVOID

### Code Style

```typescript
// ❌ NO default exports
export default function Component() {}

// ❌ NO inline styles
<div style={{ color: 'red' }}>

// ❌ NO any type
function process(data: any) {}

// ❌ NO console.log in production code
console.log('debug');

// ❌ NO magic numbers
if (retries > 3) {} // Use const MAX_RETRIES = 3

// ❌ NO barrel files that re-export everything
export * from './Component1';
export * from './Component2';
```

### State Management

```typescript
// ❌ NO boolean loading states
const [isLoading, setIsLoading] = useState(false);

// ❌ NO direct store mutation
store.data.push(item); // WRONG - use actions

// ❌ NO useState for server data
const [sprints, setSprints] = useState([]); // Use store instead
```

### IPC

```typescript
// ❌ NO inline invoke without error handling
const data = await invoke('get_data'); // WRONG - wrap in try/catch

// ❌ NO camelCase command names (Rust uses snake_case)
await invoke('getSprintData'); // WRONG

// ❌ NO non-namespaced events
emit('data-changed'); // WRONG - use bmad:domain:action
```

---

## File Organization

```
src/
├── components/
│   ├── ui/              # Radix-based primitives
│   ├── layout/          # App shell components
│   └── features/        # Domain-specific components
│       ├── dashboard/
│       ├── sprint/
│       ├── epic/
│       ├── story/
│       ├── agent/
│       └── command/
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores (one per domain)
├── types/               # TypeScript type definitions
├── lib/                 # Utilities and helpers
└── styles/              # Global styles
```

---

## Pre-Implementation Checklist

Before implementing any feature, verify:

- [ ] Component follows PascalCase naming
- [ ] Uses named exports only
- [ ] Test file is co-located
- [ ] Uses AsyncStatus for async states
- [ ] IPC commands use snake_case
- [ ] Events use `bmad:domain:action` format
- [ ] Error handling uses TauriError structure
- [ ] No anti-patterns present

---

## LLM CLI Prerequisite

**CRITICAL:** BmadDash requires an LLM CLI tool installed:
- Claude Code (`claude`)
- Codex (`codex`)
- Gemini (`gemini`)
- Crush (`crush`)
- OpenCode (`opencode`)

The app will check for this at startup and show onboarding if none found.

---

_Last updated: 2026-01-23 | Refer to `docs/planning-artifacts/architecture.md` for complete architectural decisions._

# Inventaire des Composants UI - BmadDash

Ce document répertorie les composants React utilisés pour construire l'interface de BmadDash, classés par domaine.

## Composants de Domaine

### Dashboard
- **Dashboard :** Vue principale affichant les statistiques globales et la grille de projets.
- **ProjectCard :** Carte interactive représentant un projet BMAD avec son avancement.
- **EmptyState :** État d'affichage lorsqu'aucun projet n'est chargé.

### Kanban (Gestion des Stories)
- **KanbanBoard :** Conteneur principal du tableau agile.
- **KanbanColumn :** Représente un statut (Backlog, In Progress, Done, etc.).
- **KanbanCard :** Carte détaillée pour une User Story, avec gestion du drag-and-drop (@dnd-kit).

### Documents & Éditeur
- **DocumentEditor :** Éditeur Markdown riche (basé sur `@uiw/react-md-editor`) permettant de modifier les documents PRD, Architecture et Stories.

### Timeline & Progrès
- **TimelineView :** Visualisation chronologique des Epics sur une échelle de temps.
- **Progress :** Indicateurs visuels de progression circulaire ou linéaire (Radix UI).

### Mise en Page (Layout)
- **Sidebar :** Barre latérale de navigation entre les projets et les différentes vues.

## Bibliothèque UI de Base (Atomiques)
Basés sur **Radix UI** et stylisés avec **Tailwind CSS**, ces composants sont situés dans `src/components/ui/` :

- **Boutons :** `Button`, `Badge`
- **Conteneurs :** `Card`, `Separator`, `ScrollArea`
- **Formulaires :** `Input`, `Textarea`
- **Navigation :** `Tabs`, `DropdownMenu`
- **Feedback :** `Tooltip`, `Dialog` (Modales), `Progress`

## Système de Design & Styles
- **Framework :** Tailwind CSS 4.
- **Typographie :** Définit via les utilitaires CSS classiques.
- **Icônes :** Lucide React.
- **Animations :** Transitions Tailwind et support spécifique pour les modales Radix.

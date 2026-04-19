# MindDrop

MindDrop is an AI-assisted task management workspace that combines a kanban board, planning view, focus mode, meeting capture, and voice-driven task creation.

It is designed as a personal productivity app rather than a generic to-do list: tasks have priorities, tags, deadlines, reminders, and multiple ways to get from raw input to actionable work.

## What it does

- Manages tasks across board columns such as To Do, In Progress, and Done
- Supports priorities, deadlines, tags, reminders, and task search
- Includes a planning / timeline view in addition to the board
- Adds a dedicated focus mode for working on one task at a time
- Includes a meeting workflow that can turn meeting outputs into tasks
- Includes a voice assistant flow that can create tasks in batches
- Works with Firebase when configured, and falls back to local storage for guest / local usage

## Main Views

- `Board` — kanban-style task management
- `Timeline` — planning-oriented task view
- `Minutes` — meeting-oriented workflow
- `Focus Mode` — isolated execution view for the current task
- `Voice Assistant` — voice-driven capture and task generation

## Quick Start

Prerequisites:
- Node.js
- Optional Firebase configuration if you want cloud sync and authentication

Run locally:

```bash
npm install
npm run dev
```

If Firebase is not configured, the app can still run in local / guest mode using browser storage.

## Project Structure

- `App.tsx` — application shell, filters, keyboard shortcuts, auth/bootstrap flow
- `components/` — task cards, modals, planning view, focus mode, meeting studio, voice assistant
- `services/firebase` — auth and persistence layer
- `types` — tasks, priorities, columns, tags

## Status

Prototype with substantial product surface already in place. The core experience is more advanced than a basic to-do app, but it still reads as a personal productivity product under active iteration rather than a finished SaaS.

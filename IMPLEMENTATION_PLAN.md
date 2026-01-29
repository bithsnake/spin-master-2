# Plan: Event-Driven Refactor

Draft plan to convert the game from state-loop driven to event-driven updates, using a lightweight event bus and explicit events for spin, UI, and audio. This keeps the game logic modular, reduces direct cross-module state mutation, and centralizes side effects.

## Steps

1. Inventory current state flow in `main.ts`, `class-library.ts`, and `button-class-actions.ts`.
2. Add a typed event bus in a new utility file and define event payloads.
3. Refactor spin flow in `class-library.ts` to emit `SPIN/*` and `WIN/*` events.
4. Replace direct UI updates in `main.ts` with event subscriptions updating `UIGeneralText`.
5. Refactor audio in `soundLibrary.ts` and `main.ts` to subscribe to `SOUND/*` and `UI/TOGGLE_MUSIC`.
6. Update instance creation in `instance-create-factory.ts` to register event listeners once and remove per-tick manual updates.

## Further Considerations

- Event names and payload shape: keep minimal or add rich payloads?
- Should `GlobalState` remain a central store or be split into modules?
- Keep `TICK` event or move to discrete events only?

## Next Step

Reply with approval or changes.

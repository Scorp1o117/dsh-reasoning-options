# v0.5.0 validation — 2026-10-12

- Full npm test passed (20 named tests plus reconciliation assertions).
- Packed plugin started using the installed DSH Desktop 0.2.0-rc.2 carrier in an isolated Desktop-compatible profile.
- Browser configuration changed a provider from high to Default; the selection persisted and the route reasoning override was removed.
- Real packaged pi-ai adapter against a local HTTP fixture: Default omitted reasoning_effort, explicit High sent high, and an explicitly non-reasoning model returned text with no effort field.
- Existing configured route defaults are preserved until the user selects Default; explicit session efforts must also be cleared in the model menu.

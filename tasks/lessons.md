# Lessons

- Keep repository creation, authentication, cloning, and filesystem permissions as separate checks so a failure in one layer is not misdiagnosed as another.
- Preserve the user’s core constraint: this is a personal, preset-plan tool, not a commercial or generative coaching platform.
- Confirm the visual palette early and treat explicit color direction as a system-wide decision covering UI tokens, PWA metadata, icons, and social assets.
- Before pushing a deployment build, verify it from a clean dependency install and run an uncached TypeScript check so undeclared ambient types cannot be hidden by local state.

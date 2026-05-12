// Re-exports for the shadcn-style components in this folder.
// Note: the lowercase shadcn primitives (button.tsx, card.tsx) live next to
// their capitalised siblings under ../ — those are the ones the rest of the
// app uses. This barrel only re-exports the layout helpers used by the
// landing page.
export { Container, Section, SectionHeader } from "./Layout";

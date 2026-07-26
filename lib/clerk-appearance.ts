import { experimental_createTheme } from "@clerk/themes";

// Binds Clerk's UI to this app's own CSS variables (app/globals.css) instead of
// duplicating hex literals here, so Clerk automatically tracks the design system —
// same approach as @clerk/themes' own "shadcn" preset, just pointed at our token
// names. The `--color-*` variables (not the bare `--card`/`--primary` etc.) are the
// ones already wrapped in hsl(...) by the @theme block, so they resolve as valid
// CSS colors when referenced via var().
export const clerkAppearance = experimental_createTheme({
  name: "erasight",
  cssLayerName: "components",
  variables: {
    colorPrimary: "var(--color-primary)",
    colorPrimaryForeground: "var(--color-primary-foreground)",
    colorBackground: "var(--color-card)",
    colorForeground: "var(--color-card-foreground)",
    colorInput: "var(--color-input)",
    colorInputForeground: "var(--color-card-foreground)",
    colorMuted: "var(--color-muted)",
    colorMutedForeground: "var(--color-muted-foreground)",
    colorNeutral: "var(--color-foreground)",
    colorDanger: "var(--color-destructive)",
    colorRing: "var(--color-ring)",
    borderRadius: "var(--radius)",
  },
  elements: {
    cardBox: "shadow-sm border border-border",
    popoverBox: "shadow-sm border border-border",
  },
});

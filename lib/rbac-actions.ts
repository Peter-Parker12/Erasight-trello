// Single source of truth for RBAC action strings. The Role editor UI imports
// RBAC_ACTION_SUGGESTIONS/RBAC_ACTION_GROUPS for autocomplete suggestions;
// enforcement call sites import the named ACTIONS constants so a raw string
// never has to be typed (and re-typed) at the check site. Admins may still
// type ad-hoc strings in the UI beyond this list — this file only curates
// the *suggested* set.

export const ACTIONS = {
  BOARD_CREATE: "board:create",
  BOARD_MEMBERS_MANAGE: "board:manage_members",
  BOARD_TELEGRAM_MANAGE: "board:manage_telegram",
  BOARD_AI_CONFIG_MANAGE: "board:manage_ai_config",
  BOARD_TRANSITION_RULES_MANAGE: "board:manage_transition_rules",
  CRM_CUSTOM_FIELDS_MANAGE: "crm:manage_custom_fields",
  ORG_API_KEYS_MANAGE: "org:manage_api_keys",
  REVIEW_PARTNERS_MANAGE: "review:manage_partners",
  REVIEW_SKILLS_MANAGE: "review:manage_skills",
} as const;

export type RbacActionValue = (typeof ACTIONS)[keyof typeof ACTIONS];

export const RBAC_ACTION_GROUPS: { label: string; actions: RbacActionValue[] }[] = [
  {
    label: "Boards",
    actions: [
      ACTIONS.BOARD_CREATE,
      ACTIONS.BOARD_MEMBERS_MANAGE,
      ACTIONS.BOARD_AI_CONFIG_MANAGE,
      ACTIONS.BOARD_TRANSITION_RULES_MANAGE,
    ],
  },
  { label: "Telegram", actions: [ACTIONS.BOARD_TELEGRAM_MANAGE] },
  { label: "CRM", actions: [ACTIONS.CRM_CUSTOM_FIELDS_MANAGE] },
  { label: "Organization", actions: [ACTIONS.ORG_API_KEYS_MANAGE] },
  { label: "AI Review", actions: [ACTIONS.REVIEW_PARTNERS_MANAGE, ACTIONS.REVIEW_SKILLS_MANAGE] },
];

// Flat list for simple substring-filter autocomplete in the chip input.
export const RBAC_ACTION_SUGGESTIONS: RbacActionValue[] = RBAC_ACTION_GROUPS.flatMap(
  (g) => g.actions
);

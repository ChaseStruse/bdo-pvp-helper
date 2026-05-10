/**
 * Guide tree configuration.
 * Drives the sidebar navigation and maps URL slugs to markdown files.
 *
 * To add a new guide: add an entry here — the sidebar and routes
 * are automatically generated from this structure.
 */

export interface GuideTopic {
  label: string;
  /** Path relative to class_guides/ */
  file: string;
}

export interface GuideSection {
  label: string;
  topics: Record<string, GuideTopic>;
}

export interface GuideSpec {
  label: string;
  sections: Record<string, GuideSection>;
}

export interface GuideClass {
  label: string;
  icon: string;
  specs: Record<string, GuideSpec>;
}

export const GUIDE_TREE: Record<string, GuideClass> = {
  ninja: {
    label: 'Ninja',
    icon: '🥷',
    specs: {
      awakening: {
        label: 'Awakening',
        sections: {
          pvp: {
            label: 'PvP',
            topics: {
              combos: {
                label: 'Combos',
                file: 'ninja/awakening/ninja_awakening_combos_pvp.md',
              },
            },
          },
        },
      },
      succession: {
        label: 'Succession',
        sections: {
          pvp: {
            label: 'PvP',
            topics: {
              combos: {
                label: 'Combos',
                file: 'ninja/succession/ninja_succession_combos_pvp.md',
              },
            },
          },
        },
      },
    },
  },
  maegu: {
    label: 'Maegu',
    icon: '🦊',
    specs: {
      awakening: {
        label: 'Awakening',
        sections: {
          pvp: {
            label: 'PvP',
            topics: {
              combos: {
                label: 'Combos',
                file: 'maegu/awakening/maegu_awakening_combos_pvp.md',
              },
            },
          },
        },
      },
      succession: {
        label: 'Succession',
        sections: {
          pvp: {
            label: 'PvP',
            topics: {
              combos: {
                label: 'Combos',
                file: 'maegu/succession/maegu_succession_combos_pvp.md',
              },
            },
          },
        },
      },
    },
  },
};

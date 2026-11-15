export type Language = 'vi' | 'en';

export type ElementId =
  | 'aqua'
  | 'ignis'
  | 'vitae'
  | 'lunar'
  | 'frost_pearl'
  | 'solar_core'
  | 'mandrake_heart'
  | 'astral_prism'
  | 'steam_vapor'
  | 'nectar_dew'
  | 'wildfire_amber'
  | 'tideweaver_tears'
  | 'eclipse_starfire'
  | 'dreamspore_spirit'
  | 'philosopher_stone';

export interface ElementDef {
  id: ElementId;
  tier: 1 | 2 | 3;
  symbol: string;
  name: { vi: string; en: string };
  desc: { vi: string; en: string };
  color: string;
  glowColor: string;
  coreColor: string;
  radius: number;
  baseValue: number;
  gravityScale: number;
  bounciness: number;
  specialEffect?: 'floaty' | 'energize_pegs' | 'shockwave' | 'triple_peg' | 'magnet_gold' | 'philosopher';
}

export interface RecipeDef {
  id: string;
  ingA: ElementId;
  ingB: ElementId;
  result: ElementId;
  hint: { vi: string; en: string };
}

export interface Orb {
  uid: number;
  elementId: ElementId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  angularVel: number;
  bounceCount: number;
  accumulatedGold: number;
  multiplier: number;
  age: number;
  settlingTimer: number;
  mergeCooldown: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
  eyesBlinkTimer: number;
}

export type PegType = 'crystal' | 'bumper' | 'multiplier' | 'catalyst';

export interface Peg {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  type: PegType;
  hitScale: number;
  glowIntensity: number;
  energizedTimer: number;
  orbitPhase: number;
  noteIndex: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'spark' | 'ring';
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
}

export interface VisitorOrder {
  id: string;
  visitorName: { vi: string; en: string };
  visitorTitle: { vi: string; en: string };
  portraitGlyph: string;
  dialogue: { vi: string; en: string };
  thankYou: { vi: string; en: string };
  requiredElements: ElementId[];
  goldReward: number;
  reputationReward: number;
  minNight: number;
}

export interface UpgradeLevels {
  pegCount: number;       // Adds more resonance crystal pegs inside the alembic
  pegPurity: number;      // Increases base gold per peg bounce
  bumperForge: number;    // Converts/adds high-restitution alchemy bumpers & multiplier gates
  vialCapacity: number;   // Max active drops / faster refill
  homunculusIdle: number; // Auto-dropper familiar speed
}

export interface SaveState {
  gold: number;
  totalGoldEarned: number;
  night: number;
  ordersCompletedInNight: number;
  ordersCompletedTotal: number;
  reputation: number;
  selectedElement: ElementId;
  inventory: Partial<Record<ElementId, number>>;
  discoveredElements: ElementId[];
  discoveredRecipes: string[];
  upgrades: UpgradeLevels;
  supporterUnlocked: boolean;
  goldenThemeActive: boolean;
  language: Language;
  soundEnabled: boolean;
  rainEnabled: boolean;
}


import { BASE_ELEMENTS, ELEMENTS } from '../data/elements';
import { VISITOR_ORDERS } from '../data/visitors';
import { ElementId, Language, SaveState, UpgradeLevels, VisitorOrder } from './types';

const SAVE_KEY = 'nocturne_alembic_save_v1';

export function createDefaultState(): SaveState {
  return {
    gold: 60,
    totalGoldEarned: 60,
    night: 1,
    ordersCompletedInNight: 0,
    ordersCompletedTotal: 0,
    reputation: 0,
    selectedElement: 'aqua',
    inventory: {
      steam_vapor: 0
    },
    discoveredElements: [...BASE_ELEMENTS],
    discoveredRecipes: [],
    upgrades: {
      pegCount: 1,
      pegPurity: 1,
      bumperForge: 0,
      vialCapacity: 1,
      homunculusIdle: 0
    },
    supporterUnlocked: false,
    goldenThemeActive: false,
    language: 'vi',
    soundEnabled: true,
    rainEnabled: true
  };
}

export class StateManager {
  public state: SaveState;
  public currentOrder: VisitorOrder;
  public maxDrops: number = 6;
  public currentDrops: number = 6;
  public dropRefillProgress: number = 0; // 0..1
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadState();
    this.recalculateDropCap();
    this.currentDrops = this.maxDrops;
    this.currentOrder = this.pickVisitorOrder();
  }

  private loadState(): SaveState {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveState>;
        const def = createDefaultState();
        return {
          ...def,
          ...parsed,
          upgrades: { ...def.upgrades, ...(parsed.upgrades || {}) },
          inventory: { ...(parsed.inventory || {}) },
          discoveredElements: parsed.discoveredElements?.length ? parsed.discoveredElements : def.discoveredElements,
          discoveredRecipes: parsed.discoveredRecipes || []
        };
      }
    } catch {
      // Fallback to default state
    }
    return createDefaultState();
  }

  public save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage quota issues
    }
    this.notify();
  }

  public resetSave(): void {
    const lang = this.state.language;
    const supporter = this.state.supporterUnlocked;
    this.state = createDefaultState();
    this.state.language = lang;
    this.state.supporterUnlocked = supporter;
    if (supporter) {
      this.state.gold += 500;
    }
    this.recalculateDropCap();
    this.currentDrops = this.maxDrops;
    this.currentOrder = this.pickVisitorOrder();
    this.save();
  }

  public onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  public notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public recalculateDropCap(): void {
    this.maxDrops = 5 + this.state.upgrades.vialCapacity * 2;
    if (this.currentDrops > this.maxDrops) {
      this.currentDrops = this.maxDrops;
    }
  }

  public getRefillRatePerSec(): number {
    return 0.48 + this.state.upgrades.vialCapacity * 0.14;
  }

  public tickRefill(dt: number): boolean {
    if (this.currentDrops >= this.maxDrops) {
      this.dropRefillProgress = 0;
      return false;
    }
    this.dropRefillProgress += dt * this.getRefillRatePerSec();
    if (this.dropRefillProgress >= 1) {
      this.dropRefillProgress -= 1;
      this.currentDrops = Math.min(this.maxDrops, this.currentDrops + 1);
      this.notify();
      return true;
    }
    return false;
  }

  public addGold(amount: number): void {
    if (amount <= 0) return;
    this.state.gold += Math.round(amount);
    this.state.totalGoldEarned += Math.round(amount);
    this.save();
  }

  public spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    this.save();
    return true;
  }

  public discoverElement(elId: ElementId, recipeId?: string): boolean {
    let isNew = false;
    if (!this.state.discoveredElements.includes(elId)) {
      this.state.discoveredElements.push(elId);
      isNew = true;
    }
    if (recipeId && !this.state.discoveredRecipes.includes(recipeId)) {
      this.state.discoveredRecipes.push(recipeId);
      isNew = true;
    }
    if (isNew) {
      this.save();
    }
    return isNew;
  }

  public addPotionToShelf(elId: ElementId, bonusGold = 0): void {
    const cur = this.state.inventory[elId] || 0;
    this.state.inventory[elId] = cur + 1;
    if (bonusGold > 0) {
      this.state.gold += Math.round(bonusGold);
      this.state.totalGoldEarned += Math.round(bonusGold);
    }
    this.discoverElement(elId);
    this.save();
  }

  public canFulfillCurrentOrder(): boolean {
    const counts: Partial<Record<ElementId, number>> = {};
    for (const req of this.currentOrder.requiredElements) {
      counts[req] = (counts[req] || 0) + 1;
    }
    for (const [elId, needed] of Object.entries(counts)) {
      const owned = this.state.inventory[elId as ElementId] || 0;
      if (owned < (needed || 1)) return false;
    }
    return true;
  }

  public fulfillCurrentOrder(): { goldEarned: number; nightFinished: boolean } | null {
    if (!this.canFulfillCurrentOrder()) return null;

    for (const req of this.currentOrder.requiredElements) {
      const cur = this.state.inventory[req] || 0;
      this.state.inventory[req] = Math.max(0, cur - 1);
    }

    const goldEarned = this.currentOrder.goldReward;
    this.state.gold += goldEarned;
    this.state.totalGoldEarned += goldEarned;
    this.state.reputation += this.currentOrder.reputationReward;
    this.state.ordersCompletedInNight += 1;
    this.state.ordersCompletedTotal += 1;

    const ordersPerNight = 3;
    const nightFinished = this.state.ordersCompletedInNight >= ordersPerNight;

    this.currentOrder = this.pickVisitorOrder(this.currentOrder.id);
    this.save();
    return { goldEarned, nightFinished };
  }

  public advanceToNextNight(): void {
    this.state.night += 1;
    this.state.ordersCompletedInNight = 0;
    this.currentDrops = this.maxDrops;
    this.currentOrder = this.pickVisitorOrder();
    this.save();
  }

  public sellSinglePotion(elId: ElementId): number {
    const count = this.state.inventory[elId] || 0;
    if (count <= 0) return 0;
    this.state.inventory[elId] = count - 1;
    const val = ELEMENTS[elId].baseValue;
    this.addGold(val);
    return val;
  }

  public sellSurplusPotions(): number {
    // Sells potions not required by the active visitor order
    const neededMap: Partial<Record<ElementId, number>> = {};
    for (const req of this.currentOrder.requiredElements) {
      neededMap[req] = (neededMap[req] || 0) + 1;
    }

    let totalGain = 0;
    for (const [key, qty] of Object.entries(this.state.inventory)) {
      const elId = key as ElementId;
      const keep = neededMap[elId] || 0;
      const sellable = Math.max(0, (qty || 0) - keep);
      if (sellable > 0) {
        totalGain += sellable * ELEMENTS[elId].baseValue;
        this.state.inventory[elId] = keep;
      }
    }

    if (totalGain > 0) {
      this.addGold(totalGain);
    }
    return totalGain;
  }

  public pickVisitorOrder(excludeId?: string): VisitorOrder {
    const eligible = VISITOR_ORDERS.filter(
      (o) => o.minNight <= Math.max(1, this.state.night) && o.id !== excludeId
    );
    const pool = eligible.length > 0 ? eligible : VISITOR_ORDERS;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  public getUpgradeCost(key: keyof UpgradeLevels): number {
    const lvl = this.state.upgrades[key];
    switch (key) {
      case 'pegCount':
        return Math.round(30 * Math.pow(1.55, lvl - 1));
      case 'pegPurity':
        return Math.round(35 * Math.pow(1.6, lvl - 1));
      case 'bumperForge':
        return Math.round(45 * Math.pow(1.7, lvl));
      case 'vialCapacity':
        return Math.round(40 * Math.pow(1.6, lvl - 1));
      case 'homunculusIdle':
        return Math.round(75 * Math.pow(1.8, lvl));
    }
  }

  public getUpgradeMaxLevel(key: keyof UpgradeLevels): number {
    switch (key) {
      case 'pegCount':
        return 7;
      case 'pegPurity':
        return 8;
      case 'bumperForge':
        return 5;
      case 'vialCapacity':
        return 6;
      case 'homunculusIdle':
        return 4;
    }
  }

  public purchaseUpgrade(key: keyof UpgradeLevels): boolean {
    const lvl = this.state.upgrades[key];
    const max = this.getUpgradeMaxLevel(key);
    if (lvl >= max) return false;
    const cost = this.getUpgradeCost(key);
    if (!this.spendGold(cost)) return false;

    this.state.upgrades[key] = lvl + 1;
    if (key === 'vialCapacity') {
      this.recalculateDropCap();
      this.currentDrops = this.maxDrops;
    }
    this.save();
    return true;
  }

  public unlockSupporterEdition(): void {
    if (!this.state.supporterUnlocked) {
      this.state.supporterUnlocked = true;
      this.state.goldenThemeActive = true;
      this.state.gold += 500;
      this.state.totalGoldEarned += 500;
      if (this.state.upgrades.homunculusIdle === 0) {
        this.state.upgrades.homunculusIdle = 1;
      }
      this.save();
    }
  }

  public toggleLanguage(): Language {
    this.state.language = this.state.language === 'vi' ? 'en' : 'vi';
    this.save();
    return this.state.language;
  }
}


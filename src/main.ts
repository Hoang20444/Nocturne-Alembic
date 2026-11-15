import { sound } from './audio';
import { ALL_ELEMENT_IDS, BASE_ELEMENTS, ELEMENTS, RECIPES } from './data/elements';
import { AlembicEngine } from './game/Engine';
import { StateManager } from './game/StateManager';
import { ElementId, UpgradeLevels } from './game/types';
import { t } from './i18n';

// Initialize State & Engine
const stateMgr = new StateManager();
const canvas = document.getElementById('alembic-canvas') as HTMLCanvasElement;
const discoveryToast = document.getElementById('discovery-toast') as HTMLDivElement;

let toastTimeout: number | null = null;
function showDiscoveryToast(name: string, symbol: string): void {
  const lang = stateMgr.state.language;
  discoveryToast.textContent = `${t(lang, 'newDiscoveryToast')} ${symbol} ${name}`;
  discoveryToast.hidden = false;
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    discoveryToast.hidden = true;
  }, 3200);
}

const engine = new AlembicEngine(canvas, stateMgr, showDiscoveryToast);

// Apply persisted sound & theme preferences
sound.setSoundEnabled(stateMgr.state.soundEnabled);
sound.setRainEnabled(stateMgr.state.rainEnabled);
document.body.classList.toggle('golden-theme', stateMgr.state.goldenThemeActive);

// Mandatory fallback for browsers without native <dialog closedby="any"> support (modern-web-guidance)
if (!('closedBy' in HTMLDialogElement.prototype)) {
  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]')) {
    let pressedOutside = false;
    const outside = (e: PointerEvent, dlg: HTMLDialogElement) => {
      const r = dlg.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    dialog.addEventListener('pointerdown', (e) => {
      pressedOutside = outside(e, dialog);
    });
    dialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && outside(e, dialog)) {
        dialog.close();
      }
    });
  }
}

// DOM References
const elSubtitle = document.getElementById('ui-subtitle')!;
const lblNight = document.getElementById('lbl-night')!;
const valNight = document.getElementById('val-night')!;
const lblGold = document.getElementById('lbl-gold')!;
const valGold = document.getElementById('val-gold')!;
const lblRep = document.getElementById('lbl-rep')!;
const valRep = document.getElementById('val-rep')!;
const lblDrops = document.getElementById('lbl-drops')!;
const valDrops = document.getElementById('val-drops')!;
const refillBarFill = document.getElementById('refill-bar-fill')!;

const btnGrimoire = document.getElementById('btn-grimoire') as HTMLButtonElement;
const btnSupporter = document.getElementById('btn-supporter') as HTMLButtonElement;
const btnLang = document.getElementById('btn-lang') as HTMLButtonElement;
const btnAudio = document.getElementById('btn-audio') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;

const hdrVisitor = document.getElementById('hdr-visitor')!;
const visitorProgress = document.getElementById('visitor-progress')!;
const visitorGlyph = document.getElementById('visitor-glyph')!;
const visitorName = document.getElementById('visitor-name')!;
const visitorTitle = document.getElementById('visitor-title')!;
const visitorDialogue = document.getElementById('visitor-dialogue')!;
const lblOrderReq = document.getElementById('lbl-order-req')!;
const valOrderReward = document.getElementById('val-order-reward')!;
const orderReqList = document.getElementById('order-req-list')!;
const btnDeliver = document.getElementById('btn-deliver') as HTMLButtonElement;
const btnSkipVisitor = document.getElementById('btn-skip-visitor') as HTMLButtonElement;

const hdrShelf = document.getElementById('hdr-shelf')!;
const btnSellSurplus = document.getElementById('btn-sell-surplus') as HTMLButtonElement;
const potionShelfGrid = document.getElementById('potion-shelf-grid')!;

const btnHarvestAll = document.getElementById('btn-harvest-all') as HTMLButtonElement;
const hdrElementSelect = document.getElementById('hdr-element-select')!;
const txtDropHint = document.getElementById('txt-drop-hint')!;
const elementSelectorRow = document.getElementById('element-selector-row')!;

const hdrForge = document.getElementById('hdr-forge')!;
const upgradesList = document.getElementById('upgrades-list')!;
const quickRecipeList = document.getElementById('quick-recipe-list')!;

// Dialogs
const grimoireDialog = document.getElementById('grimoire-dialog') as HTMLDialogElement;
const supporterDialog = document.getElementById('supporter-dialog') as HTMLDialogElement;
const nightCompleteDialog = document.getElementById('night-complete-dialog') as HTMLDialogElement;

function renderAllUI(): void {
  const s = stateMgr.state;
  const lang = s.language;
  document.documentElement.lang = lang;

  // Topbar
  elSubtitle.textContent = t(lang, 'gameSubtitle');
  lblNight.textContent = t(lang, 'nightLabel');
  valNight.textContent = s.supporterUnlocked
    ? `${String(s.night).padStart(2, '0')} (${t(lang, 'endlessMode')})`
    : `${String(s.night).padStart(2, '0')} / 03`;

  lblGold.textContent = t(lang, 'goldLabel');
  valGold.textContent = `${s.gold}g`;
  lblRep.textContent = t(lang, 'reputationLabel');
  valRep.textContent = `${s.reputation}`;
  lblDrops.textContent = t(lang, 'dropsReady');
  valDrops.textContent = `${stateMgr.currentDrops} / ${stateMgr.maxDrops}`;

  btnGrimoire.textContent = t(lang, 'grimoireBtn');
  btnSupporter.textContent = s.supporterUnlocked ? t(lang, 'supporterActiveBtn') : t(lang, 'supporterBtn');
  btnLang.textContent = lang.toUpperCase();
  btnAudio.textContent = s.soundEnabled ? '🔊' : '🔇';
  btnReset.title = t(lang, 'resetBtn');

  // Visitor Panel
  hdrVisitor.textContent = t(lang, 'visitorHeader');
  visitorProgress.textContent = `${s.ordersCompletedInNight + 1} / 3`;
  const order = stateMgr.currentOrder;
  visitorGlyph.textContent = order.portraitGlyph;
  visitorName.textContent = order.visitorName[lang];
  visitorTitle.textContent = order.visitorTitle[lang];
  visitorDialogue.textContent = order.dialogue[lang];
  lblOrderReq.textContent = t(lang, 'orderRequires');
  valOrderReward.textContent = `+${order.goldReward}g`;

  orderReqList.innerHTML = '';
  const neededCount: Partial<Record<ElementId, number>> = {};
  for (const reqId of order.requiredElements) {
    neededCount[reqId] = (neededCount[reqId] || 0) + 1;
  }

  for (const [elKey, needed] of Object.entries(neededCount)) {
    const elId = elKey as ElementId;
    const def = ELEMENTS[elId];
    const owned = s.inventory[elId] || 0;
    const isReady = owned >= (needed || 1);

    const chip = document.createElement('span');
    chip.className = `req-chip${isReady ? ' ready' : ''}`;
    chip.textContent = `${def.symbol} ${def.name[lang]} (${owned}/${needed})`;
    orderReqList.appendChild(chip);
  }

  btnDeliver.textContent = t(lang, 'deliverBtn');
  btnDeliver.disabled = !stateMgr.canFulfillCurrentOrder();
  btnSkipVisitor.textContent = t(lang, 'skipVisitorBtn');
  btnSkipVisitor.disabled = s.gold < 10;

  // Distilled Potion Shelf
  hdrShelf.textContent = t(lang, 'shelfHeader');
  btnSellSurplus.textContent = t(lang, 'sellSurplusBtn');
  renderPotionShelf();

  // Center Stage Controls
  btnHarvestAll.textContent = t(lang, 'harvestAllBtn');
  hdrElementSelect.textContent = t(lang, 'elementSelectHeader');
  txtDropHint.textContent = t(lang, 'dropHint');
  renderElementSelectorBelt();

  // Right Panel: Upgrades & Quick Recipes
  hdrForge.textContent = t(lang, 'forgeHeader');
  renderUpgradesList();
  renderQuickRecipes();

  // Sync theme class
  document.body.classList.toggle('golden-theme', s.goldenThemeActive);
}

function renderPotionShelf(): void {
  const s = stateMgr.state;
  const lang = s.language;
  potionShelfGrid.innerHTML = '';

  const entries = Object.entries(s.inventory).filter(([, qty]) => (qty || 0) > 0);
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'shelf-empty-msg';
    empty.textContent = t(lang, 'shelfEmpty');
    potionShelfGrid.appendChild(empty);
    return;
  }

  for (const [key, qty] of entries) {
    const elId = key as ElementId;
    const def = ELEMENTS[elId];

    const card = document.createElement('div');
    card.className = 'shelf-item-card';

    const info = document.createElement('div');
    info.className = 'shelf-item-info';
    info.innerHTML = `<span>${def.symbol}</span><span class="shelf-item-name" title="${def.name[lang]}">${def.name[lang]} x${qty}</span>`;

    const sellBtn = document.createElement('button');
    sellBtn.type = 'button';
    sellBtn.className = 'shelf-sell-btn';
    sellBtn.textContent = `+${def.baseValue}g`;
    sellBtn.addEventListener('click', () => {
      sound.playUiChirp(1.15);
      stateMgr.sellSinglePotion(elId);
      sellBtn.blur();
    });

    card.append(info, sellBtn);
    potionShelfGrid.appendChild(card);
  }
}

function renderElementSelectorBelt(): void {
  const s = stateMgr.state;
  const lang = s.language;
  elementSelectorRow.innerHTML = '';

  BASE_ELEMENTS.forEach((elId, idx) => {
    const def = ELEMENTS[elId];
    const isLunarLocked = elId === 'lunar' && s.night < 2 && !s.supporterUnlocked;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `element-select-btn${s.selectedElement === elId ? ' active' : ''}`;
    btn.disabled = isLunarLocked;

    const keyLabel = isLunarLocked
      ? lang === 'vi'
        ? 'Mở ở Đêm 2'
        : 'Night 2'
      : `[${idx + 1}] ${def.baseValue}g`;

    btn.innerHTML = `
      <span class="el-btn-icon">${def.symbol}</span>
      <div class="el-btn-meta">
        <span class="el-btn-name">${def.name[lang]}</span>
        <span class="el-btn-key">${keyLabel}</span>
      </div>
    `;

    btn.addEventListener('click', () => {
      sound.playUiChirp(1.0);
      stateMgr.state.selectedElement = elId;
      stateMgr.save();
      btn.blur();
    });

    elementSelectorRow.appendChild(btn);
  });
}

function renderUpgradesList(): void {
  const s = stateMgr.state;
  const lang = s.language;
  upgradesList.innerHTML = '';

  const upgradeConfigs: Array<{
    key: keyof UpgradeLevels;
    icon: string;
    nameKey: 'upgPegCountName' | 'upgPegPurityName' | 'upgBumperForgeName' | 'upgVialCapName' | 'upgHomunculusName';
    descKey: 'upgPegCountDesc' | 'upgPegPurityDesc' | 'upgBumperForgeDesc' | 'upgVialCapDesc' | 'upgHomunculusDesc';
  }> = [
    { key: 'pegCount', icon: '💎', nameKey: 'upgPegCountName', descKey: 'upgPegCountDesc' },
    { key: 'pegPurity', icon: '✨', nameKey: 'upgPegPurityName', descKey: 'upgPegPurityDesc' },
    { key: 'bumperForge', icon: '⚡', nameKey: 'upgBumperForgeName', descKey: 'upgBumperForgeDesc' },
    { key: 'vialCapacity', icon: '🧪', nameKey: 'upgVialCapName', descKey: 'upgVialCapDesc' },
    { key: 'homunculusIdle', icon: '🧚', nameKey: 'upgHomunculusName', descKey: 'upgHomunculusDesc' }
  ];

  for (const cfg of upgradeConfigs) {
    const lvl = s.upgrades[cfg.key];
    const max = stateMgr.getUpgradeMaxLevel(cfg.key);
    const cost = stateMgr.getUpgradeCost(cfg.key);
    const isMax = lvl >= max;

    const card = document.createElement('div');
    card.className = 'upgrade-card';

    const info = document.createElement('div');
    info.className = 'upg-info';
    info.innerHTML = `
      <div class="upg-title-row">
        <span>${cfg.icon}</span>
        <span class="upg-name">${t(lang, cfg.nameKey)}</span>
        <span class="upg-lvl-badge">Lv.${lvl}/${max}</span>
      </div>
      <p class="upg-desc">${t(lang, cfg.descKey)}</p>
    `;

    const buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = 'upg-buy-btn';
    buyBtn.disabled = isMax || s.gold < cost;
    buyBtn.textContent = isMax ? 'MAX' : `${cost}g`;

    buyBtn.addEventListener('click', () => {
      if (stateMgr.purchaseUpgrade(cfg.key)) {
        sound.playOrderComplete();
        engine.rebuildPegConstellation();
      }
      buyBtn.blur();
    });

    card.append(info, buyBtn);
    upgradesList.appendChild(card);
  }
}

function renderQuickRecipes(): void {
  const lang = stateMgr.state.language;
  const titleEl = document.getElementById('quick-recipe-title')!;
  titleEl.textContent = lang === 'vi' ? '⚗️ Công Thức Pha Chế Nhanh' : '⚗️ Quick Synthesis Formulas';

  quickRecipeList.innerHTML = '';
  for (const r of RECIPES.slice(0, 10)) {
    const a = ELEMENTS[r.ingA];
    const b = ELEMENTS[r.ingB];
    const res = ELEMENTS[r.result];

    const pill = document.createElement('div');
    pill.className = 'quick-recipe-pill';
    pill.title = `${a.name[lang]} + ${b.name[lang]} = ${res.name[lang]}`;
    pill.innerHTML = `
      <span>${a.symbol} + ${b.symbol}</span>
      <strong>➔ ${res.symbol} ${res.name[lang]}</strong>
    `;
    quickRecipeList.appendChild(pill);
  }
}

function populateGrimoireDialog(): void {
  const s = stateMgr.state;
  const lang = s.language;

  document.getElementById('grimoire-dialog-title')!.textContent = t(lang, 'grimoireTitle');
  document.getElementById('grimoire-dialog-sub')!.textContent = t(lang, 'grimoireSub');
  document.getElementById('btn-close-grimoire')!.textContent = t(lang, 'closeBtn');
  document.getElementById('tab-recipes-title')!.textContent = `${t(lang, 'recipesTab')} (${s.discoveredRecipes.length}/${RECIPES.length})`;
  document.getElementById('tab-elements-title')!.textContent = `${t(lang, 'discoveredTab')} (${s.discoveredElements.length}/${ALL_ELEMENT_IDS.length})`;

  const recipesGrid = document.getElementById('grimoire-recipes-grid')!;
  const elementsGrid = document.getElementById('grimoire-elements-grid')!;
  recipesGrid.innerHTML = '';
  elementsGrid.innerHTML = '';

  for (const r of RECIPES) {
    const unlocked = s.discoveredRecipes.includes(r.id) || s.supporterUnlocked;
    const ingA = ELEMENTS[r.ingA];
    const ingB = ELEMENTS[r.ingB];
    const res = ELEMENTS[r.result];

    const row = document.createElement('div');
    row.className = `grimoire-row-card${unlocked ? '' : ' locked'}`;
    row.innerHTML = `
      <div class="grimoire-formula">
        ${ingA.symbol} ${ingA.name[lang]} + ${ingB.symbol} ${ingB.name[lang]} ➔
        ${unlocked ? `${res.symbol} ${res.name[lang]}` : t(lang, 'undiscovered')}
      </div>
      <div class="grimoire-hint">${r.hint[lang]}</div>
    `;
    recipesGrid.appendChild(row);
  }

  for (const elId of ALL_ELEMENT_IDS) {
    const def = ELEMENTS[elId];
    const unlocked = s.discoveredElements.includes(elId) || s.supporterUnlocked;

    const row = document.createElement('div');
    row.className = `grimoire-row-card${unlocked ? '' : ' locked'}`;
    row.innerHTML = `
      <div class="grimoire-formula">
        ${unlocked ? `${def.symbol} ${def.name[lang]} (Tier ${def.tier} • ${def.baseValue}g)` : `❔ ${t(lang, 'undiscovered')}`}
      </div>
      <div class="grimoire-hint">${unlocked ? def.desc[lang] : 'Hãy thử kết hợp các nguyên tố trong bình để khám phá.'}</div>
    `;
    elementsGrid.appendChild(row);
  }
}

function populateSupporterDialog(): void {
  const s = stateMgr.state;
  const lang = s.language;

  document.getElementById('supporter-dialog-title')!.textContent = t(lang, 'supporterTitle');
  document.getElementById('supporter-dialog-sub')!.textContent = t(lang, 'supporterSubtitle');
  document.getElementById('btn-close-supporter')!.textContent = t(lang, 'closeBtn');
  document.getElementById('supporter-perks-hdr')!.textContent = t(lang, 'supporterPerksTitle');
  document.getElementById('perk-1')!.textContent = t(lang, 'perk1');
  document.getElementById('perk-2')!.textContent = t(lang, 'perk2');
  document.getElementById('perk-3')!.textContent = t(lang, 'perk3');
  document.getElementById('perk-4')!.textContent = t(lang, 'perk4');

  const keyInput = document.getElementById('input-supporter-key') as HTMLInputElement;
  keyInput.placeholder = t(lang, 'keyPlaceholder');
  document.getElementById('btn-activate-key')!.textContent = t(lang, 'unlockBtn');
  document.getElementById('btn-instant-unlock')!.textContent = t(lang, 'tryDemoUnlockBtn');

  const toggleThemeBtn = document.getElementById('btn-toggle-theme') as HTMLButtonElement;
  toggleThemeBtn.textContent = `👑 ${t(lang, 'toggleGoldenTheme')}`;
  toggleThemeBtn.hidden = !s.supporterUnlocked;
}

// Button Event Listeners
btnGrimoire.addEventListener('click', () => {
  sound.playUiChirp(1.05);
  populateGrimoireDialog();
  grimoireDialog.showModal();
  btnGrimoire.blur();
});

btnSupporter.addEventListener('click', () => {
  sound.playUiChirp(1.1);
  populateSupporterDialog();
  supporterDialog.showModal();
  btnSupporter.blur();
});

btnLang.addEventListener('click', () => {
  sound.playUiChirp(1.0);
  stateMgr.toggleLanguage();
  btnLang.blur();
});

btnAudio.addEventListener('click', () => {
  const next = !stateMgr.state.soundEnabled;
  stateMgr.state.soundEnabled = next;
  sound.setSoundEnabled(next);
  if (next) sound.playUiChirp(1.2);
  stateMgr.save();
  btnAudio.blur();
});

btnReset.addEventListener('click', () => {
  sound.playUiChirp(0.8);
  stateMgr.resetSave();
  engine.orbs = [];
  engine.rebuildPegConstellation();
  btnReset.blur();
});

btnDeliver.addEventListener('click', () => {
  const res = stateMgr.fulfillCurrentOrder();
  if (!res) return;
  sound.playOrderComplete();
  engine.addFloatingText(260, 120, `+${res.goldEarned}g!`, '#34d399', 1.35);

  if (res.nightFinished) {
    const lang = stateMgr.state.language;
    document.getElementById('night-complete-title')!.textContent = t(lang, 'nightCompleteTitle');
    document.getElementById('night-complete-desc')!.textContent = t(lang, 'nightCompleteDesc');
    document.getElementById('btn-next-night')!.textContent = t(lang, 'nextNightBtn');
    const summaryEl = document.getElementById('night-summary-stats')!;
    summaryEl.innerHTML = `
      <div>🌙 ${t(lang, 'nightLabel')}: <strong>0${stateMgr.state.night}</strong></div>
      <div>💰 ${t(lang, 'goldLabel')}: <strong>${stateMgr.state.gold}g</strong></div>
      <div>⭐ ${t(lang, 'reputationLabel')}: <strong>${stateMgr.state.reputation}</strong></div>
    `;
    nightCompleteDialog.showModal();
  }
  btnDeliver.blur();
});

document.getElementById('btn-next-night')!.addEventListener('click', () => {
  sound.playOrderComplete();
  const reachingEndOfDemo = stateMgr.state.night >= 3 && !stateMgr.state.supporterUnlocked;
  stateMgr.advanceToNextNight();
  nightCompleteDialog.close();

  if (reachingEndOfDemo) {
    populateSupporterDialog();
    supporterDialog.showModal();
  }
});

btnSkipVisitor.addEventListener('click', () => {
  if (stateMgr.spendGold(10)) {
    sound.playUiChirp(0.9);
    stateMgr.currentOrder = stateMgr.pickVisitorOrder(stateMgr.currentOrder.id);
    stateMgr.save();
  }
  btnSkipVisitor.blur();
});

btnSellSurplus.addEventListener('click', () => {
  const earned = stateMgr.sellSurplusPotions();
  if (earned > 0) {
    sound.playBottleHarvest();
    engine.addFloatingText(260, 200, `+${earned}g`, '#fbbf24', 1.25);
  } else {
    sound.playUiChirp(0.7);
  }
  btnSellSurplus.blur();
});

btnHarvestAll.addEventListener('click', () => {
  engine.harvestAllOrbs();
  btnHarvestAll.blur();
});

// Supporter Unlock Actions
document.getElementById('btn-activate-key')!.addEventListener('click', () => {
  const keyInput = document.getElementById('input-supporter-key') as HTMLInputElement;
  const feedback = document.getElementById('supporter-feedback-msg')!;
  const lang = stateMgr.state.language;
  const code = keyInput.value.trim().toUpperCase();

  if (code === 'ALCHEMIST-777' || code === 'NOCTURNE-VIP' || code === 'SUPPORTER') {
    stateMgr.unlockSupporterEdition();
    engine.rebuildPegConstellation();
    sound.playSynthesis(3);
    feedback.textContent = t(lang, 'keySuccess');
    populateSupporterDialog();
  } else {
    sound.playUiChirp(0.6);
    feedback.textContent = t(lang, 'keyError');
  }
});

document.getElementById('btn-instant-unlock')!.addEventListener('click', () => {
  const feedback = document.getElementById('supporter-feedback-msg')!;
  const lang = stateMgr.state.language;
  stateMgr.unlockSupporterEdition();
  engine.rebuildPegConstellation();
  sound.playSynthesis(3);
  feedback.textContent = t(lang, 'keySuccess');
  populateSupporterDialog();
});

document.getElementById('btn-toggle-theme')!.addEventListener('click', () => {
  sound.playUiChirp(1.1);
  stateMgr.state.goldenThemeActive = !stateMgr.state.goldenThemeActive;
  stateMgr.save();
});

// Keyboard Controls (1-4 to select element, Left/Right/A/D to aim, Space to drop)
window.addEventListener('keydown', (e) => {
  // Ignore shortcuts when typing inside an input or when a modal dialog is open
  if (
    document.activeElement instanceof HTMLInputElement ||
    grimoireDialog.open ||
    supporterDialog.open ||
    nightCompleteDialog.open
  ) {
    return;
  }

  if (e.code === 'Digit1') {
    stateMgr.state.selectedElement = 'aqua';
    stateMgr.save();
  } else if (e.code === 'Digit2') {
    stateMgr.state.selectedElement = 'ignis';
    stateMgr.save();
  } else if (e.code === 'Digit3') {
    stateMgr.state.selectedElement = 'vitae';
    stateMgr.save();
  } else if (e.code === 'Digit4') {
    if (stateMgr.state.night >= 2 || stateMgr.state.supporterUnlocked) {
      stateMgr.state.selectedElement = 'lunar';
      stateMgr.save();
    }
  } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    engine.nudgeDropper(-18);
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    engine.nudgeDropper(18);
  } else if (e.code === 'Space') {
    e.preventDefault();
    engine.dropOrbAtDropper();
  }
});

stateMgr.onChange(renderAllUI);
renderAllUI();

// Main 60-144 FPS Animation Loop
let lastTime = performance.now();
function loop(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  engine.update(dt);
  engine.render();

  // Smooth refill bar update
  const pct = stateMgr.currentDrops >= stateMgr.maxDrops ? 100 : Math.round(stateMgr.dropRefillProgress * 100);
  refillBarFill.style.width = `${pct}%`;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);


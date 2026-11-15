import { sound } from '../audio';
import { BASE_ELEMENTS, ELEMENTS, findSynthesisResult } from '../data/elements';
import { t } from '../i18n';
import { StateManager } from './StateManager';
import { ElementId, FloatingText, Orb, Particle, Peg, PegType } from './types';

export class AlembicEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stateMgr: StateManager;
  private onDiscoveryCallback?: (name: string, symbol: string) => void;

  // Logical stage dimensions (center canvas viewport)
  public readonly width = 520;
  public readonly height = 560;

  // Alembic Vessel geometry
  private readonly vesselCenterX = 260;
  private readonly vesselTopY = 66;
  private readonly vesselNeckHalfW = 74;
  private readonly vesselBulbCenterY = 310;
  private readonly vesselBulbRadiusX = 196;
  private readonly vesselBulbRadiusY = 188;
  private readonly basinFloorY = 478;

  // Entities
  public orbs: Orb[] = [];
  public pegs: Peg[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private raindrops: Array<{ x: number; y: number; len: number; speed: number; alpha: number }> = [];

  // Dropper state
  private dropperX = 260;
  private targetDropperX = 260;
  private dropperCooldown = 0;
  private autoDropTimer = 0;
  private nextOrbUid = 1;

  // Juice & Camera effects
  private hitstopTimer = 0;
  private chromaticTimer = 0;
  private screenShake = 0;
  private astrolabeAngle = 0;
  private eyeBlinkTimer = 3.2;
  private eyeLookX = 0;
  private eyeLookY = 0;
  private activeComboChain = 0;
  private comboResetTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    stateMgr: StateManager,
    onDiscovery?: (name: string, symbol: string) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize 2D context');
    this.ctx = context;
    this.stateMgr = stateMgr;
    this.onDiscoveryCallback = onDiscovery;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.initRain();
    this.rebuildPegConstellation();
    this.bindCanvasInputs();
  }

  private initRain(): void {
    this.raindrops = [];
    for (let i = 0; i < 48; i++) {
      this.raindrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: 12 + Math.random() * 18,
        speed: 260 + Math.random() * 160,
        alpha: 0.08 + Math.random() * 0.14
      });
    }
  }

  public rebuildPegConstellation(): void {
    const upg = this.stateMgr.state.upgrades;
    const rows = Math.min(6, 3 + Math.floor(upg.pegCount / 2));
    const newPegs: Peg[] = [];
    let idCounter = 1;

    const startY = 172;
    const endY = 396;
    const rowStep = (endY - startY) / Math.max(1, rows - 1);

    for (let r = 0; r < rows; r++) {
      const y = startY + r * rowStep;
      const isOdd = r % 2 === 1;
      const cols = isOdd ? 4 + Math.floor(upg.pegCount / 3) : 3 + Math.floor(upg.pegCount / 2);
      const spanWidth = 190 + Math.sin((r / rows) * Math.PI) * 95;
      const colStep = cols > 1 ? spanWidth / (cols - 1) : 0;
      const startX = this.vesselCenterX - spanWidth / 2;

      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? this.vesselCenterX : startX + c * colStep;
        let type: PegType = 'crystal';
        let radius = 8;

        // Upgrade special pegs based on bumperForge level
        if (upg.bumperForge >= 1 && r === 1 && (c === 1 || c === cols - 2)) {
          type = 'bumper';
          radius = 12;
        } else if (upg.bumperForge >= 2 && r === 2 && c === Math.floor(cols / 2)) {
          type = 'multiplier';
          radius = 11;
        } else if (upg.bumperForge >= 3 && r === rows - 1 && (c === 0 || c === cols - 1)) {
          type = 'bumper';
          radius = 12;
        } else if (upg.bumperForge >= 4 && r % 2 === 0 && c === Math.floor(cols / 2)) {
          type = 'catalyst';
          radius = 11;
        }

        newPegs.push({
          id: idCounter++,
          x,
          y,
          baseX: x,
          baseY: y,
          radius,
          type,
          hitScale: 1,
          glowIntensity: 0.2,
          energizedTimer: 0,
          orbitPhase: (r * 1.3 + c * 0.9) % (Math.PI * 2),
          noteIndex: (r * 2 + c) % 11
        });
      }
    }

    this.pegs = newPegs;
  }

  private bindCanvasInputs(): void {
    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const localX = (e.clientX - rect.left) * scaleX;
      this.setDropperTarget(localX);
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const localX = (e.clientX - rect.left) * scaleX;
      const localY = (e.clientY - rect.top) * scaleY;

      // Check if player clicked directly on a settled orb at the bottom to bottle it immediately
      for (let i = this.orbs.length - 1; i >= 0; i--) {
        const orb = this.orbs[i];
        const dist = Math.hypot(localX - orb.x, localY - orb.y);
        if (dist <= orb.radius + 8 && orb.y > 380) {
          this.harvestSingleOrb(i);
          return;
        }
      }

      this.setDropperTarget(localX);
      this.dropOrbAtDropper();
    });
  }

  public setDropperTarget(x: number): void {
    const minX = this.vesselCenterX - this.vesselNeckHalfW + 18;
    const maxX = this.vesselCenterX + this.vesselNeckHalfW - 18;
    this.targetDropperX = Math.max(minX, Math.min(maxX, x));
  }

  public nudgeDropper(deltaX: number): void {
    this.setDropperTarget(this.targetDropperX + deltaX);
  }

  public dropOrbAtDropper(forcedElement?: ElementId): boolean {
    if (this.dropperCooldown > 0) return false;
    if (!forcedElement && this.stateMgr.currentDrops <= 0) {
      sound.playUiChirp(0.6);
      return false;
    }

    const elId = forcedElement || this.stateMgr.state.selectedElement;
    const def = ELEMENTS[elId];

    if (!forcedElement) {
      this.stateMgr.currentDrops -= 1;
      this.stateMgr.notify();
    }

    this.dropperCooldown = 0.16;
    const jitterX = (Math.random() - 0.5) * 3.2;

    const newOrb: Orb = {
      uid: this.nextOrbUid++,
      elementId: elId,
      x: this.dropperX + jitterX,
      y: this.vesselTopY + 16,
      vx: (Math.random() - 0.5) * 22,
      vy: 65,
      radius: def.radius,
      // On Jump/Drop Launch: Stretch vertically (scaleX = 0.72, scaleY = 1.32)
      scaleX: 0.72,
      scaleY: 1.32,
      rotation: 0,
      angularVel: (Math.random() - 0.5) * 2,
      bounceCount: 0,
      accumulatedGold: 0,
      multiplier: 1,
      age: 0,
      settlingTimer: 0,
      mergeCooldown: 0.08,
      trail: [],
      eyesBlinkTimer: 1.5 + Math.random() * 2.5
    };

    this.orbs.push(newOrb);
    sound.playDropPlop();
    this.spawnParticles(newOrb.x, newOrb.y, def.color, 7, 'circle');
    return true;
  }

  public harvestAllOrbs(): number {
    if (this.orbs.length === 0) return 0;
    let count = 0;
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      this.harvestSingleOrb(i, false);
      count++;
    }
    if (count > 0) {
      sound.playBottleHarvest();
    }
    return count;
  }

  private harvestSingleOrb(index: number, playSfx = true): void {
    const orb = this.orbs[index];
    if (!orb) return;
    const def = ELEMENTS[orb.elementId];
    const bonusGold = Math.round(orb.accumulatedGold * orb.multiplier);

    this.stateMgr.addPotionToShelf(orb.elementId, bonusGold);
    this.spawnParticles(orb.x, orb.y, def.color, 14, 'spark');

    const label = `+1 ${def.symbol} ${def.name[this.stateMgr.state.language]}${bonusGold > 0 ? ` (+${bonusGold}g)` : ''}`;
    this.addFloatingText(orb.x, orb.y - 12, label, def.color, 1.15);

    this.orbs.splice(index, 1);
    if (playSfx) {
      sound.playBottleHarvest();
    }
  }

  public update(dt: number): void {
    // Clamp delta time to avoid tunneling on tab switch
    const dtSec = Math.min(dt, 0.033);

    // Refill dropper vial
    this.stateMgr.tickRefill(dtSec);

    // Hitstop freeze frame for dramatic synthesis moments
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dtSec;
      this.updateParticlesAndTexts(dtSec * 0.35);
      return;
    }

    if (this.chromaticTimer > 0) {
      this.chromaticTimer = Math.max(0, this.chromaticTimer - dtSec);
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dtSec * 22);
    }
    if (this.dropperCooldown > 0) {
      this.dropperCooldown = Math.max(0, this.dropperCooldown - dtSec);
    }
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dtSec;
      if (this.comboResetTimer <= 0) {
        this.activeComboChain = 0;
      }
    }

    // Smoothly lerp dropper nozzle
    this.dropperX += (this.targetDropperX - this.dropperX) * Math.min(1, 18 * dtSec);
    this.astrolabeAngle += dtSec * 0.25;

    // Homunculus Idle Familiar auto-dropper
    const idleLvl = this.stateMgr.state.upgrades.homunculusIdle;
    if (idleLvl > 0) {
      const interval = Math.max(1.3, 4.2 - idleLvl * 0.75);
      this.autoDropTimer += dtSec;
      if (this.autoDropTimer >= interval && this.orbs.length < 10) {
        this.autoDropTimer = 0;
        // Pick a smart random base element
        const unlockedBase = BASE_ELEMENTS.filter(
          (e) => e !== 'lunar' || this.stateMgr.state.night >= 2 || this.stateMgr.state.supporterUnlocked
        );
        const randomEl = unlockedBase[Math.floor(Math.random() * unlockedBase.length)];
        const waveX = this.vesselCenterX + Math.sin(performance.now() * 0.0023) * (this.vesselNeckHalfW - 22);
        this.setDropperTarget(waveX);
        this.dropOrbAtDropper(randomEl);
      }
    }

    // Update rain
    for (const r of this.raindrops) {
      r.y += r.speed * dtSec;
      r.x -= r.speed * 0.18 * dtSec;
      if (r.y > this.height) {
        r.y = -20;
        r.x = Math.random() * (this.width + 80);
      }
    }

    // Update Pegs (gentle harmonic sway + scale recovery)
    for (const peg of this.pegs) {
      peg.orbitPhase += dtSec * 1.4;
      peg.x = peg.baseX + Math.sin(peg.orbitPhase) * 2.5;
      peg.hitScale += (1 - peg.hitScale) * Math.min(1, 14 * dtSec);
      peg.glowIntensity += (0.25 - peg.glowIntensity) * Math.min(1, 6 * dtSec);
      if (peg.energizedTimer > 0) {
        peg.energizedTimer = Math.max(0, peg.energizedTimer - dtSec);
      }
    }

    // Update Central Watching Homunculus Eye tracking
    this.eyeBlinkTimer -= dtSec;
    if (this.eyeBlinkTimer <= -0.14) {
      this.eyeBlinkTimer = 2.8 + Math.random() * 3.5;
    }
    if (this.orbs.length > 0) {
      const lead = this.orbs[this.orbs.length - 1];
      const dx = (lead.x - this.vesselCenterX) * 0.06;
      const dy = (lead.y - this.vesselBulbCenterY) * 0.06;
      this.eyeLookX += (dx - this.eyeLookX) * Math.min(1, 8 * dtSec);
      this.eyeLookY += (dy - this.eyeLookY) * Math.min(1, 8 * dtSec);
    } else {
      this.eyeLookX += (0 - this.eyeLookX) * Math.min(1, 4 * dtSec);
      this.eyeLookY += (0 - this.eyeLookY) * Math.min(1, 4 * dtSec);
    }

    // Physics step for Orbs
    this.updateOrbsPhysics(dtSec);

    // Update Particles and Floating Texts
    this.updateParticlesAndTexts(dtSec);
  }

  private updateOrbsPhysics(dtSec: number): void {
    const gravityBase = 540;

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      const def = ELEMENTS[orb.elementId];

      orb.age += dtSec;
      if (orb.mergeCooldown > 0) {
        orb.mergeCooldown = Math.max(0, orb.mergeCooldown - dtSec);
      }
      orb.eyesBlinkTimer -= dtSec;
      if (orb.eyesBlinkTimer <= -0.12) {
        orb.eyesBlinkTimer = 1.8 + Math.random() * 2.6;
      }

      // Lerp (scaleX, scaleY) smoothly back toward (1.0, 1.0) at 14 * dtSec (canvas-game-juice rule)
      orb.scaleX += (1.0 - orb.scaleX) * Math.min(1, 14 * dtSec);
      orb.scaleY += (1.0 - orb.scaleY) * Math.min(1, 14 * dtSec);

      // Apply gravity & air damping
      orb.vy += gravityBase * def.gravityScale * dtSec;
      orb.vx *= Math.pow(0.992, dtSec * 60);
      orb.vy *= Math.pow(0.995, dtSec * 60);

      orb.x += orb.vx * dtSec;
      orb.y += orb.vy * dtSec;
      orb.rotation += orb.angularVel * dtSec;

      // Record Ghost Afterimage Trail when moving fast
      const speed = Math.hypot(orb.vx, orb.vy);
      if (speed > 130) {
        orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.42 });
        if (orb.trail.length > 6) orb.trail.pop();
      } else if (orb.trail.length > 0) {
        orb.trail.pop();
      }
      for (const pt of orb.trail) {
        pt.alpha *= 0.85;
      }

      // Vessel boundary constraints
      this.constrainOrbToVessel(orb, def.bounciness);

      // Peg collisions
      for (const peg of this.pegs) {
        const dx = orb.x - peg.x;
        const dy = orb.y - peg.y;
        const dist = Math.hypot(dx, dy);
        const minDist = orb.radius + peg.radius;

        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          orb.x += nx * overlap;
          orb.y += ny * overlap;

          const relVel = orb.vx * nx + orb.vy * ny;
          if (relVel < 0) {
            const bounceBoost = peg.type === 'bumper' ? 1.38 : def.bounciness;
            orb.vx -= (1 + bounceBoost) * relVel * nx;
            orb.vy -= (1 + bounceBoost) * relVel * ny;

            // Add subtle horizontal scatter so orbs never get stuck vertically
            orb.vx += (Math.random() - 0.5) * 36;
            orb.angularVel = (orb.vx * 0.03);

            // Squash on impact proportional to speed
            orb.scaleX = 1.34;
            orb.scaleY = 0.68;

            this.onOrbHitPeg(orb, peg);
          }
        }
      }
    }

    // Orb-to-Orb Collisions & Alchemical Synthesis
    for (let i = 0; i < this.orbs.length; i++) {
      for (let j = i + 1; j < this.orbs.length; j++) {
        const a = this.orbs[i];
        const b = this.orbs[j];
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0.0001) {
          // Check if they can synthesize!
          if (a.mergeCooldown <= 0 && b.mergeCooldown <= 0) {
            const synth = findSynthesisResult(a.elementId, b.elementId);
            if (synth) {
              this.performAlchemicalSynthesis(i, j, synth.result, synth.recipeId);
              return; // Restart pair check next frame cleanly
            }
          }

          // Otherwise physical elastic bounce
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const kx = a.vx - b.vx;
          const ky = a.vy - b.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;
          if (p > 0) {
            a.vx -= p * nx * 0.82;
            a.vy -= p * ny * 0.82;
            b.vx += p * nx * 0.82;
            b.vy += p * ny * 0.82;
            a.scaleX = 1.22;
            a.scaleY = 0.78;
            b.scaleX = 1.22;
            b.scaleY = 0.78;
          }
        }
      }
    }

    // Check Settling in the Collector Basin at bottom of flask
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      const speed = Math.hypot(orb.vx, orb.vy);
      if (orb.y >= this.basinFloorY - orb.radius - 14 && speed < 55) {
        orb.settlingTimer += dtSec;
        // Tier 2 & 3 potions stay slightly longer so you can combine two Tier-2s into Philosopher's Stone!
        const settleThreshold = ELEMENTS[orb.elementId].tier === 2 ? 4.2 : 2.6;
        if (orb.settlingTimer >= settleThreshold) {
          this.harvestSingleOrb(i, true);
        }
      } else {
        orb.settlingTimer = Math.max(0, orb.settlingTimer - dtSec * 0.5);
      }
    }
  }

  private constrainOrbToVessel(orb: Orb, bounciness: number): void {
    // Upper neck region (y < 146)
    if (orb.y < 146) {
      const minX = this.vesselCenterX - this.vesselNeckHalfW + orb.radius;
      const maxX = this.vesselCenterX + this.vesselNeckHalfW - orb.radius;
      if (orb.x < minX) {
        orb.x = minX;
        orb.vx = Math.abs(orb.vx) * bounciness;
        orb.scaleX = 0.74;
        orb.scaleY = 1.26;
      } else if (orb.x > maxX) {
        orb.x = maxX;
        orb.vx = -Math.abs(orb.vx) * bounciness;
        orb.scaleX = 0.74;
        orb.scaleY = 1.26;
      }
    } else {
      // Elliptical glass bulb wall constraint
      const rx = this.vesselBulbRadiusX - orb.radius;
      const ry = this.vesselBulbRadiusY - orb.radius;
      const dx = orb.x - this.vesselCenterX;
      const dy = orb.y - this.vesselBulbCenterY;

      const normDist = Math.hypot(dx / rx, dy / ry);
      if (normDist > 1.0 && dy > -145) {
        const angle = Math.atan2(dy / ry, dx / rx);
        orb.x = this.vesselCenterX + Math.cos(angle) * rx;
        orb.y = this.vesselBulbCenterY + Math.sin(angle) * ry;

        // Normal pointing inward
        const nx = -Math.cos(angle);
        const ny = -Math.sin(angle);
        const dot = orb.vx * nx + orb.vy * ny;
        if (dot < 0) {
          orb.vx -= (1 + bounciness * 0.85) * dot * nx;
          orb.vy -= (1 + bounciness * 0.85) * dot * ny;
          orb.scaleX = 1.24;
          orb.scaleY = 0.76;
        }
      }
    }

    // Flat Collector Basin Floor at the bottom of the bulb
    const maxY = this.basinFloorY - orb.radius;
    if (orb.y > maxY) {
      orb.y = maxY;
      if (orb.vy > 45) {
        // On Ground Landing: Squash horizontally (scaleX = 1.34, scaleY = 0.68)
        orb.scaleX = 1.34;
        orb.scaleY = 0.68;
        orb.vy = -orb.vy * (bounciness * 0.55);
        orb.vx *= 0.88;
      } else {
        orb.vy = 0;
        orb.vx *= 0.92;
      }
    }
  }

  private onOrbHitPeg(orb: Orb, peg: Peg): void {
    orb.bounceCount += 1;
    this.activeComboChain += 1;
    this.comboResetTimer = 1.6;

    peg.hitScale = 1.48;
    peg.glowIntensity = 1.0;

    const def = ELEMENTS[orb.elementId];
    const purityLvl = this.stateMgr.state.upgrades.pegPurity;
    let goldEarned = purityLvl + Math.floor(this.activeComboChain / 4);

    if (peg.energizedTimer > 0) {
      goldEarned += 2;
    }
    if (peg.type === 'bumper') {
      goldEarned += 2;
    } else if (peg.type === 'multiplier') {
      orb.multiplier = Math.min(4, orb.multiplier + 0.5);
      this.addFloatingText(peg.x, peg.y - 14, `x${orb.multiplier.toFixed(1)}!`, '#f59e0b', 1.1);
    } else if (peg.type === 'catalyst') {
      goldEarned *= 2;
    }

    // Special Element Effects
    if (def.specialEffect === 'triple_peg') {
      goldEarned *= 3;
    } else if (def.specialEffect === 'philosopher') {
      goldEarned *= 5;
    } else if (def.specialEffect === 'energize_pegs') {
      peg.energizedTimer = 6.0;
    } else if (def.specialEffect === 'shockwave' && orb.bounceCount % 3 === 1) {
      this.spawnParticles(peg.x, peg.y, def.color, 1, 'ring');
      for (const other of this.pegs) {
        if (Math.hypot(other.x - peg.x, other.y - peg.y) < 85) {
          other.energizedTimer = 4.5;
          other.hitScale = 1.3;
        }
      }
    }

    orb.accumulatedGold += goldEarned;
    this.stateMgr.addGold(goldEarned);

    sound.playPegBounce(this.activeComboChain - 1, peg.type === 'bumper');
    this.spawnParticles(peg.x, peg.y, def.color, 5, 'spark');
    this.addFloatingText(peg.x, peg.y - 8, `+${goldEarned}g`, '#fbbf24', 0.92);
  }

  private performAlchemicalSynthesis(
    idxA: number,
    idxB: number,
    resultId: ElementId,
    recipeId: string
  ): void {
    const a = this.orbs[idxA];
    const b = this.orbs[idxB];
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const resDef = ELEMENTS[resultId];

    const inheritedGold = a.accumulatedGold + b.accumulatedGold + resDef.baseValue;
    const inheritedMult = Math.max(a.multiplier, b.multiplier);

    // Remove the two ingredients (higher index first)
    const first = Math.max(idxA, idxB);
    const second = Math.min(idxA, idxB);
    this.orbs.splice(first, 1);
    this.orbs.splice(second, 1);

    // Create synthesized Elixir Orb with upward pop!
    const synthesizedOrb: Orb = {
      uid: this.nextOrbUid++,
      elementId: resultId,
      x: midX,
      y: midY,
      vx: (a.vx + b.vx) * 0.35 + (Math.random() - 0.5) * 40,
      vy: -155,
      radius: resDef.radius,
      scaleX: 1.42,
      scaleY: 0.62,
      rotation: 0,
      angularVel: (Math.random() - 0.5) * 3,
      bounceCount: a.bounceCount + b.bounceCount,
      accumulatedGold: inheritedGold,
      multiplier: inheritedMult,
      age: 0,
      settlingTimer: 0,
      mergeCooldown: 0.25,
      trail: [],
      eyesBlinkTimer: 2.0
    };

    this.orbs.push(synthesizedOrb);

    // Trigger canvas-game-juice Mutation / Synthesis Drama!
    this.hitstopTimer = 0.045; // 45ms hitstop freeze frame
    this.chromaticTimer = 0.26; // 260ms RGB chromatic aberration split
    this.screenShake = resDef.tier === 3 ? 6.5 : 3.2;

    sound.playSynthesis(resDef.tier);
    this.spawnParticles(midX, midY, resDef.color, 18, 'spark');
    this.spawnParticles(midX, midY, resDef.color, 1, 'ring');

    const lang = this.stateMgr.state.language;
    const isNew = this.stateMgr.discoverElement(resultId, recipeId);
    const popupText = `${resDef.symbol} ${resDef.name[lang]}!`;
    this.addFloatingText(midX, midY - 18, popupText, resDef.color, resDef.tier === 3 ? 1.4 : 1.18);

    if (isNew && this.onDiscoveryCallback) {
      this.onDiscoveryCallback(resDef.name[lang], resDef.symbol);
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    color: string,
    count: number,
    shape: 'circle' | 'spark' | 'ring'
  ): void {
    // Enforce cap <= 120 active particles for locked < 8ms frame budget
    if (this.particles.length > 110) {
      this.particles.splice(0, count);
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = shape === 'ring' ? 0 : 45 + Math.random() * 145;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (shape === 'circle' ? 30 : 0),
        size: shape === 'ring' ? 14 : 2.5 + Math.random() * 3.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: shape === 'ring' ? 0.38 : 0.35 + Math.random() * 0.3,
        shape
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, scale = 1): void {
    if (this.floatingTexts.length > 24) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      x,
      y,
      vy: -42,
      text,
      color,
      alpha: 1,
      scale,
      life: 0,
      maxLife: 1.05
    });
  }

  private updateParticlesAndTexts(dtSec: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtSec;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      const ratio = p.life / p.maxLife;
      p.alpha = 1 - ratio;
      if (p.shape === 'ring') {
        p.size += 160 * dtSec;
      } else {
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.vy += 180 * dtSec;
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dtSec;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dtSec;
      ft.alpha = 1 - Math.pow(ft.life / ft.maxLife, 1.6);
    }
  }

  public render(): void {
    const ctx = this.ctx;
    const isGolden = this.stateMgr.state.goldenThemeActive;

    ctx.save();
    if (this.screenShake > 0.1) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Deep Atmospheric Background & Rain-Streaked Window
    this.renderBackgroundLayer(ctx, isGolden);

    // 2. Central Watching Alchemical Eye & Sacred Astrolabe Ring
    this.renderSacredAstrolabeLayer(ctx, isGolden);

    // 3. Glass Alembic Vessel Back Wall & Trajectory Guide
    this.renderVesselBack(ctx, isGolden);

    // 4. Crystal Pegs Constellation
    this.renderPegs(ctx);

    // 5. Orbs (with Squash & Stretch, Afterimage Trail & Chromatic Aberration Split)
    this.renderOrbs(ctx);

    // 6. Particles & Shockwave Rings
    this.renderParticles(ctx);

    // 7. Glass Alembic Front Highlights, Brass Collar & Dropper Pipette
    this.renderVesselFrontAndDropper(ctx, isGolden);

    // 8. Floating Texts & Combo Indicator
    this.renderFloatingTextsAndHUD(ctx);

    ctx.restore();
  }

  private renderBackgroundLayer(ctx: CanvasRenderingContext2D, isGolden: boolean): void {
    const grad = ctx.createRadialGradient(
      this.vesselCenterX,
      this.vesselBulbCenterY,
      30,
      this.vesselCenterX,
      this.vesselBulbCenterY,
      340
    );
    if (isGolden) {
      grad.addColorStop(0, '#1f1912');
      grad.addColorStop(0.6, '#100d0a');
      grad.addColorStop(1, '#070609');
    } else {
      grad.addColorStop(0, '#111a2e');
      grad.addColorStop(0.6, '#090e1a');
      grad.addColorStop(1, '#05070d');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle blueprint / alchemical grid lines
    ctx.strokeStyle = isGolden ? 'rgba(245, 158, 11, 0.04)' : 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Rain streaks outside the window
    if (this.stateMgr.state.rainEnabled) {
      ctx.strokeStyle = isGolden ? 'rgba(253, 224, 71, 0.16)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1.2;
      for (const r of this.raindrops) {
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.18, r.y + r.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  private renderSacredAstrolabeLayer(ctx: CanvasRenderingContext2D, isGolden: boolean): void {
    const cx = this.vesselCenterX;
    const cy = this.vesselBulbCenterY;

    // Soft radial aura behind the vessel
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 165);
    glow.addColorStop(0, isGolden ? 'rgba(245, 158, 11, 0.16)' : 'rgba(56, 189, 248, 0.13)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 165, 0, Math.PI * 2);
    ctx.fill();

    // Rotating outer measurement ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.astrolabeAngle);
    ctx.strokeStyle = isGolden ? 'rgba(251, 191, 36, 0.16)' : 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 128, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inscribed sacred hexagram
    ctx.strokeStyle = isGolden ? 'rgba(251, 191, 36, 0.09)' : 'rgba(56, 189, 248, 0.08)';
    for (let t = 0; t < 2; t++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3 + (t * Math.PI) / 3;
        const px = Math.cos(ang) * 92;
        const py = Math.sin(ang) * 92;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // The Watching Alchemical Eye in the center of the astrolabe
    ctx.save();
    ctx.translate(cx, cy - 12);
    const blinkScaleY = this.eyeBlinkTimer < 0 ? 0.1 : 1.0;
    ctx.scale(1, blinkScaleY);

    ctx.strokeStyle = isGolden ? 'rgba(251, 191, 36, 0.25)' : 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.quadraticCurveTo(0, -20, 34, 0);
    ctx.quadraticCurveTo(0, 20, -34, 0);
    ctx.stroke();

    // Iris & Pupil tracking active orbs
    ctx.fillStyle = isGolden ? 'rgba(251, 191, 36, 0.22)' : 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.arc(this.eyeLookX, this.eyeLookY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isGolden ? 'rgba(254, 243, 199, 0.5)' : 'rgba(224, 242, 254, 0.45)';
    ctx.beginPath();
    ctx.arc(this.eyeLookX, this.eyeLookY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderVesselBack(ctx: CanvasRenderingContext2D, isGolden: boolean): void {
    const cx = this.vesselCenterX;
    const cy = this.vesselBulbCenterY;
    const rx = this.vesselBulbRadiusX;
    const ry = this.vesselBulbRadiusY;

    // Dotted Aim Trajectory Line from Dropper
    const selectedDef = ELEMENTS[this.stateMgr.state.selectedElement];
    ctx.save();
    ctx.strokeStyle = selectedDef.glowColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.dropperX, this.vesselTopY + 20);
    ctx.lineTo(this.dropperX, 195);
    ctx.stroke();
    ctx.restore();

    // Glass Bulb Interior Fill
    ctx.save();
    this.traceVesselPath(ctx, cx, cy, rx, ry);
    const glassFill = ctx.createLinearGradient(0, this.vesselTopY, 0, this.basinFloorY);
    glassFill.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
    glassFill.addColorStop(0.85, 'rgba(15, 23, 42, 0.55)');
    glassFill.addColorStop(1, isGolden ? 'rgba(120, 53, 15, 0.42)' : 'rgba(12, 74, 110, 0.38)');
    ctx.fillStyle = glassFill;
    ctx.fill();

    // Shimmering Collector Basin liquid at the bottom
    ctx.clip();
    const liquidGrad = ctx.createLinearGradient(0, this.basinFloorY - 26, 0, this.basinFloorY + 24);
    liquidGrad.addColorStop(0, isGolden ? 'rgba(251, 191, 36, 0.18)' : 'rgba(56, 189, 248, 0.16)');
    liquidGrad.addColorStop(1, isGolden ? 'rgba(217, 119, 6, 0.45)' : 'rgba(14, 116, 144, 0.42)');
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(cx - rx, this.basinFloorY - 22, rx * 2, 50);

    // Basin top meniscus line
    ctx.strokeStyle = isGolden ? 'rgba(253, 224, 71, 0.45)' : 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - rx + 25, this.basinFloorY - 22);
    ctx.lineTo(cx + rx - 25, this.basinFloorY - 22);
    ctx.stroke();
    ctx.restore();
  }

  private traceVesselPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number
  ): void {
    const neckW = this.vesselNeckHalfW;
    const topY = this.vesselTopY;
    const neckBottomY = 144;

    ctx.beginPath();
    ctx.moveTo(cx - neckW, topY);
    ctx.lineTo(cx - neckW, neckBottomY);
    // Curve out into the main elliptical bulb
    ctx.bezierCurveTo(
      cx - rx * 0.95,
      neckBottomY + 25,
      cx - rx * 1.06,
      cy + 40,
      cx - rx * 0.65,
      this.basinFloorY
    );
    // Flat collector basin base
    ctx.lineTo(cx + rx * 0.65, this.basinFloorY);
    // Right bulb curve up to neck
    ctx.bezierCurveTo(
      cx + rx * 1.06,
      cy + 40,
      cx + rx * 0.95,
      neckBottomY + 25,
      cx + neckW,
      neckBottomY
    );
    ctx.lineTo(cx + neckW, topY);
  }

  private renderPegs(ctx: CanvasRenderingContext2D): void {
    for (const peg of this.pegs) {
      ctx.save();
      ctx.translate(peg.x, peg.y);
      ctx.scale(peg.hitScale, peg.hitScale);

      let coreColor = '#e2e8f0';
      let ringColor = '#38bdf8';
      if (peg.type === 'bumper') {
        coreColor = '#fef08a';
        ringColor = '#f59e0b';
      } else if (peg.type === 'multiplier') {
        coreColor = '#f5d0fe';
        ringColor = '#d946ef';
      } else if (peg.type === 'catalyst') {
        coreColor = '#d1fae5';
        ringColor = '#10b981';
      } else if (peg.energizedTimer > 0) {
        coreColor = '#ccfbf1';
        ringColor = '#2dd4bf';
      }

      // Soft outer halo
      const haloRadius = peg.radius * (1.9 + peg.glowIntensity * 0.7);
      const halo = ctx.createRadialGradient(0, 0, peg.radius * 0.3, 0, 0, haloRadius);
      halo.addColorStop(0, ringColor);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.35 + peg.glowIntensity * 0.4;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Peg body
      ctx.fillStyle = coreColor;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, peg.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label for special pegs
      if (peg.type === 'multiplier') {
        ctx.fillStyle = '#701a75';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', 0, 0.5);
      } else if (peg.type === 'bumper') {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, peg.radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderOrbs(ctx: CanvasRenderingContext2D): void {
    const hasChromatic = this.chromaticTimer > 0;

    for (const orb of this.orbs) {
      const def = ELEMENTS[orb.elementId];

      // 1. Ghost Afterimage Trail
      for (let t = 0; t < orb.trail.length; t++) {
        const pt = orb.trail[t];
        const trailRadius = orb.radius * (1 - t * 0.12);
        ctx.save();
        ctx.globalAlpha = pt.alpha * 0.35;
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, trailRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Chromatic Aberration Split on Synthesis Mutation
      if (hasChromatic) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(orb.x + 3.5, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(orb.x - 3.5, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Main Orb Body with Squash & Stretch
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.scale(orb.scaleX, orb.scaleY);

      // Bioluminescent outer glow
      const glow = ctx.createRadialGradient(0, 0, orb.radius * 0.2, 0, 0, orb.radius * 1.65);
      glow.addColorStop(0, def.glowColor);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius * 1.65, 0, Math.PI * 2);
      ctx.fill();

      // Spherical gradient fill
      const bodyGrad = ctx.createRadialGradient(
        -orb.radius * 0.3,
        -orb.radius * 0.3,
        orb.radius * 0.15,
        0,
        0,
        orb.radius
      );
      bodyGrad.addColorStop(0, def.coreColor);
      bodyGrad.addColorStop(0.55, def.color);
      bodyGrad.addColorStop(1, '#0f172a');

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = def.coreColor;
      ctx.lineWidth = def.tier >= 2 ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular glass highlight droplet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-orb.radius * 0.32, -orb.radius * 0.34, orb.radius * 0.24, orb.radius * 0.13, -0.6, 0, Math.PI * 2);
      ctx.fill();

      // Expressive blinking eyes on Tier 2 & Tier 3 Elixirs!
      if (def.tier >= 2) {
        const blinkY = orb.eyesBlinkTimer < 0 ? 0.15 : 1.0;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.ellipse(-4.5, -1, 2.2, 3.2 * blinkY, 0, 0, Math.PI * 2);
        ctx.ellipse(4.5, -1, 2.2, 3.2 * blinkY, 0, 0, Math.PI * 2);
        ctx.fill();

        if (blinkY > 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-5, -2, 0.9, 0, Math.PI * 2);
          ctx.arc(4, -2, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Symbol glyph for Tier 1 orbs
        ctx.font = '13px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.symbol, 0, 1);
      }

      // Settling progress ring when ready to bottle at the bottom
      if (orb.settlingTimer > 0.35) {
        const settleMax = def.tier === 2 ? 4.2 : 2.6;
        const pct = Math.min(1, orb.settlingTimer / settleMax);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius + 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderVesselFrontAndDropper(ctx: CanvasRenderingContext2D, isGolden: boolean): void {
    const cx = this.vesselCenterX;
    const cy = this.vesselBulbCenterY;
    const rx = this.vesselBulbRadiusX;
    const ry = this.vesselBulbRadiusY;

    // Crisp outer glass border
    ctx.save();
    this.traceVesselPath(ctx, cx, cy, rx, ry);
    ctx.strokeStyle = isGolden ? '#f59e0b' : 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Inner specular reflection arcs on the glass bulb
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rx - 14, Math.PI * 0.68, Math.PI * 0.92);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, rx - 14, -Math.PI * 0.18, Math.PI * 0.12);
    ctx.stroke();

    // Engraved Brass Lip & Collar at top of Alembic Neck
    const brassGrad = ctx.createLinearGradient(cx - 88, 0, cx + 88, 0);
    brassGrad.addColorStop(0, '#78552b');
    brassGrad.addColorStop(0.5, '#f3c677');
    brassGrad.addColorStop(1, '#78552b');

    ctx.fillStyle = brassGrad;
    ctx.fillRect(cx - this.vesselNeckHalfW - 8, this.vesselTopY - 8, (this.vesselNeckHalfW + 8) * 2, 10);
    ctx.fillRect(cx - this.vesselNeckHalfW - 4, 140, (this.vesselNeckHalfW + 4) * 2, 6);

    // Ornate Brass Base Pedestal under the Collector Basin
    ctx.fillStyle = brassGrad;
    ctx.beginPath();
    ctx.roundRect(cx - rx * 0.68, this.basinFloorY, rx * 1.36, 16, 6);
    ctx.fill();

    // Render the Pipette Dropper Nozzle & Preview Orb at top
    const selId = this.stateMgr.state.selectedElement;
    const selDef = ELEMENTS[selId];

    ctx.save();
    ctx.translate(this.dropperX, this.vesselTopY - 12);

    // Brass pipette body
    ctx.fillStyle = '#c89d54';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-9, -24, 18, 26, 5);
    ctx.fill();
    ctx.stroke();

    // Preview orb suspended at tip of pipette
    if (this.stateMgr.currentDrops > 0) {
      ctx.fillStyle = selDef.color;
      ctx.beginPath();
      ctx.arc(0, 14, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '12px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selDef.symbol, 0, 15);
    }
    ctx.restore();

    ctx.restore();
  }

  private renderFloatingTextsAndHUD(ctx: CanvasRenderingContext2D): void {
    // Active Resonance Combo Chain Banner
    if (this.activeComboChain >= 2) {
      const lang = this.stateMgr.state.language;
      ctx.save();
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${t(lang, 'comboLabel')}: ${this.activeComboChain}x`,
        this.vesselCenterX,
        32
      );
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `bold ${Math.round(13 * ft.scale)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}


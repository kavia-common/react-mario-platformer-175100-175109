import { TILE_SIZE } from '../../utils/constants';
import { Platform } from '../entities/Platform';
import { Enemy } from '../entities/Enemy';
import { Coin } from '../entities/Coin';

// PUBLIC_INTERFACE
export function createDemoLevel() {
  /** Build a small demo level with ground, floating platforms, enemies, and coins. */
  const solids = [];
  const enemies = [];
  const coins = [];

  // Ground
  const groundY = 480;
  solids.push(new Platform(0, groundY, 1200, 64));

  // Floating platforms
  solids.push(new Platform(200, groundY - 120, 160, 20));
  solids.push(new Platform(440, groundY - 200, 180, 20));
  solids.push(new Platform(760, groundY - 150, 140, 20));

  // Enemies
  enemies.push(new Enemy(260, groundY - 144, 24, 24, 200, 360));
  enemies.push(new Enemy(780, groundY - 174, 24, 24, 760, 900));

  // Coins
  coins.push(new Coin(240, groundY - 160));
  coins.push(new Coin(520, groundY - 220));
  coins.push(new Coin(840, groundY - 170));
  coins.push(new Coin(100, groundY - 20)); // near ground

  const spawn = { x: 60, y: groundY - 40 - 28 }; // subtract mario height

  return { solids, enemies, coins, spawn, world: { width: 1200, height: 544 } };
}

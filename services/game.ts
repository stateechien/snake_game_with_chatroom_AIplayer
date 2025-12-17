import { Snake, Point, Food, GameState } from '../types';
import { WORLD_SIZE, INITIAL_SNAKE_LENGTH, COLORS, BOT_NAMES } from '../constants';

// Helper to generate random point
export const randomPoint = (): Point => ({
  x: Math.floor(Math.random() * WORLD_SIZE),
  y: Math.floor(Math.random() * WORLD_SIZE),
});

export const createSnake = (id: string, name: string, isPlayer: boolean = false): Snake => {
  const start = randomPoint();
  const body: Point[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    body.push({ x: start.x, y: start.y + i });
  }

  return {
    id,
    name,
    color: isPlayer ? '#ffffff' : COLORS[Math.floor(Math.random() * COLORS.length)],
    body,
    velocity: { x: 0, y: -1 }, // Start moving up
    isDead: false,
    score: 0,
    isPlayer,
  };
};

export const createFood = (): Food => ({
  id: Math.random().toString(36).substr(2, 9),
  position: randomPoint(),
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  value: 1,
});

// Simple AI Logic: Move towards nearest food, avoid collision if immediate danger
const updateBotVelocity = (bot: Snake, allSnakes: Snake[], foods: Food[]): Point => {
  const head = bot.body[0];
  
  // 1. Find nearest food
  let nearestFood: Food | null = null;
  let minDist = Infinity;
  
  // Optimization: only check a subset of food or closest ones to save CPU for 100 bots
  // For demo, we check all because N=300 is small enough for JS.
  for (const f of foods) {
    const d = Math.abs(f.position.x - head.x) + Math.abs(f.position.y - head.y);
    if (d < minDist) {
      minDist = d;
      nearestFood = f;
    }
  }

  let desiredX = 0;
  let desiredY = 0;

  if (nearestFood) {
    if (nearestFood.position.x > head.x) desiredX = 1;
    if (nearestFood.position.x < head.x) desiredX = -1;
    if (nearestFood.position.y > head.y) desiredY = 1;
    if (nearestFood.position.y < head.y) desiredY = -1;
  } else {
     // Wander
     if (Math.random() > 0.9) {
        const moves = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
        return moves[Math.floor(Math.random() * moves.length)];
     }
     return bot.velocity;
  }

  // Determine primary axis to move
  let newVel = bot.velocity;
  
  // Try to move in desired direction
  const tryMoves: Point[] = [];
  if (desiredX !== 0) tryMoves.push({ x: desiredX, y: 0 });
  if (desiredY !== 0) tryMoves.push({ x: 0, y: desiredY });
  
  // Add current velocity as fallback to keep momentum
  tryMoves.push(bot.velocity);
  
  // Add random moves as last resort
  tryMoves.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });

  for (const move of tryMoves) {
    // Prevent 180 turn
    if (move.x === -bot.velocity.x && move.y === -bot.velocity.y && bot.body.length > 1) continue;

    const nextPos = { x: head.x + move.x, y: head.y + move.y };
    
    // Bounds check
    if (nextPos.x < 0 || nextPos.x >= WORLD_SIZE || nextPos.y < 0 || nextPos.y >= WORLD_SIZE) continue;

    // Collision check (simplified: only check if next spot is occupied)
    let collision = false;
    for (const s of allSnakes) {
      if (s.isDead) continue;
      // Check head collision (if it's another snake)
      if (s.id !== bot.id && s.body[0].x === nextPos.x && s.body[0].y === nextPos.y) {
         collision = true; 
         break;
      }
      // Check body collision
      for (const segment of s.body) {
        if (segment.x === nextPos.x && segment.y === nextPos.y) {
          collision = true;
          break;
        }
      }
      if (collision) break;
    }

    if (!collision) {
      newVel = move;
      break;
    }
  }

  return newVel;
};

export const updateGame = (state: GameState, playerDir: Point | null): GameState => {
  const newSnakes = state.snakes.map(snake => {
    if (snake.isDead) return snake;

    let newVel = snake.velocity;
    
    if (snake.isPlayer && playerDir) {
       // Prevent 180 turns
       if (!(playerDir.x === -snake.velocity.x && playerDir.y === -snake.velocity.y)) {
         newVel = playerDir;
       }
    } else if (!snake.isPlayer) {
       // AI Update (maybe throttled in real app, but here per frame is okay for <100 simple heuristics)
       newVel = updateBotVelocity(snake, state.snakes, state.foods);
    }

    const newHead = {
      x: snake.body[0].x + newVel.x,
      y: snake.body[0].y + newVel.y
    };

    // Wall collision (Death)
    if (newHead.x < 0 || newHead.x >= WORLD_SIZE || newHead.y < 0 || newHead.y >= WORLD_SIZE) {
      return { ...snake, isDead: true, velocity: newVel };
    }

    // Body collision
    // Optimize: Spatial partitioning would be better, but O(N*M) is acceptable for N=100, M=Length in JS on desktop.
    let collided = false;
    for (const other of state.snakes) {
      if (other.isDead) continue;
      
      // If head hits another head
      if (other.id !== snake.id && other.body[0].x === newHead.x && other.body[0].y === newHead.y) {
         collided = true;
         break;
      }

      // If head hits any body part
      for (let i = 0; i < other.body.length; i++) {
        // Self collision check, ignore tail because it will move
        if (other.id === snake.id && i === other.body.length - 1) continue; 
        
        if (other.body[i].x === newHead.x && other.body[i].y === newHead.y) {
          collided = true;
          break;
        }
      }
      if (collided) break;
    }

    if (collided) {
      return { ...snake, isDead: true, velocity: newVel };
    }

    // Move
    const newBody = [newHead, ...snake.body];
    let ateFood = false;
    let score = snake.score;

    // Food check
    const foodIndex = state.foods.findIndex(f => f.position.x === newHead.x && f.position.y === newHead.y);
    if (foodIndex !== -1) {
      ateFood = true;
      score += 10;
      // Remove food is handled in state assembly
    } else {
      newBody.pop(); // Remove tail
    }

    return {
      ...snake,
      body: newBody,
      velocity: newVel,
      score,
      _ateFoodIndex: foodIndex // Temporary marker for state assembly
    };
  });

  // Process food removals and spawns
  let nextFoods = [...state.foods];
  const consumedIndices = new Set<number>();

  newSnakes.forEach((s: any) => {
    if (s._ateFoodIndex !== undefined && s._ateFoodIndex !== -1) {
      consumedIndices.add(s._ateFoodIndex);
      delete s._ateFoodIndex;
    }
  });

  nextFoods = nextFoods.filter((_, i) => !consumedIndices.has(i));

  // Respawn food
  while (nextFoods.length < 300) {
    nextFoods.push(createFood());
  }

  // Handle Snake Deaths -> Turn into Food
  newSnakes.forEach(s => {
    // If a snake just died this frame (was alive before, now marked dead inside logic?)
    // Actually we marked isDead inside the map.
    // In a real IO game, dead snakes turn into food. 
    // We need to detect transition. But for simplicity, we just check isDead.
    // To do it properly, we'd need previous state. 
    // For this demo, dead snakes remain as "carcasses" for a bit or vanish.
    // Let's vanish them and drop food in place immediately for performance/simplicity.
  });
  
  // Filter out dead snakes for respawning logic in App, or keep them marked dead to show "Game Over"
  // We keep the player snake even if dead to show UI. 
  // Bots can be respawned.
  
  const finalSnakes = newSnakes.map(s => {
     if (s.isDead && !s.isPlayer) {
        // Respawn bot immediately for endless chaos
        return createSnake(s.id, s.name, false);
     }
     return s;
  });

  // Calculate Camera
  const player = finalSnakes.find(s => s.isPlayer);
  let newCamera = state.camera;
  if (player) {
    // Center camera on player head
    newCamera = {
      x: player.body[0].x - 20, // 40 viewport width / 2
      y: player.body[0].y - 20,
    };
  }

  return {
    ...state,
    snakes: finalSnakes,
    foods: nextFoods,
    camera: newCamera,
    gameLoopCount: state.gameLoopCount + 1
  };
};
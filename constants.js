export const GAME_STATE = {
  READY: "ready",
  RUNNING: "running",
  GAME_OVER: "over",
};

export const LANES = [-2.6, 0, 2.6];
export const PLAYER_BASE_Y = 0.42;
export const MARKER_SPACING = 13;
export const MARKER_ROWS = 20;
export const GRAVITY = 29;
export const PLAYER_ACCEL_RATE = 1.005;
export const PLAYER_START_SPEED = 60;
export const PLAYER_START_TARGET_SPEED = 60;
export const PLAYER_SPEED_LOG_FACTOR = 40;

export const STORAGE_KEY = "street-sprint-best";

export const SCENERY_SEGMENT_LENGTH = 28;
export const SCENERY_SEGMENT_COUNT = 14;
export const SCENERY_SCROLL_FACTOR = 0.62;
export const SCENERY_RESET_Z = 48;
export const SCENERY_LOOP_LENGTH =
  SCENERY_SEGMENT_LENGTH * SCENERY_SEGMENT_COUNT;

export const BEAR_SPAWN_BASE_INTERVAL = 12;
export const BEAR_DESPAWN_Z = 28;

export const WRONG_WAY_SPAWN_INTERVAL = 10;
export const POLICE_DESIRED_GAP = 35;

export const ENEMY_PALETTE = [
  0x4361ee,
  0x4895ef,
  0x4cc9f0,
  0xff006e,
  0xff924c,
  0xb5179e,
];

export const COIN_SCORE_VALUE = 150;
export const COIN_SPAWN_MIN_INTERVAL = 1.8;
export const COIN_SPAWN_MAX_INTERVAL = 4.5;
export const COIN_MAX_ACTIVE = 3;

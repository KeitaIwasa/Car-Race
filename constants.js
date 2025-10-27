export const GAME_STATE = {
  READY: "ready",
  RUNNING: "running",
  GAME_OVER: "over",
};

export const GAME_CANVAS_WIDTH = 360;
export const GAME_CANVAS_HEIGHT = 640;
export const GAME_CANVAS_ASPECT =
  GAME_CANVAS_HEIGHT / GAME_CANVAS_WIDTH;
export const VIEWPORT_RESIZE_DEBOUNCE_MS = 150;

export const LANES = [-2.6, 0, 2.6];
export const PLAYER_BASE_Y = 0.42;
export const MARKER_SPACING = 13;
export const MARKER_ROWS = 20;
export const GRAVITY = 30;
export const PLAYER_ACCEL_RATE = 1.005;
export const PLAYER_START_SPEED = 55;
export const PLAYER_START_TARGET_SPEED = 55;
export const PLAYER_SPEED_LOG_FACTOR = 40;

export const STORAGE_KEY = "street-sprint-best";

export const SCENERY_SEGMENT_LENGTH = 28;
export const SCENERY_SEGMENT_COUNT = 14;
export const SCENERY_SCROLL_FACTOR = 0.62;
export const SCENERY_RESET_Z = 48;
export const SCENERY_LOOP_LENGTH =
  SCENERY_SEGMENT_LENGTH * SCENERY_SEGMENT_COUNT;

// 同時に表示する雲スプライトの総数で、空を賑やかにする。
export const CLOUD_COUNT = 40;
// 雲レイヤーの基準となる世界座標Yの高さ。
export const CLOUD_LAYER_BASE_Y = 40;
// 各雲に与えるランダムな高さのばらつき。
export const CLOUD_LAYER_VARIANCE = 3;
// 雲を生成するときに使うX方向の半径で、横幅の広さを決める。
export const CLOUD_SPAWN_RADIUS_X = 50;
// カメラスクロールに対する雲のパララックス係数。
export const CLOUD_SCROLL_FACTOR = 0.1;
// このZ距離を超えると雲を前方へリサイクルする閾値。
export const CLOUD_RESET_Z = 60;
// 背景ループに対して雲が循環するZ方向の長さ。
export const CLOUD_LOOP_LENGTH = SCENERY_LOOP_LENGTH + 160;
// 雲に与える左右ドリフト速度の最大値。
export const CLOUD_DRIFT_MAX = 0;

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
export const COIN_SPAWN_MIN_INTERVAL = 0.5;
export const COIN_SPAWN_MAX_INTERVAL = 3;
export const COIN_MAX_ACTIVE = 3;
export const SCORE_POPUP_DURATION = 0.3;

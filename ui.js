const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const startButton = document.getElementById("start-button");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const speedEl = document.getElementById("speed");
const touchLeft = document.getElementById("left-touch");
const touchRight = document.getElementById("right-touch");
const touchJump = document.getElementById("jump-touch");

export {
  canvas,
  overlay,
  overlayTitle,
  overlayBody,
  startButton,
  scoreEl,
  bestEl,
  speedEl,
  touchLeft,
  touchRight,
  touchJump,
};

export function updateHud(state) {
  scoreEl.textContent = Math.floor(state.score).toString();
  bestEl.textContent = state.best.toString();
  speedEl.textContent = `${Math.round(state.player.speed * 3.2)} km/h`;
}

export function hideOverlay() {
  overlay.classList.add("hidden");
}

export function showOverlay({ title, body, buttonLabel }) {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  startButton.textContent = buttonLabel;
  overlay.classList.remove("hidden");
}

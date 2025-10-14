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
const scoreLabelEl = document.querySelector('[data-i18n="score-label"]');
const bestLabelEl = document.querySelector('[data-i18n="best-label"]');
const speedLabelEl = document.querySelector('[data-i18n="speed-label"]');
const howtoHeading = document.getElementById("howto-heading");
const howtoList = document.getElementById("howto-list");

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
  howtoHeading,
  howtoList,
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

export function initializeUiText(strings) {
  if (scoreLabelEl) scoreLabelEl.textContent = strings.scoreLabel;
  if (bestLabelEl) bestLabelEl.textContent = strings.bestLabel;
  if (speedLabelEl) speedLabelEl.textContent = strings.speedLabel;
  if (howtoHeading) howtoHeading.textContent = strings.instructionsHeading;
  if (howtoList) {
    howtoList.innerHTML = "";
    strings.instructions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      howtoList.appendChild(li);
    });
  }
}

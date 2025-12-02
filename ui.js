const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const levelButtonsContainer = document.getElementById("level-buttons");
const levelScoresContainer = document.getElementById("level-scores");
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

let lastScoreText = null;
let lastBestText = null;
let lastSpeedValue = null;

export {
  canvas,
  overlay,
  overlayTitle,
  overlayBody,
  levelButtonsContainer,
  levelScoresContainer,
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
  if (!state) {
    return;
  }

  const nextScoreText = Math.floor(state.score).toString();
  if (scoreEl && nextScoreText !== lastScoreText) {
    scoreEl.textContent = nextScoreText;
    lastScoreText = nextScoreText;
  }

  const nextBestText = state.best.toString();
  if (bestEl && nextBestText !== lastBestText) {
    bestEl.textContent = nextBestText;
    lastBestText = nextBestText;
  }

  updateSpeedometer(state);
}

export function updateSpeedometer(state) {
  if (!state?.player || !speedEl) {
    return;
  }

  const nextSpeedValue = Math.round(state.player.speed * 3.2);
  if (nextSpeedValue === lastSpeedValue) {
    return;
  }

  lastSpeedValue = nextSpeedValue;
  speedEl.textContent = `${nextSpeedValue} km/h`;
}

export function hideOverlay() {
  overlay.classList.add("hidden");
}

export function showOverlay({ title, body }) {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
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

export function renderLevelSelectors(levels, onLevelSelect) {
  if (!levelButtonsContainer || !levelScoresContainer) {
    return;
  }

  levelButtonsContainer.innerHTML = "";
  levelScoresContainer.innerHTML = "";

  levels.forEach((level) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn level-btn";
    btn.dataset.levelId = level.id;
    btn.textContent = level.label;
    btn.addEventListener("click", () => {
      onLevelSelect?.(level.id);
    });
    levelButtonsContainer.appendChild(btn);

    const card = document.createElement("div");
    card.className = "level-score";
    card.dataset.levelId = level.id;

    const name = document.createElement("span");
    name.className = "level-score__name";
    name.textContent = level.label;

    const value = document.createElement("span");
    value.className = "level-score__value";
    value.dataset.levelBest = level.id;
    value.textContent = "0";

    card.appendChild(name);
    card.appendChild(value);
    levelScoresContainer.appendChild(card);
  });
}

export function updateLevelBests(bestByLevel = {}) {
  if (!levelScoresContainer) return;
  levelScoresContainer.querySelectorAll("[data-level-best]").forEach((el) => {
    const levelId = el.dataset.levelBest;
    const best = bestByLevel[levelId] ?? 0;
    el.textContent = Math.floor(best);
  });
}

export function highlightActiveLevel(levelId) {
  if (!levelButtonsContainer || !levelScoresContainer) return;
  levelButtonsContainer.querySelectorAll(".level-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.levelId === levelId);
  });
  levelScoresContainer.querySelectorAll(".level-score").forEach((card) => {
    card.classList.toggle("active", card.dataset.levelId === levelId);
  });
}

const boardElement = document.getElementById("board");
const moveCountElement = document.getElementById("moveCount");
const timerElement = document.getElementById("timer");
const bestMovesElement = document.getElementById("bestMoves");
const messageElement = document.getElementById("message");

const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");
const hintBtn = document.getElementById("hintBtn");

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let state = [...SOLVED];
let moves = 0;
let seconds = 0;
let timerId = null;
let gameRunning = false;

const bestMoves = Number(localStorage.getItem("eightPuzzleBestMoves"));
if (Number.isFinite(bestMoves) && bestMoves > 0) {
  bestMovesElement.textContent = String(bestMoves);
}

function renderBoard() {
  boardElement.innerHTML = "";
  const emptyIndex = state.indexOf(0);

  state.forEach((value, index) => {
    const isMovable = canMove(index, emptyIndex);
    if (value === 0) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "empty";
      emptyCell.setAttribute("role", "gridcell");
      boardElement.appendChild(emptyCell);
      return;
    }

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tile${isMovable ? " can-move" : ""}`;
    tile.textContent = String(value);
    tile.setAttribute("role", "gridcell");
    tile.setAttribute("aria-label", `Tile ${value}`);
    tile.addEventListener("click", () => moveTile(index));
    boardElement.appendChild(tile);
  });
}

function canMove(tileIndex, emptyIndex) {
  const tileRow = Math.floor(tileIndex / 3);
  const tileCol = tileIndex % 3;
  const emptyRow = Math.floor(emptyIndex / 3);
  const emptyCol = emptyIndex % 3;
  return Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) === 1;
}

function moveTile(index) {
  const emptyIndex = state.indexOf(0);
  if (!canMove(index, emptyIndex)) {
    return;
  }

  state[emptyIndex] = state[index];
  state[index] = 0;
  moves += 1;
  moveCountElement.textContent = String(moves);

  if (!gameRunning) {
    startTimer();
    gameRunning = true;
  }

  renderBoard();

  if (isSolved()) {
    onWin();
  }
}

function shuffleBoard(steps = 120) {
  stopTimer();
  state = [...SOLVED];
  let emptyIndex = state.indexOf(0);
  let previousIndex = -1;

  // Shuffle by applying legal random moves to keep the puzzle solvable.
  for (let i = 0; i < steps; i += 1) {
    const neighbors = getNeighbors(emptyIndex).filter((idx) => idx !== previousIndex);
    const nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
    state[emptyIndex] = state[nextIndex];
    state[nextIndex] = 0;
    previousIndex = emptyIndex;
    emptyIndex = nextIndex;
  }

  if (isSolved()) {
    shuffleBoard(steps + 10);
    return;
  }

  moves = 0;
  seconds = 0;
  gameRunning = false;
  updateTimer();
  moveCountElement.textContent = "0";
  messageElement.textContent = "Game started. Good luck!";
  messageElement.classList.remove("win");
  renderBoard();
}

function getNeighbors(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const neighbors = [];

  if (row > 0) neighbors.push(index - 3);
  if (row < 2) neighbors.push(index + 3);
  if (col > 0) neighbors.push(index - 1);
  if (col < 2) neighbors.push(index + 1);

  return neighbors;
}

function isSolved() {
  return state.every((value, idx) => value === SOLVED[idx]);
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateTimer() {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  timerElement.textContent = `${mins}:${secs}`;
}

function onWin() {
  stopTimer();
  gameRunning = false;
  messageElement.textContent = `Solved in ${moves} moves and ${timerElement.textContent}!`;
  messageElement.classList.add("win");

  const currentBest = Number(localStorage.getItem("eightPuzzleBestMoves"));
  if (!Number.isFinite(currentBest) || moves < currentBest) {
    localStorage.setItem("eightPuzzleBestMoves", String(moves));
    bestMovesElement.textContent = String(moves);
  }
}

function resetBoard() {
  stopTimer();
  state = [...SOLVED];
  moves = 0;
  seconds = 0;
  gameRunning = false;
  moveCountElement.textContent = "0";
  updateTimer();
  messageElement.textContent = "Press Shuffle to begin.";
  messageElement.classList.remove("win");
  renderBoard();
}

function showHint() {
  const emptyIndex = state.indexOf(0);
  const candidates = getNeighbors(emptyIndex).map((idx) => state[idx]).sort((a, b) => a - b);
  messageElement.textContent = `Hint: Try moving tile ${candidates[0]}.`;
  messageElement.classList.remove("win");
}

shuffleBtn.addEventListener("click", () => shuffleBoard());
resetBtn.addEventListener("click", resetBoard);
hintBtn.addEventListener("click", showHint);

window.addEventListener("keydown", (event) => {
  const emptyIndex = state.indexOf(0);
  const row = Math.floor(emptyIndex / 3);
  const col = emptyIndex % 3;
  let targetIndex = -1;

  if (event.key === "ArrowUp" && row < 2) targetIndex = emptyIndex + 3;
  if (event.key === "ArrowDown" && row > 0) targetIndex = emptyIndex - 3;
  if (event.key === "ArrowLeft" && col < 2) targetIndex = emptyIndex + 1;
  if (event.key === "ArrowRight" && col > 0) targetIndex = emptyIndex - 1;

  if (targetIndex >= 0) {
    event.preventDefault();
    moveTile(targetIndex);
  }
});

resetBoard();

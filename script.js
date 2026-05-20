const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restart');
const backToMenuButton = document.getElementById('back-to-menu');
const exitButton = document.getElementById('exit-game');
const winningLineElement = document.getElementById('winning-line');
const startScreen = document.getElementById('start-screen');
const gamePanel = document.getElementById('game-panel');
const startButtons = document.querySelectorAll('.start-button');
const rolesElement = document.getElementById('roles');

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let boardState;
let currentPlayer;
let isGameActive;
let gameMode = null;
let aiTimeoutId;

function startGame(mode) {
  gameMode = mode;
  startScreen.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  initializeGame();
}

function initializeGame() {
  boardState = Array(9).fill('');
  currentPlayer = gameMode === 'pvp' ? 'O' : 'X';
  isGameActive = true;
  clearTimeout(aiTimeoutId);
  clearWinningLine();
  updateRoles();
  updateStatus();
  boardElement.innerHTML = '';

  boardState.forEach((_, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.setAttribute('data-index', index);
    cell.setAttribute('aria-label', `Cell ${index + 1}`);
    cell.addEventListener('click', handleCellClick);
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCellClick(event);
      }
    });
    boardElement.appendChild(cell);
  });
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  if (!isGameActive || boardState[index] || (gameMode === 'pvc' && currentPlayer === 'O')) {
    return;
  }

  boardState[index] = currentPlayer;
  cell.textContent = currentPlayer;

  const winner = checkWinner();
  if (winner) {
    isGameActive = false;
    statusElement.textContent = getWinnerLabel(winner);
    highlightWinningCells(winner);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();

  if (gameMode === 'pvc' && currentPlayer === 'O') {
    aiTimeoutId = setTimeout(makeComputerMove, 260);
  }
}

function checkWinner() {
  for (const combo of winningCombos) {
    const [a, b, c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return boardState[a];
    }
  }

  return boardState.every(Boolean) ? 'draw' : null;
}

function makeComputerMove() {
  if (!isGameActive) {
    return;
  }

  const index = chooseComputerMove();
  if (index === null || boardState[index]) {
    return;
  }

  boardState[index] = 'O';
  const cell = boardElement.querySelector(`.cell[data-index="${index}"]`);
  if (cell) {
    cell.textContent = 'O';
  }

  const winner = checkWinner();
  if (winner) {
    isGameActive = false;
    statusElement.textContent = getWinnerLabel(winner);
    highlightWinningCells(winner);
    return;
  }

  currentPlayer = 'X';
  updateStatus();
}

function chooseComputerMove() {
  const winIndex = findWinningMove('O');
  if (winIndex !== null) {
    return winIndex;
  }

  const blockIndex = findWinningMove('X');
  if (blockIndex !== null) {
    return blockIndex;
  }

  if (!boardState[4]) {
    return 4;
  }

  const corners = [0, 2, 6, 8].filter((index) => !boardState[index]);
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  const sides = [1, 3, 5, 7].filter((index) => !boardState[index]);
  return sides.length ? sides[Math.floor(Math.random() * sides.length)] : null;
}

function findWinningMove(player) {
  for (const combo of winningCombos) {
    const [a, b, c] = combo;
    const values = [boardState[a], boardState[b], boardState[c]];
    const playerCount = values.filter((value) => value === player).length;
    const emptyCount = values.filter((value) => !value).length;
    if (playerCount === 2 && emptyCount === 1) {
      return combo[values.indexOf('')];
    }
  }
  return null;
}

function highlightWinningCells(winner) {
  if (winner === 'draw') {
    return;
  }

  winningCombos.forEach((combo) => {
    const [a, b, c] = combo;
    if (boardState[a] === winner && boardState[b] === winner && boardState[c] === winner) {
      combo.forEach((index) => {
        const cell = boardElement.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
          cell.style.background = 'rgba(124, 92, 255, 0.25)';
          cell.style.borderColor = '#7c5cff';
        }
      });
      showWinningLine(combo);
    }
  });
}

function showWinningLine(combo) {
  if (!winningLineElement) {
    return;
  }

  winningLineElement.className = 'winning-line active';
  const [a, b, c] = combo;
  if (a + 1 === b && b + 1 === c) {
    const row = Math.floor(a / 3);
    winningLineElement.classList.add(`row-${row}`);
  } else if (a + 3 === b && b + 3 === c) {
    const col = a % 3;
    winningLineElement.classList.add(`col-${col}`);
  } else if (combo.includes(0) && combo.includes(4) && combo.includes(8)) {
    winningLineElement.classList.add('diag-main');
  } else {
    winningLineElement.classList.add('diag-alt');
  }
}

function clearWinningLine() {
  if (winningLineElement) {
    winningLineElement.className = 'winning-line';
  }
}

function updateStatus() {
  if (!isGameActive) {
    return;
  }

  if (gameMode === 'pvc') {
    statusElement.textContent = currentPlayer === 'O'
      ? 'Computer is thinking...'
      : `Player (X)'s turn`;
  } else {
    statusElement.textContent = currentPlayer === 'O'
      ? "Player 1 (O)'s turn"
      : "Player 2 (X)'s turn";
  }
}

function updateRoles() {
  if (gameMode === 'pvc') {
    rolesElement.innerHTML = `
      <div class="role-card">
        <div class="role-symbol">O</div>
        <div class="role-label">Computer</div>
      </div>
      <div class="role-card">
        <div class="role-symbol">X</div>
        <div class="role-label">Player</div>
      </div>
    `;
  } else {
    rolesElement.innerHTML = `
      <div class="role-card">
        <div class="role-symbol">O</div>
        <div class="role-label">Player 1</div>
      </div>
      <div class="role-card">
        <div class="role-symbol">X</div>
        <div class="role-label">Player 2</div>
      </div>
    `;
  }
}

startButtons.forEach((button) => {
  button.addEventListener('click', () => startGame(button.dataset.mode));
});

backToMenuButton.addEventListener('click', () => {
  clearTimeout(aiTimeoutId);
  gamePanel.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

exitButton.addEventListener('click', () => {
  clearTimeout(aiTimeoutId);
  if (window.close) {
    window.close();
  } else {
    gamePanel.classList.add('hidden');
    startScreen.classList.remove('hidden');
    statusElement.textContent = 'Game exited. Choose mode again.';
  }
});

restartButton.addEventListener('click', initializeGame);

function getWinnerLabel(winner) {
  if (winner === 'draw') {
    return "It's a draw!";
  }

  if (gameMode === 'pvc') {
    return winner === 'O' ? 'Computer wins!' : 'Player wins!';
  }

  return winner === 'O' ? 'Player 1 wins!' : 'Player 2 wins!';
}

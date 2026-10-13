const SIZE = 9;
const BOX = 3;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const state = {
  puzzle: [],
  solution: [],
  steps: [],
  currentStep: 0,
  autoplayTimer: null,
  isPlaying: false,
};

const elements = {
  grid: document.querySelector('#sudokuGrid'),
  refresh: document.querySelector('#refreshButton'),
  previous: document.querySelector('#previousButton'),
  next: document.querySelector('#nextButton'),
  autoplay: document.querySelector('#autoplayButton'),
  reset: document.querySelector('#resetButton'),
  slider: document.querySelector('#stepSlider'),
  stepCounter: document.querySelector('#stepCounter'),
  depthCounter: document.querySelector('#depthCounter'),
  status: document.querySelector('#solverStatus'),
  action: document.querySelector('#actionBadge'),
  cell: document.querySelector('#cellBadge'),
  message: document.querySelector('#iterationMessage'),
  candidates: document.querySelector('#candidateLine'),
  givens: document.querySelector('#givensCount'),
};

function indexOf(row, col) {
  return row * SIZE + col;
}

function rowOf(index) {
  return Math.floor(index / SIZE);
}

function colOf(index) {
  return index % SIZE;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function peersFor(index) {
  const row = rowOf(index);
  const col = colOf(index);
  const peers = new Set();
  for (let i = 0; i < SIZE; i += 1) {
    peers.add(indexOf(row, i));
    peers.add(indexOf(i, col));
  }
  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;
  for (let r = startRow; r < startRow + BOX; r += 1) {
    for (let c = startCol; c < startCol + BOX; c += 1) peers.add(indexOf(r, c));
  }
  peers.delete(index);
  return peers;
}

function candidatesFor(board, index) {
  if (board[index] !== 0) return [];
  const used = new Set();
  peersFor(index).forEach((peer) => {
    if (board[peer] !== 0) used.add(board[peer]);
  });
  return DIGITS.filter((digit) => !used.has(digit));
}

function fillSolvedBoard(board) {
  const empty = board.findIndex((value) => value === 0);
  if (empty === -1) return true;
  const options = shuffle(candidatesFor(board, empty));
  for (const value of options) {
    board[empty] = value;
    if (fillSolvedBoard(board)) return true;
    board[empty] = 0;
  }
  return false;
}

function createPuzzle() {
  const solved = Array(SIZE * SIZE).fill(0);
  fillSolvedBoard(solved);
  const puzzle = [...solved];
  const cellsToRemove = 46;
  shuffle([...Array(SIZE * SIZE).keys()]).slice(0, cellsToRemove).forEach((index) => {
    puzzle[index] = 0;
  });
  return { puzzle, solution: solved };
}

function recordStep(board, action, message, index = null, value = null, depth = 0, candidates = []) {
  state.steps.push({
    board: [...board], action, message, index, value, depth, candidates: [...candidates],
  });
}

function findBestCell(board) {
  let bestIndex = -1;
  let bestCandidates = null;
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== 0) continue;
    const options = candidatesFor(board, index);
    if (options.length === 0) return { index, candidates: [] };
    if (!bestCandidates || options.length < bestCandidates.length) {
      bestIndex = index;
      bestCandidates = options;
      if (options.length === 1) break;
    }
  }
  return { index: bestIndex, candidates: bestCandidates || [] };
}

function propagate(board, depth) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== 0) continue;
      const options = candidatesFor(board, index);
      if (options.length === 0) {
        recordStep(board, 'contradiction', `Cell ${cellName(index)} has no legal values. The solver must backtrack.`, index, null, depth);
        return false;
      }
      if (options.length === 1) {
        board[index] = options[0];
        recordStep(board, 'propagation', `Only ${options[0]} fits here after applying the row, column, and box constraints.`, index, options[0], depth, options);
        changed = true;
      }
    }
  }
  return true;
}

function search(board, depth = 0) {
  if (!propagate(board, depth)) return null;
  const choice = findBestCell(board);
  if (choice.index === -1) return board;
  if (choice.candidates.length === 0) {
    recordStep(board, 'contradiction', `The selected cell ${cellName(choice.index)} has no candidates.`, choice.index, null, depth);
    return null;
  }

  recordStep(board, 'selection', `MRV selects ${cellName(choice.index)} because it has the fewest remaining candidates.`, choice.index, null, depth, choice.candidates);
  for (const value of shuffle(choice.candidates)) {
    const next = [...board];
    next[choice.index] = value;
    recordStep(next, 'placement', `Try ${value} in ${cellName(choice.index)} and continue searching.`, choice.index, value, depth, choice.candidates);
    const result = search(next, depth + 1);
    if (result) return result;
    recordStep(board, 'backtrack', `The trial value ${value} leads to a contradiction, so the solver backtracks.`, choice.index, value, depth, choice.candidates);
  }
  return null;
}

function cellName(index) {
  return `R${rowOf(index) + 1}C${colOf(index) + 1}`;
}

function buildSteps(puzzle) {
  state.steps = [];
  recordStep(puzzle, 'start', 'The puzzle is ready. Start autoplay or move through the iterations manually.', null, null, 0);
  const solved = search([...puzzle]);
  if (solved) {
    recordStep(solved, 'complete', 'All cells satisfy the Sudoku constraints. The puzzle is solved.', null, null, 0);
  }
  return solved || [...puzzle];
}

function renderGrid() {
  const step = state.steps[state.currentStep] || { board: state.puzzle, index: null };
  elements.grid.innerHTML = '';
  step.board.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${cellName(index)} ${value || 'empty'}`);
    if (state.puzzle[index] !== 0) cell.classList.add('given');
    else if (value !== 0) cell.classList.add('generated');
    if (index === step.index) cell.classList.add('selected');
    if (index === step.index && step.action !== 'selection') cell.classList.add('changed');
    cell.textContent = value || '';
    elements.grid.appendChild(cell);
  });
}

function renderControls() {
  const step = state.steps[state.currentStep] || {};
  const total = Math.max(0, state.steps.length - 1);
  elements.stepCounter.textContent = `${state.currentStep} / ${total}`;
  elements.depthCounter.textContent = step.depth ?? 0;
  elements.slider.max = total;
  elements.slider.value = state.currentStep;
  elements.previous.disabled = state.currentStep === 0;
  elements.next.disabled = state.currentStep >= total;
  elements.reset.disabled = state.currentStep === 0;
  elements.action.textContent = actionLabel(step.action);
  elements.cell.textContent = step.index === null || step.index === undefined ? '—' : cellName(step.index);
  elements.message.textContent = step.message || '';
  if (step.candidates?.length) {
    elements.candidates.hidden = false;
    elements.candidates.textContent = `Candidates: ${step.candidates.join(' · ')}`;
  } else {
    elements.candidates.hidden = true;
  }
  elements.status.textContent = state.isPlaying ? 'Playing' : step.action === 'complete' ? 'Solved' : 'Ready';
  elements.autoplay.innerHTML = state.isPlaying ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">▶</span> Autoplay';
}

function actionLabel(action) {
  return ({
    start: 'Puzzle ready', selection: 'Heuristic selection', propagation: 'Constraint propagation', placement: 'Trial placement', contradiction: 'Contradiction found', backtrack: 'Backtracking', complete: 'Solved',
  }[action] || 'Solver iteration');
}

function render() {
  renderGrid();
  renderControls();
}

function goToStep(step) {
  state.currentStep = Math.max(0, Math.min(step, state.steps.length - 1));
  render();
}

function stopAutoplay() {
  state.isPlaying = false;
  if (state.autoplayTimer) clearTimeout(state.autoplayTimer);
  state.autoplayTimer = null;
}

function playNext() {
  if (!state.isPlaying) return;
  if (state.currentStep >= state.steps.length - 1) {
    stopAutoplay();
    render();
    return;
  }
  state.currentStep += 1;
  render();
  state.autoplayTimer = setTimeout(playNext, 190);
}

function toggleAutoplay() {
  if (state.isPlaying) {
    stopAutoplay();
    render();
    return;
  }
  if (state.currentStep >= state.steps.length - 1) state.currentStep = 0;
  state.isPlaying = true;
  render();
  state.autoplayTimer = setTimeout(playNext, 190);
}

function refreshPuzzle() {
  stopAutoplay();
  const generated = createPuzzle();
  state.puzzle = generated.puzzle;
  state.solution = generated.solution;
  state.currentStep = 0;
  buildSteps(state.puzzle);
  const givens = state.puzzle.filter(Boolean).length;
  elements.givens.textContent = `${givens} givens`;
  render();
}

elements.refresh.addEventListener('click', refreshPuzzle);
elements.previous.addEventListener('click', () => { stopAutoplay(); goToStep(state.currentStep - 1); });
elements.next.addEventListener('click', () => { stopAutoplay(); goToStep(state.currentStep + 1); });
elements.reset.addEventListener('click', () => { stopAutoplay(); goToStep(0); });
elements.autoplay.addEventListener('click', toggleAutoplay);
elements.slider.addEventListener('input', (event) => { stopAutoplay(); goToStep(Number(event.target.value)); });

refreshPuzzle();

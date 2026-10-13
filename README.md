# Sudoku Solver Lab

## Project description

Sudoku Solver Lab is an interactive Artificial Intelligence and Soft Computing project. It generates a random valid Sudoku puzzle and visualizes an AI solver as it reasons through the puzzle. The user can inspect every iteration manually or watch the complete solving process through autoplay.

The project is intentionally built as a small, dependency-free website with HTML, CSS, and JavaScript. This makes the algorithm easy to demonstrate, modify, and explain during a viva.

## AI concepts used

### 1. Problem formulation

The Sudoku grid is the problem state. A state is represented as 81 cells, where `0` means that a cell is empty.

### 2. Constraint satisfaction problem

Each empty cell is a variable with a domain of possible values from 1 to 9. Three constraint groups must always be satisfied:

- Every row contains each number at most once.
- Every column contains each number at most once.
- Every 3×3 box contains each number at most once.

### 3. State-space search

Each number placement produces a new partial-grid state. The solver searches through these states until it reaches a complete valid grid.

### 4. Heuristic search using MRV

The Minimum Remaining Values heuristic selects the empty cell with the smallest number of legal candidates. This reduces the branching factor and makes the search more efficient than choosing cells in a fixed order.

### 5. Constraint propagation

Whenever a cell has only one legal candidate, the solver fills it immediately. This is a deduction step performed before branching into trial choices.

### 6. Backtracking

If a trial placement eventually causes a contradiction, the solver returns to the previous decision and tries another candidate. These events are visible in the iteration panel.

### 7. Explainable AI

Every recorded iteration includes an action label, a message, the selected cell, candidate values, and search depth. This makes the algorithm’s decisions understandable instead of presenting only the final answer.

## Project structure

```text
project/
├── index.html    # Page structure and project explanation
├── styles.css    # Simple responsive dark theme
├── app.js        # Puzzle generation, solver, controls, and visualization
└── README.md     # Build and viva documentation
```

## How to run the website

1. Open `index.html` in a modern web browser.
2. A valid random Sudoku puzzle is generated automatically.
3. Press **Next** to inspect one solver iteration at a time.
4. Press **Autoplay** to watch the complete process.
5. Use the range slider to jump to any recorded iteration.
6. Press **Return to puzzle start** to reset the current puzzle.
7. Press **Refresh puzzle** to generate a new random valid puzzle.

## Algorithm flow

```text
Generate a complete valid Sudoku solution
Remove 46 cells to create a playable puzzle
Record the initial puzzle state

Repeat during solving:
    Apply constraint propagation
    If a contradiction appears:
        backtrack to the previous decision
    If the grid is complete:
        finish
    Select an empty cell using MRV
    Try a candidate value
    Continue recursively
```

## Suggested demonstration during viva

1. Explain that Sudoku is naturally modeled as a constraint satisfaction problem.
2. Point out that the rows, columns, and boxes are the constraints.
3. Show the difference between a given number and an AI-generated placement.
4. Use **Next** to demonstrate MRV selection and constraint propagation.
5. Continue until a contradiction appears and explain backtracking.
6. Use autoplay to show the complete solver execution.
7. Discuss how MRV reduces unnecessary trial states compared with basic backtracking.

## Possible future improvements

- Add a difficulty selector based on the number of removed cells.
- Add a comparison mode for basic backtracking versus MRV.
- Count and display recursive calls and backtracks as performance metrics.
- Add puzzle input so a user can enter a custom Sudoku.
- Add an AC-3 implementation for a deeper constraint-propagation comparison.

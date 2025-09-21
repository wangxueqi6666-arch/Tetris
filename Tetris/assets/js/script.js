// 俄罗斯方块游戏

// 游戏常量
let BOARD_WIDTH = 10;
let BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 方块颜色
const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

// 方块形状定义
const PIECES = {
    I: [
        [[1, 1, 1, 1]],
        [[1],
         [1],
         [1],
         [1]]
    ],
    O: [
        [[1, 1],
         [1, 1]]
    ],
    T: [
        [[0, 1, 0],
         [1, 1, 1]],
        [[1, 0],
         [1, 1],
         [1, 0]],
        [[1, 1, 1],
         [0, 1, 0]],
        [[0, 1],
         [1, 1],
         [0, 1]]
    ],
    S: [
        [[0, 1, 1],
         [1, 1, 0]],
        [[1, 0],
         [1, 1],
         [0, 1]]
    ],
    Z: [
        [[1, 1, 0],
         [0, 1, 1]],
        [[0, 1],
         [1, 1],
         [1, 0]]
    ],
    J: [
        [[1, 0, 0],
         [1, 1, 1]],
        [[1, 1],
         [1, 0],
         [1, 0]],
        [[1, 1, 1],
         [0, 0, 1]],
        [[0, 1],
         [0, 1],
         [1, 1]]
    ],
    L: [
        [[0, 0, 1],
         [1, 1, 1]],
        [[1, 0],
         [1, 0],
         [1, 1]],
        [[1, 1, 1],
         [1, 0, 0]],
        [[1, 1],
         [0, 1],
         [0, 1]]
    ]
};

// DOM 元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverModal = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');
const boardWidthSlider = document.getElementById('board-width');
const boardHeightSlider = document.getElementById('board-height');
const widthValueSpan = document.getElementById('width-value');
const heightValueSpan = document.getElementById('height-value');

// 游戏状态
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;
let dropTime = 0;
let lastTime = 0;

// 初始化游戏板
function initBoard() {
    board = [];
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_WIDTH; col++) {
            board[row][col] = 0;
        }
    }
}

// 创建新方块
function createPiece() {
    const pieces = Object.keys(PIECES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const shapes = PIECES[randomPiece];
    
    return {
        type: randomPiece,
        shape: shapes[0],
        rotation: 0,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapes[0][0].length / 2),
        y: 0,
        color: COLORS[randomPiece]
    };
}

// 绘制方块
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 绘制方块形状
function drawPiece(ctx, piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                drawBlock(ctx, piece.x + col + offsetX, piece.y + row + offsetY, piece.color);
            }
        }
    }
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let col = 0; col <= BOARD_WIDTH; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let row = 0; row <= BOARD_HEIGHT; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
}

// 绘制游戏板
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景
    drawGrid();
    
    // 绘制已放置的方块
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }
    
    // 绘制当前方块
    if (currentPiece) {
        drawPiece(ctx, currentPiece);
    }
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = Math.floor((nextCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((nextCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2);
        
        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    drawBlock(nextCtx, offsetX + col, offsetY + row, nextPiece.color);
                }
            }
        }
    }
}

// 检查碰撞
function checkCollision(piece, dx = 0, dy = 0, rotation = null) {
    const shape = rotation !== null ? getRotatedShape(piece, rotation) : piece.shape;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = piece.x + col + dx;
                const newY = piece.y + row + dy;
                
                // 检查边界
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // 检查与已放置方块的碰撞
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 获取旋转后的形状
function getRotatedShape(piece, rotation) {
    const shapes = PIECES[piece.type];
    return shapes[rotation % shapes.length];
}

// 旋转方块
function rotatePiece() {
    if (!currentPiece) return;
    
    const newRotation = (currentPiece.rotation + 1) % PIECES[currentPiece.type].length;
    
    if (!checkCollision(currentPiece, 0, 0, newRotation)) {
        currentPiece.rotation = newRotation;
        currentPiece.shape = getRotatedShape(currentPiece, newRotation);
    }
}

// 移动方块
function movePiece(dx, dy) {
    if (!currentPiece) return;
    
    if (!checkCollision(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

// 放置方块
function placePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            row++; // 重新检查同一行
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateDisplay();
    }
}

// 硬降落
function hardDrop() {
    if (!currentPiece) return;
    
    while (movePiece(0, 1)) {
        score += 2;
    }
    
    placePiece();
    clearLines();
    spawnNewPiece();
}

// 生成新方块
function spawnNewPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    
    if (checkCollision(currentPiece)) {
        gameOver();
        return;
    }
    
    drawNextPiece();
}

// 更新显示
function updateDisplay() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 游戏循环
function gameStep(time) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropTime += deltaTime;
    
    const dropInterval = Math.max(50, 1000 - (level - 1) * 100);
    
    if (dropTime > dropInterval) {
        if (!movePiece(0, 1)) {
            placePiece();
            clearLines();
            spawnNewPiece();
        }
        dropTime = 0;
    }
    
    drawBoard();
    updateDisplay();
    
    if (gameRunning) {
        gameLoop = requestAnimationFrame(gameStep);
    }
}

// 更新画布大小
function updateCanvasSize() {
    canvas.width = BOARD_WIDTH * BLOCK_SIZE;
    canvas.height = BOARD_HEIGHT * BLOCK_SIZE;
}

// 开始游戏
function startGame() {
    // 更新游戏区域大小
    BOARD_WIDTH = parseInt(boardWidthSlider.value);
    BOARD_HEIGHT = parseInt(boardHeightSlider.value);
    updateCanvasSize();
    
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropTime = 0;
    lastTime = 0;
    gameRunning = true;
    gamePaused = false;
    
    currentPiece = null;
    nextPiece = createPiece();
    spawnNewPiece();
    
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    restartBtn.style.display = 'inline-block';
    gameOverModal.classList.add('hidden');
    
    // 禁用设置滑块
    boardWidthSlider.disabled = true;
    boardHeightSlider.disabled = true;
    
    updateDisplay();
    gameLoop = requestAnimationFrame(gameStep);
}

// 暂停/继续游戏
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '继续 (P)' : '暂停 (P)';
    
    if (!gamePaused) {
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(gameStep);
    }
}

// 重新开始游戏
function restartGame() {
    gameRunning = false;
    gamePaused = false;
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    gameOverModal.classList.add('hidden');
    
    // 启用设置滑块
    boardWidthSlider.disabled = false;
    boardHeightSlider.disabled = false;
    
    // 重置画布大小为默认值
    BOARD_WIDTH = parseInt(boardWidthSlider.value);
    BOARD_HEIGHT = parseInt(boardHeightSlider.value);
    updateCanvasSize();
    
    initBoard();
    drawBoard();
    updateDisplay();
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    gamePaused = false;
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    
    // 启用设置滑块
    boardWidthSlider.disabled = false;
    boardHeightSlider.disabled = false;
}

// 键盘事件
document.addEventListener('keydown', (e) => {
    // 快捷键处理
    switch (e.key.toLowerCase()) {
        case 's':
            if (!gameRunning) {
                startGame();
            }
            return;
        case 'p':
            if (gameRunning) {
                togglePause();
            }
            return;
        case 'r':
            if (gameRunning || gamePaused) {
                restartGame();
            }
            return;
    }
    
    // 游戏控制键
    if (!gameRunning || gamePaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            if (movePiece(0, 1)) {
                score += 1;
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
    
    drawBoard();
    updateDisplay();
});

// 按钮事件
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', startGame);

// 设置滑块事件
boardWidthSlider.addEventListener('input', (e) => {
    BOARD_WIDTH = parseInt(e.target.value);
    widthValueSpan.textContent = BOARD_WIDTH;
    if (!gameRunning) {
        updateCanvasSize();
        initBoard();
        drawBoard();
    }
});

boardHeightSlider.addEventListener('input', (e) => {
    BOARD_HEIGHT = parseInt(e.target.value);
    heightValueSpan.textContent = BOARD_HEIGHT;
    if (!gameRunning) {
        updateCanvasSize();
        initBoard();
        drawBoard();
    }
});

// 初始化
updateCanvasSize();
initBoard();
drawBoard();
updateDisplay();
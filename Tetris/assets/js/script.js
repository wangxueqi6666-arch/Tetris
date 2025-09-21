/**
 * 俄罗斯方块游戏 JavaScript 实现
 * 包含游戏核心逻辑、方块操作、碰撞检测和游戏控制
 */

// 游戏常量
const COLS = 10;           // 游戏区域列数
const ROWS = 20;           // 游戏区域行数
const BLOCK_SIZE = 30;     // 方块大小(像素)
const EMPTY = 0;           // 空白格子的值
const COLORS = [
    'transparent',  // 空白格子颜色
    '#FF0D72',      // I 方块
    '#0DC2FF',      // J 方块
    '#0DFF72',      // L 方块
    '#F538FF',      // O 方块
    '#FF8E0D',      // S 方块
    '#FFE138',      // T 方块
    '#3877FF'       // Z 方块
];

// 方块形状定义 (每种方块的4种旋转状态)
const SHAPES = [
    // I 方块
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J 方块
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L 方块
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O 方块
    [
        [4, 4],
        [4, 4]
    ],
    // S 方块
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T 方块
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z 方块
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 获取DOM元素
const gameCanvas = document.getElementById('game-canvas');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverModal = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');

// 获取画布上下文
const ctx = gameCanvas.getContext('2d');
const nextCtx = nextPieceCanvas.getContext('2d');

// 游戏状态变量
let board = [];          // 游戏面板
let currentPiece = null; // 当前方块
let nextPiece = null;    // 下一个方块
let score = 0;           // 分数
let level = 1;           // 等级
let lines = 0;           // 消除的行数
let gameOver = false;    // 游戏是否结束
let isPaused = false;    // 游戏是否暂停
let dropCounter = 0;     // 下落计时器
let dropInterval = 1000; // 下落间隔(毫秒)
let lastTime = 0;        // 上一帧时间
let animationId = null;  // 动画ID

/**
 * 初始化游戏面板
 */
function initBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = EMPTY;
        }
    }
}

/**
 * 创建新方块
 */
function createPiece(type = -1) {
    if (type === -1) {
        type = Math.floor(Math.random() * SHAPES.length);
    }
    
    const shape = SHAPES[type];
    return {
        shape,
        type: type + 1,  // 类型从1开始，0是空白
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

/**
 * 绘制单个方块
 */
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    ctx.strokeStyle = '#222';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // 添加高光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE / 4);
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 4, BLOCK_SIZE);
}

/**
 * 绘制游戏面板
 */
function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const colorIndex = board[row][col];
            drawBlock(ctx, col, row, COLORS[colorIndex]);
        }
    }
}

/**
 * 绘制当前方块
 */
function drawCurrentPiece() {
    if (!currentPiece) return;
    
    const { shape, type, x, y } = currentPiece;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                drawBlock(ctx, x + col, y + row, COLORS[type]);
            }
        }
    }
}

/**
 * 绘制下一个方块预览
 */
function drawNextPiece() {
    if (!nextPiece) return;
    
    // 清空预览区域
    nextCtx.fillStyle = '#2c3e50';
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    const { shape, type } = nextPiece;
    const offsetX = (nextPieceCanvas.width / BLOCK_SIZE - shape[0].length) / 2;
    const offsetY = (nextPieceCanvas.height / BLOCK_SIZE - shape.length) / 2;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                drawBlock(nextCtx, offsetX + col, offsetY + row, COLORS[type]);
            }
        }
    }
}

/**
 * 绘制游戏网格线
 */
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
}

/**
 * 检查碰撞
 */
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    const { shape, x, y } = piece;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                const newX = x + col + offsetX;
                const newY = y + row + offsetY;
                
                // 检查边界
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                // 检查与已有方块的碰撞
                if (newY >= 0 && board[newY][newX] !== EMPTY) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * 旋转方块
 */
function rotatePiece() {
    if (!currentPiece || gameOver || isPaused) return;
    
    const originalShape = currentPiece.shape;
    const rows = originalShape.length;
    const cols = originalShape[0].length;
    
    // 创建新的旋转后的形状
    const rotatedShape = [];
    for (let i = 0; i < cols; i++) {
        rotatedShape[i] = [];
        for (let j = 0; j < rows; j++) {
            rotatedShape[i][j] = originalShape[rows - 1 - j][i];
        }
    }
    
    // 保存原始形状以便碰撞检测失败时恢复
    const originalPiece = { ...currentPiece };
    currentPiece.shape = rotatedShape;
    
    // 处理旋转后可能的碰撞
    // 尝试不同的位置调整
    const offsets = [
        [0, 0],  // 不调整
        [-1, 0], [1, 0], [0, -1],  // 左、右、上
        [-1, -1], [1, -1],  // 左上、右上
        [-2, 0], [2, 0]  // 更远的左、右
    ];
    
    for (const [offsetX, offsetY] of offsets) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        
        if (!checkCollision(currentPiece)) {
            return; // 找到有效位置
        }
        
        // 恢复位置继续尝试
        currentPiece.x -= offsetX;
        currentPiece.y -= offsetY;
    }
    
    // 所有调整都失败，恢复原始形状
    currentPiece.shape = originalShape;
}

/**
 * 移动方块
 */
function movePiece(direction) {
    if (!currentPiece || gameOver || isPaused) return;
    
    let offsetX = 0;
    let offsetY = 0;
    
    if (direction === 'left') offsetX = -1;
    if (direction === 'right') offsetX = 1;
    if (direction === 'down') offsetY = 1;
    
    if (!checkCollision(currentPiece, offsetX, offsetY)) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        return true;
    }
    
    // 如果是向下移动且发生碰撞，则固定方块
    if (direction === 'down') {
        mergePiece();
        return false;
    }
    
    return false;
}

/**
 * 硬降（直接落到底部）
 */
function hardDrop() {
    if (!currentPiece || gameOver || isPaused) return;
    
    while (movePiece('down')) {
        // 继续下落直到碰撞
    }
}

/**
 * 将当前方块合并到游戏面板
 */
function mergePiece() {
    if (!currentPiece) return;
    
    const { shape, type, x, y } = currentPiece;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                // 如果方块顶部超出游戏区域，游戏结束
                if (y + row < 0) {
                    gameOver = true;
                    showGameOver();
                    return;
                }
                
                if (y + row >= 0) {
                    board[y + row][x + col] = type;
                }
            }
        }
    }
    
    // 检查并清除已填满的行
    clearLines();
    
    // 创建新方块
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
}

/**
 * 清除已填满的行
 */
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        let isLineFull = true;
        
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === EMPTY) {
                isLineFull = false;
                break;
            }
        }
        
        if (isLineFull) {
            // 将当前行上方的所有行下移
            for (let r = row; r > 0; r--) {
                for (let c = 0; c < COLS; c++) {
                    board[r][c] = board[r - 1][c];
                }
            }
            
            // 清空顶部行
            for (let c = 0; c < COLS; c++) {
                board[0][c] = EMPTY;
            }
            
            // 行被清除后，需要重新检查当前行
            row++;
            linesCleared++;
        }
    }
    
    // 更新分数和等级
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

/**
 * 更新分数和等级
 */
function updateScore(linesCleared) {
    // 根据消除的行数计算得分
    // 1行=100分，2行=300分，3行=500分，4行=800分
    const points = [0, 100, 300, 500, 800];
    score += points[linesCleared] * level;
    
    // 更新消除的总行数
    lines += linesCleared;
    
    // 每消除10行升一级
    level = Math.floor(lines / 10) + 1;
    
    // 更新下落速度
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    
    // 更新UI
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

/**
 * 游戏主循环
 */
function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!gameOver && !isPaused) {
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            movePiece('down');
            dropCounter = 0;
        }
        
        // 清空画布
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // 绘制游戏元素
        drawGrid();
        drawBoard();
        drawCurrentPiece();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

/**
 * 开始游戏
 */
function startGame() {
    // 初始化游戏状态
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameOver = false;
    isPaused = false;
    
    // 更新UI
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // 创建初始方块
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    // 绘制下一个方块预览
    drawNextPiece();
    
    // 隐藏游戏结束弹窗
    gameOverModal.classList.add('hidden');
    
    // 更新按钮状态
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = '暂停';
    
    // 开始游戏循环
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    lastTime = 0;
    gameLoop();
}

/**
 * 暂停/继续游戏
 */
function togglePause() {
    if (gameOver) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '继续' : '暂停';
}

/**
 * 显示游戏结束弹窗
 */
function showGameOver() {
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

/**
 * 键盘事件处理
 */
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        // 游戏控制快捷键 - 可在游戏结束状态使用
        case 's':
        case 'S':
            if (!isPaused) startGame();
            break;
        case 'r':
        case 'R':
            startGame(); // 重新开始游戏
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
            
        // 以下快捷键仅在游戏进行中有效
        case 'ArrowLeft':
            if (gameOver || isPaused) return;
            movePiece('left');
            break;
        case 'ArrowRight':
            if (gameOver || isPaused) return;
            movePiece('right');
            break;
        case 'ArrowDown':
            if (gameOver || isPaused) return;
            movePiece('down');
            break;
        case 'ArrowUp':
            if (gameOver || isPaused) return;
            rotatePiece();
            break;
        case ' ':
            if (gameOver || isPaused) return;
            hardDrop();
            break;
    }
});

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

// 初始化游戏
initBoard();

// 禁用暂停按钮，直到游戏开始
pauseBtn.disabled = true;
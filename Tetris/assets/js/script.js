/**
 * 贪吃蛇游戏 JavaScript 实现
 * 包含游戏核心逻辑、蛇的移动、食物生成、碰撞检测和游戏控制
 */

// 游戏常量
const GRID_SIZE = 20;      // 网格大小(像素)
const GRID_COUNT = 20;     // 网格数量(20x20)
const GAME_SPEED = 150;    // 初始游戏速度(毫秒)
const SPEED_INCREMENT = 5; // 每吃一个食物增加的速度

// 方向常量
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// 颜色设置
const COLORS = {
    BACKGROUND: '#f5f5f5',
    GRID: '#e0e0e0',
    SNAKE_HEAD: '#2ecc71',
    SNAKE_BODY: '#27ae60',
    FOOD: '#e74c3c'
};

// 获取DOM元素
const gameCanvas = document.getElementById('game-canvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const snakeLengthElement = document.getElementById('snake-length');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverModal = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalLengthElement = document.getElementById('final-length');
const playAgainBtn = document.getElementById('play-again-btn');

// 获取画布上下文
const ctx = gameCanvas.getContext('2d');

// 游戏状态变量
let snake = [];           // 蛇的身体部分
let food = null;          // 食物位置
let direction = DIRECTIONS.RIGHT; // 当前方向
let nextDirection = DIRECTIONS.RIGHT; // 下一个方向
let score = 0;            // 分数
let level = 1;            // 等级
let gameSpeed = GAME_SPEED; // 游戏速度
let gameOver = false;     // 游戏是否结束
let isPaused = false;     // 游戏是否暂停
let gameLoop = null;      // 游戏循环定时器

/**
 * 初始化游戏
 */
function initGame() {
    // 重置游戏状态
    snake = [
        { x: 10, y: 10 }, // 蛇头
        { x: 9, y: 10 },  // 蛇身
        { x: 8, y: 10 }   // 蛇尾
    ];
    direction = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
    score = 0;
    level = 1;
    gameSpeed = GAME_SPEED;
    gameOver = false;
    isPaused = false;
    
    // 更新UI
    updateScore();
    updateLevel();
    updateSnakeLength();
    
    // 生成第一个食物
    generateFood();
    
    // 开始游戏循环
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
    
    // 隐藏游戏结束弹窗
    gameOverModal.classList.add('hidden');
}

/**
 * 游戏单步逻辑
 */
function gameStep() {
    if (gameOver || isPaused) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 移动蛇
    moveSnake();
    
    // 检查碰撞
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // 检查是否吃到食物
    if (snake[0].x === food.x && snake[0].y === food.y) {
        eatFood();
    }
    
    // 绘制游戏
    drawGame();
}

/**
 * 移动蛇
 */
function moveSnake() {
    // 创建新的蛇头
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // 将新蛇头添加到蛇身体的前面
    snake.unshift(head);
    
    // 如果没有吃到食物，移除蛇尾
    // 如果吃到食物，eatFood函数会处理，这里不需要移除蛇尾
    if (!(food && head.x === food.x && head.y === food.y)) {
        snake.pop();
    }
}

/**
 * 检查碰撞
 */
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        return true;
    }
    
    // 检查是否撞到自己的身体
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

/**
 * 吃食物
 */
function eatFood() {
    // 增加分数
    score += 10 * level;
    updateScore();
    
    // 每吃5个食物增加一级
    if (score / (10 * level) >= 5) {
        level++;
        updateLevel();
        
        // 提高游戏速度
        gameSpeed = Math.max(50, GAME_SPEED - (level - 1) * SPEED_INCREMENT);
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
    }
    
    // 更新蛇的长度
    updateSnakeLength();
    
    // 生成新的食物
    generateFood();
}

/**
 * 生成食物
 */
function generateFood() {
    // 随机生成食物位置
    let newFood;
    let isOnSnake;
    
    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
        
        // 确保食物不会生成在蛇身上
        for (const segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);
    
    food = newFood;
}

/**
 * 绘制游戏
 */
function drawGame() {
    // 清空画布
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 绘制网格
    drawGrid();
    
    // 绘制食物
    drawFood();
    
    // 绘制蛇
    drawSnake();
}

/**
 * 绘制网格
 */
function drawGrid() {
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= GRID_COUNT; x++) {
        ctx.beginPath();
        ctx.moveTo(x * GRID_SIZE, 0);
        ctx.lineTo(x * GRID_SIZE, GRID_COUNT * GRID_SIZE);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= GRID_COUNT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * GRID_SIZE);
        ctx.lineTo(GRID_COUNT * GRID_SIZE, y * GRID_SIZE);
        ctx.stroke();
    }
}

/**
 * 绘制食物
 */
function drawFood() {
    if (!food) return;
    
    ctx.fillStyle = COLORS.FOOD;
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/**
 * 绘制蛇
 */
function drawSnake() {
    // 绘制蛇身
    for (let i = 1; i < snake.length; i++) {
        ctx.fillStyle = COLORS.SNAKE_BODY;
        ctx.fillRect(
            snake[i].x * GRID_SIZE + 1,
            snake[i].y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );
    }
    
    // 绘制蛇头
    ctx.fillStyle = COLORS.SNAKE_HEAD;
    ctx.fillRect(
        snake[0].x * GRID_SIZE + 1,
        snake[0].y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
    );
}

/**
 * 更新分数显示
 */
function updateScore() {
    scoreElement.textContent = score;
}

/**
 * 更新等级显示
 */
function updateLevel() {
    levelElement.textContent = level;
}

/**
 * 更新蛇长度显示
 */
function updateSnakeLength() {
    snakeLengthElement.textContent = snake.length;
}

/**
 * 结束游戏
 */
function endGame() {
    gameOver = true;
    clearInterval(gameLoop);
    
    // 显示游戏结束弹窗
    finalScoreElement.textContent = score;
    finalLengthElement.textContent = snake.length;
    gameOverModal.classList.remove('hidden');
}

/**
 * 暂停游戏
 */
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '继续' : '暂停';
}

// 键盘事件监听
document.addEventListener('keydown', (event) => {
    // 防止方向键滚动页面
    if ([37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    // 只有在游戏进行中才处理方向键
    if (!gameOver && !isPaused) {
        switch (event.keyCode) {
            case 38: // 上箭头
                if (direction !== DIRECTIONS.DOWN) {
                    nextDirection = DIRECTIONS.UP;
                }
                break;
            case 40: // 下箭头
                if (direction !== DIRECTIONS.UP) {
                    nextDirection = DIRECTIONS.DOWN;
                }
                break;
            case 37: // 左箭头
                if (direction !== DIRECTIONS.RIGHT) {
                    nextDirection = DIRECTIONS.LEFT;
                }
                break;
            case 39: // 右箭头
                if (direction !== DIRECTIONS.LEFT) {
                    nextDirection = DIRECTIONS.RIGHT;
                }
                break;
        }
    }
    
    // 其他键盘快捷键
    switch (event.keyCode) {
        case 80: // P键 - 暂停/继续
            if (!gameOver) togglePause();
            break;
        case 82: // R键 - 重新开始
            initGame();
            break;
        case 83: // S键 - 开始游戏
            if (gameOver) initGame();
            break;
    }
});

// 按钮事件监听
startBtn.addEventListener('click', () => {
    if (gameOver) initGame();
});

pauseBtn.addEventListener('click', () => {
    if (!gameOver) togglePause();
});

restartBtn.addEventListener('click', () => {
    initGame();
});

playAgainBtn.addEventListener('click', () => {
    initGame();
});

// 初始化蛇和食物
snake = [
    { x: 10, y: 10 }, // 蛇头
    { x: 9, y: 10 },  // 蛇身
    { x: 8, y: 10 }   // 蛇尾
];

// 生成第一个食物
generateFood();

// 初始绘制游戏
drawGame();

// 显示开始按钮
startBtn.focus();
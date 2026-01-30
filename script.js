const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const previewCanvas = document.getElementById('previewCanvas');
const pCtx = previewCanvas.getContext('2d');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

const nameInput = document.getElementById('playerNameInput');
const playBtn = document.getElementById('playButton');
const alertBox = document.getElementById('alertBox');
const charOptions = document.querySelectorAll('.char-option');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');

const displayPlayerName = document.getElementById('displayPlayerName');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');

gameCanvas.width = 400;
gameCanvas.height = 600;

let selectedCharIndex = 0;
let playerName = "";
let animationId = null;
let gameRunning = false;
let isGameOver = false;

let bird = { x: 50, y: 300, w: 34, h: 34, dy: 0 };
let pipes = [];
let score = 0;
let frameCount = 0;

const GRAVITY = 0.5;
const JUMP = -8;
const PIPE_SPEED = 3.5;
const PIPE_GAP = 170;
const PIPE_FREQ = 100;

function drawSpecificCharacter(context, index, x, y, size) {
    context.save();
    
    // Colors from images
    const cDark = '#3d4d18';  // Dark Green from image
    const cLight = '#c0fd5c'; // Light Base Green
    const cBlack = '#000000';

    if (index === 0) {
        // Image 0: Box dark, center light
        context.fillStyle = cDark;
        context.fillRect(x, y, size, size);
        context.fillStyle = cLight;
        context.fillRect(x + size*0.35, y + size*0.35, size*0.3, size*0.3);
    } 
    else if (index === 1) {
        // Image 1: Checkered
        context.fillStyle = cLight;
        context.fillRect(x, y, size, size);
        context.fillStyle = cDark;
        // Top mid, left mid, right mid, bottom mid
        context.fillRect(x + size/3, y, size/3, size/3);
        context.fillRect(x, y + size/3, size/3, size/3);
        context.fillRect(x + size*0.66, y + size/3, size/3, size/3);
        context.fillRect(x + size/3, y + size*0.66, size/3, size/3);
        // Center hole black
        context.fillStyle = "black";
        context.fillRect(x + size/3, y + size/3, size/3, size/3);
    }
    else if (index === 2) {
        // Image 2: Plus Sign
        context.fillStyle = "black"; 
        context.fillRect(x, y, size, size); // bg
        
        context.fillStyle = cDark;
        // Arms
        context.fillRect(x + size/3, y, size/3, size/3); // Top
        context.fillRect(x + size/3, y + size*0.66, size/3, size/3); // Bot
        context.fillRect(x, y + size/3, size/3, size/3); // Left
        context.fillRect(x + size*0.66, y + size/3, size/3, size/3); // Right
        
        context.fillStyle = cLight;
        context.fillRect(x + size/3, y + size/3, size/3, size/3); // Center
    }
    else if (index === 3) {
        // Image 3: X Dots
        context.fillStyle = "black";
        context.fillRect(x, y, size, size);
        
        context.fillStyle = cLight;
        // 4 Corners
        context.fillRect(x, y, size/3, size/3);
        context.fillRect(x + size*0.66, y, size/3, size/3);
        context.fillRect(x, y + size*0.66, size/3, size/3);
        context.fillRect(x + size*0.66, y + size*0.66, size/3, size/3);
        
        context.fillStyle = cDark;
        context.fillRect(x + size/3, y + size/3, size/3, size/3); // Center
    }
    else if (index === 4) {
        // Image 4: Logo S
        context.fillStyle = cLight;
        context.fillRect(x, y, size, size);
        
        context.fillStyle = "black";
        context.lineWidth = size * 0.15;
        
        // Draw S Lines
        context.fillRect(x, y + size*0.2, size, size*0.15); // Top bar
        context.fillRect(x, y + size*0.5, size, size*0.15); // Mid bar
        context.fillRect(x, y + size*0.8, size, size*0.15); // Bot bar
        context.fillRect(x, y + size*0.2, size*0.15, size*0.3); // Left connect
        context.fillRect(x + size*0.85, y + size*0.5, size*0.15, size*0.3); // Right connect
    }

    context.restore();
}

function updatePreview() {
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pCtx.fillStyle = "#1a1a1a";
    pCtx.fillRect(0,0, previewCanvas.width, previewCanvas.height);
    drawSpecificCharacter(pCtx, selectedCharIndex, 15, 15, 70);
}

updatePreview();

charOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        charOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedCharIndex = parseInt(opt.getAttribute('data-index'));
        updatePreview();
    });
});

playBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if(!val) {
        alertBox.style.display = 'block';
        return;
    }
    alertBox.style.display = 'none';
    playerName = val;
    initGame();
});

menuBtn.addEventListener('click', () => {
    stopGameLoop();
    gameWrapper.style.display = 'none';
    startScreen.style.display = 'flex';
    gameOverOverlay.style.display = 'none';
});

restartBtn.addEventListener('click', () => {
    stopGameLoop();
    resetVars();
    gameOverOverlay.style.display = 'none';
    gameRunning = true;
    loop();
});

function stopGameLoop() {
    gameRunning = false;
    if(animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function initGame() {
    startScreen.style.display = 'none';
    gameWrapper.style.display = 'flex'; // Changed to flex for proper layout
    displayPlayerName.innerText = playerName;
    
    stopGameLoop();
    resetVars();
    gameRunning = true;
    loop();
}

function resetVars() {
    bird.y = gameCanvas.height / 2;
    bird.dy = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    isGameOver = false;
    scoreDisplay.innerText = score;
}

function loop() {
    if(!gameRunning) return;

    update();
    draw();

    if(!isGameOver) {
        animationId = requestAnimationFrame(loop);
    }
}

function update() {
    bird.dy += GRAVITY;
    bird.y += bird.dy;

    if(frameCount % PIPE_FREQ === 0) {
        let maxPos = gameCanvas.height - PIPE_GAP - 50;
        let h = Math.floor(Math.random() * (maxPos - 50)) + 50;
        pipes.push({ x: gameCanvas.width, topH: h, passed: false });
    }

    for(let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= PIPE_SPEED;

        if(
            bird.x < p.x + 50 &&
            bird.x + bird.w > p.x &&
            (bird.y < p.topH || bird.y + bird.h > p.topH + PIPE_GAP)
        ) {
            doGameOver();
        }

        if(p.x + 50 < bird.x && !p.passed) {
            score++;
            scoreDisplay.innerText = score;
            p.passed = true;
        }

        if(p.x < -60) {
            pipes.shift();
            i--;
        }
    }

    if(bird.y + bird.h > gameCanvas.height || bird.y < 0) {
        doGameOver();
    }

    frameCount++;
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    drawSpecificCharacter(ctx, selectedCharIndex, bird.x, bird.y, bird.w);

    ctx.fillStyle = "#444"; 
    ctx.strokeStyle = "#c0fd5c";
    ctx.lineWidth = 2;

    pipes.forEach(p => {
        // Top Pipe
        ctx.fillRect(p.x, 0, 50, p.topH);
        ctx.strokeRect(p.x, 0, 50, p.topH);
        
        // Bot Pipe
        let botY = p.topH + PIPE_GAP;
        let botH = gameCanvas.height - botY;
        ctx.fillRect(p.x, botY, 50, botH);
        ctx.strokeRect(p.x, botY, 50, botH);
    });
}

function doGameOver() {
    isGameOver = true;
    gameRunning = false;
    finalScoreDisplay.innerText = score;
    gameOverOverlay.style.display = 'flex';
}

function handleInput(e) {
    if(e.type === 'keydown' && e.code !== 'Space') return;
    e.preventDefault();
    
    if(gameRunning && !isGameOver) {
        bird.dy = JUMP;
    }
}

window.addEventListener('keydown', (e) => {
    if(gameWrapper.style.display === 'flex') handleInput(e);
});
gameCanvas.addEventListener('touchstart', (e) => {
    if(gameWrapper.style.display === 'flex') handleInput(e);
}, {passive: false});
gameCanvas.addEventListener('mousedown', (e) => {
    if(gameWrapper.style.display === 'flex') handleInput(e);
});
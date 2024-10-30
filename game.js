const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Add this function right after getting canvas context
function setupViewport() {
    let viewport = document.querySelector("meta[name=viewport]");
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=no';
}

// Call this function immediately
setupViewport();

// Replace your existing setCanvasSize function with this one
function setCanvasSize() {
    if (isMobile()) {
        // Set canvas to double the screen size on mobile for a more zoomed-out view
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        
        // Scale the canvas display size
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Add this CSS (add it right after setCanvasSize)
const style = document.createElement('style');
style.textContent = `
    body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
        touch-action: none;
    }
    #gameCanvas {
        position: fixed;
        top: 0;
        left: 0;
        touch-action: none;
    }
`;
document.head.appendChild(style);

// Load images
const playerImage1 = new Image();
const playerImage2 = new Image();
const smallPlatImage = new Image();
const medPlatImage = new Image();
const largePlatImage = new Image();
const starImage = new Image();

playerImage1.src = 'game/run1.png';
playerImage2.src = 'game/run2.png';
smallPlatImage.src = 'game/small-plat.png';
medPlatImage.src = 'game/med-plat.png';
largePlatImage.src = 'game/large-plat.png';
starImage.src = 'game/star.png';

const backgrounds = [
    'game/back1.jpeg',
    'game/back2.jpeg',
    'game/back3.jpeg',
    'game/back4.jpeg'
];
let currentBackgroundIndex = 0;

function changeBackground() {
    document.body.style.backgroundImage = `url(${backgrounds[currentBackgroundIndex]})`;
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
}

changeBackground();
setInterval(changeBackground, 10000);

// Track loading state
let imagesLoaded = 0;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 6) {
        restartGame();
        gameLoop();
    }
}

function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// Set onload handlers
playerImage1.onload = checkAllImagesLoaded;
playerImage2.onload = checkAllImagesLoaded;
smallPlatImage.onload = checkAllImagesLoaded;
medPlatImage.onload = checkAllImagesLoaded;
largePlatImage.onload = checkAllImagesLoaded;
starImage.onload = checkAllImagesLoaded;

// Adjust canvas size based on device
function setCanvasSize() {
    if (isMobile()) {
        // On mobile, use full screen width and adjust height proportionally
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.9; // Leave some space for browser UI
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Scale factors for mobile
const mobileScale = isMobile() ? 0.7 : 1; // Reduce size of elements on mobile

const player = {
    x: canvas.width / 2 - 10,
    y: canvas.height / 2 - 20,
    width: 70 * mobileScale,
    height: 50 * mobileScale,
    dx: 0,
    dy: 0,
    gravity: 0.2, // Increased gravity for more responsive feel
    jumpStrength: -10,
    onGround: false,
    canDoubleJump: true,
};

let platforms = [];
let stars = [];
let touchedStars = [];
const floorHeight = 20 * mobileScale;
const platformHeight = 10 * mobileScale;
const initialPlatformCount = isMobile() ? 4 : 3;
const maxPlatforms = isMobile() ? 6 : 10;
let scrollSpeed = isMobile() ? 5 : 4; // Adjusted base speed for mobile
let gameStarted = false;
let jumpRequested = false;

let currentPlayerImage = playerImage1;
let toggleImage = false;

// Timer
let startTime;
const speedIncrement = isMobile() ? 0.05 : 0.1; // Slower speed increase on mobile
let highScore = 0;
let starSpawnTime = Date.now();
const starSpawnInterval = 8000; // Same interval for both platforms

const starScore = 10;
let score = 0;

setInterval(() => {
    toggleImage = !toggleImage;
    currentPlayerImage = toggleImage ? playerImage1 : playerImage2;
}, 500);

function drawPlayer() {
    ctx.drawImage(currentPlayerImage, player.x, player.y, player.width, player.height);
}

function getRandomPlatformImage() {
    const platformImages = [
        { 
            image: smallPlatImage, 
            width: smallPlatImage.width * mobileScale, 
            height: smallPlatImage.height * mobileScale 
        },
        { 
            image: medPlatImage, 
            width: medPlatImage.width * mobileScale, 
            height: medPlatImage.height * mobileScale 
        },
        { 
            image: largePlatImage, 
            width: largePlatImage.width * mobileScale, 
            height: largePlatImage.height * mobileScale 
        }
    ];
    return platformImages[Math.floor(Math.random() * platformImages.length)];
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(platform.image, platform.x, platform.y, platform.width, platform.height);
    });
}

function drawStars() {
    const starSize = 30 * mobileScale;
    stars.forEach(star => {
        ctx.drawImage(starImage, star.x, star.y, starSize, starSize);
    });
}

const spikeImage = new Image();
spikeImage.src = 'game/spike.png';

function drawFloor() {
    const spikeHeight = 100 * mobileScale;
    const spikeWidth = 100 * mobileScale;
    
    if (spikeImage.complete) {
        for (let x = 0; x < canvas.width; x += spikeWidth) {
            ctx.drawImage(spikeImage, x, canvas.height - floorHeight - spikeHeight, spikeWidth, spikeHeight);
        }
    } else {
        spikeImage.onload = () => {
            for (let x = 0; x < canvas.width; x += spikeWidth) {
                ctx.drawImage(spikeImage, x, canvas.height - floorHeight - spikeHeight, spikeWidth, spikeHeight);
            }
        };
    }
}

function drawTimer() {
    if (gameStarted) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const totalScore = Math.floor(elapsedTime) + touchedStars.length * starScore;
        ctx.fillStyle = 'white';
        ctx.font = isMobile() ? '24px Arial' : '50px Arial'; // Smaller font on mobile
        const yOffset = isMobile() ? 20 : 30;
        ctx.fillText(`Score: ${totalScore}`, 10, yOffset);
        ctx.fillText(`High Score: ${highScore.toFixed(1)}`, 10, yOffset * 2);
    }
}


function update() {
    if (!gameStarted) {
        player.dy = 0;
        return;
    }

    player.dy += player.gravity;
    player.x += player.dx;
    player.y += player.dy;

    // Collisions with platforms
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height <= platform.y + platform.height &&
            player.dy > 0) {
            player.onGround = true;
            player.dy = 0;
            player.y = platform.y - player.height;
            player.canDoubleJump = true;
        }
    });

    // Allow the player to move off the top of the screen
    if (player.y + player.height < 0) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.dx = 0;
        restartGame();
    }

    // Move platforms to the left and remove off-screen ones
    platforms.forEach(platform => {
        platform.x -= scrollSpeed;
    });
    platforms = platforms.filter(platform => platform.x + platform.width > 0);

    // Add new platforms on the right
    if (platforms.length < maxPlatforms && (platforms.length === 0 || platforms[platforms.length - 1].x < canvas.width - 300)) {
        const platformData = getRandomPlatformImage();
        let newPlatform;
        let overlapping;

        do {
            overlapping = false;
            newPlatform = {
                x: canvas.width,
                y: Math.random() * (canvas.height - 150),
                width: platformData.width,
                height: platformData.height,
                image: platformData.image
            };

            platforms.forEach(platform => {
                if (newPlatform.x < platform.x + platform.width &&
                    newPlatform.x + newPlatform.width > platform.x &&
                    newPlatform.y < platform.y + platform.height &&
                    newPlatform.y + newPlatform.height > platform.y) {
                    overlapping = true;
                }
            });

        } while (overlapping);

        platforms.push(newPlatform);
    }

    // Check for game over (player touches spikes)
    if (player.y + player.height > canvas.height - floorHeight) {
        restartGame();
    }

    // Keep player in bounds, except for the top of the canvas
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

    // Handle jump request
    if (jumpRequested) {
        if (player.onGround || player.y + player.height < 0) {
            player.dy = player.jumpStrength;
            player.onGround = false;
            player.canDoubleJump = true;
        } else if (player.canDoubleJump) {
            player.dy = player.jumpStrength;
            player.canDoubleJump = false;
        }
        jumpRequested = false;
    }

    // Update speed based on elapsed time
    const elapsedTime = (Date.now() - startTime) / 1000;
    scrollSpeed = scrollSpeed = isMobile() ? (10 + speedIncrement * elapsedTime) : (4 + speedIncrement * elapsedTime);
    
    
    

    // Handle stars
    if (Date.now() - starSpawnTime > starSpawnInterval) {
        starSpawnTime = Date.now();
        const newStar = {
            x: canvas.width,
            y: Math.random() * (canvas.height - 50),
            width: 30,
            height: 30,
        };
        stars.push(newStar);
    }

    // Move stars to the left and check for collisions
    stars.forEach(star => {
        star.x -= scrollSpeed;
        // Check for collision with player
        if (player.x < star.x + star.width &&
            player.x + player.width > star.x &&
            player.y < star.y + star.height &&
            player.y + player.height > star.y) {
            if (!touchedStars.includes(star)) {
                touchedStars.push(star); // Add star to touchedStars array
                stars.splice(stars.indexOf(star), 1); // Remove star from stars array
                score += starScore; // Increase score
            }
        }
    });
    stars = stars.filter(star => star.x + star.width > 0); // Remove off-screen stars

    // Calculate and update total score based on elapsed time and collected stars
    const totalScore = Math.floor(elapsedTime) + touchedStars.length * starScore;
    if (totalScore > highScore) {
        highScore = totalScore;
    }
}



function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlatforms();
    drawStars();
    drawPlayer();
    drawFloor();
    drawTimer();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function playAudio() {
    var audio = document.getElementById('background-audio');
    audio.play();
}

function restartGame() {
    changeBackground();
    player.x = 50;
    player.y = 1;
    player.dy = 0;
    player.dx = 0;
    player.onGround = true;
    player.canDoubleJump = true;

    platforms = [];

    // Add initial platforms using the same logic as during gameplay
    while (platforms.length < initialPlatformCount) {
        const platformData = getRandomPlatformImage();
        let newPlatform;
        let overlapping;

        do {
            overlapping = false;
            newPlatform = {
                x: canvas.width * Math.random(),
                y: Math.random() * (canvas.height - 150),
                width: platformData.width,
                height: platformData.height,
                image: platformData.image
            };

            platforms.forEach(platform => {
                if (newPlatform.x < platform.x + platform.width &&
                    newPlatform.x + newPlatform.width > platform.x &&
                    newPlatform.y < platform.y + platform.height &&
                    newPlatform.y + newPlatform.height > platform.y) {
                    overlapping = true;
                }
            });

        } while (overlapping);

        platforms.push(newPlatform);
    }

    stars = [];
    touchedStars=[];
    startTime = Date.now();
    gameStarted = true;
}

// Input handling for keyboard
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        jumpRequested = true;
    }
    playAudio();
});
window.addEventListener('keyup', function(e) {
    if (e.code === 'Space') {
        jumpRequested = false;
    }
});

// Input handling for touch
let isTouching = false;

window.addEventListener('touchstart', function(e) {
    if (e.touches.length > 0) {
        isTouching = true;
        jumpRequested = true;
    }
    e.preventDefault(); // Prevent default touch actions like scrolling
    playAudio();
}, { passive: false });

window.addEventListener('touchend', function(e) {
    if (e.changedTouches.length > 0) {
        isTouching = false;
        jumpRequested = false;
    }
    e.preventDefault(); // Prevent default touch actions like scrolling
}, { passive: false });


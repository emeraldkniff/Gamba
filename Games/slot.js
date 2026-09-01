// Game Constants
const STARTING_CURRENCY = 5000;
const SPIN_DURATION = 3000; // 3 seconds
const REEL_STOP_DELAY = 300; // Stagger each reel stopping

// Symbols with multipliers (in order for visual)
const SYMBOLS = [
    { name: '7', multiplier: 5 },
    { name: 'CHERRY', multiplier: 2 },
    { name: 'LEMON', multiplier: 1 }
];

// Winning combinations
const WINNING_COMBOS = {
    'all_same': { multiplier: 10, description: 'Three of a Kind!' },
    'two_same': { multiplier: 2, description: 'Two of a Kind!' },
    'none': { multiplier: 0, description: 'No Match' }
};

// Game State
let playerCurrency = STARTING_CURRENCY;
let isSpinning = false;
let selectedSymbols = [null, null, null];

// DOM Elements
const currencyDisplay = document.getElementById('currency');
const betAmountInput = document.getElementById('betAmount');
const spinButton = document.getElementById('spinButton');
const gameMessage = document.getElementById('gameMessage');
const multiplierInfo = document.getElementById('multiplierInfo');
const reels = document.querySelectorAll('.reel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCurrencyDisplay();
    spinButton.addEventListener('click', handleSpin);
    betAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSpin();
    });
});

function formatCurrency(amount) {
    // Format currency with space as thousand separator
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function updateCurrencyDisplay() {
    currencyDisplay.textContent = `$${formatCurrency(playerCurrency)}`;
}

function handleSpin() {
    const betAmount = parseInt(betAmountInput.value);
    
    // Validation
    if (isNaN(betAmount) || betAmount <= 0) {
        gameMessage.textContent = 'Please enter a valid bet amount!';
        gameMessage.className = 'message lose';
        return;
    }
    
    if (betAmount > playerCurrency) {
        gameMessage.textContent = `Insufficient funds! Max bet: $${formatCurrency(playerCurrency)}`;
        gameMessage.className = 'message lose';
        return;
    }
    
    // Deduct bet from currency
    playerCurrency -= betAmount;
    updateCurrencyDisplay();
    
    // Start spinning
    isSpinning = true;
    spinButton.disabled = true;
    betAmountInput.disabled = true;
    gameMessage.textContent = 'SPINNING...';
    gameMessage.className = 'message';
    multiplierInfo.textContent = '';
    
    // Add spinning animation to all reels
    reels.forEach(reel => reel.classList.add('spinning'));
    
    // Stop reels sequentially
    setTimeout(() => stopReel(0, betAmount), SPIN_DURATION);
    setTimeout(() => stopReel(1, betAmount), SPIN_DURATION + REEL_STOP_DELAY);
    setTimeout(() => stopReel(2, betAmount), SPIN_DURATION + REEL_STOP_DELAY * 2);
    
    // Determine result after all reels stop
    setTimeout(() => {
        determineWinner(betAmount);
        isSpinning = false;
        spinButton.disabled = false;
        betAmountInput.disabled = false;
    }, SPIN_DURATION + REEL_STOP_DELAY * 3);
}

function stopReel(reelIndex, betAmount) {
    // Remove spinning animation
    reels[reelIndex].classList.remove('spinning');
    
    // Pick a random symbol
    const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    selectedSymbols[reelIndex] = randomSymbol.name;
    
    // Update the image with a new symbol representation
    const img = reels[reelIndex].querySelector('.symbol');
    img.src = generateSymbolImage(randomSymbol.name);
    img.alt = randomSymbol.name;
}

function generateSymbolImage(symbolName) {
    // Map symbols to actual image files
    const imageMap = {
        '7': '../images/slot/seven.png',
        'CHERRY': '../images/slot/cherries.png',
        'LEMON': '../images/slot/lemon.png'
    };
    
    return imageMap[symbolName] || '../images/slot/seven.png';
}

function determineWinner(betAmount) {
    // Check for winning combinations
    const [reel1, reel2, reel3] = selectedSymbols;
    
    let winType = 'none';
    let winAmount = 0;
    
    // Check for three of a kind
    if (reel1 === reel2 && reel2 === reel3) {
        winType = 'all_same';
        const multiplier = SYMBOLS.find(s => s.name === reel1).multiplier;
        winAmount = betAmount * multiplier * WINNING_COMBOS.all_same.multiplier;
    }
    // Check for two of a kind (any two matching)
    else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        winType = 'two_same';
        // Find the matching pair and calculate
        let matchingSymbol;
        if (reel1 === reel2) matchingSymbol = reel1;
        else if (reel2 === reel3) matchingSymbol = reel2;
        else matchingSymbol = reel1;
        
        const multiplier = SYMBOLS.find(s => s.name === matchingSymbol).multiplier;
        winAmount = betAmount * multiplier * WINNING_COMBOS.two_same.multiplier;
    }
    
    // Display result
    displayResult(winType, winAmount, betAmount);
}

function displayResult(winType, winAmount, betAmount) {
    const combo = WINNING_COMBOS[winType];
    
    if (winAmount > 0) {
        // Winner!
        playerCurrency += winAmount;
        updateCurrencyDisplay();
        
        gameMessage.textContent = `${combo.description} YOU WIN $${formatCurrency(winAmount)}!`;
        gameMessage.className = 'message win';
        multiplierInfo.textContent = `Balance: $${formatCurrency(playerCurrency)}`;
    } else {
        // Loser
        gameMessage.textContent = `${combo.description} - You lost $${formatCurrency(betAmount)}`;
        gameMessage.className = 'message lose';
        multiplierInfo.textContent = `Balance: $${formatCurrency(playerCurrency)}`;
    }
}

// Prevent going below 0
window.addEventListener('beforeunload', () => {
    // Reset on page refresh (currency doesn't save)
    // This is handled automatically by not using localStorage
});
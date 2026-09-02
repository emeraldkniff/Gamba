// Game Constants
const STARTING_CURRENCY = 5000;
const SPIN_DURATION = 3000; // 3 seconds
const REEL_STOP_DELAY = 300; // Stagger each reel stopping

// Symbols with multipliers (in order for visual)
const SYMBOLS = [
    { name: '7', multiplier: 12 },
    { name: 'CHERRY', multiplier: 6 },
    { name: 'LEMON', multiplier: 3 }
];

// Winning combinations
const WINNING_COMBOS = {
    'all_same': { description: 'Three of a Kind!' },
    'two_sevens': { multiplier: 2, description: 'Two Sevens!' },
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
const helpButton = document.getElementById('helpButton');
const closePayouts = document.getElementById('closePayouts');
const payoutPanel = document.getElementById('payoutPanel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCurrencyDisplay();
    spinButton.addEventListener('click', handleSpin);
    betAmountInput.addEventListener('input', formatBetInput);
    betAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSpin();
    });
});

function togglePayouts(show) {
    payoutPanel.hidden = !show;
    helpButton.setAttribute('aria-expanded', show);
}

helpButton.addEventListener('click', () => togglePayouts(payoutPanel.hidden));
closePayouts.addEventListener('click', () => togglePayouts(false));

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatBetInput() {
    const digits = betAmountInput.value.replace(/\D/g, '');
    betAmountInput.value = digits ? formatCurrency(digits) : '';
}

function updateCurrencyDisplay() {
    currencyDisplay.textContent = `$${formatCurrency(playerCurrency)}`;
}

function handleSpin() {
    const betAmount = parseInt(betAmountInput.value.replace(/,/g, ''), 10);
    
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
    
    // Three identical symbols receive the full symbol payout.
    if (reel1 === reel2 && reel2 === reel3) {
        winType = 'all_same';
        const multiplier = SYMBOLS.find(s => s.name === reel1).multiplier;
        winAmount = betAmount * multiplier;
    } else if (selectedSymbols.filter(symbol => symbol === '7').length === 2) {
        // Exactly two sevens receive a small payout; other pairs do not win.
        winType = 'two_sevens';
        winAmount = betAmount * WINNING_COMBOS.two_sevens.multiplier;
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
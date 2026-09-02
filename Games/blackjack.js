const STARTING_BALANCE = 5000;
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = [
	{ label: 'A', value: 11 },
	{ label: '2', value: 2 },
	{ label: '3', value: 3 },
	{ label: '4', value: 4 },
	{ label: '5', value: 5 },
	{ label: '6', value: 6 },
	{ label: '7', value: 7 },
	{ label: '8', value: 8 },
	{ label: '9', value: 9 },
	{ label: '10', value: 10 },
	{ label: 'J', value: 10 },
	{ label: 'Q', value: 10 },
	{ label: 'K', value: 10 }
];

let balance = STARTING_BALANCE;
let deck = [];
let playerHand = [];
let dealerHand = [];
let currentBet = 0;
let roundActive = false;

const currencyDisplay = document.getElementById('currency');
const betInput = document.getElementById('betAmount');
const playButton = document.getElementById('playButton');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');
const dealerCards = document.getElementById('dealerCards');
const dealerTotal = document.getElementById('dealerTotal');
const playerCards = document.getElementById('playerCards');
const playerTotal = document.getElementById('playerTotal');
const gameMessage = document.getElementById('gameMessage');

function formatMoney(amount) {
	return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatBetInput() {
	const digits = betInput.value.replace(/\D/g, '');
	betInput.value = digits ? formatMoney(digits) : '';
}

function updateBalance() {
	currencyDisplay.textContent = `$${formatMoney(balance)}`;
}

function createDeck() {
	return suits.flatMap(suit => ranks.map(rank => ({ ...rank, suit })));
}

function shuffle(cards) {
	for (let index = cards.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
	}
	return cards;
}

function drawCard(hand) {
	hand.push(deck.pop());
}

function getHandValue(hand) {
	let total = hand.reduce((sum, card) => sum + card.value, 0);
	let aces = hand.filter(card => card.label === 'A').length;
	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}
	return total;
}

function hasAce(hand) {
	return hand.some(card => card.label === 'A');
}

function hasUsableAce(hand) {
	return hasAce(hand) && getHandValue(hand) <= 21 && hand.reduce((sum, card) => sum + card.value, 0) !== getHandValue(hand);
}

function cardText(card) {
	const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
	return `${card.label}${suitSymbols[card.suit]}`;
}

function renderHands(showDealerHand = false) {
	playerCards.textContent = playerHand.map(cardText).join('  ');
	playerTotal.textContent = `Total: ${getHandValue(playerHand)}${hasAce(playerHand) ? ' (Ace included)' : ''}${hasUsableAce(playerHand) ? ' (soft)' : ''}`;

	if (showDealerHand) {
		dealerCards.textContent = dealerHand.map(cardText).join('  ');
		dealerTotal.textContent = `Total: ${getHandValue(dealerHand)}${hasAce(dealerHand) ? ' (Ace included)' : ''}${hasUsableAce(dealerHand) ? ' (soft)' : ''}`;
	} else {
		dealerCards.textContent = `${cardText(dealerHand[0])}  [hidden]`;
		dealerTotal.textContent = `Showing: ${getHandValue([dealerHand[0]])}${hasAce(dealerHand) ? ' (Dealer has an Ace)' : ''}`;
	}
}

function setMessage(message, state = '') {
	gameMessage.textContent = message;
	gameMessage.className = `game-message ${state}`;
}

function setRoundButtons(active) {
	playButton.disabled = active;
	hitButton.disabled = !active;
	standButton.disabled = !active;
	betInput.disabled = active;
}

function playRound() {
	const bet = Number(betInput.value.replace(/,/g, ''));
	if (!Number.isInteger(bet) || bet < 1) {
		setMessage('Enter a whole-dollar bet of at least $1.', 'lose');
		return;
	}
	if (bet > balance) {
		setMessage(`Insufficient funds. Maximum bet: $${formatMoney(balance)}`, 'lose');
		return;
	}

	balance -= bet;
	currentBet = bet;
	deck = shuffle(createDeck());
	playerHand = [];
	dealerHand = [];
	drawCard(playerHand);
	drawCard(dealerHand);
	drawCard(playerHand);
	drawCard(dealerHand);
	roundActive = true;
	updateBalance();
	setRoundButtons(true);
	renderHands();

	if (getHandValue(playerHand) === 21) {
		finishRound('playerBlackjack');
	} else {
		setMessage('Choose Hit or Stand.');
	}
}

function hit() {
	if (!roundActive) return;
	drawCard(playerHand);
	renderHands();
	const total = getHandValue(playerHand);
	if (total > 21) {
		finishRound('playerBust');
	} else if (total === 21) {
		stand();
	} else {
		setMessage('Choose Hit or Stand.');
	}
}

function stand() {
	if (!roundActive) return;
	while (getHandValue(dealerHand) < 17 || (getHandValue(dealerHand) === 17 && hasUsableAce(dealerHand))) {
		drawCard(dealerHand);
	}
	renderHands(true);
	const playerValue = getHandValue(playerHand);
	const dealerValue = getHandValue(dealerHand);
	finishRound(playerValue > 21 ? 'playerBust' : dealerValue > 21 ? 'dealerBust' : playerValue > dealerValue ? 'playerWin' : playerValue < dealerValue ? 'dealerWin' : 'push');
}

function finishRound(result) {
	roundActive = false;
	setRoundButtons(false);
	renderHands(result !== 'playerBust' && result !== 'playerBlackjack');
	let message;
	let state = 'lose';
	let payout = 0;

	if (result === 'playerBlackjack') {
		payout = currentBet * 2.5;
		message = `Blackjack! You win $${formatMoney(currentBet * 1.5)} at 3:2.`;
		state = 'win';
	} else if (result === 'playerWin' || result === 'dealerBust') {
		payout = currentBet * 2;
		message = `You win $${formatMoney(currentBet)} at 1:1.`;
		state = 'win';
	} else if (result === 'push') {
		payout = currentBet;
		message = 'Push. Your bet is returned.';
		state = '';
	} else if (result === 'playerBust') {
		message = `Bust. You lose $${formatMoney(currentBet)}.`;
	} else {
		message = `Dealer wins. You lose $${formatMoney(currentBet)}.`;
	}

	balance += payout;
	updateBalance();
	setMessage(`${message} Balance: $${formatMoney(balance)}`, state);
}

playButton.addEventListener('click', playRound);
hitButton.addEventListener('click', hit);
standButton.addEventListener('click', stand);
betInput.addEventListener('input', formatBetInput);
betInput.addEventListener('keydown', event => {
	if (event.key === 'Enter') playRound();
});
updateBalance();

class MinesGame {
    constructor() {
        this.balance = 100.00;
        this.betAmount = GAME_CONFIG.DEFAULT_BET;
        this.minesCount = 5;
        this.gameActive = false;
        this.revealedCells = [];
        this.minePositions = [];
        this.currentMultiplier = 1.00;
        this.yaGames = null;
        this.lastGameWasLoss = false;

        this.initializeElements();
        this.updateBalance(this.balance);
        this.initializeEventListeners();
        this.initializeGrid();
        this.updateUI();
        this.minesSelect.value = this.minesCount;
        this.initializeYandexSDK();
    }

    async initializeYandexSDK() {
        try {
            // Check if SDK is already loaded
            if (typeof YaGames !== 'undefined') {
                this.yaGames = await YaGames.init();
            } else {
                // Wait for SDK to load
                await new Promise((resolve) => {
                    const checkSDK = setInterval(() => {
                        if (typeof YaGames !== 'undefined') {
                            clearInterval(checkSDK);
                            resolve();
                        }
                    }, 100);
                });
                this.yaGames = await YaGames.init();
            }
        } catch (error) {
            console.error('Failed to initialize Yandex Games SDK:', error);
        }
    }

    async showAd() {
        if (!this.yaGames) {
            console.warn('Yandex Games SDK not initialized');
            return;
        }
        
        try {
            await this.yaGames.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => {},
                    onClose: (wasShown) => {},
                    onError: (error) => {
                        console.error('Ad error:', error);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to show ad:', error);
        }
    }

    initializeElements() {
        this.balanceElement = document.getElementById('balance');
        this.betInput = document.getElementById('bet-amount');
        this.minesSelect = document.getElementById('mines-count');
        this.nextBtn = document.getElementById('next-btn');
        this.cashoutBtn = document.getElementById('cashout-btn');
        this.topupBtn = document.getElementById('topup-btn');
        this.grid = document.getElementById('grid');
        this.nextMultiplierElement = document.getElementById('next-multiplier');
        this.potentialProfitElement = document.getElementById('potential-profit');
        this.resultBox = document.getElementById('result-box');
        this.resultMultiplier = document.getElementById('result-multiplier');
        this.resultProfit = document.getElementById('result-profit');
    }

    initializeEventListeners() {
        this.nextBtn.addEventListener('click', () => this.startGame());
        this.cashoutBtn.addEventListener('click', () => this.cashOut());
        this.topupBtn.addEventListener('click', () => this.topUpBalance());
        this.betInput.addEventListener('input', () => {
            this.updateUI();
            const notification = document.getElementById('notification');
            notification.classList.remove('active');
            notification.textContent = '';
        });
        this.minesSelect.addEventListener('input', () => this.updateUI());
    }

    initializeGrid() {
        // Save the overlay if it exists
        const existingOverlay = document.getElementById('result-overlay');
        
        // Clear grid
        this.grid.innerHTML = '';
        
        // Create cells
        for (let i = 0; i < GAME_CONFIG.GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            this.grid.appendChild(cell);
        }
        
        // Re-add the overlay or create a new one if it doesn't exist
        if (existingOverlay) {
            this.grid.appendChild(existingOverlay);
        } else {
            this.createResultOverlay();
        }
    }

    createResultOverlay() {
        const resultOverlay = document.createElement('div');
        resultOverlay.id = 'result-overlay';
        resultOverlay.className = 'result-overlay';
        
        const resultBox = document.createElement('div');
        resultBox.id = 'result-box';
        resultBox.className = 'result-box';
        
        const resultMultiplier = document.createElement('div');
        resultMultiplier.id = 'result-multiplier';
        resultMultiplier.className = 'result-multiplier';
        
        const resultProfit = document.createElement('div');
        resultProfit.id = 'result-profit';
        resultProfit.className = 'result-profit';
        
        resultBox.appendChild(resultMultiplier);
        resultBox.appendChild(resultProfit);
        resultOverlay.appendChild(resultBox);
        this.grid.appendChild(resultOverlay);
    }

    handleCellClick(index) {
        if (!this.gameActive || this.revealedCells.includes(index)) {
            return;
        }
        
        const cell = this.grid.children[index];
        
        if (this.minePositions.includes(index)) {
            // Hit a mine - game over
            this.revealMines();
            cell.classList.add('revealed', 'mine');
            cell.innerHTML = '<span class="mine-icon">💣</span>';
            this.endGame(false);
        } else {
            // Revealed a safe cell
            this.revealedCells.push(index);
            cell.classList.add('revealed', 'gem');
            cell.innerHTML = '<img src="img/bitcoin.png" class="gem-icon" alt="bitcoin">';
            
            // Check if all safe cells have been revealed
            if (this.revealedCells.length === GAME_CONFIG.GRID_SIZE - this.minesCount) {
                this.endGame(true);
            } else {
                this.updateMultiplier();
            }
        }
    }

    revealMines() {
        this.minePositions.forEach(pos => {
            const mineCell = this.grid.children[pos];
            mineCell.classList.add('revealed', 'mine');
            mineCell.innerHTML = '💣';
        });
    }

    updateBalance(newBalance) {
        this.balance = parseFloat(newBalance);
        this.balanceElement.textContent = formatCurrency(this.balance);
        
        // Update top up button visibility
        if (this.balance < 100) {
            this.topupBtn.style.display = 'inline-block';
        } else {
            this.topupBtn.style.display = 'none';
        }
    }

    startGame() {
        // Show ad only if this is a new game after a loss
        if (!this.gameActive && this.lastGameWasLoss) {
            this.showAd();
            this.lastGameWasLoss = false; // Reset the flag after showing ad
        }
        
        this.betAmount = parseFloat(this.betInput.value);
        this.minesCount = parseInt(this.minesSelect.value);
        
        if (!validateBet(this.betAmount, this.balance)) {
            this.nextMultiplierElement.textContent = typeof getTranslation === 'function' ? getTranslation('invalidBet') : 'Invalid bet';
            if (this.betAmount > this.balance) {
                this.showNotification(typeof getTranslation === 'function' ? getTranslation('notEnoughBalance') : 'Not enough balance for this bet');
            }
            return;
        }
        
        if (!validateMinesCount(this.minesCount)) {
            this.minesCount = GAME_CONFIG.DEFAULT_MINES;
            this.minesSelect.value = GAME_CONFIG.DEFAULT_MINES;
        }
        
        // Hide any visible result box from previous game
        if (this.resultBox) {
            this.resultBox.classList.remove('visible');
        }
        
        // Deduct bet from balance
        this.updateBalance(this.balance - this.betAmount);
        
        // Reset game state
        this.gameActive = true;
        this.revealedCells = [];
        this.minePositions = generateMinePositions(this.minesCount);
        this.currentMultiplier = 1.00;
        
        // Reset UI
        this.initializeGrid();
        this.nextBtn.textContent = typeof getTranslation === 'function' ? getTranslation('playing') : 'Playing...';
        this.nextBtn.disabled = true;
        this.cashoutBtn.style.display = 'block';
        
        this.updateMultiplier();
    }

    endGame(win) {
        this.gameActive = false;
        this.nextBtn.disabled = false;
        this.nextBtn.textContent = typeof getTranslation === 'function' ? getTranslation('playAgain') : 'Play Again';
        this.cashoutBtn.style.display = 'none';
        
        // Store the game result
        this.lastGameWasLoss = !win;
        
        if (win) {
            const winAmount = this.betAmount * this.currentMultiplier;
            const profit = winAmount - this.betAmount;
            this.updateBalance(this.balance + winAmount);
            
            this.resultBox.className = 'result-box win';
            this.resultMultiplier.className = 'result-multiplier win-text';
            this.resultMultiplier.textContent = this.currentMultiplier.toFixed(2) + 'x';
            this.resultProfit.className = 'result-profit win-text';
            this.resultProfit.textContent = '+' + formatCurrency(profit);
        } else {
            this.resultBox.className = 'result-box lose';
            this.resultMultiplier.className = 'result-multiplier lose-text';
            this.resultMultiplier.textContent = '0.00x';
            this.resultProfit.className = 'result-profit lose-text';
            this.resultProfit.textContent = '-' + formatCurrency(this.betAmount);
        }
        
        this.resultBox.classList.add('visible');
    }

    cashOut() {
        if (!this.gameActive) return;
        
        const winAmount = this.betAmount * this.currentMultiplier;
        const profit = winAmount - this.betAmount;
        this.updateBalance(this.balance + winAmount);
        
        this.revealMines();
        this.gameActive = false;
        this.nextBtn.disabled = false;
        this.nextBtn.textContent = typeof getTranslation === 'function' ? getTranslation('playAgain') : 'Play Again';
        this.cashoutBtn.style.display = 'none';
        
        this.resultBox.className = 'result-box win';
        this.resultMultiplier.className = 'result-multiplier win-text';
        this.resultMultiplier.textContent = this.currentMultiplier.toFixed(2) + 'x';
        this.resultProfit.className = 'result-profit win-text';
        this.resultProfit.textContent = '+' + formatCurrency(profit);
        
        this.resultBox.classList.add('visible');
    }

    updateMultiplier() {
        this.currentMultiplier = calculateMultiplier(this.minesCount, this.revealedCells);
        this.nextMultiplierElement.textContent = this.currentMultiplier.toFixed(2) + 'x';
        this.potentialProfitElement.textContent = formatCurrency(this.betAmount * this.currentMultiplier - this.betAmount);
    }

    updateUI() {
        this.updateMultiplier();
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('active');
        if (this._notifTimeout) clearTimeout(this._notifTimeout);
        this._notifTimeout = setTimeout(() => {
            notification.classList.remove('active');
            notification.textContent = '';
        }, 3000);
    }

    async topUpBalance() {
        if (!this.yaGames) {
            console.warn('Yandex Games SDK not initialized');
            return;
        }

        try {
            await this.yaGames.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => {
                        this.showNotification('Смотрите рекламу для пополнения баланса');
                    },
                    onRewarded: () => {
                        this.updateBalance(100.00);
                        this.showNotification('Баланс пополнен!');
                    },
                    onClose: (wasShown) => {
                        // Не показываем уведомление, так как onRewarded уже сработал
                    },
                    onError: (error) => {
                        console.error('Ad error:', error);
                        this.showNotification('Ошибка при показе рекламы');
                    }
                }
            });
        } catch (error) {
            console.error('Failed to show ad:', error);
            this.showNotification('Ошибка при показе рекламы');
        }
    }
} 
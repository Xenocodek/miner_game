function calculateMultiplier(minesCount, revealedCells) {
    const n = GAME_CONFIG.GRID_SIZE;
    const m = minesCount;
    const c = revealedCells.length;

    if (c === 0) {
        return 1.00;
    }

    try {
        let probabilityProduct = 1.0;
        
        for (let i = 0; i < c; i++) {
            const safeTiles = n - m - i;
            const totalTiles = n - i;
            
            if (totalTiles <= 0) {
                console.error('Division by zero detected in multiplier calculation');
                return 1.00;
            }
            
            const stepProbability = safeTiles / totalTiles;
            
            if (stepProbability <= 0 || stepProbability > 1) {
                console.error('Invalid probability detected:', stepProbability);
                return 1.00;
            }
            
            probabilityProduct *= stepProbability;
        }
        
        if (probabilityProduct <= 0.0000001) {
            console.error('Probability product too small:', probabilityProduct);
            return 100;
        }
        
        let multiplier = (1 / probabilityProduct) * GAME_CONFIG.HOUSE_EDGE;
        
        // Special case for 1 mine
        if (m === 1 && c === n - m) {
            multiplier = GAME_CONFIG.SPECIAL_MINE_MULTIPLIER;
        }
        
        // Cap multiplier at reasonable levels
        const maxMultiplier = 100 + m * 15;
        multiplier = Math.min(multiplier, maxMultiplier);
        
        if (isNaN(multiplier) || !isFinite(multiplier)) {
            console.error('Invalid multiplier calculated:', multiplier);
            return 1.00;
        }
        
        return multiplier;
    } catch (error) {
        console.error('Error in multiplier calculation:', error);
        return 1.00;
    }
}

function formatCurrency(amount) {
    return '₿' + amount.toFixed(2);
}

function generateMinePositions(minesCount) {
    const positions = [];
    while (positions.length < minesCount) {
        const position = Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE);
        if (!positions.includes(position)) {
            positions.push(position);
        }
    }
    return positions;
}

function validateBet(bet, balance) {
    if (bet > balance) {
        return false;
    }
    if (bet < GAME_CONFIG.MIN_BET || bet > GAME_CONFIG.MAX_BET) {
        return false;
    }
    return true;
}

function validateMinesCount(minesCount) {
    return minesCount >= GAME_CONFIG.MIN_MINES && minesCount <= GAME_CONFIG.MAX_MINES;
} 
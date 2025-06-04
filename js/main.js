// Локализация
const translations = {
    en: {
        title: 'Crypto<br>Mines',
        balance: 'Balance:',
        betAmount: 'Bet Amount:',
        numberOfMines: 'Number of Mines:',
        play: 'Play',
        playAgain: 'Play Again',
        playing: 'Playing...',
        cashOut: 'Cash Out',
        next: 'Next:',
        profit: 'Profit:',
        mines: (n) => `${n} Mine${n > 1 ? 's' : ''}`,
        invalidBet: 'Invalid bet',
        notEnoughBalance: 'Not enough balance for this bet',
    },
    ru: {
        title: 'Крипто<br>Сапёр',
        balance: 'Баланс:',
        betAmount: 'Ставка:',
        numberOfMines: 'Количество мин:',
        play: 'Играть',
        playAgain: 'Играть снова',
        playing: 'Играем...',
        cashOut: 'Забрать',
        next: 'Следующий множитель:',
        profit: 'Профит:',
        mines: (n) => `${n} ${n === 1 ? 'мина' : (n >= 2 && n <= 4 ? 'мины' : 'мин')}`,
        invalidBet: 'Некорректная ставка',
        notEnoughBalance: 'Недостаточно баланса для ставки',
    }
};

let currentLang = 'ru';

function setLang(lang) {
    currentLang = lang;
    const t = translations[lang];
    document.querySelector('.header h1').innerHTML = t.title;
    document.querySelector('.balance').childNodes[0].textContent = t.balance + ' ';
    document.querySelector('label[for="bet-amount"]').textContent = t.betAmount;
    document.querySelector('label[for="mines-count"]').textContent = t.numberOfMines;
    document.getElementById('next-btn').textContent = t.play;
    document.getElementById('cashout-btn').textContent = t.cashOut;
    document.querySelector('.next-multiplier').childNodes[0].textContent = t.next + ' ';
    document.querySelector('.potential-profit').childNodes[0].textContent = t.profit + ' ';
    // Обновить опции select
    const select = document.getElementById('mines-count');
    for (let i = 0; i < select.options.length; i++) {
        const n = parseInt(select.options[i].value);
        select.options[i].textContent = t.mines(n);
    }
}

function getTranslation(key) {
    const t = translations[currentLang];
    return typeof t[key] === 'function' ? t[key] : t[key];
}

document.addEventListener('DOMContentLoaded', () => {
    setLang(currentLang);
    const langBtn = document.getElementById('lang-switcher');
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ru' : 'en';
        langBtn.textContent = currentLang.toUpperCase();
        setLang(currentLang);
    });
    langBtn.textContent = currentLang.toUpperCase();

    try {
        const game = new MinesGame();
        console.log("Game initialized successfully");
    } catch (error) {
        console.error("Initialization error:", error);
    }
});

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error caught:", message);
    console.error("Source:", source);
    console.error("Line:", lineno);
    console.error("Column:", colno);
    console.error("Error object:", error);
    return false;
}; 
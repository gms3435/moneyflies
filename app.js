/**
 * MoneyFlies - Dedicated Personal Finance Logic
 * Standalone Release v1.0.0
 */

// Official TimeFlies Category Mapping
const TIMEFLIES_CATEGORIES = {
    alimentacao: 'Alimentação',
    bem_duravel: 'Bem durável',
    filhos: 'Filhos',
    ensino: 'Ensino',
    gasto_terceiro: 'Gasto de Terceiro',
    glp: 'GLP',
    lazer: 'Lazer',
    mercado: 'Mercado',
    obra: 'Obra',
    pet: 'Pet',
    roupa: 'Roupa',
    saude: 'Saúde',
    servico: 'Serviço',
    taxa: 'Taxa',
    transporte: 'Transporte',
    outros: 'Outros'
};

const DEFAULT_CATEGORIES = [
    "Alimentação", "Mercado", "Moradia", "Transporte", "Saúde", 
    "Lazer", "Ensino", "Assinaturas", "Outros"
];

let financeState = {
    currentMonth: new Date().toISOString().substring(0, 7),
    hideValues: false,
    security: {
        enabled: true,
        password: 'admin'
    },
    money: {
        expenses: [],
        incomes: [],
        fixedExpenses: [],
        creditCards: [
            {
                id: 'default',
                name: 'Cartão Principal',
                limit: 3000,
                closingDay: 5,
                dueDay: 12
            }
        ],
        categories: [...DEFAULT_CATEGORIES]
    }
};

let chartCategoriesInstance = null;
let chartHistoryInstance = null;

// Initializer
document.addEventListener('DOMContentLoaded', async () => {
    initMonthPicker();
    await loadFinanceState();
    setupCategorySelects();
    checkSecurityAuth();
    renderAll();
    
    if (window.lucide) {
        lucide.createIcons();
    }
});

function initMonthPicker() {
    const monthInput = document.getElementById('finance-month-picker');
    if (monthInput) {
        monthInput.value = financeState.currentMonth;
    }
}

function onFinanceMonthChange(val) {
    if (!val) return;
    financeState.currentMonth = val;
    renderAll();
}

function changeFinanceMonth(delta) {
    const [year, month] = financeState.currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    financeState.currentMonth = `${y}-${m}`;
    initMonthPicker();
    renderAll();
}

function toggleFinanceVisibility() {
    financeState.hideValues = !financeState.hideValues;
    const eyeIcon = document.getElementById('eye-icon');
    if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', financeState.hideValues ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons();
    }
    
    document.querySelectorAll('.val-sensivel').forEach(el => {
        if (financeState.hideValues) {
            el.classList.add('value-blur');
        } else {
            el.classList.remove('value-blur');
        }
    });
}

// Password Security & Auth Handlers (Segurança Obrigatória e Permanente)
function checkSecurityAuth() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;

    const isAuthed = sessionStorage.getItem('moneyflies_auth') === 'true';

    if (!isAuthed) {
        overlay.style.display = 'flex';
        updateLoginOverlayUI();
        const input = document.getElementById('login-password-input');
        if (input) input.focus();
    } else {
        overlay.style.display = 'none';
    }
}

function updateLoginOverlayUI() {
    const hintEl = document.getElementById('login-hint-msg');
    const sec = financeState.security || { password: null, isFirstAccess: true };
    const hasPassword = sec.password !== null && sec.password !== undefined && String(sec.password).trim() !== '' && sec.isFirstAccess === false;

    if (hintEl) {
        if (!hasPassword) {
            hintEl.innerHTML = '💡 <strong>Primeiro Acesso</strong>: Digite qualquer número/senha para registrar seu primeiro acesso.';
        } else {
            hintEl.innerHTML = '🔒 Digite sua senha de acesso cadastrada.';
        }
    }
}

function handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('login-password-input');
    const errorMsg = document.getElementById('login-error-msg');
    const overlay = document.getElementById('login-overlay');

    const enteredPass = input ? String(input.value).trim() : '';
    if (!enteredPass) return;

    if (!financeState.security) {
        financeState.security = { password: null, isFirstAccess: true };
    }

    const sec = financeState.security;
    const hasPassword = sec.password !== null && sec.password !== undefined && String(sec.password).trim() !== '' && sec.isFirstAccess === false;

    // PRIMEIRO ACESSO: Qualquer número/senha digitado define a nova senha mestre!
    if (!hasPassword) {
        financeState.security = {
            password: enteredPass,
            isFirstAccess: false
        };
        saveFinanceState();
        sessionStorage.setItem('moneyflies_auth', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        if (input) input.value = '';
        alert('🔐 Senha de acesso cadastrada com sucesso! A partir de agora, o acesso é exclusivo com esta senha.');
        renderAll();
        return;
    }

    // ACESSO REGULAR: A senha DEVE ser exatamente a senha cadastrada (SEM coringa admin)
    const masterPass = String(sec.password).trim();

    if (enteredPass === masterPass) {
        sessionStorage.setItem('moneyflies_auth', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        if (input) input.value = '';
        renderAll();
    } else {
        if (errorMsg) {
            errorMsg.textContent = '⚠️ Senha incorreta. Tente novamente.';
            errorMsg.style.display = 'block';
        }
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

function resetFinanceDataFromLogin() {
    if (!confirm('ATENÇÃO: Deseja apagar todos os dados locais e redefinir o MoneyFlies para o Primeiro Acesso?')) return;
    
    localStorage.removeItem('moneyflies_state');
    sessionStorage.removeItem('moneyflies_auth');

    financeState.security = {
        password: null,
        isFirstAccess: true
    };
    financeState.money = sanitizeMoneyObj({});

    saveFinanceState();
    
    const input = document.getElementById('login-password-input');
    if (input) input.value = '';
    const errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    updateLoginOverlayUI();
    alert('✨ Dados redefinidos! Digite a senha desejada para registrar seu novo acesso.');
}

function lockFinanceSession() {
    sessionStorage.removeItem('moneyflies_auth');
    checkSecurityAuth();
}

function saveSecuritySettings(e) {
    e.preventDefault();
    const inputNewPass = document.getElementById('setting-new-password');
    const newPass = inputNewPass ? inputNewPass.value.trim() : '';

    if (!newPass) {
        alert('Por favor, digite a nova senha de acesso.');
        return;
    }

    financeState.security = {
        password: newPass,
        isFirstAccess: false
    };

    if (inputNewPass) inputNewPass.value = '';

    saveFinanceState();
    alert('🔒 Nova senha de acesso salva com sucesso!');
    checkSecurityAuth();
}

// Data Persistence (Backend API + LocalStorage + Static GitHub Pages Fallback)
async function loadFinanceState() {
    // 1. Try loading from local backend API /api/data (when running Python server.py)
    try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await res.json();
                if (data && data.money) {
                    financeState.money = sanitizeMoneyObj(data.money);
                    if (data.security) {
                        financeState.security = data.security;
                    }
                    saveStateToLocalStorage();
                    return;
                }
            }
        }
    } catch (e) {
        console.log('[MoneyFlies] Backend /api/data offline.');
    }

    // 2. Try loading local moneyflies_db.json static file (when hosted statically on GitHub Pages)
    const savedLocal = localStorage.getItem('moneyflies_state');
    if (!savedLocal) {
        try {
            const resStatic = await fetch('./moneyflies_db.json', { cache: 'no-store' });
            if (resStatic.ok) {
                const dataStatic = await resStatic.json();
                if (dataStatic && dataStatic.money) {
                    financeState.money = sanitizeMoneyObj(dataStatic.money);
                    if (dataStatic.security) {
                        financeState.security = dataStatic.security;
                    }
                    saveStateToLocalStorage();
                    return;
                }
            }
        } catch (e) {
            console.log('[MoneyFlies] Static moneyflies_db.json fetch fallback error.');
        }
    }

    // 3. Fallback to localStorage
    if (savedLocal) {
        try {
            const parsed = JSON.parse(savedLocal);
            if (parsed && parsed.money) {
                financeState.money = sanitizeMoneyObj(parsed.money);
            }
            if (parsed && parsed.security) {
                financeState.security = parsed.security;
            }
        } catch (e) {
            console.error('[MoneyFlies] Erro ao carregar localStorage:', e);
        }
    }
}

async function saveFinanceState() {
    saveStateToLocalStorage();
    
    // Sync with Python backend if available
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                version: 'moneyflies-v1',
                updatedAt: new Date().toISOString(),
                security: financeState.security,
                money: financeState.money
            })
        });
    } catch (e) {
        // Backend not reachable, safe to ignore
    }
}

function saveStateToLocalStorage() {
    localStorage.setItem('moneyflies_state', JSON.stringify({
        updatedAt: new Date().toISOString(),
        security: financeState.security,
        money: financeState.money
    }));
}

// Helper to check if a fixed expense is active for a given monthStr ('YYYY-MM')
function isFixedExpenseActiveForMonth(item, monthStr) {
    if (!item) return false;

    if (item.history && item.history[monthStr] !== undefined) {
        return true;
    }
    if (item.monthlyAmounts && item.monthlyAmounts[monthStr] !== undefined) {
        return true;
    }

    if (item.startDate && monthStr < item.startDate) {
        return false;
    }
    if (item.endDate && monthStr > item.endDate) {
        return false;
    }
    if (item.exceptMonths && item.exceptMonths[monthStr] === true) {
        return false;
    }
    return true;
}

// Helper to get the specific amount of a fixed expense for a given monthStr
function getFixedExpenseAmount(item, monthStr) {
    if (!item) return 0;
    if (item.monthlyAmounts && item.monthlyAmounts[monthStr] !== undefined) {
        return Number(item.monthlyAmounts[monthStr]) || 0;
    }
    return Number(item.amount) || 0;
}

function getItemDesc(item) {
    if (!item) return '-';
    return item.desc || item.description || item.obs || item.notes || item.title || item.name || item.source || item.detail || '-';
}

function getCategoryLabel(catKey) {
    if (!catKey) return 'Outros';
    if (TIMEFLIES_CATEGORIES[catKey]) {
        return TIMEFLIES_CATEGORIES[catKey];
    }
    return catKey;
}

function sanitizeMoneyObj(m) {
    if (!m) m = {};

    const categoriesSet = new Set([...DEFAULT_CATEGORIES]);

    if (Array.isArray(m.categories)) {
        m.categories.forEach(c => {
            const label = getCategoryLabel(c);
            if (label) categoriesSet.add(label);
        });
    }

    const expenses = Array.isArray(m.expenses) ? m.expenses.map(e => {
        const desc = getItemDesc(e);
        const cat = getCategoryLabel(e.category || e.cat);
        if (cat) categoriesSet.add(cat);

        const method = e.method || e.paymentMethod || 'cash';
        const cardId = e.cardId || e.creditCardId || 'default';
        const amount = Number(e.amount) || 0;
        const installments = Number(e.installments) || 1;

        return {
            ...e,
            id: e.id || 'exp_' + Math.random().toString(36).substring(2, 9),
            date: e.date || new Date().toISOString().substring(0, 10),
            desc: desc,
            description: desc,
            category: cat,
            amount: amount,
            method: method,
            paymentMethod: method,
            cardId: cardId,
            creditCardId: cardId,
            installments: installments,
            currentInstallment: Number(e.currentInstallment) || 1
        };
    }) : [];

    const incomes = Array.isArray(m.incomes) ? m.incomes.map(i => {
        const desc = getItemDesc(i);
        const cat = getCategoryLabel(i.category || i.cat) || 'Receita';
        if (cat) categoriesSet.add(cat);
        return {
            ...i,
            id: i.id || 'inc_' + Math.random().toString(36).substring(2, 9),
            date: i.date || new Date().toISOString().substring(0, 10),
            desc: desc,
            description: desc,
            source: desc,
            category: cat,
            amount: Number(i.amount) || 0
        };
    }) : [];

    const fixedExpenses = Array.isArray(m.fixedExpenses) ? m.fixedExpenses.map(f => {
        const name = f.title || f.name || getItemDesc(f);
        return {
            ...f,
            id: f.id || 'fix_' + Math.random().toString(36).substring(2, 9),
            name: name,
            title: name,
            desc: name,
            description: name,
            amount: Number(f.amount) || 0,
            dueDay: Number(f.dueDay) || 10,
            startDate: f.startDate || '',
            endDate: f.endDate || '',
            method: f.method || 'cash',
            cardId: f.cardId || null,
            history: typeof f.history === 'object' && f.history ? f.history : {},
            monthlyAmounts: typeof f.monthlyAmounts === 'object' && f.monthlyAmounts ? f.monthlyAmounts : {},
            exceptMonths: typeof f.exceptMonths === 'object' && f.exceptMonths ? f.exceptMonths : {},
            paidMonths: Array.isArray(f.paidMonths) ? f.paidMonths : []
        };
    }) : [];

    let creditCards = [];
    if (Array.isArray(m.creditCards) && m.creditCards.length > 0) {
        creditCards = m.creditCards.map(c => ({
            id: c.id || 'default',
            name: c.name || 'Cartão Principal',
            limit: Number(c.limit) || 3000,
            closingDay: Number(c.closingDay) || 5,
            dueDay: Number(c.dueDay) || 12,
            history: typeof c.history === 'object' && c.history ? c.history : {},
            paidMonths: Array.isArray(c.paidMonths) ? c.paidMonths : []
        }));
    } else if (m.cardSettings && typeof m.cardSettings === 'object') {
        creditCards = [{
            id: 'default',
            name: 'Cartão Principal',
            limit: Number(m.cardSettings.limit) || 3000,
            closingDay: Number(m.cardSettings.closingDay) || 5,
            dueDay: Number(m.cardSettings.dueDay) || 12,
            history: {},
            paidMonths: []
        }];
    } else {
        creditCards = [{
            id: 'default',
            name: 'Cartão Principal',
            limit: 3000,
            closingDay: 5,
            dueDay: 12,
            history: {},
            paidMonths: []
        }];
    }

    return {
        expenses: expenses,
        incomes: incomes,
        fixedExpenses: fixedExpenses,
        creditCards: creditCards,
        categories: Array.from(categoriesSet)
    };
}

function setupCategorySelects() {
    const selects = ['trans-category', 'filter-expense-category'];
    const cats = financeState.money.categories || [...DEFAULT_CATEGORIES];
    
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        
        const currentVal = sel.value;
        sel.innerHTML = '';
        
        if (id === 'filter-expense-category') {
            sel.innerHTML = '<option value="ALL">Todas as Categorias</option>';
        }
        
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            sel.appendChild(opt);
        });
        
        if (currentVal && cats.includes(currentVal)) sel.value = currentVal;
    });
}

function switchFinanceSubTab(subtabKey) {
    document.querySelectorAll('.moneyflies-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtabKey);
    });

    document.querySelectorAll('.moneyflies-subtab-content').forEach(content => {
        content.style.display = content.id === `subtab-${subtabKey}` ? 'block' : 'none';
    });

    if (subtabKey === 'settings') {
        const chkEnable = document.getElementById('setting-security-enable');
        if (chkEnable && financeState.security) {
            chkEnable.checked = financeState.security.enabled !== false;
        }
    }

    if (window.lucide) lucide.createIcons();
    renderAll();
}

function formatBRL(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dateStr) {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function formatMonthBR(monthStr) {
    if (!monthStr) return '--';
    const [y, m] = monthStr.split('-');
    if (!y || !m) return monthStr;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthIdx = parseInt(m, 10) - 1;
    return `${months[monthIdx] || m}/${y}`;
}

function getCardExpensesForInvoice(targetMonthStr, cardId) {
    const expenses = financeState.money.expenses || [];
    const cards = financeState.money.creditCards || [];

    const activeCard = cards.find(c => c.id === cardId) || cards[0] || { id: 'default', limit: 3000, closingDay: 5, dueDay: 12 };
    const closingDay = Number(activeCard.closingDay) || 5;

    const invoiceItems = [];

    expenses.forEach(exp => {
        const method = exp.method || exp.paymentMethod || 'cash';
        if (method !== 'card') return;

        const itemCardId = exp.cardId || exp.creditCardId || 'default';
        if (cardId && itemCardId !== cardId && cards.length > 1) return;

        if (!exp.date) return;
        const parts = exp.date.split('-');
        if (parts.length < 3) return;

        const expY = parseInt(parts[0], 10);
        const expM = parseInt(parts[1], 10);
        const expD = parseInt(parts[2], 10);

        let purchaseInvoiceMonth = expM;
        let purchaseInvoiceYear = expY;

        if (expD > closingDay) {
            purchaseInvoiceMonth += 1;
            if (purchaseInvoiceMonth > 12) {
                purchaseInvoiceMonth = 1;
                purchaseInvoiceYear += 1;
            }
        }

        const installmentsCount = Number(exp.installments) || 1;
        const totalAmount = Number(exp.amount) || 0;
        const installmentAmount = exp.installmentAmount ? Number(exp.installmentAmount) : (totalAmount / installmentsCount);

        for (let i = 0; i < installmentsCount; i++) {
            let instMonth = purchaseInvoiceMonth + i;
            let instYear = purchaseInvoiceYear;

            while (instMonth > 12) {
                instMonth -= 12;
                instYear += 1;
            }

            const instMonthStr = `${instYear}-${String(instMonth).padStart(2, '0')}`;

            if (instMonthStr === targetMonthStr) {
                invoiceItems.push({
                    ...exp,
                    currentInstallment: i + 1,
                    totalInstallments: installmentsCount,
                    installmentLabel: `${i + 1}/${installmentsCount}`,
                    installmentAmount: installmentAmount,
                    invoiceMonth: instMonthStr
                });
            }
        }
    });

    const fixedExpenses = financeState.money.fixedExpenses || [];
    fixedExpenses.forEach(f => {
        if (!isFixedExpenseActiveForMonth(f, targetMonthStr)) return;

        if (f.method === 'card' && (f.cardId === activeCard.id || f.creditCardId === activeCard.id)) {
            const amount = getFixedExpenseAmount(f, targetMonthStr);
            invoiceItems.push({
                id: f.id,
                date: targetMonthStr + '-' + String(f.dueDay || 1).padStart(2, '0'),
                desc: f.name || f.title || f.desc || 'Despesa Fixa',
                description: f.name || f.title || f.desc || 'Despesa Fixa',
                category: 'Fixo',
                amount: amount,
                installmentAmount: amount,
                installmentsCount: 1,
                totalInstallments: 1,
                currentInstallment: 1,
                installmentLabel: 'Fixa',
                isFixedExpense: true
            });
        }
    });

    return invoiceItems;
}

function getCardTotalCommittedBalance(cardId, currentMonthStr) {
    const expenses = financeState.money.expenses || [];
    const cards = financeState.money.creditCards || [];

    const activeCard = cards.find(c => c.id === cardId) || cards[0] || { id: 'default', limit: 3000, closingDay: 5, dueDay: 12 };
    const closingDay = Number(activeCard.closingDay) || 5;

    let totalCommitted = 0;

    expenses.forEach(exp => {
        const method = exp.method || exp.paymentMethod || 'cash';
        if (method !== 'card') return;

        const itemCardId = exp.cardId || exp.creditCardId || 'default';
        if (cardId && itemCardId !== cardId && cards.length > 1) return;

        if (!exp.date) return;
        const parts = exp.date.split('-');
        if (parts.length < 3) return;

        const expY = parseInt(parts[0], 10);
        const expM = parseInt(parts[1], 10);
        const expD = parseInt(parts[2], 10);

        let purchaseInvoiceMonth = expM;
        let purchaseInvoiceYear = expY;

        if (expD > closingDay) {
            purchaseInvoiceMonth += 1;
            if (purchaseInvoiceMonth > 12) {
                purchaseInvoiceMonth = 1;
                purchaseInvoiceYear += 1;
            }
        }

        const installmentsCount = Number(exp.installments) || 1;
        const totalAmount = Number(exp.amount) || 0;
        const installmentAmount = exp.installmentAmount ? Number(exp.installmentAmount) : (totalAmount / installmentsCount);

        for (let i = 0; i < installmentsCount; i++) {
            let instMonth = purchaseInvoiceMonth + i;
            let instYear = purchaseInvoiceYear;

            while (instMonth > 12) {
                instMonth -= 12;
                instYear += 1;
            }

            const instMonthStr = `${instYear}-${String(instMonth).padStart(2, '0')}`;

            if (instMonthStr >= currentMonthStr) {
                totalCommitted += installmentAmount;
            }
        }
    });

    const fixedExpenses = financeState.money.fixedExpenses || [];
    fixedExpenses.forEach(f => {
        if (!isFixedExpenseActiveForMonth(f, currentMonthStr)) return;
        if (f.method === 'card' && (f.cardId === activeCard.id || f.creditCardId === activeCard.id)) {
            totalCommitted += getFixedExpenseAmount(f, currentMonthStr);
        }
    });

    return totalCommitted;
}

function renderAll() {
    renderDashboard();
    renderExpensesTable();
    renderCreditCardView();
    renderIncomesTable();
    renderFixedExpensesTable();
    
    if (financeState.hideValues) {
        document.querySelectorAll('.val-sensivel').forEach(el => el.classList.add('value-blur'));
    }
}

function getAdjacentMonthStr(monthStr, delta) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const resY = d.getFullYear();
    const resM = String(d.getMonth() + 1).padStart(2, '0');
    return `${resY}-${resM}`;
}

function getMonthFinancialTotals(monthStr) {
    const cards = financeState.money.creditCards || [];
    
    const incomes = (financeState.money.incomes || []).filter(i => (i.date || '').substring(0, 7) === monthStr);
    const totalIncome = incomes.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    
    const cashExpenses = (financeState.money.expenses || []).filter(e => 
        (e.method || e.paymentMethod || 'cash') !== 'card' && 
        (e.date || '').substring(0, 7) === monthStr
    );
    const totalCash = cashExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    let totalCardConsolidated = 0;
    const allCardInvoiceExpenses = [];
    
    cards.forEach(card => {
        const cardExpenses = getCardExpensesForInvoice(monthStr, card.id);
        const cardTotal = cardExpenses.reduce((acc, e) => acc + e.installmentAmount, 0);
        totalCardConsolidated += cardTotal;
        allCardInvoiceExpenses.push(...cardExpenses);
    });

    const fixedExpenses = (financeState.money.fixedExpenses || []).filter(f => 
        f.method !== 'card' && isFixedExpenseActiveForMonth(f, monthStr)
    );
    const totalFixed = fixedExpenses.reduce((acc, cur) => acc + getFixedExpenseAmount(cur, monthStr), 0);

    const totalExpenses = totalCash + totalCardConsolidated + totalFixed;
    const balance = totalIncome - totalExpenses;

    return {
        monthStr,
        totalIncome,
        totalCash,
        totalCardConsolidated,
        totalFixed,
        totalExpenses,
        balance,
        cashExpenses,
        allCardInvoiceExpenses
    };
}

function renderTriMonthOverview(targetMonth) {
    const prevMonthStr = getAdjacentMonthStr(targetMonth, -1);
    const currMonthStr = targetMonth;
    const nextMonthStr = getAdjacentMonthStr(targetMonth, 1);

    const prevTotals = getMonthFinancialTotals(prevMonthStr);
    const currTotals = getMonthFinancialTotals(currMonthStr);
    const nextTotals = getMonthFinancialTotals(nextMonthStr);

    const elPrevLabel = document.getElementById('tri-prev-label');
    const elCurrLabel = document.getElementById('tri-curr-label');
    const elNextLabel = document.getElementById('tri-next-label');

    if (elPrevLabel) elPrevLabel.textContent = formatMonthBR(prevMonthStr);
    if (elCurrLabel) elCurrLabel.textContent = `${formatMonthBR(currMonthStr)} (Atual)`;
    if (elNextLabel) elNextLabel.textContent = formatMonthBR(nextMonthStr);

    // Prev
    const elPrevInc = document.getElementById('tri-prev-income');
    const elPrevExp = document.getElementById('tri-prev-expenses');
    const elPrevBal = document.getElementById('tri-prev-balance');

    if (elPrevInc) elPrevInc.textContent = formatBRL(prevTotals.totalIncome);
    if (elPrevExp) elPrevExp.textContent = formatBRL(prevTotals.totalExpenses);
    if (elPrevBal) {
        elPrevBal.textContent = formatBRL(prevTotals.balance);
        elPrevBal.style.color = prevTotals.balance >= 0 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)';
    }

    // Curr
    const elCurrInc = document.getElementById('tri-curr-income');
    const elCurrExp = document.getElementById('tri-curr-expenses');
    const elCurrBal = document.getElementById('tri-curr-balance');

    if (elCurrInc) elCurrInc.textContent = formatBRL(currTotals.totalIncome);
    if (elCurrExp) elCurrExp.textContent = formatBRL(currTotals.totalExpenses);
    if (elCurrBal) {
        elCurrBal.textContent = formatBRL(currTotals.balance);
        elCurrBal.style.color = currTotals.balance >= 0 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)';
    }

    // Next
    const elNextInc = document.getElementById('tri-next-income');
    const elNextExp = document.getElementById('tri-next-expenses');
    const elNextBal = document.getElementById('tri-next-balance');

    if (elNextInc) elNextInc.textContent = formatBRL(nextTotals.totalIncome);
    if (elNextExp) elNextExp.textContent = formatBRL(nextTotals.totalExpenses);
    if (elNextBal) {
        elNextBal.textContent = formatBRL(nextTotals.balance);
        elNextBal.style.color = nextTotals.balance >= 0 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)';
    }
}

function renderSemesterIndicators(targetMonth) {
    const [y, m] = targetMonth.split('-').map(Number);
    const isFirstSemester = m <= 6;
    const startMonthNum = isFirstSemester ? 1 : 7;
    const semesterName = isFirstSemester ? '1º Semestre' : '2º Semestre';

    let semIncome = 0;
    let semCashActual = 0;
    let semCard = 0;
    let semFixed = 0;

    for (let i = 0; i < 6; i++) {
        const monthNum = startMonthNum + i;
        const monthStr = `${y}-${String(monthNum).padStart(2, '0')}`;
        const totals = getMonthFinancialTotals(monthStr);

        semIncome += totals.totalIncome;
        semCashActual += totals.totalCash;
        semCard += totals.totalCardConsolidated;
        semFixed += totals.totalFixed;
    }

    // Cálculo da Projeção de Gastos À Vista baseada nos 2 meses anteriores ao atual
    const m1Str = getAdjacentMonthStr(targetMonth, -1);
    const m2Str = getAdjacentMonthStr(targetMonth, -2);
    const cashM1 = getMonthFinancialTotals(m1Str).totalCash;
    const cashM2 = getMonthFinancialTotals(m2Str).totalCash;

    const projectedSemCash = ((cashM1 + cashM2) / 2) * 6;

    // Total de gastos semestrais incluindo a projeção à vista
    const semTotalExpenses = projectedSemCash + semCard + semFixed;
    const semBalance = semIncome - semTotalExpenses;

    const titleEl = document.getElementById('semester-panel-title');
    const badgeEl = document.getElementById('semester-period-badge');

    if (titleEl) titleEl.textContent = `Indicadores Consolidados (${semesterName} de ${y})`;
    if (badgeEl) badgeEl.textContent = isFirstSemester ? `Jan - Jun / ${y}` : `Jul - Dez / ${y}`;

    const elIncome = document.getElementById('sem-income-total');
    const elCash = document.getElementById('sem-cash-total');
    const elCashDesc = document.getElementById('sem-cash-desc');
    const elCard = document.getElementById('sem-card-total');
    const elFixed = document.getElementById('sem-fixed-total');
    const elExp = document.getElementById('sem-expense-total');
    const elBal = document.getElementById('sem-balance-total');
    const elBalDesc = document.getElementById('sem-balance-desc');

    if (elIncome) elIncome.textContent = formatBRL(semIncome);
    if (elCash) elCash.textContent = formatBRL(projectedSemCash);
    if (elCashDesc) elCashDesc.textContent = `Proj: (${formatMonthBR(m2Str)} + ${formatMonthBR(m1Str)})/2 \u00D7 6`;
    if (elCard) elCard.textContent = formatBRL(semCard);
    if (elFixed) elFixed.textContent = formatBRL(semFixed);
    if (elExp) elExp.textContent = formatBRL(semTotalExpenses);

    if (elBal) {
        elBal.textContent = formatBRL(semBalance);
        if (semBalance >= 0) {
            elBal.style.color = 'var(--success, #10b981)';
            if (elBalDesc) elBalDesc.innerHTML = `<span style="color: var(--success, #10b981); font-weight:700;">Superávit</span> semestral`;
        } else {
            elBal.style.color = 'var(--danger, #ef4444)';
            if (elBalDesc) elBalDesc.innerHTML = `<span style="color: var(--danger, #ef4444); font-weight:700;">Déficit</span> semestral`;
        }
    }

    return { semIncome, semCash: projectedSemCash, semCashActual, semCard, semFixed, semTotalExpenses, semBalance };
}

function renderDashboard() {
    const targetMonth = financeState.currentMonth;
    const cards = financeState.money.creditCards || [];

    const currTotals = getMonthFinancialTotals(targetMonth);
    const semData = renderSemesterIndicators(targetMonth);
    renderTriMonthOverview(targetMonth);

    const elIncome = document.getElementById('dash-incomes-total');
    const elCash = document.getElementById('dash-cash-total');
    const elCard = document.getElementById('dash-card-total');
    const elFixed = document.getElementById('dash-fixed-total');
    const elBalance = document.getElementById('dash-balance-total');
    const elBalanceDesc = document.getElementById('dash-balance-desc');

    if (elIncome) elIncome.textContent = formatBRL(currTotals.totalIncome);
    if (elCash) elCash.textContent = formatBRL(currTotals.totalCash);
    if (elCard) elCard.textContent = formatBRL(currTotals.totalCardConsolidated);
    if (elFixed) elFixed.textContent = formatBRL(currTotals.totalFixed);

    // Calculo das Médias À Vista
    const [currY, currM] = targetMonth.split('-').map(Number);
    const totalDaysInMonth = new Date(currY, currM, 0).getDate();
    const dailyAvgCash = currTotals.totalCash / totalDaysInMonth;
    const monthlyAvgCash = semData.semCash / 6;

    const elDailyAvg = document.getElementById('dash-cash-daily-avg');
    const elMonthlyAvg = document.getElementById('dash-cash-monthly-avg');

    if (elDailyAvg) elDailyAvg.textContent = `${formatBRL(dailyAvgCash)}/dia`;
    if (elMonthlyAvg) elMonthlyAvg.textContent = `${formatBRL(monthlyAvgCash)}/mês`;

    if (elBalance) {
        elBalance.textContent = formatBRL(currTotals.balance);
        if (currTotals.balance >= 0) {
            elBalance.style.color = 'var(--success, #10b981)';
            if (elBalanceDesc) elBalanceDesc.innerHTML = `<span style="color: var(--success, #10b981); font-weight:700;">Positivo!</span> Sobra projetada.`;
        } else {
            elBalance.style.color = 'var(--danger, #ef4444)';
            if (elBalanceDesc) elBalanceDesc.innerHTML = `<span style="color: var(--danger, #ef4444); font-weight:700;">Alerta!</span> Déficit de ${formatBRL(Math.abs(currTotals.balance))}.`;
        }
    }

    renderCardLimitsDashboard(cards, targetMonth);
    renderCategoryChart(currTotals.cashExpenses, currTotals.allCardInvoiceExpenses);
    renderHistoryChart();
}

function renderCardLimitsDashboard(cards, targetMonth) {
    const container = document.getElementById('fin-dash-limits-container');
    if (!container) return;

    container.innerHTML = '';
    if (cards.length === 0) {
        container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Nenhum cartão cadastrado.</div>';
        return;
    }

    cards.forEach(card => {
        const cardInvoiceItems = getCardExpensesForInvoice(targetMonth, card.id);
        const cardFaturaTotal = cardInvoiceItems.reduce((acc, e) => acc + e.installmentAmount, 0);

        const isInvoicePaid = (card.history && card.history[targetMonth] === true) || (Array.isArray(card.paidMonths) && card.paidMonths.includes(targetMonth));
        const paidBadge = isInvoicePaid ? '<span style="font-size:0.75rem; color:#10b981; font-weight:800;"> (\u2713 Paga)</span>' : '';

        const totalCommitted = getCardTotalCommittedBalance(card.id, targetMonth);
        const limit = Number(card.limit) || 3000;
        const limitUsagePct = Math.min(100, Math.round((totalCommitted / limit) * 100)) || 0;
        const remainingLimit = Math.max(0, limit - totalCommitted);

        let progressColor = '#10b981';
        if (limitUsagePct > 90) progressColor = '#ef4444';
        else if (limitUsagePct > 70) progressColor = '#f59e0b';

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.02); padding: 14px 16px; border-radius: var(--border-radius-md); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px;';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                <span style="font-weight: 700; color: var(--text-primary);">${card.name}${paidBadge}</span>
                <span style="color: #f59e0b; font-weight: 800;" class="val-sensivel">Fatura: ${formatBRL(cardFaturaTotal)}</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="width: ${limitUsagePct}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                <span>Comprometido: <strong class="val-sensivel" style="color: #ef4444;">${formatBRL(totalCommitted)}</strong> / ${formatBRL(limit)}</span>
                <span>Crédito Disp.: <strong class="val-sensivel" style="color: var(--success); font-weight:800;">${formatBRL(remainingLimit)}</strong></span>
            </div>
        `;
        container.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function renderCategoryChartFromFilter() {
    const targetMonth = financeState.currentMonth;
    const currTotals = getMonthFinancialTotals(targetMonth);
    renderCategoryChart(currTotals.cashExpenses, currTotals.allCardInvoiceExpenses);
    if (financeState.hideValues) {
        document.querySelectorAll('.val-sensivel').forEach(el => el.classList.add('value-blur'));
    }
}

function renderCategoryChart(monthExpenses, cardInvoiceExpenses) {
    const ctx = document.getElementById('chart-finance-categories');
    if (!ctx) return;

    const filterVal = document.getElementById('dash-category-filter')?.value || 'ALL';
    const catTotals = {};

    if (filterVal === 'ALL' || filterVal === 'cash') {
        (monthExpenses || []).forEach(e => {
            const cat = getCategoryLabel(e.category);
            catTotals[cat] = (catTotals[cat] || 0) + (Number(e.amount) || 0);
        });
    }

    if (filterVal === 'ALL' || filterVal === 'card') {
        if (Array.isArray(cardInvoiceExpenses)) {
            cardInvoiceExpenses.forEach(e => {
                const cat = getCategoryLabel(e.category);
                catTotals[cat] = (catTotals[cat] || 0) + (Number(e.installmentAmount) || 0);
            });
        }
    }

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const labels = sortedCats.map(item => item[0]);
    const data = sortedCats.map(item => item[1]);
    const totalFilterSum = data.reduce((a, b) => a + b, 0);

    // Renderizar Destaque Top 3
    const top3ListEl = document.getElementById('dash-top3-list');
    if (top3ListEl) {
        top3ListEl.innerHTML = '';
        if (sortedCats.length === 0 || totalFilterSum === 0) {
            top3ListEl.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Nenhum gasto registrado para esta seleção.</div>';
        } else {
            const top3 = sortedCats.slice(0, 3);
            const medals = ['🥇 1º', '🥈 2º', '🥉 3º'];
            const badgeColors = ['#f59e0b', '#94a3b8', '#d97706'];

            top3.forEach(([catName, amount], index) => {
                const pct = totalFilterSum > 0 ? Math.round((amount / totalFilterSum) * 100) : 0;
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem;';
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.85rem;">${medals[index]}</span>
                        <span style="font-weight: 700; color: var(--text-main);">${catName}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--text-muted); font-size: 0.72rem; font-weight: 600;">${pct}% do total</span>
                        <strong class="val-sensivel" style="color: ${badgeColors[index]}; font-weight: 800;">${formatBRL(amount)}</strong>
                    </div>
                `;
                top3ListEl.appendChild(row);
            });
        }
    }

    if (chartCategoriesInstance) {
        chartCategoriesInstance.destroy();
    }

    if (labels.length === 0 || totalFilterSum === 0) {
        ctx.style.display = 'none';
        return;
    }
    ctx.style.display = 'block';

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

    chartCategoriesInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
                }
            }
        }
    });
}

function renderHistoryChart() {
    const ctx = document.getElementById('chart-finance-history');
    if (!ctx) return;

    const [currY, currM] = financeState.currentMonth.split('-').map(Number);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const startMonth = currM <= 6 ? 1 : 7;

    const labels = [];
    const cashData = [];
    const cardData = [];
    const fixedData = [];
    const balanceData = [];

    for (let i = 0; i < 6; i++) {
        const monthNum = startMonth + i;
        const monthStr = `${currY}-${String(monthNum).padStart(2, '0')}`;
        
        labels.push(`${months[monthNum - 1]}/${String(currY).substring(2)}`);

        const totals = getMonthFinancialTotals(monthStr);

        cashData.push(totals.totalCash);
        cardData.push(totals.totalCardConsolidated);
        fixedData.push(totals.totalFixed);
        balanceData.push(totals.balance);
    }

    const titleEl = document.getElementById('chart-semester-title');
    if (titleEl) {
        const semesterLabel = currM <= 6 ? '1º Semestre' : '2º Semestre';
        titleEl.textContent = `Projeção & Saldo Semestral (${semesterLabel} de ${currY})`;
    }

    if (chartHistoryInstance) {
        chartHistoryInstance.destroy();
    }

    chartHistoryInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'À Vista',
                    data: cashData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Crédito',
                    data: cardData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Despesas Fixas',
                    data: fixedData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Saldo Líquido',
                    data: balanceData,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.15)',
                    borderWidth: 3,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } } }
            }
        }
    });
}

function renderExpensesTable() {
    const tbody = document.getElementById('expenses-tbody');
    const emptyMsg = document.getElementById('expenses-empty-msg');
    const totalEl = document.getElementById('cash-table-total');
    if (!tbody) return;

    const month = financeState.currentMonth;
    const search = (document.getElementById('filter-expense-search')?.value || '').toLowerCase();
    const category = document.getElementById('filter-expense-category')?.value || 'ALL';
    const methodFilter = document.getElementById('filter-expense-method')?.value || 'cash';

    let list = financeState.money.expenses.filter(e => (e.date || '').substring(0, 7) === month);

    if (search) {
        list = list.filter(e => {
            const desc = getItemDesc(e).toLowerCase();
            return desc.includes(search);
        });
    }
    if (category !== 'ALL') {
        list = list.filter(e => getCategoryLabel(e.category) === category);
    }
    if (methodFilter !== 'ALL') {
        if (methodFilter === 'card') {
            list = list.filter(e => (e.method || e.paymentMethod) === 'card');
        } else {
            list = list.filter(e => (e.method || e.paymentMethod) !== 'card');
        }
    }

    const grandTotal = list.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    if (totalEl) totalEl.textContent = formatBRL(grandTotal);

    tbody.innerHTML = '';
    if (list.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    list.sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        
        const isCard = (item.method || item.paymentMethod) === 'card';
        const methodBadge = isCard 
            ? `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">Cartão</span>`
            : `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">À Vista</span>`;

        const descText = getItemDesc(item);
        const catText = getCategoryLabel(item.category);

        tr.innerHTML = `
            <td style="padding: 10px; font-size: 0.85rem; color: var(--text-muted);">${formatDateBR(item.date)}</td>
            <td style="padding: 10px; font-size: 0.85rem; font-weight: 600;">${catText}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${descText}</td>
            <td style="padding: 10px;">${methodBadge}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: var(--danger);" class="val-sensivel">${formatBRL(item.amount)}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn-icon btn-sm" onclick="deleteExpense('${item.id}')" title="Excluir" style="background: transparent; border: none; cursor: pointer; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

function deleteExpense(id) {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    financeState.money.expenses = financeState.money.expenses.filter(e => e.id !== id);
    saveFinanceState();
    renderAll();
}

function renderCreditCardView() {
    const sel = document.getElementById('card-selector');
    const tbody = document.getElementById('card-tbody');
    const emptyMsg = document.getElementById('card-empty-msg');
    if (!sel || !tbody) return;

    const cards = financeState.money.creditCards || [];
    const previouslySelectedId = sel.value;

    const currentOptionValues = Array.from(sel.options).map(o => o.value);
    const cardIds = cards.map(c => c.id);

    if (currentOptionValues.join(',') !== cardIds.join(',')) {
        sel.innerHTML = '';
        cards.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            sel.appendChild(opt);
        });
    }

    if (previouslySelectedId && cardIds.includes(previouslySelectedId)) {
        sel.value = previouslySelectedId;
    }

    const activeCardId = sel.value || (cards[0] ? cards[0].id : 'default');
    if (!activeCardId) return;

    const card = cards.find(c => c.id === activeCardId) || cards[0];
    const month = financeState.currentMonth;

    const isInvoicePaid = (card.history && card.history[month] === true) || (Array.isArray(card.paidMonths) && card.paidMonths.includes(month));

    const chkPaid = document.getElementById('card-invoice-paid-checkbox');
    const lblPaid = document.getElementById('card-invoice-paid-label');

    if (chkPaid) chkPaid.checked = isInvoicePaid;
    if (lblPaid) {
        lblPaid.innerHTML = isInvoicePaid 
            ? `<span style="color: var(--success, #10b981); font-weight: 800;">✅ Fatura Paga em ${formatMonthBR(month)}</span>`
            : `Paga neste mês`;
    }

    const list = getCardExpensesForInvoice(month, card.id);
    const faturaTotal = list.reduce((acc, cur) => acc + cur.installmentAmount, 0);

    const totalCommitted = getCardTotalCommittedBalance(card.id, month);

    const limitAvail = Math.max(0, (Number(card.limit) || 0) - totalCommitted);

    const elFatura = document.getElementById('card-fatura-val');
    const elCommitted = document.getElementById('card-committed-val');
    const elLimit = document.getElementById('card-limit-avail');

    if (elFatura) elFatura.textContent = formatBRL(faturaTotal);
    if (elCommitted) elCommitted.textContent = formatBRL(totalCommitted);
    if (elLimit) elLimit.textContent = formatBRL(limitAvail);

    tbody.innerHTML = '';
    if (list.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        const installmentText = item.isFixedExpense ? 'Fixa' : (item.totalInstallments > 1 ? `${item.currentInstallment}/${item.totalInstallments}` : '1/1');
        const descText = getItemDesc(item);
        const catText = getCategoryLabel(item.category);

        tr.innerHTML = `
            <td style="padding: 10px; font-size: 0.85rem; color: var(--text-muted);">${formatDateBR(item.date)}</td>
            <td style="padding: 10px; font-size: 0.85rem; font-weight: 600;">${catText}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${descText}</td>
            <td style="padding: 10px; text-align: center; font-size: 0.8rem; color: #f59e0b;">${installmentText}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #f59e0b;" class="val-sensivel">${formatBRL(item.installmentAmount)}</td>
            <td style="padding: 10px; text-align: center;">
                ${item.isFixedExpense ? '<span style="font-size:0.75rem; color:var(--text-muted);">Fixa</span>' : `
                <button class="btn-icon btn-sm" onclick="deleteExpense('${item.id}')" title="Excluir" style="background: transparent; border: none; cursor: pointer; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

function toggleCardInvoicePaid(isPaid) {
    const sel = document.getElementById('card-selector');
    if (!sel || !sel.value) return;
    const cardId = sel.value;
    const month = financeState.currentMonth;

    const cards = financeState.money.creditCards || [];
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (!card.history) card.history = {};
    card.history[month] = isPaid;

    if (!Array.isArray(card.paidMonths)) card.paidMonths = [];

    if (isPaid) {
        if (!card.paidMonths.includes(month)) card.paidMonths.push(month);
    } else {
        card.paidMonths = card.paidMonths.filter(m => m !== month);
    }

    saveFinanceState();
    renderCreditCardView();
    renderCardLimitsDashboard(cards, month);
}

function renderIncomesTable() {
    const tbody = document.getElementById('income-tbody');
    const emptyMsg = document.getElementById('income-empty-msg');
    const totalEl = document.getElementById('income-total-val');
    if (!tbody) return;

    const month = financeState.currentMonth;
    const list = financeState.money.incomes.filter(i => (i.date || '').substring(0, 7) === month);
    const total = list.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    if (totalEl) totalEl.textContent = formatBRL(total);

    tbody.innerHTML = '';
    if (list.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        const descText = getItemDesc(item);
        const catText = getCategoryLabel(item.category);

        tr.innerHTML = `
            <td style="padding: 10px; font-size: 0.85rem; color: var(--text-muted);">${formatDateBR(item.date)}</td>
            <td style="padding: 10px; font-size: 0.85rem; font-weight: 600;">${catText}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${descText}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: var(--success);" class="val-sensivel">${formatBRL(item.amount)}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn-icon btn-sm" onclick="deleteIncome('${item.id}')" title="Excluir" style="background: transparent; border: none; cursor: pointer; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

function deleteIncome(id) {
    if (!confirm('Deseja realmente excluir esta receita?')) return;
    financeState.money.incomes = financeState.money.incomes.filter(i => i.id !== id);
    saveFinanceState();
    renderAll();
}

function renderFixedExpensesTable() {
    const tbody = document.getElementById('fixed-tbody');
    const emptyMsg = document.getElementById('fixed-empty-msg');
    const counterEl = document.getElementById('fixed-status-counter');
    const totalEl = document.getElementById('fixed-table-total');
    if (!tbody) return;

    const month = financeState.currentMonth;
    const activeList = (financeState.money.fixedExpenses || []).filter(item => isFixedExpenseActiveForMonth(item, month));

    let paidCount = 0;
    let totalMonthAmount = 0;
    let paidAmount = 0;

    tbody.innerHTML = '';
    if (activeList.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (counterEl) counterEl.textContent = '0 de 0 pagas neste mês';
        if (totalEl) totalEl.textContent = formatBRL(0);
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    activeList.forEach(item => {
        const isPaid = (item.history && item.history[month] === true) || (Array.isArray(item.paidMonths) && item.paidMonths.includes(month));
        const monthAmount = getFixedExpenseAmount(item, month);
        totalMonthAmount += monthAmount;

        if (isPaid) {
            paidCount++;
            paidAmount += monthAmount;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        const nameText = item.title || item.name || getItemDesc(item);

        const hasCustomMonthAmount = item.monthlyAmounts && item.monthlyAmounts[month] !== undefined;

        let periodText = 'Contínua';
        if (item.startDate && item.endDate) {
            periodText = `${formatMonthBR(item.startDate)} até ${formatMonthBR(item.endDate)}`;
        } else if (item.startDate) {
            periodText = `Desde ${formatMonthBR(item.startDate)}`;
        } else if (item.endDate) {
            periodText = `Até ${formatMonthBR(item.endDate)}`;
        }

        const customBadge = hasCustomMonthAmount ? `<div style="font-size:0.7rem; color:#f59e0b; font-weight:700;">(Ajustado em ${formatMonthBR(month)})</div>` : '';

        tr.innerHTML = `
            <td style="padding: 10px; text-align: center;">
                <input type="checkbox" ${isPaid ? 'checked' : ''} onchange="toggleFixedPaid('${item.id}', '${month}', this.checked)" style="cursor: pointer; width: 18px; height: 18px;">
            </td>
            <td style="padding: 10px; font-size: 0.85rem; font-weight: 700;">${nameText}</td>
            <td style="padding: 10px; font-size: 0.8rem; color: var(--text-muted);">${periodText}</td>
            <td style="padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 600;">Dia ${item.dueDay || '--'}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: var(--danger);" class="val-sensivel">
                ${formatBRL(monthAmount)}
                ${customBadge}
            </td>
            <td style="padding: 10px; text-align: center;">
                <div style="display: flex; justify-content: center; gap: 6px;">
                    <button class="btn-icon btn-sm" onclick="editFixedExpenseMonth('${item.id}')" title="Editar Valor do Mês / Padrão" style="background: transparent; border: none; cursor: pointer; color: #60a5fa;">
                        <i data-lucide="edit" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn-icon btn-sm" onclick="deleteFixedExpense('${item.id}')" title="Excluir" style="background: transparent; border: none; cursor: pointer; color: #ef4444;">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const pendingAmount = totalMonthAmount - paidAmount;
    if (totalEl) totalEl.textContent = formatBRL(totalMonthAmount);
    if (counterEl) counterEl.textContent = `${paidCount} de ${activeList.length} pagas (${formatBRL(paidAmount)} pago | ${formatBRL(pendingAmount)} pendente)`;

    if (window.lucide) lucide.createIcons();
}

function toggleFixedPaid(id, month, isPaid) {
    const item = financeState.money.fixedExpenses.find(f => f.id === id);
    if (!item) return;

    if (!item.history) item.history = {};
    item.history[month] = isPaid;

    if (!Array.isArray(item.paidMonths)) item.paidMonths = [];

    if (isPaid) {
        if (!item.paidMonths.includes(month)) item.paidMonths.push(month);
    } else {
        item.paidMonths = item.paidMonths.filter(m => m !== month);
    }

    saveFinanceState();
    renderFixedExpensesTable();
}

function deleteFixedExpense(id) {
    if (!confirm('Deseja realmente excluir esta despesa fixa?')) return;
    financeState.money.fixedExpenses = financeState.money.fixedExpenses.filter(f => f.id !== id);
    saveFinanceState();
    renderAll();
}

// Modal Handlers
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function openFinanceTransactionModal() {
    const modal = document.getElementById('modal-finance-transaction');
    if (!modal) return;

    document.getElementById('form-finance-transaction').reset();
    document.getElementById('trans-id').value = '';
    document.getElementById('trans-date').value = new Date().toISOString().substring(0, 10);
    
    setupCategorySelects();
    populateCardSelect();
    toggleTransTypeUI('expense');

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function toggleTransTypeUI(type) {
    const labelExpense = document.getElementById('label-type-expense');
    const labelIncome = document.getElementById('label-type-income');
    const containerPayment = document.getElementById('container-payment-method');
    const containerCard = document.getElementById('container-card-details');

    if (type === 'expense') {
        labelExpense.style.background = 'rgba(239, 68, 68, 0.2)';
        labelExpense.style.borderColor = '#ef4444';
        labelIncome.style.background = 'transparent';
        labelIncome.style.borderColor = 'rgba(255,255,255,0.1)';

        if (containerPayment) containerPayment.style.display = 'block';
    } else {
        labelIncome.style.background = 'rgba(16, 185, 129, 0.2)';
        labelIncome.style.borderColor = '#10b981';
        labelExpense.style.background = 'transparent';
        labelExpense.style.borderColor = 'rgba(255,255,255,0.1)';

        if (containerPayment) containerPayment.style.display = 'none';
        if (containerCard) containerCard.style.display = 'none';
    }
}

function toggleCardOptions(method) {
    const containerCard = document.getElementById('container-card-details');
    if (containerCard) {
        containerCard.style.display = method === 'card' ? 'block' : 'none';
    }
}

function populateCardSelect() {
    const sel = document.getElementById('trans-card-id');
    if (!sel) return;
    sel.innerHTML = '';
    financeState.money.creditCards.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

function saveFinanceTransaction(e) {
    e.preventDefault();
    const type = document.querySelector('input[name="transType"]:checked').value;
    const date = document.getElementById('trans-date').value;
    const amount = Number(document.getElementById('trans-amount').value) || 0;
    const desc = document.getElementById('trans-desc').value;
    const category = document.getElementById('trans-category').value;

    if (type === 'income') {
        financeState.money.incomes.push({
            id: 'inc_' + Date.now(),
            date: date,
            amount: amount,
            desc: desc,
            description: desc,
            source: desc,
            category: category
        });
    } else {
        const method = document.getElementById('trans-method').value;
        const cardId = document.getElementById('trans-card-id').value;
        const installments = Number(document.getElementById('trans-installments').value) || 1;

        financeState.money.expenses.push({
            id: 'exp_' + Date.now(),
            date: date,
            amount: amount,
            desc: desc,
            description: desc,
            obs: desc,
            category: category,
            method: method,
            paymentMethod: method,
            cardId: method === 'card' ? cardId : null,
            creditCardId: method === 'card' ? cardId : null,
            installments: installments,
            installmentAmount: amount / installments
        });
    }

    saveFinanceState();
    closeModal('modal-finance-transaction');
    renderAll();
}

function openCreditCardSettingsModal() {
    const modal = document.getElementById('modal-credit-cards');
    if (!modal) return;
    renderCreditCardsListModal();
    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function renderCreditCardsListModal() {
    const container = document.getElementById('cards-registered-list');
    if (!container) return;
    container.innerHTML = '';

    financeState.money.creditCards.forEach(c => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: var(--border-radius-md); border: 1px solid rgba(255,255,255,0.06);';
        div.innerHTML = `
            <div>
                <strong style="font-size: 0.85rem; color: var(--text-primary);">${c.name}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Limite: ${formatBRL(c.limit)} | Fechamento: dia ${c.closingDay} | Vencimento: dia ${c.dueDay}</div>
            </div>
            <button class="btn-icon btn-sm" onclick="deleteCreditCard('${c.id}')" style="color: #ef4444; background: transparent; border: none; cursor: pointer;"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
        `;
        container.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function saveCreditCard(e) {
    e.preventDefault();
    const name = document.getElementById('card-name').value;
    const limit = Number(document.getElementById('card-limit').value) || 3000;
    const closing = Number(document.getElementById('card-closing').value) || 5;
    const due = Number(document.getElementById('card-due').value) || 12;

    financeState.money.creditCards.push({
        id: 'card_' + Date.now(),
        name: name,
        limit: limit,
        closingDay: closing,
        dueDay: due
    });

    saveFinanceState();
    document.getElementById('form-card').reset();
    renderCreditCardsListModal();
    renderAll();
}

function deleteCreditCard(id) {
    if (financeState.money.creditCards.length <= 1) {
        alert('Você precisa ter pelo menos um cartão de crédito cadastrado.');
        return;
    }
    if (!confirm('Excluir este cartão de crédito?')) return;
    financeState.money.creditCards = financeState.money.creditCards.filter(c => c.id !== id);
    saveFinanceState();
    renderCreditCardsListModal();
    renderAll();
}

function openFixedExpenseModal(id = null) {
    const modal = document.getElementById('modal-fixed-expense');
    if (!modal) return;

    document.getElementById('fixed-id').value = id || '';
    const titleEl = document.getElementById('fixed-modal-title');
    
    if (id) {
        const item = (financeState.money.fixedExpenses || []).find(f => f.id === id);
        if (item) {
            if (titleEl) titleEl.textContent = `Editar Despesa Fixa (${formatMonthBR(financeState.currentMonth)})`;
            document.getElementById('fixed-name').value = item.name || item.title || '';
            document.getElementById('fixed-amount').value = getFixedExpenseAmount(item, financeState.currentMonth);
            document.getElementById('fixed-due').value = item.dueDay || 10;
            document.getElementById('fixed-scope').value = 'only-current';
            document.getElementById('fixed-start-month').value = item.startDate || '';
            document.getElementById('fixed-end-month').value = item.endDate || '';
        }
    } else {
        if (titleEl) titleEl.textContent = 'Nova Despesa Fixa';
        document.getElementById('fixed-name').value = '';
        document.getElementById('fixed-amount').value = '';
        document.getElementById('fixed-due').value = '10';
        document.getElementById('fixed-scope').value = 'all';
        document.getElementById('fixed-start-month').value = '';
        document.getElementById('fixed-end-month').value = '';
    }

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function editFixedExpenseMonth(id) {
    openFixedExpenseModal(id);
}

function saveFixedExpense(e) {
    e.preventDefault();
    const id = document.getElementById('fixed-id').value;
    const name = document.getElementById('fixed-name').value;
    const amount = Number(document.getElementById('fixed-amount').value) || 0;
    const due = Number(document.getElementById('fixed-due').value) || 10;
    const scope = document.getElementById('fixed-scope').value;
    const startDate = (document.getElementById('fixed-start-month').value || '').trim();
    const endDate = (document.getElementById('fixed-end-month').value || '').trim();
    const currentMonth = financeState.currentMonth;

    if (id) {
        const index = financeState.money.fixedExpenses.findIndex(f => f.id === id);
        if (index !== -1) {
            const item = financeState.money.fixedExpenses[index];
            if (!item.monthlyAmounts) item.monthlyAmounts = {};

            item.name = name;
            item.title = name;
            item.dueDay = due;
            item.startDate = startDate;
            item.endDate = endDate;

            if (scope === 'only-current') {
                item.monthlyAmounts[currentMonth] = amount;
            } else {
                item.amount = amount;
                item.monthlyAmounts[currentMonth] = amount;
            }
        }
    } else {
        const newItem = {
            id: 'fix_' + Date.now(),
            name: name,
            title: name,
            desc: name,
            description: name,
            amount: amount,
            dueDay: due,
            startDate: startDate,
            endDate: endDate,
            paidMonths: [],
            history: {},
            monthlyAmounts: {},
            exceptMonths: {}
        };

        if (scope === 'only-current') {
            newItem.monthlyAmounts[currentMonth] = amount;
        }

        financeState.money.fixedExpenses.push(newItem);
    }

    saveFinanceState();
    closeModal('modal-fixed-expense');
    renderAll();
}

function openTimeFliesImportModal() {
    const modal = document.getElementById('modal-import-timeflies');
    if (modal) modal.style.display = 'flex';
}

function executeTimeFliesImport() {
    const fileInput = document.getElementById('import-file-input');
    const passwordInput = document.getElementById('import-password-input');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecione um arquivo JSON de backup.');
        return;
    }

    const enteredPassword = passwordInput ? String(passwordInput.value).trim() : '';

    if (!enteredPassword) {
        alert('🔒 Senha de Autorização Obrigatória: Por favor, digite sua senha de acesso/descriptografia para autorizar a importação.');
        if (passwordInput) passwordInput.focus();
        return;
    }

    const sec = financeState.security || {};
    const currentMasterPass = String(sec.password || '').trim();

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const rawContent = e.target.result;
            let json = JSON.parse(rawContent);

            let isEncrypted = json.encrypted === true || 
                              json.version === 'timeflies-v3-backup' || 
                              json.version === 'moneyflies-v1-encrypted-backup' || 
                              (typeof json.payload === 'string');

            if (isEncrypted) {
                try {
                    const decryptedBytes = CryptoJS.AES.decrypt(json.payload, enteredPassword);
                    const decryptedStr = decryptedBytes.toString(CryptoJS.enc.Utf8);
                    if (!decryptedStr) {
                        throw new Error('Senha incorreta.');
                    }
                    json = JSON.parse(decryptedStr);
                } catch (err) {
                    alert('⚠️ Autenticação de Segurança Falhou: Senha de descriptografia incorreta ou arquivo de backup inválido.');
                    if (passwordInput) {
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                    return;
                }
            } else {
                if (currentMasterPass && enteredPassword !== currentMasterPass) {
                    alert('⚠️ Acesso Negado: A senha informada não coincide com a sua senha de acesso mestre do MoneyFlies.');
                    if (passwordInput) {
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                    return;
                }
            }

            let extractedMoney = null;
            if (json.money) {
                extractedMoney = json.money;
            } else if (json.payload && json.payload.money) {
                extractedMoney = json.payload.money;
            } else if (json.finances) {
                extractedMoney = json.finances;
            } else if (json.payload && json.payload.finances) {
                extractedMoney = json.payload.finances;
            } else if (json.expenses || json.incomes || json.creditCards) {
                extractedMoney = json;
            }

            if (!extractedMoney) {
                alert('Não foi possível localizar dados financeiros válidos neste arquivo de backup.');
                return;
            }

            financeState.money = sanitizeMoneyObj(extractedMoney);
            
            if (json.security && json.security.password) {
                financeState.security = json.security;
            }

            await saveFinanceState();
            
            const cardCount = (financeState.money.creditCards || []).length;
            const expCount = (financeState.money.expenses || []).length;
            const catCount = (financeState.money.categories || []).length;
            alert(`🎉 Importação Autorizada & Concluída! Restaurados ${expCount} lançamentos, ${cardCount} cartão(ões) e ${catCount} categorias com total segurança.`);
            
            if (passwordInput) passwordInput.value = '';
            closeModal('modal-import-timeflies');
            setupCategorySelects();
            renderAll();

        } catch (err) {
            alert('Erro ao processar arquivo de backup: ' + err.message);
        }
    };

    reader.readAsText(file);
}

function exportMoneyFliesBackup() {
    const sec = financeState.security || {};
    const masterPassword = String(sec.password || '').trim();

    if (!masterPassword) {
        alert('⚠️ Cadastre uma senha de acesso nas configurações antes de exportar um backup criptografado.');
        return;
    }

    const rawPayload = {
        version: 'moneyflies-v1-finance-export',
        exportedAt: new Date().toISOString(),
        security: financeState.security,
        money: financeState.money
    };

    const encryptedString = CryptoJS.AES.encrypt(JSON.stringify(rawPayload), masterPassword).toString();

    const encryptedContainer = {
        version: 'moneyflies-v1-encrypted-backup',
        exportedAt: new Date().toISOString(),
        encrypted: true,
        payload: encryptedString
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(encryptedContainer, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().substring(0, 10);
    downloadAnchor.setAttribute("download", `moneyflies_finance_backup_secure_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function resetMoneyFliesData() {
    if (!confirm('ATENÇÃO: Deseja apagar TODOS os seus dados de finanças? Esta ação não pode ser desfeita.')) return;
    localStorage.removeItem('moneyflies_state');
    sessionStorage.removeItem('moneyflies_auth');
    financeState.money = sanitizeMoneyObj({});
    saveFinanceState();
    renderAll();
    alert('Dados de finanças resetados.');
}

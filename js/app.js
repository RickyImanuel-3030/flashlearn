/**
 * FlashLearn HTML - Main Application Controller
 * Handles routing, navigation, offline state, and LocalStorage data
 */
const App = {
    currentPage: 'home',
    currentUser: null,
    pageHistory: [],
    pendingNavigation: null,

    // ── Initialization ──
    init() {
        // Init splash animation
        SplashPage.init();

        // Init Audio Manager (Procedural Web Audio BGM & SFX)
        if (typeof AudioManager !== 'undefined') {
            AudioManager.init();
            // Mulai musik langsung dari splash screen dengan transisi lembut
            AudioManager.startBGM(true);
        }

        // Migrasi data akun/guest sebelumnya ke penyimpanan localStorage standar
        this.migrateLegacyData();

        // Tampilkan splash screen sejenak, lalu mulai aplikasi
        setTimeout(() => {
            this.startApp();
            SplashPage.hide();
        }, 1800);

        // Setup event listeners
        this.setupNavigation();
        this.setupBackButton();
        this.setupQuizExitDialog();
        this.setupStudyPrompt();
        this.setupSettingsModals();
        this.setupModalAccessibility();
        window.addEventListener('resize', () => this.positionNavPill());
    },

    startApp() {
        // Pulihkan halaman terakhir yang sedang dibuka sebelum reload,
        // jika belum ada maka arahkan ke 'home'.
        const savedRoute = this.getSavedRoute();
        if (savedRoute && savedRoute.page) {
            this.navigate(savedRoute.page, savedRoute.params);
        } else {
            this.navigate('home');
        }
    },

    // ── Navigation ──
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === this.currentPage) return;
                if (this.isQuizInProgress() && page !== 'quiz') {
                    this.showQuizExitDialog(page);
                    return;
                }
                if (page === 'quiz') {
                    try {
                        sessionStorage.removeItem('flashlearn_quiz_last_result');
                    } catch (e) {}
                }
                this.navigate(page);
            });
        });
    },

    isQuizInProgress() {
        return this.currentPage === 'quiz' && QuizPage.sessionActive;
    },

    setupQuizExitDialog() {
        const modal = document.getElementById('quiz-exit-modal');
        const stayButton = document.getElementById('stay-in-quiz-btn');
        const leaveButton = document.getElementById('leave-quiz-btn');

        if (stayButton) stayButton.addEventListener('click', () => this.hideQuizExitDialog());
        if (leaveButton) {
            leaveButton.addEventListener('click', () => {
                const destination = this.pendingNavigation;
                this.hideQuizExitDialog();
                if (typeof QuizPage !== 'undefined') {
                    QuizPage.clearActiveSession();
                }
                if (destination) this.navigate(destination);
            });
        }
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) this.hideQuizExitDialog();
            });
        }
    },

    showQuizExitDialog(destination) {
        const modal = document.getElementById('quiz-exit-modal');
        if (!modal) return;
        this.pendingNavigation = destination;
        modal.classList.remove('hidden');
        this.manageModalFocus(modal, true, '#stay-in-quiz-btn');
    },

    hideQuizExitDialog() {
        const modal = document.getElementById('quiz-exit-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.manageModalFocus(modal, false);
        }
        this.pendingNavigation = null;
    },

    setupStudyPrompt() {
        const modal = document.getElementById('study-prompt-modal');
        const continueButton = document.getElementById('study-prompt-continue');
        const reviewButton = document.getElementById('study-prompt-review');

        if (continueButton) continueButton.addEventListener('click', () => this.hideStudyPrompt());
        if (reviewButton) {
            reviewButton.addEventListener('click', () => {
                this.hideStudyPrompt();
                if (typeof QuizPage !== 'undefined') {
                    QuizPage.clearActiveSession();
                }
                this.navigate('flashlearn');
            });
        }
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) this.hideStudyPrompt();
            });
        }
    },

    showStudyPrompt() {
        const modal = document.getElementById('study-prompt-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.manageModalFocus(modal, true, '#study-prompt-review');
    },

    hideStudyPrompt() {
        const modal = document.getElementById('study-prompt-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.manageModalFocus(modal, false);
        }
    },

    // ── Settings & Reset Progress Modals ──
    setupSettingsModals() {
        const settingsModal = document.getElementById('settings-modal');
        const resetModal = document.getElementById('reset-confirm-modal');

        if (settingsModal) {
            settingsModal.addEventListener('click', (event) => {
                if (event.target === settingsModal) this.hideSettingsModal();
            });
        }

        if (resetModal) {
            resetModal.addEventListener('click', (event) => {
                if (event.target === resetModal) this.hideResetConfirmModal();
            });
        }
    },

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        // Sync toggle states
        const bgmCheck = document.getElementById('toggle-bgm');
        const sfxCheck = document.getElementById('toggle-sfx');
        if (bgmCheck && typeof AudioManager !== 'undefined') bgmCheck.checked = AudioManager.bgmEnabled;
        if (sfxCheck && typeof AudioManager !== 'undefined') sfxCheck.checked = AudioManager.sfxEnabled;

        modal.classList.remove('hidden');
        this.manageModalFocus(modal, true, '#trigger-reset-progress-btn');
    },

    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.manageModalFocus(modal, false);
        }
    },

    showResetConfirmModal() {
        const modal = document.getElementById('reset-confirm-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.manageModalFocus(modal, true, '#cancel-reset-btn');
    },

    hideResetConfirmModal() {
        const modal = document.getElementById('reset-confirm-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.manageModalFocus(modal, false);
        }
    },

    confirmResetProgress() {
        this.hideResetConfirmModal();
        this.hideSettingsModal();
        this.resetAllProgress();
    },

    // ── Route & State Persistence ──
    saveActiveRoute(page, params = null) {
        try {
            sessionStorage.setItem('flashlearn_active_route', JSON.stringify({ page, params }));
        } catch (e) {}
    },

    getSavedRoute() {
        try {
            const raw = sessionStorage.getItem('flashlearn_active_route');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    },

    clearSavedRoute() {
        try {
            sessionStorage.removeItem('flashlearn_active_route');
        } catch (e) {}
    },

    navigate(page, params = null) {
        // Push to history if navigating away from a main page to sub-page
        if (page === 'flashcard' && this.currentPage !== 'flashcard') {
            this.pageHistory.push(this.currentPage);
        }

        this.currentPage = page;
        this.saveActiveRoute(page, params);

        if (page !== 'quiz' || (params && params.quizView !== 'result')) {
            try {
                sessionStorage.removeItem('flashlearn_quiz_last_result');
            } catch (e) {}
        }

        this.renderPage(page, params);
        this.updateNav(page);
        this.updateHeader(page, params);

        // Scroll to top
        const container = document.getElementById('page-container');
        if (container) container.scrollTop = 0;
    },

    goBack() {
        const prevPage = this.pageHistory.pop() || 'flashlearn';
        this.navigate(prevPage);
    },

    renderPage(page, params = null) {
        const container = document.getElementById('page-container');
        if (!container) return;

        let html = '';
        switch (page) {
            case 'home':
                html = HomePage.render();
                break;
            case 'flashlearn':
                html = FlashLearnPage.render();
                break;
            case 'flashcard':
                html = FlashcardPage.render(params);
                break;
            case 'quiz':
                if (params && (params.quizView === 'result' || params.quizView === 'exercise')) {
                    html = '';
                } else {
                    html = QuizPage.render();
                }
                break;
            default:
                html = HomePage.render();
        }

        container.innerHTML = `
            <div class="code-watermarks" aria-hidden="true">
                <span>&lt; &gt;</span>
                <span>{ }</span>
                <span>&lt;/&gt;</span>
                <span>&lt;/&gt;</span>
                <span>{ }</span>
            </div>
            ${html}`;

        if (page === 'quiz') {
            if (params && params.quizView === 'result') {
                QuizPage.restoreResults(params);
            } else if (params && params.quizView === 'exercise') {
                QuizPage.restoreExercise(params);
            }
        } else if (page === 'flashcard') {
            FlashcardPage.bindEvents();
        }
    },

    updateNav(page) {
        const navItems = document.querySelectorAll('.nav-item');

        // Map sub-pages to their parent nav item
        let activeNav = page;
        if (page === 'flashcard') activeNav = 'flashlearn';

        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === activeNav);
        });

        // Show/hide bottom nav
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.classList.remove('hidden');
            bottomNav.dataset.active = activeNav;
            requestAnimationFrame(() => this.positionNavPill());
        }
    },

    positionNavPill() {
        const bottomNav = document.getElementById('bottom-nav');
        const activeItem = bottomNav?.querySelector('.nav-item.active');
        const pill = document.getElementById('nav-active-pill');
        if (!bottomNav || !activeItem || !pill) return;

        const navBounds = bottomNav.getBoundingClientRect();
        const itemBounds = activeItem.getBoundingClientRect();
        pill.style.width = `${itemBounds.width}px`;
        pill.style.transform = `translateX(${itemBounds.left - navBounds.left}px)`;
    },

    updateHeader(page, params = null) {
        const titleEl = document.getElementById('header-title');
        const subtitleEl = document.getElementById('header-subtitle');
        const iconEl = document.getElementById('header-page-icon');
        const backBtn = document.getElementById('header-back-btn');
        const header = document.getElementById('app-header');
        const titleGroup = document.querySelector('.header-title-group');

        const titles = {
            'home': { title: 'FlashLearn', subtitle: 'HTML Dasar', icon: 'home' },
            'flashlearn': { title: 'Materi', subtitle: `${FlashLearnData.topics.length} Topik HTML`, icon: 'auto_stories' },
            'quiz': { title: 'Latihan', subtitle: 'Soal Interaktif', icon: 'quiz' },
            'flashcard': { title: 'Flashcards', subtitle: '', icon: 'style' }
        };

        // Get topic name for flashcard page
        if (page === 'flashcard' && params) {
            const topicId = typeof params === 'object' ? params.topicId : params;
            const topic = FlashLearnData.getTopicById(topicId);
            if (topic) {
                titles.flashcard.title = topic.name;
                titles.flashcard.subtitle = '';
                titles.flashcard.icon = topic.icon;
            }
        }

        const config = titles[page] || titles.home;

        const applyContent = () => {
            if (titleEl) titleEl.textContent = config.title;
            if (subtitleEl) subtitleEl.textContent = config.subtitle;
            if (iconEl) iconEl.textContent = config.icon;
            if (header) header.dataset.page = page;
        };

        // Smooth transition animation when changing pages
        if (titleGroup && (titleEl?.textContent !== config.title || subtitleEl?.textContent !== config.subtitle)) {
            titleGroup.classList.add('transitioning');
            setTimeout(() => {
                applyContent();
                titleGroup.classList.remove('transitioning');
            }, 120);
        } else {
            applyContent();
        }

        // Show back button on sub-pages
        if (backBtn) {
            backBtn.classList.toggle('hidden', page !== 'flashcard');
        }
    },

    setupBackButton() {
        const backBtn = document.getElementById('header-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    },

    // ── Accessibility & Focus Management ──
    lastFocusedElement: null,

    setupModalAccessibility() {
        document.addEventListener('keydown', (e) => {
            const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
            if (!activeModal) return;

            // 1. Close active modal with Escape key
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                if (activeModal.id === 'reset-confirm-modal') {
                    this.hideResetConfirmModal();
                } else if (activeModal.id === 'settings-modal') {
                    this.hideSettingsModal();
                } else if (activeModal.id === 'quiz-exit-modal') {
                    this.hideQuizExitDialog();
                } else if (activeModal.id === 'study-prompt-modal') {
                    this.hideStudyPrompt();
                } else if (activeModal.id === 'empty-result-modal') {
                    if (typeof QuizPage !== 'undefined' && QuizPage.hideEmptyResultModal) {
                        QuizPage.hideEmptyResultModal();
                    } else {
                        activeModal.classList.add('hidden');
                    }
                }
                return;
            }

            // 2. Focus Trap inside open modal (Tab & Shift+Tab)
            if (e.key === 'Tab') {
                const focusables = Array.from(activeModal.querySelectorAll(
                    'button:not([disabled]):not([aria-hidden="true"]), ' +
                    'input:not([disabled]):not([type="hidden"]), ' +
                    'select:not([disabled]), textarea:not([disabled]), ' +
                    '[href], [tabindex]:not([tabindex="-1"])'
                )).filter(el => el.offsetParent !== null);

                if (focusables.length === 0) return;

                const firstEl = focusables[0];
                const lastEl = focusables[focusables.length - 1];

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstEl || !activeModal.contains(document.activeElement)) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastEl || !activeModal.contains(document.activeElement)) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        });
    },

    manageModalFocus(modal, isOpening, defaultFocusSelector = null) {
        if (!modal) return;
        if (isOpening) {
            this.lastFocusedElement = document.activeElement;
            setTimeout(() => {
                const target = defaultFocusSelector ? modal.querySelector(defaultFocusSelector) : null;
                if (target && typeof target.focus === 'function') {
                    target.focus();
                } else {
                    const first = modal.querySelector('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
                    if (first && typeof first.focus === 'function') first.focus();
                }
            }, 50);
        } else {
            if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
                try { this.lastFocusedElement.focus(); } catch (err) {}
                this.lastFocusedElement = null;
            }
        }
    },

    // ── LocalStorage Data Migration ──
    migrateLegacyData() {
        try {
            // 1. Migrasi skor lama ke 'flashlearn_scores'
            let currentScores = [];
            const rawScores = localStorage.getItem('flashlearn_scores');
            if (rawScores) {
                try {
                    const parsed = JSON.parse(rawScores);
                    if (Array.isArray(parsed)) currentScores = parsed;
                } catch (e) {}
            }

            if (currentScores.length === 0) {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('flashlearn_scores_') || key === 'flashlearn_scores_guest')) {
                        try {
                            const legacy = JSON.parse(localStorage.getItem(key) || '[]');
                            if (Array.isArray(legacy) && legacy.length > 0) {
                                currentScores = [...currentScores, ...legacy];
                            }
                        } catch (e) {}
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                if (currentScores.length > 0) {
                    localStorage.setItem('flashlearn_scores', JSON.stringify(currentScores));
                }
            } else {
                // Hapus key lama jika sudah ada skor utama
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('flashlearn_scores_') || key === 'flashlearn_scores_guest')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            }

            // 2. Migrasi kartu yang dipelajari ke 'flashlearn_studied_cards'
            let currentCards = [];
            const rawCards = localStorage.getItem('flashlearn_studied_cards');
            if (rawCards) {
                try {
                    const parsed = JSON.parse(rawCards);
                    if (Array.isArray(parsed)) currentCards = parsed;
                } catch (e) {}
            }

            if (currentCards.length === 0) {
                const cardSet = new Set();
                const cardKeysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('flashlearn_studied_cards_') || key === 'flashlearn_studied_cards_guest')) {
                        try {
                            const legacy = JSON.parse(localStorage.getItem(key) || '[]');
                            if (Array.isArray(legacy)) {
                                legacy.forEach(c => cardSet.add(c));
                            }
                        } catch (e) {}
                        cardKeysToRemove.push(key);
                    }
                }
                cardKeysToRemove.forEach(k => localStorage.removeItem(k));
                if (cardSet.size > 0) {
                    localStorage.setItem('flashlearn_studied_cards', JSON.stringify([...cardSet]));
                }
            } else {
                // Hapus key lama jika sudah ada kartu utama
                const cardKeysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('flashlearn_studied_cards_') || key === 'flashlearn_studied_cards_guest')) {
                        cardKeysToRemove.push(key);
                    }
                }
                cardKeysToRemove.forEach(k => localStorage.removeItem(k));
            }

            // 3. Bersihkan data auth lama
            localStorage.removeItem('flashlearn_user');
            sessionStorage.removeItem('flashlearn_guest_session');
        } catch (e) {
            console.warn('Migrasi data lokal:', e);
        }
    },

    // ── Score & Progress Management (Offline LocalStorage) ──
    saveScore(percent, rawScore = null, total = null) {
        const calcScore = rawScore !== null ? rawScore : Math.round((percent / 100) * (total || 100));
        const calcTotal = total !== null ? total : 100;

        // Simpan langsung ke LocalStorage (PWA offline & statis)
        const scores = this.getScores();
        scores.push({
            score: calcScore,
            rawScore: calcScore,
            accuracy: percent,
            total: calcTotal,
            scoringVersion: 2,
            date: new Date().toISOString()
        });
        try {
            localStorage.setItem('flashlearn_scores', JSON.stringify(scores));
        } catch (e) {
            console.error('Gagal menyimpan skor ke localStorage:', e);
        }
    },

    getScores() {
        try {
            const saved = localStorage.getItem('flashlearn_scores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },

    getBestScore() {
        const record = this.getBestScoreRecord();
        if (!record) return null;
        return record.rawScore !== undefined && record.rawScore !== null ? record.rawScore : record.score;
    },

    getBestScoreRecord() {
        const scores = this.getScores().filter(score => score.scoringVersion === 2 || typeof score.score === 'number');
        if (scores.length === 0) return null;
        return scores.reduce((best, cur) => {
            const curVal = cur.rawScore !== undefined && cur.rawScore !== null ? cur.rawScore : cur.score;
            const bestVal = best.rawScore !== undefined && best.rawScore !== null ? best.rawScore : best.score;
            return curVal > bestVal ? cur : best;
        }, scores[0]);
    },

    getStudiedCards() {
        try {
            const cards = JSON.parse(localStorage.getItem('flashlearn_studied_cards') || '[]');
            return Array.isArray(cards) ? cards : [];
        } catch (e) {
            return [];
        }
    },

    getCompletedTopics() {
        try {
            const list = JSON.parse(localStorage.getItem('flashlearn_completed_topics') || '[]');
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    },

    isTopicCompleted(topicId) {
        if (!topicId) return false;
        if (typeof FlashLearnData !== 'undefined') {
            const topic = FlashLearnData.getTopicById(topicId);
            if (topic && topic.cards && topic.cards.length > 0) {
                const studiedSet = new Set(this.getStudiedCards());
                // Wajib SEMUA kartu sudah di-flip (tercatat di flashlearn_studied_cards)
                return topic.cards.every((_, idx) => studiedSet.has(`${topicId}-${idx}`));
            }
        }
        return false;
    },

    markTopicCompleted(topicId) {
        if (!topicId) return false;
        if (!this.isTopicCompleted(topicId)) return false;

        const completed = this.getCompletedTopics();
        if (!completed.includes(topicId)) {
            completed.push(topicId);
            try {
                localStorage.setItem('flashlearn_completed_topics', JSON.stringify(completed));
            } catch (e) {
                console.error('Gagal menyimpan completed topic:', e);
            }
        }
        return true;
    },

    markCardStudied(topicId, cardIndex) {
        this.saveLastStudiedCard(topicId, cardIndex);
        const cardId = `${topicId}-${cardIndex}`;
        const studiedCards = this.getStudiedCards();
        if (!studiedCards.includes(cardId)) {
            studiedCards.push(cardId);
            try {
                localStorage.setItem('flashlearn_studied_cards', JSON.stringify(studiedCards));
            } catch (e) {
                console.error('Gagal menyimpan kartu ke localStorage:', e);
            }
        }

        if (this.isTopicCompleted(topicId)) {
            this.markTopicCompleted(topicId);
        }
    },

    saveLastStudiedCard(topicId, cardIndex) {
        if (!topicId) return;
        const safeIndex = Math.max(0, Number(cardIndex) || 0);
        try {
            localStorage.setItem('flashlearn_last_studied', JSON.stringify({
                topicId,
                cardIndex: safeIndex,
                updatedAt: Date.now()
            }));
        } catch (e) {}
    },

    getLastStudiedCard() {
        try {
            const raw = localStorage.getItem('flashlearn_last_studied');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.topicId && FlashLearnData.getTopicById(parsed.topicId)) {
                    const topic = FlashLearnData.getTopicById(parsed.topicId);
                    const safeIndex = Math.min(Math.max(0, Number(parsed.cardIndex) || 0), topic.cards.length - 1);
                    return { topicId: parsed.topicId, cardIndex: safeIndex };
                }
            }
        } catch (e) {}

        // Fallback ke kartu terakhir pada daftar kartu yang sudah dipelajari
        const studied = this.getStudiedCards();
        if (studied.length > 0) {
            const lastEntry = studied[studied.length - 1];
            const dashIdx = lastEntry.lastIndexOf('-');
            if (dashIdx > 0) {
                const topicId = lastEntry.slice(0, dashIdx);
                const cardIndex = Number(lastEntry.slice(dashIdx + 1)) || 0;
                const topic = FlashLearnData.getTopicById(topicId);
                if (topic) {
                    return {
                        topicId,
                        cardIndex: Math.min(Math.max(0, cardIndex), topic.cards.length - 1)
                    };
                }
            }
        }
        return null;
    },

    resetAllProgress() {
        try {
            // Hapus semua key progres aktif
            localStorage.removeItem('flashlearn_studied_cards');
            localStorage.removeItem('flashlearn_last_studied');
            localStorage.removeItem('flashlearn_scores');
            localStorage.removeItem('flashlearn_active_route');
            localStorage.removeItem('flashlearn_user');

            // Hapus juga sisa key legacy/guest lama agar tidak termigrasi kembali saat reload
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('flashlearn_scores_') ||
                    key.startsWith('flashlearn_studied_cards_') ||
                    key === 'flashlearn_guest_session'
                )) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Bersihkan sesi pengerjaan saat ini
            sessionStorage.removeItem('flashlearn_quiz_last_result');
            sessionStorage.removeItem('flashlearn_guest_session');
            sessionStorage.removeItem('flashlearn_active_route');
        } catch (e) {
            console.error('Error saat mereset progres:', e);
        }

        this.renderPage(this.currentPage);
        this.showToast('Data progres telah direset.');
    },

    // ── Toast Notification ──
    toastTimeout: null,
    showToast(message, type = 'success', sound = 'toast') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMessage) return;

        if (typeof AudioManager !== 'undefined' && sound) {
            AudioManager.play(sound);
        }

        toastMessage.textContent = message;
        toast.classList.remove('hidden', 'error', 'warning');

        if (type === 'error') {
            toast.classList.add('error');
            if (toastIcon) toastIcon.textContent = 'warning';
        } else if (type === 'warning') {
            toast.classList.add('warning');
            if (toastIcon) toastIcon.textContent = 'warning_amber';
        } else {
            if (toastIcon) toastIcon.textContent = 'check_circle';
        }

        // Show
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto hide with timer clear on rapid clicks
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3200);
    }
};

// ── Start the Application ──
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

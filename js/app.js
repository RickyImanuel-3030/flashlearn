/**
 * FlashLearn HTML - Main Application Controller
 * Handles routing, navigation, authentication, and global state
 */
const App = {
    currentPage: 'home',
    currentUser: null,
    guestMode: false,
    pageHistory: [],
    pendingNavigation: null,

    // ── Initialization ──
    init() {
        // Init splash
        SplashPage.init();

        // Load saved user from localStorage
        this.loadUser();

        // Jika belum login dan bukan guest, siapkan auth-gate langsung di balik splash screen
        // agar tidak ada glitch homepage saat splash screen memudar.
        if (!this.currentUser && !this.guestMode) {
            this.showAuthGate();
        }

        // Mulai ambil progres akun terbaru dari database/API di background
        this.loadAccountProgress();

        // Hide splash after delay, then show app or reveal auth gate
        setTimeout(async () => {
            if (this.currentUser || this.guestMode) {
                try {
                    await this.loadAccountProgress();
                } catch (e) {}
                this.startApp();
            }
            SplashPage.hide();
        }, 2400);

        // Setup event listeners
        this.setupNavigation();
        this.setupAuth();
        this.setupBackButton();
        this.setupQuizExitDialog();
        this.setupStudyPrompt();
        this.setupModalAccessibility();
        window.addEventListener('resize', () => this.positionNavPill());
        window.addEventListener('online', () => this.flushPendingProgressSync());
        window.addEventListener('beforeunload', (event) => {
            if (this.guestMode && this.getStudiedCards().length > 0) {
                event.preventDefault();
                event.returnValue = '';
            }
        });
    },

    startApp() {
        this.hideAuthGate();
        this.updateAuthUI();

        // Pulihkan halaman terakhir yang sedang dibuka sebelum reload di semua halaman,
        // jika belum ada maka arahkan ke 'home'.
        const savedRoute = this.getSavedRoute();
        if (savedRoute && savedRoute.page) {
            this.navigate(savedRoute.page, savedRoute.params);
        } else {
            this.navigate('home');
        }
    },

    showAuthGate() {
        document.getElementById('auth-gate')?.classList.remove('hidden');
    },

    hideAuthGate() {
        document.getElementById('auth-gate')?.classList.add('hidden');
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
                QuizPage.sessionActive = false;
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
                QuizPage.sessionActive = false;
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
            // Always show bottom nav
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

    // ── Authentication (Google OAuth simulation) ──
    // Note: For production, you would integrate Google Identity Services
    // For now, we use a mock login that saves to localStorage
    setupAuth() {
        const loginBtn = document.getElementById('login-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalOverlay = document.getElementById('login-modal');
        const guestButton = document.getElementById('guest-login-btn');

        // Modal separate buttons (Masuk & Buat Akun)
        const modalLoginBtn = document.getElementById('modal-login-btn') || document.getElementById('google-login-btn');
        const modalRegisterBtn = document.getElementById('modal-register-btn');
        const modalEmailInput = document.getElementById('login-email-input');
        const modalPasswordInput = document.getElementById('login-password-input');

        const handleModalSubmit = (action) => {
            const email = modalEmailInput?.value.trim();
            const password = modalPasswordInput?.value;
            if (email && password) this.loginWithEmail(email, password, action);
            else this.showToast('Isi email dan password terlebih dahulu.', 'error');
        };

        if (modalLoginBtn) modalLoginBtn.addEventListener('click', () => handleModalSubmit('login'));
        if (modalRegisterBtn) modalRegisterBtn.addEventListener('click', () => handleModalSubmit('register'));

        [modalEmailInput, modalPasswordInput].forEach(input => {
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleModalSubmit('login');
                }
            });
        });

        // Auth Gate separate buttons
        const authLoginBtn = document.getElementById('auth-login-btn');
        const authRegisterBtn = document.getElementById('auth-register-btn');
        const authEmailInput = document.getElementById('auth-email-input');
        const authPasswordInput = document.getElementById('auth-password-input');
        const authForm = document.getElementById('auth-email-form');

        const handleAuthGateSubmit = (action) => {
            const email = authEmailInput?.value.trim();
            const password = authPasswordInput?.value;
            if (email && password) this.loginWithEmail(email, password, action);
            else this.showToast('Isi email dan password terlebih dahulu.', 'error');
        };

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAuthGateSubmit('login');
            });
        }
        if (authLoginBtn) {
            authLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleAuthGateSubmit('login');
            });
        }
        if (authRegisterBtn) {
            authRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleAuthGateSubmit('register');
            });
        }

        if (guestButton) guestButton.addEventListener('click', () => this.continueAsGuest());

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    this.showLogoutConfirm();
                } else {
                    this.showLoginModal();
                }
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideLoginModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.hideLoginModal();
            });
        }

        // Avatar click and keyboard access for logout
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.addEventListener('click', () => this.showLogoutConfirm());
            avatar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showLogoutConfirm();
                }
            });
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
                if (activeModal.id === 'login-modal') {
                    this.hideLoginModal();
                } else if (activeModal.id === 'quiz-exit-modal') {
                    this.hideQuizExitDialog();
                } else if (activeModal.id === 'study-prompt-modal') {
                    this.hideStudyPrompt();
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

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.manageModalFocus(modal, true, '#login-email-input');
    },

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.manageModalFocus(modal, false);
        }
    },

    async loginWithEmail(email, password, action = 'login') {
        try {
            const response = await fetch('api/auth_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, action })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || (action === 'register' ? 'Pendaftaran gagal.' : 'Login gagal.'));

            this.currentUser = data.user;
            this.guestMode = false;
            sessionStorage.removeItem('flashlearn_guest_session');
            localStorage.setItem('flashlearn_user', JSON.stringify(data.user));
            this.updateAuthUI();
            this.hideLoginModal();
            await this.loadAccountProgress();
            this.startApp();
            const welcomeMsg = action === 'register' ? `Akun berhasil dibuat! Halo, ${data.user.name}! 🎉` : `Selamat datang kembali, ${data.user.name}! 👋`;
            this.showToast(welcomeMsg);
        } catch (error) {
            this.showToast(error.message || 'Gagal memproses akun. Periksa koneksi Anda.', 'error');
        }
    },

    mockGoogleLogin(customEmail = null, customName = null) {
        {
            const email = customEmail || prompt('Masukkan email akun:', 'user@gmail.com');
            const password = prompt('Masukkan password akun:', '');
            return this.loginWithEmail(email || '', password || '');
        }

        // User data from prompt or default Google simulation
        const email = (customEmail || prompt('Masukkan email Anda:', 'user@gmail.com') || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
            this.showToast('Masukkan alamat email yang valid.', 'error');
            return;
        }
        const name = customName || (email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        
        const user = {
            name: name,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b35&color=fff&rounded=true&size=128`
        };

        this.currentUser = user;
        this.guestMode = false;
        sessionStorage.removeItem('flashlearn_guest_session');
        localStorage.setItem('flashlearn_user', JSON.stringify(user));
        this.updateAuthUI();
        this.hideLoginModal();
        this.showToast(`Selamat datang, ${name}! 🎉`);

        // Sync with Laragon MySQL database if available
        fetch('api/auth_google.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        }).then(res => res.json())
          .then(data => {
              if (data.success) {
                  console.log('User synced to Laragon MySQL:', data);
              }
          }).catch(err => {
              console.log('Running in offline / static mode (saved locally).');
          });

        this.loadAccountProgress();

        // Refresh home page if currently on it
        if (this.currentPage === 'home') this.startApp();
        else this.hideAuthGate();
    },

    continueAsGuest() {
        this.currentUser = null;
        this.guestMode = true;
        sessionStorage.setItem('flashlearn_guest_session', '1');
        this.startApp();
        this.showToast('Mode guest aktif. Progres hanya berlaku selama sesi ini.');
    },

    showLogoutConfirm() {
        if (confirm('Keluar dari akun? Progres akunmu tetap tersimpan dan dapat dipulihkan saat masuk kembali.')) {
            this.logout();
        }
    },

    logout() {
        fetch('api/logout.php', { method: 'POST' }).catch(() => {});
        this.currentUser = null;
        this.guestMode = false;
        this.clearSavedRoute();
        try {
            sessionStorage.removeItem('flashlearn_quiz_last_result');
        } catch (e) {}
        this.resetLearningProgress();
        localStorage.removeItem('flashlearn_user');
        this.updateAuthUI();
        this.showToast('Berhasil keluar. Progres akun tetap tersimpan.');
        this.showAuthGate();
    },

    resetLearningProgress() {
        // Hapus hanya progres sesi guest/legacy. Progres akun tetap tersimpan
        // pada key berbasis email dan akan dipulihkan saat login kembali.
        localStorage.removeItem(this.getProgressKey('flashlearn_studied_cards'));
        localStorage.removeItem(this.getProgressKey('flashlearn_scores'));
        localStorage.removeItem('flashlearn_studied_cards');
        localStorage.removeItem('flashlearn_scores');
        sessionStorage.removeItem('flashlearn_studied_cards_guest');
        sessionStorage.removeItem('flashlearn_scores_guest');
        sessionStorage.removeItem('flashlearn_guest_session');
    },

    getProgressKey(baseKey) {
        const email = this.currentUser?.email?.trim().toLowerCase();
        return email ? `${baseKey}_${encodeURIComponent(email)}` : `${baseKey}_guest`;
    },

    getProgressStorage() {
        return this.guestMode ? sessionStorage : localStorage;
    },

    getPendingSyncKey() {
        return this.currentUser ? `flashlearn_pending_sync_${encodeURIComponent(this.currentUser.email)}` : null;
    },

    hasPendingProgressSync() {
        const key = this.getPendingSyncKey();
        return Boolean(key && localStorage.getItem(key));
    },

    loadAccountProgress() {
        if (!this.currentUser) return Promise.resolve();
        return fetch(`api/get_progress.php?email=${encodeURIComponent(this.currentUser.email)}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                if (data.found && !this.hasPendingProgressSync()) {
                    localStorage.setItem(this.getProgressKey('flashlearn_studied_cards'), JSON.stringify(data.studied_cards || []));
                    localStorage.setItem(this.getProgressKey('flashlearn_scores'), JSON.stringify(data.scores || []));
                    if (this.currentPage === 'home') {
                        this.renderPage('home');
                    } else if (this.currentPage === 'flashlearn') {
                        this.renderPage('flashlearn');
                    }
                } else {
                    this.syncAccountProgress();
                }
            })
            .catch(() => console.log('Progress server tidak tersedia, menggunakan cache lokal.'));
    },

    syncAccountProgress() {
        if (!this.currentUser) return Promise.resolve();
        const snapshot = {
            email: this.currentUser.email,
            studied_cards: this.getStudiedCards(),
            scores: this.getScores()
        };
        return fetch('api/save_progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshot)
        }).then(response => {
            if (!response.ok) throw new Error('Sync gagal');
            const key = this.getPendingSyncKey();
            if (key) localStorage.removeItem(key);
        }).catch(() => {
            const key = this.getPendingSyncKey();
            if (key) localStorage.setItem(key, JSON.stringify(snapshot));
        });
    },

    flushPendingProgressSync() {
        if (!this.currentUser || !navigator.onLine) return Promise.resolve();
        const key = this.getPendingSyncKey();
        const pending = key ? localStorage.getItem(key) : null;
        if (!pending) return Promise.resolve();
        try {
            const snapshot = JSON.parse(pending);
            return fetch('api/save_progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(snapshot)
            }).then(response => {
                if (!response.ok) throw new Error('Sync gagal');
                localStorage.removeItem(key);
            });
        } catch {
            return Promise.resolve();
        }
    },

    loadUser() {
        const saved = localStorage.getItem('flashlearn_user');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
            } catch (e) {
                localStorage.removeItem('flashlearn_user');
            }
        }
        this.guestMode = !this.currentUser && sessionStorage.getItem('flashlearn_guest_session') === '1';
    },

    updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const avatar = document.getElementById('user-avatar');
        const avatarImg = document.getElementById('user-avatar-img');

        if (this.currentUser) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (avatar) {
                avatar.classList.remove('hidden');
                if (avatarImg) avatarImg.src = this.currentUser.avatar;
            }
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (avatar) avatar.classList.add('hidden');
        }
    },

    // ── Score Management ──
    saveScore(percent, rawScore = null, total = null) {
        const calcScore = rawScore !== null ? rawScore : Math.round((percent / 100) * (total || 5));
        const calcTotal = total !== null ? total : 5;

        // 1. Simpan ke LocalStorage (Offline support PWA)
        const scores = this.getScores();
        scores.push({
            score: percent,
            rawScore: calcScore,
            total: calcTotal,
            scoringVersion: 2,
            date: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.email : 'guest'
        });
        this.getProgressStorage().setItem(this.getProgressKey('flashlearn_scores'), JSON.stringify(scores));
        this.syncAccountProgress();

        // 2. Simpan ke Database Laragon MySQL (via API)
        const payload = {
            score: calcScore,
            total: calcTotal,
            percentage: percent,
            user_email: this.currentUser ? this.currentUser.email : 'guest',
            user_name: this.currentUser ? this.currentUser.name : 'Tamu'
        };

        if (!this.currentUser) return;

        if (!this.currentUser) return;

        fetch('api/save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json())
          .then(data => {
              if (data.success) {
                  this.showToast('Skor tersimpan ke Database Laragon! 💾');
              }
          }).catch(err => {
              console.log('Laragon server not reached, score stored locally.');
          });
    },

    getScores() {
        const saved = this.getProgressStorage().getItem(this.getProgressKey('flashlearn_scores'));
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    },

    getBestScore() {
        const scores = this.getScores().filter(score => score.scoringVersion === 2);
        if (scores.length === 0) return null;
        return Math.max(...scores.map(s => s.score));
    },

    getStudiedCards() {
        try {
            const cards = JSON.parse(this.getProgressStorage().getItem(this.getProgressKey('flashlearn_studied_cards')) || '[]');
            return Array.isArray(cards) ? cards : [];
        } catch (e) {
            return [];
        }
    },

    markCardStudied(topicId, cardIndex) {
        const cardId = `${topicId}-${cardIndex}`;
        const studiedCards = this.getStudiedCards();
        if (studiedCards.includes(cardId)) return;
        studiedCards.push(cardId);
        this.getProgressStorage().setItem(this.getProgressKey('flashlearn_studied_cards'), JSON.stringify(studiedCards));
        this.syncAccountProgress();
    },

    // ── Toast Notification ──
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.classList.remove('hidden', 'error');

        if (type === 'error') {
            toast.classList.add('error');
            if (toastIcon) toastIcon.textContent = 'error';
        } else {
            if (toastIcon) toastIcon.textContent = 'check_circle';
        }

        // Show
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }
};

// ── Start the Application ──
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

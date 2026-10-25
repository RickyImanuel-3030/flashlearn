/**
 * Home Page Module
 */
const HomePage = {
    render() {
        const userName = App.currentUser ? App.currentUser.name.split(' ')[0] : null;
        const greeting = this.getGreeting();
        const bestScore = App.getBestScore();
        const totalCards = FlashLearnData.getTotalCards();
        const studiedCards = Math.min(App.getStudiedCards().length, totalCards);
        const studyPercent = Math.round((studiedCards / totalCards) * 100);

        return `
            <div class="page home-page">
                <div class="home-hero">
                    <img src="assets/logo.png?v=8" alt="FlashLearn Logo" class="home-logo">
                    <div class="home-hero-glow"></div>
                </div>

                ${userName ? `
                    <p class="home-greeting stagger-item" style="animation-delay: 0.1s">
                        ${greeting}, <strong>${userName}</strong>! 👋
                    </p>
                ` : `
                    <p class="home-greeting stagger-item" style="animation-delay: 0.1s">
                        ${greeting}! Siap belajar HTML? 🚀
                    </p>
                `}

                <section class="home-progress-card stagger-item" style="animation-delay: 0.16s" aria-label="Progres belajar">
                    <div class="home-progress-copy">
                        <span class="material-icons-round home-mascot" aria-hidden="true">smart_toy</span>
                        <div>
                            <strong>Progres belajarmu</strong>
                            <span>${studiedCards} dari ${totalCards} kartu telah dipelajari</span>
                        </div>
                        <b>${studyPercent}%</b>
                    </div>
                    <div class="home-progress-track"><div class="home-progress-fill" style="width: ${studyPercent}%"></div></div>
                </section>

                <div class="home-stats stagger-item" style="animation-delay: 0.2s">
                    <div class="stat-card glass-card">
                        <span class="material-icons-round stat-icon">style</span>
                        <div class="stat-value">${totalCards}</div>
                        <div class="stat-label">Flashcards</div>
                    </div>
                    <div class="stat-card glass-card">
                        <span class="material-icons-round stat-icon">emoji_events</span>
                        <div class="stat-value">${bestScore !== null ? bestScore + '%' : '—'}</div>
                        <div class="stat-label">Best Score</div>
                    </div>
                    <div class="stat-card glass-card">
                        <span class="material-icons-round stat-icon">category</span>
                        <div class="stat-value">${FlashLearnData.topics.length}</div>
                        <div class="stat-label">Topik</div>
                    </div>
                </div>

                <div class="home-actions stagger-item" style="animation-delay: 0.3s">
                    <button class="home-action-card home-action-card--learn" type="button" onclick="App.navigate('flashlearn')" aria-label="Flash Learn: Pelajari ${totalCards} kartu HTML">
                        <span class="material-icons-round home-action-icon" aria-hidden="true">auto_stories</span>
                        <span class="home-action-copy">
                            <strong>Flash Learn</strong>
                            <small>Pelajari ${totalCards} kartu HTML</small>
                        </span>
                        <span class="material-icons-round home-action-arrow" aria-hidden="true">chevron_right</span>
                    </button>
                    <button class="home-action-card home-action-card--practice" type="button" onclick="App.navigate('quiz')" aria-label="Latihan: Uji pemahamanmu lewat soal interaktif">
                        <span class="material-icons-round home-action-icon" aria-hidden="true">quiz</span>
                        <span class="home-action-copy">
                            <strong>Latihan</strong>
                            <small>Uji pemahamanmu lewat soal interaktif</small>
                        </span>
                        <span class="material-icons-round home-action-arrow" aria-hidden="true">chevron_right</span>
                    </button>
                </div>
            </div>
        `;
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    }
};

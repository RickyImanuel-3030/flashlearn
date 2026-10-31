/**
 * Home Page Module
 * Features a motivational Bento Grid with dynamic Best Score tiers,
 * smart Continue Learning card, and Topic Mastery tracker.
 */
const HomePage = {
    render() {
        const greeting = this.getGreeting();
        const bestRecord = typeof App.getBestScoreRecord === 'function' ? App.getBestScoreRecord() : null;
        // Skor terbaik murni (bukan persentase akurasi)
        const bestEarnedScore = bestRecord ? (bestRecord.rawScore ?? bestRecord.score) : App.getBestScore();
        // Persentase akurasi untuk penentuan tier penghargaan
        const accuracyPercent = bestRecord ? (bestRecord.accuracy ?? (bestRecord.total ? Math.round((bestEarnedScore / bestRecord.total) * 100) : bestEarnedScore)) : bestEarnedScore;
        const totalCards = FlashLearnData.getTotalCards();
        const studiedList = App.getStudiedCards();
        const studiedCards = Math.min(studiedList.length, totalCards);
        const studyPercent = Math.round((studiedCards / totalCards) * 100);

        const scoreConfig = this.getScoreTierConfig(accuracyPercent, bestEarnedScore);
        const continueConfig = this.getContinueConfig(studiedList, studiedCards, totalCards);
        const masteryConfig = this.getTopicMasteryConfig(studiedList);

        return `
            <div class="page home-page">
                <div class="home-hero">
                    <img src="assets/logo.png?v=8" alt="FlashLearn Logo" class="home-logo">
                    <div class="home-hero-glow"></div>
                </div>

                <p class="home-greeting stagger-item" style="animation-delay: 0.08s">
                    ${greeting}! Siap belajar HTML?
                </p>

                <section class="home-progress-card stagger-item" style="animation-delay: 0.14s" aria-label="Progres belajar">
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

                <!-- Bento Grid Statistik & Aksi Belajar -->
                <div class="home-bento-grid stagger-item" style="animation-delay: 0.2s">
                    <!-- Kolom Kiri (Tinggi Penuh): Skor Terbaik dengan Trophy / Medal Emblem 3D (Konsep 1) -->
                    <button type="button"
                            class="bento-card bento-score-card ${scoreConfig.tierClass}"
                            onclick="App.navigate('quiz')"
                            aria-label="Skor Terbaik: ${scoreConfig.displayValue}. ${scoreConfig.badge}. ${scoreConfig.motivation}">
                        <div class="bento-score-top">
                            <span class="bento-card-label">Skor Terbaik</span>
                        </div>

                        <!-- Trophy / Medal Podium Stage -->
                        <div class="bento-trophy-stage">
                            <div class="bento-trophy-halo" aria-hidden="true"></div>

                            <div class="bento-trophy-emblem trophy-shape--${scoreConfig.shape}" aria-hidden="true">
                                <span class="material-icons-round bento-trophy-icon">${scoreConfig.icon}</span>
                                <div class="bento-trophy-sparkles">
                                    <span class="sparkle-star s1">✦</span>
                                    <span class="sparkle-star s2">★</span>
                                    <span class="sparkle-star s3">✦</span>
                                </div>
                            </div>

                            <div class="trophy-ground-shadow" aria-hidden="true"></div>

                            <div class="bento-trophy-score-box">
                                <span class="bento-trophy-score">${scoreConfig.displayValue}</span>
                            </div>
                        </div>

                        <div class="bento-score-footer">
                            <div class="bento-tier-banner">
                                <span class="material-icons-round" aria-hidden="true">${scoreConfig.badgeIcon}</span>
                                <span>${scoreConfig.badge}</span>
                            </div>
                            <p class="bento-score-motivation">${scoreConfig.motivation}</p>
                        </div>
                    </button>

                    <!-- Kolom Kanan Atas: Lanjutkan Pembelajaran -->
                    <button type="button"
                            class="bento-card bento-continue-card bento-continue--${continueConfig.theme}"
                            onclick="App.navigate('flashcard', { topicId: '${continueConfig.topicId}', cardIndex: ${continueConfig.cardIndex} })"
                            aria-label="${continueConfig.eyebrow}: ${continueConfig.title}. ${continueConfig.narrative}">
                        <div class="bento-continue-header">
                            <span class="bento-continue-pill">
                                <span class="material-icons-round" aria-hidden="true">${continueConfig.pillIcon}</span>
                                ${this.escapeHtml(continueConfig.eyebrow)}
                            </span>
                            <span class="material-icons-round bento-card-arrow" aria-hidden="true">arrow_forward</span>
                        </div>

                        <div class="bento-continue-main">
                            <div class="bento-continue-icon-box" aria-hidden="true">
                                <span class="material-icons-round">${continueConfig.topicIcon}</span>
                            </div>
                            <div class="bento-continue-titles">
                                <strong class="bento-continue-title">${this.escapeHtml(continueConfig.title)}</strong>
                                <span class="bento-continue-sub">${this.escapeHtml(continueConfig.subtitle)}</span>
                            </div>
                        </div>

                        <p class="bento-continue-narrative">${this.escapeHtml(continueConfig.narrative)}</p>
                    </button>

                    <!-- Kolom Kanan Bawah: Penguasaan Topik (Opsi 1) -->
                    <button type="button"
                            class="bento-card bento-mastery-card"
                            onclick="App.navigate('flashlearn')"
                            aria-label="Penguasaan Topik: ${masteryConfig.completedCount} dari ${masteryConfig.totalTopics} topik tuntas. ${masteryConfig.narrative}">
                        <div class="bento-mastery-header">
                            <span class="bento-card-label">Penguasaan Topik</span>
                            <span class="bento-mastery-counter">${masteryConfig.completedCount}/${masteryConfig.totalTopics} Tuntas</span>
                        </div>

                        <div class="bento-mastery-badges" aria-hidden="true">
                            ${masteryConfig.topicsStatus.map(item => `
                                <div class="mastery-topic-dot mastery-dot--${item.theme} ${item.isDone ? 'is-done' : item.isStarted ? 'is-started' : ''}"
                                     title="${this.escapeHtml(item.name)}: ${item.isDone ? 'Tuntas (5/5 kartu)' : item.studiedInTopic + '/' + item.totalInTopic + ' kartu'}">
                                    <span class="material-icons-round mastery-dot-icon">${item.icon}</span>
                                    ${item.isDone ? '<span class="material-icons-round mastery-dot-check">check</span>' : ''}
                                </div>
                            `).join('')}
                        </div>

                        <p class="bento-mastery-narrative">${this.escapeHtml(masteryConfig.narrative)}</p>
                    </button>
                </div>
            </div>
        `;
    },

    getScoreTierConfig(bestScore, earnedScore = null) {
        if (bestScore === null || bestScore === undefined) {
            return {
                tierClass: 'score-tier--none',
                shape: 'none',
                displayValue: '—',
                icon: 'sports_esports',
                tagIcon: 'play_arrow',
                rankTag: 'Mulai Uji',
                badgeIcon: 'flag',
                badge: 'Belum Diuji',
                sparkle: '✦',
                motivation: 'Uji kemampuanmu & raih skor terbaikmu!',
                ctaText: 'Ikuti Kuis'
            };
        }

        const scoreValue = earnedScore !== null && earnedScore !== undefined ? earnedScore : bestScore;

        if (bestScore >= 100) {
            return {
                tierClass: 'score-tier--gold',
                shape: 'gold',
                displayValue: `${scoreValue}`,
                icon: 'emoji_events',
                tagIcon: 'military_tech',
                rankTag: 'Peringkat 1',
                badgeIcon: 'workspace_premium',
                badge: 'Master HTML',
                sparkle: '✦',
                motivation: 'Sempurna! Kamu menaklukkan seluruh kuis HTML!',
                ctaText: 'Pertahankan Rekor'
            };
        }

        if (bestScore >= 80) {
            return {
                tierClass: 'score-tier--silver',
                shape: 'silver',
                displayValue: `${scoreValue}`,
                icon: 'workspace_premium',
                tagIcon: 'military_tech',
                rankTag: 'Skor Tinggi',
                badgeIcon: 'military_tech',
                badge: 'Level Perak',
                sparkle: '★',
                motivation: 'Hebat! Selangkah lagi menuju skor sempurna (100)!',
                ctaText: 'Raih Skor 100'
            };
        }

        if (bestScore >= 60) {
            return {
                tierClass: 'score-tier--bronze',
                shape: 'bronze',
                displayValue: `${scoreValue}`,
                icon: 'local_fire_department',
                tagIcon: 'bolt',
                rankTag: 'Maju Pesat',
                badgeIcon: 'bolt',
                badge: 'Level Perunggu',
                sparkle: '✦',
                motivation: 'Progres mantap! Kamu siap melesat ke Level Perak!',
                ctaText: 'Asah Skor Kuis'
            };
        }

        return {
            tierClass: 'score-tier--starter',
            shape: 'starter',
            displayValue: `${scoreValue}`,
            icon: 'school',
            tagIcon: 'trending_up',
            rankTag: 'Berjuang',
            badgeIcon: 'school',
            badge: 'Pejuang HTML',
            sparkle: '✦',
            motivation: 'Awal yang baik! Pelajari kartunya & pecahkan rekormu!',
            ctaText: 'Coba Lagi'
        };
    },

    getContinueConfig(studiedList, studiedCards, totalCards) {
        const firstTopic = FlashLearnData.topics[0];

        // Kondisi 1: Belum mempelajari kartu apa pun
        if (studiedCards === 0) {
            return {
                topicId: firstTopic.id,
                cardIndex: 0,
                theme: 'orange',
                pillIcon: 'rocket_launch',
                eyebrow: 'Mulai Belajar',
                topicIcon: firstTopic.icon,
                title: firstTopic.name,
                subtitle: `Kartu 01/${String(firstTopic.cards.length).padStart(2, '0')} • ${firstTopic.cards[0].term}`,
                narrative: 'Penasaran bagaimana web dibuat? Ketuk untuk buka kartu pertamamu!'
            };
        }

        const lastStudied = App.getLastStudiedCard() || { topicId: firstTopic.id, cardIndex: 0 };
        const topic = FlashLearnData.getTopicById(lastStudied.topicId) || firstTopic;
        const safeIndex = Math.min(Math.max(0, lastStudied.cardIndex), topic.cards.length - 1);
        const card = topic.cards[safeIndex];
        const cardNumStr = `${String(safeIndex + 1).padStart(2, '0')}/${String(topic.cards.length).padStart(2, '0')}`;

        // Kondisi 3: Seluruh 30 kartu telah dipelajari
        if (studiedCards >= totalCards) {
            return {
                topicId: topic.id,
                cardIndex: safeIndex,
                theme: topic.theme || 'green',
                pillIcon: 'celebration',
                eyebrow: 'Materi Tuntas',
                topicIcon: topic.icon,
                title: topic.name,
                subtitle: `Kartu ${cardNumStr} • ${card.term}`,
                narrative: 'Semua kartu selesai! Ketuk untuk mengulang dari kartu terakhir.'
            };
        }

        // Kondisi 2: Sedang belajar (ada kartu terakhir yang dipelajari + tetap ada narasi motivasi)
        return {
            topicId: topic.id,
            cardIndex: safeIndex,
            theme: topic.theme || 'blue',
            pillIcon: 'play_circle',
            eyebrow: `Lanjut • Kartu ${cardNumStr}`,
            topicIcon: topic.icon,
            title: topic.name,
            subtitle: `Terakhir: ${card.term}`,
            narrative: 'Jangan berhenti di sini! Yuk lanjutkan dari kartu terakhir yang kamu pelajari.'
        };
    },

    getTopicMasteryConfig(studiedList) {
        const studiedSet = new Set(studiedList);
        const topics = FlashLearnData.topics;
        let completedCount = 0;

        const topicsStatus = topics.map(topic => {
            let studiedInTopic = 0;
            for (let i = 0; i < topic.cards.length; i++) {
                if (studiedSet.has(`${topic.id}-${i}`)) {
                    studiedInTopic++;
                }
            }
            const isCompletedInApp = typeof App !== 'undefined' && App.isTopicCompleted && App.isTopicCompleted(topic.id);
            const isDone = isCompletedInApp || studiedInTopic >= topic.cards.length;
            if (isDone) {
                completedCount++;
                studiedInTopic = topic.cards.length;
            }

            return {
                id: topic.id,
                name: topic.name,
                icon: topic.icon,
                theme: topic.theme || 'orange',
                studiedInTopic,
                totalInTopic: topic.cards.length,
                isDone,
                isStarted: isDone || studiedInTopic > 0
            };
        });

        let narrative = 'Kuasai tiap topik untuk menyalakan ke-6 lencana topik HTML!';
        if (completedCount === topics.length) {
            narrative = 'Luar biasa! Ke-6 topik HTML Dasar telah kamu kuasai penuh!';
        } else if (completedCount > 0) {
            const remaining = topics.length - completedCount;
            narrative = `Mantap! Tuntaskan ${remaining} topik lagi untuk menyalakan semua lencana.`;
        }

        return {
            completedCount,
            totalTopics: topics.length,
            topicsStatus,
            narrative
        };
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

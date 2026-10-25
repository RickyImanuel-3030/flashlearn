/**
 * FlashLearn Topics Page Module
 */
const FlashLearnPage = {
    render() {
        const topics = FlashLearnData.topics;

        return `
            <div class="page flashlearn-page">
                <div class="flashlearn-header stagger-item" style="animation-delay: 0.05s">
                    <h2 class="flashlearn-title">Pilih Materi</h2>
                    <p class="flashlearn-desc">Ketuk topik untuk memulai belajar dengan flashcard</p>
                </div>

                ${topics.map((topic, i) => `
                    <div class="topic-card topic-card--${topic.theme || 'orange'} glass-card stagger-item" 
                         style="animation-delay: ${0.1 + i * 0.08}s"
                         onclick="App.navigate('flashcard', '${topic.id}')">
                        <div class="topic-card-content">
                            <div class="topic-info">
                                <div class="topic-icon-wrapper">
                                    <span class="material-icons-round topic-icon">${topic.icon}</span>
                                </div>
                                <div>
                                    <div class="topic-name">${topic.name}</div>
                                    <div class="topic-count">${topic.cards.length} kartu • ${topic.description}</div>
                                </div>
                            </div>
                            <span class="material-icons-round topic-arrow">chevron_right</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

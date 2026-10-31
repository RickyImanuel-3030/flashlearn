/**
 * FlashLearn Topics Page Module
 */
const FlashLearnPage = {
    render() {
        const topics = FlashLearnData.topics;

        return `
            <div class="page flashlearn-page">
                <div class="flashlearn-header stagger-item" style="animation-delay: 0.05s">
                    <h2 class="flashlearn-title">Pilih Topik</h2>
                    <p class="flashlearn-desc">Ketuk topik untuk memulai belajar dengan flashcard</p>
                </div>

                ${topics.map((topic, i) => {
            const isDone = typeof App !== 'undefined' && App.isTopicCompleted && App.isTopicCompleted(topic.id);
            return `
                    <div class="topic-card topic-card--${topic.theme || 'orange'} ${isDone ? 'topic-card--completed' : ''} glass-card stagger-item" 
                         style="animation-delay: ${0.1 + i * 0.08}s"
                         onclick="App.navigate('flashcard', '${topic.id}')">
                        <div class="topic-card-content">
                            <div class="topic-info">
                                <div class="topic-icon-wrapper">
                                    <span class="material-icons-round topic-icon">${topic.icon}</span>
                                </div>
                                <div>
                                    <div class="topic-name">
                                        ${topic.name}
                                        ${isDone ? '<span class="topic-completed-pill"><span class="material-icons-round">check_circle</span>Tuntas</span>' : ''}
                                    </div>
                                    <div class="topic-count">${topic.cards.length} kartu • ${topic.description}</div>
                                </div>
                            </div>
                            <span class="material-icons-round topic-arrow">chevron_right</span>
                        </div>
                    </div>
                `;
        }).join('')}
            </div>
        `;
    }
};

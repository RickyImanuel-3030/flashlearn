/**
 * Flashcard Page Module
 * Handles the interactive flip-card learning experience
 */
const FlashcardPage = {
    currentIndex: 0,
    isFlipped: false,
    currentTopicId: null,
    cards: [],
    isAnimating: false,

    render(params) {
        let topicId = params;
        let cardIndex = 0;
        if (params && typeof params === 'object') {
            topicId = params.topicId;
            cardIndex = Number(params.cardIndex) || 0;
        }

        this.currentTopicId = topicId;
        const topic = FlashLearnData.getTopicById(topicId);
        if (!topic) {
            App.navigate('flashlearn');
            return '<div class="page"><p>Topik tidak ditemukan.</p></div>';
        }

        this.cards = topic.cards;
        this.currentIndex = Math.min(Math.max(0, cardIndex), this.cards.length - 1);
        this.isFlipped = false;
        this.isAnimating = false;

        App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

        return this.buildHTML(topic);
    },

    buildHTML(topic) {
        const card = this.cards[this.currentIndex];
        const progress = ((this.currentIndex + 1) / this.cards.length) * 100;
        const codeExample = this.getCodeExample(card.term);
        const cardNumber = String(this.currentIndex + 1).padStart(2, '0');

        return `
            <div class="page flashcard-page">
                <div class="flashcard-progress stagger-item" style="animation-delay: 0.05s">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="fc-progress" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text" id="fc-counter">${this.currentIndex + 1}/${this.cards.length}</span>
                </div>

                <div class="flashcard-container flashcard-theme--${topic.theme || 'orange'} stagger-item" style="animation-delay: 0.15s" onclick="FlashcardPage.flip()" id="fc-container">
                    <div class="flashcard" id="flashcard">
                        <div class="flashcard-face flashcard-front">
                            <span class="flashcard-card-number" data-card-number>${cardNumber}</span>
                            <div class="flashcard-visual-mark" aria-hidden="true">
                                <span class="material-icons-round">${topic.icon}</span>
                            </div>
                            <span class="flashcard-label">Istilah</span>
                            <div class="flashcard-text" id="fc-front-text">${this.escapeHtml(card.term)}</div>
                            <div class="flashcard-hint">
                                <span class="material-icons-round">touch_app</span>
                                Ketuk untuk membalik
                            </div>
                        </div>
                        <div class="flashcard-face flashcard-back">
                            <span class="flashcard-card-number" data-card-number>${cardNumber}</span>
                            <div class="flashcard-visual-mark" aria-hidden="true">
                                <span class="material-icons-round">lightbulb</span>
                            </div>
                            <span class="flashcard-label">Definisi</span>
                            <div class="flashcard-text" id="fc-back-text">${this.escapeHtml(card.definition)}</div>
                            ${codeExample ? `
                                <div class="flashcard-code-example" id="fc-code-example">
                                    <span class="material-icons-round">code</span>
                                    <code>${this.escapeHtml(codeExample)}</code>
                                </div>
                            ` : ''}
                            <div class="flashcard-hint">
                                <span class="material-icons-round">touch_app</span>
                                Ketuk untuk kembali
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flashcard-nav stagger-item" style="animation-delay: 0.25s">
                    <button class="flashcard-nav-btn" id="fc-prev-btn" onclick="FlashcardPage.prev()" ${this.currentIndex === 0 ? 'disabled' : ''}>
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    <button class="flashcard-nav-btn" id="fc-next-btn" onclick="FlashcardPage.next()" ${this.currentIndex >= this.cards.length - 1 ? 'disabled' : ''}>
                        <span class="material-icons-round">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
    },

    flip() {
        if (this.isAnimating) return;
        this.isFlipped = !this.isFlipped;
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped', this.isFlipped);
        }
        if (this.isFlipped) App.markCardStudied(this.currentTopicId, this.currentIndex);
    },

    next() {
        if (this.isAnimating || this.currentIndex >= this.cards.length - 1) return;
        this.changeCard(this.currentIndex + 1, 'next');
    },

    prev() {
        if (this.isAnimating || this.currentIndex <= 0) return;
        this.changeCard(this.currentIndex - 1, 'prev');
    },

    changeCard(newIndex, direction) {
        const container = document.getElementById('fc-container');
        const flashcard = document.getElementById('flashcard');

        if (!container || !flashcard) {
            this.currentIndex = newIndex;
            this.updateCardContent();
            return;
        }

        this.isAnimating = true;

        // Tentukan arah slide
        const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
        const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

        // 1. Animasi keluar
        container.classList.add(outClass);

        setTimeout(() => {
            // 2. Perbarui konten saat kartu bergeser
            this.currentIndex = newIndex;
            this.isFlipped = false;
            App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });
            App.updateHeader('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

            // Matikan transisi rotasi 3D sesaat agar tidak berputar balik terlihat aneh
            flashcard.style.transition = 'none';
            flashcard.classList.remove('flipped');
            flashcard.offsetHeight; // Force reflow

            this.updateCardContent();

            // 3. Posisikan kartu di sisi berlawanan untuk masuk
            container.classList.remove(outClass);
            container.classList.add(inClass);
            container.offsetHeight; // Force reflow

            // Nyalakan kembali transisi flip 3D
            flashcard.style.transition = '';

            // 4. Masuk dengan mulus ke tengah
            requestAnimationFrame(() => {
                container.classList.remove(inClass);
                setTimeout(() => {
                    this.isAnimating = false;
                }, 220);
            });
        }, 180);
    },

    updateCardContent() {
        const card = this.cards[this.currentIndex];
        const frontText = document.getElementById('fc-front-text');
        const backText = document.getElementById('fc-back-text');
        const progress = document.getElementById('fc-progress');
        const counter = document.getElementById('fc-counter');
        const prevBtn = document.getElementById('fc-prev-btn');
        const nextBtn = document.getElementById('fc-next-btn');
        const codeExample = document.getElementById('fc-code-example');
        const cardNumbers = document.querySelectorAll('[data-card-number]');
        const example = this.getCodeExample(card.term);

        if (frontText) frontText.textContent = card.term;
        if (backText) backText.textContent = card.definition;
        if (progress) progress.style.width = `${((this.currentIndex + 1) / this.cards.length) * 100}%`;
        if (counter) counter.textContent = `${this.currentIndex + 1}/${this.cards.length}`;
        cardNumbers.forEach(number => {
            number.textContent = String(this.currentIndex + 1).padStart(2, '0');
        });
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex >= this.cards.length - 1;
        if (codeExample) {
            codeExample.hidden = !example;
            const code = codeExample.querySelector('code');
            if (code) code.textContent = example;
        }
    },

    getCodeExample(term) {
        const examples = [
            ['<h1>', '<h1>Judul Utama</h1>'], ['<p>', '<p>Ini sebuah paragraf.</p>'],
            ['<strong>', '<strong>Teks penting</strong>'], ['<em>', '<em>Teks ditekankan</em>'],
            ['<br>', 'Baris satu<br>Baris dua'], ['<a>', '<a href="https://example.com">Kunjungi situs</a>'],
            ['href', 'href="https://example.com"'], ['<img>', '<img src="gambar.jpg" alt="Contoh gambar">'],
            ['src', 'src="gambar.jpg"'], ['alt', 'alt="Deskripsi gambar"'], ['<title>', '<title>Halaman Saya</title>'],
            ['<body>', '<body>Konten halaman</body>'], ['<head>', '<head>...</head>'], ['<html>', '<html lang="id">...</html>'],
            ['DOCTYPE', '<!DOCTYPE html>']
        ];
        return examples.find(([key]) => term.includes(key))?.[1] || '';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

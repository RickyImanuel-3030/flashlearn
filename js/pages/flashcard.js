/**
 * Flashcard Page Module
 * Handles the interactive flip-card learning experience with glitch-free 3D Card Stack deck
 * plus a full IDE Code Editor view after the 5th card of each topic.
 */
const FlashcardPage = {
    currentIndex: 0,
    isFlipped: false,
    currentTopicId: null,
    cards: [],
    hasIdeView: false,
    ideTab: 'code',
    isAnimating: false,
    keyboardBound: false,

    isIdeActive() {
        return this.hasIdeView && this.currentIndex >= this.cards.length;
    },

    getMaxIndex() {
        return this.hasIdeView ? this.cards.length : this.cards.length - 1;
    },

    isAllCardsFlipped() {
        if (!this.currentTopicId || !this.cards || this.cards.length === 0) return false;
        const studiedSet = new Set(App.getStudiedCards());
        return this.cards.every((_, idx) => studiedSet.has(`${this.currentTopicId}-${idx}`));
    },

    getUnflippedCount() {
        if (!this.currentTopicId || !this.cards) return 0;
        const studiedSet = new Set(App.getStudiedCards());
        let count = 0;
        for (let idx = 0; idx < this.cards.length; idx++) {
            if (!studiedSet.has(`${this.currentTopicId}-${idx}`)) {
                count++;
            }
        }
        return count;
    },

    getNextTopic() {
        if (!this.currentTopicId || typeof FlashLearnData === 'undefined') return null;
        const currentIdx = FlashLearnData.topics.findIndex(t => t.id === this.currentTopicId);
        if (currentIdx !== -1 && currentIdx < FlashLearnData.topics.length - 1) {
            return FlashLearnData.topics[currentIdx + 1];
        }
        return null;
    },

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
        this.hasIdeView = Boolean(topic.ideExample);
        this.ideTab = 'code';
        this.currentIndex = Math.min(Math.max(0, cardIndex), this.getMaxIndex());
        this.isFlipped = false;
        this.isAnimating = false;

        App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

        setTimeout(() => this.bindEvents(), 20);

        return this.buildHTML(topic);
    },

    buildHTML(topic) {
        const isIde = this.isIdeActive();
        const safeCardIdx = Math.min(this.currentIndex, this.cards.length - 1);
        const card = this.cards[safeCardIdx];
        const nextCard = this.cards[safeCardIdx + 1];
        const nextNextCard = this.cards[safeCardIdx + 2];
        const progress = isIde ? 100 : ((safeCardIdx + 1) / this.cards.length) * 100;
        const codeExample = this.getCodeExample(card.term);
        const cardNumber = String(safeCardIdx + 1).padStart(2, '0');
        const nextCardNum = String(Math.min(safeCardIdx + 2, this.cards.length)).padStart(2, '0');
        const nextNextCardNum = String(Math.min(safeCardIdx + 3, this.cards.length)).padStart(2, '0');

        return `
            <div class="page flashcard-page">
                <div class="flashcard-progress stagger-item" style="animation-delay: 0.05s">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${isIde ? 'is-ide-progress' : ''}" id="fc-progress" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text" id="fc-counter">${isIde ? '<span class="ide-counter-pill"><span class="material-icons-round">terminal</span>IDE</span>' : `${safeCardIdx + 1}/${this.cards.length}`}</span>
                </div>

                <!-- Tumpukan Kartu 3D (Card Stack Deck) -->
                <div class="flashcard-deck flashcard-theme--${topic.theme || 'orange'} stagger-item ${isIde ? 'hidden' : ''}" style="animation-delay: 0.15s" id="fc-deck">
                    <!-- Layer 2: Kartu tumpukan dasar -->
                    <div class="deck-layer deck-layer--2 ${!nextNextCard ? 'is-empty' : ''}" id="fc-layer-2" aria-hidden="true">
                        <div class="deck-layer-surface">
                            <div class="flashcard-face flashcard-front">
                                <span class="flashcard-card-number" id="fc-layer2-number">${nextNextCardNum}</span>
                                <div class="flashcard-visual-mark" aria-hidden="true">
                                    <span class="material-icons-round">${topic.icon}</span>
                                </div>
                                <span class="flashcard-label">Istilah</span>
                                <div class="flashcard-text" id="fc-layer2-text">${nextNextCard ? this.escapeHtml(nextNextCard.term) : ''}</div>
                                <div class="flashcard-hint">
                                    <span class="material-icons-round">touch_app</span>
                                    Ketuk untuk membalik
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Layer 1: Kartu tumpukan berikutnya (utuh & siap diswipe) -->
                    <div class="deck-layer deck-layer--1 ${!nextCard ? 'is-empty' : ''}" id="fc-layer-1" aria-hidden="true">
                        <div class="deck-layer-surface">
                            <div class="flashcard-face flashcard-front">
                                <span class="flashcard-card-number" id="fc-layer1-number">${nextCardNum}</span>
                                <div class="flashcard-visual-mark" aria-hidden="true">
                                    <span class="material-icons-round">${topic.icon}</span>
                                </div>
                                <span class="flashcard-label">Istilah</span>
                                <div class="flashcard-text" id="fc-layer1-text">${nextCard ? this.escapeHtml(nextCard.term) : ''}</div>
                                <div class="flashcard-hint">
                                    <span class="material-icons-round">touch_app</span>
                                    Ketuk untuk membalik
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Kartu Utama Teratas -->
                    <div class="flashcard-container" id="fc-container">
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
                                <div class="flashcard-code-example" id="fc-code-example" ${codeExample ? '' : 'hidden'}>
                                    <span class="material-icons-round">code</span>
                                    <code>${codeExample ? this.escapeHtml(codeExample) : ''}</code>
                                </div>
                                <div class="flashcard-hint">
                                    <span class="material-icons-round">touch_app</span>
                                    Ketuk untuk kembali
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tampilan IDE Contoh Kode Lengkap (Muncul Setelah Kartu ke-5) -->
                ${topic.ideExample ? this.buildIdeHTML(topic, isIde) : ''}

                <div class="flashcard-nav stagger-item" style="animation-delay: 0.25s">
                    <button class="flashcard-nav-btn" id="fc-prev-btn" onclick="FlashcardPage.prev()" ${this.currentIndex === 0 ? 'disabled' : ''} aria-label="Sebelumnya">
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    ${(() => {
                        const isAtEnd = this.currentIndex >= this.getMaxIndex();
                        const allFlipped = isAtEnd && this.isAllCardsFlipped();
                        const isIdeTrigger = this.currentIndex === this.cards.length - 1 && this.hasIdeView;
                        const nextTopic = this.getNextTopic();
                        let btnClass = 'flashcard-nav-btn';
                        let iconName = 'arrow_forward';
                        let ariaLabel = 'Selanjutnya';
                        let title = 'Kartu Selanjutnya';

                        if (isAtEnd) {
                            btnClass += ' is-finish-trigger' + (allFlipped ? '' : ' is-finish-pending');
                            iconName = allFlipped ? (nextTopic ? 'arrow_forward' : 'check_circle') : 'touch_app';
                            ariaLabel = allFlipped ? (nextTopic ? `Tuntas! Lanjut ke ${nextTopic.name}` : 'Selesai Belajar Topik') : 'Pelajari semua kartu untuk menuntaskan';
                            title = allFlipped ? (nextTopic ? `Topik tuntas! Ketuk untuk lanjut ke ${nextTopic.name}` : 'Seluruh topik tuntas! Ketuk untuk kembali ke Beranda') : 'Masih ada kartu yang belum dipelajari';
                        } else if (isIdeTrigger) {
                            btnClass += ' is-ide-trigger';
                            iconName = 'terminal';
                            ariaLabel = 'Buka Contoh Kode IDE';
                            title = 'Buka Contoh Kode IDE';
                        }

                        return `
                        <button class="${btnClass}" id="fc-next-btn" onclick="FlashcardPage.next()" aria-label="${ariaLabel}" title="${title}">
                            <span class="material-icons-round" id="fc-next-icon">${iconName}</span>
                        </button>
                        `;
                    })()}
                </div>
            </div>
        `;
    },

    buildIdeHTML(topic, isVisible) {
        const ide = topic.ideExample;
        const lines = ide.code.split('\n');
        const highlightedLines = lines.map((line, idx) => `
            <div class="ide-code-line">
                <span class="ide-line-number" aria-hidden="true">${idx + 1}</span>
                <span class="ide-line-content">${this.highlightHtmlLine(line)}</span>
            </div>
        `).join('');

        return `
            <section class="ide-workspace ${isVisible ? '' : 'hidden'}" id="fc-ide-view" aria-label="Contoh Kode Lengkap di IDE">
                <div class="ide-window-titlebar">
                    <div class="editor-dots" aria-hidden="true"><i></i><i></i><i></i></div>
                    <div class="ide-file-tab">
                        <span class="material-icons-round ide-file-icon">html</span>
                        <span class="ide-file-name">${this.escapeHtml(ide.fileName || 'index.html')}</span>
                    </div>
                    <div class="ide-view-Segment" role="tablist" aria-label="Mode tampilan IDE">
                        <button type="button" class="ide-tab-btn active" id="ide-tab-code" role="tab" aria-selected="true" onclick="FlashcardPage.setIdeTab('code')">
                            <span class="material-icons-round">code</span>
                            <span>Kode</span>
                        </button>
                        <button type="button" class="ide-tab-btn" id="ide-tab-preview" role="tab" aria-selected="false" onclick="FlashcardPage.setIdeTab('preview')">
                            <span class="material-icons-round">play_arrow</span>
                            <span>Hasil</span>
                        </button>
                    </div>
                </div>

                <!-- Panel Editor Kode -->
                <div class="ide-editor-panel" id="ide-panel-code" role="tabpanel">
                    <div class="ide-code-scroll" tabindex="0" aria-label="Isi kode HTML lengkap">
                        ${highlightedLines}
                    </div>
                </div>

                <!-- Panel Pratinjau Hasil Browser -->
                <div class="ide-preview-panel hidden" id="ide-panel-preview" role="tabpanel">
                    <div class="ide-browser-bar">
                        <span class="material-icons-round">public</span>
                        <span class="ide-browser-url">localhost/${this.escapeHtml(ide.fileName || 'index.html')}</span>
                        <span class="ide-browser-badge">Live</span>
                    </div>
                    <iframe id="ide-preview-frame" class="ide-preview-frame" title="Hasil render kode HTML" sandbox="allow-same-origin"></iframe>
                </div>

                <div class="ide-statusbar">
                    <div class="ide-status-left">
                        <span class="material-icons-round">check_circle</span>
                        <span>Contoh Lengkap • ${this.escapeHtml(topic.name)}</span>
                    </div>
                    <div class="ide-status-right">
                        <span>${lines.length} Baris</span>
                        <span>HTML5</span>
                    </div>
                </div>
            </section>
        `;
    },

    highlightHtmlLine(line) {
        if (!line) return '&nbsp;';
        // Preserve leading spaces for indentation
        const leadingMatch = line.match(/^(\s+)/);
        const indentHtml = leadingMatch ? '&nbsp;'.repeat(leadingMatch[1].length) : '';
        const trimmed = leadingMatch ? line.slice(leadingMatch[1].length) : line;

        // Tokenize HTML tags vs plain text
        const parts = trimmed.split(/(<[^>]+>)/g);
        const rendered = parts.map(part => {
            if (!part) return '';
            if (part.startsWith('<') && part.endsWith('>')) {
                if (/^<!DOCTYPE/i.test(part)) {
                    return `<span class="ide-tok-doctype">${this.escapeHtml(part)}</span>`;
                }
                // Parse opening/closing tag and attributes
                return part.replace(
                    /^(<\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?>)$/,
                    (_, openBracket, tagName, attrString, closeBracket) => {
                        const coloredAttrs = attrString.replace(
                            /([a-zA-Z-]+)(=)("[^"]*"|'[^']*')/g,
                            (m, attrName, eq, attrVal) =>
                                `<span class="ide-tok-attr">${this.escapeHtml(attrName)}</span><span class="ide-tok-punct">${this.escapeHtml(eq)}</span><span class="ide-tok-str">${this.escapeHtml(attrVal)}</span>`
                        );
                        return `<span class="ide-tok-punct">${this.escapeHtml(openBracket)}</span><span class="ide-tok-tag">${this.escapeHtml(tagName)}</span>${coloredAttrs}<span class="ide-tok-punct">${this.escapeHtml(closeBracket)}</span>`;
                    }
                );
            }
            return `<span class="ide-tok-text">${this.escapeHtml(part)}</span>`;
        }).join('');

        return `${indentHtml}${rendered}`;
    },

    setIdeTab(tab) {
        this.ideTab = tab === 'preview' ? 'preview' : 'code';
        const codeBtn = document.getElementById('ide-tab-code');
        const previewBtn = document.getElementById('ide-tab-preview');
        const codePanel = document.getElementById('ide-panel-code');
        const previewPanel = document.getElementById('ide-panel-preview');
        const frame = document.getElementById('ide-preview-frame');

        if (codeBtn) {
            codeBtn.classList.toggle('active', this.ideTab === 'code');
            codeBtn.setAttribute('aria-selected', String(this.ideTab === 'code'));
        }
        if (previewBtn) {
            previewBtn.classList.toggle('active', this.ideTab === 'preview');
            previewBtn.setAttribute('aria-selected', String(this.ideTab === 'preview'));
        }
        if (codePanel) codePanel.classList.toggle('hidden', this.ideTab !== 'code');
        if (previewPanel) previewPanel.classList.toggle('hidden', this.ideTab !== 'preview');

        if (this.ideTab === 'preview' && frame) {
            const topic = FlashLearnData.getTopicById(this.currentTopicId);
            if (topic && topic.ideExample) {
                const defaultStyle = '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:14px;background:#ffffff;line-height:1.5;font-size:14px;}h1{font-size:18px;margin:0 0 8px;color:#0f172a;}h2{font-size:15px;margin:10px 0 6px;color:#1e293b;}p{margin:0 0 8px;}a{color:#2563eb;font-weight:600;}img{max-height:64px;width:auto;display:block;margin-top:6px;border-radius:8px;}ul,ol{margin:0 0 8px;padding-left:20px;}li{margin-bottom:3px;}dl{margin:0;}dt{font-weight:700;color:#0f172a;}dd{margin:2px 0 8px 14px;color:#475569;}table{border-collapse:collapse;width:100%;margin-top:6px;font-size:13px;}th,td{border:1px solid #cbd5e1;padding:6px 9px;text-align:left;}th{background:#f1f5f9;font-weight:700;}</style>';
                const rawCode = topic.ideExample.code;
                frame.srcdoc = rawCode.includes('<head>')
                    ? rawCode.replace('<head>', `<head>${defaultStyle}`)
                    : `${defaultStyle}${rawCode}`;
            }
        }
    },

    bindEvents() {
        const container = document.getElementById('fc-container');
        if (!container) return;

        let startX = 0;
        let startY = 0;
        let currentDiffX = 0;
        let currentDiffY = 0;
        let isPointerActive = false;
        let isDragging = false;
        let startTime = 0;
        let activePointerId = null;
        let currentLayerDirection = null; // 'next' atau 'prev'

        const onPointerDown = (e) => {
            if (this.isAnimating || this.isIdeActive()) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            isPointerActive = true;
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            currentDiffX = 0;
            currentDiffY = 0;
            startTime = Date.now();
            activePointerId = e.pointerId;
            currentLayerDirection = null;

            container.style.transition = 'none';

            try {
                container.setPointerCapture(e.pointerId);
            } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (!isPointerActive) return;

            const diffX = e.clientX - startX;
            const diffY = e.clientY - startY;
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);

            // Deteksi intensi gestur swipe horizontal
            if (!isDragging && absX > 8 && absX > absY) {
                isDragging = true;
            }

            if (isDragging) {
                let moveX = diffX;
                // Hambatan elastis jika berada di ujung kartu awal / akhir
                if ((this.currentIndex === 0 && moveX > 0) || 
                    (this.currentIndex >= this.getMaxIndex() && moveX < 0)) {
                    moveX *= 0.28;
                }

                currentDiffX = moveX;
                currentDiffY = diffY;

                const rot = moveX * 0.055;
                container.style.transform = `translate3d(${moveX}px, ${Math.abs(moveX) * 0.08}px, 0) rotate(${rot}deg)`;

                const layer1 = document.getElementById('fc-layer-1');
                const layer1Text = document.getElementById('fc-layer1-text');
                const layer1Number = document.getElementById('fc-layer1-number');

                if (layer1) layer1.classList.add('show-content');

                // ── Tarikan ke KIRI (Lanjut ke kartu berikutnya) ──
                if (moveX < 0 && this.currentIndex < this.cards.length - 1) {
                    if (currentLayerDirection !== 'next') {
                        currentLayerDirection = 'next';
                        const nextCard = this.cards[this.currentIndex + 1];
                        if (layer1Number) layer1Number.textContent = String(this.currentIndex + 2).padStart(2, '0');
                        if (layer1Text && nextCard) layer1Text.textContent = nextCard.term;
                        if (layer1) layer1.classList.remove('is-empty');
                    }
                    const progress = Math.min(Math.abs(moveX) / 140, 1);
                    const scale = 0.96 + (0.04 * progress);
                    const translateY = 9 - (9 * progress);
                    const brightness = 0.96 + (0.04 * progress);
                    if (layer1) {
                        layer1.style.transition = 'none';
                        layer1.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
                        layer1.style.filter = `brightness(${brightness})`;
                    }
                } 
                // ── Tarikan ke KANAN (Kembali ke kartu sebelumnya) ──
                else if (moveX > 0 && this.currentIndex > 0) {
                    if (currentLayerDirection !== 'prev') {
                        currentLayerDirection = 'prev';
                        const prevCard = this.cards[this.currentIndex - 1];
                        if (layer1Number) layer1Number.textContent = String(this.currentIndex).padStart(2, '0');
                        if (layer1Text && prevCard) layer1Text.textContent = prevCard.term;
                        if (layer1) layer1.classList.remove('is-empty');
                    }
                    const progress = Math.min(moveX / 140, 1);
                    const scale = 0.96 + (0.04 * progress);
                    const translateY = 9 - (9 * progress);
                    const brightness = 0.96 + (0.04 * progress);
                    if (layer1) {
                        layer1.style.transition = 'none';
                        layer1.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
                        layer1.style.filter = `brightness(${brightness})`;
                    }
                }
            }
        };

        const onPointerEnd = (e) => {
            if (!isPointerActive) return;
            isPointerActive = false;

            if (activePointerId !== null) {
                try {
                    container.releasePointerCapture(activePointerId);
                } catch (err) {}
                activePointerId = null;
            }

            const duration = Date.now() - startTime;
            const diffX = currentDiffX;
            const totalTravel = Math.hypot(e.clientX - startX, e.clientY - startY);

            // Jika BUKAN drag yang signifikan dan jarak gerak < 20px -> 100% PASTI FLIP (TAP)
            if (!isDragging || (totalTravel < 20 && duration < 350)) {
                container.style.transition = 'none';
                container.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
                const layer1 = document.getElementById('fc-layer-1');
                if (layer1) {
                    layer1.style.transition = 'none';
                    layer1.style.transform = '';
                    layer1.style.filter = '';
                }
                this.flip();
                return;
            }

            // Ambang batas swipe (jarak > 55px atau sentakan cepat > 35px)
            const isFlick = duration < 260 && Math.abs(diffX) > 35;
            const isSwipe = Math.abs(diffX) > 55 || isFlick;

            if (isSwipe && diffX < 0 && this.currentIndex < this.cards.length - 1) {
                // Swipe ke kiri -> Lanjut ke kartu berikutnya
                this.dismissCardToNext(diffX, currentDiffY);
            } else if (isSwipe && diffX < 0 && this.currentIndex === this.cards.length - 1 && this.hasIdeView) {
                // Swipe ke kiri pada kartu ke-5 -> Buka tampilan IDE Contoh Kode Lengkap
                this.openIdeView(diffX, currentDiffY);
            } else if (isSwipe && diffX > 0 && this.currentIndex > 0) {
                // Swipe ke kanan -> Kembali ke kartu sebelumnya secara mulus!
                this.dismissCardToPrev(diffX, currentDiffY);
            } else {
                // Snap back mulus jika tarikan tidak cukup
                container.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.25, 1)';
                container.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';

                const layer1 = document.getElementById('fc-layer-1');
                if (layer1) {
                    layer1.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.25, 1), filter 0.3s ease';
                    layer1.style.transform = '';
                    layer1.style.filter = '';

                    setTimeout(() => {
                        if (layer1) {
                            layer1.style.transition = '';
                            layer1.classList.remove('show-content');
                            const nextCard = this.cards[this.currentIndex + 1];
                            const layer1Text = document.getElementById('fc-layer1-text');
                            const layer1Number = document.getElementById('fc-layer1-number');
                            if (layer1Number) layer1Number.textContent = String(Math.min(this.currentIndex + 2, this.cards.length)).padStart(2, '0');
                            if (layer1Text) layer1Text.textContent = nextCard ? nextCard.term : '';
                            layer1.classList.toggle('is-empty', !nextCard);
                        }
                    }, 300);
                }

                setTimeout(() => {
                    container.style.transition = '';
                }, 300);
            }
        };

        container.onpointerdown = onPointerDown;
        container.onpointermove = onPointerMove;
        container.onpointerup = onPointerEnd;
        container.onpointercancel = onPointerEnd;
        container.onlostpointercapture = onPointerEnd;

        // Keyboard Shortcut: Panah Kiri, Panah Kanan, Spasi/Enter
        if (!this.keyboardBound) {
            this.keyboardBound = true;
            document.addEventListener('keydown', (e) => {
                if (App.currentPage !== 'flashcard' || this.isAnimating) return;
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.next();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prev();
                } else if (e.key === ' ' || e.key === 'Enter') {
                    if (this.isIdeActive()) return;
                    if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
                    e.preventDefault();
                    this.flip();
                }
            });
        }
    },

    flip() {
        if (this.isAnimating || this.isIdeActive()) return;
        this.isFlipped = !this.isFlipped;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('flip');
        }

        const flashcard = document.getElementById('flashcard');
        const container = document.getElementById('fc-container');

        // Lift & Flip: Kartu terangkat sedikit ke depan saat dibalik
        if (container) {
            container.classList.remove('is-lifting');
            void container.offsetWidth; // reflow to trigger animation
            container.classList.add('is-lifting');
            setTimeout(() => {
                if (container) container.classList.remove('is-lifting');
            }, 440);
        }

        if (flashcard) {
            flashcard.classList.toggle('flipped', this.isFlipped);
        }
        if (this.isFlipped) {
            App.markCardStudied(this.currentTopicId, this.currentIndex);
            this.updateNavigationAndProgress();
        }
    },

    next() {
        if (this.isAnimating) return;
        if (this.currentIndex >= this.getMaxIndex()) {
            this.finishTopic();
            return;
        }
        if (this.currentIndex === this.cards.length - 1 && this.hasIdeView) {
            this.openIdeView(0, 0);
            return;
        }
        this.dismissCardToNext(0, 0);
    },

    finishTopic() {
        const unflipped = this.getUnflippedCount();
        if (unflipped > 0) {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('denied');
            }
            const nextBtn = document.getElementById('fc-next-btn');
            if (nextBtn) {
                nextBtn.classList.remove('deniedShake');
                void nextBtn.offsetWidth;
                nextBtn.classList.add('deniedShake');
            }
            App.showToast(`Masih ada ${unflipped} kartu yang belum kamu pelajari. Pelajari semua kartu untuk menuntaskan topik!`, 'warning');
            return;
        }

        if (this.currentTopicId) {
            App.markTopicCompleted(this.currentTopicId);
        }
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('correct');
        }
        const topic = FlashLearnData.getTopicById(this.currentTopicId);
        const topicName = topic ? topic.name : 'Topik';
        const nextTopic = this.getNextTopic();

        if (nextTopic) {
            App.showToast(`Selamat! Topik ${topicName} tuntas! Membuka topik berikutnya: ${nextTopic.name}.`, 'success');
            setTimeout(() => {
                App.navigate('flashcard', nextTopic.id);
            }, 500);
        } else {
            App.showToast(`Luar biasa! Seluruh topik HTML telah kamu tuntaskan!`, 'success');
            setTimeout(() => {
                App.navigate('home');
            }, 600);
        }
    },

    prev() {
        if (this.isAnimating || this.currentIndex <= 0) return;
        if (this.isIdeActive()) {
            this.closeIdeViewToLastCard();
            return;
        }
        this.dismissCardToPrev(0, 0);
    },

    openIdeView(fromX = 0, fromY = 0) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('swipe');
        }

        const container = document.getElementById('fc-container');
        const flashcard = document.getElementById('flashcard');
        const deck = document.getElementById('fc-deck');
        const ideView = document.getElementById('fc-ide-view');

        if (container) {
            const exitX = fromX < -40 ? fromX * 2.2 - 200 : -360;
            const exitRot = fromX < -20 ? fromX * 0.08 - 8 : -12;
            container.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.22s ease-out';
            container.style.transform = `translate3d(${exitX}px, ${fromY * 0.4 - 12}px, 0) rotate(${exitRot}deg)`;
            container.style.opacity = '0';
        }

        setTimeout(() => {
            this.currentIndex = this.cards.length;
            this.isFlipped = false;
            this.ideTab = 'code';

            App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

            if (flashcard) {
                flashcard.style.transition = 'none';
                flashcard.classList.remove('flipped');
                flashcard.offsetHeight;
                flashcard.style.transition = '';
            }
            if (container) {
                container.style.transition = 'none';
                container.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
                container.style.opacity = '1';
                container.offsetHeight;
                container.style.transition = '';
            }

            if (deck) deck.classList.add('hidden');
            if (ideView) {
                ideView.classList.remove('hidden');
                this.setIdeTab('code');
            }

            this.updateNavigationAndProgress();
            this.isAnimating = false;
        }, 250);
    },

    closeIdeViewToLastCard() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('swipe');
        }

        const deck = document.getElementById('fc-deck');
        const ideView = document.getElementById('fc-ide-view');
        const container = document.getElementById('fc-container');
        const flashcard = document.getElementById('flashcard');

        this.currentIndex = this.cards.length - 1;
        this.isFlipped = false;

        App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

        if (ideView) ideView.classList.add('hidden');
        if (deck) deck.classList.remove('hidden');

        if (flashcard) {
            flashcard.style.transition = 'none';
            flashcard.classList.remove('flipped');
            flashcard.offsetHeight;
            flashcard.style.transition = '';
        }

        this.updateCardContent();

        if (container) {
            container.style.transition = 'none';
            container.style.transform = 'translate3d(-120px, 0, 0) rotate(-5deg)';
            container.style.opacity = '0.2';
            container.offsetHeight;
            container.style.transition = 'transform 0.26s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.22s ease';
            container.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
            container.style.opacity = '1';
        }

        setTimeout(() => {
            if (container) container.style.transition = '';
            this.isAnimating = false;
        }, 260);
    },

    updateNavigationAndProgress() {
        const isIde = this.isIdeActive();
        const progress = document.getElementById('fc-progress');
        const counter = document.getElementById('fc-counter');
        const prevBtn = document.getElementById('fc-prev-btn');
        const nextBtn = document.getElementById('fc-next-btn');
        const nextIcon = document.getElementById('fc-next-icon');

        if (progress) {
            progress.style.width = isIde ? '100%' : `${((this.currentIndex + 1) / this.cards.length) * 100}%`;
            progress.classList.toggle('is-ide-progress', isIde);
        }
        if (counter) {
            if (isIde) {
                counter.innerHTML = '<span class="ide-counter-pill"><span class="material-icons-round">terminal</span>IDE</span>';
            } else {
                counter.textContent = `${this.currentIndex + 1}/${this.cards.length}`;
            }
        }
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) {
            const isAtEnd = this.currentIndex >= this.getMaxIndex();
            const isIdeTrigger = this.currentIndex === this.cards.length - 1 && this.hasIdeView;

            if (isAtEnd) {
                const allFlipped = this.isAllCardsFlipped();
                const nextTopic = this.getNextTopic();
                nextBtn.disabled = false;
                nextBtn.classList.remove('is-ide-trigger');
                nextBtn.classList.add('is-finish-trigger');
                nextBtn.classList.toggle('is-finish-pending', !allFlipped);
                if (allFlipped) {
                    const label = nextTopic ? `Tuntas! Lanjut ke ${nextTopic.name}` : 'Selesai Belajar Topik';
                    const titleText = nextTopic ? `Topik tuntas! Ketuk untuk lanjut ke ${nextTopic.name}` : 'Seluruh topik tuntas! Ketuk untuk kembali ke Beranda';
                    nextBtn.setAttribute('aria-label', label);
                    nextBtn.title = titleText;
                    if (nextIcon) nextIcon.textContent = nextTopic ? 'arrow_forward' : 'check_circle';
                } else {
                    nextBtn.setAttribute('aria-label', 'Pelajari semua kartu untuk menuntaskan');
                    nextBtn.title = `Masih ada ${this.getUnflippedCount()} kartu yang belum dipelajari`;
                    if (nextIcon) nextIcon.textContent = 'touch_app';
                }
            } else if (isIdeTrigger) {
                nextBtn.disabled = false;
                nextBtn.classList.add('is-ide-trigger');
                nextBtn.classList.remove('is-finish-trigger', 'is-finish-pending');
                nextBtn.setAttribute('aria-label', 'Buka Contoh Kode IDE');
                nextBtn.title = 'Buka Contoh Kode IDE';
                if (nextIcon) nextIcon.textContent = 'terminal';
            } else {
                nextBtn.disabled = false;
                nextBtn.classList.remove('is-ide-trigger', 'is-finish-trigger', 'is-finish-pending');
                nextBtn.setAttribute('aria-label', 'Selanjutnya');
                nextBtn.title = 'Kartu Selanjutnya';
                if (nextIcon) nextIcon.textContent = 'arrow_forward';
            }
        }
    },

    // ── Mulus Tanpa Glitch: Lempar kartu ke KIRI dan promosikan layer bawah secara seamless ──
    dismissCardToNext(fromX = 0, fromY = 0) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('swipe');
        }

        const container = document.getElementById('fc-container');
        const flashcard = document.getElementById('flashcard');
        const layer1 = document.getElementById('fc-layer-1');
        const layer2 = document.getElementById('fc-layer-2');
        const layer1Text = document.getElementById('fc-layer1-text');
        const layer1Number = document.getElementById('fc-layer1-number');

        const newIndex = this.currentIndex + 1;
        const nextCard = this.cards[newIndex];

        if (layer1) {
            layer1.classList.remove('is-empty');
            layer1.classList.add('show-content');
            if (layer1Number) layer1Number.textContent = String(newIndex + 1).padStart(2, '0');
            if (layer1Text && nextCard) layer1Text.textContent = nextCard.term;
        }

        const exitX = fromX < -40 ? fromX * 2.2 - 200 : -380;
        const exitRot = fromX < -20 ? fromX * 0.08 - 8 : -14;

        container.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.25s ease-out';
        container.style.transform = `translate3d(${exitX}px, ${fromY * 0.4 - 15}px, 0) rotate(${exitRot}deg)`;
        container.style.opacity = '0';

        if (layer1) {
            layer1.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.25, 1), filter 0.28s ease';
            layer1.style.transform = 'translate3d(0, 0, 0) scale(1)';
            layer1.style.filter = 'brightness(1)';
        }
        if (layer2) {
            layer2.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.25, 1), filter 0.28s ease';
            layer2.style.transform = 'translate3d(0, 9px, 0) scale(0.96)';
            layer2.style.filter = 'brightness(0.96)';
        }

        setTimeout(() => {
            this.currentIndex = newIndex;
            this.isFlipped = false;

            if (App.getStudiedCards().length > 0) {
                App.saveLastStudiedCard(this.currentTopicId, this.currentIndex);
            }
            App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });
            App.updateHeader('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

            if (flashcard) {
                flashcard.style.transition = 'none';
                flashcard.classList.remove('flipped');
                flashcard.offsetHeight;
            }

            this.updateCardContent();

            container.style.transition = 'none';
            container.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
            container.style.opacity = '1';
            container.offsetHeight;

            if (flashcard) flashcard.style.transition = '';

            if (layer1) {
                layer1.style.transition = 'none';
                layer1.style.transform = '';
                layer1.style.filter = '';
                layer1.classList.remove('show-content');
            }
            if (layer2) {
                layer2.style.transition = 'none';
                layer2.style.transform = '';
                layer2.style.filter = '';
            }

            this.isAnimating = false;
        }, 280);
    },

    // ── Mulus Tanpa Glitch: Luncurkan kartu ke KANAN searah tarikan dan munculkan kartu sebelumnya ──
    dismissCardToPrev(fromX = 0, fromY = 0) {
        if (this.isAnimating || this.currentIndex <= 0) return;
        this.isAnimating = true;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('swipe');
        }

        const container = document.getElementById('fc-container');
        const flashcard = document.getElementById('flashcard');
        const layer1 = document.getElementById('fc-layer-1');
        const layer2 = document.getElementById('fc-layer-2');
        const layer1Text = document.getElementById('fc-layer1-text');
        const layer1Number = document.getElementById('fc-layer1-number');

        const newIndex = this.currentIndex - 1;
        const prevCard = this.cards[newIndex];

        if (layer1) {
            layer1.classList.remove('is-empty');
            layer1.classList.add('show-content');
            if (layer1Number) layer1Number.textContent = String(newIndex + 1).padStart(2, '0');
            if (layer1Text && prevCard) layer1Text.textContent = prevCard.term;
        }

        const exitX = fromX > 40 ? fromX * 2.2 + 200 : 380;
        const exitRot = fromX > 20 ? fromX * 0.08 + 8 : 14;

        container.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.25s ease-out';
        container.style.transform = `translate3d(${exitX}px, ${fromY * 0.4 - 15}px, 0) rotate(${exitRot}deg)`;
        container.style.opacity = '0';

        if (layer1) {
            layer1.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.25, 1), filter 0.28s ease';
            layer1.style.transform = 'translate3d(0, 0, 0) scale(1)';
            layer1.style.filter = 'brightness(1)';
        }

        setTimeout(() => {
            this.currentIndex = newIndex;
            this.isFlipped = false;

            if (App.getStudiedCards().length > 0) {
                App.saveLastStudiedCard(this.currentTopicId, this.currentIndex);
            }
            App.saveActiveRoute('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });
            App.updateHeader('flashcard', { topicId: this.currentTopicId, cardIndex: this.currentIndex });

            if (flashcard) {
                flashcard.style.transition = 'none';
                flashcard.classList.remove('flipped');
                flashcard.offsetHeight;
            }

            this.updateCardContent();

            container.style.transition = 'none';
            container.style.transform = 'translate3d(0, 0, 0) scale(1)';
            container.style.opacity = '1';
            container.offsetHeight;

            if (flashcard) flashcard.style.transition = '';

            if (layer1) {
                layer1.style.transition = 'none';
                layer1.style.transform = '';
                layer1.style.filter = '';
                layer1.classList.remove('show-content');
            }
            if (layer2) {
                layer2.style.transition = 'none';
                layer2.style.transform = '';
                layer2.style.filter = '';
            }

            this.isAnimating = false;
        }, 280);
    },

    updateCardContent() {
        const safeIdx = Math.min(this.currentIndex, this.cards.length - 1);
        const card = this.cards[safeIdx];
        const nextCard = this.cards[safeIdx + 1];
        const nextNextCard = this.cards[safeIdx + 2];

        const frontText = document.getElementById('fc-front-text');
        const backText = document.getElementById('fc-back-text');
        const codeExample = document.getElementById('fc-code-example');
        const cardNumbers = document.querySelectorAll('[data-card-number]');

        const layer1Text = document.getElementById('fc-layer1-text');
        const layer2Text = document.getElementById('fc-layer2-text');
        const layer1Number = document.getElementById('fc-layer1-number');
        const layer2Number = document.getElementById('fc-layer2-number');
        const layer1 = document.getElementById('fc-layer-1');
        const layer2 = document.getElementById('fc-layer-2');

        const example = this.getCodeExample(card.term);

        if (frontText) frontText.textContent = card.term;
        if (backText) backText.textContent = card.definition;

        cardNumbers.forEach(number => {
            number.textContent = String(safeIdx + 1).padStart(2, '0');
        });

        if (layer1Number) {
            layer1Number.textContent = String(Math.min(safeIdx + 2, this.cards.length)).padStart(2, '0');
        }
        if (layer1Text) {
            layer1Text.textContent = nextCard ? nextCard.term : '';
        }

        if (layer2Number) {
            layer2Number.textContent = String(Math.min(safeIdx + 3, this.cards.length)).padStart(2, '0');
        }
        if (layer2Text) {
            layer2Text.textContent = nextNextCard ? nextNextCard.term : '';
        }

        if (layer1) {
            layer1.classList.toggle('is-empty', safeIdx >= this.cards.length - 1);
        }
        if (layer2) {
            layer2.classList.toggle('is-empty', safeIdx >= this.cards.length - 2);
        }

        if (codeExample) {
            codeExample.hidden = !example;
            const code = codeExample.querySelector('code');
            if (code) code.textContent = example;
        }

        this.updateNavigationAndProgress();
    },

    getCodeExample(term) {
        const examples = [
            ['<h1>', '<h1>Judul Utama</h1>'], ['<p>', '<p>Ini sebuah paragraf.</p>'],
            ['<strong>', '<strong>Teks penting</strong>'], ['<em>', '<em>Teks ditekankan</em>'],
            ['<br>', '<p>Baris satu<br>Baris dua</p>'], ['<a>', '<a href="https://example.com">Kunjungi situs</a>'],
            ['href', '<a href="https://example.com">Tautan</a>'], ['<img>', '<img src="foto.jpg" alt="Pemandangan">'],
            ['src', '<img src="foto.jpg" alt="Pemandangan">'], ['alt', '<img src="logo.png" alt="Logo FlashLearn">'], ['<title>', '<title>Halaman Saya</title>'],
            ['<body>', '<body>Konten halaman</body>'], ['<head>', '<head>...</head>'], ['<html>', '<html lang="id">...</html>'],
            ['DOCTYPE', '<!DOCTYPE html>'],
            ['<ul>', '<ul><li>Item satu</li></ul>'], ['<ol>', '<ol><li>Langkah 1</li></ol>'],
            ['<li>', '<li>Belajar HTML</li>'], ['<dl>', '<dl><dt>HTML</dt><dd>Markup</dd></dl>'],
            ['Nested List', '<li>Web<ul><li>HTML</li></ul></li>'],
            ['<table>', '<table>...</table>'], ['<tr>', '<tr><td>Data</td></tr>'],
            ['<th>', '<tr><th>Nama</th></tr>'], ['<td>', '<tr><td>Budi</td></tr>'],
            ['colspan', '<td colspan="2">Gabungan</td>'],
            ['Tag', '<h1>Judul</h1>'], ['Elemen', '<p>Isi paragraf</p>'], ['Atribut', '<a href="index.html">Link</a>']
        ];
        return examples.find(([key]) => term.includes(key))?.[1] || '';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

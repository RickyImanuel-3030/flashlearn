/**
 * Code-assembly quiz: learners arrange HTML blocks into the correct order.
 */
const QuizPage = {
    exercises: [],
    currentIndex: 0,
    score: 0,
    attempts: 0,
    studyPromptShown: false,
    exerciseResults: [],
    blockOrder: [],
    draggedBlockId: null,
    selectedBlockId: null,
    completed: false,
    touchBlockId: null,
    touchStartX: 0,
    touchStartY: 0,
    touchMoved: false,
    dropTargetId: null,
    dropAfter: false,
    dragGhost: null,
    dragGhostOffsetX: 0,
    dragGhostOffsetY: 0,
    dragGhostX: 0,
    dragGhostY: 0,
    dragGhostFrame: null,
    dragPointerX: 0,
    dragPointerY: 0,
    autoScrollFrame: null,
    autoScrollSpeed: 0,
    ignoreTouchClickUntil: 0,
    sessionActive: false,

    render() {
        this.sessionActive = false;
        App.saveActiveRoute('quiz', { quizView: 'intro' });
        return this.buildIntroHTML();
    },

    buildIntroHTML() {
        const firstExercise = FlashLearnData.exercises[0];
        const exerciseCount = FlashLearnData.exercises.length;

        return `
            <div class="page quiz-intro-page">
                <section class="quiz-intro-card glass-card stagger-item" style="animation-delay: 0.08s" aria-labelledby="quiz-intro-title">
                    <div class="quiz-intro-decoration" aria-hidden="true">&lt;/&gt;</div>
                    <div class="quiz-intro-icon" aria-hidden="true"><span class="material-icons-round">account_tree</span></div>
                    <div class="quiz-intro-eyebrow">Latihan Menyusun Kode</div>
                    <h2 id="quiz-intro-title">${this.escapeHtml(firstExercise.title)}</h2>
                    <p>${this.escapeHtml(firstExercise.instruction)}</p>
                    <div class="quiz-intro-meta" aria-label="Informasi latihan">
                        <span><span class="material-icons-round">format_list_numbered</span>${exerciseCount} latihan</span>
                    </div>
                </section>
                <div class="quiz-intro-actions stagger-item" style="animation-delay: 0.16s">
                    <button class="btn btn-primary quiz-intro-button" onclick="QuizPage.begin()">
                        <span class="material-icons-round btn-icon">play_arrow</span>
                        Mulai Latihan
                    </button>
                    <button class="btn quiz-intro-history-button" onclick="QuizPage.viewLastResult()">
                        <span class="material-icons-round btn-icon">history</span>
                        Hasil Latihan Sebelumnya
                    </button>
                    <button class="btn quiz-intro-learn-button" onclick="App.navigate('flashlearn')">
                        <span class="material-icons-round">auto_stories</span>
                        Belajar Dulu
                    </button>
                </div>
            </div>
        `;
    },

    getLastResult() {
        try {
            const raw = localStorage.getItem('flashlearn_last_quiz_result');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.score === 'number') {
                    return parsed;
                }
            }
        } catch (e) { }

        try {
            const sessionRaw = sessionStorage.getItem('flashlearn_quiz_last_result');
            if (sessionRaw) {
                const parsed = JSON.parse(sessionRaw);
                if (parsed && typeof parsed.score === 'number') {
                    return parsed;
                }
            }
        } catch (e) { }

        const scores = typeof App !== 'undefined' && App.getScores ? App.getScores() : [];
        if (scores && scores.length > 0) {
            const last = scores[scores.length - 1];
            return {
                score: last.rawScore !== undefined && last.rawScore !== null ? last.rawScore : last.score,
                exerciseResults: last.exerciseResults || []
            };
        }

        return null;
    },

    viewLastResult() {
        const lastResult = this.getLastResult();
        if (!lastResult) {
            this.showEmptyResultModal();
            return;
        }
        this.restoreResults(lastResult);
    },

    showEmptyResultModal() {
        const modal = document.getElementById('empty-result-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            App.showToast('Belum ada hasil latihan sebelumnya. Selesaikan latihan pertamamu terlebih dahulu.', 'warning');
        }
    },

    hideEmptyResultModal() {
        const modal = document.getElementById('empty-result-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    renderIntroView() {
        this.sessionActive = false;
        App.saveActiveRoute('quiz', { quizView: 'intro' });
        const container = document.getElementById('page-container');
        if (container) {
            this.renderIntoContainer(container, this.buildIntroHTML());
        }
    },

    begin() {
        this.sessionActive = true;
        try {
            sessionStorage.removeItem('flashlearn_quiz_last_result');
        } catch (e) { }
        this.exercises = FlashLearnData.getExercises();
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
        this.exerciseResults = [];
        this.startExercise();

        App.saveActiveRoute('quiz', {
            quizView: 'exercise',
            currentIndex: this.currentIndex,
            score: this.score,
            exerciseResults: this.exerciseResults
        });

        const container = document.getElementById('page-container');
        if (container) this.renderIntoContainer(container, this.buildExerciseHTML());
    },

    startExercise() {
        this.clearBlockPointer();
        const exercise = this.exercises[this.currentIndex];
        this.blockOrder = this.generateShuffledOrder(exercise);

        this.draggedBlockId = null;
        this.selectedBlockId = null;
        this.completed = false;
        this.attempts = 0;
        this.studyPromptShown = false;
    },

    shuffleArray(items) {
        const array = [...items];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    },

    generateShuffledOrder(exercise) {
        const originalIds = exercise.blocks.map(b => b.id);
        if (originalIds.length <= 1) return [...originalIds];

        if (!this.previousOrders) {
            this.previousOrders = {};
            try {
                const stored = sessionStorage.getItem('flashlearn_quiz_prev_orders');
                if (stored) this.previousOrders = JSON.parse(stored);
            } catch (e) {}
        }

        const prevOrder = this.previousOrders[exercise.id];
        const correctOrder = exercise.correctOrder;

        let bestOrder = null;
        let attempts = 0;

        while (attempts < 50) {
            const candidate = this.shuffleArray(originalIds);
            attempts++;

            // Pastikan tidak sama persis dengan urutan kunci jawaban
            const isCorrect = candidate.every((id, idx) => id === correctOrder[idx]);
            if (isCorrect) continue;

            // Pastikan berbeda dari susunan sebelumnya jika ada riwayat sesi lalu
            const isSameAsPrev = prevOrder && candidate.every((id, idx) => id === prevOrder[idx]);
            if (isSameAsPrev && originalIds.length > 2 && attempts < 40) continue;

            bestOrder = candidate;
            break;
        }

        if (!bestOrder) {
            bestOrder = this.shuffleArray(originalIds);
            if (bestOrder.every((id, idx) => id === correctOrder[idx])) {
                bestOrder.reverse();
            }
        }

        // Simpan urutan pilihan ini agar pada sesi latihan berikutnya diacak berbeda lagi
        this.previousOrders[exercise.id] = [...bestOrder];
        try {
            sessionStorage.setItem('flashlearn_quiz_prev_orders', JSON.stringify(this.previousOrders));
        } catch (e) {}

        return bestOrder;
    },

    clearActiveSession() {
        this.sessionActive = false;
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
        this.exerciseResults = [];
        try {
            sessionStorage.removeItem('flashlearn_quiz_last_result');
        } catch (e) {}
    },

    buildExerciseHTML() {
        const exercise = this.exercises[this.currentIndex];
        const progressPercent = (this.currentIndex / this.exercises.length) * 100;

        return `
            <div class="page quiz-page code-quiz-page" id="quiz-page">
                <div class="quiz-header stagger-item" style="animation-delay: 0.05s">
                    <div class="quiz-progress-info">
                        <span class="quiz-counter">Latihan ${this.currentIndex + 1} dari ${this.exercises.length}</span>
                        <span class="quiz-score">Skor: ${this.score}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                <section class="code-workspace stagger-item" style="animation-delay: 0.1s" aria-label="Area menyusun kode">
                    <div class="code-workspace-header">
                        <div class="editor-dots" aria-hidden="true"><i></i><i></i><i></i></div>
                        <div class="editor-file-name">
                            <span class="material-icons-round">html</span>
                            <strong>index.html</strong>
                        </div>
                        <span class="code-run-status idle" id="code-run-status"><span></span>Belum dijalankan</span>
                    </div>
                    <ol class="code-block-list" id="code-block-list">
                        ${this.buildBlocksHTML()}
                    </ol>
                </section>

                <p class="code-quiz-feedback" id="code-quiz-feedback" aria-live="polite"></p>

                <section class="code-preview" id="code-preview" aria-live="polite" hidden>
                    <div class="code-preview-header">
                        <span class="material-icons-round">visibility</span>
                        <strong>Pratinjau hasil</strong>
                    </div>
                    <iframe id="code-preview-frame" class="code-preview-frame" title="Pratinjau kode HTML" sandbox="allow-same-origin"></iframe>
                </section>

                <div class="code-quiz-actions stagger-item" style="animation-delay: 0.18s">
                    <button class="btn run-code-btn" id="check-order-btn" onclick="QuizPage.checkAnswer()">
                        <span class="material-icons-round btn-icon">play_arrow</span>
                        Run Kode
                    </button>
                    <button class="btn btn-primary ${this.completed ? '' : 'is-locked'}" id="quiz-next-btn" onclick="QuizPage.nextExercise()" ${this.completed ? '' : 'aria-disabled="true"'}>
                        <span class="material-icons-round btn-icon">arrow_forward</span>
                        ${this.currentIndex < this.exercises.length - 1 ? 'Latihan Berikutnya' : 'Lihat Hasil'}
                    </button>
                </div>
            </div>
        `;
    },

    buildBlocksHTML() {
        const exercise = this.exercises[this.currentIndex];
        return this.blockOrder.map((id, index) => {
            const block = exercise.blocks.find(item => item.id === id);
            return `
                <li class="code-block" id="code-block-${id}" data-block-id="${id}"
                    role="button"
                    tabindex="0"
                    onkeydown="QuizPage.handleBlockKey(event, '${id}')"
                    onpointerdown="QuizPage.handleBlockPointerDown(event, '${id}')"
                    onpointermove="QuizPage.handleBlockPointerMove(event)"
                    onpointerup="QuizPage.handleBlockPointerUp(event, '${id}')"
                    onpointercancel="QuizPage.handleBlockPointerCancel(event)">
                    <span class="code-block-position">${index + 1}</span>
                    <span class="material-icons-round code-block-handle" aria-hidden="true">drag_indicator</span>
                    <code>${this.escapeHtml(block.code)}</code>
                </li>
            `;
        }).join('');
    },

    selectBlock(id, fromTouch = false) {
        if (this.completed) return;
        if (!fromTouch && Date.now() < this.ignoreTouchClickUntil) return;

        if (!this.selectedBlockId) {
            this.selectedBlockId = id;
            const element = document.getElementById(`code-block-${id}`);
            if (element) element.classList.add('selected');
            return;
        }

        if (this.selectedBlockId === id) {
            this.selectedBlockId = null;
            const element = document.getElementById(`code-block-${id}`);
            if (element) element.classList.remove('selected');
            return;
        }

        this.moveBlockBefore(this.selectedBlockId, id);
        this.selectedBlockId = null;
        this.renderBlockList();
    },

    handleBlockKey(event, id) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.selectBlock(id, true);
    },

    handleBlockPointerDown(event, id) {
        if (this.completed) return;
        this.removeDragGhost();
        this.touchBlockId = id;
        this.touchStartX = event.clientX;
        this.touchStartY = event.clientY;
        this.touchMoved = false;
        this.dropTargetId = null;
        this.dropAfter = false;
        event.currentTarget.setPointerCapture?.(event.pointerId);
    },

    handleBlockPointerMove(event) {
        if (!this.touchBlockId) return;
        const movedEnough = Math.hypot(event.clientX - this.touchStartX, event.clientY - this.touchStartY) > 4;
        if (!movedEnough && !this.touchMoved) return;

        event.preventDefault();
        if (!this.touchMoved) {
            this.touchMoved = true;
            this.draggedBlockId = this.touchBlockId;
            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('drag');
            }
            const source = document.getElementById(`code-block-${this.touchBlockId}`);
            source?.classList.add('dragging');
            this.createDragGhost(source, event);
        }

        this.dragPointerX = event.clientX;
        this.dragPointerY = event.clientY;
        this.updateDragGhost(event);
        this.updateDropTarget(event.clientX, event.clientY);
        this.updateAutoScroll(event.clientY);
    },

    handleBlockPointerUp(event, id) {
        if (this.touchBlockId !== id) return;

        // Re-evaluate the target at the exact release position. This covers
        // fast drags where the final pointermove event may not be delivered.
        if (this.touchMoved) {
            this.dragPointerX = event.clientX;
            this.dragPointerY = event.clientY;
            this.updateDropTarget(event.clientX, event.clientY);
        }

        const shouldMove = this.touchMoved && this.dropTargetId;
        const targetId = this.dropTargetId;
        const insertAfter = this.dropAfter;
        this.clearBlockPointer();

        if (shouldMove) {
            event.preventDefault();
            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('drop');
            }
            this.moveBlockBefore(id, targetId, insertAfter);
            this.selectedBlockId = null;
            this.renderBlockList();
            return;
        }

        this.selectBlock(id, true);
    },

    clearBlockPointer() {
        this.touchBlockId = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoved = false;
        this.dropTargetId = null;
        this.dropAfter = false;
        this.draggedBlockId = null;
        this.dragPointerX = 0;
        this.dragPointerY = 0;
        document.querySelectorAll('.code-block').forEach(block => block.classList.remove('dragging', 'drag-over'));
        this.removeDragGhost();
        this.stopAutoScroll();
    },

    updateDropTarget(clientX, clientY) {
        const sourceId = this.touchBlockId;
        const blocks = [...document.querySelectorAll('.code-block')]
            .filter(block => block.dataset.blockId !== sourceId);
        const hitTarget = document.elementFromPoint(clientX, clientY)?.closest('.code-block');
        let target = hitTarget?.dataset.blockId !== sourceId ? hitTarget : null;

        if (!target && blocks.length) {
            target = blocks.reduce((nearest, block) => {
                const nearestRect = nearest.getBoundingClientRect();
                const blockRect = block.getBoundingClientRect();
                const nearestDistance = Math.abs(clientY - (nearestRect.top + nearestRect.height / 2));
                const blockDistance = Math.abs(clientY - (blockRect.top + blockRect.height / 2));
                return blockDistance < nearestDistance ? block : nearest;
            });
        }

        const targetId = target?.dataset.blockId;
        document.querySelectorAll('.code-block.drag-over').forEach(block => block.classList.remove('drag-over'));

        if (targetId) {
            this.dropTargetId = targetId;
            const sourceIndex = this.blockOrder.indexOf(sourceId);
            const targetIndex = this.blockOrder.indexOf(targetId);
            // Dropping onto a block below moves after it; dropping onto a
            // block above moves before it. This prevents adjacent blocks
            // from being inserted back into their original position.
            this.dropAfter = sourceIndex < targetIndex;
            target.classList.add('drag-over');
        } else {
            this.dropTargetId = null;
            this.dropAfter = false;
        }
    },

    updateAutoScroll(pointerY) {
        const container = document.getElementById('page-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const threshold = 84;
        let speed = 0;

        if (pointerY < rect.top + threshold) {
            const intensity = (rect.top + threshold - pointerY) / threshold;
            speed = -Math.ceil(4 + intensity * 16);
        } else if (pointerY > rect.bottom - threshold) {
            const intensity = (pointerY - (rect.bottom - threshold)) / threshold;
            speed = Math.ceil(4 + intensity * 16);
        }

        this.autoScrollSpeed = speed;
        if (speed !== 0 && this.autoScrollFrame === null) this.autoScroll();
        if (speed === 0) this.stopAutoScroll();
    },

    autoScroll() {
        const container = document.getElementById('page-container');
        if (!container || !this.touchMoved || this.autoScrollSpeed === 0) {
            this.autoScrollFrame = null;
            return;
        }

        const previousTop = container.scrollTop;
        container.scrollTop += this.autoScrollSpeed;
        if (container.scrollTop === previousTop) {
            this.autoScrollFrame = null;
            return;
        }

        this.updateDropTarget(this.dragPointerX, this.dragPointerY);
        this.autoScrollFrame = requestAnimationFrame(() => this.autoScroll());
    },

    stopAutoScroll() {
        if (this.autoScrollFrame !== null) cancelAnimationFrame(this.autoScrollFrame);
        this.autoScrollFrame = null;
        this.autoScrollSpeed = 0;
    },

    createDragGhost(source, event) {
        if (!source || this.dragGhost) return;

        const rect = source.getBoundingClientRect();
        const ghost = source.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.classList.remove('selected', 'dragging', 'drag-over', 'correct');
        ghost.classList.add('drag-ghost');
        ghost.style.width = `${rect.width}px`;
        this.dragGhostOffsetX = event.clientX - rect.left;
        this.dragGhostOffsetY = event.clientY - rect.top;
        this.dragGhostX = event.clientX - this.dragGhostOffsetX;
        this.dragGhostY = event.clientY - this.dragGhostOffsetY;
        document.body.appendChild(ghost);
        this.dragGhost = ghost;
        this.animateDragGhost();
    },

    updateDragGhost(event) {
        if (!this.dragGhost) return;
        this.dragGhostX = event.clientX - this.dragGhostOffsetX;
        this.dragGhostY = event.clientY - this.dragGhostOffsetY;
    },

    animateDragGhost() {
        if (!this.dragGhost) return;
        const wiggle = Math.sin(performance.now() / 75) * 2.2;
        this.dragGhost.style.transform = `translate3d(${this.dragGhostX}px, ${this.dragGhostY}px, 0) rotate(${wiggle}deg) scale(1.03)`;
        this.dragGhostFrame = requestAnimationFrame(() => this.animateDragGhost());
    },

    removeDragGhost() {
        if (this.dragGhostFrame !== null) cancelAnimationFrame(this.dragGhostFrame);
        if (this.dragGhost) this.dragGhost.remove();
        this.dragGhost = null;
        this.dragGhostOffsetX = 0;
        this.dragGhostOffsetY = 0;
        this.dragGhostX = 0;
        this.dragGhostY = 0;
        this.dragGhostFrame = null;
    },

    handleBlockPointerCancel() {
        this.clearBlockPointer();
    },

    moveBlockBefore(sourceId, targetId, insertAfter = false) {
        this.blockOrder = this.blockOrder.filter(id => id !== sourceId);
        const targetIndex = this.blockOrder.indexOf(targetId);
        const insertIndex = targetIndex + (insertAfter ? 1 : 0);
        this.blockOrder.splice(insertIndex, 0, sourceId);
    },

    renderBlockList() {
        const list = document.getElementById('code-block-list');
        if (list) list.innerHTML = this.buildBlocksHTML();
    },

    renderIntoContainer(container, html) {
        const watermarks = container.querySelector('.code-watermarks');
        container.innerHTML = `${watermarks ? watermarks.outerHTML : ''}${html}`;
    },

    checkAnswer() {
        const exercise = this.exercises[this.currentIndex];
        const isCorrect = this.blockOrder.every((id, index) => id === exercise.correctOrder[index]);
        const feedback = document.getElementById('code-quiz-feedback');
        this.attempts++;

        if (!isCorrect) {
            this.selectedBlockId = null;
            this.draggedBlockId = null;
            this.clearBlockPointer();
            this.renderBlockList();

            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('wrong');
            }

            // Highlight blocks in wrong positions with red
            this.blockOrder.forEach((id, index) => {
                if (id !== exercise.correctOrder[index]) {
                    const el = document.getElementById(`code-block-${id}`);
                    if (el) el.classList.add('incorrect');
                }
            });

            // Remove incorrect highlights after a short delay so student can retry
            setTimeout(() => {
                document.querySelectorAll('.code-block.incorrect').forEach(el => el.classList.remove('incorrect'));
            }, 800);

            if (feedback) {
                feedback.className = 'code-quiz-feedback error';
                feedback.innerHTML = '<span class="material-icons-round">error_outline</span> Kode belum benar. Periksa susunan blok lalu Run Kode kembali sampai berhasil!';
            }
            this.updateRunStatus('error', 'Periksa susunan');

            if (this.attempts >= 3 && !this.studyPromptShown) {
                this.studyPromptShown = true;
                App.showStudyPrompt();
            }
            return;
        }

        this.completed = true;
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('correct');
        }
        const points = this.attempts === 1 ? 10 : this.attempts === 2 ? 8 : this.attempts === 3 ? 5 : 2;
        this.score += points;
        this.exerciseResults.push({
            title: exercise.title,
            attempts: this.attempts,
            points
        });
        document.querySelectorAll('.code-block').forEach(block => block.classList.add('correct'));

        if (feedback) {
            feedback.className = 'code-quiz-feedback success';
            feedback.innerHTML = `<span class="material-icons-round">check_circle</span> Susunan benar. +${points} skor dari percobaan ke-${this.attempts}.`;
        }
        this.updateRunStatus('success', 'Berhasil dijalankan');

        const preview = document.getElementById('code-preview');
        const frame = document.getElementById('code-preview-frame');
        if (preview) preview.hidden = false;
        if (frame) frame.srcdoc = this.getCurrentCode();

        const score = document.querySelector('.quiz-score');
        if (score) score.textContent = `Skor: ${this.score}`;

        const checkButton = document.getElementById('check-order-btn');
        const nextButton = document.getElementById('quiz-next-btn');
        if (checkButton) checkButton.disabled = true;
        if (nextButton) {
            nextButton.classList.remove('is-locked');
            nextButton.removeAttribute('aria-disabled');
        }
    },

    getCurrentCode() {
        const exercise = this.exercises[this.currentIndex];
        const rawCode = this.blockOrder
            .map(id => exercise.blocks.find(block => block.id === id).code)
            .join('\n');
        const defaultStyle = '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:12px;background:#ffffff;line-height:1.5;}h1,h2,h3,p{color:#0f172a;margin-top:0;margin-bottom:8px;}ul,ol{margin-top:0;margin-bottom:10px;padding-left:22px;}li{margin-bottom:4px;}table{border-collapse:collapse;width:100%;margin-top:4px;font-size:14px;}th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left;}th{background:#f1f5f9;font-weight:700;}</style>';
        if (rawCode.includes('<head>')) {
            return rawCode.replace('<head>', `<head>${defaultStyle}`);
        }
        return `${defaultStyle}${rawCode}`;
    },

    updateRunStatus(state, text) {
        const status = document.getElementById('code-run-status');
        if (!status) return;
        status.className = `code-run-status ${state}`;
        status.innerHTML = `<span></span>${text}`;
    },

    nextExercise() {
        if (!this.completed) {
            // Mainkan SFX denied saat ditekan sebelum selesai
            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('denied');
            }

            // Animasi getar / shake pada tombol
            const nextButton = document.getElementById('quiz-next-btn');
            if (nextButton) {
                nextButton.classList.remove('btn-shake');
                void nextButton.offsetWidth; // Reflow untuk memicu animasi
                nextButton.classList.add('btn-shake');
                setTimeout(() => nextButton.classList.remove('btn-shake'), 450);
            }

            // Pesan instruksi toast
            const message = this.attempts > 0
                ? 'Kode belum benar. Periksa susunan blok lalu Run Kode kembali sampai berhasil!'
                : 'Selesaikan susunan kode di atas untuk melanjutkan ke latihan berikutnya';

            App.showToast(message, 'warning', 'denied');

            // Beri petunjuk visual jika feedback belum ada
            const feedback = document.getElementById('code-quiz-feedback');
            if (feedback && !feedback.classList.contains('error') && !feedback.classList.contains('success')) {
                feedback.className = 'code-quiz-feedback error';
                feedback.innerHTML = '<span class="material-icons-round">info</span> Selesaikan susunan kode di atas untuk melanjutkan ke latihan berikutnya.';
            }

            return;
        }

        if (this.currentIndex < this.exercises.length - 1) {
            this.currentIndex++;
            this.startExercise();
            App.saveActiveRoute('quiz', {
                quizView: 'exercise',
                currentIndex: this.currentIndex,
                score: this.score,
                exerciseResults: this.exerciseResults
            });
            const container = document.getElementById('page-container');
            if (container) this.renderIntoContainer(container, this.buildExerciseHTML());
            return;
        }

        this.showResults();
    },

    restoreExercise(params) {
        this.sessionActive = true;
        this.exercises = FlashLearnData.getExercises();
        this.currentIndex = Math.min(Math.max(0, Number(params?.currentIndex) || 0), this.exercises.length - 1);
        this.score = Number(params?.score) || 0;
        this.exerciseResults = Array.isArray(params?.exerciseResults) ? params.exerciseResults : [];
        this.startExercise();
        const container = document.getElementById('page-container');
        if (container) this.renderIntoContainer(container, this.buildExerciseHTML());
    },

    restoreResults(params) {
        if (!this.exercises || !this.exercises.length) {
            this.exercises = FlashLearnData.getExercises();
        }
        if (params && (params.score !== undefined || params.exerciseResults)) {
            this.score = Number(params.score) || 0;
            this.exerciseResults = Array.isArray(params.exerciseResults) ? params.exerciseResults : [];
        } else {
            const last = this.getLastResult();
            if (last) {
                this.score = Number(last.score) || 0;
                this.exerciseResults = Array.isArray(last.exerciseResults) ? last.exerciseResults : [];
            }
        }
        this.showResults(true);
    },

    showResults(skipSave = false) {
        this.sessionActive = false;
        if (!this.exercises || !this.exercises.length) {
            this.exercises = FlashLearnData.getExercises();
        }
        const totalQuestions = this.exercises.length;
        const maxScore = totalQuestions * 10;
        const percent = Math.round((this.score / maxScore) * 100);

        let tierConfig;
        if (percent === 100) {
            tierConfig = {
                tierClass: 'score-tier--gold',
                shape: 'gold',
                icon: 'emoji_events',
                badgeIcon: 'workspace_premium',
                badge: 'Master HTML',
                subScore: 'Piala Emas',
                rankTag: 'Peringkat 1',
                kicker: 'Pencapaian Tertinggi',
                title: 'Sempurna!',
                message: 'Luar biasa! Kamu berhasil menyusun seluruh latihan kode HTML dengan sempurna dan rapi.',
                feedbackIcon: 'workspace_premium'
            };
        } else if (percent >= 80) {
            tierConfig = {
                tierClass: 'score-tier--silver',
                shape: 'silver',
                icon: 'workspace_premium',
                badgeIcon: 'military_tech',
                badge: 'Level Perak',
                subScore: 'Medali Perak',
                rankTag: 'Skor Tinggi',
                kicker: 'Hasil Membanggakan',
                title: 'Hebat Sekali!',
                message: 'Pemahaman struktur kodemu sudah sangat solid. Sedikit lagi menuju akurasi sempurna 100%!',
                feedbackIcon: 'military_tech'
            };
        } else if (percent >= 60) {
            tierConfig = {
                tierClass: 'score-tier--bronze',
                shape: 'bronze',
                icon: 'local_fire_department',
                badgeIcon: 'bolt',
                badge: 'Level Perunggu',
                subScore: 'Medali Perunggu',
                rankTag: 'Maju Pesat',
                kicker: 'Progres Mantap',
                title: 'Bagus!',
                message: 'Kamu sudah menguasai sebagian besar struktur dasar HTML. Terus berlatih agar makin terbiasa!',
                feedbackIcon: 'bolt'
            };
        } else {
            tierConfig = {
                tierClass: 'score-tier--starter',
                shape: 'starter',
                icon: 'school',
                badgeIcon: 'school',
                badge: 'Pejuang HTML',
                subScore: 'Lencana Latihan',
                rankTag: 'Berjuang',
                kicker: 'Tetap Semangat!',
                title: 'Ayo Belajar Lagi!',
                message: 'Jangan patah semangat. Buka kembali materi FlashLearn dan coba selesaikan latihannya lagi.',
                feedbackIcon: 'school'
            };
        }

        if (!skipSave) {
            App.saveScore(percent, this.score, maxScore);
            try {
                const resultData = JSON.stringify({
                    score: this.score,
                    maxScore: maxScore,
                    percent: percent,
                    exerciseResults: this.exerciseResults,
                    date: new Date().toISOString()
                });
                sessionStorage.setItem('flashlearn_quiz_last_result', resultData);
                localStorage.setItem('flashlearn_last_quiz_result', resultData);
            } catch (e) { }
        }
        App.saveActiveRoute('quiz', {
            quizView: 'result',
            score: this.score,
            exerciseResults: this.exerciseResults
        });

        const container = document.getElementById('page-container');
        if (!container) return;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('victory');
        }

        this.renderIntoContainer(container, `
            <div class="page quiz-result">
                <div class="result-confetti" aria-hidden="true">
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                </div>

                <div class="result-hero ${tierConfig.tierClass}">
                    <div class="result-trophy-stage">
                        <div class="result-trophy-halo" aria-hidden="true"></div>

                        <div class="result-trophy-emblem trophy-shape--${tierConfig.shape}" aria-hidden="true">
                            <span class="material-icons-round result-trophy-icon">${tierConfig.icon}</span>
                            <div class="result-trophy-sparkles">
                                <span class="sparkle-star s1">✦</span>
                                <span class="sparkle-star s2">★</span>
                                <span class="sparkle-star s3">✦</span>
                            </div>
                        </div>

                        <div class="trophy-ground-shadow" aria-hidden="true"></div>
                    </div>

                    <div class="result-tier-banner">
                        <span class="material-icons-round" aria-hidden="true">${tierConfig.badgeIcon}</span>
                        <span>${tierConfig.badge}</span>
                    </div>

                    <span class="result-kicker">
                        <span class="material-icons-round kicker-icon">auto_awesome</span>
                        ${tierConfig.kicker}
                    </span>
                    <h2 class="result-title">${tierConfig.title}</h2>
                </div>

                <div class="result-score-card">
                    <div class="result-score-ring-wrap">
                        <div class="result-score-ring ${tierConfig.tierClass}" style="--score: ${percent}">
                            <div class="result-score-ring-center">
                                <span class="result-score-number">${percent}%</span>
                                <span class="result-score-label">Akurasi</span>
                            </div>
                        </div>
                    </div>

                    <div class="result-stats-grid">
                        <div class="result-stat-chip">
                            <div class="stat-chip-icon score-icon">
                                <span class="material-icons-round">bolt</span>
                            </div>
                            <div class="stat-chip-content">
                                <strong>${this.score} <span class="stat-max">/ ${maxScore}</span></strong>
                                <small>Skor Diperoleh</small>
                            </div>
                        </div>
                        <div class="result-stat-chip">
                            <div class="stat-chip-icon status-icon">
                                <span class="material-icons-round">${tierConfig.badgeIcon}</span>
                            </div>
                            <div class="stat-chip-content">
                                <strong>${tierConfig.badge}</strong>
                                <small>Peringkat Latihan</small>
                            </div>
                        </div>
                    </div>

                    <div class="result-message-box">
                        <span class="material-icons-round result-message-icon">${tierConfig.feedbackIcon}</span>
                        <p class="result-message">${tierConfig.message}</p>
                    </div>
                </div>

                <section class="result-breakdown-card" aria-label="Ringkasan per soal">
                    <div class="result-breakdown-header">
                        <div class="result-breakdown-title-group">
                            <span class="material-icons-round result-breakdown-icon">fact_check</span>
                            <h3 class="result-breakdown-heading">Ringkasan Latihan</h3>
                        </div>
                        <span class="result-breakdown-count">${this.exerciseResults.length} Soal</span>
                    </div>

                    <div class="result-breakdown-list">
                        ${this.exerciseResults.map((result, index) => {
            const isFirstAttempt = result.attempts === 1;
            return `
                            <div class="result-breakdown-item ${isFirstAttempt ? 'is-first-try' : 'is-multi-try'}">
                                <div class="breakdown-item-index">${index + 1}</div>
                                <div class="breakdown-item-info">
                                    <span class="breakdown-item-title">${this.escapeHtml(result.title)}</span>
                                    <div class="breakdown-item-sub">
                                        <span class="breakdown-pill ${isFirstAttempt ? 'pill-success' : 'pill-warning'}">
                                            <span class="material-icons-round">${isFirstAttempt ? 'done_all' : 'replay'}</span>
                                            ${isFirstAttempt ? '1x percobaan' : `${result.attempts}x percobaan`}
                                        </span>
                                    </div>
                                </div>
                                <div class="breakdown-item-points">
                                    <span class="points-pill">+${result.points}</span>
                                </div>
                            </div>
                            `;
        }).join('')}
                    </div>
                </section>

                <div class="result-actions" role="group" aria-label="Aksi hasil latihan">
                    <button id="result-retry-btn" class="btn btn-primary result-retry-button" type="button" onclick="QuizPage.begin()" aria-label="Coba latihan lagi">
                        <span class="material-icons-round btn-icon" aria-hidden="true">replay</span>
                        <span>Coba Lagi</span>
                    </button>
                    <button id="result-intro-btn" class="btn btn-secondary result-home-button" type="button" onclick="QuizPage.renderIntroView()" aria-label="Kembali ke menu awal latihan">
                        <span class="material-icons-round btn-icon" aria-hidden="true">arrow_back</span>
                        <span>Menu Latihan</span>
                    </button>
                </div>

                <div class="result-scroll-spacer" aria-hidden="true"></div>
            </div>
        `);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

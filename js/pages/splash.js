/**
 * Splash Screen Module
 */
const SplashPage = {
    init() {
        this.createSymbols();
        this.createParticles();
    },

    createSymbols() {
        const container = document.getElementById('splash-symbols');
        if (!container) return;

        const symbols = ['<', '>', '{', '}', '/', '=', ';', '*', '#'];
        const columns = [8, 27, 47, 68, 88];
        const rows = [8, 24, 40, 56, 72, 88];

        rows.forEach((top, row) => {
            columns.forEach((left, column) => {
                const index = row * columns.length + column;
                const symbol = document.createElement('span');
                const horizontalOffset = ((row * 3 + column * 5) % 5) - 2;
                const verticalOffset = ((row * 7 + column * 2) % 5) - 2;

                symbol.className = 'splash-symbol';
                symbol.textContent = symbols[(row * 3 + column * 5) % symbols.length];
                symbol.style.left = `${left + horizontalOffset}%`;
                symbol.style.top = `${top + verticalOffset}%`;
                symbol.style.setProperty('--symbol-size', `${16 + (index % 4) * 5}px`);
                symbol.style.setProperty('--symbol-rotation', `${((index * 17) % 54) - 27}deg`);
                symbol.style.setProperty('--symbol-opacity', `${0.1 + (index % 4) * 0.025}`);
                container.appendChild(symbol);
            });
        });
    },

    createParticles() {
        const container = document.getElementById('splash-particles');
        if (!container) return;

        const codeParticles = ['<', '>', '{', '}', '/', ';'];
        const particlePositions = [5, 17, 30, 43, 56, 69, 82, 94, 12, 36, 61, 87];
        particlePositions.forEach((left, i) => {
            const particle = document.createElement('span');
            particle.className = 'particle';
            particle.textContent = codeParticles[i % codeParticles.length];
            particle.style.left = `${left}%`;
            particle.style.animationDelay = `${(i % 5) * 0.55}s`;
            particle.style.animationDuration = `${4.5 + (i % 3) * 0.8}s`;
            particle.style.setProperty('--particle-scale', `${0.8 + (i % 3) * 0.18}`);
            container.appendChild(particle);
        });
    },

    hide(callback) {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;

        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.classList.add('hidden');
            if (callback) callback();
        }, 600);
    }
};

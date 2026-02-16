document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const trackerList = document.getElementById('trackerList');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.querySelector('.close');
    const saveSettings = document.getElementById('saveSettings');
    const startDateInput = document.getElementById('startDate');
    
    // Stats Elements
    const totalFastingEl = document.getElementById('totalFasting');
    const daysRemainingEl = document.getElementById('daysRemaining');
    const progressValueEl = document.querySelector('.value-container');
    const circularProgress = document.querySelector('.circular-progress');

    // State
    let ramadanData = JSON.parse(localStorage.getItem('ramadanData')) || {};
    let settings = JSON.parse(localStorage.getItem('ramadanSettings')) || {
        startDate: '2026-03-01' // Default estimate
    };

    // Initialize
    startDateInput.value = settings.startDate;
    renderTracker();
    updateStats();

    // Event Listeners
    settingsBtn.onclick = () => settingsModal.style.display = "block";
    closeModal.onclick = () => settingsModal.style.display = "none";
    window.onclick = (e) => { if(e.target == settingsModal) settingsModal.style.display = "none"; }

    saveSettings.onclick = () => {
        settings.startDate = startDateInput.value;
        localStorage.setItem('ramadanSettings', JSON.stringify(settings));
        // Reset or keep data? Let's keep but recalculate dates
        renderTracker();
        settingsModal.style.display = "none";
    };

    function renderTracker() {
        trackerList.innerHTML = '';
        const start = new Date(settings.startDate);

        for (let i = 1; i <= 30; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + (i - 1));
            const dateString = currentDate.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const dayKey = `day_${i}`;
            const data = ramadanData[dayKey] || {
                fasting: false,
                prayers: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
                habits: { quran: false, tarawih: false, sedekah: false, dzikir: false },
                haid: false
            };

            const card = document.createElement('div');
            card.className = `glass-card day-card ${data.haid ? 'haid-active' : ''}`;
            card.innerHTML = `
                <div class="card-header">
                    <div class="day-title">
                        <h3>Hari ke-${i}</h3>
                        <p class="day-date">${dateString}</p>
                    </div>
                </div>

                <div class="track-section">
                    <h4><i class="fas fa-moon"></i> Ibadah Utama</h4>
                    <div class="check-grid">
                        <label class="check-item">
                            <input type="checkbox" data-day="${i}" data-type="fasting" ${data.fasting ? 'checked' : ''} ${data.haid ? 'disabled' : ''}>
                            Puasa
                        </label>
                    </div>
                </div>

                <div class="track-section">
                    <h4><i class="fas fa-pray"></i> Sholat 5 Waktu</h4>
                    <div class="check-grid">
                        ${['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map(p => `
                            <label class="check-item">
                                <input type="checkbox" data-day="${i}" data-type="prayers" data-key="${p}" ${data.prayers[p] ? 'checked' : ''} ${data.haid ? 'disabled' : ''}>
                                ${p.charAt(0).toUpperCase() + p.slice(1)}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="track-section">
                    <h4><i class="fas fa-star"></i> Kebiasaan Baik</h4>
                    <div class="check-grid">
                        ${['quran', 'tarawih', 'sedekah', 'dzikir'].map(h => `
                            <label class="check-item">
                                <input type="checkbox" data-day="${i}" data-type="habits" data-key="${h}" ${data.habits[h] ? 'checked' : ''}>
                                ${h.charAt(0).toUpperCase() + h.slice(1)}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="haid-toggle">
                    <label class="switch">
                        <input type="checkbox" data-day="${i}" data-type="haid" ${data.haid ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <label>Lagi Haid (Tidak Puasa/Sholat)</label>
                </div>
            `;
            trackerList.appendChild(card);
        }

        // Add event listeners to NEW checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.onchange = handleTrack;
        });
    }

    function handleTrack(e) {
        const day = e.target.dataset.day;
        const type = e.target.dataset.type;
        const key = e.target.dataset.key;
        const dayKey = `day_${day}`;

        if (!ramadanData[dayKey]) {
            ramadanData[dayKey] = {
                fasting: false,
                prayers: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
                habits: { quran: false, tarawih: false, sedekah: false, dzikir: false },
                haid: false
            };
        }

        if (type === 'haid') {
            ramadanData[dayKey].haid = e.target.checked;
            if (e.target.checked) {
                // If haid, automatically uncheck fasting and prayers
                ramadanData[dayKey].fasting = false;
                Object.keys(ramadanData[dayKey].prayers).forEach(p => ramadanData[dayKey].prayers[p] = false);
            }
            // Re-render this specific card or all for simplicity? All is easier for state consistency.
            renderTracker();
        } else if (type === 'prayers' || type === 'habits') {
            ramadanData[dayKey][type][key] = e.target.checked;
        } else {
            ramadanData[dayKey][type] = e.target.checked;
        }

        localStorage.setItem('ramadanData', JSON.stringify(ramadanData));
        updateStats();
    }

    function updateStats() {
        let finishedFasting = 0;
        let totalDays = 30;
        let completedDays = 0;

        for (let i = 1; i <= 30; i++) {
            const d = ramadanData[`day_${i}`];
            if (d && d.fasting) finishedFasting++;
            
            // For general progress, let's say a day is "done" if either they fasted or were haid (marking time passing)
            // Or better, just count total fasting days.
            if (d && (d.fasting || d.haid)) completedDays++; 
        }

        totalFastingEl.innerText = finishedFasting;
        
        // Progress percentage based on how many days we've "interacted" with or are in the past
        const today = new Date();
        const start = new Date(settings.startDate);
        const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
        const currentDayIndex = Math.max(1, Math.min(30, diffDays));
        
        daysRemainingEl.innerText = Math.max(0, 30 - currentDayIndex);

        const progressPercent = Math.round((currentDayIndex / 30) * 100);
        progressValueEl.innerText = `${progressPercent}%`;
        circularProgress.style.background = `conic-gradient(var(--primary) ${progressPercent * 3.6}deg, var(--glass-border) 0deg)`;
    }
});

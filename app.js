let habits = JSON.parse(localStorage.getItem('glow_habits')) || [];

function renderHabits() {
    const list = document.getElementById('habits-list');
    list.innerHTML = '';

    if (habits.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 50px;">Нет привычек. Нажмите + чтобы добавить.</p>';
        return;
    }

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.id = `card-${habit.id}`;

        let statusText = '';
        let btnHtml = '';

        if (habit.type === 'bool') {
            const percent = habit.current === 1 ? 100 : 0;
            const isActive = habit.current === 1 ? 'active' : '';
            btnHtml = `
                <button class="action-btn ${isActive}" onclick="toggleBool('${habit.id}')">
                    <div class="btn-bg"></div>
                    <div class="btn-progress" style="--fill: ${percent}%"></div>
                    <div class="btn-inner"><i class="fas fa-check btn-content"></i></div>
                </button>
            `;
        } 
        else if (habit.type === 'count') {
            let percent = (habit.current / habit.target) * 100;
            const isActive = habit.current > 0 ? 'active' : '';
            btnHtml = `
                <button class="action-btn ${isActive}" onclick="incrementCount('${habit.id}')">
                    <div class="btn-bg"></div>
                    <div class="btn-progress" style="--fill: ${percent}%"></div>
                    <div class="btn-inner"><span class="btn-content">${habit.current}/${habit.target}</span></div>
                </button>
            `;
        } 
        else if (habit.type === 'timer') {
            let totalTime = habit.target * 60;
            let percent = totalTime > 0 ? ((totalTime - habit.timeLeft) / totalTime) * 100 : 0;
            
            const isActive = (habit.isRunning || habit.timeLeft < totalTime) ? 'active' : '';
            const isFull = percent >= 100 ? 'full' : '';
            
            statusText = habit.isRunning ? `Осталось: ${habit.timeLeft} сек.` : (percent >= 100 ? 'Выполнено' : `Цель: ${habit.target} мин.`);
            
            btnHtml = `
                <button class="action-btn btn-timer ${isActive} ${isFull}" id="btn-${habit.id}" onclick="toggleTimer('${habit.id}')">
                    <div class="btn-bg"></div>
                    <div class="btn-progress" id="progress-${habit.id}" style="--fill: ${percent}%"></div>
                    <div class="btn-inner"><i class="fas ${habit.isRunning ? 'fa-pause' : 'fa-play'} btn-content"></i></div>
                </button>
            `;
        }

        card.innerHTML = `
            <div class="habit-info">
                <h3>${habit.name}</h3>
                <p>${habit.desc || ''}</p>
                ${statusText ? `<span class="habit-status" id="status-${habit.id}">${statusText}</span>` : ''}
            </div>
            ${btnHtml}
        `;
        list.appendChild(card);
    });
}

function saveHabits() {
    const toSave = habits.map(h => {
        let copy = {...h};
        delete copy.intervalId;
        return copy;
    });
    localStorage.setItem('glow_habits', JSON.stringify(toSave));
}

function openModal() { document.getElementById('habit-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('habit-modal').style.display = 'none'; }

function toggleFormFields() {
    const type = document.getElementById('habit-type').value;
    document.getElementById('count-fields').classList.toggle('hidden', type !== 'count');
    document.getElementById('timer-fields').classList.toggle('hidden', type !== 'timer');
}

function addHabit() {
    const name = document.getElementById('habit-name').value.trim();
    const desc = document.getElementById('habit-desc').value.trim();
    const type = document.getElementById('habit-type').value;
    const target = type === 'count' ? parseInt(document.getElementById('habit-target').value) : (type === 'timer' ? parseInt(document.getElementById('habit-time').value) : 1);

    if (!name) { alert('Введите название!'); return; }

    const newHabit = {
        id: Date.now().toString(),
        name: name,
        desc: desc,
        type: type,
        target: target,
        current: 0,
        timeLeft: target * 60,
        isRunning: false
    };

    habits.push(newHabit);
    saveHabits();
    renderHabits();
    closeModal();

    document.getElementById('habit-name').value = '';
    document.getElementById('habit-desc').value = '';
}

function toggleBool(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.current = habit.current === 1 ? 0 : 1;
        saveHabits();
        renderHabits();
    }
}

function incrementCount(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.current += 1;
        if (habit.current > habit.target) {
            habit.current = 0; 
        }
        saveHabits();
        renderHabits();
    }
}

function toggleTimer(id) {
    let habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.isRunning) {
        clearInterval(habit.intervalId);
        habit.isRunning = false;
        saveHabits();
        renderHabits();
    } else {
        habit.isRunning = true;
        
        if (habit.timeLeft <= 0) habit.timeLeft = habit.target * 60;

        habit.intervalId = setInterval(() => {
            habit.timeLeft--;
            
            const statusEl = document.getElementById(`status-${habit.id}`);
            const progressEl = document.getElementById(`progress-${habit.id}`);
            const btnEl = document.getElementById(`btn-${habit.id}`);
            
            let totalTime = habit.target * 60;
            let percent = ((totalTime - habit.timeLeft) / totalTime) * 100;

            if (statusEl) {
                const min = Math.floor(habit.timeLeft / 60);
                const sec = habit.timeLeft % 60;
                statusEl.innerText = `Осталось: ${min}:${sec < 10 ? '0' : ''}${sec}`;
            }
            if (progressEl) {
                progressEl.style.setProperty('--fill', `${percent}%`);
            }
            if (btnEl) {
                if (!btnEl.classList.contains('active')) btnEl.classList.add('active');
                if (percent >= 100) {
                    btnEl.classList.add('full');
                }
            }

            if (habit.timeLeft <= 0) {
                clearInterval(habit.intervalId);
                habit.isRunning = false;
                habit.timeLeft = 0;
                saveHabits();
                renderHabits();
                alert(`Привычка "${habit.name}" выполнена!`);
            }
        }, 1000);
    }
    renderHabits();
}

// --- МАГИЯ АНИМАЦИИ НАЖАТИЯ ---
// Слушаем начало нажатия (палец или мышь) на любые кнопки
document.addEventListener('pointerdown', (e) => {
    // Ищем ближайшую кнопку, по которой кликнули
    const btn = e.target.closest('.action-btn, .fab, .btn-submit, .close-modal');
    if (btn) {
        // Убираем класс, чтобы сбросить анимацию, если она уже была
        btn.classList.remove('animate-pop');
        // Форсируем перерасчет стилей (магия для перезапуска анимации)
        void btn.offsetWidth; 
        // Добавляем класс обратно
        btn.classList.add('animate-pop');
    }
});

// Когда анимация заканчивается, убираем класс
document.addEventListener('animationend', (e) => {
    if (e.animationName === 'pressPop') {
        e.target.classList.remove('animate-pop');
    }
});

renderHabits();
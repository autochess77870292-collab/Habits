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
        card.className = `habit-card ${habit.isRunning ? 'active' : ''}`;
        card.id = `card-${habit.id}`;

        let statusText = '';
        let btnHtml = '';

        if (habit.type === 'bool') {
            btnHtml = `<button class="action-btn btn-bool ${habit.current === 1 ? 'completed' : ''}" onclick="toggleBool('${habit.id}')"><i class="fas fa-check"></i></button>`;
        } 
        else if (habit.type === 'count') {
            btnHtml = `<button class="action-btn btn-count" onclick="incrementCount('${habit.id}')">${habit.current}/${habit.target}</button>`;
        } 
        else if (habit.type === 'timer') {
            statusText = habit.isRunning ? `Осталось: ${habit.timeLeft} сек.` : `Цель: ${habit.target} мин.`;
            btnHtml = `<button class="action-btn btn-timer" onclick="toggleTimer('${habit.id}')"><i class="fas ${habit.isRunning ? 'fa-pause' : 'fa-play'}"></i></button>`;
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
    } else {
        habit.isRunning = true;
        
        if (habit.timeLeft <= 0) habit.timeLeft = habit.target * 60;

        habit.intervalId = setInterval(() => {
            habit.timeLeft--;
            
            const statusEl = document.getElementById(`status-${habit.id}`);
            if (statusEl) {
                const min = Math.floor(habit.timeLeft / 60);
                const sec = habit.timeLeft % 60;
                statusEl.innerText = `Осталось: ${min}:${sec < 10 ? '0' : ''}${sec}`;
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

renderHabits();
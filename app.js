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
            const isActive = habit.current === 1 ? 'active' : '';
            btnHtml = `<button class="action-btn btn-bool ${isActive}" onclick="toggleBool('${habit.id}')"><i class="fas fa-check"></i></button>`;
        } 
        else if (habit.type === 'count') {
            // Считаем процент заполнения
            let percent = (habit.current / habit.target) * 100;
            // Если прогресс есть, кнопка активна (светится)
            const isActive = habit.current > 0 ? 'active' : '';
            // Передаем процент через inline-стиль --fill
            btnHtml = `<button class="action-btn btn-count btn-fill ${isActive}" style="--fill: ${percent}%" onclick="incrementCount('${habit.id}')">${habit.current}/${habit.target}</button>`;
        } 
        else if (habit.type === 'timer') {
            // Считаем процент прошедшего времени
            let totalTime = habit.target * 60;
            let percent = totalTime > 0 ? ((totalTime - habit.timeLeft) / totalTime) * 100 : 0;
            // Кнопка активна, если таймер запущен или уже есть какой-то прогресс
            const isActive = (habit.isRunning || habit.timeLeft < totalTime) ? 'active' : '';
            
            statusText = habit.isRunning ? `Осталось: ${habit.timeLeft} сек.` : `Цель: ${habit.target} мин.`;
            btnHtml = `<button class="action-btn btn-timer btn-fill ${isActive}" id="btn-${habit.id}" style="--fill: ${percent}%" onclick="toggleTimer('${habit.id}')"><i class="fas ${habit.isRunning ? 'fa-pause' : 'fa-play'}"></i></button>`;
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
            habit.current = 0; // Сброс
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
    } else {
        habit.isRunning = true;
        
        if (habit.timeLeft <= 0) habit.timeLeft = habit.target * 60;

        habit.intervalId = setInterval(() => {
            habit.timeLeft--;
            
            // Обновляем текст и заливку в реальном времени
            const statusEl = document.getElementById(`status-${habit.id}`);
            const btnEl = document.getElementById(`btn-${habit.id}`);
            
            let totalTime = habit.target * 60;
            let percent = ((totalTime - habit.timeLeft) / totalTime) * 100;

            if (statusEl) {
                const min = Math.floor(habit.timeLeft / 60);
                const sec = habit.timeLeft % 60;
                statusEl.innerText = `Осталось: ${min}:${sec < 10 ? '0' : ''}${sec}`;
            }
            if (btnEl) {
                btnEl.style.setProperty('--fill', `${percent}%`);
                if (percent > 0) btnEl.classList.add('active');
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
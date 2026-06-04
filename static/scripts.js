const sealsData = [
    { id: "SEAL-209", x: 87, y: 81, population: 140, gender: "55M / 45F", age: "6 years", area: "3L (NAFO) - Avalon Peninsula", meal: "Capelin", otolith: 2.2 },
    { id: "SEAL-540", x: 38, y: 28, population: 45,  gender: "30M / 70F", age: "2 years", area: "2H (NAFO) - Nain", meal: "Sand Lance", otolith: 0.8 },
    { id: "SEAL-112", x: 42, y: 51, population: 90,  gender: "50M / 50F", age: "11 years", area: "2J (NAFO) - Goose Bay", meal: "Atlantic Cod", otolith: 3.5 },
    { id: "SEAL-804", x: 62, y: 61, population: 15,  gender: "80M / 20F", age: "1 year", area: "4R (NAFO) - Northern Peninsula", meal: "Crustaceans", otolith: 0.4 },
    { id: "SEAL-301", x: 70, y: 84, population: 110, gender: "45M / 55F", age: "8 years", area: "3Ps (NAFO) - Placentia Bay", meal: "Redfish", otolith: 1.9 }
];

let viewport, canvas, clickPrompt;
let isDragging = false;
let startY, scrollTop;
let promptDismissed = false;

//dragging
function setupDragToPan() {
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        viewport.style.cursor = 'grabbing';
        startY = e.clientY; // Uses window position
        scrollTop = viewport.scrollTop;
        e.preventDefault(); // Stops text and native browser ghost drag interference
    });

    // Tracking globally on the window object prevents scroll locks when cursor exits the map frame
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            viewport.style.cursor = 'grab';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const y = e.clientY;
        const walkY = y - startY; // distance from start
        viewport.scrollTop = scrollTop - walkY;
    });
}

//icons
function renderInterface() {
    const markers = canvas.querySelectorAll('.seal-icon-wrapper');
    markers.forEach(m => m.remove());

    sealsData.forEach(seal => {
        const wrapper = document.createElement('div');
        wrapper.className = 'seal-icon-wrapper';
        
        // Position on the map
        wrapper.style.left = `${seal.x}%`;
        wrapper.style.top = `${seal.y}%`;

        const baseSize = 40; 
        const scaleModifier = Math.min(Math.max(seal.population * 0.3, 10), 50);
        const size = baseSize + scaleModifier;

        wrapper.innerHTML = `
            <div class="seal-icon-image" style="width: ${size}px; height: ${size}px;">
                <img src="/static/images/Seal%20Icon.png" alt="seal">
            </div>
            <div class="seal-label">${seal.id}</div>
        `;

        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSeal(seal);
        });

        canvas.appendChild(wrapper);
    });

    const listContainer = document.getElementById('index-list-container');
    listContainer.innerHTML = '';
    sealsData.forEach(seal => {
        const item = document.createElement('div');
        item.className = 'index-list-item';
        item.innerHTML = `<strong>${seal.id}</strong> — Age: ${seal.age}, Area: ${seal.area}`;
        item.addEventListener('click', () => selectSeal(seal));
        listContainer.appendChild(item);
    });

    positionHelperPrompt();
}

//tooltip helper
function positionHelperPrompt() {
    if (promptDismissed || sealsData.length === 0) return;
    const viewCenterX = 50;
    const viewCenterY = 50;

    let closestSeal = null;
    let shortestDistance = Infinity;

    sealsData.forEach(seal => {
        const dx = seal.x - viewCenterX;
        const dy = seal.y - viewCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closestSeal = seal;
        }
    });

    if (closestSeal) {
        clickPrompt.style.left = `${closestSeal.x}%`;
        clickPrompt.style.top = `${closestSeal.y}%`;
        clickPrompt.style.display = 'block';
    }
}

//details
function selectSeal(seal) {
    promptDismissed = true;
    clickPrompt.style.display = 'none';

    document.getElementById('side-title').innerText = `${seal.id} Profile`;
    document.getElementById('side-pop').innerText = seal.population;
    document.getElementById('side-gender').innerText = seal.gender;
    document.getElementById('side-age').innerText = seal.age;

    const detailIdEl = document.getElementById('detail-id');
    if (detailIdEl) detailIdEl.innerText = seal.id;
    
    document.getElementById('detail-age').innerText = seal.age;
    document.getElementById('detail-location').innerText = seal.area;
    document.getElementById('detail-meal').innerText = seal.meal;

    const preyVisual = document.getElementById('prey-visual');
    const scale = Math.min(Math.max(seal.otolith * 0.7, 0.5), 3.0);
    preyVisual.style.transform = `scale(${scale})`;
}

//init
function init() {
    viewport = document.getElementById('map-viewport');
    canvas = document.getElementById('map-canvas');
    clickPrompt = document.getElementById('click-prompt');

    if (viewport && canvas && clickPrompt) {
        setupDragToPan();
        renderInterface();
        viewport.scrollTop = 350; // Map starting position
    }
}

// Guard against executing before ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('resize', () => {
    if (clickPrompt) positionHelperPrompt();
});
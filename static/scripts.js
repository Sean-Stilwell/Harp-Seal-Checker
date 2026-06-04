// Map position 
const sealsData = [
    { id: "SEAL-209", x: 45, y: 50, population: 140, gender: "55M / 45F", age: "6 years", area: "3L (NAFO)", meal: "Capelin", otolith: 2.2 },
    { id: "SEAL-540", x: 65, y: 35, population: 45,  gender: "30M / 70F", age: "2 years", area: "3K (NAFO)", meal: "Sand Lance", otolith: 0.8 },
    { id: "SEAL-112", x: 50, y: 75, population: 90,  gender: "50M / 50F", age: "11 years", area: "2J (NAFO)", meal: "Atlantic Cod", otolith: 3.5 },
    { id: "SEAL-804", x: 80, y: 60, population: 15,  gender: "80M / 20F", age: "1 year", area: "4R (NAFO)", meal: "Crustaceans", otolith: 0.4 },
    { id: "SEAL-301", x: 35, y: 65, population: 110, gender: "45M / 55F", age: "8 years", area: "3Ps (NAFO)", meal: "Redfish", otolith: 1.9 }
];

const viewport = document.getElementById('map-viewport');
const canvas = document.getElementById('map-canvas');
const clickPrompt = document.getElementById('click-prompt');

let promptDismissed = false;

//Icon Rendering 
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
                <img src="/home/hamsamm/Harp-Seal-Checker/images/Seal Icon.png" alt="seal">
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

//Tooltip
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

//Details
function selectSeal(seal) {
    promptDismissed = true;
    clickPrompt.style.display = 'none';

    document.getElementById('side-title').innerText = `${seal.id} Profile`;
    document.getElementById('side-pop').innerText = seal.population;
    document.getElementById('side-gender').innerText = seal.gender;
    document.getElementById('side-age').innerText = seal.age;

    document.getElementById('detail-id').innerText = seal.id;
    document.getElementById('detail-age').innerText = seal.age;
    document.getElementById('detail-location').innerText = seal.area;
    document.getElementById('detail-meal').innerText = seal.meal;

    const preyVisual = document.getElementById('prey-visual');
    const scale = Math.min(Math.max(seal.otolith * 0.7, 0.5), 3.0);
    preyVisual.style.transform = `scale(${scale})`;
}

renderInterface();
window.addEventListener('resize', positionHelperPrompt); //Window size
// Coordinate to xy
const SealLocator = {
    // Math constants from Springdale & Grand Falls-Windsor
    SCALE_X: 56.956070,
    OFFSET_X: 3960.455054,
    SCALE_Y: -83.078500,
    OFFSET_Y: 5284.300196,

    /**
     * Translates geographical coordinates (Lat, Lon) into map pixel values (X, Y).
     * @param {number} lat - Latitude of the point.
     * @param {number} lon - Longitude of the point.
     * @returns {{x: number, y: number}} - Pixel coordinates on the map canvas.
     */
    getPixels(lat, lon) {
        return {
            x: (this.SCALE_X * lon) + this.OFFSET_X,
            y: (this.SCALE_Y * lat) + this.OFFSET_Y
        };
    }
};


// --- Seal Data (now using Lat/Lon instead of % X/Y) ---
const sealsData = [
    // 3L (Avalon Peninsula) St. John's
    { id: "SEAL-209", lat: 47.56, lon: -52.71, population: 140, gender: "55M / 45F", age: "6 years", area: "3L (NAFO) - Avalon Peninsula", meal: "Capelin", otolith: 2.2 },
    // 2H (Nain) Nain
    { id: "SEAL-540", lat: 56.54, lon: -61.69, population: 45,  gender: "30M / 70F", age: "2 years", area: "2H (NAFO) - Nain", meal: "Sand Lance", otolith: 0.8 },
    // 2J (Goose Bay) Goose Bay
    { id: "SEAL-112", lat: 53.30, lon: -60.33, population: 90,  gender: "50M / 50F", age: "11 years", area: "2J (NAFO) - Goose Bay", meal: "Atlantic Cod", otolith: 3.5 },
    // 4R (Northern Peninsula) St. Anthony
    { id: "SEAL-804", lat: 51.37, lon: -55.60, population: 15,  gender: "80M / 20F", age: "1 year", area: "4R (NAFO) - Northern Peninsula", meal: "Crustaceans", otolith: 0.4 },
    // 3Ps (Placentia Bay) Placentia
    { id: "SEAL-301", lat: 47.24, lon: -53.96, population: 110, gender: "45M / 55F", age: "8 years", area: "3Ps (NAFO) - Placentia Bay", meal: "Redfish", otolith: 1.9 }
];

let viewport, canvas, clickPrompt;
let isDragging = false;
let startX, startY;         // Track both X and Y starting click positions
let scrollLeft, scrollTop;  // Track both X and Y initial scroll offsets
let promptDismissed = false;

// dragging in 2D space
function setupDragToPan() {
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        viewport.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = viewport.scrollLeft;
        scrollTop = viewport.scrollTop;
        e.preventDefault(); // Prevents default text selections and standard browser ghost dragging
    });

    // Stops scrolling when out of map
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            viewport.style.cursor = 'grab';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX;
        const y = e.clientY;
        const walkX = x - startX; 
        const walkY = y - startY; 
        viewport.scrollLeft = scrollLeft - walkX;
        viewport.scrollTop = scrollTop - walkY;
    });
}

// icons
function renderInterface() {
    const markers = canvas.querySelectorAll('.seal-icon-wrapper');
    markers.forEach(m => m.remove());

    sealsData.forEach(seal => {
        const wrapper = document.createElement('div');
        wrapper.className = 'seal-icon-wrapper';
        
        // Position using pixel coordinates from SealLocator
        const pixelCoords = SealLocator.getPixels(seal.lat, seal.lon);
        wrapper.style.left = `${pixelCoords.x}px`;
        wrapper.style.top = `${pixelCoords.y}px`;

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
    if (listContainer) {
        listContainer.innerHTML = '';
        sealsData.forEach(seal => {
            const item = document.createElement('div');
            item.className = 'index-list-item';
            item.innerHTML = `<strong>${seal.id}</strong> — Age: ${seal.age}, Area: ${seal.area}`;
            item.addEventListener('click', () => selectSeal(seal));
            listContainer.appendChild(item);
        });
    }

    positionHelperPrompt();
}

// tooltip helper
function positionHelperPrompt() {
    if (promptDismissed || sealsData.length === 0) return;

    // Get canvas dimensions to find its center in pixels
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    let closestSeal = null;
    let shortestDistance = Infinity;

    sealsData.forEach(seal => {
        const pixelCoords = SealLocator.getPixels(seal.lat, seal.lon);
        const dx = pixelCoords.x - canvasCenterX;
        const dy = pixelCoords.y - canvasCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closestSeal = seal;
        }
    });

    if (closestSeal && clickPrompt) {
        const closestSealPixels = SealLocator.getPixels(closestSeal.lat, closestSeal.lon);
        clickPrompt.style.left = `${closestSealPixels.x}px`;
        clickPrompt.style.top = `${closestSealPixels.y}px`;
        clickPrompt.style.display = 'block';
    }
}

// details
function selectSeal(seal) {
    promptDismissed = true;
    if (clickPrompt) clickPrompt.style.display = 'none';

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
    if (preyVisual) {
        const scale = Math.min(Math.max(seal.otolith * 0.7, 0.5), 3.0);
        preyVisual.style.transform = `scale(${scale})`;
    }
}

// init
function init() {
    viewport = document.getElementById('map-viewport');
    canvas = document.getElementById('map-canvas');
    clickPrompt = document.getElementById('click-prompt');

    if (viewport && canvas && clickPrompt) {
        setupDragToPan();
        renderInterface();
        
        // These are initial scroll positions in pixels for the map viewer
        viewport.scrollTop = 450; 
        viewport.scrollLeft = 150;
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
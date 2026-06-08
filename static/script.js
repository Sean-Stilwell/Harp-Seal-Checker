// Globally-exposed callback for the Folium map within the iframe
window.selectSealFromMap = function(zoneCode) {
    if (typeof sealsData !== 'undefined') {
        const seal = sealsData.find(s => s.nafo_zone === zoneCode);
        if (seal) {
            selectSeal(seal);
        }
    }
};

let ratioChartInstance = null;
let stomachChartInstance = null;

// Populate list index
function renderInterface() {
    renderInterfaceFiltered(sealsData);
}

function renderInterfaceFiltered(filteredList) {
    const listContainer = document.getElementById('index-list-container');
    if (listContainer && typeof sealsData !== 'undefined') {
        listContainer.innerHTML = '';
        filteredList.forEach(seal => {
            const item = document.createElement('div');
            item.className = 'index-list-item';
            item.innerHTML = `<strong>${seal.id}</strong> — Age: ${seal.age}, Area: ${seal.nafo_zone}`;
            item.addEventListener('click', () => selectSeal(seal));
            listContainer.appendChild(item);
        });
    }
}

// Update sidebar panel contents and charts
function selectSeal(seal) {
    // 1. Update Profile Information Texts
    const titleEl = document.getElementById('side-title');
    if (titleEl) titleEl.innerText = `${seal.id} Profile`;
    
    // Find all seals in the same area to aggregate demographics
    const areaSeals = sealsData.filter(s => s.area === seal.area);
    const totalCount = areaSeals.length;
    
    let males = 0, females = 0, unknowns = 0;
    let ageSum = 0;
    let ageCount = 0;
    
    areaSeals.forEach(s => {
        if (s.gender === 'M') males++;
        else if (s.gender === 'F') females++;
        else unknowns++;
        
        if (s.age_num !== null && s.age_num !== undefined) {
            ageSum += s.age_num;
            ageCount++;
        }
    });
    
    const avgAge = ageCount > 0 ? (ageSum / ageCount).toFixed(1) : 'N/A';
    
    const popEl = document.getElementById('side-pop');
    if (popEl) popEl.innerText = `${totalCount} Seals`;

    const genderEl = document.getElementById('side-gender');
    if (genderEl) genderEl.innerText = `M: ${males} / F: ${females} / U: ${unknowns}`;

    const ageEl = document.getElementById('side-age');
    if (ageEl) ageEl.innerText = `${avgAge} yrs (Average)`;

    // 2. Update Bottom snapshot details
    const detailIdEl = document.getElementById('detail-id');
    if (detailIdEl) detailIdEl.innerText = seal.id;
    
    const detailAgeEl = document.getElementById('detail-age');
    if (detailAgeEl) detailAgeEl.innerText = seal.age;

    const detailLocEl = document.getElementById('detail-location');
    if (detailLocEl) detailLocEl.innerText = seal.area;

    const detailMealEl = document.getElementById('detail-meal');
    if (detailMealEl) detailMealEl.innerText = seal.meal;

    const preyVisual = document.getElementById('prey-visual');
    if (preyVisual) {
        // scale prey visualization using seal's average otolith size
        const scale = Math.min(Math.max(seal.otolith * 0.4, 0.5), 3.0);
        preyVisual.style.transform = `scale(${scale})`;
    }

    // 3. Update Gender Pie Chart
    updateDemographicsChart(males, females, unknowns);

    // 4. Update Stomach Contents Chart
    updateStomachChart(seal.prey_contents, seal.total_prey_items);
}

// Draw gender distribution as a Pie Chart
function updateDemographicsChart(males, females, unknowns) {
    const ctx = document.getElementById('ratioChart');
    if (!ctx) return;

    // Fallback if Chart.js fails to load due to CDN drop
    if (typeof Chart === 'undefined') {
        ctx.parentElement.innerHTML = `<div style="padding:15px; font-size:12px; color:#666; background:#fafafa; border:1px dashed #ccc; border-radius:4px;">Gender Profile: Males: ${males}, Females: ${females}, Unknowns: ${unknowns}</div>`;
        return;
    }

    if (ratioChartInstance) {
        ratioChartInstance.destroy();
    }

    ratioChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Male', 'Female', 'Unknown'],
            datasets: [{
                label: 'Seal Count',
                data: [males, females, unknowns],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// Update stomach content donut chart
function updateStomachChart(preyContents, totalPreyItems) {
    const ctx = document.getElementById('stomachChart');
    const noteEl = document.getElementById('stomach-note');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        ctx.parentElement.innerHTML = `<div style="padding:15px; font-size:12px; color:#666; background:#fafafa; border:1px dashed #ccc; border-radius:4px;">Stomach content records:<br> ${JSON.stringify(preyContents)}</div>`;
        if (noteEl) noteEl.innerText = `${totalPreyItems} prey items recorded`;
        return;
    }

    if (stomachChartInstance) {
        stomachChartInstance.destroy();
    }

    const labels = Object.keys(preyContents);
    const data = Object.values(preyContents);

    const backgroundColors = labels.map((label, idx) => {
        if (label === 'Empty') return 'rgba(180, 180, 180, 0.5)';
        const colors = [
            'rgba(46, 204, 113, 0.6)',
            'rgba(52, 152, 219, 0.6)',
            'rgba(155, 89, 182, 0.6)',
            'rgba(241, 196, 15, 0.6)',
            'rgba(230, 126, 34, 0.6)',
            'rgba(231, 76, 60, 0.6)'
        ];
        return colors[idx % colors.length];
    });

    const borderColors = labels.map((label, idx) => {
        if (label === 'Empty') return 'rgba(180, 180, 180, 1)';
        const colors = [
            'rgba(46, 204, 113, 1)',
            'rgba(52, 152, 219, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(241, 196, 15, 1)',
            'rgba(230, 126, 34, 1)',
            'rgba(231, 76, 60, 1)'
        ];
        return colors[idx % colors.length];
    });

    stomachChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 8,
                        font: { size: 9 }
                    }
                }
            }
        }
    });

    if (noteEl) {
        noteEl.innerHTML = `<strong>Note:</strong> ${totalPreyItems} data points analyzed`;
    }
}

// Populate search filters dynamically based on sealsData
function populateFilters() {
    const filterGrid = document.querySelector('.filter-grid');
    if (!filterGrid) return;

    const selects = filterGrid.querySelectorAll('select');
    if (selects.length < 4) return;

    const locationSelect = selects[0];
    const genderSelect = selects[1];
    const stomachSelect = selects[2];
    const ageSelect = selects[3];

    locationSelect.innerHTML = '<option value="">All NAFO Zones</option>';
    genderSelect.innerHTML = '<option value="">All Genders</option>';
    stomachSelect.innerHTML = '<option value="">All Last Meals</option>';
    ageSelect.innerHTML = '<option value="">All Ages</option>';

    const locations = new Set();
    const genders = new Set();
    const stomachs = new Set();
    const ages = ['Pups (0-2)', 'Young (3-10)', 'Adults (11+)', 'Unknown Age'];

    sealsData.forEach(seal => {
        if (seal.nafo_zone) locations.add(seal.nafo_zone);
        if (seal.gender) genders.add(seal.gender);
        if (seal.meal) stomachs.add(seal.meal);
    });

    Array.from(locations).sort().forEach(loc => {
        locationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
    });

    Array.from(genders).sort().forEach(gen => {
        const display = gen === 'M' ? 'Male' : gen === 'F' ? 'Female' : 'Unknown';
        genderSelect.innerHTML += `<option value="${gen}">${display}</option>`;
    });

    Array.from(stomachs).sort().forEach(st => {
        stomachSelect.innerHTML += `<option value="${st}">${st}</option>`;
    });

    ages.forEach(ag => {
        ageSelect.innerHTML += `<option value="${ag}">${ag}</option>`;
    });

    const searchInput = filterGrid.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    selects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

// Apply selected filters
function applyFilters() {
    const filterGrid = document.querySelector('.filter-grid');
    const searchInput = filterGrid.querySelector('input[type="text"]');
    const selects = filterGrid.querySelectorAll('select');

    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const locVal = selects[0].value;
    const genderVal = selects[1].value;
    const stomachVal = selects[2].value;
    const ageVal = selects[3].value;

    const filtered = sealsData.filter(seal => {
        if (searchVal && !seal.id.toLowerCase().includes(searchVal)) {
            return false;
        }
        if (locVal && seal.nafo_zone !== locVal) {
            return false;
        }
        if (genderVal && seal.gender !== genderVal) {
            return false;
        }
        if (stomachVal && seal.meal !== stomachVal) {
            return false;
        }
        if (ageVal) {
            const ageNum = seal.age_num;
            if (ageVal === 'Pups (0-2)') {
                if (ageNum === null || ageNum > 2) return false;
            } else if (ageVal === 'Young (3-10)') {
                if (ageNum === null || ageNum < 3 || ageNum > 10) return false;
            } else if (ageVal === 'Adults (11+)') {
                if (ageNum === null || ageNum < 11) return false;
            } else if (ageVal === 'Unknown Age') {
                if (ageNum !== null) return false;
            }
        }
        return true;
    });

    renderInterfaceFiltered(filtered);
}

// Start application
function init() {
    renderInterface();
    populateFilters();
    
    // Select first seal by default to avoid empty state
    if (typeof sealsData !== 'undefined' && sealsData.length > 0) {
        selectSeal(sealsData[0]);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
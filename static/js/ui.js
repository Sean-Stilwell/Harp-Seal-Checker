// Populate list index
function renderInterface() {
    renderInterfaceFiltered(sealsData);
}

function renderInterfaceFiltered(filteredList) {
    const listContainer = document.getElementById('index-list-container');
    const resultsCountEl = document.getElementById('search-results-count');
    
    if (resultsCountEl) {
        resultsCountEl.innerText = `${filteredList.length} seals match your filters`;
    }
    
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
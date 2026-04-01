document.addEventListener('DOMContentLoaded', () => {

    const filterBtn      = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const searchInput    = document.querySelector('.search-input');
    const cards          = document.querySelectorAll('.card');
    const cardList       = document.querySelector('.card-list');
    const resultsCount   = document.querySelector('.results-count');
    const dayBtns        = document.querySelectorAll('.day-btn');
    const clearBtn       = document.getElementById('clearFiltersBtn');
    const sortSelect     = document.querySelector('.sort-select');
    const ampmToggles    = filterDropdown.querySelectorAll('.am-pm-toggle');
    const emptyState     = document.getElementById('emptyState');
    const scheduleScroll = document.querySelector('.schedule-scroll');

    resultsCount.textContent = `${cards.length} sections found`;

    // ── FILTER DROPDOWN TOGGLE ──
    filterBtn.addEventListener('click', e => {
        filterDropdown.classList.toggle('show');
        e.stopPropagation();
    });
    document.addEventListener('click', e => {
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target))
            filterDropdown.classList.remove('show');
    });

    // ── AM/PM ──
    ampmToggles.forEach(group => {
        const btns = group.querySelectorAll('.ampm-btn');
        btns.forEach(btn => btn.addEventListener('click', e => {
            e.preventDefault();
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyAllFilters();
        }));
    });

    // ── DAY BTNS ──
    dayBtns.forEach(btn => btn.addEventListener('click', e => {
        e.preventDefault();
        btn.classList.toggle('active');
        applyAllFilters();
    }));

    // ── CLEAR ALL ──
    clearBtn.addEventListener('click', e => {
        e.preventDefault();
        filterDropdown.querySelectorAll('.time-input').forEach(i => i.value = '');
        filterDropdown.querySelectorAll('.filter-select').forEach(s => s.selectedIndex = 0);
        dayBtns.forEach(b => b.classList.remove('active'));
        ampmToggles.forEach((t, i) => {
            const b = t.querySelectorAll('.ampm-btn');
            b.forEach(x => x.classList.remove('active'));
            b[i === 0 ? 0 : 1].classList.add('active');
        });
        searchInput.value = '';
        applyAllFilters();
    });

    // ── LIVE LISTENERS ──
    filterDropdown.querySelectorAll('.time-input').forEach(i => i.addEventListener('input', () => applyAllFilters()));
    filterDropdown.querySelectorAll('.filter-select').forEach(s => s.addEventListener('change', () => applyAllFilters()));
    searchInput.addEventListener('input', () => applyAllFilters());

    // ── MASTER FILTER ──
    function applyAllFilters() {
        const query  = searchInput.value.toLowerCase().trim();
        const startF = getFilterTime('start');
        const endF   = getFilterTime('end');
        const selDays = getSelectedDays();
        const selects = filterDropdown.querySelectorAll('.filter-select');
        const modVal  = selects[0].value;
        const campVal = selects[1].value;
        let vis = 0;

        cards.forEach(card => {
            let show = true;
            const campus = (card.dataset.campus || '').toLowerCase();

            if (query) {
                const hay = [
                    card.querySelector('.card-title').textContent,
                    card.querySelector('.card-crn').textContent,
                    card.querySelector('.card-badge').textContent,
                    campus,
                    ...Array.from(card.querySelectorAll('.meta-row')).map(r => r.textContent)
                ].join(' ').toLowerCase();
                if (!hay.includes(query)) show = false;
            }

            const metaRows   = card.querySelectorAll('.meta-row');
            const timeText   = metaRows[1].textContent.trim();
            const locText    = metaRows[2].textContent.trim();
            const cardCampus = card.dataset.campus || 'Fairfax';
            const isOnline   = /distance|online|asynchronous/i.test(timeText + ' ' + locText);
            const ct         = parseCardTime(timeText);

            if (show && startF !== null && ct && !isOnline && ct.startMin < startF) show = false;
            if (show && endF !== null && ct && !isOnline && ct.endMin > endF) show = false;
            if (show && selDays.length > 0 && !isOnline && (!ct || !ct.days.some(d => selDays.includes(d)))) show = false;

            if (show && modVal !== 'Select...') {
                if (modVal === 'Online' && !isOnline) show = false;
                if (modVal === 'In-Person' && isOnline) show = false;
                if (modVal === 'Hybrid') show = false;
            }

            if (show && campVal !== 'Select...') {
                if (isOnline) show = false;
                else if (cardCampus !== campVal) show = false;
            }

            card.style.display = show ? 'flex' : 'none';
            if (show) vis++;
        });

        resultsCount.textContent = vis === 1 ? '1 section found' : `${vis} sections found`;
        if (emptyState) emptyState.classList.toggle('show', vis === 0);
        updateFilterBadge();
        reapplySort();
    }

    // ── HELPERS ──
    function getFilterTime(type) {
        const rows = filterDropdown.querySelectorAll('.filter-row');
        const row  = type === 'start' ? rows[0] : rows[1];
        const ins  = row.querySelectorAll('.time-input');
        const hStr = ins[0].value.trim();
        if (!hStr) return null;
        let h = parseInt(hStr), m = parseInt(ins[1].value.trim()) || 0;
        if (isNaN(h)) return null;
        const isPM = row.querySelector('.ampm-btn.active')?.dataset.type === 'pm';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return h * 60 + m;
    }

    function getSelectedDays() {
        const c = ['M','T','W','R','F'], o = [];
        dayBtns.forEach((b, i) => { if (b.classList.contains('active')) o.push(c[i]); });
        return o;
    }

    function parseCardTime(text) {
        if (/distance|online|asynchronous/i.test(text)) return null;
        const m = text.match(/^([MTWRF]+)\s+(.+)$/i);
        if (!m) return null;
        const days  = m[1].toUpperCase().split('');
        const parts = m[2].split(/[–\-]/).map(t => t.trim());
        if (parts.length < 2) return null;
        return { days, startMin: toMin(parts[0]), endMin: toMin(parts[1]) };
    }

    function toMin(s) {
        const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!m) return 0;
        let h = +m[1], min = +m[2];
        if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    }

    // ── FILTER BADGE ──
    function updateFilterBadge() {
        let count = 0;
        if (getFilterTime('start') !== null) count++;
        if (getFilterTime('end') !== null) count++;
        if (getSelectedDays().length > 0) count++;
        const s = filterDropdown.querySelectorAll('.filter-select');
        if (s[0].value !== 'Select...') count++;
        if (s[1].value !== 'Select...') count++;
        let badge = filterBtn.querySelector('.filter-badge');
        if (count > 0) {
            if (!badge) { badge = document.createElement('span'); badge.className = 'filter-badge'; filterBtn.appendChild(badge); }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    // ── SORT ──
    sortSelect.addEventListener('change', () => reapplySort());

    function reapplySort() {
        const v = sortSelect.value;
        if (v === 'Sort by') return;
        const arr = Array.from(cardList.querySelectorAll('.card'));
        arr.sort((a, b) => {
            if (v === 'Course #') return a.querySelector('.card-badge').textContent.localeCompare(b.querySelector('.card-badge').textContent);
            if (v === 'Professor') return a.querySelectorAll('.meta-row')[0].textContent.localeCompare(b.querySelectorAll('.meta-row')[0].textContent);
            if (v === 'Time') {
                const at = parseCardTime(a.querySelectorAll('.meta-row')[1].textContent.trim());
                const bt = parseCardTime(b.querySelectorAll('.meta-row')[1].textContent.trim());
                return (at ? at.startMin : 9999) - (bt ? bt.startMin : 9999);
            }
            return 0;
        });
        arr.forEach(c => cardList.appendChild(c));
        if (emptyState) cardList.appendChild(emptyState);
    }

    // ── KEYBOARD: ESC closes filter ──
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && filterDropdown.classList.contains('show'))
            filterDropdown.classList.remove('show');
    });

    // ── TODAY HIGHLIGHT ──
    (function() {
        const d = new Date().getDay();
        const n = ['','mon','tue','wed','thu','fri'];
        if (d >= 1 && d <= 5) {
            const col = document.querySelector(`.day-col[data-day="${n[d]}"]`);
            if (col) col.classList.add('today');
            const hd = document.querySelectorAll('.nav-day');
            if (hd[d - 1]) hd[d - 1].classList.add('today');
        }
    })();

    // ── SCROLL TO 8 AM ──
    if (scheduleScroll) scheduleScroll.scrollTop = 90;

});
document.addEventListener('DOMContentLoaded', () => {

    /* ─── Element References ─── */
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
    const modal          = document.getElementById('courseModal');
    const modalCloseBtn  = document.getElementById('modalCloseBtn');
    const scheduleScroll = document.querySelector('.schedule-scroll');
    const creditDisplay  = document.querySelector('.credit-bar strong');
    const printBtn       = document.getElementById('btnPrint');
    const headerNav      = document.getElementById('headerNav');

    // Tab elements
    const tabBtns        = document.querySelectorAll('.tab-btn');
    const panelCalendar  = document.getElementById('panelCalendar');
    const panelList      = document.getElementById('panelList');
    const tabBadge       = document.getElementById('tabBadge');
    const listBody       = document.getElementById('listBody');
    const listTable      = document.getElementById('listTable');
    const listEmpty      = document.getElementById('listEmpty');
    const listSummary    = document.getElementById('listSummary');
    const listTotalCourses = document.getElementById('listTotalCourses');
    const listTotalCredits = document.getElementById('listTotalCredits');

    let totalCredits  = 0;
    const onlineAdded = new Set();
    const addedCourses = [];   // master array of added course data

    /* ─── Remove placeholder events ─── */
    document.querySelectorAll('.schedule .event').forEach(el => el.remove());

    resultsCount.textContent = `${cards.length} sections found`;

    // ==========================================
    // 1. TAB SWITCHING
    // ==========================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (tab === 'calendar') {
                panelCalendar.classList.add('active');
                panelList.classList.remove('active');
                headerNav.classList.remove('hidden-days');
            } else {
                panelCalendar.classList.remove('active');
                panelList.classList.add('active');
                headerNav.classList.add('hidden-days');
                renderListView();
            }
        });
    });

    // ==========================================
    // 2. FILTER DROPDOWN TOGGLE
    // ==========================================
    filterBtn.addEventListener('click', (e) => {
        filterDropdown.classList.toggle('show');
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target))
            filterDropdown.classList.remove('show');
    });

    // ==========================================
    // 3. AM / PM BUTTONS
    // ==========================================
    ampmToggles.forEach(group => {
        const btns = group.querySelectorAll('.ampm-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyAllFilters();
            });
        });
    });

    // ==========================================
    // 4. DAY BUTTONS
    // ==========================================
    dayBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('active');
            applyAllFilters();
        });
    });

    // ==========================================
    // 5. CLEAR ALL FILTERS
    // ==========================================
    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterDropdown.querySelectorAll('.time-input').forEach(i => i.value = '');
        filterDropdown.querySelectorAll('.filter-select').forEach(s => s.selectedIndex = 0);
        dayBtns.forEach(b => b.classList.remove('active'));
        ampmToggles.forEach((toggle, idx) => {
            const btns = toggle.querySelectorAll('.ampm-btn');
            btns.forEach(b => b.classList.remove('active'));
            btns[idx === 0 ? 0 : 1].classList.add('active');
        });
        searchInput.value = '';
        applyAllFilters();
    });

    // ==========================================
    // 6. LIVE LISTENERS
    // ==========================================
    filterDropdown.querySelectorAll('.time-input').forEach(i =>
        i.addEventListener('input', () => applyAllFilters())
    );
    filterDropdown.querySelectorAll('.filter-select').forEach(s =>
        s.addEventListener('change', () => applyAllFilters())
    );
    searchInput.addEventListener('input', () => applyAllFilters());

    // ==========================================
    // ★ MASTER FILTER FUNCTION
    // ==========================================
    function applyAllFilters() {
        const query        = searchInput.value.toLowerCase().trim();
        const startFilter  = getFilterTime('start');
        const endFilter    = getFilterTime('end');
        const selectedDays = getSelectedDays();
        const selects      = filterDropdown.querySelectorAll('.filter-select');
        const modalityVal  = selects[0].value;
        const campusVal    = selects[1].value;

        let visibleCount = 0;

        cards.forEach(card => {
            let show = true;

            if (query) {
                const haystack = [
                    card.querySelector('.card-title').textContent,
                    card.querySelector('.card-crn').textContent,
                    card.querySelector('.card-badge').textContent,
                    ...Array.from(card.querySelectorAll('.meta-row')).map(r => r.textContent)
                ].join(' ').toLowerCase();
                if (!haystack.includes(query)) show = false;
            }

            const metaRows     = card.querySelectorAll('.meta-row');
            const timeText     = metaRows[1].textContent.trim();
            const locationText = metaRows[2].textContent.trim();
            const isOnline     = /distance|online|asynchronous/i.test(timeText + ' ' + locationText);
            const ct           = parseCardTime(timeText);

            if (show && startFilter !== null && ct && !isOnline)
                if (ct.startMin < startFilter) show = false;

            if (show && endFilter !== null && ct && !isOnline)
                if (ct.endMin > endFilter) show = false;

            if (show && selectedDays.length > 0 && !isOnline)
                if (!ct || !ct.days.some(d => selectedDays.includes(d))) show = false;

            if (show && modalityVal !== 'Select...') {
                if (modalityVal === 'Online'    && !isOnline) show = false;
                if (modalityVal === 'In-Person' &&  isOnline) show = false;
                if (modalityVal === 'Hybrid')                 show = false;
            }

            if (show && campusVal !== 'Select...') {
                if (isOnline) show = false;
                else if (detectCampus(locationText) !== campusVal) show = false;
            }

            card.style.display = show ? 'flex' : 'none';
            if (show) visibleCount++;
        });

        resultsCount.textContent = visibleCount === 1
            ? '1 section found' : `${visibleCount} sections found`;

        if (emptyState) emptyState.classList.toggle('show', visibleCount === 0);
        updateFilterBadge();
        reapplySort();
    }

    // ==========================================
    // HELPERS
    // ==========================================
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
        const codes = ['M','T','W','R','F'];
        const out = [];
        dayBtns.forEach((btn, i) => { if (btn.classList.contains('active')) out.push(codes[i]); });
        return out;
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

    function detectCampus(loc) {
        if (/arlington|van\s*metre|founders\s*hall|vernon\s*smith|scalia/i.test(loc)) return 'Arlington';
        if (/sci\s*tech|science.+tech|bull\s*run|beacon|occoquan/i.test(loc)) return 'Science and Tech';
        return 'Fairfax';
    }

    // ==========================================
    // FILTER BADGE
    // ==========================================
    function updateFilterBadge() {
        let count = 0;
        if (getFilterTime('start') !== null) count++;
        if (getFilterTime('end')   !== null) count++;
        if (getSelectedDays().length > 0)    count++;
        const selects = filterDropdown.querySelectorAll('.filter-select');
        if (selects[0].value !== 'Select...') count++;
        if (selects[1].value !== 'Select...') count++;

        let badge = filterBtn.querySelector('.filter-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-badge';
                filterBtn.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    // ==========================================
    // 7. SORT
    // ==========================================
    sortSelect.addEventListener('change', () => reapplySort());

    function reapplySort() {
        const v = sortSelect.value;
        if (v === 'Sort by') return;
        const arr = Array.from(cardList.querySelectorAll('.card'));
        arr.sort((a, b) => {
            if (v === 'Course #')
                return a.querySelector('.card-badge').textContent.localeCompare(b.querySelector('.card-badge').textContent);
            if (v === 'Professor')
                return a.querySelectorAll('.meta-row')[0].textContent.localeCompare(b.querySelectorAll('.meta-row')[0].textContent);
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

    // ==========================================
    // 8. ADD TO CALENDAR + LIST
    // ==========================================
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('disabled')) return;

            const card         = btn.closest('.card');
            const courseCode   = card.querySelector('.card-badge').textContent.trim();
            const courseTitle  = card.querySelector('.card-title').textContent.trim();
            const color        = card.dataset.color;
            const credits      = parseInt(card.dataset.credits) || 3;
            const crn          = card.querySelector('.card-crn').textContent.trim();
            const metaRows     = card.querySelectorAll('.meta-row');
            const profText     = metaRows[0].textContent.trim();
            const timeText     = metaRows[1].textContent.trim();
            const locationText = metaRows[2].textContent.trim();
            const isOnline     = /distance|online/i.test(timeText);

            if (isOnline) {
                if (onlineAdded.has(courseCode)) return;
                onlineAdded.add(courseCode);

                addedCourses.push({
                    code: courseCode, title: courseTitle, crn, color,
                    professor: profText, schedule: timeText,
                    location: locationText, credits, isOnline: true
                });

                alert(`✅ ${courseCode} is an online course and has been added!`);
                markAdded(btn, card);
                updateCredits(credits);
                updateTabBadge();
                return;
            }

            const parts     = timeText.split(' ');
            const daysPart  = parts[0];
            const timeRange = parts.slice(1).join(' ');
            const times     = timeRange.split(/[–\-]/).map(t => t.trim());
            const startRow  = gridRow(times[0]);
            const endRow    = gridRow(times[1]);
            const dayMap    = { M:'mon', T:'tue', W:'wed', R:'thu', F:'fri' };
            const daysArr   = daysPart.split('');

            // Collision check
            let conflict = '';
            for (const ch of daysArr) {
                const col = document.querySelector(`.day-col[data-day="${dayMap[ch]}"]`);
                if (!col) continue;
                for (const ev of col.querySelectorAll('.event')) {
                    const [es, ee] = ev.style.gridRow.split('/').map(s => parseInt(s));
                    if (startRow < ee && endRow > es) {
                        conflict = ev.querySelector('strong').textContent;
                        break;
                    }
                }
                if (conflict) break;
            }
            if (conflict) {
                alert(`⚠️ Time Conflict!\n${courseCode} overlaps with ${conflict}.`);
                return;
            }

            // Place event blocks
            daysArr.forEach(ch => {
                const col = document.querySelector(`.day-col[data-day="${dayMap[ch]}"]`);
                if (!col) return;
                const div = document.createElement('div');
                div.className = 'event';
                div.style.gridRow = `${startRow} / ${endRow}`;
                div.style.background = color;
                div.innerHTML = `<strong>${courseCode}</strong><span>${timeRange}</span><span>${locationText}</span>`;
                col.appendChild(div);
            });

            addedCourses.push({
                code: courseCode, title: courseTitle, crn, color,
                professor: profText, schedule: timeText,
                location: locationText, credits, isOnline: false
            });

            markAdded(btn, card);
            updateCredits(credits);
            updateTabBadge();
        });
    });

    function gridRow(timeStr) {
        const p = timeStr.trim().split(' ');
        let [h, m] = p[0].split(':').map(Number);
        const ampm = (p[1] || '').toUpperCase();
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return (h * 2 - 10) + Math.round(m / 30);
    }

    function markAdded(btn, card) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Added`;
        btn.classList.add('disabled', 'added-state');
        btn.disabled = true;
        card.classList.add('added');
    }

    function updateCredits(n) {
        totalCredits = Math.max(0, totalCredits + n);
        creditDisplay.textContent = totalCredits;
        if (totalCredits > 18) {
            alert('⚠️ Warning: You have exceeded the 18 credit hour limit.');
            creditDisplay.style.color = '#b91c1c';
        } else {
            creditDisplay.style.color = 'var(--green)';
        }
    }

    // ==========================================
    // 9. TAB BADGE
    // ==========================================
    function updateTabBadge() {
        tabBadge.textContent = addedCourses.length;
        tabBadge.classList.remove('pulse');
        void tabBadge.offsetWidth;  // force reflow
        tabBadge.classList.add('pulse');
    }

    // ==========================================
    // 10. LIST VIEW RENDERING
    // ==========================================
    function renderListView() {
        listBody.innerHTML = '';

        if (addedCourses.length === 0) {
            listEmpty.classList.remove('hide');
            listTable.classList.remove('show');
            listSummary.classList.remove('show');
            return;
        }

        listEmpty.classList.add('hide');
        listTable.classList.add('show');
        listSummary.classList.add('show');

        let totalCr = 0;

        addedCourses.forEach((course, idx) => {
            totalCr += course.credits;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="lt-dot" style="background:${course.color}"></span></td>
                <td class="lt-course">${course.code}</td>
                <td class="lt-title">${course.title}</td>
                <td class="lt-crn">${course.crn}</td>
                <td class="lt-prof">${course.professor}</td>
                <td class="lt-schedule">
                    ${course.isOnline
                        ? '<span class="lt-online-badge">ONLINE — Async</span>'
                        : course.schedule}
                </td>
                <td class="lt-location">${course.location}</td>
                <td class="lt-credits">${course.credits}</td>
                <td>
                    <button class="btn-remove-list" data-idx="${idx}" data-code="${course.code}">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Remove
                    </button>
                </td>
            `;

            listBody.appendChild(tr);
        });

        listTotalCourses.textContent = addedCourses.length === 1
            ? '1 course' : `${addedCourses.length} courses`;
        listTotalCredits.textContent = `${totalCr} credits`;

        // Attach remove listeners
        listBody.querySelectorAll('.btn-remove-list').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                removeCourse(code);
                renderListView();
            });
        });
    }

    // ==========================================
    // 11. REMOVE COURSE (shared logic)
    // ==========================================
    function removeCourse(code) {
        // Remove from calendar grid
        document.querySelectorAll('.schedule .event, .grid-wrapper .event').forEach(el => {
            if (el.querySelector('strong') && el.querySelector('strong').textContent === code)
                el.remove();
        });

        // Find the course data to get credits before removing
        const courseData = addedCourses.find(c => c.code === code);
        const credits = courseData ? courseData.credits : 3;

        // Remove from addedCourses array
        const idx = addedCourses.findIndex(c => c.code === code);
        if (idx !== -1) addedCourses.splice(idx, 1);

        // Reset sidebar card
        cards.forEach(card => {
            if (card.querySelector('.card-badge').textContent === code) {
                const b = card.querySelector('.btn-add');
                b.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add`;
                b.classList.remove('disabled', 'added-state');
                b.disabled = false;
                card.classList.remove('added');
            }
        });

        onlineAdded.delete(code);
        updateCredits(-credits);
        updateTabBadge();
    }

    // Calendar click-to-remove
    document.querySelector('.grid-wrapper').addEventListener('click', (e) => {
        const ev = e.target.closest('.event');
        if (!ev) return;
        const code = ev.querySelector('strong').textContent;
        if (!confirm(`Remove ${code} from your schedule?`)) return;
        removeCourse(code);
    });

    // ==========================================
    // 12. COURSE INFO MODAL
    // ==========================================
    const courseDetails = {
        "IT 104":   { desc:"Provides a foundation in computing and technology, covering hardware, software, security, and ethics.", prereqs:"None", coreqs:"None", credits:"3" },
        "IT 213":   { desc:"Covers multimedia concepts and responsive web design principles using HTML, CSS, and JavaScript.", prereqs:"IT 104", coreqs:"None", credits:"3" },
        "CYSE 101": { desc:"Introduction to cyber security engineering concepts, threats, and defenses.", prereqs:"None", coreqs:"None", credits:"3" },
        "PHYS 160": { desc:"Calculus-based physics covering mechanics, waves, and thermodynamics.", prereqs:"MATH 114", coreqs:"PHYS 161", credits:"3" },
        "ECON 103": { desc:"Principles of microeconomics including supply, demand, and market structures.", prereqs:"None", coreqs:"None", credits:"3" },
        "HIST 100": { desc:"Survey of western civilization from ancient to modern times.", prereqs:"None", coreqs:"None", credits:"3" },
        "ART 101":  { desc:"Introduction to visual arts concepts, history, and studio practice.", prereqs:"None", coreqs:"None", credits:"3" },
        "MGT 303":  { desc:"Fundamentals of management theory and organizational behavior.", prereqs:"60 credits", coreqs:"None", credits:"3" },
        "STAT 250": { desc:"Introductory statistics covering descriptive and inferential methods.", prereqs:"MATH 108 or equivalent", coreqs:"None", credits:"3" }
    };

    document.querySelectorAll('.btn-dots').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card  = btn.closest('.card');
            const code  = card.querySelector('.card-badge').textContent.trim();
            const title = card.querySelector('.card-title').textContent.trim();
            const d     = courseDetails[code] || {
                desc:"No description available.", prereqs:"N/A", coreqs:"N/A", credits:"3"
            };
            document.getElementById('modalTitle').textContent   = `${code} – ${title}`;
            document.getElementById('modalCredits').textContent = `${d.credits} Credits`;
            document.getElementById('modalDesc').textContent    = d.desc;
            document.getElementById('modalPrereqs').textContent = d.prereqs;
            document.getElementById('modalCoreqs').textContent  = d.coreqs;
            modal.classList.add('show');
            modalCloseBtn.focus();
        });
    });

    modalCloseBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

    // ==========================================
    // 13. KEYBOARD (Escape)
    // ==========================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.classList.contains('show')) modal.classList.remove('show');
            else if (filterDropdown.classList.contains('show')) filterDropdown.classList.remove('show');
        }
    });

    // Focus trap
    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
            if (document.activeElement === last)  { first.focus(); e.preventDefault(); }
        }
    });

    // ==========================================
    // 14. PRINT
    // ==========================================
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // ==========================================
    // 15. TODAY HIGHLIGHT + TIME LINE
    // ==========================================
    (function highlightToday() {
        const dayIdx = new Date().getDay();
        const names  = ['','mon','tue','wed','thu','fri'];
        if (dayIdx >= 1 && dayIdx <= 5) {
            const col = document.querySelector(`.day-col[data-day="${names[dayIdx]}"]`);
            if (col) col.classList.add('today');
            const headerDays = document.querySelectorAll('.nav-day');
            if (headerDays[dayIdx - 1]) headerDays[dayIdx - 1].classList.add('today');
        }
    })();

    const timeLine = document.getElementById('currentTimeLine');
    function updateTimeLine() {
        if (!timeLine) return;
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes();
        if (h >= 6 && h < 23) {
            const topPx = ((h - 6) * 60) + m;
            timeLine.style.top = topPx + 'px';
            timeLine.style.display = 'block';
        } else {
            timeLine.style.display = 'none';
        }
    }
    updateTimeLine();
    setInterval(updateTimeLine, 60000);

    // ==========================================
    // 16. AUTO-SCROLL TO ~8 AM
    // ==========================================
    if (scheduleScroll) scheduleScroll.scrollTop = 3 * 30;

});
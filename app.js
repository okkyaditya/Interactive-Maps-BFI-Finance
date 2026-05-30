/**
 * BFI Finance Interactive Map Application
 * Leaflet.js + OpenStreetMap + MarkerCluster
 */

(function () {
    'use strict';

    // ===== SVG Marker Icons =====
    const PIN_GREEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <defs>
            <filter id="shadow-g" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
        </defs>
        <path d="M15 38 C15 38 3 22 3 13 C3 6.4 8.4 1 15 1 C21.6 1 27 6.4 27 13 C27 22 15 38 15 38Z" 
              fill="#059669" stroke="#047857" stroke-width="1.5" filter="url(#shadow-g)"/>
        <circle cx="15" cy="13" r="5.5" fill="white" opacity="0.95"/>
        <circle cx="15" cy="13" r="2.5" fill="#059669"/>
    </svg>`;

    const PIN_BLUE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <defs>
            <filter id="shadow-b" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
        </defs>
        <path d="M15 38 C15 38 3 22 3 13 C3 6.4 8.4 1 15 1 C21.6 1 27 6.4 27 13 C27 22 15 38 15 38Z" 
              fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5" filter="url(#shadow-b)"/>
        <circle cx="15" cy="13" r="5.5" fill="white" opacity="0.95"/>
        <circle cx="15" cy="13" r="2.5" fill="#2563eb"/>
    </svg>`;

    const PIN_ORANGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <defs>
            <filter id="shadow-o" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
        </defs>
        <path d="M15 38 C15 38 3 22 3 13 C3 6.4 8.4 1 15 1 C21.6 1 27 6.4 27 13 C27 22 15 38 15 38Z" 
              fill="#ea580c" stroke="#c2410c" stroke-width="1.5" filter="url(#shadow-o)"/>
        <circle cx="15" cy="13" r="5.5" fill="white" opacity="0.95"/>
        <circle cx="15" cy="13" r="2.5" fill="#ea580c"/>
    </svg>`;

    function createMarkerIcon(branch) {
        let svg = PIN_BLUE_SVG;
        if (branch.isPos) {
            svg = PIN_ORANGE_SVG;
        } else if (branch.syariah) {
            svg = PIN_GREEN_SVG;
        }
        const iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [30, 40],
            iconAnchor: [15, 40],
            popupAnchor: [0, -38],
        });
    }

    // ===== Indonesia Bounds Lock =====
    const indonesiaBounds = L.latLngBounds(
        L.latLng(-11.0, 95.0), // Southwest
        L.latLng(6.0, 141.0)   // Northeast
    );

    // ===== Map Initialization =====
    const map = L.map('map', {
        center: [-2.5, 118],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        maxBounds: indonesiaBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        attributionControl: true,
    });

    // Clean Transport Map Tile Layer (CyclOSM)
    L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.cyclosm.org/">CyclOSM</a>',
        maxZoom: 19,
    }).addTo(map);

    // ===== Marker Cluster Group =====
    const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true,
        disableClusteringAtZoom: 13,
        iconCreateFunction: function (cluster) {
            const childCount = cluster.getChildCount();
            let size = 'small';
            if (childCount >= 50) size = 'large';
            else if (childCount >= 20) size = 'medium';

            return L.divIcon({
                html: '<div>' + childCount + '</div>',
                className: 'marker-cluster marker-cluster-' + size,
                iconSize: L.point(40, 40),
            });
        },
    });

    map.addLayer(clusterGroup);

    // ===== State =====
    let allMarkers = [];
    let markerMap = new Map(); // O(1) marker lookup by name
    let currentFilter = 'all';
    let activeCircle = null;

    // ===== Active Radius Circle Management (60km) =====
    function updateActiveCircle(branch) {
        // Remove previous circle if it exists
        if (activeCircle) {
            map.removeLayer(activeCircle);
            activeCircle = null;
        }

        if (!branch) return;

        // Draw new circle (60km = 60000 meters)
        const circleColor = branch.syariah ? '#059669' : '#2563eb'; // Emerald Green / Royal Blue
        activeCircle = L.circle([branch.lat, branch.lng], {
            radius: 60000,
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '8, 8', // Perfect spacing for rotation
            className: 'rotating-radius-circle', // CSS class for rotating animation
        }).addTo(map);
    }

    function removeActiveCircle() {
        if (activeCircle) {
            map.removeLayer(activeCircle);
            activeCircle = null;
        }
    }

    // Update active circle on marker popup click
    map.on('popupopen', function (e) {
        const marker = e.popup._source;
        if (marker && marker._branchData) {
            updateActiveCircle(marker._branchData);
        }
    });

    // ===== Create Popup HTML (Compact 1-Row Layout) =====
    function createPopupContent(branch) {
        let statusClass = 'konvensional';
        if (branch.isPos) {
            statusClass = 'pos';
        } else if (branch.syariah) {
            statusClass = 'syariah';
        }
        const branchId = escapeHtml(branch.name);

        return `
            <div class="popup-compact-row ${statusClass}">
                <div class="popup-home-icon-container">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <span class="popup-compact-title" title="${escapeHtml(branch.name)}">${escapeHtml(branch.name)}</span>
                <div class="popup-compact-actions-group">
                    ${branch.mapsUrl ? `
                    <a href="${escapeHtml(branch.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="popup-action-btn directions" title="Petunjuk Arah">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                        </svg>
                    </a>
                    ` : ''}
                    <button class="popup-action-btn expand popup-expand-btn" data-branch-name="${branchId}" title="Lihat Detail">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="15 3 21 3 21 9"/>
                            <polyline points="9 21 3 21 3 15"/>
                            <line x1="21" y1="3" x2="14" y2="10"/>
                            <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== Details Drawer / Sidebar Functions =====
    function openDetailsDrawer(branch) {
        const drawer = document.getElementById('details-drawer');
        const drawerContent = document.getElementById('drawer-content');
        if (!drawer || !drawerContent) return;

        let badgeClass = 'konvensional';
        let badgeText = 'Konvensional';
        if (branch.isPos) {
            badgeClass = 'pos';
            badgeText = 'POS BFI Finance';
        } else if (branch.syariah) {
            badgeClass = 'syariah';
            badgeText = 'Unit Syariah';
        }

        drawerContent.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-badge ${badgeClass}">
                    <span class="drawer-badge-dot"></span>
                    ${badgeText}
                </div>
                <h2 class="drawer-title">${escapeHtml(branch.name)}</h2>
            </div>
            <div class="drawer-body">
                <div class="drawer-info-card">
                    <div class="drawer-info-icon ${branch.isPos ? 'orange' : (branch.syariah ? 'green' : '')}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <div class="drawer-info-details">
                        <div class="drawer-info-label">Alamat Lengkap</div>
                        <div class="drawer-info-value">${escapeHtml(branch.address)}</div>
                    </div>
                </div>
                <div class="drawer-info-card">
                    <div class="drawer-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M2 8h20"/>
                        </svg>
                    </div>
                    <div class="drawer-info-details">
                        <div class="drawer-info-label">Kota / Kabupaten</div>
                        <div class="drawer-info-value">${escapeHtml(branch.city)}</div>
                    </div>
                </div>
                <div class="drawer-info-card">
                    <div class="drawer-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                        </svg>
                    </div>
                    <div class="drawer-info-details">
                        <div class="drawer-info-label">Telepon</div>
                        <div class="drawer-info-value">${escapeHtml(branch.phone || '-')}</div>
                    </div>
                </div>
            </div>
            ${branch.mapsUrl ? `
            <div class="drawer-actions">
                <a href="${escapeHtml(branch.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="drawer-directions-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                    Petunjuk Arah Google Maps
                </a>
            </div>
            ` : ''}
        `;

        drawer.classList.add('active');
    }

    function closeDetailsDrawer() {
        const drawer = document.getElementById('details-drawer');
        if (drawer) {
            drawer.classList.remove('active');
        }
        removeActiveCircle();
    }

    function initDrawer() {
        const closeBtn = document.getElementById('drawer-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDetailsDrawer);
        }

        // Close drawer on map background click
        map.on('click', function (e) {
            // Close details and circle only when clicking the empty map space
            closeDetailsDrawer();
        });

        // Global event delegation for compact popup expand button click
        document.addEventListener('click', function (e) {
            const expandBtn = e.target.closest('.popup-expand-btn');
            if (expandBtn) {
                const branchName = expandBtn.dataset.branchName;
                if (typeof BRANCHES !== 'undefined') {
                    const branch = BRANCHES.find(b => b.name === branchName);
                    if (branch) {
                        openDetailsDrawer(branch);
                    }
                }
            }
        });
    }

    // ===== Load Branch Data =====
    function loadBranches() {
        if (typeof BRANCHES === 'undefined') {
            console.error('Branch data not loaded. Make sure branches_data.js is included.');
            return;
        }

        // Create markers
        BRANCHES.forEach((branch) => {
            if (!branch.lat || !branch.lng) return;

            // Strip "Cabang " prefix dynamically from name if present
            if (branch.name) {
                branch.name = branch.name.replace(/^cabang\s+/i, "");
            }

            const marker = L.marker([branch.lat, branch.lng], {
                icon: createMarkerIcon(branch),
            });

            marker.bindPopup(createPopupContent(branch), {
                maxWidth: 380,
                minWidth: 320,
                closeButton: false, // Hide default leaflet close button for cleaner compact look
                autoPan: true,
                autoPanPadding: [40, 40],
                className: 'compact-leaflet-popup'
            });

            marker._branchData = branch;
            allMarkers.push(marker);
            markerMap.set(branch.name, marker);
        });

        // Add all markers to cluster group
        applyFilter('all');

        // Update stats
        updateStats();
    }

    // ===== Filter =====
    function applyFilter(filter) {
        currentFilter = filter;
        clusterGroup.clearLayers();

        const filteredMarkers = allMarkers.filter((marker) => {
            const branch = marker._branchData;
            if (filter === 'syariah') return branch.syariah === true && !branch.isPos;
            if (filter === 'konvensional') return branch.syariah === false && !branch.isPos;
            if (filter === 'pos') return branch.isPos === true;
            return true; // 'all'
        });

        filteredMarkers.forEach((marker) => clusterGroup.addLayer(marker));

        // Update active button
        document.querySelectorAll('.filter-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    // ===== Stats =====
    function updateStats() {
        const total = BRANCHES.length;
        const syariahCount = BRANCHES.filter((b) => b.syariah && !b.isPos).length;
        const konvensionalCount = BRANCHES.filter((b) => !b.syariah && !b.isPos).length;
        const posCount = BRANCHES.filter((b) => b.isPos).length;

        animateNumber(document.querySelector('#stat-total .stat-number'), total);
        animateNumber(document.querySelector('#stat-syariah .stat-number'), syariahCount);
        animateNumber(document.querySelector('#stat-konvensional .stat-number'), konvensionalCount);
        animateNumber(document.querySelector('#stat-pos .stat-number'), posCount);
    }

    function animateNumber(el, target) {
        if (!el) return;
        let current = 0;
        const duration = 800;
        const stepTime = 16;
        const steps = Math.ceil(duration / stepTime);
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current);
        }, stepTime);
    }

    // ===== Search =====
    function initSearch() {
        const input = document.getElementById('search-input');
        const clearBtn = document.getElementById('search-clear');
        const resultsDiv = document.getElementById('search-results');

        let debounceTimer;

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = input.value.trim();
            clearBtn.style.display = query ? 'flex' : 'none';

            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                performSearch(query);
            }, 200);
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            resultsDiv.style.display = 'none';
            input.focus();
        });

        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                resultsDiv.style.display = 'none';
            }
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) {
                performSearch(input.value.trim());
            }
        });
    }

    function performSearch(query) {
        const resultsDiv = document.getElementById('search-results');
        const lowerQuery = query.toLowerCase();

        const matches = BRANCHES.filter((branch) => {
            return (
                branch.name.toLowerCase().includes(lowerQuery) ||
                branch.city.toLowerCase().includes(lowerQuery) ||
                branch.address.toLowerCase().includes(lowerQuery)
            );
        }).slice(0, 10);

        if (matches.length === 0) {
            resultsDiv.innerHTML = '<div class="search-no-results">Tidak ditemukan cabang yang cocok</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        resultsDiv.innerHTML = matches
            .map(
                (branch) => `
            <div class="search-result-item" data-lat="${branch.lat}" data-lng="${branch.lng}" data-name="${escapeHtml(branch.name)}">
                <div class="search-result-dot ${branch.syariah ? 'green' : 'blue'}"></div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(branch.name)}</div>
                    <div class="search-result-city">${escapeHtml(branch.city)}</div>
                </div>
            </div>
        `
            )
            .join('');

        resultsDiv.style.display = 'block';

        // Add click handlers
        resultsDiv.querySelectorAll('.search-result-item').forEach((item) => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const branchName = item.dataset.name;

                // Fly to location
                map.flyTo([lat, lng], 16, {
                    duration: 1.2,
                    easeLinearity: 0.25,
                });

                // Find and open the marker popup
                setTimeout(() => {
                    const targetMarker = markerMap.get(branchName);

                    if (targetMarker) {
                        // Ensure the marker is visible (handle cluster spiderfy)
                        clusterGroup.zoomToShowLayer(targetMarker, () => {
                            targetMarker.openPopup();
                        });
                    }
                }, 1300);

                resultsDiv.style.display = 'none';
                document.getElementById('search-input').value = '';
                document.getElementById('search-clear').style.display = 'none';
            });
        });
    }

    // ===== Filter Event Listeners =====
    function initFilters() {
        document.querySelectorAll('.filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                applyFilter(filter);
            });
        });
    }

    // ===== Landing Transition =====
    function initLandingTransition() {
        const exploreBtn = document.getElementById('explore-btn');
        const heroLanding = document.getElementById('hero-landing');
        const loadingScreen = document.getElementById('loading-screen');
        const appMain = document.getElementById('app-main');

        // Expose startMapTransition globally for React to call
        window.startMapTransition = () => {
            const hLanding = document.getElementById('hero-landing');
            const lScreen = document.getElementById('loading-screen');
            const aMain = document.getElementById('app-main');
            const progressFill = document.getElementById('loading-bar-fill');
            const statusText = document.getElementById('loading-status');

            if (!hLanding || !lScreen || !aMain) return;

            // 1. Fade out landing page
            hLanding.classList.add('fade-out');

            setTimeout(() => {
                hLanding.style.display = 'none';
                
                // 2. Show loading screen
                lScreen.style.display = 'flex';
                
                // Start loading simulation
                simulateLoadingProgress((progress) => {
                    if (progressFill) progressFill.style.width = progress + '%';
                    
                    // Dynamic helpful tips
                    if (statusText) {
                        if (progress < 25) {
                            statusText.textContent = 'Unit Syariah ditandai dengan pin berwarna hijau, sedangkan Konvensional berwarna biru! 🟢🔵';
                        } else if (progress < 50) {
                            statusText.textContent = 'Gunakan fitur Pencarian di bagian atas untuk menemukan cabang berdasarkan kota atau alamat! 🔍';
                        } else if (progress < 75) {
                            statusText.textContent = 'Aktifkan radius 60km dengan mengklik salah satu cabang untuk melihat jangkauan wilayah! 🎯';
                        } else {
                            statusText.textContent = 'Klik tombol Expand pada popup cabang untuk memunculkan detail kontak lengkap di panel samping! 📋';
                        }
                    }
                }, () => {
                    // Loading complete!
                    // 3. Fade out loading screen
                    lScreen.classList.add('fade-out');
                    
                    setTimeout(() => {
                        lScreen.style.display = 'none';
                        
                        // 4. Reveal Map Dashboard
                        aMain.style.display = 'block';
                        aMain.classList.add('fade-in');
                        
                        // Recalculate Leaflet size immediately
                        map.invalidateSize();
                        
                        // Smooth premium entrance animation
                        map.setView([-2.5, 118], 4);
                        setTimeout(() => {
                            map.flyTo([-2.5, 118], 5, {
                                duration: 1.8,
                                easeLinearity: 0.2
                            });
                        }, 100);
                        
                    }, 500); // Wait for loading screen fade out
                });
            }, 800); // Wait for landing page fade out
        };

        if (exploreBtn) {
            exploreBtn.addEventListener('click', window.startMapTransition);
        }
    }

    function simulateLoadingProgress(onProgress, onComplete) {
        let progress = 0;
        const duration = 1800; // 1.8 seconds transition
        const intervalTime = 20;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                onProgress(progress);
                clearInterval(timer);
                setTimeout(onComplete, 400); // Small professional pause at 100%
            } else {
                onProgress(progress);
            }
        }, intervalTime);
    }

    // ===== Interactive Branches Table Modal =====
    function initTableModal() {
        const modal = document.getElementById('table-modal');
        const showBtn = document.getElementById('show-table-btn');
        const closeBtn = document.getElementById('close-table-btn');
        const searchInput = document.getElementById('table-search-input');
        const filterSelect = document.getElementById('table-filter-select');

        if (!modal || !showBtn || !closeBtn || !searchInput || !filterSelect) return;

        // Open Modal
        showBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            renderBranchesTable(BRANCHES);
            // Reset filters
            searchInput.value = '';
            filterSelect.value = 'all';
        });

        // Close Modal
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close on clicking overlay background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Search & Filter event listeners
        function handleFilters() {
            const query = searchInput.value.trim().toLowerCase();
            const filterType = filterSelect.value;

            if (typeof BRANCHES === 'undefined') return;

            const filtered = BRANCHES.filter((branch) => {
                // Category filter
                if (filterType === 'syariah' && (!branch.syariah || branch.isPos)) return false;
                if (filterType === 'konvensional' && (branch.syariah || branch.isPos)) return false;
                if (filterType === 'pos' && !branch.isPos) return false;

                // Search query filter
                if (query) {
                    return (
                        branch.name.toLowerCase().includes(query) ||
                        branch.city.toLowerCase().includes(query) ||
                        branch.address.toLowerCase().includes(query)
                    );
                }

                return true;
            });

            renderBranchesTable(filtered);
        }

        searchInput.addEventListener('input', handleFilters);
        filterSelect.addEventListener('change', handleFilters);

        // Event Delegation for table actions (locate on map)
        const tableBody = document.getElementById('branches-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const locateBtn = e.target.closest('.map-locate');
                if (locateBtn) {
                    const lat = parseFloat(locateBtn.dataset.lat);
                    const lng = parseFloat(locateBtn.dataset.lng);
                    const branchName = locateBtn.dataset.name;

                    // Close Modal
                    modal.style.display = 'none';

                    if (isNaN(lat) || isNaN(lng)) return;

                    // Smooth premium flight to coordinates
                    map.flyTo([lat, lng], 15, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });

                    // Find and trigger popup open and active circle radius lock
                    setTimeout(() => {
                        const targetMarker = markerMap.get(branchName);
                        if (targetMarker) {
                            updateActiveCircle(targetMarker._branchData);
                            clusterGroup.zoomToShowLayer(targetMarker, () => {
                                targetMarker.openPopup();
                            });
                        }
                    }, 1600);
                }
            });
        }
    }

    function renderBranchesTable(data) {
        const tableBody = document.getElementById('branches-table-body');
        const totalCountSpan = document.getElementById('table-total-count');

        if (!tableBody || !totalCountSpan) return;

        totalCountSpan.textContent = data.length;

        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-no-results">Tidak ada cabang BFI Finance yang cocok dengan pencarian Anda</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = data.map((branch, index) => {
            let badgeClass = 'konvensional';
            let badgeText = 'Konvensional';
            if (branch.isPos) {
                badgeClass = 'pos';
                badgeText = 'POS BFI';
            } else if (branch.syariah) {
                badgeClass = 'syariah';
                badgeText = 'Unit Syariah';
            }

            return `
                <tr>
                    <td class="col-no" style="font-weight: 600; color: var(--color-text-tertiary);">${index + 1}</td>
                    <td class="col-name" style="font-weight: 700; color: var(--color-text-primary);">${escapeHtml(branch.name)}</td>
                    <td class="col-type">
                        <span class="table-badge ${badgeClass}">${badgeText}</span>
                    </td>
                    <td class="col-city" style="font-weight: 500;">${escapeHtml(branch.city)}</td>
                    <td class="col-address" style="color: var(--color-text-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(branch.address)}">
                        ${escapeHtml(branch.address)}
                    </td>
                    <td class="col-phone" style="font-weight: 500; font-family: monospace;">${escapeHtml(branch.phone || '-')}</td>
                    <td class="col-action">
                        <div class="table-action-btn-group">
                            <button class="table-action-btn map-locate" data-lat="${branch.lat}" data-lng="${branch.lng}" data-name="${escapeHtml(branch.name)}" title="Tampilkan di Peta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                            </button>
                            ${branch.mapsUrl ? `
                            <a href="${escapeHtml(branch.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="table-action-btn directions" title="Petunjuk Arah Google Maps">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                                </svg>
                            </a>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ===== Initialize =====
    function init() {
        loadBranches();
        initSearch();
        initFilters();
        initDrawer();
        initLandingTransition();
        initTableModal();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

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

    function createMarkerIcon(isSyariah) {
        const svg = isSyariah ? PIN_GREEN_SVG : PIN_BLUE_SVG;
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
    let currentFilter = 'all';
    let activeCircle = null;

    // ===== Popup Open/Close Event Listeners for 60km Radius Circle =====
    map.on('popupopen', function (e) {
        const marker = e.popup._source;
        if (marker && marker._branchData) {
            const branch = marker._branchData;
            
            // Remove previous circle if it exists
            if (activeCircle) {
                map.removeLayer(activeCircle);
            }
            
            // Draw new circle (60km = 60000 meters)
            const circleColor = branch.syariah ? '#059669' : '#2563eb'; // Emerald Green / Royal Blue
            activeCircle = L.circle([branch.lat, branch.lng], {
                radius: 60000,
                color: circleColor,
                fillColor: circleColor,
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '5, 5', // Clean, professional dashed border
            }).addTo(map);
        }
    });

    map.on('popupclose', function (e) {
        const marker = e.popup._source;
        if (activeCircle && marker) {
            // Only remove the circle if the marker is still visible on the map
            // (i.e. user clicked the 'x' button or closed it manually, not due to clustering/zoom)
            if (map.hasLayer(marker)) {
                map.removeLayer(activeCircle);
                activeCircle = null;
            }
        }
    });

    // ===== Create Popup HTML =====
    function createPopupContent(branch) {
        const badgeClass = branch.syariah ? 'syariah' : 'konvensional';
        const badgeText = branch.syariah ? 'Unit Syariah' : 'Konvensional';

        return `
            <div class="popup-content">
                <div class="popup-header">
                    <div class="popup-badge ${badgeClass}">
                        <span class="popup-badge-dot"></span>
                        ${badgeText}
                    </div>
                    <div class="popup-name">${escapeHtml(branch.name)}</div>
                </div>
                <div class="popup-body">
                    <div class="popup-info-row">
                        <div class="popup-info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                        <div class="popup-info-text">
                            <div class="popup-info-label">Alamat</div>
                            <div class="popup-info-value">${escapeHtml(branch.address)}</div>
                        </div>
                    </div>
                    <div class="popup-info-row">
                        <div class="popup-info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 8h20"/>
                            </svg>
                        </div>
                        <div class="popup-info-text">
                            <div class="popup-info-label">Kota / Kabupaten</div>
                            <div class="popup-info-value">${escapeHtml(branch.city)}</div>
                        </div>
                    </div>
                    <div class="popup-info-row">
                        <div class="popup-info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                            </svg>
                        </div>
                        <div class="popup-info-text">
                            <div class="popup-info-label">Telepon</div>
                            <div class="popup-info-value">${escapeHtml(branch.phone)}</div>
                        </div>
                    </div>
                    ${branch.mapsUrl ? `
                    <a href="${escapeHtml(branch.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="popup-directions-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                        </svg>
                        Petunjuk Arah
                    </a>
                    ` : ''}
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

    // ===== Load Branch Data =====
    function loadBranches() {
        if (typeof BRANCHES === 'undefined') {
            console.error('Branch data not loaded. Make sure branches_data.js is included.');
            return;
        }

        // Create markers
        BRANCHES.forEach((branch) => {
            if (!branch.lat || !branch.lng) return;

            const marker = L.marker([branch.lat, branch.lng], {
                icon: createMarkerIcon(branch.syariah),
            });

            marker.bindPopup(createPopupContent(branch), {
                maxWidth: 320,
                minWidth: 280,
                closeButton: true,
                autoPan: true,
                autoPanPadding: [40, 40],
            });

            marker._branchData = branch;
            allMarkers.push(marker);
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
            if (filter === 'syariah') return branch.syariah === true;
            if (filter === 'konvensional') return branch.syariah === false;
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
        const syariahCount = BRANCHES.filter((b) => b.syariah).length;
        const konvensionalCount = total - syariahCount;

        animateNumber(document.querySelector('#stat-total .stat-number'), total);
        animateNumber(document.querySelector('#stat-syariah .stat-number'), syariahCount);
        animateNumber(document.querySelector('#stat-konvensional .stat-number'), konvensionalCount);
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
            <div class="search-result-item" data-lat="${branch.lat}" data-lng="${branch.lng}">
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

                // Fly to location
                map.flyTo([lat, lng], 16, {
                    duration: 1.2,
                    easeLinearity: 0.25,
                });

                // Find and open the marker popup
                setTimeout(() => {
                    const targetMarker = allMarkers.find((m) => {
                        const d = m._branchData;
                        return d.lat === lat && d.lng === lng;
                    });

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

    // ===== Initialize =====
    function init() {
        loadBranches();
        initSearch();
        initFilters();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

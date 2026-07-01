// ==========================================
// 1. CONFIGURATION (MODE DEV)
// ==========================================

const allLocations = [
    { id: 'Lieu1', x: 500, y: 500 }, // Remplacer par les vraies coordonées
    { id: 'Lieu2', x: 500, y: 500 }, 
    { id: 'Lieu3', x: 500, y: 500 },
    { id: 'Lieu4', x: 500, y: 500 },
    { id: 'Lieu5', x: 500, y: 500 },
    { id: 'Lieu6', x: 500, y: 500 }
];

const maxScorePerRound = 5000;
const totalRounds = allLocations.length; // On fait les 6 lieux à la suite !

let currentRound = 1;
let totalScore = 0;
// 📍 MODE DEV : On ne mélange plus les lieux, on les garde dans l'ordre (1, 2, 3...)
let gameLocations = allLocations; 
let marker = null;
let hasValidated = false;

// ==========================================
// 2. PRÉPARATION 360 (PANNELLUM)
// ==========================================

const pannellumScenes = {};
allLocations.forEach(loc => {
    pannellumScenes[loc.id] = {
        "type": "cubemap",
        "cubeMap": [
            `panoramas/${loc.id}/panorama_0.png`,
            `panoramas/${loc.id}/panorama_1.png`,
            `panoramas/${loc.id}/panorama_2.png`,
            `panoramas/${loc.id}/panorama_3.png`,
            `panoramas/${loc.id}/panorama_4.png`,
            `panoramas/${loc.id}/panorama_5.png`
        ]
    };
});

const viewer = pannellum.viewer('panorama', {
    "default": {
        "firstScene": gameLocations[0].id,
        "autoLoad": true,
        "showZoomCtrl": false,
        "mouseZoom": true
    },
    "scenes": pannellumScenes
});

// ==========================================
// 3. LA CARTE (LEAFLET)
// ==========================================

const bounds = [[0, 0], [1427, 1427]];

const map = L.map('map', { 
    crs: L.CRS.Simple, 
    minZoom: -5, 
    maxZoom: 4, 
    zoomSnap: 0, 
    zoomDelta: 0.5,
    zoomControl: false, 
    attributionControl: false,
    maxBounds: bounds,         
    maxBoundsViscosity: 1.0    
});

L.imageOverlay('maps/map.png', bounds).addTo(map);
map.fitBounds(bounds);

const gameLayer = L.layerGroup().addTo(map);

const guessBtn = document.getElementById('guess-btn');
const mapWrapper = document.getElementById('map-wrapper');
const nextBtn = document.getElementById('next-btn');

// Correction du redimensionnement fluide
const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize({ pan: false });
});
resizeObserver.observe(document.getElementById('map-container'));

document.getElementById('map-container').addEventListener('transitionend', function(e) {
    if (e.target.id === 'map-container' && !hasValidated) {
        map.fitBounds(bounds);
    }
});

// ==========================================
// 4. CLICS (SANS CHRONO)
// ==========================================

function startRound() {
    hasValidated = false;
    document.getElementById('timer-display').innerText = "DEV"; // Indique le mode sans temps
}

function enableMapClick() {
    map.on('click', function(e) {
        if (hasValidated) return;
        
        // 🕵️‍♂️ OUTIL DÉVELOPPEUR : Note ces coordonnées dans ton code !
        console.log("📍 Lieu " + currentRound + " -> targetY: " + e.latlng.lat + " | targetX: " + e.latlng.lng);

        if (marker !== null) gameLayer.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(gameLayer);
        
        guessBtn.disabled = false;
        guessBtn.innerText = "Valider !";
    });
}

guessBtn.addEventListener('click', () => {
    if(marker && !hasValidated) processRoundResult();
});

// ==========================================
// 5. RÉSULTAT
// ==========================================

function processRoundResult() {
    hasValidated = true; 
    map.off('click'); 
    guessBtn.disabled = true;

    const targetLocation = gameLocations[currentRound - 1];
    let score = 0;
    let distance = 0;
    
    const pointsToFit = [[targetLocation.y, targetLocation.x]];

    if (marker !== null) {
        const clickY = marker.getLatLng().lat;
        const clickX = marker.getLatLng().lng;
        pointsToFit.push([clickY, clickX]); 

        distance = Math.sqrt(Math.pow(targetLocation.x - clickX, 2) + Math.pow(targetLocation.y - clickY, 2));
        
        score = Math.round(maxScorePerRound - (distance * 3.5)); 
        if (score < 0) score = 0;

        document.getElementById('distanceDisplay').innerText = Math.round(distance) + " blocs";
        L.polyline([[clickY, clickX], [targetLocation.y, targetLocation.x]], {color: '#00B4D8', weight: 3, dashArray: '10, 10'}).addTo(gameLayer);
    }

    totalScore += score;
    document.getElementById('scoreDisplay').innerText = score;
    document.getElementById('header-score').innerText = totalScore;

    L.circleMarker([targetLocation.y, targetLocation.x], {color: '#0A0A0A', fillColor: '#00B4D8', fillOpacity: 1, radius: 8}).addTo(gameLayer);

    document.getElementById('result-overlay').classList.remove('hidden');
    mapWrapper.classList.add('result-mode'); 

    setTimeout(() => {
        map.flyToBounds(pointsToFit, { padding: [60, 60], duration: 1.5 });

        setTimeout(() => {
            document.getElementById('result-modal').classList.remove('hidden');
        }, 1500);
    }, 500);
}

// ==========================================
// 6. BOUTON SUIVANT MANUEL
// ==========================================

nextBtn.addEventListener('click', () => {
    if (currentRound >= totalRounds) {
        alert("Bravo, tu as configuré tous tes lieux ! Regarde ta console F12 pour les coordonnées.");
        location.reload(); 
        return;
    }

    currentRound++;
    document.getElementById('round-display').innerText = currentRound;

    gameLayer.clearLayers();
    marker = null;
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('result-modal').classList.add('hidden');
    mapWrapper.classList.remove('result-mode');
    guessBtn.innerText = "Placer le point";

    setTimeout(() => {
        map.fitBounds(bounds);
        
        viewer.loadScene(gameLocations[currentRound - 1].id);
        
        enableMapClick();
        startRound();
    }, 500);
});

// Démarrage initial
enableMapClick();
startRound();

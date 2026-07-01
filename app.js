// ==========================================
// 1. CONFIGURATION (VRAIES COORDONNÉES)
// ==========================================

const allLocations = [
    { id: 'Lieu1', x: 634.0625, y: 809.5625 },
    { id: 'Lieu2', x: 377.5, y: 779.4375 }, 
    { id: 'Lieu3', x: 496.375, y: 992.4375 },
    { id: 'Lieu4', x: 293.06264472481286, y: 958.6056737754375 },
    { id: 'Lieu5', x: 505.5625, y: 730.3125 },
    { id: 'Lieu6', x: 273.3125, y: 912.1875 }
];

const maxScorePerRound = 5000;
const totalRounds = 5;
const roundTime = 30; 

let currentRound = 1;
let totalScore = 0;
let gameLocations = []; 
let marker = null;

let timerInterval;
let waitInterval;
let timeLeft = roundTime;
let transitionTime = 5;
let hasValidated = false;
let isTransitioning = false;

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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
shuffleArray(allLocations);
gameLocations = allLocations.slice(0, totalRounds); 

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
const timerDisplay = document.getElementById('timer-display');
const msgBox = document.getElementById('waiting-msg');

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
// 4. ANIMATION DE ROUND & CHRONO
// ==========================================

function announceRound() {
    const announcer = document.getElementById('round-announcer');
    const announcerText = document.getElementById('round-title-text');
    
    // 📍 LA RUSE MAGIQUE EST ICI : On force le reset de l'animation CSS
    announcerText.style.animation = 'none';
    announcerText.offsetHeight; /* Déclenche un recalcul du navigateur */
    announcerText.style.animation = null;

    // On met à jour le texte et on affiche l'écran noir
    announcerText.innerText = "ROUND " + currentRound;
    announcer.classList.remove('hidden');
    
    // On bloque tout pendant l'annonce
    map.off('click');
    guessBtn.disabled = true;
    timerDisplay.innerText = roundTime;
    
    // Au bout de 2 secondes, on cache l'annonce et on lance le chrono
    setTimeout(() => {
        announcer.classList.add('hidden');
        
        map.invalidateSize(); 
        map.fitBounds(bounds);
        
        enableMapClick();
        startTimer();
    }, 2000);
}

function startTimer() {
    timeLeft = roundTime;
    hasValidated = false;
    isTransitioning = false;
    
    timerDisplay.innerText = timeLeft;
    timerDisplay.classList.remove('timer-warning');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        
        if (timeLeft <= 5 && !hasValidated) {
            timerDisplay.classList.add('timer-warning');
        }

        if (hasValidated && !isTransitioning) {
            msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.classList.remove('timer-warning');
            
            if (!hasValidated) {
                processRoundResult(); 
            } else {
                startWaitingLobby(); 
            }
        }
    }, 1000);
}

function enableMapClick() {
    map.on('click', function(e) {
        if (hasValidated) return;
        
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
// 5. CINÉMATIQUE DE RÉSULTAT ET SCORE
// ==========================================

function processRoundResult() {
    hasValidated = true; 
    map.off('click'); 
    guessBtn.disabled = true;
    timerDisplay.classList.remove('timer-warning');

    const targetLocation = gameLocations[currentRound - 1];
    let score = 0;
    
    const pointsToFit = [[targetLocation.y, targetLocation.x]];

    if (marker !== null) {
        const clickY = marker.getLatLng().lat;
        const clickX = marker.getLatLng().lng;
        pointsToFit.push([clickY, clickX]); 

        const distance = Math.sqrt(Math.pow(targetLocation.x - clickX, 2) + Math.pow(targetLocation.y - clickY, 2));
        let displayDistance = Math.round(distance);
        
        // Marge de tolérance pour un 5000 parfait
        if (displayDistance <= 2) {
            displayDistance = 0; 
            score = maxScorePerRound; 
        } else {
            score = Math.round(maxScorePerRound - (distance * 3.5)); 
            if (score < 0) score = 0;
        }

        document.getElementById('distanceDisplay').innerText = displayDistance + " blocs";
        L.polyline([[clickY, clickX], [targetLocation.y, targetLocation.x]], {color: '#00B4D8', weight: 3, dashArray: '10, 10'}).addTo(gameLayer);
    } else {
        document.getElementById('distanceDisplay').innerText = "Temps écoulé !";
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

            if (timeLeft <= 0) {
                startWaitingLobby();
            } else {
                msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
            }
        }, 1500);
    }, 500);
}

// ==========================================
// 6. COMPTE À REBOURS DE TRANSITION (5s)
// ==========================================

function startWaitingLobby() {
    if(isTransitioning) return;
    isTransitioning = true;
    transitionTime = 5;

    function updateMsg() {
        if (currentRound >= totalRounds) {
            msgBox.innerHTML = `Partie terminée ! Fin dans <span id="auto-next-timer">${transitionTime}</span>s...`;
        } else {
            msgBox.innerHTML = `Prochain round dans <span id="auto-next-timer">${transitionTime}</span>s...`;
        }
    }
    
    updateMsg();

    clearInterval(waitInterval);
    waitInterval = setInterval(() => {
        transitionTime--;
        updateMsg();

        if (transitionTime <= 0) {
            clearInterval(waitInterval);
            goToNextRound();
        }
    }, 1000);
}

function goToNextRound() {
    if (currentRound >= totalRounds) {
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
        viewer.loadScene(gameLocations[currentRound - 1].id);
        
        // Lance l'annonce avec l'animation rafraîchie !
        announceRound();
    }, 500);
}

// Lancement initial
announceRound();

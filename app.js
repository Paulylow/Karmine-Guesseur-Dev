// ==========================================
// 1. CONFIGURATION
// ==========================================

// ⚠️ N'oublie pas de recalculer ces coordonnées avec F12 sur ta nouvelle carte 1427x1427 !
const allLocations = [
    { id: 'Lieu1', x: 500, y: 500 }, 
    { id: 'Lieu2', x: 500, y: 500 }, 
    { id: 'Lieu3', x: 500, y: 500 },
    { id: 'Lieu4', x: 500, y: 500 },
    { id: 'Lieu5', x: 500, y: 500 },
    { id: 'Lieu6', x: 500, y: 500 }
];

const maxScorePerRound = 5000;
const totalRounds = 5;
const roundTime = 30; // Temps d'un round en secondes

let currentRound = 1;
let totalScore = 0;
let gameLocations = []; 
let marker = null;

// Variables pour les chronos
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

// maxZoom augmenté à 4 pour ta map HD
const map = L.map('map', { crs: L.CRS.Simple, minZoom: -2, maxZoom: 4, zoomControl: false, attributionControl: false });

// 📍 LA NOUVELLE TAILLE EXACTE DE TA CARTE 📍
const bounds = [[0, 0], [1427, 1427]];

L.imageOverlay('maps/map.png', bounds).addTo(map);
map.fitBounds(bounds);

const gameLayer = L.layerGroup().addTo(map);

const guessBtn = document.getElementById('guess-btn');
const mapWrapper = document.getElementById('map-wrapper');
const timerDisplay = document.getElementById('timer-display');
const msgBox = document.getElementById('waiting-msg');

// ==========================================
// 4. CHRONO PRINCIPAL ET CLICS
// ==========================================

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
        
        // 🕵️‍♂️ OUTIL DÉVELOPPEUR 
        console.log("Coordonnées -> targetY: " + e.latlng.lat + " | targetX: " + e.latlng.lng);

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
// 5. CINÉMATIQUE DE RÉSULTAT
// ==========================================

function processRoundResult() {
    hasValidated = true; 
    map.off('click'); 
    guessBtn.disabled = true;
    timerDisplay.classList.remove('timer-warning');

    const targetLocation = gameLocations[currentRound - 1];
    let score = 0;
    let distance = 0;
    
    const pointsToFit = [[targetLocation.y, targetLocation.x]];

    if (marker !== null) {
        const clickY = marker.getLatLng().lat;
        const clickX = marker.getLatLng().lng;
        pointsToFit.push([clickY, clickX]); 

        distance = Math.sqrt(Math.pow(targetLocation.x - clickX, 2) + Math.pow(targetLocation.y - clickY, 2));
        
        // ⚖️ Ajustement de la difficulté (* 3.5 au lieu de 5 car la map va jusqu'à 1427)
        score = Math.round(maxScorePerRound - (distance * 3.5)); 
        if (score < 0) score = 0;

        document.getElementById('distanceDisplay').innerText = Math.round(distance) + " blocs";
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
        map.invalidateSize(); 
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
        map.invalidateSize();
        map.fitBounds(bounds);
        
        viewer.loadScene(gameLocations[currentRound - 1].id);
        
        enableMapClick();
        startTimer();
    }, 500);
}

// Démarrage initial
enableMapClick();
startTimer();

// ==========================================
// 1. CONFIGURATION
// ==========================================

const allLocations = [
    { id: 'Lieu1', x: 665.5, y: 556.625 }, 
    { id: 'Lieu2', x: 500, y: 500 }, // Mets tes vrais points ici avec la touche F12 !
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
let hasValidated = false;    // Le joueur a-t-il cliqué sur Valider ?
let isTransitioning = false; // Sommes-nous dans les 5 secondes d'attente entre les rounds ?

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

const map = L.map('map', { crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomControl: false, attributionControl: false });
const bounds = [[0, 0], [1000, 1000]];
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
        
        // Clignote en rouge s'il reste 5 secondes et qu'il n'a pas validé
        if (timeLeft <= 5 && !hasValidated) {
            timerDisplay.classList.add('timer-warning');
        }

        // Si le joueur a déjà validé, on met à jour le texte du bas pour lui dire d'attendre les autres
        if (hasValidated && !isTransitioning) {
            msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
        }
        
        // TEMPS ÉCOULÉ (Round fini pour tout le monde)
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.classList.remove('timer-warning');
            
            // Si le joueur n'avait pas cliqué, on force la validation
            if (!hasValidated) {
                processRoundResult(); 
            } else {
                // S'il avait déjà cliqué, on lance direct le passage au round suivant
                startWaitingLobby(); 
            }
        }
    }, 1000);
}

function enableMapClick() {
    map.on('click', function(e) {
        if (hasValidated) return; // Sécurité pour empêcher de cliquer après validation
        
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
    hasValidated = true; // Verrouille le joueur
    map.off('click'); 
    guessBtn.disabled = true;
    timerDisplay.classList.remove('timer-warning');

    const targetLocation = gameLocations[currentRound - 1];
    let score = 0;
    let distance = 0;
    
    // On met le vrai point dans le tableau pour la caméra
    const pointsToFit = [[targetLocation.y, targetLocation.x]];

    if (marker !== null) {
        const clickY = marker.getLatLng().lat;
        const clickX = marker.getLatLng().lng;
        pointsToFit.push([clickY, clickX]); // On ajoute le point du joueur pour la caméra

        distance = Math.sqrt(Math.pow(targetLocation.x - clickX, 2) + Math.pow(targetLocation.y - clickY, 2));
        score = Math.round(maxScorePerRound - (distance * 5)); 
        if (score < 0) score = 0;

        document.getElementById('distanceDisplay').innerText = Math.round(distance) + " blocs";
        L.polyline([[clickY, clickX], [targetLocation.y, targetLocation.x]], {color: '#00B4D8', weight: 3, dashArray: '10, 10'}).addTo(gameLayer);
    } else {
        document.getElementById('distanceDisplay').innerText = "Temps écoulé !";
    }

    totalScore += score;
    document.getElementById('scoreDisplay').innerText = score;
    document.getElementById('header-score').innerText = totalScore;

    // Place la vraie réponse
    L.circleMarker([targetLocation.y, targetLocation.x], {color: '#0A0A0A', fillColor: '#00B4D8', fillOpacity: 1, radius: 8}).addTo(gameLayer);

    // 🎬 Lancement de l'animation
    document.getElementById('result-overlay').classList.remove('hidden');
    mapWrapper.classList.add('result-mode'); 

    setTimeout(() => {
        map.invalidateSize(); 
        map.flyToBounds(pointsToFit, { padding: [60, 60], duration: 1.5 });

        setTimeout(() => {
            document.getElementById('result-modal').classList.remove('hidden');

            // Si le chrono principal est déjà à zéro (Le joueur n'a pas eu le temps)
            if (timeLeft <= 0) {
                startWaitingLobby();
            } else {
                // Le joueur a été rapide, il doit attendre la fin du chrono des autres
                msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
            }
        }, 1500);
    }, 500);
}

// ==========================================
// 6. COMPTE À REBOURS DE TRANSITION (5s)
// ==========================================

function startWaitingLobby() {
    if(isTransitioning) return; // Sécurité
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

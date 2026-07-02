// ==========================================
// 1. CONFIGURATION DES LIEUX
// ==========================================

const allLocations = [
    { id: 'Lieu1', x: 634.0625, y: 809.5625 }, { id: 'Lieu2', x: 377.5, y: 779.4375 }, 
    { id: 'Lieu3', x: 496.375, y: 992.4375 }, { id: 'Lieu4', x: 293.06264472481286, y: 958.6056737754375 },
    { id: 'Lieu5', x: 505.5625, y: 730.3125 }, { id: 'Lieu6', x: 273.3125, y: 912.1875 },
    { id: 'Lieu7', x: 930.6405894730218, y: 841.7385479362847 }, { id: 'Lieu8', x: 944.4112590713203, y: 630.8679668762923 },
    { id: 'Lieu9', x: 1047.249507588725, y: 551.226798181108 }, { id: 'Lieu10', x: 1072.8678913777107, y: 601.7731135589685 },
    { id: 'Lieu11', x: 1019.6200190354904, y: 582.2998689750975 }, { id: 'Lieu12', x: 1037.2179155741558, y: 152.22015514203198 },
    { id: 'Lieu13', x: 875.5116584116552, y: 375.5173030727776 }, { id: 'Lieu14', x: 878.4948340752787, y: 431.1085119913018 },
    { id: 'Lieu15', x: 728.6828241093921, y: 428.20462478819366 }, { id: 'Lieu17', x: 631.5622699443798, y: 327.5529679698231 },
    { id: 'Lieu18', x: 482.4032682804576, y: 230.4027768947771 }, { id: 'Lieu19', x: 662.6477195672688, y: 100.57379001605248 }
];

const maxScorePerRound = 5000;
let totalRounds = 5; 
let roundTime = 30; 

// ==========================================
// 2. GESTION DE LA SESSION JOUEUR
// ==========================================

let myPlayer = null;
let players = []; 

function checkSession() {
    const savedUser = localStorage.getItem('kg_user');
    if (savedUser) {
        myPlayer = JSON.parse(savedUser);
        joinLobby(myPlayer);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
}

document.getElementById('join-lobby-btn').addEventListener('click', () => {
    const rpName = document.getElementById('rp-name').value.trim();
    const mcPseudo = document.getElementById('mc-pseudo').value.trim();
    if (rpName === "" || mcPseudo === "") { alert("Merci de remplir ton Nom RP et ton Pseudo Minecraft !"); return; }
    myPlayer = { rpName: rpName, mcPseudo: mcPseudo, score: 0, isHost: true };
    localStorage.setItem('kg_user', JSON.stringify(myPlayer));
    joinLobby(myPlayer);
});

document.getElementById('disconnect-btn').addEventListener('click', () => {
    localStorage.removeItem('kg_user');
    location.reload();
});

// ==========================================
// 3. LOGIQUE DU LOBBY
// ==========================================

function joinLobby(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.remove('hidden');

    // On rajoute plus de joueurs pour bien tester le Top 5
    players = [
        { ...user, isMe: true }, 
        { rpName: 'Kotei', mcPseudo: 'Kotei', score: 0, isMe: false, isHost: false },
        { rpName: 'Fatiiiih', mcPseudo: 'Fatih', score: 0, isMe: false, isHost: false },
        { rpName: 'Kameto', mcPseudo: 'Kameto', score: 0, isMe: false, isHost: false },
        { rpName: 'Etoiles', mcPseudo: 'Etoiles', score: 0, isMe: false, isHost: false },
        { rpName: 'Bichou', mcPseudo: 'Bichouu', score: 0, isMe: false, isHost: false },
        { rpName: 'Tiky', mcPseudo: 'Tiky', score: 0, isMe: false, isHost: false }
    ];
    updateLobbyUI();
}

function updateLobbyUI() {
    const lobbyPlayersDiv = document.getElementById('lobby-players');
    lobbyPlayersDiv.innerHTML = '';
    
    players.forEach(p => {
        const avatarUrl = `https://minotar.net/helm/${p.mcPseudo}/100.png`;
        lobbyPlayersDiv.innerHTML += `
            <div class="player-item ${p.isMe ? 'is-me' : ''}">
                <img src="${avatarUrl}" class="mc-head" alt="${p.mcPseudo}" onerror="this.src='https://minotar.net/helm/Steve/100.png'">
                <div class="player-info">
                    <span class="player-rpname">${p.rpName}</span>
                    <span class="player-pseudo">@${p.mcPseudo}</span>
                </div>
                ${p.isHost ? '<span class="host-crown">👑</span>' : '<span style="color:#00e676; font-size:12px; font-weight:700; text-transform:uppercase;">Prêt</span>'}
            </div>
        `;
    });

    if (myPlayer.isHost) {
        document.getElementById('host-settings').classList.remove('hidden');
        document.getElementById('waiting-host-msg').classList.add('hidden');
    } else {
        document.getElementById('host-settings').classList.add('hidden');
        document.getElementById('waiting-host-msg').classList.remove('hidden');
    }
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    totalRounds = parseInt(document.getElementById('setting-rounds').value);
    roundTime = parseInt(document.getElementById('setting-time').value);
    
    document.getElementById('total-round-display').innerText = totalRounds;
    document.getElementById('lobby-screen').classList.add('hidden');
    
    // 📍 On cache le fond animé pendant qu'on joue !
    document.getElementById('animated-bg').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    shuffleArray(allLocations);
    gameLocations = allLocations.slice(0, totalRounds); 
    
    setTimeout(() => {
        map.invalidateSize();
        updateLeaderboardDisplay(); 
        announceRound();
    }, 500);
});

checkSession();

// ==========================================
// 4. PRÉPARATION 360 & CARTE LEAFLET
// ==========================================

let currentRound = 1;
let marker = null;
let timerInterval, waitInterval;
let timeLeft = roundTime;
let transitionTime = 5;
let hasValidated = false, isTransitioning = false;

const pannellumScenes = {};
allLocations.forEach(loc => {
    pannellumScenes[loc.id] = {
        "type": "cubemap",
        "cubeMap": [
            `panoramas/${loc.id}/panorama_0.png`, `panoramas/${loc.id}/panorama_1.png`,
            `panoramas/${loc.id}/panorama_2.png`, `panoramas/${loc.id}/panorama_3.png`,
            `panoramas/${loc.id}/panorama_4.png`, `panoramas/${loc.id}/panorama_5.png`
        ]
    };
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const viewer = pannellum.viewer('panorama', {
    "default": { "firstScene": allLocations[0].id, "autoLoad": true, "showZoomCtrl": false, "mouseZoom": true },
    "scenes": pannellumScenes
});

const bounds = [[0, 0], [1427, 1427]];

// 📍 Initialisation de la carte SANS minZoom hardcodé, on le gère mathématiquement
const map = L.map('map', { 
    crs: L.CRS.Simple, maxZoom: 4, zoomSnap: 0, zoomDelta: 0.5, 
    zoomControl: false, attributionControl: false, 
    maxBounds: bounds, maxBoundsViscosity: 1.0 
});
L.imageOverlay('maps/map.png', bounds).addTo(map);
const gameLayer = L.layerGroup().addTo(map);

const guessBtn = document.getElementById('guess-btn');
const mapWrapper = document.getElementById('map-wrapper');
const timerDisplay = document.getElementById('timer-display');
const msgBox = document.getElementById('waiting-msg');

const resizeObserver = new ResizeObserver(() => { 
    map.invalidateSize({ pan: false }); 
});
resizeObserver.observe(document.getElementById('map-container'));

// 📍 LA FONCTION MAGIQUE POUR LE ZOOM PARFAIT
function resetMapZoom() {
    // Largeur de la boite au survol (480px)
    // On calcule le zoom pour que les 1427px de la map rentrent pile dans 480px
    const optimalZoom = Math.log2(480 / 1427); 
    map.setMinZoom(optimalZoom);
    map.setView([713.5, 713.5], optimalZoom);
}

// ==========================================
// 5. ANIMATION DE ROUND & CHRONO
// ==========================================

function announceRound() {
    const announcer = document.getElementById('round-announcer');
    const announcerText = document.getElementById('round-title-text');
    
    announcerText.style.animation = 'none';
    announcerText.offsetHeight; 
    announcerText.style.animation = null;

    announcerText.innerText = "ROUND " + currentRound;
    announcer.classList.remove('hidden');
    
    map.off('click');
    guessBtn.disabled = true;
    timerDisplay.innerText = roundTime;
    
    setTimeout(() => {
        announcer.classList.add('hidden');
        map.invalidateSize(); 
        
        // 📍 On applique le zoom et on centre la carte parfaitement !
        resetMapZoom();
        
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
        
        if (timeLeft <= 5 && !hasValidated) timerDisplay.classList.add('timer-warning');
        if (hasValidated && !isTransitioning) msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.classList.remove('timer-warning');
            if (!hasValidated) processRoundResult(); 
            else startWaitingLobby(); 
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

guessBtn.addEventListener('click', () => { if(marker && !hasValidated) processRoundResult(); });

// ==========================================
// 6. RÉSULTATS ET LEADERBOARD TOP 5
// ==========================================

function processRoundResult() {
    hasValidated = true; 
    map.off('click'); 
    guessBtn.disabled = true;
    timerDisplay.classList.remove('timer-warning');

    const targetLocation = gameLocations[currentRound - 1];
    let myScore = 0;
    const pointsToFit = [[targetLocation.y, targetLocation.x]];

    if (marker !== null) {
        const clickY = marker.getLatLng().lat;
        const clickX = marker.getLatLng().lng;
        pointsToFit.push([clickY, clickX]); 

        const distance = Math.sqrt(Math.pow(targetLocation.x - clickX, 2) + Math.pow(targetLocation.y - clickY, 2));
        let displayDistance = Math.round(distance);
        
        if (displayDistance <= 2) { displayDistance = 0; myScore = maxScorePerRound; } 
        else { myScore = Math.round(maxScorePerRound - (distance * 3.5)); if (myScore < 0) myScore = 0; }

        document.getElementById('distanceDisplay').innerText = displayDistance + " blocs";
        L.polyline([[clickY, clickX], [targetLocation.y, targetLocation.x]], {color: '#00B4D8', weight: 3, dashArray: '10, 10'}).addTo(gameLayer);
    } else {
        document.getElementById('distanceDisplay').innerText = "Temps écoulé !";
    }

    players.forEach(p => {
        if (p.isMe) p.score += myScore;
        else p.score += Math.floor(Math.random() * 3900) + 1000;
    });

    players.sort((a, b) => b.score - a.score);
    updateLeaderboardDisplay();

    document.getElementById('scoreDisplay').innerText = myScore;
    L.circleMarker([targetLocation.y, targetLocation.x], {color: '#0A0A0A', fillColor: '#00B4D8', fillOpacity: 1, radius: 8}).addTo(gameLayer);
    
    document.getElementById('result-overlay').classList.remove('hidden');
    mapWrapper.classList.add('result-mode'); 

    setTimeout(() => {
        map.invalidateSize(); 
        map.flyToBounds(pointsToFit, { padding: [60, 60], duration: 1.5 });
        setTimeout(() => {
            document.getElementById('result-modal').classList.remove('hidden');
            if (timeLeft <= 0) startWaitingLobby();
            else msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${timeLeft}</span>s)`;
        }, 1500);
    }, 500);
}

function updateLeaderboardDisplay() {
    const lbContent = document.getElementById('leaderboard-content');
    lbContent.innerHTML = '';
    
    // 📍 Affichage du Top 5
    for (let i = 0; i < 5 && i < players.length; i++) {
        const p = players[i];
        lbContent.innerHTML += `
            <div class="lb-row ${p.isMe ? 'me' : ''}">
                <div style="display:flex; align-items:center;">
                    <span style="width: 20px; font-size: 13px;">#${i+1}</span>
                    <img src="https://minotar.net/helm/${p.mcPseudo}/30.png" class="lb-head" onerror="this.src='https://minotar.net/helm/Steve/30.png'">
                    <span>${p.rpName}</span>
                </div>
                <span>${p.score}</span>
            </div>`;
    }

    // 📍 Si le joueur n'est pas dans le Top 5, on l'affiche en dessous
    const myIndex = players.findIndex(p => p.isMe);
    if (myIndex >= 5) {
        const myP = players[myIndex];
        lbContent.innerHTML += `
            <div class="lb-row divider me">
                <div style="display:flex; align-items:center;">
                    <span style="width: 20px; font-size: 13px;">#${myIndex+1}</span>
                    <img src="https://minotar.net/helm/${myP.mcPseudo}/30.png" class="lb-head" onerror="this.src='https://minotar.net/helm/Steve/30.png'">
                    <span>${myP.rpName}</span>
                </div>
                <span>${myP.score}</span>
            </div>`;
    }
}

// ==========================================
// 7. TRANSITION & PODIUM
// ==========================================

function startWaitingLobby() {
    if(isTransitioning) return;
    isTransitioning = true;
    transitionTime = 5;

    function updateMsg() {
        if (currentRound >= totalRounds) msgBox.innerHTML = `Partie terminée ! Résultats dans <span id="auto-next-timer">${transitionTime}</span>s...`;
        else msgBox.innerHTML = `Prochain round dans <span id="auto-next-timer">${transitionTime}</span>s...`;
    }
    updateMsg();

    clearInterval(waitInterval);
    waitInterval = setInterval(() => {
        transitionTime--;
        updateMsg();

        if (transitionTime <= 0) {
            clearInterval(waitInterval);
            if (currentRound >= totalRounds) showPodium();
            else goToNextRound();
        }
    }, 1000);
}

function goToNextRound() {
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
        announceRound();
    }, 500);
}

function showPodium() {
    // 📍 On réaffiche le fond animé pour le Podium !
    document.getElementById('animated-bg').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('podium-screen').classList.remove('hidden');
    
    const podiumContent = document.getElementById('podium-content');
    const p1 = players[0]; const p2 = players[1]; const p3 = players[2];

    podiumContent.innerHTML = `
        <div class="podium-step second">
            <img src="https://minotar.net/helm/${p2.mcPseudo}/50.png" class="mc-head" style="margin-bottom:10px;">
            <div class="podium-name">${p2 ? p2.rpName : ''}</div>
            <div class="podium-score">${p2 ? p2.score : ''}</div>
        </div>
        <div class="podium-step first">
            <img src="https://minotar.net/helm/${p1.mcPseudo}/50.png" class="mc-head" style="margin-bottom:10px; border-color: #FFD700;">
            <div class="podium-name" style="font-size: 22px;">👑 ${p1.rpName}</div>
            <div class="podium-score">${p1.score}</div>
        </div>
        <div class="podium-step third">
            <img src="https://minotar.net/helm/${p3.mcPseudo}/50.png" class="mc-head" style="margin-bottom:10px;">
            <div class="podium-name">${p3 ? p3.rpName : ''}</div>
            <div class="podium-score">${p3 ? p3.score : ''}</div>
        </div>
    `;
}

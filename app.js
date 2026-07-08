if (typeof window.supabase === 'undefined') {
    alert("⚠️ Erreur Critique : Supabase n'est pas chargé ! Vérifie ton fichier index.html.");
}

// ==========================================
// 1. INITIALISATION SUPABASE
// ==========================================
const supabaseUrl = 'https://fokdgworzsmjswqvocxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZva2Rnd29yenNtanN3cXZvY3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDQ5MDIsImV4cCI6MjA5ODU4MDkwMn0.TmFmdVYz4qh9FKgZdtOsHEUUT81Q0fQI38oMPTIX-ek';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. CONFIGURATION DES LIEUX (82 MAPS AU TOTAL)
// ==========================================
const allLocations = [
    // --- NOUVELLES MAPS (51 à 69) ---
    { id: 'Lieu51', x: 847.8125, y: 994.7500 },
    { id: 'Lieu52', x: 604.5588, y: 1255.9341 },
    { id: 'Lieu53', x: 1003.5625, y: 1158.3750 },
    { id: 'Lieu54', x: 1030.6875, y: 1164.4375 },
    { id: 'Lieu55', x: 1066.5299, y: 1226.3263 },
    { id: 'Lieu56', x: 1124.5233, y: 1368.7362 },
    { id: 'Lieu57', x: 1034.5151, y: 1022.4939 },
    { id: 'Lieu58', x: 378.1561, y: 1211.2139 },
    { id: 'Lieu59', x: 348.6190, y: 1287.7043 },
    { id: 'Lieu60', x: 417.4366, y: 1205.6444 },
    { id: 'Lieu61', x: 331.6250, y: 857.7500 },
    { id: 'Lieu62', x: 340.5000, y: 715.2500 },
    { id: 'Lieu63', x: 217.9746, y: 588.5313 },
    { id: 'Lieu64', x: 324.6824, y: 482.7359 },
    { id: 'Lieu65', x: 538.1064, y: 566.1243 },
    { id: 'Lieu66', x: 508.1001, y: 535.8958 },
    { id: 'Lieu67', x: 799.4185, y: 636.1330 },
    { id: 'Lieu68', x: 788.6496, y: 655.5323 },
    { id: 'Lieu69', x: 752.6326, y: 647.2914 },

    // --- ANCIENNES MAPS RECALIBRÉES (1 à 50) ---
    { id: 'Lieu1', x: 662.1915, y: 858.3021 }, { id: 'Lieu2', x: 403.4951, y: 822.6823 },
    { id: 'Lieu3', x: 525.0693, y: 1043.3823 }, { id: 'Lieu4', x: 319.2103, y: 1005.3425 },
    { id: 'Lieu5', x: 534.4802, y: 779.3732 }, { id: 'Lieu6', x: 300.1875, y: 963.0625 },
    { id: 'Lieu7', x: 960.3475, y: 888.1856 }, { id: 'Lieu8', x: 972.6813, y: 680.3058 },
    { id: 'Lieu9', x: 1074.1563, y: 599.9996 }, { id: 'Lieu10', x: 1097.2812, y: 650.8047 },
    { id: 'Lieu11', x: 1047.2500, y: 633.0000 }, { id: 'Lieu12', x: 1063.5178, y: 202.0918 },
    { id: 'Lieu13', x: 907.1887, y: 431.3909 }, { id: 'Lieu14', x: 889.3125, y: 452.4375 },
    { id: 'Lieu15', x: 757.6250, y: 478.0625 }, { id: 'Lieu16', x: 368.6853, y: 626.0669 },
    { id: 'Lieu17', x: 660.7772, y: 376.1984 }, { id: 'Lieu18', x: 511.2500, y: 280.1250 },
    { id: 'Lieu19', x: 690.2458, y: 149.6259 }, { id: 'Lieu20', x: 271.2500, y: 598.5625 },
    { id: 'Lieu21', x: 200.7336, y: 541.3627 }, { id: 'Lieu22', x: 221.5000, y: 381.1250 },
    { id: 'Lieu23', x: 279.9774, y: 351.1623 }, { id: 'Lieu24', x: 407.4757, y: 178.2404 },
    { id: 'Lieu25', x: 440.0000, y: 86.9375 }, { id: 'Lieu26', x: 594.5090, y: 30.3612 },
    { id: 'Lieu27', x: 884.9337, y: 89.6694 }, { id: 'Lieu28', x: 756.2022, y: 304.8372 },
    { id: 'Lieu29', x: 680.5796, y: 456.3451 }, { id: 'Lieu31', x: 471.8750, y: 626.3750 },
    { id: 'Lieu32', x: 796.7876, y: 774.0793 }, { id: 'Lieu33', x: 817.5625, y: 897.3750 },
    { id: 'Lieu34', x: 866.2679, y: 805.8624 }, { id: 'Lieu35', x: 796.9979, y: 693.8644 },
    { id: 'Lieu36', x: 668.8125, y: 704.0625 }, { id: 'Lieu37', x: 611.1250, y: 677.0625 },
    { id: 'Lieu38', x: 648.8494, y: 746.1520 }, { id: 'Lieu39', x: 653.4653, y: 922.5392 },
    { id: 'Lieu40', x: 692.7263, y: 934.4301 }, { id: 'Lieu41', x: 642.6875, y: 825.1250 },
    { id: 'Lieu42', x: 619.6303, y: 876.2198 }, { id: 'Lieu43', x: 576.1941, y: 877.6546 },
    { id: 'Lieu44', x: 575.9375, y: 998.2500 }, { id: 'Lieu45', x: 582.5000, y: 1065.4375 },
    { id: 'Lieu46', x: 544.1875, y: 1028.2500 }, { id: 'Lieu47', x: 732.5071, y: 1120.2766 },
    { id: 'Lieu48', x: 704.4396, y: 1008.7184 }, { id: 'Lieu49', x: 679.8125, y: 825.0625 },
    { id: 'Lieu50', x: 669.6250, y: 889.3125 },

    // --- MAPS S (13 Lieux, INCHANGÉES) ---
    { id: 'Lieu01S', x: 542.3125, y: 435.3125 }, { id: 'Lieu02S', x: 464.6875, y: 539.7500 },
    { id: 'Lieu03S', x: 630.5876, y: 549.9345 }, { id: 'Lieu04S', x: 680.5000, y: 554.2500 },
    { id: 'Lieu05S', x: 695.3750, y: 460.1250 }, { id: 'Lieu06S', x: 549.0000, y: 408.3750 },
    { id: 'Lieu07S', x: 701.3943, y: 458.4237 }, { id: 'Lieu08S', x: 475.3125, y: 462.0000 },
    { id: 'Lieu09S', x: 859.2403, y: 981.2919 }, { id: 'Lieu10S', x: 783.3238, y: 1149.1233 },
    { id: 'Lieu11S', x: 844.7365, y: 1251.6055 }, { id: 'Lieu12S', x: 755.9325, y: 1166.0462 },
    { id: 'Lieu13S', x: 779.1274, y: 1032.9935 }
];

const maxScorePerRound = 5000;
let totalRounds = 5; 
let roundTime = 30; 
let currentRound = 1;
let gameLocations = []; 

let myPlayer = null;
let currentRoom = null;
let players = []; 

// ==========================================
// 3. AIGUILLEUR D'ÉCRANS
// ==========================================
function switchScreen(targetId) {
    ['login-screen', 'lobby-screen', 'game-ui', 'podium-screen'].forEach(id => {
        document.getElementById(id).classList.add('hidden-screen');
    });
    
    document.getElementById(targetId).classList.remove('hidden-screen');

    if (targetId === 'game-ui') {
        document.getElementById('animated-bg').classList.add('hidden-screen');
    } else {
        document.getElementById('animated-bg').classList.remove('hidden-screen');
    }
}

// ==========================================
// 4. GESTION DE LA CONNEXION (ET DU F5)
// ==========================================
async function checkSession() {
    try {
        const savedUser = localStorage.getItem('kg_user');
        if (savedUser) {
            myPlayer = JSON.parse(savedUser);
            
            if(myPlayer.room_code) {
                let { data: room } = await supabaseClient.from('rooms').select('*').eq('room_code', myPlayer.room_code).single();
                if (room) {
                    currentRoom = room;
                    document.getElementById('display-room-code').innerText = room.room_code;
                    
                    let { data: existingPlayer } = await supabaseClient.from('players').select('*').eq('id', myPlayer.id).single();
                    if (!existingPlayer) {
                        const { data: newP } = await supabaseClient.from('players').insert([{ room_id: room.id, rp_name: myPlayer.rp_name, mc_pseudo: myPlayer.mc_pseudo, is_host: myPlayer.is_host, score: myPlayer.score }]).select().single();
                        myPlayer = newP;
                        myPlayer.room_code = room.room_code;
                        localStorage.setItem('kg_user', JSON.stringify(myPlayer));
                    }
                    
                    setupRealtimeSubscriptions();
                    fetchPlayers();
                    
                    if (room.status === 'playing') {
                        syncGameFromDB(room);
                        return; 
                    }

                    switchScreen('lobby-screen');
                    
                    if (myPlayer.is_host) {
                        document.getElementById('host-settings').classList.remove('hidden-screen');
                        document.getElementById('waiting-host-msg').classList.add('hidden-screen');
                    } else {
                        document.getElementById('host-settings').classList.add('hidden-screen');
                        document.getElementById('waiting-host-msg').classList.remove('hidden-screen');
                    }
                    return;
                }
            }
        }
        switchScreen('login-screen');
    } catch (e) {
        console.error("Erreur de session:", e);
        switchScreen('login-screen');
    }
}

document.getElementById('join-lobby-btn').addEventListener('click', async () => {
    const rpName = document.getElementById('rp-name').value.trim();
    const mcPseudo = document.getElementById('mc-pseudo').value.trim();
    let roomCode = document.getElementById('room-code').value.trim().toUpperCase();

    if (rpName === "" || mcPseudo === "" || roomCode === "") { 
        alert("Merci de remplir tous les champs !"); return; 
    }

    const btn = document.getElementById('join-lobby-btn');
    btn.innerText = "Connexion..."; btn.disabled = true;

    try {
        let { data: room } = await supabaseClient.from('rooms').select('*').eq('room_code', roomCode).single();
        let isHost = false;
        
        if (!room) {
            const { data: newRoom, error: createError } = await supabaseClient.from('rooms').insert([{ room_code: roomCode, status: 'waiting' }]).select().single();
            if (createError) throw new Error(createError.message);
            room = newRoom;
            isHost = true;
        }

        currentRoom = room;
        document.getElementById('display-room-code').innerText = room.room_code;

        const { data: player, error: playerError } = await supabaseClient.from('players').insert([{ 
            room_id: room.id, rp_name: rpName, mc_pseudo: mcPseudo, is_host: isHost 
        }]).select().single();

        if (playerError) throw new Error(playerError.message);

        myPlayer = player;
        myPlayer.room_code = roomCode; 
        localStorage.setItem('kg_user', JSON.stringify(myPlayer));
        
        setupRealtimeSubscriptions();
        fetchPlayers();

        switchScreen('lobby-screen');
        
        if (isHost) {
            document.getElementById('host-settings').classList.remove('hidden-screen');
            document.getElementById('waiting-host-msg').classList.add('hidden-screen');
        } else {
            document.getElementById('host-settings').classList.add('hidden-screen');
            document.getElementById('waiting-host-msg').classList.remove('hidden-screen');
        }
    } catch (err) {
        alert("❌ Erreur : " + err.message);
        btn.innerText = "Rejoindre le Lobby"; btn.disabled = false;
    }
});

document.getElementById('disconnect-btn').addEventListener('click', async () => {
    if (myPlayer) await supabaseClient.from('players').delete().eq('id', myPlayer.id);
    localStorage.removeItem('kg_user');
    location.reload();
});

// ==========================================
// 5. SYNCHRONISATION TEMPS RÉEL
// ==========================================
function setupRealtimeSubscriptions() {
    supabaseClient.channel('players_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, payload => {
            fetchPlayers();
        }).subscribe();

    supabaseClient.channel('rooms_channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${currentRoom.id}` }, payload => {
            const oldRoom = currentRoom;
            currentRoom = payload.new;
            
            if (currentRoom.status === 'playing') {
                if (oldRoom.status === 'waiting' || oldRoom.current_round !== currentRoom.current_round) {
                    launchRoundUI(currentRoom.current_round);
                }
            }
        }).subscribe();
}

async function fetchPlayers() {
    const { data } = await supabaseClient.from('players').select('*').eq('room_id', currentRoom.id).order('score', { ascending: false });
    players = data || [];
    updateLobbyUI();
    updateLeaderboardDisplay();
}

function updateLobbyUI() {
    const lobbyPlayersDiv = document.getElementById('lobby-players');
    lobbyPlayersDiv.innerHTML = '';
    
    const countEl = document.getElementById('player-count');
    if(countEl) countEl.innerText = `${players.length} Joueur${players.length > 1 ? 's' : ''}`;
    
    players.forEach(p => {
        const isMe = p.id === myPlayer.id;
        const avatarUrl = `https://minotar.net/helm/${p.mc_pseudo}/100.png`;
        lobbyPlayersDiv.innerHTML += `
            <div class="player-item ${isMe ? 'is-me' : ''}">
                <img src="${avatarUrl}" class="mc-head" alt="${p.mc_pseudo}" onerror="this.src='https://minotar.net/helm/Steve/100.png'">
                <div class="player-info">
                    <span class="player-rpname">${p.rp_name}</span>
                    <span class="player-pseudo">@${p.mc_pseudo}</span>
                </div>
                ${p.is_host ? '<span class="host-crown">👑</span>' : '<span style="color:#00e676; font-size:12px; font-weight:700; text-transform:uppercase;">Prêt</span>'}
            </div>
        `;
    });
}

// ==========================================
// 6. LE MOTEUR DU JEU DE PRODUCTION
// ==========================================
function getSeededRandom(seed) { let x = Math.sin(seed++) * 10000; return x - Math.floor(x); }

function getGameLocations(seedStr) {
    let copy = [...allLocations];
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(getSeededRandom(seed++) * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

document.getElementById('start-game-btn').addEventListener('click', async () => {
    totalRounds = parseInt(document.getElementById('setting-rounds').value);
    roundTime = parseInt(document.getElementById('setting-time').value);
    const endTime = Date.now() + 2000 + (roundTime * 1000); 

    await supabaseClient.from('rooms').update({ 
        status: 'playing', total_rounds: totalRounds, round_time: roundTime, 
        current_round: 1, round_end_time: endTime 
    }).eq('id', currentRoom.id);
});

function launchRoundUI(roundNum) {
    currentRound = roundNum;
    totalRounds = currentRoom.total_rounds;
    roundTime = currentRoom.round_time;
    
    document.getElementById('total-round-display').innerText = totalRounds;
    document.getElementById('round-display').innerText = currentRound;
    
    switchScreen('game-ui');
    
    gameLayer.clearLayers(); marker = null;
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('result-modal').classList.add('hidden');
    mapWrapper.classList.remove('result-mode');
    guessBtn.innerText = "Placer le point"; guessBtn.disabled = true;

    gameLocations = getGameLocations(currentRoom.room_code).slice(0, totalRounds); 
    
    const currentLocId = gameLocations[currentRound - 1].id;
    viewer.resize();
    viewer.loadScene(currentLocId);
    
    // 📍 MÉCANIQUE DE CHANGEMENT DE MAP
    if (currentLocId.endsWith('S')) {
        mapOverlay.setUrl('maps/map2.png');
    } else {
        mapOverlay.setUrl('maps/map.png');
    }
    
    const announcer = document.getElementById('round-announcer');
    const announcerText = document.getElementById('round-title-text');
    announcerText.innerText = "ROUND " + currentRound;
    
    announcerText.style.animation = 'none';
    void announcerText.offsetWidth;
    announcerText.style.animation = 'zoomInFade 2s cubic-bezier(0.25, 1, 0.5, 1) forwards';
    
    announcer.classList.remove('hidden');
    map.off('click');
    
    const remainingMs = currentRoom.round_end_time - Date.now();
    const delay = (remainingMs > roundTime * 1000) ? 2000 : 0; 

    setTimeout(() => {
        announcer.classList.add('hidden');
        map.invalidateSize(); 
        resetMapZoom();
        enableMapClick();
        startTimerDB(false);
    }, delay);
}

function syncGameFromDB(room) {
    currentRoom = room;
    totalRounds = room.total_rounds;
    roundTime = room.round_time;
    currentRound = room.current_round;

    document.getElementById('total-round-display').innerText = totalRounds;
    document.getElementById('round-display').innerText = currentRound;

    gameLocations = getGameLocations(currentRoom.room_code).slice(0, totalRounds);

    switchScreen('game-ui');

    setTimeout(() => {
        const currentLocId = gameLocations[currentRound - 1].id;
        viewer.resize();
        viewer.loadScene(currentLocId);
        
        // 📍 MÉCANIQUE DE CHANGEMENT DE MAP (POUR CEUX QUI FONT F5)
        if (currentLocId.endsWith('S')) {
            mapOverlay.setUrl('maps/map2.png');
        } else {
            mapOverlay.setUrl('maps/map.png');
        }

        map.invalidateSize(); resetMapZoom();

        enableMapClick();
        startTimerDB(true);
    }, 100);
}

// ==========================================
// 7. PRÉPARATION 360 & CARTE LEAFLET
// ==========================================
let timerInterval, waitInterval;
let timeLeft = 0;
let transitionTime = 5;
let hasValidated = false, isTransitioning = false;
let marker = null;

const pannellumScenes = {};
allLocations.forEach(loc => {
    pannellumScenes[loc.id] = { "type": "cubemap", "cubeMap": [`panoramas/${loc.id}/panorama_0.png`, `panoramas/${loc.id}/panorama_1.png`, `panoramas/${loc.id}/panorama_2.png`, `panoramas/${loc.id}/panorama_3.png`, `panoramas/${loc.id}/panorama_4.png`, `panoramas/${loc.id}/panorama_5.png`] };
});

const viewer = pannellum.viewer('panorama', { 
    "default": { "firstScene": allLocations[0].id, "autoLoad": true, "showZoomCtrl": false, "mouseZoom": true }, 
    "scenes": pannellumScenes 
});

const bounds = [[0, 0], [1427, 1427]];
const map = L.map('map', { crs: L.CRS.Simple, maxZoom: 4, zoomSnap: 0, zoomDelta: 0.5, zoomControl: false, attributionControl: false, maxBounds: bounds, maxBoundsViscosity: 1.0 });

// 📍 GESTION DYNAMIQUE DU CALQUE DE LA MAP
let mapOverlay = L.imageOverlay('maps/map.png', bounds).addTo(map);
const gameLayer = L.layerGroup().addTo(map);

const guessBtn = document.getElementById('guess-btn');
const mapWrapper = document.getElementById('map-wrapper');
const timerDisplay = document.getElementById('timer-display');
const msgBox = document.getElementById('waiting-msg');

const resizeObserver = new ResizeObserver(() => { map.invalidateSize({ pan: false }); });
resizeObserver.observe(document.getElementById('map-container'));

function resetMapZoom() {
    const optimalZoom = Math.log2(480 / 1427); 
    map.setMinZoom(optimalZoom); map.setView([713.5, 713.5], optimalZoom);
}

// ==========================================
// 8. JEU, RÉSULTATS & TIMER SUPABASE
// ==========================================
function startTimerDB(isSync = false) {
    hasValidated = false;
    isTransitioning = false;
    clearInterval(timerInterval);

    let endTime = currentRoom.round_end_time;
    let remainingMs = endTime - Date.now();

    if (remainingMs < 0 || remainingMs > (currentRoom.round_time * 1000 + 5000)) {
        let fallbackTime = isSync ? (currentRoom.round_time * 1000) - 5000 : (currentRoom.round_time * 1000);
        if(fallbackTime < 5000) fallbackTime = 5000;
        endTime = Date.now() + fallbackTime;
    }
    
    timerInterval = setInterval(() => {
        const ms = endTime - Date.now();
        timeLeft = Math.ceil(ms / 1000);
        
        if (timeLeft < 0) timeLeft = 0;
        timerDisplay.innerText = timeLeft;
        
        if (timeLeft <= 5 && !hasValidated && timeLeft > 0) timerDisplay.classList.add('timer-warning');
        else timerDisplay.classList.remove('timer-warning');
        
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
        guessBtn.disabled = false; guessBtn.innerText = "Valider !";
    });
}

guessBtn.addEventListener('click', () => { if(marker && !hasValidated) processRoundResult(); });

async function processRoundResult() {
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
        
        if (displayDistance <= 2) { 
            displayDistance = 0; 
            myScore = maxScorePerRound; 
        } 
        else { 
            myScore = Math.round(maxScorePerRound - (distance * 25)); 
            if (myScore < 0) myScore = 0; 
        }

        document.getElementById('distanceDisplay').innerText = displayDistance + " blocs";
        L.polyline([[clickY, clickX], [targetLocation.y, targetLocation.x]], {color: '#00B4D8', weight: 3, dashArray: '10, 10'}).addTo(gameLayer);
    } else {
        document.getElementById('distanceDisplay').innerText = "Temps écoulé !";
    }

    const meInDB = players.find(p => p.id === myPlayer.id);
    const currentDBScore = meInDB ? meInDB.score : myPlayer.score;
    await supabaseClient.from('players').update({ score: currentDBScore + myScore }).eq('id', myPlayer.id);

    document.getElementById('scoreDisplay').innerText = myScore;
    L.circleMarker([targetLocation.y, targetLocation.x], {color: '#0A0A0A', fillColor: '#00B4D8', fillOpacity: 1, radius: 8}).addTo(gameLayer);
    
    document.getElementById('result-overlay').classList.remove('hidden');
    mapWrapper.classList.add('result-mode'); 

    setTimeout(() => {
        map.invalidateSize(); 
        map.flyToBounds(pointsToFit, { padding: [60, 60], duration: 1.5 });
        setTimeout(() => {
            document.getElementById('result-modal').classList.remove('hidden');
            const remainingMs = currentRoom.round_end_time - Date.now();
            if (remainingMs > 0) {
                msgBox.innerHTML = `En attente des autres joueurs... (<span id="auto-next-timer">${Math.ceil(remainingMs/1000)}</span>s)`;
            } else {
                startWaitingLobby();
            }
        }, 1500);
    }, 500);
}

function updateLeaderboardDisplay() {
    const lbContent = document.getElementById('leaderboard-content');
    lbContent.innerHTML = '';
    
    for (let i = 0; i < 5 && i < players.length; i++) {
        const p = players[i];
        lbContent.innerHTML += `
            <div class="lb-row ${p.id === myPlayer.id ? 'me' : ''}">
                <div style="display:flex; align-items:center;">
                    <span style="min-width: 25px; display: inline-block; font-size: 13px;">#${i+1}</span>
                    <img src="https://minotar.net/helm/${p.mc_pseudo}/30.png" class="lb-head" onerror="this.src='https://minotar.net/helm/Steve/30.png'">
                    <span>${p.rp_name}</span>
                </div>
                <span>${p.score}</span>
            </div>`;
    }

    const myIndex = players.findIndex(p => p.id === myPlayer.id);
    if (myIndex >= 5) {
        const myP = players[myIndex];
        lbContent.innerHTML += `
            <div class="lb-row divider me">
                <div style="display:flex; align-items:center;">
                    <span style="min-width: 25px; display: inline-block; font-size: 13px;">#${myIndex+1}</span>
                    <img src="https://minotar.net/helm/${myP.mc_pseudo}/30.png" class="lb-head" onerror="this.src='https://minotar.net/helm/Steve/30.png'">
                    <span>${myP.rp_name}</span>
                </div>
                <span>${myP.score}</span>
            </div>`;
    }
}

// ==========================================
// 9. TRANSITION & PODIUM MULTIJOUEUR
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
    waitInterval = setInterval(async () => {
        transitionTime--;
        updateMsg();
        
        if (transitionTime <= 0) {
            clearInterval(waitInterval);
            if (currentRound >= totalRounds) {
                showPodium();
            } else {
                if (myPlayer.is_host) {
                    const nextRound = currentRound + 1;
                    const endTime = Date.now() + 2000 + (currentRoom.round_time * 1000);
                    await supabaseClient.from('rooms').update({ current_round: nextRound, round_end_time: endTime }).eq('id', currentRoom.id);
                } else {
                    msgBox.innerHTML = "L'hôte lance la suite...";
                }
            }
        }
    }, 1000);
}

function showPodium() {
    switchScreen('podium-screen');
    
    const podiumContent = document.getElementById('podium-content');
    const p1 = players[0]; const p2 = players[1]; const p3 = players[2];

    podiumContent.innerHTML = `
        <div class="podium-step second">
            ${p2 ? `<img src="https://minotar.net/helm/${p2.mc_pseudo}/50.png" class="mc-head" style="margin-bottom:10px;">
            <div class="podium-name">${p2.rp_name}</div>
            <div class="podium-score">${p2.score}</div>` : ''}
        </div>
        <div class="podium-step first">
            ${p1 ? `<img src="https://minotar.net/helm/${p1.mc_pseudo}/50.png" class="mc-head" style="margin-bottom:10px; border-color: #FFD700;">
            <div class="podium-name" style="font-size: 22px;">👑 ${p1.rp_name}</div>
            <div class="podium-score">${p1.score}</div>` : ''}
        </div>
        <div class="podium-step third">
            ${p3 ? `<img src="https://minotar.net/helm/${p3.mc_pseudo}/50.png" class="mc-head" style="margin-bottom:10px;">
            <div class="podium-name">${p3.rp_name}</div>
            <div class="podium-score">${p3.score}</div>` : ''}
        </div>
    `;

    let othersHtml = '';
    for(let i = 3; i < players.length; i++) {
        let p = players[i];
        othersHtml += `
        <div class="player-item">
            <span style="font-weight: 900; font-size: 18px; color: #888; min-width: 30px;">#${i+1}</span>
            <img src="https://minotar.net/helm/${p.mc_pseudo}/40.png" class="mc-head" onerror="this.src='https://minotar.net/helm/Steve/40.png'">
            <div class="player-info">
                <span class="player-rpname">${p.rp_name}</span>
                <span class="player-pseudo" style="font-size: 14px;">Score : <strong style="color:var(--cyan);">${p.score}</strong></span>
            </div>
        </div>`;
    }
    
    const othersDiv = document.getElementById('podium-others');
    if(othersHtml && othersDiv) {
        othersDiv.innerHTML = othersHtml;
        othersDiv.classList.remove('hidden-screen');
    }
}

document.getElementById('return-lobby-btn').addEventListener('click', async () => {
    if (myPlayer.is_host) await supabaseClient.from('rooms').delete().eq('id', currentRoom.id);
    else await supabaseClient.from('players').delete().eq('id', myPlayer.id);
    localStorage.removeItem('kg_user');
    location.reload();
});

// 🚀 GO !
checkSession();

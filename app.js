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
// 2. CONFIGURATION DES LIEUX (MODE DEV)
// ==========================================
const allLocations = [
    { id: 'Lieu14', x: 0, y: 0 }, 
    { id: 'Lieu16', x: 339.9851, y: 576.1043 }, // 📍 Validé !
    { id: 'Lieu20', x: 242.5000, y: 548.5000 }, // 📍 Validé !
    { id: 'Lieu21', x: 0, y: 0 }, { id: 'Lieu22', x: 0, y: 0 },
    { id: 'Lieu23', x: 0, y: 0 }, { id: 'Lieu24', x: 0, y: 0 }, { id: 'Lieu25', x: 0, y: 0 },
    { id: 'Lieu26', x: 0, y: 0 }, { id: 'Lieu27', x: 0, y: 0 }, { id: 'Lieu28', x: 0, y: 0 },
    { id: 'Lieu29', x: 0, y: 0 }, { id: 'Lieu30', x: 0, y: 0 }, { id: 'Lieu31', x: 0, y: 0 },
    { id: 'Lieu32', x: 0, y: 0 }, { id: 'Lieu33', x: 0, y: 0 }, { id: 'Lieu34', x: 0, y: 0 },
    { id: 'Lieu35', x: 0, y: 0 }, { id: 'Lieu36', x: 0, y: 0 }, { id: 'Lieu37', x: 0, y: 0 },
    { id: 'Lieu38', x: 0, y: 0 }, { id: 'Lieu39', x: 0, y: 0 }, { id: 'Lieu40', x: 0, y: 0 },
    { id: 'Lieu41', x: 0, y: 0 }, { id: 'Lieu42', x: 0, y: 0 }, { id: 'Lieu43', x: 0, y: 0 },
    { id: 'Lieu44', x: 0, y: 0 }, { id: 'Lieu45', x: 0, y: 0 }, { id: 'Lieu46', x: 0, y: 0 },
    { id: 'Lieu47', x: 0, y: 0 }, { id: 'Lieu48', x: 0, y: 0 }, { id: 'Lieu49', x: 0, y: 0 },
    { id: 'Lieu50', x: 0, y: 0 }
];

const maxScorePerRound = 5000;
let totalRounds = allLocations.length; 
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
                    
                    if (room.status.startsWith('playing')) {
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${currentRoom.id}` }, payload => {
            fetchPlayers();
        }).subscribe();

    supabaseClient.channel('rooms_channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${currentRoom.id}` }, payload => {
            const oldRoom = currentRoom;
            currentRoom = payload.new;
            
            // 📍 LE FIX DU BOUTON "ROUND SUIVANT" EST ICI : 
            // Si le numéro du round change, on lance la suite, peu importe le statut précédent.
            if (currentRoom.status === 'playing_guessing') {
                if (oldRoom.status !== 'playing_guessing' || oldRoom.current_round !== currentRoom.current_round) {
                    launchRoundUI(currentRoom.current_round);
                }
            }
            
            if (currentRoom.status === 'playing_results' && oldRoom.status === 'playing_guessing') {
                if (!hasValidated) processRoundResult(false);
            }

            if (currentRoom.status === 'finished' && oldRoom.status !== 'finished') {
                showPodium();
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
// 6. LE MOTEUR DU JEU MANUEL (MODE DEV)
// ==========================================

function seededShuffle(array, seedStr) { return array; } // Pas de mélange !

document.getElementById('start-game-btn').addEventListener('click', async () => {
    totalRounds = allLocations.length; 
    await supabaseClient.from('rooms').update({ 
        status: 'playing_guessing', total_rounds: totalRounds, current_round: 1 
    }).eq('id', currentRoom.id);
});

document.getElementById('host-end-round-btn').addEventListener('click', async () => {
    await supabaseClient.from('rooms').update({ status: 'playing_results' }).eq('id', currentRoom.id);
});

document.getElementById('host-next-round-btn').addEventListener('click', async () => {
    if (currentRound >= totalRounds) {
        await supabaseClient.from('rooms').update({ status: 'finished' }).eq('id', currentRoom.id);
    } else {
        await supabaseClient.from('rooms').update({ status: 'playing_guessing', current_round: currentRound + 1 }).eq('id', currentRoom.id);
    }
});


function launchRoundUI(roundNum) {
    currentRound = roundNum;
    totalRounds = currentRoom.total_rounds;
    hasValidated = false;
    
    document.getElementById('total-round-display').innerText = totalRounds;
    document.getElementById('round-display').innerText = currentRound;
    
    const timerDisplay = document.getElementById('timer-display');
    if(timerDisplay) timerDisplay.innerText = "∞";

    switchScreen('game-ui');
    
    gameLayer.clearLayers(); 
    marker = null;
    
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('result-modal').classList.add('hidden');
    mapWrapper.classList.remove('result-mode');
    guessBtn.innerText = "Placer le point"; guessBtn.disabled = true;

    if (myPlayer.is_host) document.getElementById('host-end-round-btn').classList.remove('hidden-screen');
    else document.getElementById('host-end-round-btn').classList.add('hidden-screen');
    
    document.getElementById('host-next-round-btn').classList.add('hidden-screen');

    gameLocations = allLocations; 
    
    viewer.resize(); 
    viewer.loadScene(gameLocations[currentRound - 1].id);
    
    const announcer = document.getElementById('round-announcer');
    const announcerText = document.getElementById('round-title-text');
    const announcerSub = document.getElementById('round-subtitle');
    
    announcerText.childNodes[0].nodeValue = "ROUND " + currentRound;
    if(announcerSub) announcerSub.innerText = "(" + gameLocations[currentRound - 1].id + ")";
    
    announcerText.style.animation = 'none';
    void announcerText.offsetWidth; 
    announcerText.style.animation = 'zoomInFade 2s cubic-bezier(0.25, 1, 0.5, 1) forwards';
    
    announcer.classList.remove('hidden');
    map.off('click');
    
    setTimeout(() => {
        announcer.classList.add('hidden');
        map.invalidateSize(); 
        resetMapZoom();
        enableMapClick();
    }, 2000);
}

function syncGameFromDB(room) {
    currentRoom = room;
    totalRounds = room.total_rounds;
    currentRound = room.current_round;

    document.getElementById('total-round-display').innerText = totalRounds;
    document.getElementById('round-display').innerText = currentRound;
    
    const timerDisplay = document.getElementById('timer-display');
    if(timerDisplay) timerDisplay.innerText = "∞";

    gameLocations = allLocations;

    switchScreen('game-ui');

    setTimeout(() => {
        viewer.resize(); 
        viewer.loadScene(gameLocations[currentRound - 1].id);
        map.invalidateSize(); resetMapZoom();

        if (room.status === 'playing_guessing') {
            hasValidated = false;
            enableMapClick();
            if (myPlayer.is_host) document.getElementById('host-end-round-btn').classList.remove('hidden-screen');
        } 
        else if (room.status === 'playing_results') {
            hasValidated = true;
            document.getElementById('result-overlay').classList.remove('hidden');
            document.getElementById('result-modal').classList.remove('hidden');
            mapWrapper.classList.add('result-mode');
            document.getElementById('host-end-round-btn').classList.add('hidden-screen');
            
            if (myPlayer.is_host) {
                document.getElementById('host-next-round-btn').classList.remove('hidden-screen');
                document.getElementById('waiting-msg').innerText = "C'est à toi de lancer la suite !";
                if(currentRound >= totalRounds) document.getElementById('host-next-round-btn').innerText = "🏆 VOIR LE PODIUM";
                else document.getElementById('host-next-round-btn').innerText = "▶️ ROUND SUIVANT";
            } else {
                document.getElementById('waiting-msg').innerText = "En attente de l'hôte pour la suite...";
            }
        }
    }, 100);
}

// ==========================================
// 7. PRÉPARATION 360 & CARTE LEAFLET
// ==========================================
let hasValidated = false;
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
L.imageOverlay('maps/map.png', bounds).addTo(map);
const gameLayer = L.layerGroup().addTo(map);

const guessBtn = document.getElementById('guess-btn');
const mapWrapper = document.getElementById('map-wrapper');
const msgBox = document.getElementById('waiting-msg');

const resizeObserver = new ResizeObserver(() => { map.invalidateSize({ pan: false }); });
resizeObserver.observe(document.getElementById('map-container'));

function resetMapZoom() {
    const optimalZoom = Math.log2(480 / 1427); 
    map.setMinZoom(optimalZoom); map.setView([713.5, 713.5], optimalZoom);
}

// ==========================================
// 8. RÉSULTATS (Pilotés manuellement)
// ==========================================

function enableMapClick() {
    map.on('click', function(e) {
        if (hasValidated) return;
        if (marker !== null) gameLayer.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(gameLayer);
        guessBtn.disabled = false; guessBtn.innerText = "Valider !";

        // 📍 IMPRESSION AUTOMATIQUE DANS LA CONSOLE
        const currentMapId = gameLocations[currentRound - 1].id;
        console.log(`%c[MAP CAPTURÉE] %c{ id: '${currentMapId}', x: ${e.latlng.lng.toFixed(4)}, y: ${e.latlng.lat.toFixed(4)} },`, "color: #00B4D8; font-weight: bold;", "color: #4CAF50; font-weight: bold; font-size: 14px;");
    });
}

guessBtn.addEventListener('click', () => { if(marker && !hasValidated) processRoundResult(true); });

async function processRoundResult(isManual = true) {
    hasValidated = true; 
    map.off('click'); 
    guessBtn.disabled = true;

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
        document.getElementById('distanceDisplay').innerText = "0 point placé !";
    }

    const meInDB = players.find(p => p.id === myPlayer.id);
    const currentDBScore = meInDB ? meInDB.score : myPlayer.score;
    await supabaseClient.from('players').update({ score: currentDBScore + myScore }).eq('id', myPlayer.id);

    document.getElementById('scoreDisplay').innerText = myScore;
    L.circleMarker([targetLocation.y, targetLocation.x], {color: '#0A0A0A', fillColor: '#00B4D8', fillOpacity: 1, radius: 8}).addTo(gameLayer);
    
    document.getElementById('result-overlay').classList.remove('hidden');
    mapWrapper.classList.add('result-mode'); 
    
    document.getElementById('host-end-round-btn').classList.add('hidden-screen');

    setTimeout(() => {
        map.invalidateSize(); 
        map.flyToBounds(pointsToFit, { padding: [60, 60], duration: 1.5 });
        setTimeout(() => {
            document.getElementById('result-modal').classList.remove('hidden');
            
            if (myPlayer.is_host) {
                document.getElementById('host-next-round-btn').classList.remove('hidden-screen');
                document.getElementById('waiting-msg').innerText = "C'est à toi de lancer la suite !";
                if(currentRound >= totalRounds) document.getElementById('host-next-round-btn').innerText = "🏆 VOIR LE PODIUM";
                else document.getElementById('host-next-round-btn').innerText = "▶️ ROUND SUIVANT";
            } else {
                document.getElementById('waiting-msg').innerText = "En attente de l'hôte pour la suite...";
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
                    <span style="width: 20px; font-size: 13px;">#${i+1}</span>
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
                    <span style="width: 20px; font-size: 13px;">#${myIndex+1}</span>
                    <img src="https://minotar.net/helm/${myP.mc_pseudo}/30.png" class="lb-head" onerror="this.src='https://minotar.net/helm/Steve/30.png'">
                    <span>${myP.rp_name}</span>
                </div>
                <span>${myP.score}</span>
            </div>`;
    }
}

// ==========================================
// 9. PODIUM MULTIJOUEUR
// ==========================================

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
}

document.getElementById('return-lobby-btn').addEventListener('click', async () => {
    if (myPlayer.is_host) await supabaseClient.from('rooms').delete().eq('id', currentRoom.id);
    else await supabaseClient.from('players').delete().eq('id', myPlayer.id);
    localStorage.removeItem('kg_user');
    location.reload();
});

// 🚀 GO !
checkSession();

const app = {
    username: "", 
    userColor: "#6366f1", 
    roomCode: null, 
    words: [], 
    currentIndex: 0,
    stats: { correctWords: 0, correctLetters: 0, incorrectLetters: 0 },
    timeLeft: 60, 
    timerInterval: null, 
    isPlaying: false, 
    isMultiplayer: false,
    stompClient: null, 
    connectedPlayers: [],
    
    wordStreak: 0,
    madeErrorInCurrentWord: false,
    audioCtx: null,

    ALL_COLORS: ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#14b8a6", "#3b82f6", "#a855f7", "#eab308", "#f43f5e", "#0ea5e9"],
    turkishWordPool: ["zaman", "insan", "hayat", "dünya", "sorun", "çocuk", "büyük", "küçük", "güzel", "doğru", "yanlış", "kitap", "masa", "kapı", "okul", "arkadaş", "aile", "şehir", "ülke", "para", "akıl", "gece", "sabah", "akşam", "hafta", "hava", "toprak", "ateş", "ışık", "renk", "kalp", "sevgi", "korku", "umut", "hayal", "gerçek", "cevap", "soru", "fikir", "bilgi", "haber", "oyun", "şarkı", "film", "resim", "sanat", "bilim", "tarih", "doğa", "deniz", "orman", "güneş", "yıldız", "gökyüzü", "bulut", "rüzgar", "yağmur", "bugün", "yarın", "şimdi", "sonra", "önce", "burada", "orada", "içeri", "dışarı", "yukarı", "aşağı", "sebep", "sonuç", "amaç", "araç", "değer", "fiyat", "miktar", "kelime", "cümle", "sayfa", "kalem", "defter", "çanta", "ayakkabı", "elbise", "saat", "telefon", "bilgisayar", "araba", "uçak", "gemi", "tren", "otobüs", "bisiklet", "yolcu", "şoför", "kaptan", "pilot", "doktor", "öğretmen", "öğrenci", "mühendis", "işçi", "patron", "polis", "asker", "kral", "başkan", "müdür", "işlem", "sistem", "yöntem", "kural", "kanun", "görev", "sorumluluk", "başarı", "kazanç", "kayıp", "fayda", "zarar", "tehlike", "güven", "şüphe", "inanç", "felsefe", "mantık", "duygu", "düşünce", "hareket", "durum", "olay", "macera", "hikaye", "masal", "şiir", "roman", "tiyatro", "müzik", "dans", "spor", "futbol", "basketbol", "voleybol", "yüzme", "koşu", "yarış", "oyuncu", "takım", "şampiyon", "kupa", "madalya", "ödül", "ceza", "suç", "mahkeme", "hakim", "avukat", "şahit", "kanıt", "belge", "imza", "mektup", "mesaj", "selam", "teşekkür", "özür", "rica", "istek", "emir", "yasak", "izin", "onay", "kabul", "şart", "koşul", "seçenek", "tercih", "karar", "niyet", "hedef"],

    initAudio: function() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    },

    playSound: function(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        const now = this.audioCtx.currentTime;

        if (type === 'type') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'error') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'word') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
            gainNode.gain.setValueAtTime(0.03, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        }
    },

    showView: function(v) {
        document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
        document.getElementById(v).classList.add('active');
        if (v === 'view-home' && this.stompClient) { 
            this.stompClient.disconnect(); 
            this.stompClient = null; 
        }
    },

    connectToSocket: function(rc) {
        const socket = new SockJS(BACKEND_URL);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null;
        this.stompClient.connect({}, () => {
            this.stompClient.subscribe('/topic/room/' + rc, (p) => this.onMsg(JSON.parse(p.body)));
            this.stompClient.send("/app/game/"+rc+"/join", {}, JSON.stringify({type:'JOIN', sender:this.username, roomCode:rc, color:""}));
        });
    },

    onMsg: function(m) {
        if (m.type === 'ROOM_STATE') {
            this.connectedPlayers = m.playerList;
            let me = this.connectedPlayers.find(p => p.name === this.username);
            if (me) this.userColor = me.color;
            this.renderPalette(); 
            this.updateLobby(); 
            this.setupTracks();
        } else if (m.type === 'START') {
            this.words = m.content.toLowerCase().split(" "); 
            this.showView('view-race'); 
            this.initGame(false); 
            this.startTimer();
        } else if (m.type === 'UPDATE_PROGRESS') {
            let p = this.connectedPlayers.find(pl => pl.name === m.sender);
            if (p) { 
                p.progress = m.progress; 
                p.wpm = m.wpm; 
                if (m.sender !== this.username) this.moveCar(m.sender, m.progress); 
            }
        }
    },

    renderPalette: function() {
        const pal = document.getElementById('color-palette'); 
        if (!pal) return; 
        pal.innerHTML = '';
        
        this.ALL_COLORS.forEach(c => {
            const s = document.createElement('div'); 
            s.className = 'color-swatch'; 
            s.style.background = c; 
            s.style.color = c;
            
            let owner = this.connectedPlayers.find(pl => pl.color === c);
            if (owner) { 
                s.classList.add(owner.name === this.username ? 'selected' : 'taken'); 
            } else { 
                s.onclick = () => {
                    this.stompClient.send("/app/game/"+this.roomCode+"/changeColor", {}, JSON.stringify({type:'CHANGE_COLOR', sender:this.username, roomCode:this.roomCode, color:c}));
                };
            }
            pal.appendChild(s);
        });
    },

    createRoom: function() { 
        this.initAudio();
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Savaşa girmeden önce lütfen Savaşçı Adını gir!");
        this.username = nameInp;
        this.roomCode = Math.floor(1000+Math.random()*9000).toString(); 
        this.isMultiplayer = true; 
        document.getElementById('display-room-code').innerText = '#'+this.roomCode; 
        this.showView('view-lobby'); 
        this.connectToSocket(this.roomCode); 
    },

    joinRoom: function() { 
        this.initAudio();
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Savaşa girmeden önce lütfen Savaşçı Adını gir!");
        this.username = nameInp;
        this.roomCode = document.getElementById('room-code').value.trim(); 
        if(!this.roomCode) return alert("Lütfen Oda Kodu girin!");
        this.isMultiplayer = true; 
        document.getElementById('display-room-code').innerText = '#'+this.roomCode; 
        this.showView('view-lobby'); 
        this.connectToSocket(this.roomCode); 
    },

    startMultiplayerGame: function() { 
        this.initAudio();
        this.stompClient.send("/app/game/"+this.roomCode+"/start", {}, JSON.stringify({type:'START', sender:this.username, roomCode:this.roomCode})); 
    },
    
    startSinglePlayer: function() { 
        this.initAudio();
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Antrenmana girmeden önce lütfen Savaşçı Adını gir!");
        this.username = nameInp;
        this.isMultiplayer = false; 
        this.connectedPlayers = [{name:this.username, color:this.ALL_COLORS[0], progress:0, wpm:0}]; 
        this.showView('view-race'); 
        this.initGame(true); 
    },

    initGame: function(generateWords) {
        if (generateWords) { 
            this.words = []; 
            for(let i=0; i<60; i++) {
                this.words.push(this.turkishWordPool[Math.floor(Math.random()*this.turkishWordPool.length)]);
            }
        }
        this.currentIndex = 0; 
        this.stats = {correctWords:0, correctLetters:0, incorrectLetters:0}; 
        this.timeLeft = 60;
        
        this.wordStreak = 0;
        this.madeErrorInCurrentWord = false;
        this.updateComboUI();

        document.getElementById('timer').innerText = 60; 
        document.getElementById('wpm-live').innerText = 0;
        
        const inp = document.getElementById('word-input'); 
        inp.value = ''; 
        inp.disabled = false; 
        inp.classList.remove('input-error');
        
        this.setupTracks(); 
        this.renderWords(); 
        setTimeout(() => inp.focus(), 100);
    },

    setupTracks: function() {
        const tc = document.getElementById('track-container'); 
        tc.innerHTML = '';
        this.connectedPlayers.forEach(p => { 
            const isMe = p.name === this.username;
            tc.innerHTML += `<div class="track"><div class="car" id="car-${p.name}" style="background:${p.color}; z-index:${isMe?10:5}">${p.name}</div></div>`; 
        });
    },

    moveCar: function(n, prg) { 
        const c = document.getElementById(`car-${n}`); 
        if (c) c.style.left = `calc(${prg}% - 30px)`; 
    },

    renderWords: function() {
        const d = document.getElementById('word-display'); 
        d.innerHTML = '';
        this.words.forEach((w, i) => { 
            const s = document.createElement('span'); 
            s.className = 'word' + (i === this.currentIndex ? ' active' : '');
            w.split('').forEach(char => {
                const charSpan = document.createElement('span'); 
                charSpan.innerText = char; 
                charSpan.className = 'letter';
                s.appendChild(charSpan);
            });
            d.appendChild(s); 
        });
    },

    startTimer: function() {
        this.isPlaying = true;
        this.initAudio();

        this.timerInterval = setInterval(() => {
            this.timeLeft--; 
            document.getElementById('timer').innerText = this.timeLeft;
            
            let elap = 60 - this.timeLeft;
            let wpm = elap > 0 ? Math.round((this.stats.correctWords / elap) * 60) : 0;
            document.getElementById('wpm-live').innerText = wpm;
            
            if (this.isMultiplayer && this.stompClient) {
                let me = this.connectedPlayers.find(p => p.name === this.username);
                this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:me?me.progress:0, wpm:wpm}));
            }
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    },

    handleInput: function() {
        const inp = document.getElementById('word-input'); 
        const val = inp.value.toLowerCase();

        if (!this.isMultiplayer && !this.isPlaying && val.length > 0) this.startTimer();
        const cur = this.words[this.currentIndex];
        
        if (val.endsWith(' ')) {
            if (val.trim() === cur) {
                this.stats.correctWords++; 
                this.stats.correctLetters += cur.length + 1;
                this.playSound('word');

                if (!this.madeErrorInCurrentWord) {
                    this.wordStreak++;
                    this.updateComboUI();
                }
                
                this.madeErrorInCurrentWord = false;
                const wordEls = document.querySelectorAll('.word'); 
                wordEls[this.currentIndex].classList.remove('active');
                
                this.currentIndex++; 
                inp.value = ''; 
                inp.classList.remove('input-error');
                
                let prg = (this.currentIndex / this.words.length) * 100; 
                this.moveCar(this.username, prg);
                
                let me = this.connectedPlayers.find(p => p.name === this.username); 
                if (me) { me.progress = prg; me.wpm = Math.round((this.stats.correctWords / (60 - this.timeLeft)) * 60); }
                
                if (this.isMultiplayer && this.stompClient) {
                    this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:prg, wpm:me?me.wpm:0}));
                }

                if (this.currentIndex >= this.words.length) { 
                    this.endGame(); 
                } else { 
                    wordEls[this.currentIndex].classList.add('active'); 
                    if (wordEls[this.currentIndex].offsetTop > wordEls[0].offsetTop + 40) {
                        for(let i=0; i<this.currentIndex; i++) wordEls[i].style.display = 'none';
                    }
                }
            } else { 
                inp.value = val.trim(); 
                inp.classList.add('input-error'); 
                this.madeErrorInCurrentWord = true;
                this.wordStreak = 0;
                this.updateComboUI();
                this.playSound('error');
            }
            return;
        }

        let hasError = false;
        let isTypingCorrectly = true;
        const activeWordEl = document.querySelectorAll('.word')[this.currentIndex];
        
        if(activeWordEl) {
            const letters = activeWordEl.querySelectorAll('.letter');
            letters.forEach(l => l.classList.remove('correct', 'incorrect'));
            
            for (let i = 0; i < val.length; i++) {
                if (i < cur.length) {
                    if (val[i] === cur[i]) {
                        letters[i].classList.add('correct');
                    } else { 
                        letters[i].classList.add('incorrect'); 
                        hasError = true; 
                        isTypingCorrectly = false;
                    }
                } else {
                    hasError = true;
                    isTypingCorrectly = false;
                }
            }
        }
        
        if (hasError) {
            inp.classList.add('input-error');
            if (!this.madeErrorInCurrentWord) {
                this.stats.incorrectLetters++;
                this.madeErrorInCurrentWord = true;
                this.wordStreak = 0;
                this.updateComboUI();
                this.playSound('error');
            }
        } else {
            inp.classList.remove('input-error');
            if (val.length > 0 && isTypingCorrectly) {
                this.playSound('type'); 
            }
        }
    },

    updateComboUI: function() {
        const comboDisplay = document.getElementById('combo-display');
        const comboCount = document.getElementById('combo-count');
        
        if (this.wordStreak >= 3) { 
            comboDisplay.classList.remove('combo-hidden');
            comboCount.innerText = this.wordStreak;
            
            comboDisplay.classList.remove('combo-pulse');
            void comboDisplay.offsetWidth; 
            comboDisplay.classList.add('combo-pulse');
        } else {
            comboDisplay.classList.add('combo-hidden');
        }
    },

    // YENİ: VAR İncelemesi ve Senkronizasyon (Desync Çözümü)
    endGame: function() {
        clearInterval(this.timerInterval); 
        this.isPlaying = false;
        
        const inp = document.getElementById('word-input');
        inp.disabled = true;
        inp.value = "Sonuçlar hesaplanıyor..."; // Oyunculara 1 saniye bekleme mesajı veriyoruz
        
        let elap = 60 - this.timeLeft || 60;
        const finalWpm = Math.round((this.stats.correctWords / elap) * 60);
        let acc = this.stats.correctLetters > 0 ? Math.round((this.stats.correctLetters/(this.stats.correctLetters+this.stats.incorrectLetters || 1))*100) : 0;
        let finalProgress = (this.currentIndex / this.words.length) * 100;
        
        document.getElementById('result-wpm').innerText = finalWpm;
        document.getElementById('result-acc').innerText = `%${acc}`;
        
        if (!this.isMultiplayer) this.saveLocalRecord(finalWpm, acc);

        // Kendi gerçek değerlerimizi atıyoruz (%100'e zorlamıyoruz)
        let me = this.connectedPlayers.find(p => p.name === this.username);
        if (me) { 
            me.wpm = finalWpm; 
            me.progress = finalProgress; 
        }

        // Son Puanımızı acilen Java Sunucusuna Gönderiyoruz
        if (this.isMultiplayer && this.stompClient) {
            this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({
                type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:finalProgress, wpm:finalWpm
            }));
        }

        // SENKRONİZASYON İÇİN 1 SANİYE BEKLE (Rakiplerin son verisi gelsin)
        setTimeout(() => {
            this.connectedPlayers.sort((a,b) => {
                if(b.progress !== a.progress) return b.progress - a.progress;
                return b.wpm - a.wpm;
            });

            const pod = document.getElementById('top-3-podium'); 
            pod.innerHTML = '';
            const list = document.getElementById('rest-of-leaderboard'); 
            list.innerHTML = '';
            
            const slots = [{p:this.connectedPlayers[1], h:'130px', r:'2.'}, {p:this.connectedPlayers[0], h:'180px', r:'1. 👑'}, {p:this.connectedPlayers[2], h:'90px', r:'3.'}];
            slots.forEach(s => {
                if(s.p) {
                    pod.innerHTML += `
                    <div style="width: 30%; height: 100%; display: flex; align-items: flex-end;">
                        <div class="podium-box" style="height: ${s.h}; background: ${s.p.color};">
                            <span class="podium-rank">${s.r}</span>
                            <span class="podium-name">${s.p.name}</span>
                            <span class="podium-wpm">${s.p.wpm} DKS</span>
                        </div>
                    </div>`;
                } else { 
                    pod.innerHTML += `<div style="width: 30%;"></div>`; 
                }
            });

            for(let i=3; i<this.connectedPlayers.length; i++){
                let pl = this.connectedPlayers[i];
                list.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding:10px;">${i+1}.</td><td style="padding:10px; color:${pl.color}; font-weight:bold;">${pl.name}</td><td style="padding:10px;">%${Math.round(pl.progress)}</td><td style="padding:10px;">${pl.wpm} DKS</td></tr>`;
            }
            
            this.showView('view-results');
        }, 1000); // 1 Saniyelik Bekleme (VAR Sistemi)
    },

    updateLobby: function() {
        const l = document.getElementById('player-list'); 
        l.innerHTML = '';
        this.connectedPlayers.forEach(p => { 
            l.innerHTML += `<li style="border-left:4px solid ${p.color}; padding:10px; margin-bottom:5px; background:rgba(0,0,0,0.3); border-radius:8px;">${p.name}</li>`; 
        });
        document.getElementById('player-count').innerText = this.connectedPlayers.length;
    },

    saveLocalRecord: function(wpm, acc) {
        if(wpm <= 0) return;
        let records = JSON.parse(localStorage.getItem('typeArenaRecords')) || [];
        const date = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
        records.push({ date: date, wpm: wpm, acc: acc });
        records.sort((a,b) => b.wpm - a.wpm); 
        records = records.slice(0, 10); 
        localStorage.setItem('typeArenaRecords', JSON.stringify(records));
    },

    showLocalLeaderboard: function() {
        let records = JSON.parse(localStorage.getItem('typeArenaRecords')) || [];
        const list = document.getElementById('local-records-list');
        list.innerHTML = '';
        if(records.length === 0) {
            list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #64748b;">Henüz rekorun yok. Antrenmana başla!</td></tr>`;
        } else {
            records.forEach(r => {
                list.innerHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; color: #94a3b8;">${r.date}</td>
                    <td style="padding: 10px; font-weight: bold; color: #fbbf24;">${r.wpm}</td>
                    <td style="padding: 10px; color: #10b981;">%${r.acc}</td>
                </tr>`;
            });
        }
        this.showView('view-local-leaderboard');
    }
};

document.getElementById('word-input').addEventListener('input', () => app.handleInput());
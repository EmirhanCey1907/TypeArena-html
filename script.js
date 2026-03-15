const app = {
    username: "", userColor: "#6366f1", roomCode: null, words: [], currentIndex: 0,
    stats: { correctWords: 0, wrongWords: 0, correctLetters: 0, wrongLetters: 0, totalKeystrokes: 0 },
    timeLeft: 60, timerInterval: null, isPlaying: false, 
    gameMode: 'SOLO', 
    stompClient: null, connectedPlayers: [], 
    
    wordStreak: 0, madeErrorInCurrentWord: false, currentWordIsWrong: false, audioCtx: null,

    ALL_COLORS: ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#14b8a6", "#3b82f6", "#a855f7", "#eab308", "#f43f5e", "#0ea5e9"],
    
    // 10FastFingers Karıştırılmış Kelime Havuzu
    turkishWordPool: ["ve", "bir", "bu", "da", "için", "ile", "çok", "gibi", "daha", "kadar", "kendi", "en", "sonra", "başka", "çünkü", "böyle", "sadece", "neden", "ancak", "zaman", "insan", "hayat", "gün", "yıl", "şey", "iyi", "yeni", "yok", "var", "hiç", "evet", "hayır", "tamam", "büyük", "küçük", "ilk", "son", "önce", "şimdi", "bugün", "burada", "orada", "içeri", "dışarı", "kim", "ne", "nasıl", "hangi", "nerede", "niye", "ben", "sen", "o", "biz", "siz", "onlar", "benim", "senin", "onun", "bizim", "sizin", "onların", "bana", "sana", "ona", "bize", "size", "onlara", "beni", "seni", "onu", "bizi", "sizi", "onları", "kız", "erkek", "kadın", "adam", "çocuk", "baba", "anne", "kardeş", "dost", "arkadaş", "ev", "okul", "iş", "yol", "yer", "su", "para", "göz", "el", "yüz", "baş", "ses", "kitap", "kelime", "isim", "soru", "cevap", "durum", "olay", "gece", "sabah", "akşam", "saat", "dakika", "hafta", "ay", "doğru", "yanlış", "güzel", "kötü", "zor", "kolay", "hızlı", "yavaş", "uzun", "kısa", "eski", "genç", "yaşlı", "tek", "aynı", "farklı", "bütün", "tüm", "her", "bazı", "biraz", "fazla", "az", "tam", "yarım", "çeyrek", "birkaç", "herkes", "hiçbiri", "kimse", "yapmak", "gelmek", "gitmek", "çalışmak", "okumak", "yazmak", "bilmek", "söylemek", "düşünmek", "anlamak", "görmek", "bakmak", "almak", "vermek", "bulmak", "kalmak", "kullanmak", "çıkmak", "durmak", "yaşamak", "sevmek", "inanmak", "beklemek", "aramak", "sormak", "cevaplamak", "başlamak", "bitirmek", "oynamak", "kazanmak", "kaybetmek", "koşmak", "yürümek", "oturmak", "kalkmak", "uyumak", "uyanmak", "yemek", "içmek", "izlemek", "dinlemek", "konuşmak", "susmak", "gülmek", "ağlamak", "duygu", "akıl", "fikir", "bilgi", "haber", "oyun", "şarkı", "film", "resim", "sanat", "bilim", "tarih", "doğa", "deniz", "orman", "güneş", "yıldız", "gökyüzü", "rüzgar", "yağmur", "sebep", "sonuç", "amaç", "araç", "değer", "fiyat", "miktar", "cümle", "sayfa", "kalem", "defter", "çanta", "araba", "uçak", "gemi", "tren", "otobüs", "bisiklet", "doktor", "öğretmen", "öğrenci", "mühendis", "işçi", "patron", "polis", "asker", "müdür", "işlem", "sistem", "yöntem", "kural", "kanun", "görev", "başarı", "kazanç", "kayıp", "tehlike", "güven", "şüphe", "hareket", "macera", "hikaye", "tiyatro", "müzik", "spor", "takım", "şampiyon", "ödül", "ceza", "mahkeme", "kanıt", "belge", "imza", "mektup", "mesaj", "selam", "teşekkür", "özür", "rica", "istek", "emir", "yasak", "izin", "onay", "kabul", "şart", "koşul", "seçenek", "tercih", "karar", "hedef", "yaptım", "geldi", "gidiyor", "çalışacak", "okur", "yazdı", "bilecek", "söyledi", "düşünüyor", "anladı", "gördü", "baktı", "alacak", "veriyor", "buldu", "kaldı", "çıktı", "durdu", "yaşıyor", "sevdi", "bekliyor", "aradı"],

    initAudio: function() {
        if (!this.audioCtx) { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    },

    playSound: function(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator(), gainNode = this.audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(this.audioCtx.destination);
        const now = this.audioCtx.currentTime;
        if (type === 'type') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.05); gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
        else if (type === 'error') { osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
        else if (type === 'word') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); gainNode.gain.setValueAtTime(0.03, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
    },

    showView: function(v) {
        document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
        document.getElementById(v).classList.add('active');
        if (v === 'view-home' && this.stompClient) { this.stompClient.disconnect(); this.stompClient = null; }
    },

    showModeSelect: function() {
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Devam etmeden önce lütfen Savaşçı Adını gir!");
        this.username = nameInp;
        this.showView('view-mode-select');
    },

    showGlobalArena: function() {
        this.initAudio();
        let nameInp = document.getElementById('global-username').value.trim();
        this.username = nameInp ? nameInp : "Misafir";
        this.gameMode = 'GLOBAL';
        this.showView('view-global-arena');
        this.renderGlobalPalette();
        this.fetchTop5();
    },

    renderGlobalPalette: function() {
        const pal = document.getElementById('global-color-palette'); pal.innerHTML = '';
        this.ALL_COLORS.forEach(c => {
            const s = document.createElement('div'); s.className = 'color-swatch'; s.style.background = c;
            if(this.userColor === c) s.classList.add('selected');
            s.onclick = () => { this.userColor = c; this.renderGlobalPalette(); };
            pal.appendChild(s);
        });
    },

    fetchTop5: function() {
        fetch(API_URL).then(res => res.json()).then(data => {
            const tbody = document.getElementById('top5-list'); tbody.innerHTML = '';
            if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Henüz rekor yok. İlk sen ol!</td></tr>'; return; }
            data.forEach((p, i) => {
                tbody.innerHTML += `<tr><td style="color:#fbbf24; font-weight:bold;">${i+1}.</td><td style="color:#f8fafc;">${p.name}</td><td style="color:#84cc16; font-weight:bold;">${p.wpm}</td></tr>`;
            });
        }).catch(err => console.log(err));
    },

    startGlobalRace: function() {
        this.connectedPlayers = [{name:this.username, color:this.userColor, progress:0, wpm:0}];
        this.showView('view-race');
        this.initGame();
    },

    startSinglePlayer: function() {
        this.initAudio();
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Antrenmana girmeden önce Savaşçı Adını gir!");
        this.username = nameInp;
        this.gameMode = 'SOLO';
        this.connectedPlayers = [{name:this.username, color:this.ALL_COLORS[0], progress:0, wpm:0}];
        this.showView('view-race');
        this.initGame();
    },

    connectToSocket: function(rc) {
        const socket = new SockJS(BACKEND_URL); this.stompClient = Stomp.over(socket); this.stompClient.debug = null;
        this.stompClient.connect({}, () => {
            this.stompClient.subscribe('/topic/room/' + rc, (p) => this.onMsg(JSON.parse(p.body)));
            this.stompClient.send("/app/game/"+rc+"/join", {}, JSON.stringify({type:'JOIN', sender:this.username, roomCode:rc, color:""}));
        });
    },

    createRoom: function(selectedMode) {
        this.initAudio();
        this.gameMode = selectedMode;
        this.roomCode = Math.floor(1000+Math.random()*9000).toString();
        document.getElementById('display-room-code').innerText = '#'+this.roomCode;
        document.getElementById('lobby-mode-text').innerText = selectedMode === 'SERIKATIL' ? '⚔️ Mod: Seri Katil' : '⚡ Mod: Profesyonel (DKS)';
        this.showView('view-lobby');
        this.connectToSocket(this.roomCode);
    },

    joinRoom: function() {
        this.initAudio();
        let nameInp = document.getElementById('username').value.trim();
        if(!nameInp) return alert("Savaşa girmeden önce Savaşçı Adını gir!");
        this.username = nameInp;
        this.roomCode = document.getElementById('room-code').value.trim();
        if(!this.roomCode) return alert("Lütfen Oda Kodu girin!");
        document.getElementById('display-room-code').innerText = '#'+this.roomCode;
        this.showView('view-lobby');
        this.connectToSocket(this.roomCode);
    },

    startMultiplayerGame: function() {
        this.initAudio();
        this.stompClient.send("/app/game/"+this.roomCode+"/start", {}, JSON.stringify({type:'START', sender:this.username, roomCode:this.roomCode, content:this.gameMode}));
    },

    onMsg: function(m) {
        if (m.type === 'ROOM_STATE') {
            this.connectedPlayers = m.playerList;
            let me = this.connectedPlayers.find(p => p.name === this.username);
            if (me) this.userColor = me.color;
            this.renderPalette(); this.updateLobby(); this.setupTracks();
        } else if (m.type === 'START') {
            let parts = m.content.split('|');
            if(parts.length > 1) { this.gameMode = parts[0]; this.words = parts[1].toLowerCase().split(" "); }
            else { this.words = m.content.toLowerCase().split(" "); }
            
            this.showView('view-race');
            this.initGame(false);
            this.startMultiplayerCountdown(); 
        } else if (m.type === 'UPDATE_PROGRESS') {
            let p = this.connectedPlayers.find(pl => pl.name === m.sender);
            if (p) { 
                if (m.wpm === -999) {
                    p.wpm = 0; p.progress = 0; p.isCheater = true;
                    const car = document.getElementById(`car-${p.name}`);
                    if(car) { car.classList.add('cheater-car'); car.innerHTML = '☠️ BANNED'; }
                } else if (!p.isCheater) {
                    p.progress = m.progress; p.wpm = m.wpm; 
                    if (m.sender !== this.username) this.moveCar(m.sender, m.progress); 
                }
            }
        }
    },

    renderPalette: function() {
        const pal = document.getElementById('color-palette'); if (!pal) return; pal.innerHTML = '';
        this.ALL_COLORS.forEach(c => {
            const s = document.createElement('div'); s.className = 'color-swatch'; s.style.background = c; s.style.color = c;
            let owner = this.connectedPlayers.find(pl => pl.color === c);
            if (owner) { s.classList.add(owner.name === this.username ? 'selected' : 'taken'); } 
            else { s.onclick = () => { this.stompClient.send("/app/game/"+this.roomCode+"/changeColor", {}, JSON.stringify({type:'CHANGE_COLOR', sender:this.username, roomCode:this.roomCode, color:c})); }; }
            pal.appendChild(s);
        });
    },

    initGame: function(generateWords = true) {
        if (generateWords) {
            let shuffledPool = [...this.turkishWordPool].sort(() => 0.5 - Math.random());
            this.words = shuffledPool.slice(0, 200);
        }
        this.currentIndex = 0;
        this.stats = { correctWords: 0, wrongWords: 0, correctLetters: 0, wrongLetters: 0, totalKeystrokes: 0 };
        this.timeLeft = 60; this.wordStreak = 0; this.madeErrorInCurrentWord = false; this.currentWordIsWrong = false;

        this.updateComboUI();
        document.getElementById('timer').innerText = 60;
        
        const inp = document.getElementById('word-input');
        inp.value = ''; inp.classList.remove('input-error');
        
        this.setupTracks(); this.renderWords();
        
        if(this.gameMode === 'SOLO' || this.gameMode === 'GLOBAL') {
            inp.disabled = false;
            document.getElementById('countdown-overlay').style.display = 'none';
            setTimeout(() => inp.focus(), 100);
        } else {
            inp.disabled = true;
        }
    },

    startMultiplayerCountdown: function() {
        document.getElementById('countdown-overlay').style.display = 'block';
        let cd = 2;
        document.getElementById('countdown-overlay').innerHTML = `Yarış başlıyor... Hazırlan! 🔒 (${60 + cd})`;
        
        let intv = setInterval(() => {
            cd--;
            if(cd > 0) {
                document.getElementById('countdown-overlay').innerHTML = `Yarış başlıyor... Hazırlan! 🔒 (${60 + cd})`;
            } else {
                clearInterval(intv);
                document.getElementById('countdown-overlay').style.display = 'none';
                const inp = document.getElementById('word-input');
                inp.disabled = false;
                inp.focus();
                this.startTimer();
            }
        }, 1000);
    },

    setupTracks: function() {
        const tc = document.getElementById('track-container'); tc.innerHTML = '';
        this.connectedPlayers.forEach(p => {
            const isMe = p.name === this.username;
            tc.innerHTML += `<div class="track"><div class="car" id="car-${p.name}" style="background:${p.color}; z-index:${isMe?10:5}">${p.name}</div></div>`;
        });
    },

    moveCar: function(n, prg) {
        const c = document.getElementById(`car-${n}`);
        if (c && !c.classList.contains('cheater-car')) c.style.left = `calc(${prg}% - 30px)`;
    },

    renderWords: function() {
        const d = document.getElementById('word-display'); d.innerHTML = '';
        this.words.forEach((w, i) => {
            const s = document.createElement('span');
            s.className = 'word' + (i === this.currentIndex ? ' active' : '');
            w.split('').forEach(char => {
                const charSpan = document.createElement('span'); charSpan.innerText = char; charSpan.className = 'letter';
                s.appendChild(charSpan);
            });
            d.appendChild(s);
        });
    },

    checkScroll: function() {
        const wordEls = document.querySelectorAll('.word');
        if(!wordEls[this.currentIndex]) return;
        const activeWord = wordEls[this.currentIndex];
        if (activeWord.offsetTop > wordEls[0].offsetTop + 40) {
            for(let i=0; i<this.currentIndex; i++) {
                wordEls[i].style.display = 'none';
            }
        }
    },

    startTimer: function() {
        this.isPlaying = true; this.initAudio();
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--; document.getElementById('timer').innerText = this.timeLeft;
            
            let elapMin = (60 - this.timeLeft) / 60;
            let currentDks = 0;
            if(elapMin > 0) {
                let grossWpm = (this.stats.totalKeystrokes / 5) / elapMin;
                let errorRate = this.stats.wrongWords / elapMin;
                currentDks = Math.round(grossWpm - errorRate);
                if (currentDks < 0) currentDks = 0;
            }

            if ((this.gameMode === 'SERIKATIL' || this.gameMode === 'PROFESYONEL') && this.stompClient) {
                let progress = (this.currentIndex / 100) * 100;
                if(progress > 100) progress = 100;
                this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:progress, wpm:currentDks}));
            }

            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    },

    punishCheater: function() {
        clearInterval(this.timerInterval);
        this.isPlaying = false;
        const inp = document.getElementById('word-input');
        inp.disabled = true;
        inp.value = "HİLE ENGELİ!";
        
        if ((this.gameMode === 'SERIKATIL' || this.gameMode === 'PROFESYONEL') && this.stompClient) {
            this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress: 0, wpm: -999}));
        }
        
        alert("🚨 KALKAN DEVREDE: Yazılım ile dışarıdan müdahale algılandı. Fiziksel klavye kullanmadığınız için sistemden atıldınız.");
        this.showView('view-home');
    },

    handleInput: function(e) {
        // Hile Koruması: Eğer fiziksel tuş kullanılmıyorsa engelle
        if (e && e.type === 'input' && !e.isTrusted) {
            e.preventDefault(); 
            this.punishCheater(); 
            return;
        }

        const inp = document.getElementById('word-input'); 
        const val = inp.value.toLowerCase();

        if (!this.isPlaying && val.length > 0 && (this.gameMode === 'SOLO' || this.gameMode === 'GLOBAL')) {
            this.startTimer();
        }
        
        const cur = this.words[this.currentIndex];
        this.currentWordIsWrong = false;

        if (val.endsWith(' ')) {
            this.stats.totalKeystrokes++; 
            const typedWord = val.trim();

            if (typedWord === cur) {
                this.stats.correctWords++;
                this.stats.correctLetters += cur.length + 1;
                this.playSound('word');
                if (!this.madeErrorInCurrentWord) { this.wordStreak++; this.updateComboUI(); }
                
                this.advanceToNextWord(inp, true);
            } else {
                if (this.gameMode === 'SERIKATIL') {
                    inp.value = typedWord;
                    inp.classList.add('input-error');
                    this.playSound('error');
                    return; 
                } else {
                    this.stats.wrongWords++;
                    this.wordStreak = 0; this.updateComboUI();
                    this.playSound('error');
                    this.advanceToNextWord(inp, false);
                }
            }
            return;
        }

        let hasError = false;
        const activeWordEl = document.querySelectorAll('.word')[this.currentIndex];
        
        if(activeWordEl) {
            const letters = activeWordEl.querySelectorAll('.letter');
            letters.forEach(l => l.classList.remove('correct', 'incorrect'));
            
            for (let i = 0; i < val.length; i++) {
                if (i < cur.length) {
                    if (val[i] === cur[i]) { letters[i].classList.add('correct'); } 
                    else { letters[i].classList.add('incorrect'); hasError = true; }
                } else { hasError = true; }
            }
        }
        
        if (hasError) {
            inp.classList.add('input-error');
            this.currentWordIsWrong = true;
            if (!this.madeErrorInCurrentWord) {
                this.stats.wrongLetters++;
                this.stats.totalKeystrokes++;
                this.madeErrorInCurrentWord = true;
                this.wordStreak = 0; this.updateComboUI();
                this.playSound('error');
            }
        } else {
            inp.classList.remove('input-error');
            if (val.length > 0 && this.stats.totalKeystrokes < (this.stats.correctLetters + this.stats.wrongLetters + 10)) {
                this.stats.totalKeystrokes++;
                this.playSound('type'); 
            }
        }
    },

    advanceToNextWord: function(inp, isCorrect) {
        const wordEls = document.querySelectorAll('.word');
        if(isCorrect) {
            wordEls[this.currentIndex].classList.remove('active');
        } else {
            wordEls[this.currentIndex].classList.remove('active');
            wordEls[this.currentIndex].classList.add('wrong');
        }
        
        this.madeErrorInCurrentWord = false;
        this.currentIndex++;
        inp.value = '';
        inp.classList.remove('input-error');
        
        let prg = (this.currentIndex / 100) * 100; 
        if(prg > 100) prg = 100;
        this.moveCar(this.username, prg);
        
        let me = this.connectedPlayers.find(p => p.name === this.username);
        if (me) { 
            me.progress = prg; 
            let elap = 60 - this.timeLeft;
            if (elap > 0) {
                let grossWpm = (this.stats.totalKeystrokes / 5) / (elap/60);
                let currentDks = Math.round(grossWpm - (this.stats.wrongWords / (elap/60)));
                me.wpm = currentDks > 0 ? currentDks : 0;
            } else {
                me.wpm = 0;
            }
        }
        
        if ((this.gameMode === 'SERIKATIL' || this.gameMode === 'PROFESYONEL') && this.stompClient) {
            this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:prg, wpm:me?me.wpm:0}));
        }

        if(wordEls[this.currentIndex]) {
            wordEls[this.currentIndex].classList.add('active');
            this.checkScroll(); 
        } else {
            this.endGame(); 
        }
    },

    updateComboUI: function() {
        const comboDisplay = document.getElementById('combo-display');
        const comboCount = document.getElementById('combo-count');
        if (this.wordStreak >= 3) { 
            comboDisplay.classList.remove('combo-hidden'); comboCount.innerText = this.wordStreak;
            comboDisplay.classList.remove('combo-pulse'); void comboDisplay.offsetWidth; comboDisplay.classList.add('combo-pulse');
        } else { comboDisplay.classList.add('combo-hidden'); }
    },

    endGame: function() {
        clearInterval(this.timerInterval); this.isPlaying = false;
        const inp = document.getElementById('word-input');
        inp.disabled = true; inp.value = "Sonuçlar hesaplanıyor...";
        
        let elapMin = (60 - this.timeLeft || 60) / 60;
        let grossWpm = (this.stats.totalKeystrokes / 5) / elapMin;
        let finalWpm = Math.round(grossWpm - (this.stats.wrongWords / elapMin));
        if (finalWpm < 0 || isNaN(finalWpm) || !isFinite(finalWpm)) finalWpm = 0;
        
        let totalRealKeys = this.stats.correctLetters + this.stats.wrongLetters + this.stats.correctWords; 
        let acc = totalRealKeys > 0 ? Math.round(((totalRealKeys - this.stats.wrongLetters) / totalRealKeys) * 100) : 0;
        
        document.getElementById('result-wpm').innerText = finalWpm;
        document.getElementById('res-keys-correct').innerText = totalRealKeys - this.stats.wrongLetters;
        document.getElementById('res-keys-wrong').innerText = this.stats.wrongLetters;
        document.getElementById('res-keys-total').innerText = totalRealKeys;
        document.getElementById('res-accuracy').innerText = `%${acc}`;
        document.getElementById('res-words-correct').innerText = this.stats.correctWords;
        document.getElementById('res-words-wrong').innerText = this.stats.wrongWords;
        
        let finalProgress = (this.currentIndex / 100) * 100;
        let me = this.connectedPlayers.find(p => p.name === this.username);
        if (me) { me.wpm = finalWpm; me.progress = finalProgress; }

        if (this.gameMode === 'SOLO') {
            this.saveLocalRecord(finalWpm, acc);
            document.getElementById('mp-leaderboard').style.display = 'none';
            document.getElementById('result-tebrik').innerText = "Antrenman Tamamlandı!";
        } else if (this.gameMode === 'GLOBAL') {
            fetch(API_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: this.username, wpm: finalWpm, acc: acc}) });
            document.getElementById('mp-leaderboard').style.display = 'none';
            document.getElementById('result-tebrik').innerText = "Skorun Global Tabloya Gönderildi!";
        }

        if (this.gameMode === 'SERIKATIL' || this.gameMode === 'PROFESYONEL') {
            document.getElementById('mp-leaderboard').style.display = 'block';
            if (this.stompClient) this.stompClient.send("/app/game/"+this.roomCode+"/progress", {}, JSON.stringify({type:'UPDATE_PROGRESS', sender:this.username, roomCode:this.roomCode, progress:finalProgress, wpm:finalWpm}));
        }

        setTimeout(() => {
            this.connectedPlayers.sort((a,b) => b.wpm - a.wpm); 
            
            if (this.gameMode === 'SERIKATIL' || this.gameMode === 'PROFESYONEL') {
                const list = document.getElementById('rest-of-leaderboard'); list.innerHTML = '';
                this.connectedPlayers.forEach((pl, i) => {
                    let crown = i === 0 ? '👑' : '';
                    let strikeClass = pl.isCheater ? 'style="text-decoration: line-through; color: #ef4444;"' : '';
                    let dksText = pl.isCheater ? 'BANNED' : `${pl.wpm} DKS`;
                    
                    list.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding:10px;">${i+1}.</td><td style="padding:10px; color:${pl.color}; font-weight:bold;" ${strikeClass}>${pl.name} ${crown}</td><td style="padding:10px; font-weight:bold;" ${strikeClass}>${dksText}</td></tr>`;
                });
                
                let myRank = this.connectedPlayers.findIndex(p => p.name === this.username) + 1;
                document.getElementById('result-tebrik').innerText = myRank === 1 ? "Şampiyon Sensin! 👑" : `Maçı ${myRank}. sırada tamamladın.`;
            }
            this.showView('view-results');
        }, 1000); 
    },

    updateLobby: function() {
        const l = document.getElementById('player-list'); l.innerHTML = '';
        this.connectedPlayers.forEach(p => { l.innerHTML += `<li style="border-left:4px solid ${p.color}; padding:10px; margin-bottom:5px; background:rgba(0,0,0,0.3); border-radius:8px;">${p.name}</li>`; });
        document.getElementById('player-count').innerText = this.connectedPlayers.length;
    },

    saveLocalRecord: function(wpm, acc) {
        if(wpm <= 0) return;
        let records = JSON.parse(localStorage.getItem('typeArenaRecords')) || [];
        const date = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
        records.push({ date: date, wpm: wpm, acc: acc });
        records.sort((a,b) => b.wpm - a.wpm); records = records.slice(0, 10); 
        localStorage.setItem('typeArenaRecords', JSON.stringify(records));
    },

    showLocalLeaderboard: function() {
        let records = JSON.parse(localStorage.getItem('typeArenaRecords')) || [];
        const list = document.getElementById('local-records-list'); list.innerHTML = '';
        if(records.length === 0) { list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #64748b;">Henüz rekorun yok. Antrenmana başla!</td></tr>`; } 
        else { records.forEach(r => { list.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 10px; color: #94a3b8;">${r.date}</td><td style="padding: 10px; font-weight: bold; color: #fbbf24;">${r.wpm}</td><td style="padding: 10px; color: #10b981;">%${r.acc}</td></tr>`; }); }
        this.showView('view-local-leaderboard');
    }
};

document.getElementById('word-input').addEventListener('input', (e) => app.handleInput(e));
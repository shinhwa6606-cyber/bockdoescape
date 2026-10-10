// Main Game Loop — MAJOR UPDATE v3.0
// Features: 20 enemies, 8 allies, last-kill slow-motion cinematic, particle explosions, tank display

class Game {
    constructor() {
        window.game = this; // Global reference for player.js / ai.js particle calls
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);

        // Subsystems
        this.env = new EnvironmentBuilder(this.scene);
        this.weaponCtrl = new WeaponController(this.scene, this.camera);
        this.player = new PlayerController(this.camera, this.scene, this.weaponCtrl);

        // Game Mode: 1v1 Roblox Rivals Duel
        this.allies  = [];
        this.enemies = [];
        this.TOTAL_ALLIES  = 0;
        this.TOTAL_ENEMIES = 1;

        // 1vs10 챌린지 모드
        this.challengeMode = false;   // N키로 토글

        // 5판 선승 라운드 시스템
        this.WIN_TARGET   = 5;
        this.playerWins   = 0;
        this.enemyWins    = 0;
        this.currentRound = 1;
        this.roundEnding  = false;

        // 💬 인게임 채팅 시스템 초기화
        if (typeof ChatSystem !== 'undefined') {
            window.chatSystem = new ChatSystem();
        }

        // 🎬 상대 시점 풀 라운드 녹화 & 리플레이 엔진
        this.roundFrames = [];
        this.recordTimer = 0;
        this.roundTime   = 0;
        this.isWatchingRivalPOV = false;
        this.replayIndex = 0;
        this.replayTime  = 0;
        this.replayTotalDuration = 0;
        this.rivalPOVSpeed = 1.0;
        this.lastRivalPos = new THREE.Vector3(0, 0, -22);
        this.lastRivalYaw = Math.PI;

        // Visual FX
        this.tracerBullets = [];
        this.particles = [];

        // Muzzle flash light
        this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 8);
        this.camera.add(this.muzzleLight);
        this.muzzleLight.position.set(0.25, -0.14, -0.65);

        // Slow-motion state
        this.slowMoActive = false;
        this.slowMoTimer  = 0;
        this.slowMoDuration = 3.0; // seconds in slow-mo for last kill

        // Game state
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.startTime = 0;
        this.totalShots = 0;
        this.totalHits  = 0;
        window.gameKills = 0;

        // Callbacks
        window.onGameOver = (isVictory) => this._endRound(isVictory);
        window.onPlayerShot = () => { this.totalShots++; };
        window.onPlayerHit  = () => { this.totalHits++; };

        this.setupUI();
        this.spawnSquads();

        window.addEventListener('resize', () => this.onResize());
        this.animate();

        // ── 핵 시스템 초기화 ─────────────────────────────────────────────
        window.hackSystem = new HackSystem();
    }

    setupUI() {
        // Weapon Card Selection
        document.querySelectorAll('.weapon-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.player.switchGun(card.getAttribute('data-weapon'));
            });
        });

        // Start Button
        const btnStart = document.getElementById('btn-start');
        btnStart.addEventListener('click', () => {
            if (this.isPlaying) return; // 이미 플레이 중이면 중복 실행/스폰 방지
            sounds.init();
            document.getElementById('start-overlay').classList.remove('active');
            document.getElementById('hud').classList.remove('hidden');

            // Spawn player at south side of Roblox Rivals arena
            this.player.position.set(0, 0, 22);
            this.player.velocity.set(0, 0, 0);
            this.player.isGrounded = true;
            this.player.yaw = 0;

            this.canvas.requestPointerLock();
            this.player.isPointerLocked = true;
            this.isPlaying = true;
            this.startTime = Date.now();

            btnStart.blur();
            if (document.activeElement) document.activeElement.blur();
        });

        // Pointer Lock
        this.canvas.addEventListener('click', () => {
            if (this.isPlaying && !this.player.isPointerLocked) this.canvas.requestPointerLock();
        });
        document.addEventListener('pointerlockchange', () => {
            this.player.isPointerLocked = (document.pointerLockElement === this.canvas);
        });

        // Restart Button
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) btnRestart.addEventListener('click', e => { e.stopPropagation(); location.reload(); });

        // 글로벌 Space 키 방어 (버튼 포커스 재클릭 버그 방지 & 상대 시점 스킵)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.isWatchingRivalPOV) {
                    this._skipRivalPOV();
                    e.preventDefault();
                    return;
                }
                if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                    document.activeElement.blur();
                }
            }
        });

        // N키: 1vs10 챌린지 토글
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyN' && this.isPlaying) {
                this.challengeMode = !this.challengeMode;
                this._showRoundResult(
                    this.challengeMode ? '⚠️ 1vs10 챌린지 모드 ON!' : '✅ 1vs1 보통 모드',
                    this.challengeMode ? '#ff4444' : '#00f0ff'
                );
                // 즉시 리스폰 (10명 새로 생성)
                if (!this.roundEnding) {
                    this.spawnSquads();
                }
            }
        });
    }

    spawnSquads() {
        // 이전 라운드의 적 및 아군 메시 시에서 완벽 제거
        if (this.enemies) {
            this.enemies.forEach(e => {
                if (e.mesh) this.scene.remove(e.mesh);
            });
        }
        if (this.allies) {
            this.allies.forEach(a => {
                if (a.mesh) this.scene.remove(a.mesh);
            });
        }
        this.allies = [];
        this.enemies = [];

        if (this.challengeMode) {
            // 하늘 맵에서 10명 랑덩 배치
            const positions = [
                new THREE.Vector3( 0,   0, -22),
                new THREE.Vector3(-6,   0, -18),
                new THREE.Vector3( 6,   0, -18),
                new THREE.Vector3(-10,  0, -14),
                new THREE.Vector3( 10,  0, -14),
                new THREE.Vector3(-4,   0, -10),
                new THREE.Vector3( 4,   0, -10),
                new THREE.Vector3(-8,   0, -16),
                new THREE.Vector3( 8,   0, -16),
                new THREE.Vector3( 0,   0, -12),
            ];
            positions.forEach(pos => {
                const rival = new Soldier(this.scene, false, pos);
                if (window.hackSystem) window.hackSystem.boostEnemyHealth(rival);
                this.enemies.push(rival);
            });

            // 상단 HUD: 쳌리지 모드 표시
            const fill = document.getElementById('duel-enemy-fill');
            const hpTxt = document.getElementById('duel-enemy-hp');
            if (fill) fill.style.width = '100%';
            if (hpTxt) hpTxt.innerText = `x10 RIVALS`;
        } else {
            // 일반 1v1
            const rival = new Soldier(this.scene, false, new THREE.Vector3(0, 0, -22));
            if (window.hackSystem) window.hackSystem.boostEnemyHealth(rival);
            this.enemies.push(rival);

            // 상단 HUD 적 체력바 100% 초기화
            const fill = document.getElementById('duel-enemy-fill');
            const hpTxt = document.getElementById('duel-enemy-hp');
            if (fill) fill.style.width = '100%';
            if (hpTxt) hpTxt.innerText = Math.ceil(rival.health);
        }

        this.updateSquadCounts();
    }

    updateSquadCounts() {
        if (this.roundEnding) return;

        const isPlayerAlive = !this.player.isDead;
        const aliveEnemies  = this.enemies.filter(e => !e.isDead).length;
        const totalEnemies  = this.enemies.length;

        const elBadge = document.getElementById('enemy-counter');
        if (aliveEnemies > 0) {
            if (this.challengeMode) {
                elBadge.innerText = `⚠️ 1vs10 쳌린지  R${this.currentRound}  ${this.playerWins}-${this.enemyWins}  잔여:${aliveEnemies}/${totalEnemies}`;
            } else {
                elBadge.innerText = `R${this.currentRound}  ${this.playerWins}-${this.enemyWins}  (5판선승)`;
            }
        } else {
            elBadge.innerText = '🏆 RIVAL ELIMINATED';
        }

        // 철리지 모드: 생존한 적 충 철리지 HP 표시
        const firstAlive = this.enemies.find(e => !e.isDead);
        const fill = document.getElementById('duel-enemy-fill');
        const hpTxt = document.getElementById('duel-enemy-hp');
        if (firstAlive) {
            const pct = (firstAlive.health / firstAlive.maxHealth) * 100;
            if (fill) fill.style.width = `${pct}%`;
            if (hpTxt) {
                if (this.challengeMode) {
                    hpTxt.innerText = `${aliveEnemies}명 생존`;
                } else {
                    hpTxt.innerText = Math.ceil(firstAlive.health);
                }
            }
        } else {
            if (fill) fill.style.width = '0%';
            if (hpTxt) hpTxt.innerText = '0';
        }

        if (aliveEnemies === 0 && this.isPlaying) {
            this._endRound(true);
        }
        if (!isPlayerAlive && this.isPlaying) {
            this._endRound(false);
        }
    }

    _endRound(playerWon) {
        if (this.roundEnding) return;
        this.roundEnding = true;
        this.isPlaying   = false;

        if (playerWon) {
            this.playerWins++;
            this._showRoundResult('🏆 라운드 승리!', '#00f0ff');
            // 상대 패배 채팅 반응
            window.chatSystem?.triggerRivalReaction('round_lost');
        } else {
            this.enemyWins++;
            this._showRoundResult('💀 라운드 패배!', '#ef4444');
            // 상대 승리 채팅 반응
            window.chatSystem?.triggerRivalReaction('round_won');
        }

        this._updateRoundHUD();

        if (this.playerWins >= this.WIN_TARGET || this.enemyWins >= this.WIN_TARGET) {
            setTimeout(() => this.handleGameOver(this.playerWins >= this.WIN_TARGET), 2000);
            return;
        }

        // 🎬 라운드 종료 시 상대 시점 풀 리플레이 (Rival POV Full Round Replay) 실행!
        setTimeout(() => {
            this._startRivalPOV();
        }, 1100);
    }

    _startRivalPOV() {
        this.isWatchingRivalPOV = true;
        this.replayTime = 0;
        this.rivalPOVSpeed = 1.0;

        // 녹화된 프레임이 없을 경우 대비 (최소 2프레임 안전 생성)
        const targetEnemy = this.enemies?.find(e => e.isDead) || this.enemies?.[0];
        const defaultEnemyPos = (targetEnemy && targetEnemy.mesh) ? targetEnemy.mesh.position.clone() : new THREE.Vector3(0, 0, -22);
        const defaultPlayerPos = this.player ? this.player.position.clone() : new THREE.Vector3(0, 0, 22);

        if (!this.roundFrames || this.roundFrames.length < 2) {
            this.roundFrames = [
                { t: 0, rivalPos: defaultEnemyPos.clone(), playerPos: defaultPlayerPos.clone() },
                { t: 3.0, rivalPos: defaultEnemyPos.clone(), playerPos: defaultPlayerPos.clone() }
            ];
        }

        const startT = this.roundFrames[0].t;
        const endT = this.roundFrames[this.roundFrames.length - 1].t;
        this.replayTotalDuration = Math.max(1.5, endT - startT);

        // 1인칭 플레이어 무기 숨기기
        if (this.player?.weaponCtrl?.currentWeapon?.root) {
            this.player.weaponCtrl.currentWeapon.root.visible = false;
        }

        // 카메라를 첫 프레임의 상대 눈높이로 배치
        const f0 = this.roundFrames[0];
        this.camera.position.set(f0.rivalPos.x, f0.rivalPos.y + 1.6, f0.rivalPos.z);
        this.camera.lookAt(f0.playerPos.x, f0.playerPos.y + 1.4, f0.playerPos.z);

        this._showRivalPOVUI();

        // 🎬 리플레이 시청 시 라이벌의 어이없어하는 채팅 반응 출력!
        window.chatSystem?.triggerRivalReaction('replay_start', true);
    }

    _showRivalPOVUI() {
        let overlay = document.getElementById('rival-pov-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rival-pov-overlay';
            overlay.style.cssText = `
                position:fixed; top:0; left:0; width:100%; height:100%;
                pointer-events:auto; z-index:99997;
                display:flex; flex-direction:column; justify-content:space-between;
                align-items:center; padding:24px 20px; box-sizing:border-box;
                font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;
                background:radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(20,5,5,0.7) 100%);
                border:3px solid rgba(255,50,50,0.3);
                box-shadow:inset 0 0 80px rgba(255,0,0,0.2);
            `;
            overlay.innerHTML = `
                <!-- 상단 타이틀 & 리플레이 타임라인 -->
                <div style="text-align:center; width:100%; max-width:620px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                    <div style="
                        display:inline-flex; align-items:center; gap:8px;
                        background:linear-gradient(90deg, rgba(255,30,60,0.95), rgba(255,80,0,0.95));
                        color:#fff; font-size:14px; font-weight:800; letter-spacing:2px;
                        padding:7px 24px; border-radius:30px; box-shadow:0 0 28px rgba(255,50,50,0.8);
                    ">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#fff; animation:povBlink 1s infinite alternate;"></span>
                        🎬 [RIVAL POV] 상대 시점 라운드 풀 리플레이
                    </div>
                    <div style="color:#ffb3ba; font-size:12px; letter-spacing:0.5px;">
                        상대의 시점에서 라운드 시작부터 끝까지 전 과정을 재생 중입니다
                    </div>

                    <!-- ⏱️ 타임라인 진행 바 -->
                    <div style="width:100%; margin-top:6px; display:flex; align-items:center; gap:10px;">
                        <span id="pov-time-cur" style="color:#00f0ff; font-family:monospace; font-size:12px; font-weight:bold; min-width:40px; text-align:right;">00:00</span>
                        <div style="flex:1; height:8px; background:rgba(255,255,255,0.15); border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.2);">
                            <div id="pov-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #00f0ff, #ff3366); transition:width 0.08s linear;"></div>
                        </div>
                        <span id="pov-time-total" style="color:#aaa; font-family:monospace; font-size:12px; min-width:40px;">00:00</span>
                    </div>
                </div>

                <!-- 하단 배속 컨트롤 및 스킵 버튼 -->
                <div style="
                    display:flex; gap:18px; align-items:center; background:rgba(10,12,20,0.88);
                    backdrop-filter:blur(10px);
                    padding:12px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.18);
                    box-shadow:0 10px 30px rgba(0,0,0,0.7);
                ">
                    <div style="color:#bbb; font-size:12px; font-weight:700;">배속:</div>
                    <div id="pov-speed-btns" style="display:flex; gap:6px;">
                        <button class="pov-speed-btn" data-speed="0.5" style="background:#1a1e2b; color:#ccc; border:1px solid #334; border-radius:6px; padding:5px 12px; font-size:12px; font-weight:bold; cursor:pointer;">0.5x</button>
                        <button class="pov-speed-btn active" data-speed="1.0" style="background:#00f0ff; color:#000; font-weight:800; border:1px solid #00f0ff; border-radius:6px; padding:5px 12px; font-size:12px; cursor:pointer; box-shadow:0 0 12px rgba(0,240,255,0.5);">1.0x</button>
                        <button class="pov-speed-btn" data-speed="2.0" style="background:#1a1e2b; color:#ccc; border:1px solid #334; border-radius:6px; padding:5px 12px; font-size:12px; font-weight:bold; cursor:pointer;">2.0x</button>
                        <button class="pov-speed-btn" data-speed="4.0" style="background:#1a1e2b; color:#ccc; border:1px solid #334; border-radius:6px; padding:5px 12px; font-size:12px; font-weight:bold; cursor:pointer;">4.0x</button>
                    </div>
                    <div style="width:1px; height:22px; background:rgba(255,255,255,0.2);"></div>
                    <button id="btn-skip-pov" style="
                        background:linear-gradient(90deg, #ff5500, #ff8800);
                        color:#fff; font-weight:800; border:none; border-radius:8px;
                        padding:8px 20px; font-size:13px; cursor:pointer; letter-spacing:1px;
                        box-shadow:0 0 18px rgba(255,85,0,0.7);
                        transition:transform 0.1s;
                    ">⏩ 스킵 (Space / 클릭)</button>
                </div>
            `;
            document.body.appendChild(overlay);

            // 배속 버튼 이벤트 바인딩
            overlay.querySelectorAll('.pov-speed-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const spd = parseFloat(btn.getAttribute('data-speed'));
                    this.rivalPOVSpeed = spd;
                    overlay.querySelectorAll('.pov-speed-btn').forEach(b => {
                        b.style.background = '#1a1e2b';
                        b.style.color = '#ccc';
                        b.style.borderColor = '#334';
                        b.style.boxShadow = 'none';
                        b.style.fontWeight = 'bold';
                    });
                    btn.style.background = '#00f0ff';
                    btn.style.color = '#000';
                    btn.style.borderColor = '#00f0ff';
                    btn.style.boxShadow = '0 0 12px rgba(0,240,255,0.5)';
                    btn.style.fontWeight = '800';
                });
            });

            // 스킵 버튼 이벤트 바인딩
            const skipBtn = overlay.querySelector('#btn-skip-pov');
            if (skipBtn) {
                skipBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._skipRivalPOV();
                });
            }
        }

        // 전체 시간 라벨 초기화
        const totalSpan = document.getElementById('pov-time-total');
        if (totalSpan) {
            const totSec = Math.floor(this.replayTotalDuration);
            totalSpan.textContent = `${String(Math.floor(totSec/60)).padStart(2,'0')}:${String(totSec%60).padStart(2,'0')}`;
        }
        overlay.style.display = 'flex';
    }

    _updateRivalPOVTimeline(curSec, totSec) {
        const curSpan = document.getElementById('pov-time-cur');
        const bar = document.getElementById('pov-progress-bar');
        if (curSpan) {
            const sec = Math.min(Math.floor(curSec), Math.floor(totSec));
            curSpan.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
        }
        if (bar && totSec > 0) {
            const pct = Math.min(100, (curSec / totSec) * 100);
            bar.style.width = `${pct}%`;
        }
    }

    _skipRivalPOV() {
        if (!this.isWatchingRivalPOV) return;
        this.isWatchingRivalPOV = false;

        const overlay = document.getElementById('rival-pov-overlay');
        if (overlay) overlay.style.display = 'none';

        // 1인칭 무기 복원
        if (this.player?.weaponCtrl?.currentWeapon?.root) {
            this.player.weaponCtrl.currentWeapon.root.visible = true;
        }

        this.currentRound++;
        this._startNextRound();
    }

    _startNextRound() {
        // 상대 시점 UI 닫기 및 무기 가시성 복원
        const overlay = document.getElementById('rival-pov-overlay');
        if (overlay) overlay.style.display = 'none';
        if (this.player?.weaponCtrl?.currentWeapon?.root) {
            this.player.weaponCtrl.currentWeapon.root.visible = true;
        }

        // 🎬 녹화 버퍼 및 라운드 타이머 초기화 (새 라운드 녹화 준비)
        this.roundFrames = [];
        this.roundTime   = 0;
        this.recordTimer = 0;
        this.isWatchingRivalPOV = false;

        // 플레이어 리셋 (핵 ON이면 50,000 HP, 아니면 200 HP)
        const anyHackOn = window.hackSystem && (
            window.hackSystem.flyHackEnabled || window.hackSystem.aimBotEnabled ||
            window.hackSystem.godFlightEnabled || window.hackSystem.rapidFireEnabled ||
            window.hackSystem.meteorStrikeEnabled || window.hackSystem.blackHoleEnabled ||
            window.hackSystem.instantKillEnabled || window.hackSystem.timeStopEnabled || window.hackSystem.spinBotEnabled
        );
        const roundHP = anyHackOn ? 50000 : 200;
        this.player.maxHealth  = roundHP;
        this.player.health     = roundHP;
        this.player.isDead     = false;
        this.player.position.set(0, 0, 22);
        this.player.velocity.set(0, 0, 0);
        this.player.isGrounded = true;
        this.player.yaw        = 0;
        this.player.pitch      = 0;

        // 무기 탄약 리필
        const curGun = this.player.weaponData[this.player.currentGunKey];
        if (curGun) {
            this.player.ammoInMag = curGun.maxAmmo;
            this.player.reserveAmmo = curGun.reserveAmmo;
        }
        this.player.updateHUD();

        // 비네트 및 슬로우모 리셋
        const vig = document.getElementById('damage-vignette');
        if (vig) vig.style.opacity = '0';
        this.slowMoActive = false;
        this.slowMoTimer  = 0;
        const slowmo = document.getElementById('slowmo-overlay');
        if (slowmo) slowmo.classList.remove('active');
        const slowmoMsg = document.getElementById('slowmo-msg');
        if (slowmoMsg) slowmoMsg.classList.remove('active');

        // 적 리스폰 (새 적 소환 & 기존 메시 제거)
        this.spawnSquads();

        // 갓 모드 카운터 초기화
        if (this.player.godFlightHitsLeft !== undefined) {
            this.player.godFlightHitsLeft = this.player.GOD_MODE_MAX_HITS;
            this.player._updateGodHUD?.();
        }

        // 핵 감지 및 지속 스킬 초기화
        if (window.hackSystem) {
            window.hackSystem.enemyHackDetectTimer = 0;
            window.hackSystem.enemyHackActivated   = false;
            window.hackSystem.enemyAimbotOn        = false;
            window.hackSystem.enemyFlyOn           = false;
            window.hackSystem.meteorStrikeEnabled  = false;
            window.hackSystem.blackHoleEnabled     = false;
            window.hackSystem.timeStopEnabled      = false;
            window.hackSystem.updateMeteorStrike(0);
            window.hackSystem.updateBlackHole(0);
            window.hackSystem._updateHUD();
            const bar = document.getElementById('hack-detect-fill');
            if (bar) { bar.style.width = '0%'; bar.style.background = 'linear-gradient(90deg,#00f0ff,#ff9900)'; }
            const lbl = document.getElementById('hack-detect-label');
            if (lbl) lbl.textContent = '감시 0%';
        }

        this.roundEnding = false;
        this.isPlaying   = true;
        this.startTime   = Date.now();
        window.gameKills = 0;

        this._showRoundResult(`ROUND ${this.currentRound} START!`, '#ffffff');
        this._updateRoundHUD();
    }

    _updateRoundHUD() {
        const sc = document.getElementById('round-score');
        if (sc) sc.textContent = `P ${this.playerWins} : ${this.enemyWins} R  (5선승)`;
        const elBadge = document.getElementById('enemy-counter');
        if (elBadge) elBadge.innerText = `R${this.currentRound}  ${this.playerWins}-${this.enemyWins}  (5판선승)`;
    }

    _showRoundResult(msg, color) {
        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed', 'top:38%', 'left:50%',
            'transform:translate(-50%,-50%)',
            'background:rgba(0,0,0,0.9)',
            `color:${color}`,
            "font-family:'Courier New',monospace",
            'font-size:26px', 'font-weight:bold',
            'letter-spacing:4px', 'padding:18px 40px',
            'border-radius:10px',
            `border:1px solid ${color}55`,
            `box-shadow:0 0 40px ${color}44`,
            'z-index:99998', 'pointer-events:none',
            'opacity:1', 'transition:opacity 0.5s'
        ].join(';');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 1900);
    }

    // ── LAST KILL SLOW-MOTION ──────────────────────────────────────────
    triggerLastKillSlowMo(lastEnemyPos) {
        if (this.slowMoActive) return;
        this.slowMoActive = true;
        this.slowMoTimer  = this.slowMoDuration;

        // Visual cinematic effects
        const overlay = document.getElementById('slowmo-overlay');
        if (overlay) {
            overlay.classList.add('active');
            setTimeout(() => overlay.classList.remove('active'), this.slowMoDuration * 1000 + 500);
        }

        const msg = document.getElementById('slowmo-msg');
        if (msg) {
            msg.innerText = '⚡ 최후의 적 처치! ⚡';
            msg.classList.add('active');
            setTimeout(() => msg.classList.remove('active'), this.slowMoDuration * 1000);
        }

        // Spawn big explosion particles at last enemy
        this.spawnExplosionParticles(lastEnemyPos, 80);

        // Screen flash
        const flash = document.getElementById('damage-vignette');
        if (flash) {
            flash.style.boxShadow = 'inset 0 0 200px rgba(255,200,0,0.6)';
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => { flash.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0.8)'; }, 1000);
            }, 600);
        }

        // Camera FOV kick for cinematic feel
        const origFov = this.camera.fov;
        this.camera.fov = origFov + 8;
        this.camera.updateProjectionMatrix();
        setTimeout(() => {
            this.camera.fov = origFov;
            this.camera.updateProjectionMatrix();
        }, 200);
    }

    // ── FX SYSTEMS ────────────────────────────────────────────────────
    triggerMuzzleFlash() {
        this.muzzleLight.intensity = 5.0;
        setTimeout(() => { this.muzzleLight.intensity = 0; }, 35);
        if (window.onPlayerShot) window.onPlayerShot();
    }

    spawnBulletTracer(from, to, isEnemy) {
        const mat = new THREE.LineBasicMaterial({
            color: isEnemy ? 0xff4422 : 0xffff88,
            linewidth: 2,
            transparent: true, opacity: 0.85
        });
        const pts = [from.clone(), to.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        this.tracerBullets.push({ line, geo, mat, age: 0, maxAge: 0.06 });
    }

    spawnCurvedBulletTracer(from, to, forwardDir) {
        const dist = from.distanceTo(to);
        const fwd = forwardDir ? forwardDir.clone().normalize() : new THREE.Vector3(0, 0, -1);
        
        // 제어점: 초기 총구/시선 방향으로 진행하다 적 머리 쪽으로 부드럽게 꺾임
        const ctrl = from.clone().addScaledVector(fwd, Math.max(3.0, dist * 0.45));
        ctrl.y += Math.min(2.5, dist * 0.12);

        const curve = new THREE.QuadraticBezierCurve3(from.clone(), ctrl, to.clone());
        const points = curve.getPoints(24);

        const mat = new THREE.LineBasicMaterial({
            color: 0x00f0ff, // 빛나는 사이언/네온 블루
            linewidth: 3,
            transparent: true, opacity: 0.95
        });
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        this.tracerBullets.push({ line, geo, mat, age: 0, maxAge: 0.16 });

        // 휘어지는 궤적 중간중간 스파크 파티클 생성
        for (let i = 4; i < points.length; i += 6) {
            this.spawnHitParticles(points[i], 0x00f0ff);
        }
    }

    spawnExplosionParticles(pos, count = 30) {
        const colors = [0xff6600, 0xffcc00, 0xff2200, 0xffffff, 0xff8800];
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.06 + Math.random()*0.1, 5, 5);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random()*colors.length)],
                transparent: true, opacity: 1.0
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos).add(new THREE.Vector3(
                (Math.random()-0.5)*0.5,
                Math.random()*0.8,
                (Math.random()-0.5)*0.5
            ));
            const vel = new THREE.Vector3(
                (Math.random()-0.5)*8,
                Math.random()*10 + 2,
                (Math.random()-0.5)*8
            );
            this.scene.add(p);
            this.particles.push({ mesh: p, mat, vel, age: 0, maxAge: 1.5 + Math.random()*1.0 });
        }
    }

    spawnHitParticles(pos, color = 0xff2200) {
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.SphereGeometry(0.035, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1.0 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            const vel = new THREE.Vector3((Math.random()-0.5)*5, Math.random()*3+1, (Math.random()-0.5)*5);
            this.scene.add(p);
            this.particles.push({ mesh: p, mat, vel, age: 0, maxAge: 0.5 });
        }
    }

    updateParticles(dt) {
        const gravity = 9.8;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;
            const t = p.age / p.maxAge;
            p.vel.y -= gravity * dt;
            p.mesh.position.addScaledVector(p.vel, dt);
            p.mat.opacity = Math.max(0, 1.0 - t);
            if (p.age >= p.maxAge) {
                this.scene.remove(p.mesh);
                p.geo?.dispose(); p.mat.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    updateTracers(dt) {
        for (let i = this.tracerBullets.length - 1; i >= 0; i--) {
            const t = this.tracerBullets[i];
            t.age += dt;
            if (t.age >= t.maxAge) {
                this.scene.remove(t.line);
                t.geo.dispose(); t.mat.dispose();
                this.tracerBullets.splice(i, 1);
            }
        }
    }

    handleGameOver(isVictory) {
        this.isPlaying = false;
        try { document.exitPointerLock(); } catch(e) {}

        const overlay = document.getElementById('game-over-overlay');
        const title   = document.getElementById('end-title');
        const sub     = document.getElementById('end-subtitle');
        const hud     = document.getElementById('hud');
        if (hud) hud.classList.add('hidden');

        if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('active'); }
        if (title) {
            title.innerText   = isVictory ? '🏆 5판 선승 우승!' : '💀 5판 선승 패배!';
            title.style.color = isVictory ? '#00f0ff' : '#ef4444';
        }
        if (sub) {
            sub.innerText = isVictory
                ? `완벽한 승리! ${this.playerWins}승 ${this.enemyWins}패로 라이벌을 제압했습니다!`
                : `${this.enemyWins}승 ${this.playerWins}패... 라이벌에게 패배했습니다. 다시 도전!`;
        }

        // Stats
        const kills = document.getElementById('stat-kills');
        const acc   = document.getElementById('stat-accuracy');
        const time  = document.getElementById('stat-time');
        if (kills) kills.innerText = window.gameKills || 0;
        if (acc) {
            const pct = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
            acc.innerText = `${pct}%`;
        }
        const elapsed = Math.max(0, Math.floor((Date.now() - this.startTime) / 1000));
        if (time) time.innerText = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const rawDt = Math.min(this.clock.getDelta(), 0.1);

        // Apply slow-motion timescale
        let dt = rawDt;
        if (this.slowMoActive) {
            dt = rawDt * 0.15; // 15% speed = dramatic slow-mo
            this.slowMoTimer -= rawDt;
            if (this.slowMoTimer <= 0) {
                this.slowMoActive = false;
            }
        }

        if (this.isPlaying) {
            // 🎬 라운드 프레임 실시간 녹화 (0.05초 간격으로 상대 위치 및 플레이어 위치 캡처)
            this.roundTime   += dt;
            this.recordTimer += dt;
            if (this.recordTimer >= 0.05) {
                this.recordTimer = 0;
                const targetEnemy = this.enemies?.[0];
                if (targetEnemy && targetEnemy.mesh && this.player) {
                    this.roundFrames.push({
                        t: this.roundTime,
                        rivalPos: targetEnemy.mesh.position.clone(),
                        rivalRotY: targetEnemy.mesh.rotation.y,
                        playerPos: this.player.position.clone()
                    });
                }
            }

            // Update Player
            this.player.update(dt, this.enemies, () => this.triggerMuzzleFlash());

            // Update Allies
            this.allies.forEach(ally => {
                ally.update(dt, this.enemies, this.allies, this.player.position, (from, to, isEnemy) => {
                    this.spawnBulletTracer(from, to, isEnemy);
                    if (!isEnemy) window.onPlayerHit?.(); // count ally hits too
                });
            });

            // Update Enemies — check for last kill slow-mo
            let liveEnemiesBeforeUpdate = this.enemies.filter(e => !e.isDead).length;
            this.enemies.forEach(enemy => {
                const wasDead = enemy.isDead;
                enemy.update(dt, this.enemies, this.allies, this.player.position, (from, to, isEnemy) => {
                    this.spawnBulletTracer(from, to, isEnemy);
                });
                if (!wasDead && enemy.isDead) {
                    // Spawn blood particles on kill
                    this.spawnHitParticles(enemy.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)));
                }
            });

            // Check last-kill trigger
            const liveNow = this.enemies.filter(e => !e.isDead).length;
            if (liveEnemiesBeforeUpdate === 1 && liveNow === 0 && !this.slowMoActive) {
                // Find the last killed enemy
                const lastKilled = this.enemies.find(e => e.isDead);
                if (lastKilled) this.triggerLastKillSlowMo(lastKilled.mesh.position.clone());
                setTimeout(() => this.updateSquadCounts(), this.slowMoDuration * 1000 + 200);
            } else {
                this.updateSquadCounts();
            }

            this.updateParticles(dt);
            this.updateTracers(dt);
        } else if (this.isWatchingRivalPOV) {
            // 🎬 상대 시점 풀 라운드 리플레이 (Rival POV Full Round Replay) 보간 재생 및 배속
            const simDt = rawDt * this.rivalPOVSpeed;
            this.replayTime += simDt;

            // 라운드 프레임 시간 기반 부드러운 위치/시선 보간(Interpolation)
            if (this.roundFrames && this.roundFrames.length > 1) {
                const startT = this.roundFrames[0].t;
                const currentTargetT = startT + this.replayTime;

                // 타겟 시간 이전/이후 프레임 탐색
                let idx = 0;
                while (idx < this.roundFrames.length - 1 && this.roundFrames[idx + 1].t < currentTargetT) {
                    idx++;
                }

                const f1 = this.roundFrames[idx];
                const f2 = this.roundFrames[Math.min(idx + 1, this.roundFrames.length - 1)];

                let alpha = 0;
                const dtFrame = f2.t - f1.t;
                if (dtFrame > 0.0001) {
                    alpha = Math.max(0, Math.min(1, (currentTargetT - f1.t) / dtFrame));
                }

                // 상대 카메라 위치 보간 (상대 머리/눈높이 + 1.6)
                const camX = THREE.MathUtils.lerp(f1.rivalPos.x, f2.rivalPos.x, alpha);
                const camY = THREE.MathUtils.lerp(f1.rivalPos.y, f2.rivalPos.y, alpha) + 1.6;
                const camZ = THREE.MathUtils.lerp(f1.rivalPos.z, f2.rivalPos.z, alpha);
                this.camera.position.set(camX, camY, camZ);

                // 플레이어를 바라보도록 시선 보간 (플레이어 상체 중심 + 1.4)
                const pX = THREE.MathUtils.lerp(f1.playerPos.x, f2.playerPos.x, alpha);
                const pY = THREE.MathUtils.lerp(f1.playerPos.y, f2.playerPos.y, alpha) + 1.4;
                const pZ = THREE.MathUtils.lerp(f1.playerPos.z, f2.playerPos.z, alpha);
                this.camera.lookAt(pX, pY, pZ);

                // 타임라인 UI 실시간 업데이트
                this._updateRivalPOVTimeline(this.replayTime, this.replayTotalDuration);
            }

            this.updateParticles(simDt);
            this.updateTracers(simDt);

            // 전체 리플레이 시간 완료 시 자동 다음 라운드 진행
            if (this.replayTime >= this.replayTotalDuration + 0.6) {
                this._skipRivalPOV();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Start Game Engine when DOM ready
window.addEventListener('DOMContentLoaded', () => { new Game(); });

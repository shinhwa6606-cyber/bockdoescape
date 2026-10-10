// ═══════════════════════════════════════════════════════════════
//  HACK MODE SYSTEM v2.0
//  G: FlyHack (초고속 비행)
//  T: AimBot (벽관통 자동 머리 조준)
//  V: Teleport Hack (상대 머리 위로 순간이동)
//  + 적 핵 감지 → 적도 핵 반격
// ═══════════════════════════════════════════════════════════════

class HackSystem {
    constructor() {
        // ── Hack States ────────────────────────────────────────
        this.godFlightEnabled  = false;   // B or H (👑 무적 3D 노클립 관통 비행)
        this.godFlightSpeed    = 160.0;   // 극초고속 3D 자유비행
        this.flyHackEnabled    = false;   // G (🛸 플라이핵)
        this.aimBotEnabled     = false;   // T (🎯 사일런트 에임핵 - 어디보든 머리로 유도 탄도)
        this.spinBotEnabled    = false;   // Y (🌪️ 화면 360도 미친 회전 + 총기 난동 회전)
        this.teleportEnabled   = false;   // V (⚡ 텔레포트)
        this.rapidFireEnabled  = false;   // J (⚡ 초광속 난사 & 무한 탄창)
        this.meteorStrikeEnabled = false; // K (💥 메테오 궤도 폭격)
        this.blackHoleEnabled  = false;   // L (🌀 블랙홀 중력 분쇄)
        this.instantKillEnabled = false;  // P (💀 원샷원킬 99,999 DMG)
        this.timeStopEnabled   = false;   // O (⏱️ 시간 정지 - ZA WARUDO)

        // ── SpinBot Variables ──────────────────────────────────
        this.spinAngle         = 0;
        this.gunSpinAngle      = 0;

        // ── Fly mode (3D 자유비행 & 조절 가능한 초고속) ─────────
        this.flySpeed          = 180.0;   // 기본 180.0 초고속 자유비행
        this.godFlightSpeed    = 180.0;

        // ── AimBot ─────────────────────────────────────────────
        this.aimbotTarget      = null;

        // ── Teleport cooldown ──────────────────────────────────
        this.tpCooldown        = 0;
        this.TP_COOLDOWN_MAX   = 1.5;

        // ── Enemy Counter-Hack (상대가 바로 알아차리지 않음 - 의심도 시스템) ──
        this.enemyAimbotOn     = false;
        this.enemyFlyOn        = false;
        this.suspicionMeter    = 0;       // 0 ~ 100% (서서히 차오름)
        this.SUSPICION_MAX     = 100;
        this.enemyHackActivated = false;

        // ── Hack mode enemy HP (체력 50,000) ──────────────────
        this.HACK_ENEMY_HP     = 50000;

        this._bindKeys();
        this._setupHUD();
    }

    // ────────────────────────────────────────────────────────────
    //  KEY BINDINGS & MOUSE WHEEL SPEED CONTROL
    // ────────────────────────────────────────────────────────────
    _bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (!window.game?.isPlaying) return;
            if (e.code === 'KeyB' || e.code === 'KeyH') this.toggleGodFlight();
            if (e.code === 'KeyG') this.toggleFlyHack();
            if (e.code === 'KeyT') this.toggleAimBot();
            if (e.code === 'KeyY') this.toggleSpinBot();
            if (e.code === 'KeyV') this.executeTeleport();
            if (e.code === 'KeyJ') this.toggleRapidFire();
            if (e.code === 'KeyK') this.toggleMeteorStrike();
            if (e.code === 'KeyL') this.toggleBlackHole();
            if (e.code === 'KeyP') this.toggleInstantKill();
            if (e.code === 'KeyO') this.toggleTimeStop();

            // [ / ] 키로 비행 속도 미세 조절
            if (e.code === 'BracketRight') this.changeFlySpeed(25);
            if (e.code === 'BracketLeft') this.changeFlySpeed(-25);
        });

        // 마우스 휠로 비행 속도 실시간 조절
        window.addEventListener('wheel', (e) => {
            if (!window.game?.isPlaying) return;
            if (this.flyHackEnabled || this.godFlightEnabled) {
                const delta = e.deltaY < 0 ? 25 : -25;
                this.changeFlySpeed(delta);
            }
        }, { passive: true });
    }

    changeFlySpeed(delta) {
        this.flySpeed = Math.max(30, Math.min(600, this.flySpeed + delta));
        this.godFlightSpeed = this.flySpeed;
        this._showSpeedBadge(`🛸 비행 속도: ${Math.round(this.flySpeed)} (휠/[,]로 조절)`);
    }

    _showSpeedBadge(text) {
        let badge = document.getElementById('fly-speed-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'fly-speed-badge';
            badge.style.cssText = `
                position:fixed; bottom:90px; right:20px;
                background:rgba(0,240,255,0.25);
                border:1px solid #00f0ff;
                box-shadow:0 0 16px rgba(0,240,255,0.4);
                color:#00f0ff; font-family:'Courier New',monospace;
                font-size:13px; font-weight:bold; letter-spacing:1px;
                padding:8px 14px; border-radius:6px;
                z-index:99999; pointer-events:none;
                transition:opacity 0.4s;
            `;
            document.body.appendChild(badge);
        }
        badge.textContent = text;
        badge.style.opacity = '1';
        clearTimeout(this._speedBadgeTimeout);
        this._speedBadgeTimeout = setTimeout(() => {
            if (badge) badge.style.opacity = '0';
        }, 1800);
    }

    // ────────────────────────────────────────────────────────────
    //  👑 GOD NOCLIP EVASION HACK (B / H 키)
    //  상대가 핵을 켜도 못 맞춤 (무적 회피) + 3D 마우스 시점 자유비행
    //  🌟 끄면 플레이어 체력도 50,000으로 세팅!
    // ────────────────────────────────────────────────────────────
    toggleGodFlight() {
        this.godFlightEnabled = !this.godFlightEnabled;
        const player = window.gamePlayer;
        if (player) {
            if (this.godFlightEnabled) {
                player.velocity.set(0, 0, 0);
                player.isGrounded = false;
                this._showNotification('👑 GOD NOCLIP ON — 무적 회피 + 3D 관통 비행 (HP: 50,000)', '#ffe600');
                window.chatSystem?.triggerRivalReaction('god');
            } else {
                this._showNotification('👑 GOD NOCLIP OFF', '#00ff88');
            }
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    applyGodFlight(player, dt) {
        if (!this.godFlightEnabled) return;

        player.velocity.set(0, 0, 0);
        player.isGrounded = false;

        const speed = this.godFlightSpeed;

        // 마우스로 바라보는 정밀 3D 카메라 방향 (Pitch + Yaw)
        const camDir = new THREE.Vector3();
        player.camera.getWorldDirection(camDir);

        // 카메라 수평 우측 벡터 (좌우 스트레이프용)
        const rightDir = new THREE.Vector3(-camDir.z, 0, camDir.x).normalize();

        let moveVec = new THREE.Vector3();

        // W 누른 채로 마우스 위를 보면 위로, 아래를 보면 아래로 날아감 (바닥도 관통)
        if (player.keys['KeyW']) moveVec.add(camDir);
        if (player.keys['KeyS']) moveVec.sub(camDir);
        if (player.keys['KeyA']) moveVec.sub(rightDir);
        if (player.keys['KeyD']) moveVec.add(rightDir);

        // Space: 고속 수직 급상승 / Z or Ctrl: 고속 수직 급하강
        if (player.keys['Space']) moveVec.y += 1.0;
        if (player.keys['KeyZ'] || player.keys['ControlLeft'] || player.keys['ControlRight']) moveVec.y -= 1.0;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize();
            player.position.addScaledVector(moveVec, speed * dt);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  🛸 3D FLY HACK (G 키)
    //  갓모드에서 무적만 뺀 것처럼 마우스 시점 3D 완전 자유 비행!
    //  마우스 휠 또는 [ / ] 키로 속도 자유 조절
    // ────────────────────────────────────────────────────────────
    toggleFlyHack() {
        this.flyHackEnabled = !this.flyHackEnabled;
        const player = window.gamePlayer;
        if (player) {
            if (this.flyHackEnabled) {
                player.velocity.set(0, 0, 0);
                player.isGrounded = false;
                this._showNotification(`🛸 3D FLY ON — 자유비행 (속도: ${Math.round(this.flySpeed)} / HP: 50,000)`, '#00f0ff');
                this._showSpeedBadge(`🛸 비행 속도: ${Math.round(this.flySpeed)} (휠/[,]로 조절)`);
                window.chatSystem?.triggerRivalReaction('fly');
            } else {
                this._showNotification('🛸 3D FLY OFF', '#555');
            }
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    applyFlyHack(player, dt) {
        if (!this.flyHackEnabled) return;

        player.velocity.set(0, 0, 0);
        player.isGrounded = false;

        const speed = this.flySpeed;

        // 🌟 갓모드와 동일한 마우스 시점 3D 정밀 자유 비행 (무적만 제외)
        const camDir = new THREE.Vector3();
        player.camera.getWorldDirection(camDir);

        const rightDir = new THREE.Vector3(-camDir.z, 0, camDir.x).normalize();

        let moveVec = new THREE.Vector3();

        // 마우스로 바라보는 방향으로 직진/후진
        if (player.keys['KeyW']) moveVec.add(camDir);
        if (player.keys['KeyS']) moveVec.sub(camDir);
        if (player.keys['KeyA']) moveVec.sub(rightDir);
        if (player.keys['KeyD']) moveVec.add(rightDir);

        // Space: 고속 수직 상승 / Z or Ctrl: 고속 수직 하강
        if (player.keys['Space']) moveVec.y += 1.0;
        if (player.keys['KeyZ'] || player.keys['ControlLeft'] || player.keys['ControlRight']) moveVec.y -= 1.0;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize();
            player.position.addScaledVector(moveVec, speed * dt);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  TELEPORT HACK (V 키)
    // ────────────────────────────────────────────────────────────
    executeTeleport() {
        if (this.tpCooldown > 0) {
            this._showNotification(`⏳ 텔레포트 쿨다운 ${this.tpCooldown.toFixed(1)}s`, '#ff8800');
            return;
        }
        const player  = window.gamePlayer;
        const enemies = window.game?.enemies;
        if (!player || !enemies) return;

        let target = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (e.isDead) continue;
            const d = player.position.distanceTo(e.mesh.position);
            if (d < minDist) { minDist = d; target = e; }
        }
        if (!target) { this._showNotification('❌ 텔레포트 대상 없음', '#ff4444'); return; }

        const enemyPos = target.mesh.position.clone();
        const behindDir = new THREE.Vector3(0, 0, 1).applyQuaternion(target.mesh.quaternion);
        player.position.set(
            enemyPos.x + behindDir.x * 1.5,
            enemyPos.y + 3.2,
            enemyPos.z + behindDir.z * 1.5
        );
        player.velocity.set(0, 0, 0);
        player.isGrounded = false;
        this.flyY = player.position.y;
        this.tpCooldown = this.TP_COOLDOWN_MAX;

        const vignette = document.getElementById('dash-vignette');
        if (vignette) { vignette.classList.add('active'); setTimeout(() => vignette.classList.remove('active'), 250); }
        this._showNotification('⚡ TELEPORT!', '#aa00ff');
    }

    // ────────────────────────────────────────────────────────────
    //  🌪️ SPINBOT / 화면 & 총기 360도 미친 회전핵 (Y 키)
    // ────────────────────────────────────────────────────────────
    toggleSpinBot() {
        this.spinBotEnabled = !this.spinBotEnabled;
        if (this.spinBotEnabled) {
            this._showNotification('🌪️ SPINBOT ON — 360도 미친 회전 + 총기 난동! (HP: 50,000)', '#ff00aa');
        } else {
            this._showNotification('🌪️ SPINBOT OFF', '#555');
            const player = window.gamePlayer;
            if (player) {
                player.camera.rotation.z = 0; // roll 흔들림 초기화
            }
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    applySpinBot(player, dt) {
        if (!this.spinBotEnabled || !player) return;

        // 1. 화면 360도 미친듯이 초고속 회전 (초당 약 6~7바퀴 팽이 회전)
        player.yaw += dt * 38.0;
        while (player.yaw > Math.PI * 2) player.yaw -= Math.PI * 2;
        while (player.yaw < -Math.PI * 2) player.yaw += Math.PI * 2;

        // 2. 화면 위아래 및 좌우 미친 진동 / 지터 (Crazy Screen Shake)
        const shakeAmt = 0.16;
        const jitterPitch = (Math.random() - 0.5) * shakeAmt;
        const jitterYaw   = (Math.random() - 0.5) * shakeAmt;
        const jitterRoll  = (Math.random() - 0.5) * 0.28; // 화면 틸트 롤 진동

        // pitch도 위아래로 격렬하게 웨이브 + 지터 흔들림
        player.pitch = Math.sin(Date.now() * 0.02) * 0.5 + jitterPitch;

        // 카메라 회전에 직접 미친 듯이 적용
        player.camera.rotation.y = player.yaw + jitterYaw;
        player.camera.rotation.x = player.pitch;
        player.camera.rotation.z = jitterRoll;
    }

    applyGunSpin(gunRoot, dt) {
        if (!this.spinBotEnabled || !gunRoot) return;

        // 총기도 막 360도 마구 돌아가고 격렬하게 떨림!
        this.gunSpinAngle = (this.gunSpinAngle + dt * 26.0) % (Math.PI * 2);

        gunRoot.rotation.x += this.gunSpinAngle * 1.6;
        gunRoot.rotation.y += this.gunSpinAngle * 2.2;
        gunRoot.rotation.z += this.gunSpinAngle * 1.8;

        // 총기 위치도 마구 요동침
        gunRoot.position.x += (Math.random() - 0.5) * 0.05;
        gunRoot.position.y += (Math.random() - 0.5) * 0.05;
        gunRoot.position.z += (Math.random() - 0.5) * 0.05;
    }

    // ────────────────────────────────────────────────────────────
    //  🎯 SILENT AIM (T 키)
    //  시점은 100% 자유롭고, 어디를 보고 쏘든 총알이 적 머리로 휘어감!
    // ────────────────────────────────────────────────────────────
    toggleAimBot() {
        this.aimBotEnabled = !this.aimBotEnabled;
        this.aimbotTarget  = null;
        if (this.aimBotEnabled) {
            this._showNotification('🎯 SILENT AIM ON — 총알 머리 유도 (HP: 50,000)', '#00f0ff');
        } else {
            this._showNotification('🎯 SILENT AIM OFF', '#555');
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    applyAimBot(player, enemies, dt) {
        if (!this.aimBotEnabled) return;
        if (!player || !enemies?.length) return;

        // 🌟 시점을 강제로 적에게 고정하지 않음! (자유 시점 유지)
        // 오직 가장 가까운 살아있는 적만 탐색하여 타겟으로 보관
        let closest = null, minD = Infinity;
        for (const e of enemies) {
            if (e.isDead) continue;
            const d = player.camera.position.distanceTo(e.mesh.position);
            if (d < minD) { minD = d; closest = e; }
        }
        this.aimbotTarget = closest;
    }

    applyAimBotShot(player, enemies) {
        if (!this.aimBotEnabled) return false;

        // 타겟이 없거나 죽었으면 즉시 다시 탐색
        let target = this.aimbotTarget;
        if (!target || target.isDead) {
            let closest = null, minD = Infinity;
            const enemyList = enemies || window.game?.enemies || [];
            for (const e of enemyList) {
                if (e.isDead) continue;
                const d = player.camera.position.distanceTo(e.mesh.position);
                if (d < minD) { minD = d; closest = e; }
            }
            target = closest;
        }

        if (!target || target.isDead) return false;

        // 적 머리 위치 (정확한 헤드 좌표)
        const headPos = target.mesh.position.clone().add(new THREE.Vector3(0, 1.55, 0));
        const camPos  = player.camera.position.clone();
        const camDir  = new THREE.Vector3();
        player.camera.getWorldDirection(camDir);

        // 🌟 어디를 보고 쏘든 총알이 적 머리로 휘어가는 궤적 생성!
        if (window.game?.spawnCurvedBulletTracer) {
            window.game.spawnCurvedBulletTracer(camPos, headPos, camDir);
        }

        // 데미지 계산 및 헤드샷 적용 (벽관통)
        const data = player.weaponData[player.currentGunKey];
        const dmg = this.instantKillEnabled ? 99999 : (data.damage * 2.5);
        target.takeDamage(dmg, true);

        // 히트 피드백
        sounds.playHitMarker?.();
        const hm = document.getElementById('hit-marker');
        if (hm) { hm.classList.add('active'); setTimeout(() => hm.classList.remove('active'), 100); }
        window.game?.spawnHitParticles?.(headPos, 0x00f0ff);
        if (window.onPlayerHit) window.onPlayerHit();

        // 💬 상대 AI 채팅 반응 트리거
        if (window.chatSystem) {
            if (this.spinBotEnabled) {
                window.chatSystem.triggerRivalReaction('spinbot');
            } else {
                window.chatSystem.triggerRivalReaction('silent_aim');
            }
        }

        // 상대 의심도 아주 미미하게 상승 (상대가 바로 눈치채지 못함)
        this.suspicionMeter = Math.min(100, this.suspicionMeter + 1.2);
        this._checkEnemyCounterHack();

        if (target.isDead) {
            window.gameKills = (window.gameKills || 0) + 1;
            player.showKillFeed?.('🎯 [유도 탄도] 머리 명중 헤드샷!', true);
        }
        return true;
    }

    // ────────────────────────────────────────────────────────────
    //  ⚡ RAPID FIRE & INFINITE AMMO (J 키)
    // ────────────────────────────────────────────────────────────
    toggleRapidFire() {
        this.rapidFireEnabled = !this.rapidFireEnabled;
        if (this.rapidFireEnabled) {
            this._showNotification('⚡ RAPID FIRE ON — 초광속 난사 & 무한 탄창', '#00ff88');
            if (window.gamePlayer) {
                window.gamePlayer.ammoInMag = 999;
                window.gamePlayer.reserveAmmo = 999;
                window.gamePlayer.updateHUD();
            }
        } else {
            this._showNotification('⚡ RAPID FIRE OFF', '#555');
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    // ────────────────────────────────────────────────────────────
    //  💥 METEOR STRIKE (K 키)
    // ────────────────────────────────────────────────────────────
    toggleMeteorStrike() {
        this.meteorStrikeEnabled = !this.meteorStrikeEnabled;
        if (this.meteorStrikeEnabled) {
            this._showNotification('💥 METEOR STRIKE ON — 메테오 궤도 폭격 (HP: 50,000)', '#ff5500');
        } else {
            this._showNotification('💥 METEOR STRIKE OFF', '#555');
        }
        this._applyHackHPMode();
        this._updateHUD();
    }

    updateMeteorStrike(dt) {
        if (!this.meteorStrikeEnabled) {
            if (this._meteors?.length) {
                for (let m of this._meteors) {
                    if (m.mesh) window.game?.scene.remove(m.mesh);
                }
                this._meteors = [];
            }
            return;
        }

        if (!this._meteors) this._meteors = [];
        this._meteorTimer = (this._meteorTimer || 0) + dt;

        const target = window.game?.enemies?.find(e => !e.isDead);
        if (!target) return;

        // 0.12초마다 화염 메테오 생성
        if (this._meteorTimer >= 0.12) {
            this._meteorTimer = 0;
            const geo = new THREE.SphereGeometry(0.75, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
            const mesh = new THREE.Mesh(geo, mat);
            const tx = target.mesh.position.x + (Math.random() - 0.5) * 5;
            const tz = target.mesh.position.z + (Math.random() - 0.5) * 5;
            mesh.position.set(tx, 35, tz);
            window.game?.scene.add(mesh);
            this._meteors.push({ mesh, targetPos: new THREE.Vector3(tx, 0, tz), vy: -75 });
        }

        for (let i = this._meteors.length - 1; i >= 0; i--) {
            const m = this._meteors[i];
            m.mesh.position.y += m.vy * dt;

            if (window.game?.spawnHitParticles && Math.random() < 0.6) {
                window.game.spawnHitParticles(m.mesh.position, 0xff6600);
            }

            if (m.mesh.position.y <= 0) {
                window.game?.scene.remove(m.mesh);
                m.mesh.geometry.dispose();
                m.mesh.material.dispose();
                this._meteors.splice(i, 1);

                if (window.game?.spawnExplosionParticles) {
                    window.game.spawnExplosionParticles(m.targetPos, 25);
                }
                sounds.playGunshot?.('spas12');

                const d = target.mesh.position.distanceTo(m.targetPos);
                if (d < 10) {
                    target.takeDamage(2500, true);
                    const hm = document.getElementById('hit-marker');
                    if (hm) { hm.classList.add('active'); setTimeout(() => hm.classList.remove('active'), 80); }
                }
            }
        }
    }

    // ────────────────────────────────────────────────────────────
    //  🌀 BLACK HOLE VORTEX (L 키)
    // ────────────────────────────────────────────────────────────
    toggleBlackHole() {
        this.blackHoleEnabled = !this.blackHoleEnabled;
        if (this.blackHoleEnabled) {
            this._showNotification('🌀 BLACK HOLE ON — 블랙홀 중력 분쇄', '#aa00ff');
        } else {
            this._showNotification('🌀 BLACK HOLE OFF', '#555');
        }
        this._updateHUD();
    }

    updateBlackHole(dt) {
        if (!this.blackHoleEnabled) {
            if (this._blackHoleMesh) {
                window.game?.scene.remove(this._blackHoleMesh);
                this._blackHoleMesh = null;
            }
            return;
        }

        const target = window.game?.enemies?.find(e => !e.isDead);
        if (!target) return;

        if (!this._blackHoleMesh) {
            const group = new THREE.Group();
            const coreGeo = new THREE.SphereGeometry(1.4, 16, 16);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0x050015 });
            const core = new THREE.Mesh(coreGeo, coreMat);
            group.add(core);

            const ringGeo = new THREE.RingGeometry(1.6, 3.8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            group.position.set(target.mesh.position.x, 4.5, target.mesh.position.z);
            window.game?.scene.add(group);
            this._blackHoleMesh = group;
            this._blackHoleRing = ring;
        }

        const bh = this._blackHoleMesh;
        if (this._blackHoleRing) this._blackHoleRing.rotation.z += dt * 8;

        target.mesh.position.lerp(new THREE.Vector3(bh.position.x, 3.2, bh.position.z), dt * 6);
        target.mesh.rotation.y += dt * 18;
        target.mesh.rotation.z += dt * 12;

        target.takeDamage(150, true);

        if (Math.random() < 0.4 && window.game?.spawnHitParticles) {
            const pPos = bh.position.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 3
            ));
            window.game.spawnHitParticles(pPos, 0xaa00ff);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  💀 INSTANT KILL 99,999 DMG (P 키)
    // ────────────────────────────────────────────────────────────
    toggleInstantKill() {
        this.instantKillEnabled = !this.instantKillEnabled;
        if (this.instantKillEnabled) {
            this._showNotification('💀 INSTANT KILL ON — 원샷원킬 99,999 DMG', '#ff0055');
        } else {
            this._showNotification('💀 INSTANT KILL OFF', '#555');
        }
        this._updateHUD();
    }

    // ────────────────────────────────────────────────────────────
    //  ⏱️ TIME STOP / ZA WARUDO (O 키)
    // ────────────────────────────────────────────────────────────
    toggleTimeStop() {
        this.timeStopEnabled = !this.timeStopEnabled;
        if (this.timeStopEnabled) {
            this._showNotification('⏱️ TIME STOP ON — 시간 정지 (ZA WARUDO)', '#00e1ff');
            const flash = document.getElementById('damage-vignette');
            if (flash) {
                flash.style.boxShadow = 'inset 0 0 160px rgba(0,225,255,0.7)';
                flash.style.opacity = '1';
            }
        } else {
            this._showNotification('⏱️ TIME STOP OFF', '#555');
            const flash = document.getElementById('damage-vignette');
            if (flash) flash.style.opacity = '0';
        }
        this._updateHUD();
    }

    // ────────────────────────────────────────────────────────────
    //  HP SYNC: 핵 켜지면 플레이어+적 HP 50,000, 끄면 200
    // ────────────────────────────────────────────────────────────
    _applyHackHPMode() {
        const anyHackOn = this.flyHackEnabled || this.aimBotEnabled || this.godFlightEnabled
            || this.rapidFireEnabled || this.meteorStrikeEnabled || this.blackHoleEnabled
            || this.instantKillEnabled || this.timeStopEnabled || this.spinBotEnabled;

        const player = window.gamePlayer;
        if (player) {
            const targetHP = anyHackOn ? 50000 : 200;
            if (player.maxHealth !== targetHP) {
                player.maxHealth = targetHP;
                // 체력이 새 최대값보다 높거나 낮으면 최대로 설정
                player.health = Math.min(player.health, targetHP);
                // 핵 켤 때만 풀피로 회복
                if (anyHackOn) player.health = 50000;
                player.updateHUD?.();
            }
        }

        // 적(AI)도 동일하게 HP 동기화
        if (window.game?.enemies) {
            const targetEnemyHP = anyHackOn ? 50000 : 200;
            for (const e of window.game.enemies) {
                if (!e.isDead && e.maxHealth !== targetEnemyHP) {
                    e.maxHealth = targetEnemyHP;
                    if (anyHackOn) e.health = 50000;
                    else e.health = Math.min(e.health, 200);
                }
            }
        }
    }

    // ────────────────────────────────────────────────────────────
    //  FRAME UPDATE
    // ────────────────────────────────────────────────────────────
    update(dt) {
        this.updateEnemyDetection(dt);
        this.updateMeteorStrike(dt);
        this.updateBlackHole(dt);
    }

    // ────────────────────────────────────────────────────────────
    //  ENEMY COUNTER-HACK SYSTEM (상대가 바로 알아차리지 않음 - 의심도 시스템)
    // ────────────────────────────────────────────────────────────
    updateEnemyDetection(dt) {
        if (this.enemyHackActivated) return;

        const usingHack = this.flyHackEnabled || this.aimBotEnabled || this.godFlightEnabled
            || this.rapidFireEnabled || this.meteorStrikeEnabled || this.blackHoleEnabled
            || this.instantKillEnabled || this.timeStopEnabled || this.spinBotEnabled;

        if (usingHack) {
            // 핵 사용에 따라 서서히 차오름 (바로 알아차리지 않음)
            let incRate = 0.4; // 기본 완만
            if (this.spinBotEnabled) incRate += 0.8;
            if (this.meteorStrikeEnabled || this.blackHoleEnabled) incRate += 1.2;
            if (this.godFlightEnabled || this.flyHackEnabled) incRate += 0.5;

            this.suspicionMeter = Math.min(this.SUSPICION_MAX, this.suspicionMeter + incRate * dt);
        } else {
            // 핵을 끄면 상대가 의심을 거둠 (서서히 감소)
            this.suspicionMeter = Math.max(0, this.suspicionMeter - 2.5 * dt);
        }

        this._checkEnemyCounterHack();

        if (this.tpCooldown > 0) {
            this.tpCooldown = Math.max(0, this.tpCooldown - dt);
            this._updateHUD();
        }
    }

    _checkEnemyCounterHack() {
        if (this.enemyHackActivated) return;

        const pct = Math.min(1, this.suspicionMeter / this.SUSPICION_MAX);
        const bar = document.getElementById('hack-detect-fill');
        const lbl = document.getElementById('hack-detect-label');

        if (bar) {
            bar.style.width = `${pct * 100}%`;
            if (pct < 0.35) {
                bar.style.background = 'linear-gradient(90deg, #00ff88, #00f0ff)';
            } else if (pct < 0.7) {
                bar.style.background = 'linear-gradient(90deg, #ffcc00, #ff8800)';
            } else {
                bar.style.background = 'linear-gradient(90deg, #ff4444, #ff0055)';
            }
        }

        if (lbl) {
            const percentInt = Math.round(pct * 100);
            if (pct >= 1.0) {
                lbl.textContent = '⚠ 상대가 눈치챔! 반격 ON!';
                lbl.style.color = '#ff4444';
            } else if (pct > 0.65) {
                lbl.textContent = `상대 의심: 극도의 의심 (${percentInt}%)`;
                lbl.style.color = '#ff8800';
            } else if (pct > 0.25) {
                lbl.textContent = `상대 의심: 낌새 감지 (${percentInt}%)`;
                lbl.style.color = '#ffcc00';
            } else {
                lbl.textContent = `상대 의심: 안전/모름 (${percentInt}%)`;
                lbl.style.color = '#00ff88';
            }
        }

        if (this.suspicionMeter >= this.SUSPICION_MAX) {
            this._activateEnemyHacks();
        }
    }

    _activateEnemyHacks() {
        if (this.enemyHackActivated) return;
        this.enemyHackActivated = true;
        this.enemyAimbotOn      = true;
        this.enemyFlyOn         = true;

        this._showNotification('⚠ 상대가 핵을 마침내 간파! 적 반격핵 ON!', '#ff4444');

        const bar = document.getElementById('hack-detect-fill');
        if (bar) { bar.style.width = '100%'; bar.style.background = '#ff4444'; }
        const lbl = document.getElementById('hack-detect-label');
        if (lbl) { lbl.textContent = '⚠ 적 반격핵 ON!'; lbl.style.color = '#ff4444'; }

        // 적 AI 반격 모드 활성 (체력은 50000 유지!)
        if (window.game?.enemies) {
            for (const e of window.game.enemies) {
                if (!e.isDead) {
                    e._hackMode      = true;   // ai.js에서 체크
                    e.damage         = 999;    // 즉사급 데미지
                    e.fireRate       = 0.05;   // 극초고속 연사
                }
            }
        }
    }

    // ── 적 체력 부스트 ─────────────────────────────────
    boostEnemyHealth(soldier) {
        soldier.health    = this.HACK_ENEMY_HP;
        soldier.maxHealth = this.HACK_ENEMY_HP;
    }

    // ────────────────────────────────────────────────────────────
    //  HUD
    // ────────────────────────────────────────────────────────────
    _setupHUD() {
        const hud = document.createElement('div');
        hud.id = 'hack-hud';
        hud.style.cssText = `
            position:fixed; top:50%; right:16px;
            transform:translateY(-50%);
            z-index:9999; pointer-events:none;
            font-family:'Courier New',monospace;
        `;
        hud.innerHTML = `
            <div id="hack-panel" style="
                background:rgba(0,0,0,0.85);
                border:1px solid rgba(255,255,255,0.1);
                border-radius:12px; padding:14px 18px;
                min-width:205px;
                box-shadow:0 0 24px rgba(0,255,200,0.12);
            ">
                <div style="font-size:9px;letter-spacing:3px;color:#666;margin-bottom:12px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;">
                    ⚙ HACK SYSTEM ⚙
                </div>

                <div class="hack-row" id="hack-row-god">
                    <span class="hack-key">B/H</span>
                    <span class="hack-label">GOD NOCLIP</span>
                    <span class="hack-status" id="hack-god-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-fly">
                    <span class="hack-key">G</span>
                    <span class="hack-label">FLY HACK</span>
                    <span class="hack-status" id="hack-fly-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-aim">
                    <span class="hack-key">T</span>
                    <span class="hack-label">SILENT AIM</span>
                    <span class="hack-status" id="hack-aim-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-spin">
                    <span class="hack-key">Y</span>
                    <span class="hack-label">SPINBOT</span>
                    <span class="hack-status" id="hack-spin-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-tp">
                    <span class="hack-key">V</span>
                    <span class="hack-label">TELEPORT</span>
                    <span class="hack-status" id="hack-tp-status">READY</span>
                </div>
                <div class="hack-row" id="hack-row-rapid">
                    <span class="hack-key">J</span>
                    <span class="hack-label">RAPID & INF</span>
                    <span class="hack-status" id="hack-rapid-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-meteor">
                    <span class="hack-key">K</span>
                    <span class="hack-label">METEOR</span>
                    <span class="hack-status" id="hack-meteor-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-bh">
                    <span class="hack-key">L</span>
                    <span class="hack-label">BLACK HOLE</span>
                    <span class="hack-status" id="hack-bh-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-insta">
                    <span class="hack-key">P</span>
                    <span class="hack-label">INSTANT KILL</span>
                    <span class="hack-status" id="hack-insta-status">OFF</span>
                </div>
                <div class="hack-row" id="hack-row-time">
                    <span class="hack-key">O</span>
                    <span class="hack-label">TIME STOP</span>
                    <span class="hack-status" id="hack-time-status">OFF</span>
                </div>

                <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
                    <div style="font-size:9px;color:#888;letter-spacing:1px;margin-bottom:5px;">상대 감지 상태</div>
                    <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:5px;overflow:hidden;">
                        <div id="hack-detect-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#00ff88,#00f0ff);border-radius:4px;transition:width 0.3s;"></div>
                    </div>
                    <div id="hack-detect-label" style="font-size:9px;color:#00ff88;margin-top:4px;text-align:right;">상대 의심: 안전/모름 (0%)</div>
                </div>
            </div>
        `;
        document.body.appendChild(hud);

        const style = document.createElement('style');
        style.textContent = `
            .hack-row {
                display:flex; align-items:center; gap:8px;
                margin-bottom:4px; padding:4px 8px;
                border-radius:6px; background:rgba(255,255,255,0.03);
                transition:background 0.25s, box-shadow 0.25s;
            }
            .hack-row.active-god    { background:rgba(255,230,0,0.18); box-shadow:0 0 10px rgba(255,230,0,0.45); }
            .hack-row.active-fly    { background:rgba(0,240,255,0.12); box-shadow:0 0 8px rgba(0,240,255,0.3); }
            .hack-row.active-aim    { background:rgba(0,240,255,0.18); box-shadow:0 0 10px rgba(0,240,255,0.45); }
            .hack-row.active-spin   { background:rgba(255,0,170,0.22); box-shadow:0 0 12px rgba(255,0,170,0.55); }
            .hack-row.active-tp     { background:rgba(170,0,255,0.15); box-shadow:0 0 8px rgba(170,0,255,0.4); }
            .hack-row.active-rapid  { background:rgba(0,255,136,0.18); box-shadow:0 0 10px rgba(0,255,136,0.45); }
            .hack-row.active-meteor { background:rgba(255,85,0,0.18);  box-shadow:0 0 10px rgba(255,85,0,0.45); }
            .hack-row.active-bh     { background:rgba(170,0,255,0.18); box-shadow:0 0 10px rgba(170,0,255,0.45); }
            .hack-row.active-insta  { background:rgba(255,0,85,0.18);  box-shadow:0 0 10px rgba(255,0,85,0.45); }
            .hack-row.active-time   { background:rgba(0,225,255,0.18); box-shadow:0 0 10px rgba(0,225,255,0.45); }

            .hack-key {
                font-size:10px; font-weight:bold; color:#fff;
                background:rgba(255,255,255,0.1);
                border:1px solid rgba(255,255,255,0.2);
                border-radius:4px; padding:2px 5px;
                min-width:22px; text-align:center;
            }
            .hack-label { flex:1; font-size:10px; color:#999; letter-spacing:1px; }
            .hack-status {
                font-size:10px; font-weight:bold; color:#444;
                letter-spacing:1px; transition:color 0.25s;
            }
            .hack-status.on-god    { color:#ffe600; text-shadow:0 0 8px #ffe600; }
            .hack-status.on-fly    { color:#00f0ff; text-shadow:0 0 8px #00f0ff; }
            .hack-status.on-aim    { color:#00f0ff; text-shadow:0 0 8px #00f0ff; }
            .hack-status.on-spin   { color:#ff00aa; text-shadow:0 0 8px #ff00aa; }
            .hack-status.on-tp     { color:#aa00ff; text-shadow:0 0 8px #aa00ff; }
            .hack-status.on-rapid  { color:#00ff88; text-shadow:0 0 8px #00ff88; }
            .hack-status.on-meteor { color:#ff5500; text-shadow:0 0 8px #ff5500; }
            .hack-status.on-bh     { color:#aa00ff; text-shadow:0 0 8px #aa00ff; }
            .hack-status.on-insta  { color:#ff0055; text-shadow:0 0 8px #ff0055; }
            .hack-status.on-time   { color:#00e1ff; text-shadow:0 0 8px #00e1ff; }
            .hack-status.cd-tp     { color:#ff8800; }
        `;
        document.head.appendChild(style);
    }

    _updateHUD() {
        const set = (id, text, cls) => {
            const el = document.getElementById(id);
            if (el) { el.textContent = text; el.className = 'hack-status ' + cls; }
        };
        const row = (id, cls, active) => {
            const el = document.getElementById(id);
            if (el) el.className = 'hack-row' + (active ? ' ' + cls : '');
        };

        set('hack-god-status',    this.godFlightEnabled    ? 'ON' : 'OFF', this.godFlightEnabled    ? 'on-god' : '');
        set('hack-fly-status',    this.flyHackEnabled      ? 'ON' : 'OFF', this.flyHackEnabled      ? 'on-fly' : '');
        set('hack-aim-status',    this.aimBotEnabled       ? 'ON' : 'OFF', this.aimBotEnabled       ? 'on-aim' : '');
        set('hack-spin-status',   this.spinBotEnabled      ? 'ON' : 'OFF', this.spinBotEnabled      ? 'on-spin' : '');
        set('hack-rapid-status',  this.rapidFireEnabled    ? 'ON' : 'OFF', this.rapidFireEnabled    ? 'on-rapid' : '');
        set('hack-meteor-status', this.meteorStrikeEnabled ? 'ON' : 'OFF', this.meteorStrikeEnabled ? 'on-meteor' : '');
        set('hack-bh-status',     this.blackHoleEnabled    ? 'ON' : 'OFF', this.blackHoleEnabled    ? 'on-bh' : '');
        set('hack-insta-status',  this.instantKillEnabled  ? 'ON' : 'OFF', this.instantKillEnabled  ? 'on-insta' : '');
        set('hack-time-status',   this.timeStopEnabled     ? 'ON' : 'OFF', this.timeStopEnabled     ? 'on-time' : '');

        row('hack-row-god',    'active-god',    this.godFlightEnabled);
        row('hack-row-fly',    'active-fly',    this.flyHackEnabled);
        row('hack-row-aim',    'active-aim',    this.aimBotEnabled);
        row('hack-row-spin',   'active-spin',   this.spinBotEnabled);
        row('hack-row-rapid',  'active-rapid',  this.rapidFireEnabled);
        row('hack-row-meteor', 'active-meteor', this.meteorStrikeEnabled);
        row('hack-row-bh',     'active-bh',     this.blackHoleEnabled);
        row('hack-row-insta',  'active-insta',  this.instantKillEnabled);
        row('hack-row-time',   'active-time',   this.timeStopEnabled);

        // Teleport cooldown display
        const tpEl  = document.getElementById('hack-tp-status');
        const tpRow = document.getElementById('hack-row-tp');
        if (tpEl) {
            if (this.tpCooldown > 0) {
                tpEl.textContent = this.tpCooldown.toFixed(1) + 's';
                tpEl.className   = 'hack-status cd-tp';
                if (tpRow) tpRow.className = 'hack-row';
            } else {
                tpEl.textContent = 'READY';
                tpEl.className   = 'hack-status on-tp';
                if (tpRow) tpRow.className = 'hack-row active-tp';
            }
        }
    }

    _showNotification(msg, color = '#fff') {
        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed; top:42%; left:50%;
            transform:translate(-50%,-50%);
            background:rgba(0,0,0,0.9);
            color:${color};
            font-family:'Courier New',monospace;
            font-size:19px; font-weight:bold;
            letter-spacing:3px;
            padding:13px 30px; border-radius:8px;
            border:1px solid ${color}44;
            box-shadow:0 0 28px ${color}44;
            z-index:99999; pointer-events:none;
            opacity:1; transition:opacity 0.5s;
        `;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 1700);
    }
}

// ── 각도 최단경로 보간 ─────────────────────────────────
function _lerpAngle(a, b, t) {
    let d = b - a;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
}

window.hackSystem = null;

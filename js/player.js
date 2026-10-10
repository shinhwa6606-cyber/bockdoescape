// First Person Player Controller & Gunfire Raycaster Engine

class PlayerController {
    constructor(camera, scene, weaponController) {
        this.camera = camera;
        this.scene = scene;
        this.weaponCtrl = weaponController;
        window.gamePlayer = this;

        // Player Stats (기본 일반전 200 HP, 핵 켜지면 50,000 HP)
        this.health = 200;
        this.maxHealth = 200;
        this.isDead = false;

        // 👑 갓 모드 내구도 (30발 맞으면 사망)
        this.godFlightHitsLeft = 30;
        this.GOD_MODE_MAX_HITS = 30;

        // Position & Physics - Spawns at south side of Roblox Rivals sky arena
        this.position = new THREE.Vector3(0, 0, 22);
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.height = 1.6;
        this.gravity = 24.0;
        this.jumpForce = 9.0; // Responsive arena jump

        // Scythe Dash Ability (F Key)
        this.dashCooldown = 0;
        this.dashMaxCooldown = 2.4; // 2.4s cooldown
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 0.22; // Snappy burst
        this.dashSpeed = 36.0;
        this.dashDirection = new THREE.Vector3();

        // 🏃 Sliding Ability (Ctrl Key)
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 0.65;
        this.slideSpeed = 23.0;
        this.slideCurrentSpeed = 0;
        this.slideDirection = new THREE.Vector3();
        this.slideHeight = 0.85;
        this.normalHeight = 1.6;

        // Weapon Stats dictionary (주무기들 + 보조무기 데저트 이글)
        this.weaponData = {
            m4: { name: 'M4A1 TACTICAL', damage: 35, fireRate: 0.1, maxAmmo: 30, reserveAmmo: 180, spread: 0.015, auto: true },
            ak47: { name: 'AK-47 HEAVY', damage: 55, fireRate: 0.14, maxAmmo: 30, reserveAmmo: 150, spread: 0.025, auto: true },
            famas: { name: 'FAMAS BULLPUP', damage: 28, fireRate: 0.07, maxAmmo: 25, reserveAmmo: 200, spread: 0.012, auto: true },
            awm: { name: 'AWM SNIPER', damage: 150, fireRate: 0.9, maxAmmo: 5, reserveAmmo: 40, spread: 0.002, auto: false },
            spas12: { name: 'SPAS-12 SHOTGUN', damage: 110, fireRate: 0.5, maxAmmo: 8, reserveAmmo: 64, spread: 0.06, auto: false },
            vector: { name: 'VECTOR SMG', damage: 22, fireRate: 0.045, maxAmmo: 33, reserveAmmo: 264, spread: 0.018, auto: true },
            deagle: { name: 'DESERT EAGLE .50', damage: 85, fireRate: 0.22, maxAmmo: 7, reserveAmmo: 42, spread: 0.008, auto: false }
        };

        // Inventory & Weapon Slots ([1] 주무기, [2] 보조무기, [Q] 퀵스왑)
        this.primaryGunKey = 'm4';
        this.secondaryGunKey = 'deagle';
        this.currentGunKey = 'm4';
        this.ammoInMag = 30;
        this.reserveAmmo = 180;
        this.fireTimer = 0;

        // Input state
        this.keys = {};
        this.isPointerLocked = false;
        this.isShooting = false;
        this.isADS = false;

        // Raycasting for bullet hit detection
        this.raycaster = new THREE.Raycaster();

        // Camera Aim & Dynamic Recoil Spring System
        this.pitch = 0;
        this.yaw = 0; // Facing North towards arena center & rival
        this.recoilPitch = 0;
        this.camera.rotation.order = 'YXZ';

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyR') {
                this.reload();
            }
            if (e.code === 'KeyF') {
                this.dashAndSlash();
            }
            // 🏃 Ctrl: 슬라이딩
            if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
                this.startSlide();
            }

            // 🔫 무기 슬롯 조작: 1번 주무기, 2번 보조무기 (데저트 이글), Q번 퀵체인지
            if (e.code === 'Digit1') {
                this.switchGun(this.primaryGunKey);
            }
            if (e.code === 'Digit2') {
                this.switchGun('deagle');
            }
            if (e.code === 'KeyQ') {
                if (this.currentGunKey === 'deagle') {
                    this.switchGun(this.primaryGunKey);
                } else {
                    this.switchGun('deagle');
                }
            }

            // 주무기 교체 단축키 (3: FAMAS, 4: AWM, 5: SPAS12, 6: VECTOR, 7: AK47)
            if (e.code === 'Digit3') { this.primaryGunKey = 'famas'; this.switchGun('famas'); }
            if (e.code === 'Digit4') { this.primaryGunKey = 'awm'; this.switchGun('awm'); }
            if (e.code === 'Digit5') { this.primaryGunKey = 'spas12'; this.switchGun('spas12'); }
            if (e.code === 'Digit6') { this.primaryGunKey = 'vector'; this.switchGun('vector'); }
            if (e.code === 'Digit7') { this.primaryGunKey = 'ak47'; this.switchGun('ak47'); }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousedown', (e) => {
            if (!this.isPointerLocked) return;
            if (e.button === 0) {
                this.isShooting = true;
            } else if (e.button === 2) {
                this.isADS = true;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isShooting = false;
            if (e.button === 2) this.isADS = false;
        });

        document.addEventListener('contextmenu', e => e.preventDefault());

        // Pointer Lock mouse movement
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;
            // Slower, precision mouse look sensitivity when ADS zooming with Sniper Rifle
            const sensitivity = (this.currentGunKey === 'awm' && this.isADS) ? 0.0005 : 0.002;
            this.yaw -= e.movementX * sensitivity;
            this.pitch -= e.movementY * sensitivity;

            // Pitch limit
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch + this.recoilPitch));

            this.mouseDeltaX = e.movementX;
            this.mouseDeltaY = e.movementY;
        });
    }

    switchGun(key) {
        if (this.weaponCtrl.isReloading) return;
        if (this.currentGunKey === key) return;

        this.currentGunKey = key;
        const data = this.weaponData[key];
        this.ammoInMag = data.maxAmmo;
        this.reserveAmmo = data.reserveAmmo;
        this.weaponCtrl.switchWeapon(key);

        this.updateHUD();
    }


    reload() {
        const data = this.weaponData[this.currentGunKey];
        if (this.ammoInMag >= data.maxAmmo || this.reserveAmmo <= 0) return;

        this.weaponCtrl.startReload(() => {
            const needed = data.maxAmmo - this.ammoInMag;
            const loaded = Math.min(needed, this.reserveAmmo);
            this.ammoInMag += loaded;
            this.reserveAmmo -= loaded;
            this.updateHUD();
        });
    }

    takeDamage(amount) {
        if (this.isDead) return;

        // 👑 갓 모드 활성 중 — 30발 카운터로만 데미지 처리 (실제 체력 무관)
        if (window.hackSystem?.godFlightEnabled) {
            this.godFlightHitsLeft--;

            // Flash Red Vignette
            const vig = document.getElementById('damage-vignette');
            if (vig) {
                vig.style.opacity = '0.6';
                setTimeout(() => vig.style.opacity = '0', 150);
            }

            // 갓 모드 내구도 HUD 갱신
            this._updateGodHUD();

            if (this.godFlightHitsLeft <= 0) {
                // 30발 소진 → 갓 모드 강제 해제 후 즉사
                window.hackSystem.godFlightEnabled = false;
                window.hackSystem._updateHUD?.();
                window.hackSystem._showNotification?.('💀 갓 모드 내구도 소진! 30발 맞음 → 사망!', '#ff0055');
                this.health = 0;
                this.isDead = true;
                if (window.onGameOver) window.onGameOver(false);
            }
            return;
        }

        this.health -= amount;
        this.updateHUD();

        // Flash Red Vignette
        const vig = document.getElementById('damage-vignette');
        if (vig) {
            vig.style.opacity = '1';
            setTimeout(() => vig.style.opacity = '0', 200);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            if (window.onGameOver) window.onGameOver(false);
        }
    }

    _updateGodHUD() {
        let godBar = document.getElementById('god-hit-bar');
        if (!godBar) {
            // 최초 생성
            const wrap = document.createElement('div');
            wrap.id = 'god-hit-wrap';
            wrap.style.cssText = 'position:fixed;top:50%;left:20px;transform:translateY(-50%);z-index:99999;pointer-events:none;font-family:"Courier New",monospace;';
            wrap.innerHTML = `
                <div style="font-size:10px;color:#ffe600;letter-spacing:2px;margin-bottom:4px;text-align:center;">👑 GOD 내구도</div>
                <div style="background:rgba(0,0,0,0.7);border:1px solid #ffe60055;border-radius:6px;width:14px;height:160px;overflow:hidden;position:relative;">
                    <div id="god-hit-bar" style="position:absolute;bottom:0;width:100%;height:100%;background:linear-gradient(0deg,#ff4444,#ffe600);border-radius:6px;transition:height 0.15s;"></div>
                </div>
                <div id="god-hit-count" style="font-size:10px;color:#ffe600;text-align:center;margin-top:4px;">30</div>
            `;
            document.body.appendChild(wrap);
            godBar = document.getElementById('god-hit-bar');
        }
        const pct = Math.max(0, this.godFlightHitsLeft / this.GOD_MODE_MAX_HITS * 100);
        godBar.style.height = pct + '%';
        // 색상: 잔여량에 따라 변화
        if (pct > 60) godBar.style.background = 'linear-gradient(0deg,#ffe600,#ffdd00)';
        else if (pct > 30) godBar.style.background = 'linear-gradient(0deg,#ff8800,#ffe600)';
        else godBar.style.background = 'linear-gradient(0deg,#ff2200,#ff8800)';
        const countEl = document.getElementById('god-hit-count');
        if (countEl) countEl.textContent = Math.max(0, this.godFlightHitsLeft);

        // 갓 모드 꺼지면 숨기기
        const wrap2 = document.getElementById('god-hit-wrap');
        if (wrap2) wrap2.style.display = window.hackSystem?.godFlightEnabled ? 'block' : 'none';
    }

    shoot(enemiesList, onMuzzleFlash) {
        const data = this.weaponData[this.currentGunKey];
        const isRapid = !!window.hackSystem?.rapidFireEnabled;
        const isInsta = !!window.hackSystem?.instantKillEnabled;

        if (this.ammoInMag <= 0 && !isRapid) {
            sounds.playEmptyClick();
            this.fireTimer = 0.2;
            return;
        }

        if (!isRapid) {
            this.ammoInMag--;
        } else {
            this.ammoInMag = 999;
            this.reserveAmmo = 999;
        }
        this.updateHUD();

        // Audio & Visual Effects
        sounds.playGunshot(this.currentGunKey);
        this.weaponCtrl.applyRecoil(this.currentGunKey);
        
        // Camera Pitch Recoil Kick (spring-based) — rapid fire has 0 kick
        if (!isRapid) {
            const cameraKick = (this.currentGunKey === 'awm' ? 0.06 : (this.currentGunKey === 'spas12' ? 0.045 : (this.currentGunKey === 'ak47' ? 0.028 : 0.015)));
            this.recoilPitch += cameraKick;
        }

        if (onMuzzleFlash) onMuzzleFlash();

        // ── 에임핵 벽관통 사격 ────────────────────────────────────────────
        if (window.hackSystem && window.hackSystem.applyAimBotShot(this, enemiesList)) {
            this.fireTimer = isRapid ? 0.025 : data.fireRate;
            return; // 에임핵이 처리했으면 일반 raycast 스킵
        }

        // Bullet Raycast — always from camera center for pixel-perfect accuracy
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);

        // Add spread bias only when hip-firing (not ADS) — rapid fire has 0 spread
        if (!this.isADS && !isRapid) {
            dir.x += (Math.random() - 0.5) * data.spread;
            dir.y += (Math.random() - 0.5) * data.spread;
        }
        // AWM ADS: zero spread, perfectly accurate
        dir.normalize();

        // Set raycaster from camera world position along exact aim direction
        this.raycaster.set(this.camera.position.clone(), dir);
        this.raycaster.far = Infinity; // Unlimited range — AWM must hit distant enemies

        // Check target objects
        const targetMeshes = [];
        enemiesList.forEach(e => {
            if (!e.isDead) {
                e.mesh.traverse(child => {
                    if (child.isMesh) targetMeshes.push(child);
                });
            }
        });

        const intersects = this.raycaster.intersectObjects(targetMeshes, true);
        if (intersects.length > 0) {
            const hit = intersects[0];
            const soldier = hit.object.soldier;
            if (soldier) {
                if (window.onPlayerHit) window.onPlayerHit();
                const isHeadshot = !!hit.object.isHead;
                const finalDamage = isInsta ? 99999 : (isHeadshot ? data.damage * 2.5 : data.damage);
                soldier.takeDamage(finalDamage, true);

                // Blood hit particles
                if (window.game?.spawnHitParticles) {
                    window.game.spawnHitParticles(hit.point || soldier.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)));
                }

                // Show hit marker
                sounds.playHitMarker();
                const hm = document.getElementById('hit-marker');
                if (hm) {
                    hm.classList.add('active');
                    setTimeout(() => hm.classList.remove('active'), 100);
                }

                if (soldier.isDead) {
                    window.gameKills = (window.gameKills || 0) + 1;
                    this.showKillFeed(`적군 처치 ${isHeadshot ? '【헤드샷!】' : ''} ${isInsta ? '【💀 즉사!】' : ''}`, isHeadshot || isInsta);
                }
            }
        }

        this.fireTimer = isRapid ? 0.025 : data.fireRate;
    }

    showKillFeed(text, isHeadshot = false) {
        const feed = document.getElementById('kill-feed');
        if (!feed) return;
        const msg = document.createElement('div');
        msg.className = 'kill-msg' + (isHeadshot ? ' headshot' : '');
        msg.innerText = text;
        feed.appendChild(msg);
        setTimeout(() => msg.remove(), 4000);
    }

    dashAndSlash() {
        if (this.isDead || this.dashCooldown > 0) return;

        this.dashCooldown = this.dashMaxCooldown;
        sounds.playDashSound();

        // Dash in camera world view direction
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.dashDirection.copy(dir);

        // Agility pitch: allow upward dash leap or flat dash
        if (this.dashDirection.y > -0.2) {
            this.dashDirection.y = Math.max(0.12, this.dashDirection.y * 0.7);
        }
        this.dashDirection.normalize();

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.isGrounded = false;
        this.velocity.y = this.dashDirection.y * this.dashSpeed * 0.35;

        // Visual dash vignette & FOV punch
        const dashVignette = document.getElementById('dash-vignette');
        if (dashVignette) {
            dashVignette.classList.add('active');
            setTimeout(() => dashVignette.classList.remove('active'), 250);
        }

        // Camera FOV punch
        this.camera.fov = Math.min(94, this.camera.fov + 14);
        this.camera.updateProjectionMatrix();

        // Perform Scythe Slash animation
        this.weaponCtrl.performScytheSlash(() => {
            this.checkScytheMeleeHit(window.game?.enemies || []);
        });

        this.updateHUD();
    }

    checkScytheMeleeHit(enemiesList) {
        if (!enemiesList || enemiesList.length === 0) return;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        for (let enemy of enemiesList) {
            if (enemy.isDead) continue;
            const enemyCenter = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
            const playerEye = this.camera.position.clone();
            const toEnemy = enemyCenter.clone().sub(playerEye);
            const dist = toEnemy.length();

            // Melee range ~4.2 units
            if (dist <= 4.2) {
                const dirToEnemy = toEnemy.clone().normalize();
                const dot = forward.dot(dirToEnemy);
                // Within frontal arc
                if (dot > 0.15) {
                    sounds.playScytheHit();
                    const damage = window.hackSystem?.instantKillEnabled ? 99999 : 85; // 원샷원킬 즉사핵 지원
                    enemy.takeDamage(damage, true);

                    if (window.onPlayerHit) window.onPlayerHit();

                    // Hitmarker
                    const hm = document.getElementById('hit-marker');
                    if (hm) {
                        hm.classList.add('active');
                        setTimeout(() => hm.classList.remove('active'), 120);
                    }

                    // Slash particles
                    if (window.game?.spawnHitParticles) {
                        window.game.spawnHitParticles(enemyCenter, 0x00f0ff);
                    }

                    if (enemy.isDead) {
                        window.gameKills = (window.gameKills || 0) + 1;
                        this.showKillFeed('⚡ [낫 대쉬 베기!] SCYTHE EXECUTION', true);
                    }
                    break;
                }
            }
        }
    }

    startSlide() {
        if (this.isDead || this.isDashing || this.isSliding) return;
        if (window.hackSystem?.flyHackEnabled || window.hackSystem?.godFlightEnabled) return;
        if (!this.isGrounded) return;

        // 슬라이딩 방향 결정 (WASD 입력이 있으면 해당 방향, 없으면 카메라 전방 수평 방향)
        let dir = new THREE.Vector3();
        if (this.keys['KeyW']) dir.z -= 1;
        if (this.keys['KeyS']) dir.z += 1;
        if (this.keys['KeyA']) dir.x -= 1;
        if (this.keys['KeyD']) dir.x += 1;

        if (dir.lengthSq() > 0) {
            dir.normalize().applyEuler(new THREE.Euler(0, this.yaw, 0));
        } else {
            this.camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
        }

        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        this.slideCurrentSpeed = this.slideSpeed;
        this.slideDirection.copy(dir);

        // 시각 효과 & 사운드
        sounds.playDash?.();
        const vignette = document.getElementById('dash-vignette');
        if (vignette) {
            vignette.classList.add('active');
            setTimeout(() => vignette.classList.remove('active'), 220);
        }

        // 💬 슬라이딩 시 상대 채팅 반응 (가끔 반응)
        if (window.chatSystem && Math.random() < 0.35) {
            window.chatSystem.triggerRivalReaction('slide');
        }
    }

    updateHUD() {
        const gunName = document.getElementById('current-gun-name');
        const ammoMain = document.getElementById('current-ammo');
        const ammoReserve = document.getElementById('reserve-ammo');
        const hpFill = document.getElementById('hp-fill');
        const hpText = document.getElementById('hp-text');

        if (gunName) gunName.innerText = this.weaponData[this.currentGunKey].name;
        if (ammoMain) ammoMain.innerText = window.hackSystem?.rapidFireEnabled ? '∞' : this.ammoInMag;
        if (ammoReserve) ammoReserve.innerText = window.hackSystem?.rapidFireEnabled ? '∞' : this.reserveAmmo;
        if (hpFill) hpFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
        if (hpText) hpText.innerText = `${Math.ceil(this.health)} HP`;

        // 1v1 Top Duel Player HP Bar
        const duelPlayerFill = document.getElementById('duel-player-fill');
        const duelPlayerVal = document.getElementById('duel-player-hp');
        if (duelPlayerFill) duelPlayerFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
        if (duelPlayerVal) duelPlayerVal.innerText = `${Math.ceil(this.health)}`;

        // Scythe Dash Cooldown UI
        const dashCdFill = document.getElementById('dash-cd-fill');
        const dashKeyBadge = document.getElementById('dash-key-badge');
        if (dashCdFill) {
            if (this.dashCooldown > 0) {
                const pct = (this.dashCooldown / this.dashMaxCooldown) * 100;
                dashCdFill.style.height = `${pct}%`;
                if (dashKeyBadge) dashKeyBadge.innerText = this.dashCooldown.toFixed(1) + 's';
            } else {
                dashCdFill.style.height = '0%';
                if (dashKeyBadge) dashKeyBadge.innerText = 'F';
            }
        }
    }

    update(dt, enemiesList, onMuzzleFlash) {
        if (this.isDead) return;

        // ── 핵 시스템 업데이트 ────────────────────────────────────────
        if (window.hackSystem) {
            window.hackSystem.applyGodFlight(this, dt);           // 👑 무적 3D 관통 회피비행 (B/H)
            window.hackSystem.applyFlyHack(this, dt);             // 🛸 3D 자유비행 & 속도조절 (G)
            window.hackSystem.applyAimBot(this, enemiesList, dt); // 사일런트 에임핵 타겟팅 (T)
            window.hackSystem.update(dt);                         // 🌟 메테오, 블랙홀, 의심도 시스템
        }

        // Decay recoil pitch spring (camera auto-recovers from kick)
        this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, dt * 14);
        // Apply combined pitch to camera
        this.camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch + this.recoilPitch));
        this.camera.rotation.y = this.yaw;

        // 🌪️ 스핀봇 (Y) — 화면 360도 초고속 회전 + 격렬한 지터 화면 흔들림
        if (window.hackSystem?.spinBotEnabled) {
            window.hackSystem.applySpinBot(this, dt);
        }

        // Update Dash Cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown = Math.max(0, this.dashCooldown - dt);
            this.updateHUD();
        }

        // Handle Movement
        let moveDir = new THREE.Vector3();
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.position.x += this.dashDirection.x * this.dashSpeed * dt;
            this.position.z += this.dashDirection.z * this.dashSpeed * dt;
            this.position.y += this.dashDirection.y * this.dashSpeed * dt * 0.45;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else if (this.isSliding) {
            // 🏃 Ctrl 슬라이딩 이동 및 감속
            this.slideTimer -= dt;
            this.slideCurrentSpeed = THREE.MathUtils.lerp(this.slideCurrentSpeed, 6.0, dt * 3.5);
            this.position.x += this.slideDirection.x * this.slideCurrentSpeed * dt;
            this.position.z += this.slideDirection.z * this.slideCurrentSpeed * dt;

            // 슬라이딩 시 자세 낮추기
            this.height = THREE.MathUtils.lerp(this.height, this.slideHeight, dt * 18);

            // 마찰 파티클
            if (Math.random() < 0.45 && window.game?.spawnHitParticles) {
                window.game.spawnHitParticles(new THREE.Vector3(this.position.x, this.position.y + 0.1, this.position.z), 0xcccccc);
            }

            if (this.slideTimer <= 0) {
                this.isSliding = false;
            }
        } else if (!this.isDashing && !this.isSliding && !(window.hackSystem?.flyHackEnabled) && !(window.hackSystem?.godFlightEnabled)) {
            // 서있거나 걸을 때 원래 키로 복귀
            this.height = THREE.MathUtils.lerp(this.height, this.normalHeight, dt * 14);

            const speed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? 7.5 : 4.6;

            if (this.keys['KeyW']) moveDir.z -= 1;
            if (this.keys['KeyS']) moveDir.z += 1;
            if (this.keys['KeyA']) moveDir.x -= 1;
            if (this.keys['KeyD']) moveDir.x += 1;

            moveDir.normalize();
            moveDir.applyEuler(new THREE.Euler(0, this.yaw, 0));

            this.position.x += moveDir.x * speed * dt;
            this.position.z += moveDir.z * speed * dt;
        } else {
            this.height = THREE.MathUtils.lerp(this.height, this.normalHeight, dt * 14);
        }

        // Restore normal camera FOV if not ADS sniper
        if (!(this.currentGunKey === 'awm' && this.isADS)) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75, dt * 10);
            this.camera.updateProjectionMatrix();
        }

        // 👑 신 모드(노클립) 또는 플라이핵 활성 시에는 맵 경계/벽 충돌 모두 무시하고 하늘/바닥 완전 자유 관통!
        if (!(window.hackSystem?.godFlightEnabled) && !(window.hackSystem?.flyHackEnabled)) {
            // Keep player bounded inside Roblox Rivals sky arena
            this.position.x = Math.max(-17.5, Math.min(17.5, this.position.x));
            this.position.z = Math.max(-27.5, Math.min(27.5, this.position.z));

            // Resolve arena obstacles and boundary collision
            if (window.gameEnv) {
                window.gameEnv.resolveWallCollision(this.position);
            }
        }

        // Terrain Elevation & Jump Physics
        const targetGroundY = window.gameEnv 
            ? window.gameEnv.getGroundHeight(this.position.x, this.position.z) 
            : 0;

        // Terrain Elevation & Jump Physics (플라이핵 / 신 모드 사용 중에는 중력/바닥 스냅 스킵)
        if (!(window.hackSystem?.flyHackEnabled) && !(window.hackSystem?.godFlightEnabled)) {
            // Jump Handling — 슬라이딩 중 점프 시 보너스 도약!
            if (this.keys['Space'] && this.isGrounded) {
                const bonus = this.isSliding ? 1.2 : 1.0;
                this.velocity.y = this.jumpForce * bonus;
                this.isGrounded = false;
                this.isSliding = false;
                this.position.y += 0.05; // nudge off ground to prevent immediate re-land
            }

            // Apply Gravity
            if (!this.isGrounded) {
                this.velocity.y -= this.gravity * dt;
                this.position.y += this.velocity.y * dt;

                // Only land if we are falling (velocity.y <= 0) AND we've reached ground level
                if (this.velocity.y <= 0 && this.position.y <= targetGroundY) {
                    this.position.y = targetGroundY;
                    this.velocity.y = 0;
                    this.isGrounded = true;
                }
            } else {
                // Smoothly adapt to ground/ramp slope
                if (targetGroundY < this.position.y + 0.5) {
                    this.position.y = THREE.MathUtils.lerp(this.position.y, targetGroundY, dt * 15);
                }
            }
        }

        // Set camera position
        this.camera.position.set(this.position.x, this.position.y + this.height, this.position.z);

        // Weapon FPV Update
        const isMoving = moveDir.lengthSq() > 0 || this.isDashing || this.isSliding;
        this.weaponCtrl.update(dt, isMoving, this.isADS, this.mouseDeltaX || 0, this.mouseDeltaY || 0);
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

        // Handle Firing Timer
        this.fireTimer -= dt;
        if (this.isShooting && this.fireTimer <= 0 && !this.weaponCtrl.isReloading && !this.weaponCtrl.isSlashingScythe) {
            this.shoot(enemiesList, onMuzzleFlash);
        }
    }
}

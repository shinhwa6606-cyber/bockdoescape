// High-Poly Tactical AI — MAJOR UPDATE v3.0
// Features: 20 enemies, 8 allies, tank unit, slow-motion last-kill, squad formations

class Soldier {
    constructor(scene, isAlly, initialPos) {
        this.scene = scene;
        this.isAlly = isAlly;
        this.health = 200;
        this.maxHealth = 200;
        this.isDead = false;

        // Weapon stats
        this.fireCooldown = Math.random() * 1.0;
        this.fireRate = isAlly ? 0.30 + Math.random()*0.15 : 0.45 + Math.random()*0.25;
        this.damage = isAlly ? 18 : 12;

        // Tactical cover state
        this.isCrouching = false;
        this.coverTimer = Math.random() * 4.0;
        this.peekSide = (Math.random() > 0.5) ? 1 : -1;

        // Visual mesh
        this.mesh = new THREE.Group();
        this.createHighPolySoldierMesh();
        this.mesh.position.copy(initialPos);
        this.scene.add(this.mesh);

        // AI State
        this.target = null;
        this.targetPos = null;
        this.isTargetingPlayer = false;
        this.targetAlly = null;
        this.state = 'fight';
        this.animTimer = Math.random() * 10;
        this.chargeTimer = 3 + Math.random() * 5;
        this.isCharging = false;

        // Stagger/flinch on hit
        this.flinchTimer = 0;

        this.losRaycaster = new THREE.Raycaster();
    }

    hasLineOfSight(targetPos) {
        if (!window.gameEnv || !window.gameEnv.colliders || window.gameEnv.colliders.length === 0) return true;
        const origin = this.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const dir = targetPos.clone().sub(origin);
        const distance = dir.length();
        if (distance < 0.5) return true;
        dir.normalize();
        this.losRaycaster.set(origin, dir);
        this.losRaycaster.far = Math.max(0.1, distance - 0.8);
        const hits = this.losRaycaster.intersectObjects(window.gameEnv.colliders, false);
        return hits.length === 0;
    }

    createHighPolySoldierMesh() {
        // Color scheme - Roblox Rivals stylized cyber combatant
        const teamColor  = this.isAlly ? 0x0077ee : 0x1e1e2c;
        const vestColor  = this.isAlly ? 0x0055b8 : 0xdf1640;
        const helmColor  = this.isAlly ? 0x003f88 : 0x28283a;
        const skinColor  = 0xf0b88e;
        const gunColor   = 0x12141a;
        const bootColor  = 0x15161c;
        const goggColor  = this.isAlly ? 0x00f0ff : 0xff1448;

        const bodyMat   = new THREE.MeshStandardMaterial({ color: teamColor,  roughness: 0.6, metalness: 0.2 });
        const vestMat   = new THREE.MeshStandardMaterial({ color: vestColor,  roughness: 0.5, metalness: 0.25 });
        const helmMat   = new THREE.MeshStandardMaterial({ color: helmColor,  roughness: 0.4, metalness: 0.5 });
        const skinMat   = new THREE.MeshStandardMaterial({ color: skinColor,  roughness: 0.85, metalness: 0.0 });
        const gunMat    = new THREE.MeshStandardMaterial({ color: gunColor,   roughness: 0.25, metalness: 0.85 });
        const bootMat   = new THREE.MeshStandardMaterial({ color: bootColor,  roughness: 0.8,  metalness: 0.1 });
        const goggMat   = new THREE.MeshStandardMaterial({
            color: goggColor,
            emissive: goggColor,
            emissiveIntensity: 0.9,
            roughness: 0.1,
            metalness: 0.8
        });
        const pouchMat  = new THREE.MeshStandardMaterial({ color: vestColor,  roughness: 0.6,  metalness: 0.15 });

        // === LEGS ===
        this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), bodyMat);
        this.legL.position.set(-0.14, 0.36, 0);
        this.legL.castShadow = true;

        this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), bodyMat);
        this.legR.position.set(0.14, 0.36, 0);
        this.legR.castShadow = true;

        this.mesh.add(this.legL);
        this.mesh.add(this.legR);

        // Boots
        const bootGeo = new THREE.BoxGeometry(0.24, 0.18, 0.28);
        const bootL = new THREE.Mesh(bootGeo, bootMat);
        bootL.position.set(-0.14, 0.09, 0.04);
        this.mesh.add(bootL);
        const bootR = new THREE.Mesh(bootGeo, bootMat);
        bootR.position.set(0.14, 0.09, 0.04);
        this.mesh.add(bootR);

        // === TORSO ===
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.75, 0.34), bodyMat);
        torso.position.y = 0.87;
        torso.castShadow = true;
        this.mesh.add(torso);

        // Kevlar vest
        const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.38), vestMat);
        vest.position.set(0, 0.90, 0);
        vest.castShadow = true;
        this.mesh.add(vest);

        // Vest pouches (3)
        [[-0.2,0.75,0.2],[0,0.72,0.21],[0.2,0.75,0.2]].forEach(([px,py,pz]) => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.09), pouchMat);
            p.position.set(px, py, pz);
            this.mesh.add(p);
        });

        // Shoulder patches
        [-0.3, 0.3].forEach(sx => {
            const sh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.52, 0.34), bodyMat);
            sh.position.set(sx, 0.87, 0);
            this.mesh.add(sh);
        });

        // === ARMS ===
        this.armL = new THREE.Group();
        const aLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), bodyMat);
        aLMesh.position.set(0, -0.28, 0);
        this.armL.add(aLMesh);
        this.armL.position.set(-0.38, 1.07, 0);
        this.mesh.add(this.armL);

        this.armR = new THREE.Group();
        const aRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), bodyMat);
        aRMesh.position.set(0, -0.28, 0);
        this.armR.add(aRMesh);
        this.armR.position.set(0.38, 1.07, 0);
        this.mesh.add(this.armR);

        // === HEAD ===
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), skinMat);
        head.position.y = 1.42;
        head.castShadow = true;
        this.mesh.add(head);

        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 8), skinMat);
        neck.position.y = 1.28;
        this.mesh.add(neck);

        // Tactical helmet (semi-sphere with rim)
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.215, 14, 14, 0, Math.PI*2, 0, Math.PI*0.6),
            helmMat
        );
        helmet.position.y = 1.44;
        helmet.castShadow = true;
        this.mesh.add(helmet);

        // Helmet cover netting (slightly larger, wire)
        const helmetCover = new THREE.Mesh(
            new THREE.SphereGeometry(0.225, 8, 8, 0, Math.PI*2, 0, Math.PI*0.5),
            new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.95, metalness: 0.0, wireframe: true, opacity: 0.4, transparent: true })
        );
        helmetCover.position.y = 1.44;
        this.mesh.add(helmetCover);

        // Tactical goggles / visor
        const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), goggMat);
        goggles.position.set(0, 1.45, 0.17);
        goggles.castShadow = true;
        this.mesh.add(goggles);

        // Ear pads
        [-0.2, 0.2].forEach(ex => {
            const ear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), helmMat);
            ear.position.set(ex, 1.42, 0);
            this.mesh.add(ear);
        });

        // === RIFLE ===
        const rifleGroup = new THREE.Group();
        const rcvr = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.58), gunMat);
        rifleGroup.add(rcvr);
        const brl = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 8), gunMat);
        brl.rotation.x = Math.PI / 2;
        brl.position.set(0, 0.01, -0.41);
        rifleGroup.add(brl);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.09), gunMat);
        mag.position.set(0, -0.12, -0.06);
        mag.rotation.x = 0.22;
        rifleGroup.add(mag);
        const stck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.18), gunMat);
        stck.position.set(0, 0, 0.32);
        rifleGroup.add(stck);
        // Grip
        const grp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), gunMat);
        grp.position.set(0, -0.08, 0.1);
        grp.rotation.x = 0.25;
        rifleGroup.add(grp);

        rifleGroup.position.set(0.25, 1.02, -0.28);
        this.mesh.add(rifleGroup);

        // Tag ALL meshes with soldier reference
        this.mesh.traverse(child => {
            if (child.isMesh) child.soldier = this;
        });

        // Head-hit detection flags
        head.isHead    = true;
        helmet.isHead  = true;
        goggles.isHead = true;
        this.headMesh  = head;

        // Body mesh references for hit detection
        torso.soldier = this;
        vest.soldier  = this;
    }

    takeDamage(amount, isPlayerAttacker) {
        if (this.isDead) return;
        if (this.isAlly && isPlayerAttacker) return; // No friendly fire

        this.health -= amount;
        this.flinchTimer = 0.15;

        // Update 1v1 Top HUD Rival HP
        if (!this.isAlly) {
            const fill = document.getElementById('duel-enemy-fill');
            const hpTxt = document.getElementById('duel-enemy-hp');
            if (fill) fill.style.width = `${Math.max(0, (this.health / this.maxHealth) * 100)}%`;
            if (hpTxt) hpTxt.innerText = `${Math.max(0, Math.ceil(this.health))}`;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.state = 'dead';

        if (!this.isAlly) {
            const fill = document.getElementById('duel-enemy-fill');
            const hpTxt = document.getElementById('duel-enemy-hp');
            if (fill) fill.style.width = '0%';
            if (hpTxt) hpTxt.innerText = '0';
        }

        // Fall-over death animation
        const dir = (Math.random() > 0.5 ? 1 : -1);
        const axis = (Math.random() > 0.5) ? 'x' : 'z';
        const startTime = Date.now();
        const initRot = this.mesh.rotation[axis];

        const animDeath = () => {
            const t = Math.min(1, (Date.now() - startTime) / 450);
            this.mesh.rotation[axis] = THREE.MathUtils.lerp(initRot, dir * Math.PI * 0.48, t);
            if (t < 1) requestAnimationFrame(animDeath);
        };
        animDeath();

        if (window.game) {
            window.game.updateSquadCounts();
            if (!this.isAlly) {
                window.game.triggerLastKillSlowMo(this.mesh.position);
            }
        }
    }

    update(dt, enemiesList, alliesList, playerPos, onFireBullet) {
        if (this.isDead || window.hackSystem?.timeStopEnabled) return; // ⏱️ 시간 정지핵 활성 시 완전 정지

        this.fireCooldown -= dt;
        this.coverTimer   -= dt;
        this.animTimer    += dt * 3.5;
        this.chargeTimer  -= dt;
        if (this.flinchTimer > 0) this.flinchTimer -= dt;

        // Cover / peek toggle
        if (this.coverTimer <= 0) {
            this.isCrouching = !this.isCrouching;
            this.coverTimer = 1.8 + Math.random() * 3.5;
            if (!this.isCrouching) this.peekSide *= -1;
        }

        // Crouching scale
        this.mesh.scale.set(1.0, this.isCrouching ? 0.65 : 1.0, 1.0);

        // Arm animation
        if (this.armL && this.armR) {
            const aimAnim = Math.sin(this.animTimer) * 0.08;
            this.armL.rotation.x = -0.6 + aimAnim;
            this.armR.rotation.x = -0.6 - aimAnim;
        }

        // Target Player in 1v1
        this.targetPos = playerPos ? playerPos.clone() : new THREE.Vector3(0, 0, 22);
        this.isTargetingPlayer = true;

        // ─── 1v1 Tactical Movement & Strafing ──────────────────────
        if (this.targetPos && !this.isCrouching) {
            const toTarget = this.targetPos.clone().sub(this.mesh.position);
            toTarget.y = 0;
            const dist = toTarget.length();
            const forward = toTarget.clone().normalize();
            const right = new THREE.Vector3(-forward.z, 0, forward.x);

            // Dynamic strafe & advance/retreat
            const strafeFactor = Math.sin(this.animTimer * 1.6) * 3.6;
            let moveVector = new THREE.Vector3();

            if (dist > 15.0) {
                // Advance forward
                moveVector.addScaledVector(forward, 4.4);
            } else if (dist < 6.5) {
                // Backpedal from close shotgun / scythe range
                moveVector.addScaledVector(forward, -3.8);
            }
            // Lateral strafing
            moveVector.addScaledVector(right, strafeFactor);

            this.mesh.position.x += moveVector.x * dt;
            this.mesh.position.z += moveVector.z * dt;

            if (moveVector.lengthSq() > 0.1) {
                this._animLegs();
            } else {
                this._stopLegs();
            }
        } else {
            this._stopLegs();
        }

        // ─── Ground Clamp (적 핵 모드 시 공중 부양) ────────────────────
        let baseY = window.gameEnv ? window.gameEnv.getGroundHeight(this.mesh.position.x, this.mesh.position.z) : 0;
        if (this._hackMode) {
            baseY += 5.0 + Math.sin(this.animTimer * 2.5) * 1.5; // 적 플라이핵
        }
        this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, baseY, dt * (this._hackMode ? 8 : 14));

        // Wall & obstacle collision (핵 모드 시 벽 무시)
        if (!this._hackMode && window.gameEnv) window.gameEnv.resolveWallCollision(this.mesh.position, 0.4);

        // Arena bounds
        this.mesh.position.x = Math.max(-17.0, Math.min(17.0, this.mesh.position.x));
        this.mesh.position.z = Math.max(-27.0, Math.min(27.0, this.mesh.position.z));

        // ─── Aim & Shoot ──────────────────────────────────────────────
        if (this.isAlly && this.target) {
            const headPos = this.target.mesh.position.clone().add(new THREE.Vector3(this.peekSide * 0.15, 1.2, 0));
            this.mesh.lookAt(headPos.x, this.mesh.position.y, headPos.z);

            if (this.fireCooldown <= 0 && !this.isCrouching) {
                this.fireCooldown = this.fireRate + Math.random() * 0.3;
                if (this.hasLineOfSight(headPos)) {
                    const from = this.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                    if (onFireBullet) onFireBullet(from, headPos, false);
                    const spread = (Math.random()-0.5) * 25; // % chance miss
                    if (Math.abs(spread) < 12) this.target.takeDamage(this.damage, false);
                }
            }
        } else if (!this.isAlly && this.targetPos) {
            const headPos = this.isTargetingPlayer
                ? playerPos.clone().add(new THREE.Vector3(0, 0.1, 0))
                : this.targetPos.clone().add(new THREE.Vector3(this.peekSide * 0.15, 1.2, 0));
            this.mesh.lookAt(headPos.x, this.mesh.position.y, headPos.z);

            if (this.fireCooldown <= 0 && (!this.isCrouching || this._hackMode)) {
                this.fireCooldown = this._hackMode ? 0.06 : (this.fireRate + Math.random() * 0.5);
                const canShoot = this._hackMode ? true : this.hasLineOfSight(headPos);
                if (canShoot) {
                    const from = this.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                    if (onFireBullet) onFireBullet(from, headPos, true);

                    const dist = this.mesh.position.distanceTo(this.isTargetingPlayer ? playerPos : this.targetPos);
                    const hitChance = this._hackMode ? 1.0 : Math.max(0.2, 1.0 - dist * 0.018); // 적 핵 모드는 100% 명중
                    if (Math.random() < hitChance) {
                        // 플레이어가 무적 회피핵(신 모드) 사용 중이면 절대 피격되지 않음
                        if (this.isTargetingPlayer && !window.gamePlayer?.isDead && !window.hackSystem?.godFlightEnabled) {
                            window.gamePlayer.takeDamage(this.damage);
                        } else if (this.targetAlly) {
                            this.targetAlly.takeDamage(this.damage, false);
                        }
                    }
                }
            }
        }
    }

    _animLegs() {
        if (this.legL) this.legL.rotation.x =  Math.sin(this.animTimer * 2.2) * 0.65;
        if (this.legR) this.legR.rotation.x = -Math.sin(this.animTimer * 2.2) * 0.65;
    }
    _stopLegs() {
        if (this.legL) this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, 0, 0.18);
        if (this.legR) this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, 0, 0.18);
    }
}

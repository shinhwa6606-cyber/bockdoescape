// Roblox Rivals 1v1 Sky Arena Generator
// Faithfully reproduces the clean white grid skybox arena from "아레나 맵.webp"

class EnvironmentBuilder {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.obstacles = []; // Array of bounding boxes and ramps for collision & standing
        window.gameEnv = this;

        // Arena boundary limits
        this.bounds = {
            minX: -17.5,
            maxX: 17.5,
            minZ: -27.5,
            maxZ: 27.5,
            wallHeight: 11.0
        };

        this.initTexturesAndMaterials();
        this.buildAtmosphere();
        this.buildSkyClouds();
        this.buildArenaShell();
        this.buildArenaObstacles();
    }

    initTexturesAndMaterials() {
        // Procedural Roblox Rivals "Developer Grid" canvas texture with '+' crosshairs
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Light clean background
        ctx.fillStyle = '#e8ecf2';
        ctx.fillRect(0, 0, 512, 512);

        // Subtle tile shading
        ctx.fillStyle = '#f0f4fa';
        ctx.fillRect(4, 4, 248, 248);
        ctx.fillRect(260, 4, 248, 248);
        ctx.fillRect(4, 260, 248, 248);
        ctx.fillRect(260, 260, 248, 248);

        // Grid lines
        ctx.strokeStyle = '#b8c4d2';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 256, 256);
        ctx.strokeRect(256, 0, 256, 256);
        ctx.strokeRect(0, 256, 256, 256);
        ctx.strokeRect(256, 256, 256, 256);

        // Crosshairs '+' at grid intersections
        const drawCross = (x, y) => {
            ctx.strokeStyle = '#8ea1b6';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x - 14, y);
            ctx.lineTo(x + 14, y);
            ctx.moveTo(x, y - 14);
            ctx.lineTo(x, y + 14);
            ctx.stroke();

            // Inner center dot
            ctx.fillStyle = '#6b829c';
            ctx.fillRect(x - 2, y - 2, 4, 4);
        };

        drawCross(0, 0);
        drawCross(256, 0);
        drawCross(512, 0);
        drawCross(0, 256);
        drawCross(256, 256);
        drawCross(512, 256);
        drawCross(0, 512);
        drawCross(256, 512);
        drawCross(512, 512);

        const gridTex = new THREE.CanvasTexture(canvas);
        gridTex.wrapS = THREE.RepeatWrapping;
        gridTex.wrapT = THREE.RepeatWrapping;
        gridTex.anisotropy = 8;

        this.gridTexture = gridTex;

        // Cloneable materials
        this.materials = {
            gridFloor: new THREE.MeshStandardMaterial({
                map: this._cloneTex(gridTex, 18, 28),
                roughness: 0.65,
                metalness: 0.05
            }),
            gridWall: new THREE.MeshStandardMaterial({
                map: this._cloneTex(gridTex, 18, 5.5),
                roughness: 0.65,
                metalness: 0.05
            }),
            gridWallZ: new THREE.MeshStandardMaterial({
                map: this._cloneTex(gridTex, 28, 5.5),
                roughness: 0.65,
                metalness: 0.05
            }),
            gridBlock: new THREE.MeshStandardMaterial({
                map: this._cloneTex(gridTex, 3, 3),
                roughness: 0.65,
                metalness: 0.05
            }),
            accentBlock: new THREE.MeshStandardMaterial({
                color: 0xd9e3f0,
                roughness: 0.6,
                metalness: 0.08
            }),
            wallRim: new THREE.MeshStandardMaterial({
                color: 0xf5f8fc,
                roughness: 0.45,
                metalness: 0.1
            }),
            cloud: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.95,
                metalness: 0.0,
                flatShading: true
            })
        };
    }

    _cloneTex(srcTex, rx, ry) {
        const t = srcTex.clone();
        t.needsUpdate = true;
        t.repeat.set(rx, ry);
        return t;
    }

    buildAtmosphere() {
        // Vibrant daylight sky
        this.scene.background = new THREE.Color(0x56a6f5);
        this.scene.fog = new THREE.FogExp2(0x89c4f8, 0.0035);

        // Balanced daylight ambient
        const ambient = new THREE.AmbientLight(0xd9ebff, 0.85);
        this.scene.add(ambient);

        // Sunlight casting crisp soft shadows
        const sun = new THREE.DirectionalLight(0xffffff, 1.35);
        sun.position.set(35, 60, 25);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 160;
        const d = 42;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        sun.shadow.bias = -0.0004;
        this.scene.add(sun);

        // Soft secondary sky fill light
        const skyFill = new THREE.DirectionalLight(0x90caf9, 0.45);
        skyFill.position.set(-30, 40, -30);
        this.scene.add(skyFill);
    }

    buildSkyClouds() {
        const cloudGroup = new THREE.Group();

        // Generate surrounding fluffy cumulus cloud clusters below and around the arena
        const clusterCount = 38;
        const sphereGeo = new THREE.DodecahedronGeometry(1, 1);

        for (let i = 0; i < clusterCount; i++) {
            const angle = (i / clusterCount) * Math.PI * 2;
            const dist = 55 + Math.random() * 45;
            const cx = Math.cos(angle) * dist;
            const cz = Math.sin(angle) * dist;
            const cy = -8 + Math.random() * 12;

            const puffCount = 5 + Math.floor(Math.random() * 6);
            for (let j = 0; j < puffCount; j++) {
                const puff = new THREE.Mesh(sphereGeo, this.materials.cloud);
                const scale = 8 + Math.random() * 12;
                puff.scale.set(scale * (1 + Math.random()*0.3), scale * (0.6 + Math.random()*0.3), scale * (1 + Math.random()*0.3));
                puff.position.set(
                    cx + (Math.random() - 0.5) * 22,
                    cy + (Math.random() - 0.5) * 8,
                    cz + (Math.random() - 0.5) * 22
                );
                puff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                puff.castShadow = false;
                puff.receiveShadow = true;
                cloudGroup.add(puff);
            }
        }

        // Tall distant cloud pillars (as seen in the reference image)
        [-75, 80].forEach(pz => {
            const pillarX = (Math.random() - 0.5) * 40;
            for (let k = 0; k < 12; k++) {
                const puff = new THREE.Mesh(sphereGeo, this.materials.cloud);
                const scale = 14 + k * 1.5;
                puff.scale.set(scale, scale * 0.9, scale);
                puff.position.set(pillarX + (Math.random() - 0.5) * 10, -5 + k * 5.5, pz + (Math.random() - 0.5) * 10);
                cloudGroup.add(puff);
            }
        });

        this.scene.add(cloudGroup);
    }

    buildArenaShell() {
        const floorW = 36;
        const floorL = 56;
        const wallH = this.bounds.wallHeight;
        const wallThick = 2.0;

        // Arena Floor
        const floorGeo = new THREE.BoxGeometry(floorW, 2.0, floorL);
        const floor = new THREE.Mesh(floorGeo, this.materials.gridFloor);
        floor.position.set(0, -1.0, 0); // Top surface at y = 0
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.colliders.push(floor);

        // High Boundary Walls (East, West, North, South)
        // West Wall (X = -18)
        const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorL + wallThick * 2), this.materials.gridWallZ);
        wallWest.position.set(-floorW / 2 - wallThick / 2, wallH / 2, 0);
        wallWest.castShadow = true;
        wallWest.receiveShadow = true;
        this.scene.add(wallWest);
        this.colliders.push(wallWest);

        // East Wall (X = +18)
        const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorL + wallThick * 2), this.materials.gridWallZ);
        wallEast.position.set(floorW / 2 + wallThick / 2, wallH / 2, 0);
        wallEast.castShadow = true;
        wallEast.receiveShadow = true;
        this.scene.add(wallEast);
        this.colliders.push(wallEast);

        // North Wall (Z = -28)
        const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), this.materials.gridWall);
        wallNorth.position.set(0, wallH / 2, -floorL / 2 - wallThick / 2);
        wallNorth.castShadow = true;
        wallNorth.receiveShadow = true;
        this.scene.add(wallNorth);
        this.colliders.push(wallNorth);

        // South Wall (Z = +28)
        const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), this.materials.gridWall);
        wallSouth.position.set(0, wallH / 2, floorL / 2 + wallThick / 2);
        wallSouth.castShadow = true;
        wallSouth.receiveShadow = true;
        this.scene.add(wallSouth);
        this.colliders.push(wallSouth);

        // Perimeter Wall Tops (White rim caps)
        const rimMat = this.materials.wallRim;
        const rimCapWest = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.4, 0.4, floorL + wallThick * 2 + 0.4), rimMat);
        rimCapWest.position.set(-floorW / 2 - wallThick / 2, wallH + 0.2, 0);
        this.scene.add(rimCapWest);

        const rimCapEast = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.4, 0.4, floorL + wallThick * 2 + 0.4), rimMat);
        rimCapEast.position.set(floorW / 2 + wallThick / 2, wallH + 0.2, 0);
        this.scene.add(rimCapEast);
    }

    buildArenaObstacles() {
        // Faithful recreation of structures from "아레나 맵.webp":
        // 1. Central Elevated Pavilion / Gazebo
        // 2. Slanted Ramps
        // 3. Rectangular Cutout Window Wall
        // 4. Tall Pillars & Corner Monoliths
        // 5. Tactical Cover Blocks

        // === 1. CENTRAL ELEVATED PAVILION ===
        // 4 pillars + roof platform at y = 4.8
        const pillarGeo = new THREE.BoxGeometry(1.1, 4.4, 1.1);
        const pMat = this.materials.gridBlock;
        const pillarPositions = [
            [-2.6, 2.2, -2.6],
            [ 2.6, 2.2, -2.6],
            [-2.6, 2.2,  2.6],
            [ 2.6, 2.2,  2.6]
        ];

        pillarPositions.forEach(([px, py, pz]) => {
            const pil = new THREE.Mesh(pillarGeo, pMat);
            pil.position.set(px, py, pz);
            pil.castShadow = true;
            pil.receiveShadow = true;
            this.scene.add(pil);
            this.colliders.push(pil);
            this.addBoxObstacle(px, py, pz, 1.1, 4.4, 1.1);
        });

        // Pavilion Roof Slab (Platform)
        const roofW = 7.0, roofT = 0.6, roofL = 7.0;
        const roofGeo = new THREE.BoxGeometry(roofW, roofT, roofL);
        const roof = new THREE.Mesh(roofGeo, this.materials.gridBlock);
        roof.position.set(0, 4.4 + roofT / 2, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.scene.add(roof);
        this.colliders.push(roof);
        this.addBoxObstacle(0, 4.4 + roofT / 2, 0, roofW, roofT, roofL);

        // === 2. FOREGROUND SLANTED RAMP ===
        // Ramps as seen in the photo (one in front leading toward center)
        this.createRamp(0, 10.5, 4.5, 9.0, 3.6, 'south');
        // Symmetrical ramp on north side
        this.createRamp(0, -10.5, 4.5, 9.0, 3.6, 'north');

        // === 3. WINDOW / DOORWAY CUTOUT COVER WALL (Near center-south) ===
        // Wall with hollow rectangular opening in middle
        this.createWindowWall(-4.5, 5.0, 5.5, 3.8, 1.2, 0);

        // Symmetrical opposite cutout wall (Near center-north)
        this.createWindowWall(4.5, -5.0, 5.5, 3.8, 1.2, Math.PI);

        // === 4. TALL PILLARS & RECTANGULAR MONOLITHS ===
        // Right side tall block (from photo)
        this.createCoverBlock(5.5, 2.7, 4.5, 3.2, 5.4, 3.2);

        // Left side angled tall wall (from photo)
        this.createCoverBlock(-7.5, 2.7, -4.0, 1.4, 5.4, 5.5, 0.15);

        // Tall side cover pillars
        this.createCoverBlock(-9.5, 2.3, 6.0, 2.2, 4.6, 2.2);
        this.createCoverBlock(9.5, 2.3, -6.0, 2.2, 4.6, 2.2);

        // Mid-field tactical pillars
        this.createCoverBlock(-2.5, 1.8, -8.0, 2.0, 3.6, 2.0);
        this.createCoverBlock(2.5, 1.8, 8.0, 2.0, 3.6, 2.0);

        // Far side cover boxes for spawn tactical peeking
        this.createCoverBlock(-8.0, 1.5, -17.0, 3.2, 3.0, 1.8);
        this.createCoverBlock(8.0, 1.5, -17.0, 3.2, 3.0, 1.8);
        this.createCoverBlock(0.0, 1.2, -20.0, 4.0, 2.4, 1.6);

        this.createCoverBlock(-8.0, 1.5, 17.0, 3.2, 3.0, 1.8);
        this.createCoverBlock(8.0, 1.5, 17.0, 3.2, 3.0, 1.8);
        this.createCoverBlock(0.0, 1.2, 20.0, 4.0, 2.4, 1.6);

        // Half walls for crouching and peeking
        this.createCoverBlock(-12.0, 1.1, 0.0, 1.4, 2.2, 7.0);
        this.createCoverBlock(12.0, 1.1, 0.0, 1.4, 2.2, 7.0);
    }

    createCoverBlock(x, y, z, w, h, d, rotY = 0) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, this.materials.gridBlock);
        mesh.position.set(x, y, z);
        if (rotY) mesh.rotation.y = rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.colliders.push(mesh);
        this.addBoxObstacle(x, y, z, w, h, d, rotY);
        return mesh;
    }

    createWindowWall(x, z, width, height, thickness, rotY = 0) {
        const group = new THREE.Group();
        const mat = this.materials.gridBlock;

        // Wall with window opening: Left post, Right post, Bottom sill, Top lintel
        const holeW = 2.2;
        const holeH = 1.8;
        const holeBottom = 1.0;
        const postW = (width - holeW) / 2;

        // Left post
        const pLeft = new THREE.Mesh(new THREE.BoxGeometry(postW, height, thickness), mat);
        pLeft.position.set(-width / 2 + postW / 2, height / 2, 0);
        group.add(pLeft);

        // Right post
        const pRight = new THREE.Mesh(new THREE.BoxGeometry(postW, height, thickness), mat);
        pRight.position.set(width / 2 - postW / 2, height / 2, 0);
        group.add(pRight);

        // Bottom sill
        const sill = new THREE.Mesh(new THREE.BoxGeometry(holeW, holeBottom, thickness), mat);
        sill.position.set(0, holeBottom / 2, 0);
        group.add(sill);

        // Top lintel
        const lintelH = height - (holeBottom + holeH);
        if (lintelH > 0) {
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(holeW, lintelH, thickness), mat);
            lintel.position.set(0, height - lintelH / 2, 0);
            group.add(lintel);
        }

        group.position.set(x, 0, z);
        if (rotY) group.rotation.y = rotY;
        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                this.colliders.push(child);
            }
        });

        this.scene.add(group);
        this.addBoxObstacle(x, height / 2, z, width, height, thickness, rotY);
    }

    createRamp(x, z, width, length, height, direction = 'south') {
        // Procedural Wedge / Ramp
        const geom = new THREE.BufferGeometry();
        const hw = width / 2;
        const hl = length / 2;

        // Direction specifies which end is high:
        // 'south': z+ is low (y=0), z- is high (y=height)
        // 'north': z- is low (y=0), z+ is high (y=height)
        let zLow = (direction === 'south') ? hl : -hl;
        let zHigh = (direction === 'south') ? -hl : hl;

        const vertices = new Float32Array([
            // Bottom face
            -hw, 0, zLow,   hw, 0, zLow,   hw, 0, zHigh,
            -hw, 0, zLow,   hw, 0, zHigh, -hw, 0, zHigh,
            // Slanted top face
            -hw, 0, zLow,   hw, 0, zHigh,  hw, 0, zLow,
            -hw, 0, zLow,  -hw, height, zHigh, hw, height, zHigh,
            // Vertical back wall
            -hw, 0, zHigh,  hw, 0, zHigh,  hw, height, zHigh,
            -hw, 0, zHigh,  hw, height, zHigh, -hw, height, zHigh,
            // Left triangle side
            -hw, 0, zLow,  -hw, height, zHigh, -hw, 0, zHigh,
            // Right triangle side
            hw, 0, zLow,   hw, 0, zHigh,   hw, height, zHigh
        ]);

        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();

        const mesh = new THREE.Mesh(geom, this.materials.gridBlock);
        mesh.position.set(x, 0, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.colliders.push(mesh);

        // Store ramp data for smooth walking & jumping
        this.obstacles.push({
            type: 'ramp',
            minX: x - hw,
            maxX: x + hw,
            minZ: z - hl,
            maxZ: z + hl,
            height: height,
            direction: direction,
            x: x,
            z: z,
            hl: hl
        });
    }

    addBoxObstacle(x, y, z, w, h, d, rotY = 0) {
        this.obstacles.push({
            type: 'box',
            x: x,
            y: y,
            z: z,
            w: w,
            h: h,
            d: d,
            topY: y + h / 2,
            bottomY: y - h / 2,
            halfW: w / 2,
            halfD: d / 2,
            rotY: rotY
        });
    }

    getGroundHeight(x, z) {
        // Base ground level
        let highestY = 0.0;

        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            if (obs.type === 'ramp') {
                if (x >= obs.minX && x <= obs.maxX && z >= obs.minZ && z <= obs.maxZ) {
                    let progress = 0;
                    if (obs.direction === 'south') {
                        // z+ is 0, z- is height
                        progress = (obs.maxZ - z) / (obs.hl * 2);
                    } else {
                        // z- is 0, z+ is height
                        progress = (z - obs.minZ) / (obs.hl * 2);
                    }
                    progress = Math.max(0, Math.min(1, progress));
                    const rampY = progress * obs.height;
                    if (rampY > highestY) highestY = rampY;
                }
            } else if (obs.type === 'box') {
                // Check if (x, z) is inside horizontal box bounds
                let dx = x - obs.x;
                let dz = z - obs.z;
                if (obs.rotY !== 0) {
                    const cos = Math.cos(-obs.rotY);
                    const sin = Math.sin(-obs.rotY);
                    const rx = dx * cos - dz * sin;
                    const rz = dx * sin + dz * cos;
                    dx = rx;
                    dz = rz;
                }
                if (Math.abs(dx) <= obs.halfW + 0.1 && Math.abs(dz) <= obs.halfD + 0.1) {
                    if (obs.topY > highestY) {
                        highestY = obs.topY;
                    }
                }
            }
        }

        return highestY;
    }

    resolveWallCollision(pos, radius = 0.4) {
        // Outer arena boundary collision
        const minX = this.bounds.minX + radius;
        const maxX = this.bounds.maxX - radius;
        const minZ = this.bounds.minZ + radius;
        const maxZ = this.bounds.maxZ - radius;

        if (pos.x < minX) pos.x = minX;
        if (pos.x > maxX) pos.x = maxX;
        if (pos.z < minZ) pos.z = minZ;
        if (pos.z > maxZ) pos.z = maxZ;

        // Obstacle side collisions (only when player is not standing above it)
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            if (obs.type === 'box') {
                // If player is already on top of the block, don't push horizontally
                if (pos.y >= obs.topY - 0.25) continue;

                let dx = pos.x - obs.x;
                let dz = pos.z - obs.z;

                if (obs.rotY === 0) {
                    const overlapX = (obs.halfW + radius) - Math.abs(dx);
                    const overlapZ = (obs.halfD + radius) - Math.abs(dz);

                    if (overlapX > 0 && overlapZ > 0) {
                        // Resolve via the shallowest penetration axis
                        if (overlapX < overlapZ) {
                            pos.x += Math.sign(dx) * overlapX;
                        } else {
                            pos.z += Math.sign(dz) * overlapZ;
                        }
                    }
                }
            }
        }
    }
}

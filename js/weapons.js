// Procedural 3D Weapon Models & Articulated Reload Animation System

class WeaponBuilder {
    static createMaterials() {
        return {
            darkMetal: new THREE.MeshStandardMaterial({ color: 0x1e222a, roughness: 0.3, metalness: 0.8 }),
            gunSteel: new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.25, metalness: 0.9 }),
            magMetal: new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.4, metalness: 0.7 }),
            wood: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7, metalness: 0.1 }),
            tanPolymer: new THREE.MeshStandardMaterial({ color: 0x2b2b28, roughness: 0.5, metalness: 0.2 }),
            goldBrass: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 }),
            skin: new THREE.MeshStandardMaterial({ color: 0xc89d7c, roughness: 0.8, metalness: 0.0 }),
            glove: new THREE.MeshStandardMaterial({ color: 0x1b2028, roughness: 0.7, metalness: 0.1 }),
            silverSteel: new THREE.MeshStandardMaterial({ color: 0xd9e3f0, roughness: 0.2, metalness: 0.95 })
        };
    }

    // Build First Person View Hands
    static createHands(mats) {
        const handsGroup = new THREE.Group();

        // Right Hand (Grip)
        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), mats.glove);
        rHand.position.set(0.06, -0.06, 0.05);
        handsGroup.add(rHand);

        // Left Hand (Foregrip / Mag reload hand)
        const lHandGroup = new THREE.Group();
        const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), mats.glove);
        lHandGroup.add(lHand);
        lHandGroup.position.set(-0.06, -0.08, -0.25);
        handsGroup.add(lHandGroup);

        handsGroup.leftHand = lHandGroup;
        handsGroup.rightHand = rHand;
        return handsGroup;
    }

    // Build M4A1
    static createM4(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Lower & Upper Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), mats.gunSteel);
        receiver.position.set(0, 0, 0);
        body.add(receiver);

        // Barrel & Handguard
        const handguard = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), mats.darkMetal);
        handguard.rotation.x = Math.PI / 2;
        handguard.position.set(0, 0.01, -0.28);
        body.add(handguard);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), mats.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.01, -0.52);
        body.add(barrel);

        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), mats.darkMetal);
        flashHider.rotation.x = Math.PI / 2;
        flashHider.position.set(0, 0.01, -0.66);
        body.add(flashHider);

        // Pistol Grip & Tactical Stock
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), mats.tanPolymer);
        grip.position.set(0, -0.08, 0.08);
        grip.rotation.x = 0.3;
        body.add(grip);

        const stockTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), mats.darkMetal);
        stockTube.rotation.x = Math.PI / 2;
        stockTube.position.set(0, 0.02, 0.24);
        body.add(stockTube);

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.18), mats.tanPolymer);
        stock.position.set(0, 0.01, 0.32);
        body.add(stock);

        // Iron Sight / Picatinny Rail Scope
        const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), mats.darkMetal);
        sightBase.position.set(0, 0.055, -0.05);
        body.add(sightBase);

        const sightRear = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.03), mats.darkMetal);
        sightRear.position.set(0, 0.08, 0.04);
        body.add(sightRear);

        // Separate Articulated Magazine (STANAG Curved Mag)
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.07), mats.magMetal);
        magMesh.rotation.x = 0.15;
        magMesh.position.set(0, -0.09, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.04, -0.08);
        body.add(magazineGroup);

        // Separate Articulated Charging Handle / Bolt
        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.08), mats.gunSteel);
        bolt.position.set(0, 0.045, 0.12);
        body.add(bolt);

        // Attach hands
        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'm4',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.28),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build AK-47
    static createAK47(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.32), mats.gunSteel);
        receiver.position.set(0, 0, 0);
        body.add(receiver);

        // Wooden Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.28), mats.wood);
        stock.position.set(0, -0.02, 0.28);
        stock.rotation.x = -0.08;
        body.add(stock);

        // Wooden Handguard & Gas Tube
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.24), mats.wood);
        handguard.position.set(0, 0.005, -0.26);
        body.add(handguard);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.35, 8), mats.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.01, -0.52);
        body.add(barrel);

        const sightFront = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.03), mats.darkMetal);
        sightFront.position.set(0, 0.05, -0.65);
        body.add(sightFront);

        // Wooden Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.05), mats.wood);
        grip.position.set(0, -0.08, 0.08);
        grip.rotation.x = 0.35;
        body.add(grip);

        // Distinct Banana Magazine (7.62x39 Curved Mag)
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.22, 0.08), mats.magMetal);
        magMesh.rotation.x = 0.32;
        magMesh.position.set(0, -0.1, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.04, -0.1);
        body.add(magazineGroup);

        // Right side Bolt / Charging Handle
        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), mats.gunSteel);
        bolt.position.set(0.04, 0.02, -0.04);
        body.add(bolt);

        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'ak47',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.26),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build FAMAS (Bullpup)
    static createFAMAS(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Bullpup Main Receiver Body
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.45), mats.tanPolymer);
        mainBody.position.set(0, 0, 0);
        body.add(mainBody);

        // Iconic Top Carry Handle & Sights
        const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.38), mats.darkMetal);
        carryHandle.position.set(0, 0.09, -0.02);
        body.add(carryHandle);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), mats.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.01, -0.32);
        body.add(barrel);

        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), mats.darkMetal);
        flashHider.rotation.x = Math.PI / 2;
        flashHider.position.set(0, -0.01, -0.45);
        body.add(flashHider);

        // Pistol Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.05), mats.tanPolymer);
        grip.position.set(0, -0.1, -0.08);
        grip.rotation.x = 0.25;
        body.add(grip);

        // Rear Bullpup Magazine (Behind trigger grip!)
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.07), mats.magMetal);
        magMesh.position.set(0, -0.08, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.05, 0.16);
        body.add(magazineGroup);

        // Inside Carry Handle Charging Lever
        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.06), mats.gunSteel);
        bolt.position.set(0, 0.07, -0.08);
        body.add(bolt);

        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'famas',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.15),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build AWM Sniper Rifle
    static createAWM(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Long Sniper Receiver & Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.1, 0.6), mats.tanPolymer);
        stock.position.set(0, -0.02, 0.1);
        body.add(stock);

        // Heavy Long Steel Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8), mats.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.6);
        body.add(barrel);

        const muzzleBreak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), mats.darkMetal);
        muzzleBreak.position.set(0, 0.02, -0.94);
        body.add(muzzleBreak);

        // Sniper Optical Scope & Rings (Hollow open aperture)
        const scopeOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 12, 1, true), mats.darkMetal);
        scopeOuter.rotation.x = Math.PI / 2;
        scopeOuter.position.set(0, 0.09, -0.1);
        body.add(scopeOuter);

        const scopeRingFront = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 12), mats.darkMetal);
        scopeRingFront.rotation.x = Math.PI / 2;
        scopeRingFront.position.set(0, 0.09, -0.22);
        body.add(scopeRingFront);

        const scopeRingRear = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 12), mats.darkMetal);
        scopeRingRear.rotation.x = Math.PI / 2;
        scopeRingRear.position.set(0, 0.09, 0.02);
        body.add(scopeRingRear);

        // Magazine & Bolt Lever
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), mats.magMetal);
        magMesh.position.set(0, -0.08, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.05, -0.05);
        body.add(magazineGroup);

        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), mats.gunSteel);
        bolt.position.set(0.04, 0.03, 0.08);
        body.add(bolt);

        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'awm',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.35),
            defaultMagPos: magazineGroup.position.clone()
        };
    }


    // Build SPAS-12 Shotgun
    static createSPAS12(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.38), mats.gunSteel);
        receiver.position.set(0, 0, 0);
        body.add(receiver);

        // Dual Barrel & Magazine Tube
        const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8), mats.darkMetal);
        mainBarrel.rotation.x = Math.PI / 2;
        mainBarrel.position.set(0, 0.02, -0.42);
        body.add(mainBarrel);

        const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), mats.gunSteel);
        magTube.rotation.x = Math.PI / 2;
        magTube.position.set(0, -0.02, -0.4);
        body.add(magTube);

        // Pump Forearm Grip
        const pumpGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), mats.tanPolymer);
        pumpGrip.rotation.x = Math.PI / 2;
        pumpGrip.position.set(0, -0.01, -0.32);
        body.add(pumpGrip);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.05), mats.tanPolymer);
        grip.position.set(0, -0.09, 0.1);
        grip.rotation.x = 0.3;
        body.add(grip);

        const magazineGroup = new THREE.Group(); // Internal tube
        magazineGroup.position.set(0, 0, 0);
        body.add(magazineGroup);

        const bolt = pumpGrip; // Pump moves back during racking

        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'spas12',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.32),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build KRISS Vector SMG
    static createVector(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        // Super V Recoil Mechanism Receiver Body
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.3), mats.darkMetal);
        receiver.position.set(0, -0.02, 0);
        body.add(receiver);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), mats.gunSteel);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.24);
        body.add(barrel);

        const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 10), mats.darkMetal);
        silencer.rotation.x = Math.PI / 2;
        silencer.position.set(0, 0.02, -0.38);
        body.add(silencer);

        // Extended Vertical Magazine
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.06), mats.magMetal);
        magMesh.position.set(0, -0.12, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.05, -0.06);
        body.add(magazineGroup);

        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.05), mats.gunSteel);
        bolt.position.set(-0.04, 0.04, -0.02);
        body.add(bolt);

        const hands = this.createHands(mats);
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: bolt,
            hands: hands,
            type: 'vector',
            defaultLeftHandPos: new THREE.Vector3(-0.06, -0.08, -0.18),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build Desert Eagle .50 AE Pistol (보조 무기)
    static createDeagle(mats) {
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);

        const silverMat = mats.silverSteel || mats.gunSteel;

        // Lower Frame & Pistol Grip
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.22), mats.darkMetal);
        frame.position.set(0, -0.01, 0);
        body.add(frame);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.12, 0.065), mats.tanPolymer || mats.darkMetal);
        grip.position.set(0, -0.08, 0.05);
        grip.rotation.x = 0.3;
        body.add(grip);

        // Trigger guard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.06), mats.darkMetal);
        guard.position.set(0, -0.045, -0.02);
        body.add(guard);

        // Slide Group (Blowback bolt)
        const slideGroup = new THREE.Group();
        const slideMesh = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.24), silverMat);
        slideMesh.position.set(0, 0.03, -0.02);
        slideGroup.add(slideMesh);

        // Heavy Barrel & Muzzle
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 8), mats.darkMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.16);
        slideGroup.add(barrel);

        // Front & Rear Sights
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.02), mats.darkMetal);
        frontSight.position.set(0, 0.065, -0.13);
        slideGroup.add(frontSight);

        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.02), mats.darkMetal);
        rearSight.position.set(0, 0.065, 0.08);
        slideGroup.add(rearSight);

        body.add(slideGroup);

        // Drop-free Magazine (7-round .50 AE)
        const magazineGroup = new THREE.Group();
        const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.055), mats.magMetal);
        magMesh.rotation.x = 0.3;
        magMesh.position.set(0, -0.06, 0);
        magazineGroup.add(magMesh);
        magazineGroup.position.set(0, -0.04, 0.05);
        body.add(magazineGroup);

        // Two-handed Pistol Grip Hands
        const hands = new THREE.Group();
        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.10), mats.glove);
        rHand.position.set(0.03, -0.07, 0.05);
        rHand.rotation.x = 0.25;
        hands.add(rHand);

        const lHandGroup = new THREE.Group();
        const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.10), mats.glove);
        lHandGroup.add(lHand);
        lHandGroup.position.set(-0.02, -0.08, 0.04);
        lHandGroup.rotation.x = 0.25;
        hands.add(lHandGroup);

        hands.leftHand = lHandGroup;
        hands.rightHand = rHand;
        root.add(hands);

        return {
            root: root,
            body: body,
            magazine: magazineGroup,
            bolt: slideGroup,
            hands: hands,
            type: 'deagle',
            defaultLeftHandPos: new THREE.Vector3(-0.02, -0.08, 0.04),
            defaultMagPos: magazineGroup.position.clone()
        };
    }

    // Build Roblox Rivals Scythe (낫)
    static createScythe(mats) {
        const root = new THREE.Group();
        const scythe = new THREE.Group();
        root.add(scythe);

        const darkCarbon = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.35, metalness: 0.85 });
        const silverSteel = new THREE.MeshStandardMaterial({ color: 0xd9e3f0, roughness: 0.2, metalness: 0.95 });
        const cyanGlow = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.95,
            roughness: 0.1,
            metalness: 0.8
        });

        // Long main shaft
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.35, 10), darkCarbon);
        scythe.add(shaft);

        // Metallic grip rings along the shaft
        [-0.35, -0.05, 0.25, 0.52].forEach(y => {
            const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 10), silverSteel);
            ring.position.set(0, y, 0);
            scythe.add(ring);
        });

        // Bottom spike pommel
        const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 8), silverSteel);
        pommel.rotation.x = Math.PI;
        pommel.position.set(0, -0.72, 0);
        scythe.add(pommel);

        // Top head bracket
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), darkCarbon);
        head.position.set(0, 0.68, 0.04);
        scythe.add(head);

        // Glowing core crystal
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), cyanGlow);
        core.position.set(0, 0.68, 0.1);
        scythe.add(core);

        // Curved menacing scythe blade
        const bladeGroup = new THREE.Group();
        const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.07, 0.28), darkCarbon);
        seg1.position.set(0, 0.7, 0.22);
        seg1.rotation.x = 0.3;
        bladeGroup.add(seg1);

        const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.065, 0.35), darkCarbon);
        seg2.position.set(0, 0.64, 0.5);
        seg2.rotation.x = 0.75;
        bladeGroup.add(seg2);

        const seg3 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.36, 4), darkCarbon);
        seg3.position.set(0, 0.42, 0.72);
        seg3.rotation.x = 1.45;
        bladeGroup.add(seg3);

        // Glowing edge strip
        const glowStrip1 = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.38), cyanGlow);
        glowStrip1.position.set(0, 0.67, 0.35);
        glowStrip1.rotation.x = 0.55;
        bladeGroup.add(glowStrip1);

        const glowStrip2 = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.36), cyanGlow);
        glowStrip2.position.set(0, 0.48, 0.66);
        glowStrip2.rotation.x = 1.25;
        bladeGroup.add(glowStrip2);

        scythe.add(bladeGroup);

        // First-person hands holding scythe
        const hands = this.createHands(mats);
        hands.rightHand.position.set(0.04, 0.12, 0.02);
        hands.leftHand.position.set(-0.04, -0.28, 0.02);
        scythe.add(hands);

        // Default rest transform
        scythe.position.set(0.18, -0.16, -0.32);
        scythe.rotation.set(-0.4, 0.35, -0.3);

        root.scytheGroup = scythe;
        root.type = 'scythe';
        return { root, scytheGroup: scythe, hands };
    }
}

// Reload Animator & Controller
class WeaponController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mats = WeaponBuilder.createMaterials();

        // Weapon Instances (Primary Guns + Secondary Deagle Pistol)
        this.weapons = {
            m4: WeaponBuilder.createM4(this.mats),
            ak47: WeaponBuilder.createAK47(this.mats),
            famas: WeaponBuilder.createFAMAS(this.mats),
            awm: WeaponBuilder.createAWM(this.mats),
            spas12: WeaponBuilder.createSPAS12(this.mats),
            vector: WeaponBuilder.createVector(this.mats),
            deagle: WeaponBuilder.createDeagle(this.mats)
        };

        this.currentWeaponKey = 'm4';
        this.currentWeapon = this.weapons.m4;

        // Container attached to camera for FPV view
        this.fpvContainer = new THREE.Group();
        this.camera.add(this.fpvContainer);

        this.scene.add(this.camera);

        // FPV offsets
        this.restPosition = new THREE.Vector3(0.18, -0.18, -0.38);
        this.adsPosition = new THREE.Vector3(0, -0.13, -0.28);
        this.currentPos = this.restPosition.clone();
        this.targetPos = this.restPosition.clone();

        this.restRotation = new THREE.Euler(0, 0, 0);
        this.adsRotation = new THREE.Euler(0, 0, 0);
        this.currentRot = this.restRotation.clone();

        // Sway / Bobbing
        this.swayX = 0;
        this.swayY = 0;
        this.bobTimer = 0;

        // Recoil Kick
        this.recoilKickZ = 0;
        this.recoilRotX = 0;

        // Reload State Machine
        this.isReloading = false;
        this.reloadProgress = 0;
        this.reloadDuration = 2.4; // 2.4 seconds total detailed animation
        this.reloadStage = '';
        this.stageAudioPlayed = {};

        // Mount initial weapon
        this.switchWeapon('m4');

        // Roblox Rivals Melee Scythe
        this.scythe = WeaponBuilder.createScythe(this.mats);
        this.fpvContainer.add(this.scythe.root);
        this.scythe.root.visible = false;

        this.isSlashingScythe = false;
        this.scytheSlashProgress = 0;
        this.scytheSlashDuration = 0.35; // Fast, responsive melee
        this.scytheHitDispatched = false;
        this.onScytheSlashHit = null;

        // Visual Slash Arc Mesh (crescent blade swing trail)
        const arcGeo = new THREE.RingGeometry(0.35, 0.75, 32, 1, 0, Math.PI * 0.85);
        this.slashArcMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.slashArc = new THREE.Mesh(arcGeo, this.slashArcMat);
        this.slashArc.position.set(0, 0, -0.45);
        this.slashArc.rotation.set(-0.25, 0.2, -0.4);
        this.fpvContainer.add(this.slashArc);
    }

    performScytheSlash(onHitCallback) {
        this.isSlashingScythe = true;
        this.scytheSlashProgress = 0;
        this.scytheHitDispatched = false;
        this.onScytheSlashHit = onHitCallback;

        // Hide current gun during melee swing
        if (this.currentWeapon && this.currentWeapon.root) {
            this.currentWeapon.root.visible = false;
        }

        // Show scythe
        this.scythe.root.visible = true;
        sounds.playScytheSlash();
    }

    switchWeapon(key) {
        if (this.isReloading) return;
        if (!this.weapons[key]) return;

        if (this.currentWeapon) {
            this.fpvContainer.remove(this.currentWeapon.root);
        }

        this.currentWeaponKey = key;
        this.currentWeapon = this.weapons[key];

        // 권총(보조무기) 및 주무기별 조준/휴식 위치 최적화
        if (key === 'deagle') {
            this.restPosition.set(0.14, -0.16, -0.32);
            this.adsPosition.set(0, -0.11, -0.22);
        } else {
            this.restPosition.set(0.18, -0.18, -0.38);
            this.adsPosition.set(0, -0.13, -0.28);
        }

        this.fpvContainer.add(this.currentWeapon.root);
        this.currentWeapon.root.visible = true;
        this.currentWeapon.root.position.copy(this.restPosition);
    }


    startReload(onComplete) {
        if (this.isReloading) return;
        this.isReloading = true;
        this.reloadProgress = 0;
        this.reloadStage = 'un-grip';
        this.stageAudioPlayed = {};
        this.onReloadComplete = onComplete;

        const uiReload = document.getElementById('reload-indicator');
        if (uiReload) uiReload.classList.remove('hidden');
    }

    update(dt, isMoving, isADS, mouseDeltaX, mouseDeltaY) {
        // Handle ADS position & Sniper Scope Overlay switching
        const isSniper = (this.currentWeaponKey === 'awm');
        
        // Scope Overlay UI
        const scopeUI = document.getElementById('sniper-scope');
        const crosshairUI = document.getElementById('crosshair');

        if (isSniper && isADS) {
            if (scopeUI) scopeUI.classList.remove('hidden');
            if (crosshairUI) crosshairUI.classList.add('hidden');
            
            // Hide 3D gun model during sniper scope zoom so 3D scope mesh doesn't block the camera!
            if (this.currentWeapon && this.currentWeapon.root) {
                this.currentWeapon.root.visible = false;
            }

            // Camera FOV zoom to 18 (High-power 8x Sniper Scope Magnification)
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 18, dt * 15);
            this.camera.updateProjectionMatrix();

            this.targetPos = new THREE.Vector3(0, -0.09, -0.15);
        } else {
            if (scopeUI) scopeUI.classList.add('hidden');
            if (crosshairUI && window.gamePlayer && !window.gamePlayer.isDead) crosshairUI.classList.remove('hidden');

            // Make 3D gun model visible again
            if (this.currentWeapon && this.currentWeapon.root) {
                this.currentWeapon.root.visible = true;
            }

            // Restore normal FOV 75
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75, dt * 15);
            this.camera.updateProjectionMatrix();

            this.targetPos = isADS ? this.adsPosition.clone() : this.restPosition.clone();
        }
        this.currentPos.lerp(this.targetPos, dt * 14);



        // Weapon Sway calculation
        this.swayX = THREE.MathUtils.lerp(this.swayX, -mouseDeltaX * 0.0008, dt * 10);
        this.swayY = THREE.MathUtils.lerp(this.swayY, -mouseDeltaY * 0.0008, dt * 10);

        // Walking Bobbing
        if (isMoving) {
            this.bobTimer += dt * 10;
        } else {
            this.bobTimer += dt * 2;
        }
        const bobX = Math.sin(this.bobTimer) * (isMoving ? 0.008 : 0.002);
        const bobY = Math.cos(this.bobTimer * 2) * (isMoving ? 0.008 : 0.002);

        // Recoil decay
        this.recoilKickZ = THREE.MathUtils.lerp(this.recoilKickZ, 0, dt * 15);
        this.recoilRotX = THREE.MathUtils.lerp(this.recoilRotX, 0, dt * 15);

        // Apply final FPV Gun transform
        const gunRoot = this.currentWeapon.root;
        gunRoot.position.x = this.currentPos.x + this.swayX + bobX;
        gunRoot.position.y = this.currentPos.y + this.swayY + bobY;
        gunRoot.position.z = this.currentPos.z + this.recoilKickZ;

        gunRoot.rotation.x = this.recoilRotX + (this.swayY * 0.5);
        gunRoot.rotation.y = this.swayX * 0.5;
        gunRoot.rotation.z = 0;

        // 🌪️ 스핀봇 360도 총기 난동 회전 (Y 키)
        if (window.hackSystem?.spinBotEnabled) {
            window.hackSystem.applyGunSpin(gunRoot, dt);
        }

        // Perform Reload Animation if reloading
        if (this.isReloading) {
            this.animateReload(dt);
        }

        // Perform Scythe Melee Slash Animation
        if (this.isSlashingScythe) {
            this.scytheSlashProgress += dt / this.scytheSlashDuration;
            const p = Math.min(1.0, this.scytheSlashProgress);

            const sg = this.scythe.scytheGroup;
            if (p < 0.25) {
                // Stage 1: Wind-up (raise back and right)
                const t = p / 0.25;
                sg.position.set(
                    THREE.MathUtils.lerp(0.18, 0.28, t),
                    THREE.MathUtils.lerp(-0.16, 0.14, t),
                    THREE.MathUtils.lerp(-0.32, -0.22, t)
                );
                sg.rotation.set(
                    THREE.MathUtils.lerp(-0.4, -0.75, t),
                    THREE.MathUtils.lerp(0.35, 0.9, t),
                    THREE.MathUtils.lerp(-0.3, -0.8, t)
                );
            } else if (p < 0.68) {
                // Stage 2: Violent Slash Across Screen (down and left)
                const t = (p - 0.25) / 0.43;
                sg.position.set(
                    THREE.MathUtils.lerp(0.28, -0.24, t),
                    THREE.MathUtils.lerp(0.14, -0.3, t),
                    THREE.MathUtils.lerp(-0.22, -0.4, t)
                );
                sg.rotation.set(
                    THREE.MathUtils.lerp(-0.75, 0.4, t),
                    THREE.MathUtils.lerp(0.9, -0.95, t),
                    THREE.MathUtils.lerp(-0.8, 0.8, t)
                );

                // Blade impact point & slash arc effect
                if (t >= 0.2 && !this.scytheHitDispatched) {
                    this.scytheHitDispatched = true;
                    if (this.onScytheSlashHit) this.onScytheSlashHit();
                    this.slashArcMat.opacity = 0.95;
                    this.slashArc.rotation.z = -0.4 + (Math.random() - 0.5) * 0.3;
                }
            } else {
                // Stage 3: Recovery / lower
                const t = (p - 0.68) / 0.32;
                sg.position.set(
                    THREE.MathUtils.lerp(-0.24, 0.18, t),
                    THREE.MathUtils.lerp(-0.3, -0.48, t),
                    THREE.MathUtils.lerp(-0.4, -0.32, t)
                );
                sg.rotation.set(
                    THREE.MathUtils.lerp(0.4, -0.4, t),
                    THREE.MathUtils.lerp(-0.95, 0.35, t),
                    THREE.MathUtils.lerp(0.8, -0.3, t)
                );
            }

            // Fade slash arc
            this.slashArcMat.opacity = Math.max(0, this.slashArcMat.opacity - dt * 5.5);

            if (p >= 1.0) {
                this.isSlashingScythe = false;
                this.scythe.root.visible = false;
                this.slashArcMat.opacity = 0;
                if (this.currentWeapon && this.currentWeapon.root && !(this.currentWeaponKey === 'awm' && isADS)) {
                    this.currentWeapon.root.visible = true;
                }
            }
        }
    }

    applyRecoil(gunKey = this.currentWeaponKey) {
        if (gunKey === 'awm') {
            this.recoilKickZ = 0.38;
            this.recoilRotX = 0.45;
        } else if (gunKey === 'spas12') {
            this.recoilKickZ = 0.28;
            this.recoilRotX = 0.32;
        } else if (gunKey === 'ak47') {
            this.recoilKickZ = 0.18;
            this.recoilRotX = 0.22;
        } else if (gunKey === 'm4') {
            this.recoilKickZ = 0.12;
            this.recoilRotX = 0.14;
        } else if (gunKey === 'famas') {
            this.recoilKickZ = 0.09;
            this.recoilRotX = 0.10;
        } else { // vector
            this.recoilKickZ = 0.07;
            this.recoilRotX = 0.08;
        }
    }


    // Detailed 5-Stage Procedural Reload Keyframe Engine
    animateReload(dt) {
        this.reloadProgress += dt / this.reloadDuration;
        const progress = Math.min(1.0, this.reloadProgress);
        const p = progress;

        const w = this.currentWeapon;
        const body = w.body;
        const mag = w.magazine;
        const bolt = w.bolt;
        const lHand = w.hands.leftHand;
        const defHandPos = w.defaultLeftHandPos;
        const defMagPos = w.defaultMagPos;

        // UI Updates
        const fillBar = document.getElementById('reload-bar-fill');
        const stageTxt = document.getElementById('reload-stage');
        if (fillBar) fillBar.style.width = `${progress * 100}%`;

        // STAGE 1 (0.0 to 0.25): Gun Tilts / Lowering & Left Hand moves towards magazine
        if (p < 0.25) {
            const t = p / 0.25;
            body.rotation.z = THREE.MathUtils.lerp(0, 0.4, t); // Tilt sideways
            body.rotation.x = THREE.MathUtils.lerp(0, -0.3, t); // Lower barrel
            lHand.position.lerpVectors(defHandPos, new THREE.Vector3(defMagPos.x - 0.02, defMagPos.y - 0.1, defMagPos.z), t);

            if (!this.stageAudioPlayed['mag_out'] && p > 0.15) {
                sounds.playReloadStage('mag_out');
                this.stageAudioPlayed['mag_out'] = true;
            }
            if (stageTxt) stageTxt.innerText = "탄창 해제 및 분리 중...";
        }
        // STAGE 2 (0.25 to 0.5): Magazine Detaches and Slides Down out of frame
        else if (p < 0.5) {
            const t = (p - 0.25) / 0.25;
            mag.position.y = defMagPos.y - THREE.MathUtils.lerp(0, 0.3, t);
            mag.rotation.z = THREE.MathUtils.lerp(0, -0.4, t);
            lHand.position.y = defMagPos.y - THREE.MathUtils.lerp(0, 0.3, t);

            if (stageTxt) stageTxt.innerText = "새 탄창 꺼내는 중...";
        }
        // STAGE 3 (0.5 to 0.75): New Mag raised and firmly snapped into place!
        else if (p < 0.75) {
            const t = (p - 0.5) / 0.25;
            mag.position.y = THREE.MathUtils.lerp(defMagPos.y - 0.3, defMagPos.y, t);
            mag.rotation.z = THREE.MathUtils.lerp(-0.4, 0, t);
            lHand.position.y = THREE.MathUtils.lerp(defMagPos.y - 0.3, defMagPos.y, t);

            if (!this.stageAudioPlayed['mag_in'] && t > 0.7) {
                sounds.playReloadStage('mag_in');
                this.stageAudioPlayed['mag_in'] = true;
            }
            if (stageTxt) stageTxt.innerText = "새 탄창 결합 완료!";
        }
        // STAGE 4 (0.75 to 0.9): Cocking / Racking Charging Handle or Bolt!
        else if (p < 0.9) {
            const t = (p - 0.75) / 0.15;
            // Pull bolt back then release
            const boltOffset = Math.sin(t * Math.PI) * 0.08;
            bolt.position.z = (w.type === 'ak47' ? -0.04 : 0.12) + boltOffset;
            lHand.position.set(defMagPos.x, defMagPos.y + 0.05, defMagPos.z + boltOffset);

            if (!this.stageAudioPlayed['bolt_pull'] && t > 0.2) {
                sounds.playReloadStage('bolt_pull');
                this.stageAudioPlayed['bolt_pull'] = true;
            }
            if (stageTxt) stageTxt.innerText = "장전 손잡이 후퇴 고정...";
        }
        // STAGE 5 (0.9 to 1.0): Return gun & hands to default FPV position
        else {
            const t = (p - 0.9) / 0.1;
            body.rotation.z = THREE.MathUtils.lerp(0.4, 0, t);
            body.rotation.x = THREE.MathUtils.lerp(-0.3, 0, t);
            mag.position.copy(defMagPos);
            mag.rotation.set(0, 0, 0);
            lHand.position.lerpVectors(lHand.position.clone(), defHandPos, t);
            bolt.position.z = w.type === 'ak47' ? -0.04 : 0.12;

            if (stageTxt) stageTxt.innerText = "준비 완료!";
        }

        // Finish Reloading
        if (progress >= 1.0) {
            this.isReloading = false;
            body.rotation.set(0, 0, 0);
            mag.position.copy(defMagPos);
            lHand.position.copy(defHandPos);

            const uiReload = document.getElementById('reload-indicator');
            if (uiReload) uiReload.classList.add('hidden');

            if (this.onReloadComplete) this.onReloadComplete();
        }
    }
}

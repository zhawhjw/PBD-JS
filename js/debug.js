import * as THREE from 'three';
import * as PHY from 'simplePhysics';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import Stats from 'three/addons/libs/stats.module.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as F from "fontConfig"

// import {agentConfig} from "./positions";

// console.log(A.agentConfig());

class Tile {

    constructor( r, c, x, y, z, cost = 1) {

        this.x = x;
        this.y = y;
        this.z = z;

        this.r = r;
        this.c = c;

        this.cost = cost;

        this.g = cost;
        this.h = 0;
        this.f = 0;

        this.parent = null;

    }
}

let m;

let renderer, scene, camera;
let world = {
    x: 140,
    z: 140
};
let agentData = [];
let wallData = [];
// for ray to detect
let pickableObjects = [];
let pickableTiles = [];
let pickableWalkingTiles = [];
let pickableWall = [];
let texts = [];
let ftexts = [];

let arrows = [];
let g_arrows = [];
let lines = [];


let tiles = [];

let selected = null;
let selectedObject = null;

let mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let grid, ring;
let rows, columns;
let spotLights = {};
let topTexture;
const RADIUS = 1;
const WORLDUNIT = 1;
const blueAgentMaterial = new THREE.MeshLambertMaterial({
    color: 0x0000ff
});
const redAgentMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000
});

const stats = new Stats();
document.body.appendChild(stats.dom)

const tile = {
    w:WORLDUNIT * 2,
    h:WORLDUNIT * 2
}


let obstacles = [
    [20, 0],
    [20, 1],
    [20, 2],
    [20, 3],
    [20, 4],
    [20, 5],
    [20, 6],
    [20, 7],
    [20, 8],
    [20, 9],
    [20, 10],
    [20, 11],
    [20, 12],
    [20, 13],
    [20, 14],
    [20, 15],
    [20, 16],
    [20, 17],
    [20, 18],
    [20, 19],
    // [20, 20],

    // [20, 22],
    [20, 23],
    [20, 24],
    [20, 25],
    [20, 26],
    [20, 27],
    [20, 28],
    [20, 29],
    [20, 30],
    [20, 31],
    [20, 32],
    [20, 33],
    [20, 34],
    [20, 35],
    [20, 36],
    [20, 37],
    [20, 38],
    [20, 39],
    [20, 40],
    [20, 41],
    [20, 42],
    [20, 43],
    [20, 44],
    [20, 45],
    [20, 46],
    [20, 47],
    [20, 48],
    [20, 49],


]



function checkContainsTuple(base, checked){
    return base.some((arr) =>
        arr.every((val, i) => val === checked[i])
    );
}



function AStar(ts, start, end) {
    const openSet = [start];
    const closedSet = [];

    while (openSet.length > 0) {
        let current = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < current.f) {
                current = openSet[i];
            }
        }

        if (current.r === end.r && current.c === end.c) {
            let path = [];
            let temp = current;
            while (temp !== null) {
                path.push(temp);
                temp = temp.parent;
            }

            // path.forEach(function (p){
            //     p.parent = null;
            // })

            path = path.reverse();

            let smoothedPath = [];
            let pointer = 0;
            let checkTile = path[0];
            let currentTile = path[pointer];

            // push the start tile
            smoothedPath.push(checkTile);

            while (pointer < path.length){

                if(pointer === 0){
                    pointer++;
                    continue;
                }

                if (!Walkable(checkTile, currentTile)){
                    smoothedPath.push(path[pointer-1]);
                    checkTile = path[pointer-1];

                }
                pointer++;
                currentTile = path[pointer];
            }
            // push the destination tile
            smoothedPath.push(path[pointer-1]);


            let [smoothedPathV2, smoothIndices] = samplePointsBetweenPoints(smoothedPath, 5);





            return [smoothedPath, smoothedPathV2, smoothIndices];
        }

        // place picked tile from unvisited set to visited set
        const index = openSet.indexOf(current);
        openSet.splice(index, 1);
        closedSet.push(current);

        const neighbors = [];
        const x = current.r;
        const y = current.c;

        if (ts[x - 1] && ts[x - 1][y].cost < 10) {
            neighbors.push(ts[x - 1][y]);
        }
        if (ts[x + 1] && ts[x + 1][y].cost < 10) {
            neighbors.push(ts[x + 1][y]);
        }
        if (ts[x][y - 1] && ts[x][y - 1].cost < 10) {
            neighbors.push(ts[x][y - 1]);
        }
        if (ts[x][y + 1] && ts[x][y + 1].cost < 10) {
            neighbors.push(ts[x][y + 1]);
        }

        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];

            if (closedSet.includes(neighbor)) {
                continue;
            }

            const tempG = current.g + neighbor.g;

            let newPath = false;
            if (openSet.includes(neighbor)) {
                if (tempG < neighbor.g) {
                    neighbor.g = tempG;
                    newPath = true;
                }
            } else {
                neighbor.g = tempG;
                newPath = true;
                openSet.push(neighbor);
            }

            if (newPath) {
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;
            }
        }
    }

    return null;
}



function Walkable(startTile, endTile){
    // const raycaster = new THREE.Raycaster();
    // const origin = new THREE.Vector3(startTile.x, startTile.y, startTile.z);
    // const destination = new THREE.Vector3(endTile.x, endTile.y, endTile.z);
    //
    // raycaster.set(origin, destination.clone().sub(origin).normalize());
    //
    // const intersects = raycaster.intersectObjects(pickableWall, false);
    //
    // return intersects.length <= 0;
    // const boxSize = new THREE.Vector3(RADIUS*2, RADIUS*2, RADIUS*2);
    const ray = new THREE.Raycaster();



    // Starting and ending coordinates of the ray
    const startCoord = new THREE.Vector3(startTile.x, startTile.y, startTile.z);
    const endCoord = new THREE.Vector3(endTile.x, endTile.y, endTile.z);

    const distance = startCoord.distanceTo(endCoord); // Maximum distance to check

    // const range = new THREE.Box3().setFromCenterAndSize(startCoord, boxSize);
    // Set the ray's position to the starting coordinate

    ray.set(startCoord, endCoord.clone().sub(startCoord).normalize());



    // Check for intersection with objects in the scene
    const intersects = ray.intersectObjects(pickableWall, false);

    // Filter the intersections to only include objects between the two coordinates
    const filteredIntersects = intersects.filter((intersection) => {
        return intersection.distance <= distance && intersection.distance > 0

    });

    if (filteredIntersects.length > 0) {
        // Objects exist between the two coordinates
        // console.log('Objects exist between the two coordinates');
        return false;
    } else {
        // No objects exist between the two coordinates
        // console.log('No objects exist between the two coordinates');
        return true;
    }

}

function heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function createPBDMatrix(){
    // should be called after init()
    m = new Array(agentData.length);
    for (let i =0; i<m.length;i++){
        m[i] = new Array(agentData.length);
    }

    for (let i = 0; i<m.length;i++){
        for (let j = 0; j<m[0].length;j++){
            m[i][j] = false;
        }
    }


}


function cut(){
    let world_width = world.x;
    let world_height = world.z;

    let tile_width = tile.w;
    let tile_height = tile.h;

    let Rs =   Math.floor(world_width / tile_width);
    let Cs = Math.floor(world_height / tile_height);

    if (world_width % tile_height !== 0){
        Rs += 1;
    }

    if (world_height % tile_height !== 0){
        Cs += 1;
    }

    return [Rs, Cs];
}

function gridization(){

    [rows, columns] = cut();


    const start_point = {
        x: 0 - world.x / 2,
        y: 0,
        z: 0 - world.z / 2,
    };


    const basicCost = 1;
    const obstacleCost = 10;
    for (let i = 0; i < rows; i++) {
        tiles[i] = [];



        for (let j = 0; j < columns; j++) {

            const object_position = {
                x: start_point.x + WORLDUNIT + i * tile.w,
                y: 1,
                z: start_point.z + WORLDUNIT + j * tile.h,
            };

            let cost;
            if (checkContainsTuple(obstacles, [i, j])){
                cost = obstacleCost;
            }else {
                cost = basicCost;

            }

            tiles[i][j] = new Tile(i, j, object_position.x, object_position.y, object_position.z, cost);
        }
    }

    console.log(tiles);

    for (let i = 0; i< rows;i++){
        for (let j = 0; j<columns;j++){
            // Create a box geometry and a mesh material


            let t = tiles[i][j];

            const geometry = new THREE.BoxGeometry(tile.w, WORLDUNIT * 2, tile.h);

            let material;
            if (t.cost >= 10){
                material = new THREE.MeshStandardMaterial({
                    transparent: true,
                    opacity: 1.0,
                    color: 0x333333 // set a color to disable the transparent effect
                });


            }else {
                material = new THREE.MeshStandardMaterial({
                    transparent: true,
                    opacity: 0.0,
                    color: 0x00ff00 // set a color to see the transparent effect
                });
            }





            // Create a mesh by combining the geometry and the material
            const cube = new THREE.Mesh(geometry, material);

            // Set the mesh's name and userData properties
            cube.name = "MyCube_" + i + "_" + j;
            cube.userData = {
                type: "box",
                x: t.x,
                y: t.y,
                z: t.z,
                r: t.r,
                c: t.c,
            };
            cube.position.set(t.x, t.y, t.z);


            if(t.cost >= 10){
                pickableWall.push(cube);
                wallData.push(cube.userData);

            }else {
                pickableWalkingTiles.push(cube);
            }


            pickableTiles.push(cube);

            // Add the mesh to the scene
            scene.add(cube);

        }

    }

}




function init() {
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; //
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);



    // scene
    scene = new THREE.Scene();
    // camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

    camera.position.set(-67.26, 54.07, -3.77);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -1.6267;
    camera.rotation.x = -0.46;

    // controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;

    // light
    const light = new THREE.PointLight(0xffffff, 0.9, 0, 100000);
    light.position.set(0, 50, 120);
    light.castShadow = true;
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 5000; // default

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.castShadow = true;
    directionalLight.position.set(-5, 20, 4);
    directionalLight.target.position.set(9, 0, -9);
    directionalLight.shadow.camera.left *= 9;
    directionalLight.shadow.camera.right *= 9;
    directionalLight.shadow.camera.top *= 9;
    directionalLight.shadow.camera.bottom *= 9;

    scene.add(directionalLight);

    // axes
    scene.add(new THREE.AxesHelper(40));
    const loader = new THREE.TextureLoader();
    const texture = loader.load('resources/OIP.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = 40 / 32;
    texture.repeat.set(repeats, repeats);


    topTexture = loader.load('resources/triangle2.png');
    //topTexture.wrapS = THREE.RepeatWrapping;
    //topTexture.wrapT = THREE.RepeatWrapping;
    topTexture.magFilter = THREE.NearestFilter;
    topTexture.repeat.set(3, 3);
    //topTexture.rotation = -Math.PI / 2;
    // grid
    const geometry = new THREE.PlaneGeometry(world.x, world.z, 10, 10);
    //const geometry = new THREE.PlaneGeometry(80, 80, 1, 1);

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        //side: THREE.DoubleSide,
    });
    grid = new THREE.Mesh(geometry, material);
    grid.castShadow = true; //default is false
    grid.receiveShadow = true; //default
    grid.rotation.order = 'YXZ';
    grid.rotation.y = -Math.PI / 2;
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    const ringGeometry = new THREE.RingGeometry(1, 3, 12);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide
    });
    ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y += 0.01;

    function getRandomFloat(min, max, decimals) {
        const str = (Math.random() * (max - min) + min).toFixed(decimals);

        return parseFloat(str);
    }

    function removeArrayFrom2DArray(A, specificArray) {
        for (let i = 0; i < A.length; i++) {
            if (A[i][0] === specificArray[0] && A[i][1] === specificArray[1]) {
                A.splice(i, 1);
                break;
            }
        }
        return A;
    }


    function addColumnAgentGroup(agentData, numAgents, spacing,
                                 startPos, goalPos,
                                 velocityMagnitude, direction) {
        let i = 0;
        let initalIdx = agentData.length;
        let dx = 0,
            dz = 0,
            vx = 0,
            vz = 0;
        let distanceToGoal = PHY.distance(startPos.x, startPos.z,
            goalPos.x, goalPos.z);
        vx = velocityMagnitude * (goalPos.x - startPos.x) / distanceToGoal;
        vz = velocityMagnitude * (goalPos.z - startPos.z) / distanceToGoal;

        if (direction === "X") {
            dx = spacing;
        } else if (direction === "Z") {
            dz = spacing;
        }
        while (i < numAgents) {
            agentData.push({
                index: i + initalIdx,
                x: startPos.x + dx * i,
                y: 2.0,
                z: startPos.z + dz * i,
                goal_x: goalPos.x + dx * i,
                goal_y: 0.0,
                goal_z: goalPos.z + dz * i,
                vx: vx,
                vy: 0.0,
                vz: vz,
                v_pref: velocityMagnitude,
                radius: RADIUS,
                invmass: 0.5,
                group_id: 1,

                path : null,
                path_index: 0,
                exit: null,
                exit_current: null,
                exit_index: 1,

                simEnd:null,

                correction: false,
                move: true,
                waitAgent:null,
                density: 1,

                modifier:1,

                vm: Math.sqrt(vx * vx + vz * vz),

                variance: getRandomFloat(1.5, 3.5, 1),
                // getRandomFloat(1.5, 1.5, 1)
                interrupt: false,
                backupPath: null,
                backup: []


            });
            i += 1;
        }
    }

    function addOneAgents(agentData, id,
                          startPos, goalPos,
                          velocityMagnitude) {

        let vx = 0,
            vz = 0;
        let distanceToGoal = PHY.distance(startPos.x, startPos.z,
            goalPos.x, goalPos.z);
        vx = velocityMagnitude * (goalPos.x - startPos.x) / distanceToGoal;
        vz = velocityMagnitude * (goalPos.z - startPos.z) / distanceToGoal;


        agentData.push({
            index: id,
            x: startPos.x,
            y: 2.0,
            z: startPos.z,
            goal_x: goalPos.x,
            goal_y: 0.0,
            goal_z: goalPos.z,
            vx: vx,
            vy: 0.0,
            vz: vz,
            v_pref: velocityMagnitude,
            radius: RADIUS,
            invmass: 0.5,
            group_id: 1,

            path : null,
            path_index: 0,
            correction: false,
            vm: Math.sqrt(vx * vx + vz * vz),

            variance: getRandomFloat(0.5, 1.5, 1),

            move: true,
        });

    }

    function hallwayAgentConfiguration(){

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 15]);
        }

        // console.log(pieces1);


        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 45]);
        }

        fobs = [...pieces1, ...pieces2];
        // fobs.push([...pieces2]);
        // console.log(fobs);

        obstacles = fobs;

        for (let i = 7;i<25;i++){

            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: 25,
                    z: -50 + i * 2
                }, {
                    x: -35,
                    z: -50 + i * 2
                },
                0.8, "X", );

        }

        for(let i = 20; i< 35;i++){
            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: -55,
                    z: -50 + i * 2
                }, {
                    x: 25,
                    z: -50 + i * 2
                },
                0.8, "X", );
        }


    }

    function singleHallwayAgentConfiguration(){

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 16]);
        }

        // console.log(pieces1);


        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 30]);
        }

        let pieces3 = []
        pieces3.push([20, 15])
        pieces3.push([20, 16])
        pieces3.push([20, 17])
        pieces3.push([20, 18])
        pieces3.push([20, 19])
        pieces3.push([20, 20])
        // pieces3.push([20, 21])
        // pieces3.push([20, 22])
        pieces3.push([20, 23])
        pieces3.push([20, 24])
        pieces3.push([20, 25])
        pieces3.push([20, 26])
        pieces3.push([20, 27])
        pieces3.push([20, 28])
        pieces3.push([20, 29])



        fobs = [...pieces1, ...pieces2, ...pieces3];
        // fobs.push([...pieces2]);
        // console.log(fobs);

        obstacles = fobs;


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 1
            }, {
                x: -35,
                z: 1
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 6
            }, {
                x: -35,
                z: 6
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: -7
            }, {
                x: -35,
                z: -7
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: -12
            }, {
                x: -35,
                z: -12
            },
            0.8, "X", );





        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: -30,
                z: 0
            }, {
                x: 35,
                z: 0
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: -30,
                z: 5
            }, {
                x: 35,
                z: 5
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: -30,
                z: -5
            }, {
                x: 35,
                z: -5
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: -30,
                z: -10
            }, {
                x: 35,
                z: -10
            },
            0.8, "X", );


    }

    function defaultAgentConfiguration(){

        obstacles = [
            [20, 0],
            [20, 1],
            [20, 2],
            [20, 3],
            [20, 4],
            [20, 5],
            [20, 6],
            [20, 7],
            [20, 8],
            [20, 9],
            [20, 10],
            [20, 11],
            [20, 12],
            [20, 13],
            [20, 14],
            [20, 15],
            [20, 16],
            [20, 17],
            [20, 18],
            [20, 19],
            // [20, 20],

            // [20, 22],
            [20, 23],
            [20, 24],
            [20, 25],
            [20, 26],
            [20, 27],
            [20, 28],
            [20, 29],
            [20, 30],
            [20, 31],
            [20, 32],
            [20, 33],
            [20, 34],
            [20, 35],
            [20, 36],
            [20, 37],
            [20, 38],
            [20, 39],
            [20, 40],
            [20, 41],
            [20, 42],
            [20, 43],
            [20, 44],
            [20, 45],
            [20, 46],
            [20, 47],
            [20, 48],
            [20, 49],


        ]



        for (let i = 0;i<20;i++){

        }

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 45
            }, {
                x: -35,
                z: 45
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 40
            }, {
                x: -35,
                z: 40
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 35
            }, {
                x: -35,
                z: 35
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 30
            }, {
                x: -35,
                z: 30
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 30,
                z: 25
            }, {
                x: -35,
                z: 25
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: 20
            }, {
                x: -35,
                z: 20
            },
            0.8, "X", );



        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: 15
            }, {
                x: -35,
                z: 15
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: 10
            }, {
                x: -35,
                z: 10
            },
            0.8, "X", );

        // new agent
        //

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: 5
            }, {
                x: -35,
                z: 5
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: 0
            }, {
                x: -35,
                z: 0
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -5
            }, {
                x: -35,
                z: -5
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -10
            }, {
                x: -35,
                z: -10
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -15
            }, {
                x: -35,
                z: -15
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -20
            }, {
                x: -35,
                z: -20
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -25
            }, {
                x: -35,
                z: -25
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -30
            }, {
                x: -35,
                z: -30
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -35
            }, {
                x: -35,
                z: -35
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -40
            }, {
                x: -35,
                z: -40
            },
            0.8, "X", );




    }

    function debugConfiguration(){

        obstacles = [
            [20, 0],
            [20, 1],
            [20, 2],
            [20, 3],
            [20, 4],
            [20, 5],
            [20, 6],
            [20, 7],
            [20, 8],
            [20, 9],
            [20, 10],
            [20, 11],
            [20, 12],
            [20, 13],
            [20, 14],
            [20, 15],
            [20, 16],
            [20, 17],
            [20, 18],
            [20, 19],
            // [20, 20],

            // [20, 22],
            [20, 23],
            [20, 24],
            [20, 25],
            [20, 26],
            [20, 27],
            [20, 28],
            [20, 29],
            [20, 30],
            [20, 31],
            [20, 32],
            [20, 33],
            [20, 34],
            [20, 35],
            [20, 36],
            [20, 37],
            [20, 38],
            [20, 39],
            [20, 40],
            [20, 41],
            [20, 42],
            [20, 43],
            [20, 44],
            [20, 45],
            [20, 46],
            [20, 47],
            [20, 48],
            [20, 49],


        ]

        addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                x: 25,
                z: -5
            }, {
                x: -35,
                z: -5
            },
            0.8, "X", );


        addColumnAgentGroup(agentData, 1, RADIUS * 4, {
                x: -5,
                z: -8
            }, {
                x: -5,
                z: -8
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 1, RADIUS * 4, {
                x: -5,
                z: -4
            }, {
                x: -5,
                z: -4
            },
            0.8, "X", );


    }

    function lineupConfiguration(){

        [rows, columns] = cut();

        let fobs = []

        // obstacles
        let pieces1 = []
        for (let j =15;j<30;j++){
            for (let i = 0; i<rows;i++){
                pieces1.push([i, j]);
            }
        }

        let counter = 1;
        for (let j = 1; j<50;j+=4){

            for (let i = 16;i<30 - 1;i++){
                pieces1 = removeArrayFrom2DArray(pieces1, [j, i]);
            }

            if (counter % 2 === 0){
                for (let i = 16; i < 16 + 2; i++){
                    pieces1 = removeArrayFrom2DArray(pieces1, [j+2, i]);

                }

            }else {
                for (let i = 27; i < 30 - 1; i++){
                    pieces1 = removeArrayFrom2DArray(pieces1, [j+2, i]);

                }

            }


            counter++;

        }

        counter = 1;
        for (let j = 2; j<50;j+=4){
            for (let i = 16;i<30 - 1;i++){
                pieces1 = removeArrayFrom2DArray(pieces1, [j, i]);
            }

            if (counter % 2 === 0){
                for (let i = 16; i < 16 + 2; i++){
                    pieces1 = removeArrayFrom2DArray(pieces1, [j+2, i]);

                }

            }else {
                for (let i = 27; i < 30 - 1; i++){
                    pieces1 = removeArrayFrom2DArray(pieces1, [j+2, i]);

                }

            }

            counter++;
        }

        pieces1 = removeArrayFrom2DArray(pieces1, [43, 29]);
        pieces1 = removeArrayFrom2DArray(pieces1, [44, 29]);

        fobs = [...pieces1];

        obstacles = fobs;


        for (let i = -46; i< 42; i+=8){
            for (let j = -16;j< 6 + 2; j+=4){
                addColumnAgentGroup(agentData, 1, 0, {
                        x: i,
                        z: j
                    }, {
                        x: i,
                        z: j + 32
                    },
                    0.8, "X", );
            }

        }

        counter = 1;

        for (let i = -42; i< 42; i+=8){

            if (counter % 2 ===0){
                addColumnAgentGroup(agentData, 1, 0, {
                        x: i,
                        z: -16
                    }, {
                        x: i,
                        z: -16 + 32
                    },
                    0.8, "X", );
            }else {
                addColumnAgentGroup(agentData, 1, 0, {
                        x: i,
                        z: 6
                    }, {
                        x: i,
                        z: 6 + 32
                    },
                    0.8, "X", );
            }



            counter++;

        }







    }

    function oneDirHallwayAgentConfiguration(){

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 10]);
        }

        // console.log(pieces1);


        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 40]);
        }

        fobs = [...pieces1, ...pieces2];
        // fobs.push([...pieces2]);
        // console.log(fobs);

        obstacles = fobs;

        // to left
        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 28
            }, {
                x: -45,
                z: 28
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 25
            }, {
                x: -45,
                z: 25
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 22
            }, {
                x: -45,
                z: 22
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 19
            }, {
                x: -45,
                z: 19
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 16
            }, {
                x: -45,
                z: 16
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 13
            }, {
                x: -45,
                z: 13
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 10
            }, {
                x: -45,
                z: 10
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 7
            }, {
                x: -45,
                z: 7
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 4
            }, {
                x: -45,
                z: 4
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: 1
            }, {
                x: -45,
                z: 1
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -2
            }, {
                x: -45,
                z: -2
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -5
            }, {
                x: -45,
                z: -5
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -8
            }, {
                x: -45,
                z: -8
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -11
            }, {
                x: -45,
                z: -11
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -14
            }, {
                x: -45,
                z: -14
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -17
            }, {
                x: -45,
                z: -17
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -20
            }, {
                x: -45,
                z: -20
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -23
            }, {
                x: -45,
                z: -23
            },
            0.8, "X", );

        addColumnAgentGroup(agentData, 6, RADIUS * 4, {
                x: 25,
                z: -26
            }, {
                x: -45,
                z: -26
            },
            0.8, "X", );
    }

    function escapeScenario(){
        obstacles = []

        for (let i =0; i< world.x / 2 ;i++){

            if (i < 30 || i > 40){
                obstacles.push([world.x / 2 / 2 + 6, i])
            }else {
                obstacles.push([world.x / 2 / 2 - 6, i])

            }

        }


        for (let i =0; i<=6; i++){
            obstacles.push([world.x/2/2 + i, 30])
            obstacles.push([world.x/2/2 - i, 30])

            obstacles.push([world.x/2/2 + i, 40])
            obstacles.push([world.x/2/2 - i, 40])
        }

        // obstacles.push([world.x/2/2 + 2, 25])
        // obstacles.push([world.x/2/2 + 3, 25])
        // obstacles.push([world.x/2/2 + 4, 25])
        // obstacles.push([world.x/2/2 + 5, 25])
        // obstacles.push([world.x/2/2 + 6, 25])


        // obstacles.push([world.x/2/2 + 1, 45])
        // obstacles.push([world.x/2/2 + 2, 45])
        // obstacles.push([world.x/2/2 + 3, 45])
        // obstacles.push([world.x/2/2 + 4, 45])
        // obstacles.push([world.x/2/2 + 5, 45])
        // obstacles.push([world.x/2/2 + 6, 45])

        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2]);
        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2 + 1]);
        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2 - 1]);
        console.log([world.x/2/2 - 6, world.x/2/2 + 1]);

        for (let i = 0;i<25;i++){

            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: 25,
                    z: -30 + i * 3
                }, {
                    x: -35,
                    z: -65 + i * 5
                },
                0.8, "X", );


            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: 40,
                    z: -30 + i * 3
                }, {
                    x: -55,
                    z: -65 + i * 5
                },
                0.8, "X", );
        }

        // for (let i = 0;i<50;i++){
        //     if(i<25){
        //         addColumnAgentGroup(agentData, 4, RADIUS * 4, {
        //                 x: 25,
        //                 z: -50 + i * 2
        //             }, {
        //                 x: -35,
        //                 z: -65 + i * 5
        //             },
        //             0.8, "X", );
        //     }else {
        //         addColumnAgentGroup(agentData, 4, RADIUS * 4, {
        //                 x: 25,
        //                 z: -50 + i * 2
        //             }, {
        //                 x: -55,
        //                 z: -65 + (i - 25) * 5
        //             },
        //             0.8, "X", );
        //     }
        // }
    }

    // debugConfiguration();
    hallwayAgentConfiguration();
    // singleHallwayAgentConfiguration();
    // defaultAgentConfiguration();
    // lineupConfiguration();
    // oneDirHallwayAgentConfiguration();
    // escapeScenario();

    function loadFromAgentData(){
        A.agentConfig().forEach(function(item, index){

            addOneAgents(agentData, item.agent_id, {x:item.x, z:item.y}, {x:item.gx, z:item.gy}, 0.8);

        });
    }
    // loadFromAgentData();



    // let i = 0;
    // let deltaSpacing = 3;
    // let startX, startY, goalX, goalY;
    // startX = -25;
    // goalX = -25;
    // startY = -20
    // goalY = 20;
    world.distanceConstraints = [];





    let agentGeom, agentMaterial, agent;
    // let spotLight, spotLightTarget;

    agentData.forEach(function(item, index) {


        agentGeom = new THREE.CylinderGeometry(item.radius, item.radius, 4, 16);
        agentMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });

        agent = new THREE.Mesh(agentGeom, agentMaterial);
        agent.castShadow = true;
        agent.receiveShadow = true;
        agent.userData = {
            "index": item.index,
            "start_tile": null,
            "end_tile": null,
            "tm": null,
            "fm":null
        };



        const fontLoader = new FontLoader();



        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {

            // console.log(FT);
            // Create a TextGeometry with the number and the loaded font
            const textGeometry = new TextGeometry(item.index.toString(), {font: font, size: 0.5, height: 0});
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(item.agent.position.x, item.agent.position.y + 5, item.agent.position.z); // Set the position of the text relative to the cube


            agent.userData.tm = textMesh;
            scene.add(textMesh);
            texts.push(textMesh);

            const followingGeometry = new TextGeometry("-1", {font: font, size: 0.5, height: 0});
            const followingMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
            const followingMesh = new THREE.Mesh(followingGeometry, followingMaterial);
            followingMesh.position.set(item.agent.position.x + 1, item.agent.position.y + 5, item.agent.position.z); // Set the position of the text relative to the cube


            agent.userData.fm = followingMesh;
            scene.add(followingMesh);
            ftexts.push(followingMesh);

        });

        // velocity indicator
        let dir = new THREE.Vector3( 1, 0, 0 );
        let origin = agent.position;
        let length = 5;
        let hex = 0xffff00;

        let arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        // scene.add( arrowHelper );
        arrows.push(arrowHelper);

        // goal indicator
        let g_dir = new THREE.Vector3( 1, 0, 0 );
        let g_origin = agent.position;
        let g_length = 5;
        let g_hex = 0x0000ff;

        let g_arrowHelper = new THREE.ArrowHelper( g_dir, g_origin, g_length, g_hex );
        scene.add( g_arrowHelper );
        g_arrows.push(g_arrowHelper);

        // Define the points for the initial line
        const point1 = new THREE.Vector3(item.x, item.y + 2, item.z)
        // const point2 = object2.position;


        // Create a line geometry using the points
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([point1, point1]);

        // Create a material for the line
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xbaa3f9  });

        // Create the line object and add it to the scene
        // Create the line object and add it to the scene
        const line = new THREE.Line(lineGeometry, lineMaterial);
        lines.push(line);
        scene.add(line);




        scene.add(agent);

        // -----------------
        //adding spotlight code
        if(index ===0){
            // spotLight = new THREE.SpotLight(0xffffff);
            // spotLight.position.set(item.x, item.y + 6, item.z);
            // spotLight.shadow.mapSize.width = 1024;
            // spotLight.shadow.mapSize.height = 1024;
            // spotLight.shadow.camera.near = 500;
            // spotLight.shadow.camera.far = 4000;
            // spotLight.shadow.camera.fov = 30;
            // spotLight.intensity = 0.4;
            // spotLight.angle = Math.PI / 8;
            // spotLightTarget = new THREE.Object3D();
            // scene.add(spotLightTarget);
            // spotLight.target = spotLightTarget;
            // scene.add(spotLight);
            // spotLights[item.index] = spotLight;
        }
        // ----------------
        item.agent = agent;
        pickableObjects.push(agent);

    });
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("mousemove", mouseMove, false);
    window.addEventListener("contextmenu", rightClick, false);
    // renderer.domElement.addEventListener('wheel', onWheel);
    // document.getElementById('download-btn').addEventListener('click', downloadSimData, false);

}


const global_frames = []; // An array to hold the frame data
let global_frame_pointer = 0;

// Handle the button click event
// function downloadSimData() {
//     // const frameNumber = parseInt(document.getElementById('frame').value);
//
//     if (global_frames.length > 0) {
//         // Convert the frames array to JSON
//         const json = JSON.stringify(global_frames);
//
//         // Download the JSON file
//         const link = document.createElement('a');
//         link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
//         link.setAttribute('download', `simulation.json`);
//         link.style.display = 'none';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     }
// }

function samplePointsBetweenPoints(points, m) {
    // Initialize an array to store the sampled points
    const sampledPoints = [];
    const keyIndices = [];

    // Iterate through the array of points
    for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];

        // Extracting x and y coordinates from point1 and point2
        const [x1, y1] = [point1.x, point1.z];
        const [x2, y2] = [point2.x, point2.z];

        let key_index = sampledPoints.push([x1, y1]) - 1;
        keyIndices.push(key_index);


        // Generate m points between point1 and point2
        for (let j = 1; j <= m; j++) {
            // Calculate the x and y coordinates of the sampled point
            const x = x1 + ((x2 - x1) * j) / (m + 1);
            const y = y1 + ((y2 - y1) * j) / (m + 1);

            // Add the sampled point to the array
            sampledPoints.push([x, y]);
        }
    }

    const endPoint = points[points.length-1];
    const [ex1, ey1] = [endPoint.x, endPoint.z];
    sampledPoints.push([ex1, ey1]);
    keyIndices.push(sampledPoints.length-1);

    // Return the array of sampled points
    return [sampledPoints, keyIndices];
}




function convertWorld2Grid(world_position){


    let nth_row = Math.ceil(world_position.x / tile.h);
    let nth_column = Math.ceil(world_position.z / tile.w);

    if (nth_row === 0){
        nth_row = 1;
    }

    if (nth_column === 0){
        nth_column = 1;
    }

    let r = nth_row - 1;
    let c = nth_column - 1;



    return [r,c]
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}



function mouseMove(event) {
    event.preventDefault();
    if (event.code === 'Enter') {
        var mouseX = event.clientX;
        var mouseY = event.clientY;
        // console.log('Mouse position:', mouseX, mouseY);
    }


}



function deepCloneArray(array) {
    return Array.from(Object.create(array));
}

function performAStar(){
    for (let i =0; i<agentData.length;i++){

        selected = i;


        const a = agentData[selected]

        selectedObject = pickableObjects[selected]



        for (let i = 0; i< rows;i++) {
            for (let j = 0; j < columns; j++) {
                // Create a box geometry and a mesh material

                tiles[i][j].g = tiles[i][j].cost;
                tiles[i][j].h = 0;
                tiles[i][j].f = 0;
                tiles[i][j].parent = null;
            }
        }


        let actual_position = {
            x: agentData[selected].x + world.x / 2,
            y: agentData[selected].y,
            z: agentData[selected].z + world.z / 2,

        }

        let [r, c] = convertWorld2Grid(actual_position);



        const index = r * rows + c;

        const t1 = pickableTiles[index];

        let current_t = tiles[t1.userData.r][t1.userData.c];

        // console.log(current_t);
        selectedObject.userData.start_tile = current_t;

        let goal_actual_position = {
            x: a.goal_x + world.x / 2,
            y: a.goal_y,
            z: a.goal_z + world.z / 2,

        }

        let [er, ec] = convertWorld2Grid(goal_actual_position);

        selectedObject.userData.end_tile = tiles[er][ec];



        const [path, smoothPath, smoothIndices] = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile);

        // let copy_path = deepCloneArray(path);

        path.forEach(function (G, index) {
            pickableTiles[G.r * world.x / tile.w + G.c].material.opacity = 0.5;
            // if (index === 0 || index === path.length-1 ){
            //
            // }
        });

        // console.log(copy_path);

        let firstKeyIndex = smoothIndices.shift();

        agentData[selected].path = smoothPath;
        agentData[selected].path_index = 0;

        agentData[selected].exit = smoothIndices;
        agentData[selected].key_index = firstKeyIndex;

        agentData[selected].simEnd = false;
    }
}

function rightClick(event) {

    event.preventDefault();
    performAStar();


}

function mouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);




    selected = null;
    var intersects = raycaster.intersectObjects(pickableObjects, false);
    for (var i = 0; i < intersects.length; i++) {
        /* TODO finish this part as
         */
        selectedObject = intersects[i].object;
        selected = selectedObject.userData.index;
        console.log(agentData[selected]);

        // if (agentData[selected].interrupt){
        //     agentData[selected].goal_x = agentData[selected].backup[0];
        //     agentData[selected].goal_z = agentData[selected].backup[1];
        //     agentData[selected].path_index = agentData[selected].backup[2];
        //     // agentData[selected].simEnd = agentData[selected].backup[3];
        //     agentData[selected].path = agentData[selected].backupPath;
        //     agentData[selected].interrupt = false;
        //
        // }else {
        //     agentData[selected].backup[0] = agentData[selected].goal_x;
        //     agentData[selected].backup[1] = agentData[selected].goal_z;
        //     agentData[selected].backup[2] = agentData[selected].path_index;
        //     agentData[selected].backup[3] = agentData[selected].simEnd;
        //     agentData[selected].backupPath = agentData[selected].path;
        //
        //     agentData[selected].goal_x = agentData[selected].x;
        //     agentData[selected].goal_z = agentData[selected].z;
        //     agentData[selected].path = null;
        //     // agentData[selected].simEnd = true;
        //     agentData[selected].interrupt = true;
        // }



        break;
    }
}


const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");

const zoomInFunction = (e) => {
    const fov = getFov();
    camera.fov = clickZoom(fov, "zoomIn");
    camera.updateProjectionMatrix();
};

zoomInButton.addEventListener("click", zoomInFunction);

const zoomOutFunction = (e) => {
    const fov = getFov();
    camera.fov = clickZoom(fov, "zoomOut");
    camera.updateProjectionMatrix();
};

zoomOutButton.addEventListener("click", zoomOutFunction);

const clickZoom = (value, zoomType) => {
    if (value >= 20 && zoomType === "zoomIn") {
        return value - 5;
    } else if (value <= 75 && zoomType === "zoomOut") {
        return value + 5;
    } else {
        return value;
    }
};

const getFov = () => {
    return Math.floor(
        (2 *
            Math.atan(camera.getFilmHeight() / 2 / camera.getFocalLength()) *
            180) /
        Math.PI
    );
};

function getUnitVector(vector){
    // Define the 2D vector
    // const vector = { x: 3, y: 4 }; // Example vector

    // Calculate the magnitude (length) of the vector
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

    // Calculate the unit vector
    const unitVector = {
        x: vector.x / magnitude,
        y: vector.y / magnitude
    };

    return unitVector;
}

function setMeshColor(mesh, value) {
    // Calculate the color value between red and blue
    const r = Math.round(value * 255);
    const g = Math.round((1 - value) * 255);

    // Create a new color with the calculated RGB values
    const color = new THREE.Color(`rgb(${r}, ${g}, 0)`);

    // Set the color of the mesh
    mesh.material.color = color;
}



function render() {
    renderer.render(scene, camera);
}


function normalize(min, max, value) {
    if (value < min) {
        return 0;
    }
    else if (value > max) {
        return 1;
    }
    else {
        return (value - min) / (max - min);
    }
}

function animate() {
    requestAnimationFrame(animate);
    PHY.step(RADIUS, agentData, pickableWall, world, WORLDUNIT);
    // const frameNumber = parseInt(document.getElementById('frame').value);

    let baseFlag = true;
    agentData.forEach(function (agent, index){

        if (agent.simEnd === null){
            baseFlag = baseFlag && false;
            return null;
        }

        baseFlag = baseFlag && agent.simEnd;
    })



    agentData.forEach(function(member, index) {
        member.agent.position.x = member.x;
        member.agent.position.y = member.y;
        member.agent.position.z = member.z;
        // member.agent.material = redAgentMaterial;

        setMeshColor(member.agent, normalize(0, member.v_pref, member.vm));

        if (texts.length>0){
            texts[index].position.x = member.x;
            texts[index].position.y = member.y + 5;
            texts[index].position.z = member.z;
        }


        if (lines.length>0){

            const selfPosition = new THREE.Vector3(member.x, member.y + 2, member.z);
            // const selfPosition2 = new THREE.Vector3(member.x, member.y + 10, member.z);


            if (member.waitAgent){
                const followedPosition = new THREE.Vector3(member.waitAgent.x, member.waitAgent.y + 2, member.waitAgent.z);

                // Update the points of the line's geometry to match the objects' positions
                lines[index].geometry.setFromPoints([selfPosition, followedPosition]);
            }else {
                lines[index].geometry.setFromPoints([selfPosition, selfPosition]);
            }

            // Let Three.js know that the geometry has changed and needs to be re-rendered
            lines[index].geometry.verticesNeedUpdate = true;
        }


        if (ftexts.length>0){
            if (member.waitAgent){
                ftexts[index].geometry.parameters.text = member.waitAgent.index;
            }else {
                ftexts[index].geometry.parameters.text = "-5";
            }
            ftexts[index].geometry.computeBoundingBox();          // recompute the bounding box
            // ftexts[index].geometry.center();

            ftexts[index].position.x = member.x + 1;
            ftexts[index].position.y = member.y + 5;
            ftexts[index].position.z = member.z;
        }

        if (arrows.length>0){

            // let newSourcePos = member.agent.position;
            // let newTargetPos = new THREE.Vector3(member.x, member.y, member.z);

            arrows[index].position.x = member.x;
            arrows[index].position.y = member.y;
            arrows[index].position.z = member.z;


            // arrows[index].position.set(newSourcePos);
            // let direction = new THREE.Vector3().sub(newTargetPos, newSourcePos);
            let direction = new THREE.Vector3(member.vx, 0, member.vz);
            arrows[index].setDirection(direction.normalize());
            arrows[index].setLength(direction.length()*5);
        }

        if (g_arrows.length>0){

            // let newSourcePos = member.agent.position;
            // let newTargetPos = new THREE.Vector3(member.x, member.y, member.z);

            g_arrows[index].position.x = member.x;
            g_arrows[index].position.y = member.y;
            g_arrows[index].position.z = member.z;

            if(member.exit === null || member.path === null){
                return;
            }
            // // console.log(member.exit);

            let keypoint = member.path[member.key_index];
            // console.log(keypoint);
            let direction = new THREE.Vector3(keypoint[0] - member.x, 0, keypoint[1] - member.z);
            g_arrows[index].setDirection(direction.normalize());
            g_arrows[index].setLength(direction.length()*8);
        }


        // if (selected != null && member.index === selected) {
        //     member.agent.material = blueAgentMaterial;
        // }
        /* TODO finish this part for spotlight agents


         */
    });
    renderer.render(scene, camera);
    stats.update()


};


init();
createPBDMatrix();
gridization();
render();
animate();
performAStar();
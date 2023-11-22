import * as THREE from 'three';
import * as PHY from 'simplePhysics';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {makeFlowField} from "./flowField.js";

// console.log(makeFlowField());
let INTERSECTED;
let INTERSECTED_FOLLOWED;

const pointer = new THREE.Vector2();
let isPlay = true;

class Tile {

    constructor( r, c, x, y, z, cost = 1, weight = 0) {

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

        this.weight = weight
        this.FFNeighbors = []
        this.FFMoreNeighbors = []
        this.vec = {x:0, z:0}

        this.density = 0;
    }
}

class VecTile {

    constructor( r, c, x, z, upperLeft, upperRight, bottomLeft, bottomRight, vec = [0, 0], weight = 0) {

        this.upperLeft = upperLeft;
        this.upperRight = upperRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;

        this.x = x;
        this.z = z;

        this.r = r;
        this.c = c;


        this.neighbors = []
        this.vec = {x:vec[0], z:vec[1]}
    }
}

let m;
let customDict = {
    stop:false,
    globalTimestamp:0,
    globalCounter:0
};
let renderer, scene, camera;
let world = {
    x: 140,
    z: 140
};
let densityGrid = [];
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

let availableVecField = [];

let tiles = [];
let vecField = [];
let selected = null;
let selectedObject = null;


let tiles1 = [];
let tiles2 = [];
let originalTiles = [];


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
let globalTimestamp = 0;

const stats = new Stats();
document.body.appendChild(stats.dom)

const tile = {
    w:WORLDUNIT * 2,
    h:WORLDUNIT * 2
}

let plannerMode = 2;

let obstacleCost = 65535;
let wallCost = 10;
let normalCost = 1;


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


];
let opens = [];
let exits = [];


function checkContainsTuple(base, checked){
    return base.some((arr) =>
        arr.every((val, i) => val === checked[i])
    );
}
function arrayContainsObject(arr, obj) {
    return arr.some(item => item.x === obj.x && item.z === obj.z);
}

function arrayContainsArray(arr, obj) {
    return arr.some(item => item[0] === obj[0] && item[1] === obj[1]);
}
function downloadWallData(scenarioName) {
    if (obstacles.length > 0) {
        // Convert the frames array to JSON

        let exported = [];
        obstacles.forEach(function (t){
           let _t = tiles[t[0]][t[1]];

            let obstacle_data = {
                x: _t.x,
                z: _t.z,
                unit: WORLDUNIT * 2
            }
           exported.push(obstacle_data);


        });

        const json = JSON.stringify(exported);

        const dataName = `${scenarioName}_wall.json`

        // Download the JSON file
        const link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
        link.setAttribute('download', dataName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function downloadOpensData(scenarioName) {
    if (opens.length > 0) {
        // Convert the frames array to JSON
        const json = JSON.stringify(opens);

        const dataName = `${scenarioName}_opens.json`

        // Download the JSON file
        const link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
        link.setAttribute('download', dataName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function pathProcessing(path){
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

    let origin = [];
    path.forEach(function (t){
        origin.push([t.x, t.z])
    });


    return [smoothedPath, smoothedPathV2, smoothIndices, origin];
}


function AStar(ts, start, end, gid = 1) {
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



            path = path.reverse();

            return path;
        }

        // place picked tile from unvisited set to visited set
        const index = openSet.indexOf(current);
        openSet.splice(index, 1);
        closedSet.push(current);

        const neighbors = [];
        const x = current.r;
        const y = current.c;



        if (plannerMode === 3){

            if(gid === 1){
                if (ts[x - 1] && ts[x - 1][y].cost < obstacleCost) {
                    neighbors.push(ts[x - 1][y]);
                }
            }else {
                if (ts[x + 1] && ts[x + 1][y].cost < obstacleCost) {
                    neighbors.push(ts[x + 1][y]);
                }

            }

        }else {
            if (ts[x - 1] && ts[x - 1][y].cost < obstacleCost) {
                neighbors.push(ts[x - 1][y]);
            }
            // if (ts[x + 1] && ts[x + 1][y].cost < obstacleCost) {
            //     neighbors.push(ts[x + 1][y]);
            // }
        }

        if (ts[x][y + 1] && ts[x][y + 1].cost < obstacleCost) {
            neighbors.push(ts[x][y + 1]);
        }
        if (ts[x][y - 1] && ts[x][y - 1].cost < obstacleCost) {
            neighbors.push(ts[x][y - 1]);
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
                neighbor.f = neighbor.g +  neighbor.h; // +  w_d * neighbor.density
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

function getElementsInsideSquare(T, K) {
    return T.filter((element) => {
        const { upperLeft, upperRight, bottomLeft, bottomRight } = element;
        const [a, b, c, d] = [upperLeft, upperRight, bottomLeft, bottomRight];

        // Check if any coordinate in K is inside the square defined by a, b, c, and d
        for (let i = 0; i < K.length; i++) {
            const [x, z] = K[i];

            if (
                x >= Math.min(a.x, b.x, c.x, d.x) &&
                x <= Math.max(a.x, b.x, c.x, d.x) &&
                z >= Math.min(a.z, b.z, c.z, d.z) &&
                z <= Math.max(a.z, b.z, c.z, d.z)
            ) {
                return true;
            }
        }

        return false;
    });
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



    for (let i = 0; i < rows; i++) {
        tiles[i] = [];
        tiles1[i] = [];
        tiles2[i] = [];
        originalTiles[i] = [];


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
                cost = normalCost;

            }

            originalTiles[i][j] =  new Tile(i, j, object_position.x, object_position.y, object_position.z, cost);
            tiles[i][j] = new Tile(i, j, object_position.x, object_position.y, object_position.z, cost);
            tiles1[i][j] = new Tile(i, j, object_position.x, object_position.y, object_position.z, cost);
            tiles2[i][j] = new Tile(i, j, object_position.x, object_position.y, object_position.z, cost);

        }
    }

    // set flow field
    let columnWidth = tiles[0].length;
    let vectors = makeFlowField();
    // console.log(vectors);
    for (const row of vectors) {
        for (const column of row){
            let cell = column;
            let x = cell.threeVec[0];
            let z = cell.threeVec[1];
            tiles[cell.r][cell.c].vec = {x:x, z:z};
            tiles[cell.r][cell.c].digit = cell.digit;
        }
    }

    // console.log(tiles);

    for (let i = 0; i< rows;i++){
        for (let j = 0; j<columns;j++){
            // Create a box geometry and a mesh material


            let t = tiles[i][j];

            const geometry = new THREE.BoxGeometry(tile.w, WORLDUNIT * 2, tile.h);

            let material;
            if (t.cost >= obstacleCost){
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


            // switch(t.digit) {
            //     case 0:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0x38b6ff // set a color to see the transparent effect
            //         });
            //         // material.color = 0x38b6ff;
            //         break;
            //     case 1:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0x2eb135 // set a color to see the transparent effect
            //         });
            //         // material.color = 0x2eb135;
            //         break;
            //     case 2:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0xff4000 // set a color to see the transparent effect
            //         });
            //         // material.color = 0xff4000;
            //         break;
            //     case 3:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0xffe500 // set a color to see the transparent effect
            //         });
            //         // material.color = 0xffe500;
            //         break;
            //     case 4:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0x9435eb // set a color to see the transparent effect
            //         });
            //         // material.color = 0x9435eb;
            //         break;
            //     case 5:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0xffccde // set a color to see the transparent effect
            //         });
            //         // material.color = 0xffccde;
            //         break;
            //     case 6:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0xffa500 // set a color to see the transparent effect
            //         });
            //         // material.color = 0xffa500;
            //         break;
            //     case 7:
            //         material = new THREE.MeshStandardMaterial({
            //             transparent: true,
            //             opacity: 1.0,
            //             color: 0xffffff // set a color to see the transparent effect
            //         });
            //         // material.color = 0xffffff;
            //         break;
            //     default:
            //     // do nothing
            //         break;
            // }





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


            if(t.cost >= obstacleCost){
                pickableWall.push(cube);
                wallData.push(cube.userData);

            }else {
                pickableWalkingTiles.push(cube);
            }


            pickableTiles.push(cube);

            // Add the mesh to the scene
            scene.add(cube);


            // break;
        }
        // break;
    }



    // add exit grids
    opens.forEach(function (e, index){

        exits[index].x = tiles[e[0]][e[1]].x
        exits[index].z = tiles[e[0]][e[1]].z

    });

    // const fontLoader = new FontLoader();

    // tiles.forEach(function (item, index){
    //     fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    //
    //         // console.log(item);
    //         // console.log(item);
    //         // Create a TextGeometry with the number and the loaded font
    //         const textGeometry = new TextGeometry(index.toString(), {font: font, size: 0.5, height: 0});
    //         const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    //         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    //         textMesh.position.set(item.x, 5, item.z); // Set the position of the text relative to the cube
    //         // console.log(textMesh.position);
    //
    //
    //
    //         scene.add(textMesh);
    //         texts.push(textMesh);
    //
    //
    //     });
    // });

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
    // scene.add(new THREE.AxesHelper(40));
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


    function addColumnAgentGroup(agentData, numAgents, spacing,startPos, goalPos,velocityMagnitude, direction,
                                 mode = 2, dir = 0, dirz = 0,  g_id = 1, obs=false) {
        let i = 0;
        let initalIdx = agentData.length;
        let dx = 0,
            dz = 0,
            vx = 0,
            vz = 0;
        // let distanceToGoal = PHY.distance(startPos.x, startPos.z,
        //     goalPos.x, goalPos.z);
        // vx = velocityMagnitude * (goalPos.x - startPos.x) / distanceToGoal;
        // vz = velocityMagnitude * (goalPos.z - startPos.z) / distanceToGoal;

        // velocityMagnitude = getRandomFloat(0.4, 1.2, 1);

        if (direction === "X") {
            dx = spacing;
        } else if (direction === "Z") {
            dz = spacing;
        }
        while (i < numAgents) {

            let startVx, startVy, startVz = null;
            if(mode === 3){
                startVx = dir;
                startVy = 0;
                startVz = 0;
            }

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
                vm: velocityMagnitude,
                backupVm: velocityMagnitude,
                // v_pref: 0.8,

                radius: RADIUS,
                invmass: 0.5,
                group_id: g_id,

                path : null,
                simpPath:null,
                path_index: 0,
                exit: null,
                exit_current: null,
                exit_index: 1,

                segDist : [],
                closetSegment:[],
                outTrack:false,
                passingDoor:false,

                simEnd:null,

                correction: false,
                move: true,
                waitAgent:null,
                density: 1,

                modifier:1,


                minVariance: getRandomFloat(0.5, 1.5, 1),
                variance: getRandomFloat(1.5, 2.5, 1),
                // getRandomFloat(1.5, 1.5, 1)
                interrupt: false,
                backupPath: null,
                backup: [],
                zForce: 0,
                emptyDirs :[],
                target: null,

                fGoal_x: goalPos.x + dx * i,
                fGoal_y: 0.0,
                fGoal_z: goalPos.z + dz * i,

                svx:startVx,
                svy:startVy,
                svz:startVz,

                sx: startPos.x + dx * i,
                sy: 2.0,
                sz: startPos.z + dz * i,

                exVec: {x:0, z:0},
                row:-1,
                column:-1,

                currentR:-1,
                currentC:-1,
                openFlag:false,

                noFollowingTimer:-1,
                freezeTimer:-1,

                scenarioVec: {x:dir, z:dirz},
                scenarioGoal: {x: dir * 100, z:startPos.z + dz * i},
                cachedSurroundAgents:[],
                cachedAgents:[],
                cachedVelocity: [],
                reqPreVel:null,
                header: false,
                obstacle: obs,
                personalDistance: 2.5,

            });
            i += 1;
        }
    }

    function addOneAgents(agentData, id,
                          startPos, goalPos,
                          velocityMagnitude) {

        let vx = 0,
            vz = 0;
        // let distanceToGoal = PHY.distance(startPos.x, startPos.z,
        //     goalPos.x, goalPos.z);
        // vx = velocityMagnitude * (goalPos.x - startPos.x) / distanceToGoal;
        // vz = velocityMagnitude * (goalPos.z - startPos.z) / distanceToGoal;


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
            v_pref: 0.8,
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

        plannerMode = 3;

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 25]);
        }

        // console.log(pieces1);


        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 35]);
        }

        let pieces3 = []
        // for (let i = 30; i<39;i++){
        //     pieces3.push([i, 31]);
        //     pieces3.push([i, 30]);
        //
        // }

        fobs = [...pieces1, ...pieces2, ...pieces3];
        // fobs.push([...pieces2]);
        // console.log(fobs);

        obstacles = fobs;

        for (let i = 16;i<23;i++){

            addColumnAgentGroup(agentData, 16, RADIUS * 3, {
                    x: 25,
                    z: -48.5 + i * 2
                }, {
                    x: -65,
                    z: -16.5
                },
                0.8, "X", 3, -1, 1);

        }

        for(let i = 18; i< 25;i++){
            addColumnAgentGroup(agentData, 16, RADIUS * 3, {
                    x: -70,
                    z: -49 + i * 2
                }, {
                    x: 65,
                    z: -3
                },
                0.8, "X", 3, 1, 2);
        }


    }

    function blueNoiseSampling(width, height, numSamples, k = 10, D = 2 * RADIUS + RADIUS) {
        const samples = [];

        const distance = (p1, p2) => {
            const dx = p1[0] - p2[0];
            const dy = p1[1] - p2[1];
            return Math.sqrt(dx * dx + dy * dy);
        }

        for (let i = 0; i < numSamples; i++) {
            let bestCandidate = null;
            let bestDistance = 0;

            for (let j = 0; j < k; j++) {
                const candidate = [Math.random() * width, Math.random() * height];
                let minDistance = Infinity;

                for (const sample of samples) {
                    const dist = distance(candidate, sample);
                    minDistance = Math.min(minDistance, dist);
                }

                if (minDistance > bestDistance) {
                    bestDistance = minDistance;
                    bestCandidate = candidate;
                }
            }

            if (bestDistance >= D) {
                samples.push(bestCandidate);
            }
        }

        return samples;
    }

    function simpleHallwayTest(){

        plannerMode = 3;

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 25]);
        }

        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 50]);
        }

        fobs = [...pieces1, ...pieces2];

        obstacles = fobs;


        let height = Math.abs(pieces2[0][1] - 5) ;
        let width = 200;


        let sampled = blueNoiseSampling(width, height, 800, 30, 2* RADIUS + 2 * RADIUS);
        sampled.forEach(function (agent){
            addColumnAgentGroup(agentData, 1, 0, {
                    x: agent[0] - 45,
                    z: agent[1] - 17
                }, {
                    x: agent[0] - 9999,
                    z: agent[1] - 17
                },
                getRandomFloat(0.75, 1.75, 2), "X", 3, -1, 0, 1);
        })

        let pillars = [


        ]

        for (let i = 0;i<22;i++){
            pillars.push( [-71, -16 + i * 2, 0, -1, 0],)
        }

        pillars.forEach(function (agent){
            addColumnAgentGroup(agentData, 1, 0, {
                    x: agent[0],
                    z: agent[1]
                }, {
                    x: agent[0] - 9999,
                    z: agent[1]
                },
                agent[2],"X", 3, -1, 0, 1, true);


        })



        // let sampled = [
        //     [-5, 1.5, 0.5, -1, 0],
        //     [15, 1.1, 1.1, -1, 0],
        //     [30, 0.5, 1.8, -1, 0],
        //     // [-7, -1, 0.4, -1, 0],
        //     // [-9, -0, 0.8, -1, 0],
        //     // [-5, 3, 0.3, -1, 0],
        //
        // ]
        //
        // sampled.forEach(function (agent){
        //     addColumnAgentGroup(agentData, 1, 0, {
        //             x: agent[0],
        //             z: agent[1]
        //         }, {
        //             x: agent[0] - 9999,
        //             z: agent[1]
        //         },
        //         agent[2], "X", 3, agent[3], agent[4], 1);
        // });




    }

    function simpleHallwayAgentConfiguration(){

        plannerMode = 3;

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 25]);
        }

        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 50]);
        }

        fobs = [...pieces1, ...pieces2];

        obstacles = fobs;


        let height = Math.abs(pieces2[0][1] - 5) ;
        let width = 100;


        let sampled = blueNoiseSampling(width, height, 500, 30);


        sampled.forEach(function (agent){
            addColumnAgentGroup(agentData, 1, 0, {
                    x: agent[0] - 55,
                    z: agent[1] - 17
                }, {
                    x: agent[0] - 9999,
                    z: agent[1] - 17
                },
                getRandomFloat(1.2, 1.8, 1), "X", 3, -1, 0, 1);
        })

    }

    function simpleHallwayHalfAgentConfiguration(){

        plannerMode = 3;

        [rows, columns] = cut();

        let fobs = []


        let pieces1 = []
        for (let i = 0; i<rows;i++){
            pieces1.push([i, 25]);
        }

        // console.log(pieces1);


        let pieces2 = []
        for (let i = 0; i<rows;i++){
            pieces2.push([i, 35]);
        }

        let pieces3 = []
        // for (let i = 30; i<39;i++){
        //     pieces3.push([i, 31]);
        //     pieces3.push([i, 30]);
        //
        // }

        fobs = [...pieces1, ...pieces2, ...pieces3];
        // fobs.push([...pieces2]);
        // console.log(fobs);

        obstacles = fobs;

        for (let i = 16;i<19;i++){

            let ran = getRandomFloat(0.4, 1.2, 1);
            addColumnAgentGroup(agentData, 16, RADIUS * 3, {
                    x: 25,
                    z: -48.5 + i * 2
                }, {
                    x: -65,
                    z: -16.5
                },
                ran, "X", 3, -1, 1);

        }


        // randomize speed
        agentData.forEach(function (a){
            a.v_pref = getRandomFloat(0.4, 1.2, 1);
            a.vm = a.v_pref;
        })

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

    function obstacleOnlyEscapeScenario(){
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



        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2]);
        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2 + 1]);
        obstacles = removeArrayFrom2DArray(obstacles, [world.x/2/2 - 6, world.x/2/2 - 1]);


        opens.push([world.x/2/2 - 6, world.x/2/2]);
        opens.push([world.x/2/2 - 6, world.x/2/2 + 1]);
        opens.push([world.x/2/2 - 6, world.x/2/2 - 1]);

        exits = [];
        opens.forEach(function (e){
            const obj = {x: null, z: null, dir: {x:-1, z:0}};
            exits.push(obj);
        });
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
        // console.log([world.x/2/2 - 6, world.x/2/2 + 1]);

        opens.push([world.x/2/2 - 6, world.x/2/2]);
        opens.push([world.x/2/2 - 6, world.x/2/2 + 1]);
        opens.push([world.x/2/2 - 6, world.x/2/2 - 1]);

        exits = [];
        opens.forEach(function (e){
            const obj = {x: null, z: null, dir: {x:-1, z:0}};
            exits.push(obj);
        });


        for (let i = 0;i<6;i++){

            addColumnAgentGroup(agentData, 7, RADIUS * 4, {
                    x: -8,
                    z: -6 + i * 3
                }, {
                    x: -68,
                    z: -6 + i * 5
                },
                0.8, "X", );

        }


        for (let i = 0;i<25;i++){

            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: 18,
                    z: -30 + i * 3
                }, {
                    x: -35,
                    z: -65 + i * 5
                },
                0.8, "X", );


            addColumnAgentGroup(agentData, 4, RADIUS * 4, {
                    x: 33,
                    z: -30 + i * 3
                }, {
                    x: -55,
                    z: -65 + i * 5
                },
                0.8, "X", );
        }

        // downloadWallData("escape");
        // downloadOpensData("escape");


    }

    // debugConfiguration();
    // hallwayAgentConfiguration();
    // singleHallwayAgentConfiguration();
    // defaultAgentConfiguration();
    // lineupConfiguration();
    // oneDirHallwayAgentConfiguration();
    // escapeScenario();
    // obstacleOnlyEscapeScenario();
    // simpleHallwayAgentConfiguration();
    // simpleHallwayHalfAgentConfiguration();
    simpleHallwayTest();







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

    const fontLoader = new FontLoader();
    agentData.forEach(function(item, index) {


        agentGeom = new THREE.CylinderGeometry(item.radius, item.radius, 4, 16);
        agentMaterial = new THREE.MeshLambertMaterial({
            color: 0xcc3421
        });

        agent = new THREE.Mesh(agentGeom, agentMaterial);
        if (item.group_id === 2){
            agent.material.color.set(0x0079af);
        }

        agent.castShadow = true;
        agent.receiveShadow = true;
        agent.userData = {
            "index": item.index,
            "start_tile": null,
            "end_tile": null,
            "tm": null,
            "fm":null
        };


        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {

            // console.log(FT);
            // Create a TextGeometry with the number and the loaded font
            const textGeometry = new TextGeometry(item.index.toString(), {font: font, size: 0.5, height: 0});
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(item.agent.position.x, item.agent.position.y + 5, item.agent.position.z); // Set the position of the text relative to the cube


            agent.userData.tm = textMesh;
            // scene.add(textMesh);
            texts.push(textMesh);

            const followingGeometry = new TextGeometry("-1", {font: font, size: 0.5, height: 0});
            const followingMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
            const followingMesh = new THREE.Mesh(followingGeometry, followingMaterial);
            followingMesh.position.set(item.agent.position.x + 1, item.agent.position.y + 5, item.agent.position.z); // Set the position of the text relative to the cube


            agent.userData.fm = followingMesh;
            // scene.add(followingMesh);
            ftexts.push(followingMesh);

        });

        // velocity indicator
        let dir = new THREE.Vector3( 1, 0, 0 );
        let origin = agent.position;
        let length = 5;
        let hex = 0xffff00;

        let arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        scene.add( arrowHelper );
        arrows.push(arrowHelper);

        // goal indicator
        let g_dir = new THREE.Vector3( 1, 0, 0 );
        let g_origin = agent.position;
        let g_length = 5;
        let g_hex = 0x0000ff;

        let g_arrowHelper = new THREE.ArrowHelper( g_dir, g_origin, g_length, g_hex );
        // scene.add( g_arrowHelper );
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
        // scene.add(line);




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
        agent.currentHex = agent.material.emissive.getHex();
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
function downloadSimData() {
    // const frameNumber = parseInt(document.getElementById('frame').value);

    if (global_frames.length > 0) {
        // Convert the frames array to JSON
        const json = JSON.stringify(global_frames);

        // Download the JSON file
        const link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
        link.setAttribute('download', `simulation.json`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

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
    // if (event.code === 'Enter') {
    //     var mouseX = event.clientX;
    //     var mouseY = event.clientY;
    //     // console.log('Mouse position:', mouseX, mouseY);
    // }

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}



function deepCloneArray(array) {
    return Array.from(Object.create(array));
}

function performAStar(){
    for (let i =0; i<agentData.length;i++){

        selected = i;


        const a = agentData[selected]


        for (let i = 0; i< rows;i++) {
            for (let j = 0; j < columns; j++) {
                // Create a box geometry and a mesh material

                tiles[i][j].g = tiles[i][j].cost;
                tiles[i][j].h = 0;
                tiles[i][j].f = 0;
                tiles[i][j].parent = null;

                tiles1[i][j].g = tiles1[i][j].cost;
                tiles1[i][j].h = 0;
                tiles1[i][j].f = 0;
                tiles1[i][j].parent = null;
                //
                tiles2[i][j].g = tiles2[i][j].cost;
                tiles2[i][j].h = 0;
                tiles2[i][j].f = 0;
                tiles2[i][j].parent = null;
            }
        }

        // get grid position via world position for start and end
        let actual_position = {
            x: agentData[selected].x + world.x / 2,
            y: agentData[selected].y,
            z: agentData[selected].z + world.z / 2,

        }

        let [r, c] = convertWorld2Grid(actual_position);
        if(r>69){
            r = 69;
        }
        if(c>69){
            c = 69;
        }

        let goal_actual_position = {
            x: a.fGoal_x + world.x / 2,
            y: a.fGoal_y,
            z: a.fGoal_z + world.z / 2,

        }

        let [er, ec] = convertWorld2Grid(goal_actual_position);
        if(er>69){
            er = 69;
        }
        if(ec>69){
            ec = 69;
        }

        // get corresponded tile

        selectedObject = pickableObjects[selected]

        // const index = r * rows + c;
        //
        // const t1 = pickableTiles[index];

        let path;

        if(plannerMode === 3){

            if(a.group_id === 1){
                selectedObject.userData.start_tile = tiles1[r][c];
                selectedObject.userData.end_tile =   tiles1[er][ec];
                path = AStar(tiles1, selectedObject.userData.start_tile, selectedObject.userData.end_tile, a.group_id);
            }else if(a.group_id === 2){
                selectedObject.userData.start_tile = tiles2[r][c];
                selectedObject.userData.end_tile =   tiles2[er][ec];
                path = AStar(tiles2, selectedObject.userData.start_tile, selectedObject.userData.end_tile, a.group_id);
            }

        }else {
            selectedObject.userData.start_tile = tiles[r][c];
            selectedObject.userData.end_tile =   tiles[er][ec];
            path = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile);
        }



        // let path = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile);

        let simplifiedPath, smoothPath, simplifiedIndices, originalPath;
        let firstKeyIndex = 0;

        if(path){
           [simplifiedPath, smoothPath, simplifiedIndices, originalPath] =  pathProcessing(path);
            firstKeyIndex = simplifiedIndices.shift();
        }


        agentData[selected].path = originalPath;
        agentData[selected].simpPath = simplifiedPath;
        agentData[selected].path_index = 0;

        agentData[selected].exit = simplifiedIndices;
        agentData[selected].key_index = firstKeyIndex;

        agentData[selected].simEnd = false;
    }
}


function rightClick(event) {

    event.preventDefault();
    // performAStar();

    customDict.stop = !customDict.stop;
    customDict.globalCounter += 1;
    console.log(customDict.stop);
}

function mouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);




    selected = null;
    let intersects = raycaster.intersectObjects(pickableObjects, false);
    for (let i = 0; i < intersects.length; i++) {

        selectedObject = intersects[i].object;

        selected = selectedObject.userData.index;


        // selectedObject.material.emissive.setHex( 0xff0000 );



        console.log(agentData[selected]);

        agentData[selected].v_pref += 0.1;

        break;
    }
}


const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const pauseButton = document.getElementById("pauseButtonId");

// Start Button
pauseButton.onclick = function StartAnimation() {

    // Start and Pause
    if (isPlay) {
        pauseButton.innerHTML = 'Restart';

        isPlay = false;

    } else {
        pauseButton.innerHTML = 'Pause';

        isPlay = true;

    }

    animate();
}

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


// function setMeshColor(mesh, value) {
//     // Calculate the color value between red and blue
//     const r = Math.round(value * 255);
//     const g = Math.round((1 - value) * 255);
//
//     // Create a new color with the calculated RGB values
//     const color = new THREE.Color(`rgb(${r}, ${g}, 0)`);
//
//     // Set the color of the mesh
//     mesh.material.color = color;
// }

function interpolateColor(colorA, colorB, value) {
    // Convert the colors to RGB arrays
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);

    // Interpolate each component of the RGB values
    const r = Math.round(interpolate(rgbA.r, rgbB.r, value));
    const g = Math.round(interpolate(rgbA.g, rgbB.g, value));
    const b = Math.round(interpolate(rgbA.b, rgbB.b, value));

    // Convert back to hex and return the result
    return parseInt(rgbToHex(r, g, b), 16);
}

function interpolateColorHue(colorA, colorB, value) {
    // Convert the hex colors to HSV
    const hsvA = rgbToHsv(hexToRgb(colorA));
    const hsvB = rgbToHsv(hexToRgb(colorB));

    // Adjust for counter-clockwise interpolation on the hue wheel
    if (hsvA.h <= hsvB.h) {
        hsvB.h -= 360;
    }

    // Interpolate each component of the HSV values
    const h = interpolateHue(hsvA.h, hsvB.h, value);
    const s = interpolate(hsvA.s, hsvB.s, value);
    const v = interpolate(hsvA.v, hsvB.v, value);

    // Convert back to RGB, then to hex
    return parseInt(rgbToHex(hsvToRgb({h, s, v})), 16);

}

function interpolateColorTri(colorA, colorB, colorC, value) {
    // Convert the colors to RGB arrays
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    const rgbC = hexToRgb(colorC);

    let r, g, b;

    if (value <= 0.5) {
        // Adjust the interpolation value for the first half
        const adjustedValue = value * 2;
        r = Math.round(interpolate(rgbA.r, rgbB.r, adjustedValue));
        g = Math.round(interpolate(rgbA.g, rgbB.g, adjustedValue));
        b = Math.round(interpolate(rgbA.b, rgbB.b, adjustedValue));
    } else {
        // Adjust the interpolation value for the second half
        const adjustedValue = (value - 0.5) * 2;
        r = Math.round(interpolate(rgbB.r, rgbC.r, adjustedValue));
        g = Math.round(interpolate(rgbB.g, rgbC.g, adjustedValue));
        b = Math.round(interpolate(rgbB.b, rgbC.b, adjustedValue));
    }

    // Convert back to hex and return the result
    return parseInt(rgbToHex(r, g, b), 16);
}

function interpolate(a, b, value) {
    return a + (b - a) * value;
}

// Helper function to interpolate the hue specifically
function interpolateHue(hueStart, hueEnd, value) {
    return (hueStart + (hueEnd - hueStart) * value + 360) % 360;
}

function hsvToRgb(hsv) {
    let r, g, b, i, f, p, q, t;
    const h = hsv.h / 360,
        s = hsv.s / 100,
        v = hsv.v / 100;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
function rgbToHsv(rgb) {
    let r = rgb.r / 255,
        g = rgb.g / 255,
        b = rgb.b / 255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        h, s, v = max,
        d = max - min;

    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
}

function hexToRgb(hex) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return { r, g, b };
}

function rgbToHex(rgb) {

    let  [r, g, b] = [rgb.r, rgb.g, rgb.b];
    return (
        [r, g, b]
            .map((x) => {
                const hex = x.toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
    );
}

function getUnitVector(vector){

    // Calculate the magnitude (length) of the vector
    let magnitude = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    if (magnitude < 0.1){
        magnitude = 0.1;
    }

    // Calculate the unit vector
    return {
        x: vector.x / magnitude,
        z: vector.z / magnitude
    };
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

function sortByDensity(array) {
    return array.sort((a, b) => a.density - b.density);
}

function updateCostInMap(ts, r, c, change){

    if(r<0){
        r = 0;
    }

    if(r >= ts.length){
        r = ts.length-1;
    }

    if(c<0){
        c = 0;
    }

    if(c >= ts[0].length){
        c = ts[0].length-1;
    }



    ts[r][c].cost += change;
    if (ts[r][c].cost >= obstacleCost){
        ts[r][c].cost = obstacleCost-1;
    }

    if (ts[r][c].cost < 1){
        ts[r][c].cost = 1;
    }

    return ts;
}

function animate() {


    if (!isPlay) return;
    requestAnimationFrame(animate);
    // interaction();


    agentData.forEach(function(member, index){
        let actual_position = {
            x: member.x + world.x / 2,
            y: member.y,
            z: member.z + world.z / 2,

        }

        let [r, c] = convertWorld2Grid(actual_position);

        // if agent not move from last frame, do nothing
        if (r === member.row && c === member.column){
            return;
        }
        if(r>69){
            r = 69;
        }
        if(c>69){
            c = 69;
        }

        if(r<0){
            r = 0;
        }
        if(c<0){
            c = 0;
        }

        let openFlag = member.openFlag;
        if(openFlag === false && arrayContainsArray(opens, [r,c])){
            openFlag = true
        }
        member.openFlag = openFlag;


    });

    // data download
    // if (global_frame_pointer < 10000){
    //
    //     // Generate the frame data for the specified frame
    //     global_frames[global_frame_pointer] = {
    //         frame: global_frame_pointer,
    //         agents: agentData.map(agent => ({
    //             id: agent.index,
    //             x: parseFloat(agent.x.toFixed(2)),
    //             y: agent.y,
    //             z: parseFloat(agent.z.toFixed(2)),
    //         })),
    //     };
    //
    //
    //     global_frame_pointer++;
    //
    // }else if(global_frame_pointer === 10000) {
    //     downloadSimData()
    //     global_frame_pointer++;
    // }else {
    //     // do nothing
    // }

    agentData.forEach(function(member, index){

        if (isNaN(member.x) || isNaN(member.z)){
            return;
        }

        let actual_position = {
            x: member.x + world.x / 2,
            y: member.y,
            z: member.z + world.z / 2,

        }

        let [r, c] = convertWorld2Grid(actual_position);

        // if agent not move from last frame, do nothing
        if (r === member.row && c === member.column){
            return;
        }
        if(r>69){
            r = 69;
        }
        if(c>69){
            c = 69;
        }

        if(r<0){
            r = 0;
        }
        if(c<0){
            c = 0;
        }

        // if not initialization, need to deal with previous frame
        if(member.row !== -1 && member.column !== -1){
            let decrement =  -1;

            // if agent moves to different position from last frame
            // first reduce the cost of previous occupied tile (min is 1)
            for (let i = -1; i < 2 ; i++){

                if (member.row + i < 0 || member.row + i > tiles.length - 1){
                    continue;
                }

                for (let j = -1; j < 2 ; j++){

                    if (member.column + j < 0 || member.column + j > tiles[0].length - 1){
                        continue;
                    }

                    tiles[member.row + i][member.column + j].cost += decrement;
                    if (tiles[member.row + i][member.column + j].cost < 1 ){
                        tiles[member.row + i][member.column + j].cost = 1;
                    }
                }
            }


            // tiles[member.row][member.column].cost += decrement;
            // if (tiles[member.row][member.column].cost < 1){
            //     tiles[member.row][member.column].cost = 1;
            // }

            // if(member.group_id === 1){
            //     let targetR, targetC;
            //
            //     [targetR, targetC] = [member.row, member.column];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row-1, member.column];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row, member.column-1];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row-1, member.column-1];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row+1, member.column];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row, member.column+1];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row+1, member.column+1];
            //     tiles2 = updateCostInMap(tiles2, targetR, targetC, decrement);
            //
            // }else {
            //     let targetR, targetC;
            //
            //     [targetR, targetC] = [member.row, member.column];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row-1, member.column];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row, member.column-1];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row-1, member.column-1];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row+1, member.column];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row, member.column+1];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            //
            //     [targetR, targetC] = [member.row+1, member.column+1];
            //     tiles1 = updateCostInMap(tiles1, targetR, targetC, decrement);
            // }
        }

        // update coordinate
        member.row = r;
        member.column = c;



        // increase the cost of current occupied tile (max is 9, 10 is for obstacle)
        let increment =  1;


        for (let i = -1; i < 2 ; i++){

            if (member.row + i < 0 || member.row + i > tiles.length - 1){
                continue;
            }

            for (let j = -1; j < 2 ; j++){

                if (member.column + j < 0 || member.column + j > tiles[0].length - 1){
                    continue;
                }

                tiles[member.row + i][member.column + j].cost += increment;
                if (tiles[member.row + i][member.column + j].cost >= obstacleCost){
                    tiles[member.row + i][member.column + j].cost = obstacleCost - 1;
                }
            }
        }
        // tiles[member.row][member.column].cost += increment;
        // if (tiles[member.row][member.column].cost >= obstacleCost){
        //     tiles[member.row][member.column].cost = obstacleCost - 1;
        // }

        // if(member.group_id === 1){
        //
        //     let targetR, targetC;
        //
        //     [targetR, targetC] = [member.row, member.column];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row-1, member.column];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row, member.column-1];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row-1, member.column-1];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row+1, member.column];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row, member.column+1];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row+1, member.column+1];
        //     tiles2 = updateCostInMap(tiles2, targetR, targetC, increment);
        //
        // }else {
        //     let targetR, targetC;
        //
        //     [targetR, targetC] = [member.row, member.column];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row-1, member.column];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row, member.column-1];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row-1, member.column-1];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row+1, member.column];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row, member.column+1];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        //
        //     [targetR, targetC] = [member.row+1, member.column+1];
        //     tiles1 = updateCostInMap(tiles1, targetR, targetC, increment);
        // }
    });

    PHY.step(RADIUS, agentData, pickableWall, world, WORLDUNIT, plannerMode, tiles, exits, customDict );
    // const frameNumber = parseInt(document.getElementById('frame').value);



    // for (let i = 0; i< rows;i++) {
    //     for (let j = 0; j < columns; j++) {
    //
    //
    //
    //         let color = interpolateColor("00ff00", "ff0000", normalize(1, 10, tiles[i][j].cost));
    //         // color = interpolateColor("2c2cce", "ff00a0", normalize(0, member.v_pref, member.vm));
    //         pickableTiles[i * world.x / tile.w + j].material.color.set(color);
    //         pickableTiles[i * world.x / tile.w + j].material.opacity = 1;
    //
    //
    //     }
    // }








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

        let overlapTiles = checkCircleOverlap(availableVecField, member);
        if(overlapTiles.length>0){
            overlapTiles = sortByDensity(overlapTiles)
            let overlapT = overlapTiles[overlapTiles.length-1];
            member.exVec = getUnitVector({x: overlapT.vec.x, z:overlapT.vec.z});
        }


        // updateDensity(availableVecField, member);

        // console.log(availableVecField);
        let color;

        if (plannerMode !== 3){
            color = interpolateColor("2c2cce", "ff00a0", normalize(0, member.v_pref, member.vm));


            member.agent.material.color.set(color);
        }else {
            if(member.group_id === 1){


                // color = interpolateColor("2c2cce", "4fce2c", normalize(0, member.v_pref, member.vm));
                if(member.obstacle){
                    color = interpolateColorHue("2c2cce", "ce2c2c", 0);

                }else {
                    color = interpolateColorHue("2c2cce", "ce2c2c", normalize(0, 1.75, member.vm));

                }


                member.agent.material.color.set(color);

                // if(member.header){
                //     member.agent.material.color.set("000000");
                //
                // }else {
                //     member.agent.material.color.set(color);
                //
                // }
            }else if(member.group_id === 2){
                color = interpolateColor("a5d6a7", "1b5e20", normalize(0, member.v_pref, member.vm));
                member.agent.material.color.set(color);
            }
        }



        // if (texts.length>0){
        //     texts[index].position.x = member.x;
        //     texts[index].position.y = member.y + 5;
        //     texts[index].position.z = member.z;
        // }


        // if (lines.length>0){
        //
        //     const selfPosition = new THREE.Vector3(member.x, member.y + 2, member.z);
        //     // const selfPosition2 = new THREE.Vector3(member.x, member.y + 10, member.z);
        //
        //
        //     if (member.waitAgent){
        //         const followedPosition = new THREE.Vector3(member.waitAgent.x, member.waitAgent.y + 2, member.waitAgent.z);
        //
        //         // Update the points of the line's geometry to match the objects' positions
        //         lines[index].geometry.setFromPoints([selfPosition, followedPosition]);
        //     }else {
        //         lines[index].geometry.setFromPoints([selfPosition, selfPosition]);
        //     }
        //
        //     // Let Three.js know that the geometry has changed and needs to be re-rendered
        //     lines[index].geometry.verticesNeedUpdate = true;
        // }


        // if (ftexts.length>0){
        //     if (member.waitAgent){
        //         ftexts[index].geometry.parameters.text = member.waitAgent.index;
        //     }else {
        //         ftexts[index].geometry.parameters.text = "-5";
        //     }
        //     ftexts[index].geometry.computeBoundingBox();          // recompute the bounding box
        //     // ftexts[index].geometry.center();
        //
        //     ftexts[index].position.x = member.x + 1;
        //     ftexts[index].position.y = member.y + 5;
        //     ftexts[index].position.z = member.z;
        // }

        if (arrows.length>0){

            arrows[index].position.x = member.x;
            arrows[index].position.y = member.y;
            arrows[index].position.z = member.z;

            let direction = new THREE.Vector3(member.vx, 0, member.vz);
            arrows[index].setDirection(direction.normalize());
            arrows[index].setLength(direction.length()*5);
        }

        // if (g_arrows.length>0){
        //
        //     g_arrows[index].position.x = member.x;
        //     g_arrows[index].position.y = member.y;
        //     g_arrows[index].position.z = member.z;
        //
        //     if( plannerMode !==3 && (member.exit === null || member.path === null)){
        //         return;
        //     }
        //
        //     if (plannerMode !== 3){
        //         // let keypoint = member.path[member.key_index];
        //
        //
        //         let direction = new THREE.Vector3(member.goal_x - member.x, 0, member.goal_z - member.z);
        //
        //         g_arrows[index].setDirection(direction.normalize());
        //         g_arrows[index].setLength(direction.length()*8);
        //
        //     }else {
        //         let direction = new THREE.Vector3(member.fGoal_x - member.x, 0, member.fGoal_z - member.z);
        //         g_arrows[index].setDirection(direction.normalize());
        //         g_arrows[index].setLength(direction.length()*8);
        //
        //     }
        // }

    });


    renderer.render(scene, camera);
    stats.update()

    // performAStar();
}


function updateDensity(T, circle) {
    // const overlappingGrids = [];

    for (const grid of T) {
        const { x, z } = grid;

        const distanceX = Math.abs(circle.x - x);
        const distanceZ = Math.abs(circle.z - z);

        if (distanceX <= 10 / 2 + RADIUS && distanceZ <= 10 / 2 + RADIUS) {
            // overlappingGrids.push(grid);
            grid.density += ((RADIUS * RADIUS) / (5*5));
        }
    }

    // return overlappingGrids;
}

function checkCircleOverlap(T, circle) {
    const overlappingGrids = [];

    for (const grid of T) {
        const { x, z } = grid;

        const distanceX = Math.abs(circle.x - x);
        const distanceZ = Math.abs(circle.z - z);

        if (distanceX <= 10 / 2 + RADIUS && distanceZ <= 10 / 2 + RADIUS) {

            overlappingGrids.push(grid);
        }
    }

    return overlappingGrids;
}


function createFF(){
    let frontier = []
    let cost_so_far = {}

    // # Starting points get distance 0
    opens.forEach(function (item){
        const target = tiles[item[0]][item[1]];
        frontier.push(target)
        cost_so_far[target] = 0
    })


    // Expand outwards from existing points
    while(frontier.length > 0){
        let currentTile = frontier.shift();

        for (let i = 0;i<currentTile.FFNeighbors.length;i++){
            const neighbor = currentTile.FFNeighbors[i];
            if (!neighbor in cost_so_far)
                cost_so_far[neighbor] = cost_so_far[currentTile] + 1
                frontier.push(neighbor)
        }
    }
}

function startNewSimulation() {

    if (finish) {
        // reset the simulationEnded flag

        if(globalParamPointer !== 0){
            downloadData();
        }

        if(globalParamPointer >= combinations.length){
            // console.log(globalParamPointer);
            alert("Finished");
            return;
        }

        // finish = false;

        // startDistSlider.setValue(combinations[globalParamPointer][0]);
        // goalDistSlider.setValue(combinations[globalParamPointer][1]);
        // openSizeSlider.setValue(combinations[globalParamPointer][2]);
        // agentNumSlider.setValue(combinations[globalParamPointer][3]);
        randomSeedSlider.setValue(combinations[globalParamPointer][4]);

        globalParamPointer++;


    } else {
        // wait and check again in 1 second
        setTimeout(startNewSimulation, 1000);
    }
}




init();
createPBDMatrix();
gridization();
// createFF();
// downloadWallData("escape");
render();
animate();

// let intervalId = window.setInterval(function(){
//     performAStar();
// }, 5000);

// if (plannerMode !==3){
//     let intervalId = window.setInterval(function(){
//         performAStar();
//     }, 5000);
//     // performAStar();
// }



function interaction(){



    // find intersections

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( scene.children, false );

    if ( intersects.length > 0 ) {

        if ( INTERSECTED !== intersects[ 0 ].object ) {

            if ( INTERSECTED ){
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );


            }

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );

            if (intersects[ 0 ].waitAgent){
                INTERSECTED_FOLLOWED =intersects[ 0 ].waitAgent.object;
                INTERSECTED_FOLLOWED.currentHex = INTERSECTED_FOLLOWED.material.emissive.getHex();
                INTERSECTED_FOLLOWED.material.emissive.setHex( 0xff0000 );
            }else {

                if(INTERSECTED_FOLLOWED) INTERSECTED_FOLLOWED.currentHex = INTERSECTED_FOLLOWED.material.emissive.getHex();

            }

        }

    } else {

        if ( INTERSECTED ){
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        }

        if(INTERSECTED_FOLLOWED) INTERSECTED_FOLLOWED.currentHex = INTERSECTED_FOLLOWED.material.emissive.getHex();


        INTERSECTED = null;
        INTERSECTED_FOLLOWED = null;
    }
}


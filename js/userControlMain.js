import * as THREE from 'three';
import * as PHY from 'simplePhysics';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import Stats from 'three/addons/libs/stats.module.js';

import * as A from "agentConfiguration"
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
    x: 100,
    z: 100
};
let agentData = [];
let wallData = [];
// for ray to detect
let pickableObjects = [];
let pickableTiles = [];
let pickableWalkingTiles = [];
let pickableWall = [];

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


const obstacles = [
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




            return smoothedPath;
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
                v_pref: Math.sqrt(vx * vx + vz * vz),
                radius: RADIUS,
                invmass: 0.5,
                group_id: 1,

                path : null,
                path_index: 0,

                simEnd:null,

                correction: false,

                // fpx :0,
                // fpz :0,

                cvx :0,
                cvz :0,



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
            v_pref: Math.sqrt(vx * vx + vz * vz),
            radius: RADIUS,
            invmass: 0.5,
            group_id: 1,

            path : null,
            path_index: 0,
            correction: false,
            collidewall : [[...obstacles].map(c => false)],
        });

    }
    function defaultAgentConfiguration(){
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
    defaultAgentConfiguration();



    function loadFromAgentData(){
        A.agentConfig().forEach(function(item, index){

            addOneAgents(agentData, item.agent_id, {x:item.x, z:item.y}, {x:item.gx, z:item.gy}, 0.8);

        });
    }
    // loadFromAgentData();



    let i = 0;
    let deltaSpacing = 3;
    let startX, startY, goalX, goalY;
    startX = -25;
    goalX = -25;
    startY = -20
    goalY = 20;
    world.distanceConstraints = [];





    let agentGeom, agentMaterial, agent;
    let spotLight, spotLightTarget;

    agentData.forEach(function(item, index) {


        agentGeom = new THREE.CylinderGeometry(item.radius, item.radius, 4, 16);
        agentMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ff00
        });

        agent = new THREE.Mesh(agentGeom, agentMaterial);
        agent.castShadow = true;
        agent.receiveShadow = true;
        agent.userData = {
            "index": item.index,
            "start_tile": null,
            "end_tile": null
        };
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
    document.getElementById('download-btn').addEventListener('click', downloadSimData, false);

}


const global_frames = []; // An array to hold the frame data
let global_frame_pointer = 0;

// Handle the button click event
function downloadSimData() {
    const frameNumber = parseInt(document.getElementById('frame').value);

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



function rightClick(event) {

    event.preventDefault();

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



        const path = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile);

        let copy_path = deepCloneArray(path);

        path.forEach(function (G, index) {
            pickableTiles[G.r * world.x / tile.w + G.c].material.opacity = 0.5;
            if (index === 0 || index === path.length-1 ){

            }


        });

        // console.log(copy_path);

        agentData[selected].path = copy_path;
        agentData[selected].path_index = 0;
        agentData[selected].simEnd = false;
    }

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
        console.log(selectedObject);
        break;
    }
}

function render() {
    renderer.render(scene, camera);
}


function animate() {
    requestAnimationFrame(animate);
    PHY.step(RADIUS, agentData, pickableWall, world, wallData, WORLDUNIT, m);
    // const frameNumber = parseInt(document.getElementById('frame').value);

    let baseFlag = true;
    agentData.forEach(function (agent, index){

        if (agent.simEnd === null){
            baseFlag = baseFlag && false;
            return null;
        }

        baseFlag = baseFlag && agent.simEnd;
    })

    // loading frame data
    // if (!baseFlag && global_frame_pointer < 10000){
    //
    //     // Generate the frame data for the specified frame
    //     const frameData = {
    //         frame: global_frame_pointer,
    //         agents: agentData.map(agent => ({
    //             id: agent.index,
    //             x: agent.x,
    //             y: agent.y,
    //             z: agent.z,
    //         })),
    //     };
    //     global_frames[global_frame_pointer] = frameData;
    //
    //
    //     global_frame_pointer++;
    // }


    agentData.forEach(function(member) {
        member.agent.position.x = member.x;
        member.agent.position.y = member.y;
        member.agent.position.z = member.z;
        member.agent.material = redAgentMaterial;
        if (selected != null && member.index === selected) {
            member.agent.material = blueAgentMaterial;
        }
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
import * as THREE from 'three';
import * as PHY from 'simplePhysics';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import Stats from 'three/addons/libs/stats.module.js';
// import {agentConfig} from "./positions";
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

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

function generateCombinations(arrays, currentCombination = []) {
    // base case: if there are no more arrays, return the current combination
    if (arrays.length === 0) {
        return [currentCombination];
    }

    const results = [];

    // iterate over the elements of the first array
    for (let i = 0; i < arrays[0].length; i++) {
        // add the current element to the current combination
        const nextCombination = [...currentCombination, arrays[0][i]];

        // recursively generate combinations for the remaining arrays
        const remainingArrays = arrays.slice(1);
        const remainingCombinations = generateCombinations(remainingArrays, nextCombination);

        // add the remaining combinations to the results
        results.push(...remainingCombinations);
    }

    return results;
}


const paramArray = [
    [15, 30, 17],
    [10],
    [2],
    [41],
    [1235]
];
const combinations = generateCombinations(paramArray);

// console.log(combinations);
let globalParamPointer = 0;



// createGUI();
let stats = new Stats();
document.body.appendChild(stats.dom);


let renderer, scene, camera;
let world = {
    x: 120,
    z: 120
};
const wallMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 1.0,
    color: 0x333333 // set a color to disable the transparent effect
});

const tileMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.0,
    color: 0x00ff00 // set a color to see the transparent effect
});



const start_point = {
    x: 0 - world.x / 2,
    y: 0,
    z: 0 - world.z / 2,
};
let global_frames = []; // An array to hold the frame data
let global_frame_pointer = 0;
let agentData = [];
let inactiveData = [];
let wallData = [];
// for ray to detect
let pickableObjects = [];
let pickableTiles = [];
let pickableWalkingTiles = [];
let pickableWall = [];
let sampledAgentData = [];
let tiles = [];


// GUI parameters
let max_agents = 80;
let ROWS = 0, COLUMNS = 0;


let finish = false;

function sliceArray(arr, S, E) {
    return arr.slice(S, E + 1);
}

function preAllocateAgents(){

    let agentGeom,agentMaterial, agent;

    for (let i =0;i<max_agents;i++){

        agentGeom = new THREE.CylinderGeometry(RADIUS, RADIUS, 4, 16);
        agentMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });


        agent = new THREE.Mesh(agentGeom, agentMaterial);
        agent.name = "Agent_" + i;
        agent.castShadow = true;
        agent.receiveShadow = true;
        agent.userData = {
            "index": i,
            "start_tile": null,
            "end_tile": null
        };

        pickableObjects.push(agent);
        scene.add(agent);
    }

}

function preAllocateTiles(){

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLUMNS; j++) {


            let geometry = new THREE.BoxGeometry(tile.w, WORLDUNIT * 2, tile.h);

            let material = new THREE.MeshStandardMaterial({
                transparent: true,
                opacity: 0.0,
                color: 0x00ff00 // set a color to see the transparent effect
            });

            // Create a mesh by combining the geometry and the material
            let cube = new THREE.Mesh(geometry, material);

            // Set the mesh's name and userData properties
            cube.name = "MyCube_" + i + "_" + j;
            cube.userData = {
                type: "box",
                x: tiles[i][j].x,
                y: tiles[i][j].y,
                z: tiles[i][j].z,

                r: tiles[i][j].r,
                c: tiles[i][j].c,
            };
            cube.position.set(tiles[i][j].x, tiles[i][j].y, tiles[i][j].z);
            pickableTiles.push(cube);
            scene.add(cube);

        }
    }


}






let selected = null;
let selectedObject = null;

let mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let grid, ring;
// let rows, columns;
let spotLights = {};
let topTexture;
const RADIUS = 0.4;
const WORLDUNIT = 1;
const blueAgentMaterial = new THREE.MeshLambertMaterial({
    color: 0x0000ff
});
const redAgentMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000
});

// const stats = new Stats();
// document.body.appendChild(stats.dom)

const tile = {
    w:WORLDUNIT * 2,
    h:WORLDUNIT * 2
}


const w = 10;
const h = 45;
const particle_distance = RADIUS * 2;
const epsilon = RADIUS + 0.2;
const num_points = 41;

let opening_size = 2;
let start_x_shift = 40;
let goal_x_shift = 10;

let goal_x = 0 + goal_x_shift;



function clean(){

    // console.log(text.Seed);
    agentData.length = 0;
    inactiveData.length = 0;
    wallData.length = 0;
    // pickableTiles.length = 0;
    pickableWalkingTiles.length = 0;
    pickableWall.length = 0;
    sampledAgentData.length = 0;
    global_frames.length = 0; // An array to hold the frame data
    global_frame_pointer = 0;


    // finish = true;

    selectedObject = selected = null;

}



function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

Math.seed = function (s){
    let myrng = new Math.seedrandom(s.toString());
    return function(){
        return myrng();
    };
}


// # Returns theta in [-pi/2, 3pi/2]
function generate_theta(a, b, seed){

    let u = Math.seed(seed - 3456)()  / 4.0;
    let theta = Math.atan(b / a * Math.tan(2 * Math.PI * u));
    let v = Math.seed(seed +987)();

    if (v < 0.25)
        return theta
    else if (v < 0.5)
        return Math.PI - theta
    else if (v < 0.75)
        return Math.PI + theta
    else
        return -theta
}

function radius(a, b, theta){
    return a * b / Math.sqrt((b * Math.cos(theta)) ** 2 + (a * Math.sin(theta)) ** 2);
}

function random_point(a, b, s){
    let random_theta = generate_theta(a, b, s)
    let max_radius = radius(a, b, random_theta)
    let random_radius = max_radius * Math.sqrt(Math.seed(s + 3456)())

    return [
        random_radius * Math.cos(random_theta),
        random_radius * Math.sin(random_theta)
    ]
}

function get_magnitude(vector, a){
    let r = 0;
    vector.forEach(function (item){
        r += (item / a) ** 2;
    })

    if (a > 0)
        return a * Math.sqrt(r);
    else
        return Math.sqrt(r);
}



function collision_constraint(x1, y1, x2, y2){
    let correction_x1 = 0.0;
    let correction_y1 = 0.0;
    let correction_x2 = 0.0;
    let correction_y2 = 0.0;

    let diff = [x1 - x2, y1 - y2]
    let alpha = Math.max(...diff)
    let magnitude = get_magnitude(diff, alpha)
    if (magnitude < particle_distance){
        let dist = Math.abs(particle_distance - magnitude);
        let dividedNum = num => num/magnitude;
        let unit_direct =  diff.map(dividedNum);
        if (magnitude < 0.01)
            unit_direct = [Math.sqrt(2)/2, Math.sqrt(2)/2];


        let [dx, dy] = unit_direct;
        // let d = dist * unit_direct * 0.5
        correction_x1 = dist * dx * 0.5;
        correction_y1 = dist * dy * 0.5;
        correction_x2 = -dist * dx * 0.5;
        correction_y2 = -dist * dy * 0.5;
    }

    return [correction_x1, correction_y1, correction_x2, correction_y2]
}


function convertGrid2World(r, c){



    const object_position = {
        'x': start_point.x + tile.w / 2 + r * tile.w,
        'y': 1,
        'z': start_point.z + tile.h / 2 + c * tile.h,
    }

    return [object_position['x'], object_position['z']]
}






function sliceArrayWithWindow(arr, k) {
    const windowStart = Math.floor(arr.length / 2) - Math.floor(k / 2);
    const windowEnd = windowStart + k - 1;
    return arr.slice(windowStart, windowEnd + 1);
}

let allobstacles = [];

for (let i =0; i<Math.floor(world.x / 2) ;i++){
    allobstacles.push([Math.floor(world.x / 2 / 2), i]);
}



let opening = sliceArrayWithWindow(allobstacles, opening_size);
let obstacles = allobstacles.filter(x => !opening.includes(x));

function checkContainsTuple(base, checked){
    return base.some((arr) =>
        arr.every((val, i) => val === checked[i])
    );
}


function downloadData() {
    if (global_frames.length > 0) {
        // Convert the frames array to JSON
        const json = JSON.stringify(global_frames);

        const dataName = `seed#${text.Seed}_sd#${text.left_dist2opening}_gd#${text.right_dist2opening}_os#${text.opening}_an#${text.AgentNumber}.json`

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

// define a function to start a new simulation
function startNewSimulation() {


    // console.log()
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

        finish = false;

        startDistSlider.setValue(combinations[globalParamPointer][0]);
        goalDistSlider.setValue(combinations[globalParamPointer][1]);
        openSizeSlider.setValue(combinations[globalParamPointer][2]);
        agentNumSlider.setValue(combinations[globalParamPointer][3]);
        randomSeedSlider.setValue(combinations[globalParamPointer][4]);

        globalParamPointer++;


    } else {
        // wait and check again in 1 second
        setTimeout(startNewSimulation, 1000);
    }
}


let text = {
    left_dist2opening: start_x_shift,
    right_dist2opening: goal_x_shift,
    opening: opening.length,
    AgentNumber: num_points,
    Seed:1234,
    download: downloadData,


    auto: function (){
        finish = true;

        for (let i =0; i<combinations.length+1;i++){
            startNewSimulation();
        }






    }

};



let gui = new GUI({ autoPlace: false });
let menu = gui.addFolder('folder');
const startDistSlider = menu.add(text, 'left_dist2opening', 15, 40).name('Dist2Start').onChange(function (){
    console.log("Changed");
    console.log(finish);
    clean();
    sampledAgentData =  gaussianSampling();
    loadFromAgentGUI();
    loadAgentMesh();
    changeOpening()
    performAStar();
});
const goalDistSlider = menu.add(text, 'right_dist2opening', 10, 40).name('Dist2Goal').onChange(function (){
    clean();
    sampledAgentData =  gaussianSampling();
    loadFromAgentGUI();
    loadAgentMesh();
    changeOpening()
    performAStar();
});
const openSizeSlider = menu.add(text, 'opening',  1, 50).step(1).name('Opening Size').onChange(function (){
    clean();
    sampledAgentData =  gaussianSampling();
    loadFromAgentGUI();
    loadAgentMesh();
    changeOpening()
    performAStar();
});
const agentNumSlider = menu.add(text, 'AgentNumber',  10, max_agents).step(1).name('Agent Number').onChange(function (){
    clean();
    sampledAgentData =  gaussianSampling();
    loadFromAgentGUI();
    loadAgentMesh();
    changeOpening()
    performAStar();
});
const randomSeedSlider = menu.add(text, 'Seed',  0, 65535).step(1).name('Random Seed').onChange(function (){
    clean();
    sampledAgentData =  gaussianSampling();
    loadFromAgentGUI();
    loadAgentMesh();
    changeOpening()
    performAStar();
});
const downloadButton = menu.add(text, 'download').name('Download');
menu.add(text, 'auto').name('Automate');


const customContainer = document.getElementById('my-gui-container');
customContainer.appendChild(gui.domElement);






function gaussianSampling(){
    console.log("Gaussian Sampled");
    const mx = 20;
    let real_x1, real_y1, real_x2, real_y2;
    let real_x, real_y;

    let opens = [];
    opening.forEach(function (item){
        opens.push(item[1]);
    });

    // console.log(opens);

    if (opens.length === 1) {
        [real_x, real_y] = convertGrid2World(mx, opens[0]);
    }else if (opens.length === 2){
        [real_x1, real_y1] = convertGrid2World(mx, opens[0]);
        [real_x2, real_y2] = convertGrid2World(mx, opens[1]);
        [real_x, real_y] = [(real_x1 + real_x2) / 2, (real_y1 + real_y2) / 2];
    } else if (opens.length % 2 !== 0){
        let mid = Math.floor(opens.length / 2);
        const middle = opens[mid];
        [real_x, real_y] = convertGrid2World(mx, middle);
    } else{
        let mid1 = Math.floor(opens.length / 2);
        let mid2 = Math.floor(opens.length / 2) + 1;
        [real_x1, real_y1] = convertGrid2World(mx, opens[mid1]);
        [real_x2, real_y2] = convertGrid2World(mx, opens[mid2]);
        [real_x, real_y] = [(real_x1 + real_x2) / 2, (real_y1 + real_y2) / 2];
    }

    let points = Array(text.AgentNumber).fill().map((_, index) => random_point(w, h, text.Seed + index));




    for (let i =0; i<points.length;i++){
        for (let j =0; j<points.length;j++){

            if (i === j){
                continue;
            }


            // if (j === 39){
            //     console.log();
            // }

            let p1 = points[i];
            let p2 = points[j];

            let [dx1, dy1, dx2, dy2] = collision_constraint(p1[0], p1[1], p2[0], p2[1]);

            p1[0] += dx1
            p1[1] += dy1

            p2[0] += dx2
            p2[1] += dy2

            points[i] = p1
            points[j] = p2
        }
    }

    for (let i =0; i<points.length;i++){
        let [x, y] = points[i];

        points[i] = [x - text.left_dist2opening, y];

        if (points[0] < -Math.floor(world.x / 2) - RADIUS){
            points[0] = -Math.floor(world.x / 2) - RADIUS;
        }
    }





    let goals = [];
    let goalsV2 = [];

    points.forEach(function (item, idx){
        goals.push([text.right_dist2opening, real_y - idx * (particle_distance + epsilon)])
    });


    let center_y_of_goals = (goals[0][1] + goals[goals.length-1][1]) / 2;

    let delta = Math.abs(real_y - center_y_of_goals);
    goals.forEach(function (item, idx){
        let [x, y] = item;
        goalsV2.push([x, y + delta])
    });

    // console.log(points);
    // console.log(goalsV2);

    let sampledAgent = [];
    for (let i = 0; i<points.length;i++){

        const start = points[i];
        const goal = goalsV2[i];

        const agent_data = {
            'agent_id': i,
            'x': start[0],
            'y': start[1],
            'gx': goal[0],
            'gy': goal[1]
        }

        sampledAgent.push(agent_data);
    }

    // print("Max Y: {}, Min Y: {}".format(max(np.array(goals)[:, 1]), min(np.array(goals)[:, 1])))

    return sampledAgent;
}
function changeOpening(){

    opening = sliceArrayWithWindow(allobstacles, text.opening);
    obstacles = allobstacles.filter(x => !opening.includes(x));



    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLUMNS; j++) {
            const index = i * ROWS + j;
            let cubeInScene = scene.getObjectByName("MyCube_" + i + "_" + j)

            if (checkContainsTuple(obstacles, [i, j])){
                tiles[i][j].cost = 10;

                pickableTiles[index].material.opacity = 1.0;
                pickableTiles[index].material.color.set(0x333333);

                cubeInScene.material.opacity = 1.0;
                cubeInScene.material.color.set(0x333333);

                pickableWall.push(pickableTiles[index]);
                wallData.push(pickableTiles[index].userData);

            }else {
                tiles[i][j].cost = 1;

                pickableTiles[index].material.opacity = 0.0;
                pickableTiles[index].material.color.set(0x00ff00);

                cubeInScene.material.opacity = 0.0;
                cubeInScene.material.color.set(0x00ff00);
                pickableWalkingTiles.push(pickableTiles[index]);


            }

        }
    }

}

// let goals = [[goal_x, real_y - idx * (particle_distance + epsilon)] for idx, (x, y) in enumerate(points)]

// sampledAgentData =  gaussianSampling();

// console.log(sampledAgentData);







// let points = np.array([random_point(w, h) for _ in range(num_points)])

function AStar(ts, start, end, agent) {
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


            let smoothedPathV2 = samplePointsBetweenPoints(smoothedPath, 5, agent);





            return [smoothedPath, smoothedPathV2];
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

// function cut(){
//     let world_width = world.x;
//     let world_height = world.z;
//
//     let tile_width = tile.w;
//     let tile_height = tile.h;
//
//     let Rs =   Math.floor(world_width / tile_width);
//     let Cs = Math.floor(world_height / tile_height);
//
//     if (world_width % tile_height !== 0){
//         Rs += 1;
//     }
//
//     if (world_height % tile_height !== 0){
//         Cs += 1;
//     }
//
//     return [Rs, Cs];
// }

function gridization(){

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

    [ROWS, COLUMNS] = [Rs, Cs];

    const basicCost = 1;

    for (let i = 0; i < ROWS; i++) {
        tiles[i] = [];

        for (let j = 0; j < COLUMNS; j++) {

            const object_position = {
                x: start_point.x + WORLDUNIT + i * tile.w,
                y: 1,
                z: start_point.z + WORLDUNIT + j * tile.h,
            };



            tiles[i][j] = new Tile(i, j, object_position.x, object_position.y, object_position.z, basicCost);


        }
    }
}

// renderer
renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; //
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);






function init() {

    // stats = new Stats();




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


    // topTexture = loader.load('resources/triangle2.png');
    // //topTexture.wrapS = THREE.RepeatWrapping;
    // //topTexture.wrapT = THREE.RepeatWrapping;
    // topTexture.magFilter = THREE.NearestFilter;
    // topTexture.repeat.set(3, 3);
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



    // world.distanceConstraints = [];


}
function addColumnAgentGroup(agentData, numAgents, spacing, startPos, goalPos, velocityMagnitude, direction) {
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
            modifier:1,
            move: true,
        });
        i += 1;
    }
}
function addOneAgents(agentData, id, startPos, goalPos, velocityMagnitude) {

    let vx = 0,vz = 0;
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
        modifier:1,
        path : null,
        path_index: 0,
        correction: false,

    });

}
function loadFromAgentGUI(){
    sampledAgentData.forEach(function(item){
        addOneAgents(agentData, item.agent_id, {x:item.x, z:item.y}, {x:item.gx, z:item.gy}, 0.8);

    });

    for (let i = sampledAgentData.length; i<max_agents; i++){
        addOneAgents(inactiveData, i, {x:world.x, z:world.z}, {x:world.x, z:world.z}, 0.8);

    }
}
function loadAgentMesh(){

    agentData.forEach(function (item){
        item.agent = scene.getObjectByName("Agent_" + item.index);
        item.agent.position.x = item.x;
        item.agent.position.y = item.y;
        item.agent.position.z = item.z;
        item.agent.material.color.set(0xff0000);

    });

    inactiveData.forEach(function (item){
        item.agent = scene.getObjectByName("Agent_" + item.index);
        item.agent.position.x = item.x;
        item.agent.position.y = item.y;
        item.agent.position.z = item.z;
        item.agent.material.color.set(0xff0000);

    });



}




function samplePointsBetweenPoints(points, m, a) {
    // Initialize an array to store the sampled points
    const sampledPoints = [];

    // Iterate through the array of points
    for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];

        // Extracting x and y coordinates from point1 and point2
        const [x1, y1] = [point1.x, point1.z];
        const [x2, y2] = [point2.x, point2.z];

        sampledPoints.push([x1, y1]);

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
    sampledPoints.push([a.goal_x, a.goal_z]);

    // Return the array of sampled points
    return sampledPoints;
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
    performAStar();


}

function performAStar() {

    for (let i =0; i<agentData.length;i++){

        selected = i;


        const a = agentData[selected]

        selectedObject = pickableObjects[selected]



        for (let i = 0; i< ROWS;i++) {
            for (let j = 0; j < COLUMNS; j++) {
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



        const index = r * ROWS + c;

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



        const [path, smoothPath] = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile, a);

        // let copy_path = deepCloneArray(path);

        path.forEach(function (G, index) {

            if (index === 0 || index === path.length-1 ){
                pickableTiles[G.r * world.x / tile.w + G.c].material.opacity = 0.5;
            }
        });


        // console.log(copy_path);

        agentData[selected].path = smoothPath;
        agentData[selected].path_index = 0;
        agentData[selected].simEnd = false;
    }

}


function mouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);



    // console.log(pickableObjects);
    selected = null;
    var intersects = raycaster.intersectObjects(pickableObjects, false);
    console.log(intersects);
    for (var i = 0; i < intersects.length; i++) {
        /* TODO finish this part as 
         */
        selectedObject = intersects[i].object;

        selected = selectedObject.userData.index;

        break;
    }
}

function render() {
    renderer.render(scene, camera);
}


function animate() {
    requestAnimationFrame(animate);
    PHY.step(RADIUS, agentData, pickableWall, world, WORLDUNIT);

    let baseFlag = true;
    agentData.forEach(function (agent, index){

        if (agent.simEnd === null){
            baseFlag = baseFlag && false;
            return null;
        }

        baseFlag = baseFlag && agent.simEnd;

        if(agent.simEnd === true){
            agent.agent.material.color.set(0x00ff00);
        }

    })


    if (!baseFlag && global_frame_pointer < 10000){

        // Generate the frame data for the specified frame
        global_frames[global_frame_pointer] = {
            frame: global_frame_pointer,
            agents: agentData.map(agent => ({
                id: agent.index,
                x: agent.x,
                y: agent.y,
                z: agent.z,
            })),
        };


        global_frame_pointer++;


        finish = false;
    }

    if (baseFlag){
        finish = true;

    }


    agentData.forEach(function(member) {

        if (member.agent){
            member.agent.position.x = member.x;
            member.agent.position.y = member.y;
            member.agent.position.z = member.z;
            // member.agent.material = redAgentMaterial;
            // if (selected != null && member.index === selected) {
            //     member.agent.material = blueAgentMaterial;
            // }
            /* TODO finish this part for spotlight agents


             */
        }


    });
    render();
    stats.update()


}

init();
preAllocateAgents();
gridization();
preAllocateTiles();

sampledAgentData =  gaussianSampling();
loadFromAgentGUI();
loadAgentMesh();
changeOpening();



window.addEventListener("resize", onWindowResize);
// window.addEventListener("click", mouseDown, false);
// window.addEventListener("mousemove", mouseMove, false);
// window.addEventListener("contextmenu", rightClick, false);
// document.getElementById('download-btn').addEventListener('click', downloadSimData, false);
// performAStar();
// render();
animate();
performAStar();
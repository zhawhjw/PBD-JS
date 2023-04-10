import * as THREE from 'three';
import * as PHY from 'simplePhysics';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import Stats from 'three/addons/libs/stats.module.js';

import * as A from "agentConfiguration"
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



//
// let gui;
// const api = {
//     state: 'Noise',
//     camera: 'Camera'
// };
// function createGUI() {
//     // TODO append your noise name to the states list below
//     const states = ['Rule-Based', 'Random', 'Blue Noise'];
//     const cameras = ['Top View', 'FPS'];
//     gui = new GUI();
//     const statesFolder = gui.addFolder('States');
//     const camerasFolder = gui.addFolder('Cameras');
//     const clipCtrl = statesFolder.add(api, 'state').options(states);
//     const cameraCtrl = camerasFolder.add(api, 'camera').options(cameras);
//     cameraCtrl.onChange(function() {
//
//     });
//     clipCtrl.onChange(function() {
//         // switchNoise(api.state);
//     });
//     statesFolder.open();
// }
//
// createGUI();
let stats = new Stats();
document.body.appendChild(stats.dom);


let renderer, scene, camera;
let world = {
    x: 100,
    z: 100
};



const start_point = {
    x: 0 - world.x / 2,
    y: 0,
    z: 0 - world.z / 2,
};
let global_frames = []; // An array to hold the frame data
let global_frame_pointer = 0;
let agentData = [];
let wallData = [];
// for ray to detect
let pickableObjects = [];
let pickableTiles = [];
let pickableWalkingTiles = [];
let pickableWall = [];

let sampledAgentData = [];


let tiles = [];

let selected = null;
let selectedObject = null;

let mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let grid, ring;
let rows, columns;
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
const epsilon = 0.4;
const num_points = 40;

let opening_size = 2;
let start_x_shift = 40;
let goal_x_shift = 10;

let goal_x = 0 + goal_x_shift;


// renderer = new THREE.WebGLRenderer();
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; //
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

function clean(){

    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }


    console.log('dispose renderer!')
    renderer.dispose()

    scene.traverse(object => {
        if (!object.isMesh) return

        console.log('dispose geometry!')
        object.geometry.dispose()

        if (object.material.isMaterial) {
            cleanMaterial(object.material)
        } else {
            // an array of materials
            for (const material of object.material) cleanMaterial(material)
        }
    })

    const cleanMaterial = material => {
        console.log('dispose material!')
        material.dispose()

        // dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key]
            if (value && typeof value === 'object' && 'minFilter' in value) {
                console.log('dispose texture!')
                value.dispose()
            }
        }
    }



    agentData.length = 0;
    wallData.length = 0;
    pickableObjects.length = 0;
    pickableTiles.length = 0;
    pickableWalkingTiles.length = 0;
    pickableWall.length = 0;
    tiles.length = 0;
    sampledAgentData.length = 0;
    global_frames.length = 0; // An array to hold the frame data
    global_frame_pointer = 0;

    spotLights = {};
    for (let prop in spotLights) {
        if (spotLights.hasOwnProperty(prop)) {
            delete spotLights[prop];
        }
    }

    camera  = null;
    ring = grid = selectedObject = selected = rows = columns = null;
    topTexture = null;



    // removeAllChildNodes(document.body);


}

// Math.seed = function(s) {
//     let mask = 0xffffffff;
//     let m_w  = (123456789 + s) & mask;
//     let m_z  = (987654321 - s) & mask;
//
//     return function() {
//         m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
//         m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
//
//         let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
//         result /= 4294967296;
//         return result;
//     }
// }

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

let allobstacles = [
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
    [20, 20],
    [20, 21],
    [20, 22],
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
let opening = sliceArrayWithWindow(allobstacles, opening_size);
let obstacles = allobstacles.filter(x => !opening.includes(x));

function checkContainsTuple(base, checked){
    return base.some((arr) =>
        arr.every((val, i) => val === checked[i])
    );
}


let text = {
    left_dist2opening: start_x_shift,
    right_dist2opening: goal_x_shift,
    opening: opening.length,
    AgentNumber: num_points,
    Seed:1234
};

// let myRandomFunction = Math.seed(text.Seed);
// let randomNumber = myRandomFunction();

let gui = new GUI({ autoPlace: false });
let menu = gui.addFolder('folder');
menu.add(text, 'left_dist2opening', 0, 40).name('Dist2Start').onChange(function (){});
menu.add(text, 'right_dist2opening', 0, 40).name('Dist2Goal').onChange(function (){});
menu.add(text, 'opening',  1, 50).step(1).name('Opening Size').onChange(function (){
    clean();
    init();
    gridization();
});
menu.add(text, 'AgentNumber',  10, 80).step(1).name('Agent Number').onChange(function (){});
menu.add(text, 'Seed',  0, 65535).step(1).name('Random Seed').onChange(function (){
    // myRandomFunction = Math.seed(text.Seed);
    // randomNumber = myRandomFunction();
    // console.log(randomNumber);
    clean();
    init();
    gridization();
    // render();
});

const customContainer = document.getElementById('my-gui-container');
customContainer.appendChild(gui.domElement);

const wall_material = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 1.0,
    color: 0x333333 // set a color to disable the transparent effect
});


const transparency_material = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.0,
    color: 0x00ff00 // set a color to see the transparent effect
});


function gaussianSampling(){
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

    console.log(real_x + ", " + real_y);
// print("{} {}".format(real_x, real_y))




    let points = Array(num_points).fill().map((_, index) => random_point(w, h, text.Seed + index));
// console.log(array);

    for (let i =0; i<points.length;i++){
        for (let j =0; j<points.length;j++){

            if (i === j){
                continue;
            }


            if (j === 39){
                console.log();
            }

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

        points[i] = [x - start_x_shift, y];
    }




    let goals = [];
    let goalsV2 = [];

    points.forEach(function (item, idx){
        goals.push([goal_x, real_y - idx * (particle_distance + epsilon)])
    });


    let center_y_of_goals = (goals[0][1] + goals[goals.length-1][1]) / 2;

    let delta = Math.abs(real_y - center_y_of_goals);
    goals.forEach(function (item, idx){
        let [x, y] = item;
        goalsV2.push([x, y + delta])
    });

    console.log(points);
    console.log(goalsV2);

    let sampledAgent = [];
    for (let i = 0; i<points.length;i++){

        const start = points[i];
        const goal = goalsV2[i];

        const agent_data = {
            'agent_id': i + 1,
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

// let goals = [[goal_x, real_y - idx * (particle_distance + epsilon)] for idx, (x, y) in enumerate(points)]


// console.log(sampledAgentData);







// let points = np.array([random_point(w, h) for _ in range(num_points)])

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


            let smoothedPathV2 = samplePointsBetweenPoints(smoothedPath, 5);





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
                material = wall_material;


            }else {
                material = transparency_material;
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

// renderer
renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; //
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function init() {

    // stats = new Stats();

    allobstacles = [
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
        [20, 20],
        [20, 21],
        [20, 22],
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
    opening = sliceArrayWithWindow(allobstacles, text.opening);
    obstacles = allobstacles.filter(x => !opening.includes(x));



    sampledAgentData =  gaussianSampling();



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

                move: true,
            });
            i += 1;
        }
    }
    // var myrng = new Math.seedrandom('hello.');
    // console.log(myrng());                // Always 0.9282578795792454
    // console.log(myrng());

    // function defaultAgentConfiguration(){
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 30,
    //             z: 45
    //         }, {
    //             x: -35,
    //             z: 45
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 30,
    //             z: 40
    //         }, {
    //             x: -35,
    //             z: 40
    //         },
    //         0.8, "X", );
    //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 30,
    //             z: 35
    //         }, {
    //             x: -35,
    //             z: 35
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 30,
    //             z: 30
    //         }, {
    //             x: -35,
    //             z: 30
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 30,
    //             z: 25
    //         }, {
    //             x: -35,
    //             z: 25
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: 20
    //         }, {
    //             x: -35,
    //             z: 20
    //         },
    //         0.8, "X", );
    //
    //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: 15
    //         }, {
    //             x: -35,
    //             z: 15
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: 10
    //         }, {
    //             x: -35,
    //             z: 10
    //         },
    //         0.8, "X", );
    //
    //     // new agent
    //     //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: 5
    //         }, {
    //             x: -35,
    //             z: 5
    //         },
    //         0.8, "X", );
    //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: 0
    //         }, {
    //             x: -35,
    //             z: 0
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -5
    //         }, {
    //             x: -35,
    //             z: -5
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -10
    //         }, {
    //             x: -35,
    //             z: -10
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -15
    //         }, {
    //             x: -35,
    //             z: -15
    //         },
    //         0.8, "X", );
    //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -20
    //         }, {
    //             x: -35,
    //             z: -20
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -25
    //         }, {
    //             x: -35,
    //             z: -25
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -30
    //         }, {
    //             x: -35,
    //             z: -30
    //         },
    //         0.8, "X", );
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -35
    //         }, {
    //             x: -35,
    //             z: -35
    //         },
    //         0.8, "X", );
    //
    //
    //     addColumnAgentGroup(agentData, 4, RADIUS * 4, {
    //             x: 25,
    //             z: -40
    //         }, {
    //             x: -35,
    //             z: -40
    //         },
    //         0.8, "X", );
    // }
    // defaultAgentConfiguration();

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

        });

    }
    function loadFromAgentGUI(){
        sampledAgentData.forEach(function(item, index){

            addOneAgents(agentData, item.agent_id, {x:item.x, z:item.y}, {x:item.gx, z:item.gy}, 0.8);

        });
    }
    loadFromAgentGUI();

    // function loadFromAgentData(){
    //     A.agentConfig().forEach(function(item, index){
    //
    //         addOneAgents(agentData, item.agent_id, {x:item.x, z:item.y}, {x:item.gx, z:item.gy}, 0.8);
    //
    //     });
    // }
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






}



// Handle the button click event
function downloadSimData() {


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
    sampledPoints.push([ex1, ey1]);

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



        const [path, smoothPath] = AStar(tiles, selectedObject.userData.start_tile, selectedObject.userData.end_tile);

        // let copy_path = deepCloneArray(path);

        path.forEach(function (G, index) {
            // pickableTiles[G.r * world.x / tile.w + G.c].material.opacity = 0.5;
            // if (index === 0 || index === path.length-1 ){
            //
            // }


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
    PHY.step(RADIUS, agentData, pickableWall, world, wallData, WORLDUNIT);
    // const frameNumber = parseInt(document.getElementById('frame').value);

    let baseFlag = true;
    agentData.forEach(function (agent, index){

        if (agent.simEnd === null){
            baseFlag = baseFlag && false;
            return null;
        }

        baseFlag = baseFlag && agent.simEnd;
    })


    if (!baseFlag && global_frame_pointer < 10000){

        // Generate the frame data for the specified frame
        const frameData = {
            frame: global_frame_pointer,
            agents: agentData.map(agent => ({
                id: agent.index,
                x: agent.x,
                y: agent.y,
                z: agent.z,
            })),
        };
        global_frames[global_frame_pointer] = frameData;


        global_frame_pointer++;
    }


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
gridization();
window.addEventListener("resize", onWindowResize);
window.addEventListener("click", mouseDown, false);
window.addEventListener("mousemove", mouseMove, false);
window.addEventListener("contextmenu", rightClick, false);
document.getElementById('download-btn').addEventListener('click', downloadSimData, false);
render();
animate();
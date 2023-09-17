// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");
//
// // Define grid properties
// const gridCount = 10;
// const gridWidth = canvas.width / gridCount;
// const gridHeight = canvas.height / gridCount;
//
// // Initialize grid colors to white
// const gridColors = Array.from({ length: gridCount }, () =>
//     Array.from({ length: gridCount }, () => "white")
// );
//
// // Draw grids with specified colors
// function drawGrids() {
//     for (let i = 0; i < gridCount; i++) {
//         for (let j = 0; j < gridCount; j++) {
//             ctx.fillStyle = gridColors[i][j];
//             ctx.fillRect(i * gridWidth, j * gridHeight, gridWidth, gridHeight);
//         }
//     }
//
//     // Call function to visualize random numbers on grids
//     visualizeRandomNumbers();
// }
//
// // Randomize the color of the clicked grid
// function randomizeGridColor(event) {
//     const x = Math.floor(event.offsetX / gridWidth);
//     const y = Math.floor(event.offsetY / gridHeight);
//     gridColors[x][y] = `rgb(${Math.floor(
//         Math.random() * 256
//     )}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
//         Math.random() * 256
//     )})`;
//     drawGrids();
// }
//
// // Add event listener to canvas to change grid color on click
// canvas.addEventListener("click", randomizeGridColor);
//
// // Add event listener to button to randomize all grid colors
// const randomizeBtn = document.getElementById("randomize-btn");
// randomizeBtn.addEventListener("click", () => {
//     for (let i = 0; i < gridCount; i++) {
//         for (let j = 0; j < gridCount; j++) {
//             gridColors[i][j] = `rgb(${Math.floor(
//                 Math.random() * 256
//             )}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
//                 Math.random() * 256
//             )})`;
//         }
//     }
//     drawGrids();
// });
//
// // Visualize random numbers on each grid
// function visualizeRandomNumbers() {
//     for (let i = 0; i < gridCount; i++) {
//         for (let j = 0; j < gridCount; j++) {
//             const x = i * gridWidth;
//             const y = j * gridHeight;
//             const number = 1;
//             ctx.fillStyle = "black";
//             ctx.font = "20px Arial";
//             ctx.fillText(number, x + gridWidth / 2, y + gridHeight / 2);
//         }
//     }
// }
//
// import * as p5 from 'p5';

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}
class FlowField {
    constructor(width, height, resolution, destinations) {
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.destinations = destinations;
        this.n = Math.floor(width / resolution);
        this.m = Math.floor(height / resolution);
        this.field = this.createField();
    }

    createField() {
        const field = [];

        for (let i = 0; i < this.n; i++) {
            const column = [];

            for (let j = 0; j < this.m; j++) {
                const destination = this.getClosestDestination(i, j);
                const angle = p5.noise(destination.x / 100, destination.y / 100);
                const vector = p5.Vector.fromAngle(angle);
                column.push(vector);
            }

            field.push(column);
        }

        return field;
    }

    getClosestDestination(i, j) {
        const x = i * this.resolution + this.resolution / 2;
        const y = j * this.resolution + this.resolution / 2;
        let closestDestination = null;
        let closestDistance = Infinity;

        for (const destination of this.destinations) {
            const dist = distance(i, j, destination.i, destination.j);

            if (dist < closestDistance) {
                closestDestination = destination;
                closestDistance = dist;
            }
        }

        return p5.createVector(closestDestination.i, closestDestination.j);
    }



    lookup(i, j) {
        const column = this.field[i];
        const vector = column[j];
        return vector;
    }

    render() {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                const vector = this.lookup(i, j);
                const x = i * this.resolution;
                const y = j * this.resolution;
                const dx = x + vector.x * this.resolution / 2;
                const dy = y + vector.y * this.resolution / 2;
                p5.line(x, y, dx, dy);
            }
        }
    }
}


const WALLSIZE = WORLDUNIT;
const AGENTSIZE = RADIUS * 2;
const epsilon = 0.0001;
const timestep = 0.03;
const ITERNUM =3;
const KSI = 0.05;

// agentVelocityPlanner();

sceneEntities.forEach(function (item){
    item.prev_vx = item.vx;
    item.prev_vy = item.vy;
    item.prev_vz = item.vz;

});


if(mode!==3){
    agentVelocityPlannerV2(sceneEntities);

}else {
    agentVelocityPlannerV3();
}

sceneEntities.forEach(function (item) {

    //


    item.vx = KSI* item.vx + (1-KSI) * item.prev_vx
    item.vz = KSI* item.vz + (1-KSI) * item.prev_vz


    item.px = item.x + timestep*item.vx;
    item.pz = item.z + timestep*item.vz;
    item.py = item.y + timestep*item.vy;

});




let v1;
function setup() {
    createCanvas(100, 100);
    stroke(255, 0, 255);
    v1 = createVector(width / 2, height / 2);
}

function draw() {
    background(255);
    line(v1.x, v1.y, mouseX, mouseY);
    describe('draws a line from center of canvas to mouse pointer position.');
}
//
// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");
//
// const numRows = 10;
// const numCols = 10;
// const gridWidth = canvas.width / numCols;
// const gridHeight = canvas.height / numRows;
//
//
// const start = {x: 0, y: 0};
//
//
// const grid = [];
//
// for (let i = 0; i < numRows; i++) {
//     grid[i] = [];
//
//     for (let j = 0; j < numCols; j++) {
//         grid[i][j] = {
//
//
//             gx: i,
//             gy: j,
//
//
//
//             x: j * gridWidth,
//             y: i * gridHeight,
//
//             cx: j * gridWidth + gridWidth/ 2,
//             cy: i * gridHeight + gridHeight / 2,
//
//             parent: null,
//
//
//             color: "white",
//             value:1,
//
//             g: 1 * gridWidth,
//             h: 0,
//             f: 0,
//         };
//
//     }
// }
//
// let path = [];
// let moving_path = [];
//
// let ball = {
//
//     gx: start.x,
//     gy: start.y,
//
//     gdx: start.x,
//     gdy: start.y,
//
//     x: start.x * gridWidth + gridWidth / 2,
//     y: start.y * gridHeight + gridHeight / 2,
//
//     destX: start.x * gridWidth + gridWidth / 2,
//     destY: start.y * gridHeight + gridHeight / 2,
//
//
//
//     radius: 10,
//     color: "red",
//     moving: false,
//
//
// };
//
//
// function findPath(grid, start, end) {
//     const openSet = [start];
//     const closedSet = [];
//
//     while (openSet.length > 0) {
//         let current = openSet[0];
//         for (let i = 1; i < openSet.length; i++) {
//             if (openSet[i].f < current.f) {
//                 current = openSet[i];
//             }
//         }
//
//         if (current.gx === end.gx && current.gy === end.gy) {
//             let path = [];
//             let temp = current;
//             while (temp !== null) {
//                 path.push(temp);
//                 temp = temp.parent;
//             }
//             return path.reverse();
//         }
//
//         // place picked tile from unvisited set to visited set
//         const index = openSet.indexOf(current);
//         openSet.splice(index, 1);
//         closedSet.push(current);
//
//         const neighbors = [];
//         const x = current.gx;
//         const y = current.gy;
//
//         if (grid[x - 1] && grid[x - 1][y].value < 10) {
//             neighbors.push(grid[x - 1][y]);
//         }
//         if (grid[x + 1] && grid[x + 1][y].value < 10) {
//             neighbors.push(grid[x + 1][y]);
//         }
//         if (grid[x][y - 1] && grid[x][y - 1].value < 10) {
//             neighbors.push(grid[x][y - 1]);
//         }
//         if (grid[x][y + 1] && grid[x][y + 1].value < 10) {
//             neighbors.push(grid[x][y + 1]);
//         }
//
//         for (let i = 0; i < neighbors.length; i++) {
//             const neighbor = neighbors[i];
//
//             if (closedSet.includes(neighbor)) {
//                 continue;
//             }
//
//             const tempG = current.g + neighbor.g;
//
//             let newPath = false;
//             if (openSet.includes(neighbor)) {
//                 if (tempG < neighbor.g) {
//                     neighbor.g = tempG;
//                     newPath = true;
//                 }
//             } else {
//                 neighbor.g = tempG;
//                 newPath = true;
//                 openSet.push(neighbor);
//             }
//
//             if (newPath) {
//                 neighbor.h = heuristic(neighbor, end);
//                 neighbor.f = neighbor.g + neighbor.h;
//                 neighbor.parent = current;
//             }
//         }
//     }
//
//     return null;
// }
//
//
//
// function drawGrid() {
//     for (let i = 0; i < numRows; i++) {
//         for (let j = 0; j < numCols; j++) {
//             ctx.fillStyle = grid[i][j].color;
//             ctx.fillRect(
//                 grid[i][j].x,
//                 grid[i][j].y,
//                 gridWidth,
//                 gridHeight
//             );
//             ctx.fillStyle = "black";
//             ctx.fillText(
//                 grid[i][j].value,
//                 grid[i][j].x + gridWidth / 2,
//                 grid[i][j].y + gridHeight / 2
//             );
//         }
//     }
// }
//
// function drawBall() {
//     ctx.beginPath();
//     ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
//     ctx.fillStyle = ball.color;
//     ctx.fill();
// }
//
// let global_pointer = 0;
//
// function animate() {
//
//
//
//     if (ball.moving) {
//
//
//         if (global_pointer >= path.length){
//             ball.moving = false;
//
//             path.forEach(function (G) {
//                 grid[G.gx][G.gy].parent = null;
//             });
//
//             return;
//         }
//
//         let next = path[global_pointer];
//
//         const dx = next.cx - ball.x;
//         const dy = next.cy - ball.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//
//         if (dist <= 0.1) {
//             global_pointer++;
//
//             ball.x = next.cx;
//             ball.y = next.cy;
//
//             ball.gx = next.gx;
//             ball.gy = next.gy;
//
//         }else {
//             let velX;
//             let velY;
//
//             velX = dx / dist;
//             velY = dy / dist;
//
//             ball.x += velX * 5;
//             ball.y += velY * 5;
//         }
//
//
//
//         // const dx = ball.destX - ball.x;
//         // const dy = ball.destY - ball.y;
//         // const dist = Math.sqrt(dx * dx + dy * dy);
//         //
//         // if (dist <= 0.1) {
//         //     ball.moving = false;
//         //     return;
//         // }
//         //
//         // const velX = dx / dist;
//         // const velY = dy / dist;
//         // ball.x += velX * 5;
//         // ball.y += velY * 5;
//     }
// }
//
// canvas.addEventListener('contextmenu', (ev) => {
//     ev.preventDefault();
//     const rect = canvas.getBoundingClientRect();
//     const x = ev.clientX - rect.left;
//     const y = ev.clientY - rect.top;
//     const row = Math.floor(y / gridHeight);
//     const col = Math.floor(x / gridWidth);
//
//     if (row >= 0 && col >= 0 && row < numRows && col < numCols && ball.moving !== true) {
//         grid[row][col].value += 1;
//         grid[row][col].g = grid[row][col].value * gridWidth;
//
//         if (grid[row][col].value >= 10){
//             grid[row][col].color = "Grey";
//         }else {
//
//         }
//
//     }
//     drawGrid();
// });
//
// canvas.addEventListener("click", function (event) {
//     const rect = canvas.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;
//     const row = Math.floor(y / gridHeight);
//     const col = Math.floor(x / gridWidth);
//
//
//
//
//     if (row >= 0 && col >= 0 && row < numRows && col < numCols) {
//
//
//         ball.gdx = row;
//         ball.gdy = col;
//
//         console.log(ball.gdx + ", " + ball.gdy);
//
//         ball.destX = ball.gdy * gridHeight + gridHeight / 2;
//         ball.destY = ball.gdx * gridWidth + gridWidth / 2;
//
//         path = findPath(grid, grid[ball.gx][ball.gy], grid[ball.gdx][ball.gdy]);
//         moving_path = [...path];
//         console.log(path);
//
//         ball.moving = true;
//         global_pointer = 0;
//     }
//
//
//
// });
//
//
// function heuristic(a, b) {
//     return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// }
//
// function update() {
//     animate();
//     drawGrid();
//     drawBall();
//     requestAnimationFrame(update);
// }
//
// update();
import * as THREE from 'three';

function getPerpendicularPoints(A, B, R) {

    const perpVector = [-A[1], A[0]];
    const perpUnitVector = perpVector.map(v => v / Math.sqrt(perpVector[0] * perpVector[0] + perpVector[1] * perpVector[1]));


    const point1 = [B[0] + perpUnitVector[0] * R, B[1] + perpUnitVector[1] * R];
    const point2 = [B[0] - perpUnitVector[0] * R, B[1] - perpUnitVector[1] * R];

    return [point1, point2];
}

function isProjectedPointBetweenPoints(pointC, pointA, pointB) {

    const vectorAB = [pointB[0] - pointA[0], pointB[1] - pointA[1]];


    const vectorAC = [pointC[0] - pointA[0], pointC[1] - pointA[1]];


    const projection = [
        (vectorAC[0] * vectorAB[0] + vectorAC[1] * vectorAB[1]) / (vectorAB[0] * vectorAB[0] + vectorAB[1] * vectorAB[1]) * vectorAB[0],
        (vectorAC[0] * vectorAB[0] + vectorAC[1] * vectorAB[1]) / (vectorAB[0] * vectorAB[0] + vectorAB[1] * vectorAB[1]) * vectorAB[1]
    ];


    const pointP = [pointA[0] + projection[0], pointA[1] + projection[1]];


    const isBetweenPoints = (
        (pointP[0] >= pointA[0] && pointP[0] <= pointB[0] || pointP[0] >= pointB[0] && pointP[0] <= pointA[0]) &&
        (pointP[1] >= pointA[1] && pointP[1] <= pointB[1] || pointP[1] >= pointB[1] && pointP[1] <= pointA[1])
    );

    return isBetweenPoints;
}

function pDistance(x, y, x1, y1, x2, y2) {

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculatePerpendicularDistanceToPoint(pointP, pointA, pointB) {

    const vectorAB = [pointB[0] - pointA[0], pointB[1] - pointA[1]];


    const vectorAP = [pointP[0] - pointA[0], pointP[1] - pointA[1]];


    const projection = [
        (vectorAP[0] * vectorAB[0] + vectorAP[1] * vectorAB[1]) / (vectorAB[0] * vectorAB[0] + vectorAB[1] * vectorAB[1]) * vectorAB[0],
        (vectorAP[0] * vectorAB[0] + vectorAP[1] * vectorAB[1]) / (vectorAB[0] * vectorAB[0] + vectorAB[1] * vectorAB[1]) * vectorAB[1]
    ];

    // const r =


    // const p = [projection[0] + pointA[0], projection[1] + pointB[1]];
    const distance = Math.sqrt(Math.pow(vectorAP[0] - projection[0], 2) + Math.pow(vectorAP[1] - projection[1], 2));
    // const d = distance(p[0], p[1], pointP[0], pointP[1]);

    return distance;
}


function blockedVision(maxVision, velocity, left_pole, right_pole, other_left_pole, other_right_pole){
    // const velocity = [0, 1];
    // const center = [0, 0];
    // const R = 2;

    // const [point1, point2] = getPerpendicularPoints(velocity, center, maxVision);
    // const left_pole = point1;
    // const right_pole = point2;

    // const other_left_pole = [1, 1];
    // const other_right_pole = [4.1, 4.1];

    const isLeft = isProjectedPointBetweenPoints(other_left_pole, left_pole, right_pole);
    const isRight = isProjectedPointBetweenPoints(other_right_pole, left_pole, right_pole);


    if(isLeft && isRight){
        return maxVision;
    }else if(isLeft){
        // return pDistance(other_left_pole[0], other_left_pole[1], right_pole[0], right_pole[1], right_pole[0] + velocity[0], right_pole[1] + velocity[1]);
        return calculatePerpendicularDistanceToPoint(other_left_pole, right_pole, [right_pole[0] + velocity[0], right_pole[1] + velocity[1]]);
    }else if (isRight){
        // return pDistance(other_right_pole[0], other_right_pole[1], left_pole[0], left_pole[1], left_pole[0] + velocity[0], left_pole[1] + velocity[1]);
        return calculatePerpendicularDistanceToPoint(other_right_pole, left_pole, [left_pole[0] + velocity[0], left_pole[1] + velocity[1]]);
    }else {
        return 0;
    }
}


function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    var d = Math.abs((y2-y1)*cx - (x2-x1)*cy + x2*y1 - y2*x1) / Math.sqrt((y2-y1)**2 + (x2-x1)**2);
    return d <= r;
}

// Example usage
// console.log(lineIntersectsCircle(0, 0, 4, 4, 2, 2, 3)); // true
// console.log(lineIntersectsCircle(0, 0, 4, 4, 0, 4, 1)); // false

function findClosestPoints(pointsArray, A) {
    let closestPoints = [];
    let closestDistances = [Number.MAX_VALUE, Number.MAX_VALUE];

    for (let i = 0; i < pointsArray.length; i++) {

        let p = pointsArray[i];

        let distance = Math.sqrt(Math.pow(A[0] - p.x, 2) + Math.pow(A[1] - p.z, 2));

        if (distance < closestDistances[1]) {
            if (distance < closestDistances[0]) {
                closestDistances[1] = closestDistances[0];
                closestDistances[0] = distance;
                closestPoints[1] = closestPoints[0];
                closestPoints[0] = p;
            } else {
                closestDistances[1] = distance;
                closestPoints[1] = p;
            }
        }
    }
    return closestPoints;
}




export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}




export function step(RADIUS, sceneEntities, obstacleEntities, world, WORLDUNIT, mode, opens=[]) {



    // console.log(matrix);
  /*  -----------------------  */
  /*  TODO modify lines below  */
  /*  -----------------------  */
  function distanceConstraint(agent_i,agent_j, desiredDistance)
  {
    const agentCentroidDist = distance(agent_i.px, agent_i.pz, 
                agent_j.px, agent_j.pz );
    const agentDist = agentCentroidDist - desiredDistance;
    const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist; 
    const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist; 
    const agent_i_scaler = 0.1*agent_i.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;
    const agent_j_scaler = 0.1*agent_j.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;
    if(Math.abs(agentDist) > epsilon )
    {
        agent_i.px +=  agent_i_scaler * dir_x
        agent_i.pz +=  agent_i_scaler * dir_z
        agent_j.px += - agent_j_scaler * dir_x
        agent_j.pz += - agent_j_scaler * dir_z
    } 
  }
    function degreeInBetween(vector1,vector2 ){

        // calculate the dot product of the two vectors
        const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];

        // calculate the magnitude (length) of each vector
        const mag1 = Math.sqrt(vector1[0] * vector1[0] + vector1[1] * vector1[1]);
        const mag2 = Math.sqrt(vector2[0] * vector2[0] + vector2[1] * vector2[1]);

        // calculate the angle in radians using the dot product and magnitudes
        const angleRad = Math.acos(dotProduct / (mag1 * mag2));

        // convert the angle to degrees
        return angleRad * 180 / Math.PI;
      }


    function degreeBetween(vector1, vector2){
        // const vector1 = { x: 0.5, y: 0.866 }; // Example vector
        // const vector2 = { x: -0.707, y: 0.707 }; // Example vector

        // Calculate the dot product of the two vectors
        const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

        // Calculate the magnitude (length) of the vectors
        const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

        // Calculate the cosine of the angle between the vectors
        const cosTheta = dotProduct / (magnitude1 * magnitude2);

        // Calculate the angle in radians
        const angleRad = Math.acos(cosTheta);

        // Convert radians to degrees
        const angleDeg = angleRad * (180 / Math.PI);

        // Calculate the signed angle in degrees using the atan2 function
        const signedAngleDeg = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);

        // Ensure the angle is between 0 and 360 degrees
        const normalizedAngleDeg = (signedAngleDeg >= 0) ? signedAngleDeg : (signedAngleDeg + 2 * Math.PI) * (180 / Math.PI);

        // console.log("Angle between vectors (in degrees):", angleDeg);
        // console.log("Signed angle between vectors (in degrees):", normalizedAngleDeg);

        return angleDeg;

    }

    const d1 = 0.3;
    const d2 = 1.0;

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




    function setScalar(follower, followed){

        // if(follower.exit === null || follower.path === null){
        //     return;
        // }
        //
        // let keypoint = follower.path[follower.key_index];
        // let direction = [keypoint[0] - follower.x, keypoint[1] - follower.z];
        //
        //
        // let itself = {vx: follower.vx, vz:follower.vz};
        // if (follower.vx ===0 && follower.vz ===0){
        //     itself.vx = direction[0];
        //     itself.vz = direction[1];
        //
        // }
        // const [right_pole, left_pole] = getPerpendicularPoints([itself.vx, itself.vz], [follower.x, follower.z],  RADIUS);
        //
        //
        //
        // let other = {vx: followed.vx, vz:followed.vz};
        // if (followed.vx ===0 && followed.vz ===0){
        //     other.vx = direction[0];
        //     other.vz = direction[1];
        //
        // }
        // const [other_right_pole, other_left_pole] = getPerpendicularPoints([other.vx, other.vz], [followed.x, followed.z],  RADIUS);



        const activate_dist = d2 + follower.variance;

        const agentCentroidDist = distance(follower.x, follower.z, followed.x, followed.z );

        const follower_v = {x: follower.vx, y:follower.vz};
        const follower_uv = getUnitVector(follower_v);

        const dir = {x: followed.x - follower.x, y:followed.z - follower.z};
        const followed_ud = getUnitVector(dir);

        const followed_v = {x: followed.vx, y:followed.vz};
        const followed_uv = getUnitVector(followed_v);

        // const follower_v = {x: follower.vx, y:follower.vz};
        const follower_ug = getUnitVector({x: follower.goal_x - follower.x, y:follower.goal_z - follower.z});

        // const follower_v = {x: follower.vx, y:follower.vz};
        const followed_ug = getUnitVector({x: followed.goal_x - followed.x, y:followed.goal_z - followed.z});


        let flag1 = (agentCentroidDist - 2 * RADIUS) < activate_dist; // censor distance range
        let flag2 = (degreeBetween(follower_uv, followed_ud) < 60); // censor angle range
        let flag3 = (degreeBetween(follower_ug, followed_ug) > 90); // to solve face to face condition
        let flag4 = followed.simEnd; // to make sure agent can move if front agent ends the simulation


        if( flag1 && flag2 && !flag3 && !flag4){

            let delta =  (agentCentroidDist - 2 * RADIUS);

            let scalar = normalize(1.5, activate_dist, delta);

            if(scalar < follower.density){
                follower.density = scalar;
                // follower.waitAgent = followed;

                // const i2pi = [follower.px - follower.x, follower.pz - follower.z];
                // const mag_i2pi = Math.sqrt(i2pi[0]**2 + i2pi[1]**2);
                // // const unit_i2pi = getUnitVector({x: i2pi[0], y: i2pi[1]})
                //
                // const i2pj = [followed.px - follower.x, followed.pz - follower.z];
                // // const mag_i2pj = Math.sqrt(i2pj[0]**2 + i2pj[1]**2);
                // const unit_i2pj = getUnitVector({x: i2pj[0], y: i2pj[1]})
                //
                // // const distScalar = mag_pj2i / mag_pi2i;
                // const followPoint = {
                //     x: follower.x + unit_i2pj.x * mag_i2pi,
                //     z: follower.z + unit_i2pj.y * mag_i2pi
                // };
                //
                // const test = Math.sqrt((followPoint.x - follower.x)**2 + (followPoint.z - follower.z)**2);
                //
                // if(Math.abs(mag_i2pi - test) > 0.01){
                //     console.log(mag_i2pi + " <> " + test);
                //
                // }
                //
                //
                //
                // follower.px = followPoint.x;
                // follower.pz = followPoint.z;

            }

            // if (follower.index === 0){
            //     console.log();
            // }

            // const blocked = blockedVision(2* RADIUS, [itself.vx, itself.vz], left_pole, right_pole, other_left_pole, other_right_pole);
            // console.log(blocked);

            // if (blocked <= RADIUS){
            //     follower.density = 1;
            // }


        }else {
            follower.density = 1;
            // follower.waitAgent = null;
        }


    }

    function setScalarByLeader(follower, followed){

        if(follower.waitAgent){

            follower.goal_x = follower.waitAgent.x
            follower.goal_z = follower.waitAgent.z


            let delta =  (agentCentroidDist - 2 * RADIUS);

            let scalar = normalize(1.5, activate_dist, delta);

            if(scalar < follower.density){
                follower.density = scalar;
            }

        }else {
            follower.density = 1;

        }

    }

    function followingV2(agent_i, agent_j){


        setScalar(agent_i, agent_j);
        setScalar(agent_j, agent_i);

        // if(agent_i.density < 0.2){
        //     agent_i.density = 0;
        // }


        agent_i.px = agent_i.x + (agent_i.px - agent_i.x) * agent_i.density;
        agent_i.pz = agent_i.z + (agent_i.pz - agent_i.z) *  agent_i.density;

        agent_j.px = agent_j.x + (agent_j.px - agent_j.x) * agent_j.density;
        agent_j.pz = agent_j.z + (agent_j.pz - agent_j.z) *  agent_j.density;




    }

    function collisionConstraint(agent_i,agent_j, i, j, m)
    {

        const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );

        const AgentDist = agentCentroidDist - AGENTSIZE;

        const agent_i_goal_distance = distance(agent_i.px, agent_i.pz, agent_i.goal_x, agent_i.goal_z );
        const agent_j_goal_distance = distance(agent_j.px, agent_j.pz, agent_j.goal_x, agent_j.goal_z );

        const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist;
        const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;


        let agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;
        let agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;


        if(agentCentroidDist - AGENTSIZE < 0) {

            // if(agent_j.index === 5){
            //     console.log();
            // }

            if (agent_i_goal_distance > agent_j_goal_distance) {
                agent_i_scaler = agent_i_scaler * 2;

            } else if (agent_i_goal_distance < agent_j_goal_distance) {
                agent_j_scaler = agent_j_scaler * 2;
            }



            agent_i.px += agent_i_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z;
            agent_j.px += -agent_j_scaler * dir_x;
            agent_j.pz += -agent_j_scaler * dir_z;

        }
    }

    function keepDistanceConstraint(agent_i,agent_j, desiredDistance)
    {

        if(agent_i.path === null || agent_j.path === null){
            return;
        }

        const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );

        const AgentDist = agentCentroidDist - AGENTSIZE - desiredDistance;

        const agent_i_goal_distance = distance(agent_i.path[agent_i.path.length-1].x, agent_i.path[agent_i.path.length-1].z, agent_i.px, agent_i.pz );
        const agent_j_goal_distance = distance(agent_j.path[agent_j.path.length-1].x, agent_j.path[agent_j.path.length-1].z, agent_j.px, agent_j.pz );

        const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist;
        const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;


        let agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;
        let agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;


        if(agentCentroidDist - AGENTSIZE < desiredDistance) {

            if (agent_i_goal_distance > agent_j_goal_distance) {

                agent_i.px += agent_i_scaler * dir_x + agent_j_scaler * dir_x;
                agent_i.pz += agent_i_scaler * dir_z + agent_j_scaler * dir_z;


                // agent_i_scaler = agent_i_scaler * 2;

            } else if (agent_i_goal_distance < agent_j_goal_distance) {
                agent_j.px += - agent_j_scaler * dir_x - agent_i_scaler * dir_x;
                agent_j.pz += - agent_j_scaler * dir_z - agent_i_scaler * dir_z;

            }else {
                agent_i.px += agent_i_scaler * dir_x;
                agent_i.pz += agent_i_scaler * dir_z;
                agent_j.px += -agent_j_scaler * dir_x;
                agent_j.pz += -agent_j_scaler * dir_z;
            }






        }

    }

    function collisionConstraintWithWall(agent_i,wall_j_object, i, j)
    {

        const wall_j = wall_j_object.userData;
        const wall_invmass = 0.5;

        const agentCentroidDist = distance(agent_i.px, agent_i.pz, wall_j.x, wall_j.z );
        const agentDist = agentCentroidDist - AGENTSIZE / 2 - WALLSIZE;
        const dir_x = (wall_j.x- agent_i.px)/agentCentroidDist;
        const dir_z = (wall_j.z- agent_i.pz)/agentCentroidDist;
        const agent_i_scaler = agent_i.invmass/(agent_i.invmass + wall_invmass) * agentDist
        const wall_j_scaler = wall_invmass /(agent_i.invmass + wall_invmass) * agentDist
        if(agentDist < 0)
        {
            // agent_i.collidewall[j] = true;
            agent_i.px += agent_i_scaler * dir_x + wall_j_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z + wall_j_scaler * dir_z ;

        }


    }




    function isOverlapping(circle, square) {
        // Calculate the distance between the centers of the circle and square
        let dx = circle.x - square.x;
        let dy = circle.y - square.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the sum of the radius of the circle and the half of the side length of the square
        let radius = circle.radius;
        let halfSide = square.side / 2;
        let sum = radius + halfSide;

        // Check if the distance is less than or equal to the sum
        return distance <= sum;
    }

    // function isInside(point, square) {
    //     // Check if the x-coordinate of the point is inside the square
    //     const isXInside = point.x > square.x && point.x < square.x + square.side;
    //
    //     // Check if the y-coordinate of the point is inside the square
    //     const isYInside = point.y > square.y && point.y < square.y + square.side;
    //
    //     // Return true if both coordinates are inside the square, false otherwise
    //     return isXInside && isYInside;
    // }

    // function lineIntersectsSquare(p1, p2, square) {
    //     // Define the coordinates of the square's corners
    //     var topLeft = { x: square.x, y: square.y };
    //     var topRight = { x: square.x + square.side, y: square.y };
    //     var bottomLeft = { x: square.x, y: square.y + square.side };
    //     var bottomRight = { x: square.x + square.side, y: square.y + square.side };
    //
    //     // Test if the line intersects any of the square's sides
    //     if (lineIntersectsLine(p1, p2, topLeft, topRight) ||
    //         lineIntersectsLine(p1, p2, topRight, bottomRight) ||
    //         lineIntersectsLine(p1, p2, bottomRight, bottomLeft) ||
    //         lineIntersectsLine(p1, p2, bottomLeft, topLeft)) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // function lineIntersectsLine(a1, a2, b1, b2) {
    //     // Calculate the slope and y-intercept of each line segment
    //     var slopeA = (a2.y - a1.y) / (a2.x - a1.x);
    //     var yInterceptA = a1.y - slopeA * a1.x;
    //     var slopeB = (b2.y - b1.y) / (b2.x - b1.x);
    //     var yInterceptB = b1.y - slopeB * b1.x;
    //
    //     // Calculate the x-coordinate of the intersection point
    //     var x = (yInterceptB - yInterceptA) / (slopeA - slopeB);
    //
    //     // Check if the intersection point is within the bounds of both line segments
    //     if ((x >= a1.x && x <= a2.x) || (x >= a2.x && x <= a1.x)) {
    //         if ((x >= b1.x && x <= b2.x) || (x >= b2.x && x <= b1.x)) {
    //             return true;
    //         }
    //     }
    //
    //     return false;
    // }

    function agentVelocityPlanner(){
        sceneEntities.forEach(function (agent_i) {
            const distToGoal = distance(agent_i.x, agent_i.z, agent_i.goal_x, agent_i.goal_z );
            if(distToGoal > RADIUS)
            {
                const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
                agent_i.vx = agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.v_pref * dir_z;
            }
            agent_i.vx = 0.9999*agent_i.vx;
            agent_i.vz = 0.9999*agent_i.vz;
        });

    }


    function agentVelocityPlannerV2(sceneEntities)  {


      // for(let i = 0; i<sceneEntities.length;i++)
    sceneEntities.forEach(function (agent_i) {



        if (agent_i.path ===null){

            const distToGoal = distance(agent_i.x, agent_i.z, agent_i.goal_x, agent_i.goal_z );

            if(distToGoal < 0.1)
            {
                agent_i.vx = 0;
                agent_i.vz = 0;

                agent_i.simEnd = true;
                agent_i.modifier = 0.2;

            }else {
                const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
                agent_i.vx =  agent_i.modifier * agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.modifier * agent_i.v_pref * dir_z;

            }


            return;
        }

        if (agent_i.path_index >= agent_i.path.length){


            agent_i.path = null;
            agent_i.path_index = 0;

            return;
        }



        const goal = agent_i.path[agent_i.path_index];
        let t = {x:goal[0], z:goal[1]};
        // let t = {x:goal.x, z:goal.z};

        const distToGoal = distance(agent_i.x, agent_i.z,
            t.x, t.z );


        if(agent_i.waitAgent!==null){
            agent_i.goal_x = agent_i.waitAgent.x;
            agent_i.goal_z = agent_i.waitAgent.z;

            const dir_x = (agent_i.goal_x - agent_i.x)/distToGoal;
            const dir_z = (agent_i.goal_z - agent_i.z)/distToGoal;
            agent_i.vx = agent_i.v_pref * dir_x;
            agent_i.vz = agent_i.v_pref * dir_z;

            // const fv = seek(agent_i, new THREE.Vector3(agent_i.goal_x, 0, agent_i.goal_z));
            // agent_i.vx = fv.x;
            // agent_i.vz = fv.z;
        }

        const flag0 = agent_i.x <= t.x
        const flag1 = isOverlapping({x:agent_i.x, y:agent_i.z, radius: agent_i.radius}, {x: t.x, y:t.z, side: 0.25 });



        if( flag1  )
        {
            agent_i.path_index ++;

        }else{
            agent_i.goal_x = t.x;
            agent_i.goal_z = t.z;
            // keepDistance(agent_i, sceneEntities, 0.5);
            const dir_x = (agent_i.goal_x - agent_i.x)/distToGoal;
            const dir_z = (agent_i.goal_z - agent_i.z)/distToGoal;
            agent_i.vx = agent_i.v_pref * dir_x;
            agent_i.vz = agent_i.v_pref * dir_z;

            // const fv = seek(agent_i, new THREE.Vector3(agent_i.goal_x, 0, agent_i.goal_z));
            // agent_i.vx = fv.x;
            // agent_i.vz = fv.z;

        }



        // for goal arrow helpler
        if (agent_i.path_index > agent_i.key_index){
            let nexit = agent_i.exit;
            agent_i.key_index = nexit.shift();
            if (agent_i.key_index === undefined){
                agent_i.key_index = agent_i.path.length-1;
            }
            agent_i.exit = nexit;
        }


    });

    }

    function agentVelocityPlannerV3(){
        // plannerMode = 3;

        if (mode!==3){
            return;
        }

        sceneEntities.forEach(function (item){


            if(item.waitAgent!==null){
                item.goal_x = item.waitAgent.x;
                item.goal_z = item.waitAgent.z;
                const distToGoal = distance(item.x, item.z, item.goal_x, item.goal_z );

                const dir_x = (item.waitAgent.x - item.x)/distToGoal;
                const dir_z = (item.waitAgent.z - item.z)/distToGoal;
                item.vx = item.v_pref * dir_x;
                item.vz = item.v_pref * dir_z;


            }else {
                item.goal_x = item.x + 999 * item.svx ;
                item.goal_z = item.z;

                const distToGoal = distance(item.x, item.z, item.goal_x, item.goal_z );

                // const dir_x = item.svx;
                // const dir_z = item.svz;
                const dir_x = (item.goal_x- item.x)/distToGoal;
                const dir_z = (item.goal_z- item.z)/distToGoal;

                item.vx = item.v_pref * dir_x;
                item.vz = item.v_pref * dir_z;
            }


        });

    }

    function agentVelocityPlannerV4(sceneEntities)  {

        // for(let i = 0; i<sceneEntities.length;i++)
        sceneEntities.forEach(function (agent_i) {


            if (agent_i.path ===null){
                return;
            }

            let goal = agent_i.path[0];
            let t = {x:goal[0], z:goal[1]};
            let distToGoal = distance(agent_i.x, agent_i.z, t.x, t.z );

            if(agent_i.path.length===1 && distToGoal < 0.01){
                agent_i.simEnd = true;
                agent_i.modifier = 0.2;

            }

            while (distToGoal < 0.01 && agent_i.path.length>1){
                agent_i.path.shift();

                goal = agent_i.path[0];
                t = {x:goal[0], z:goal[1]};
                distToGoal = distance(agent_i.x, agent_i.z, t.x, t.z );

            }


            agent_i.target = t;



            if(agent_i.waitAgent!==null){
                agent_i.goal_x = agent_i.waitAgent.x;
                agent_i.goal_z = agent_i.waitAgent.z;

                const dir_x = (agent_i.waitAgent.x - agent_i.x)/distToGoal;
                const dir_z = (agent_i.waitAgent.z - agent_i.z)/distToGoal;
                agent_i.vx = agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.v_pref * dir_z;
            }else {
                agent_i.goal_x = t.x;
                agent_i.goal_z = t.z;

                const dir_x = (agent_i.goal_x - agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z - agent_i.z)/distToGoal;
                agent_i.vx = agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.v_pref * dir_z;
            }


            // for goal arrow helpler
            // if (agent_i.path_index > agent_i.key_index){
            //     let nexit = agent_i.exit;
            //     agent_i.key_index = nexit.shift();
            //     if (agent_i.key_index === undefined){
            //         agent_i.key_index = agent_i.path.length-1;
            //     }
            //     agent_i.exit = nexit;
            // }


        });

    }

    function followingV3(agent_i){

        if (agent_i.waitAgent !== null){
            const activate_dist = agent_i.minVariance + agent_i.variance;
            const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_i.waitAgent.px, agent_i.waitAgent.pz );
            let delta =  (agentCentroidDist - 2 * RADIUS);
　
            let scalar = normalize(agent_i.minVariance, activate_dist, delta);

            agent_i.px = agent_i.x + (agent_i.px - agent_i.x) *  scalar;
            agent_i.pz = agent_i.z + (agent_i.pz - agent_i.z) *  scalar;
        }


    }


    function keepDistance(point, points, activate_dist) {
        let force = new THREE.Vector3(0, 0, 0);
        let self_pred = new THREE.Vector3(point.px, 0, point.pz);

        for (let i = 0; i < points.length; i++) {
            const checkedPoint = points[i];

            if(checkedPoint.simEnd){
                continue;
            }

            if(point.index === points[i].index){
                continue;
            }

            const agentCentroidDist = distance(point.px, point.pz, checkedPoint.px, checkedPoint.pz);

            // const follower_up = getUnitVector({x: point.px - point.x, y:point.px - point.z});
            const follower_up = getUnitVector({x: point.vx, y:point.vz});

            const followed_ud = getUnitVector({x: checkedPoint.px - point.px, y:checkedPoint.pz - point.pz});
            // const follower_uv = getUnitVector({x: point.vx, y:point.vz});

            let flag1 = (agentCentroidDist - 2 * RADIUS) < activate_dist; // censor distance range
            let flag2 = (degreeBetween(follower_up, followed_ud) < 90); // censor angle range


            if (flag1 && flag2) {

                let neighbor_pred = new THREE.Vector3(checkedPoint.px, 0, checkedPoint.pz);
                let delta = activate_dist - (agentCentroidDist - 2 * RADIUS);

                force.add(neighbor_pred.sub(self_pred).negate().normalize().multiplyScalar(delta));
            }

        }

        point.px += force.x;
        point.pz += force.z;

    }

    function closestSeeAgent(point, points, activate_dist) {
        let closest = null;
        let minDistance = Infinity;

        //
        // const follower_v = {x: point.goal_x - point.x, y:point.goal_z - point.z};
        // const follower_uv = getUnitVector(follower_v);

        for (let i = 0; i < points.length; i++) {
            const checkedPoint = points[i];

            if(point.index === checkedPoint.index){
                continue;
            }

            if(checkedPoint.simEnd){
                continue;
            }

            const agentCentroidDist = distance(point.x, point.z, checkedPoint.x, checkedPoint.z);
            const dir = {x: checkedPoint.x - point.x, y:checkedPoint.z - point.z};
            const followed_ud = getUnitVector(dir);
            const follower_ug = getUnitVector({x: point.goal_x - point.x, y:point.goal_z - point.z});
            const followed_ug = getUnitVector({x: checkedPoint.goal_x - checkedPoint.x, y:checkedPoint.goal_z - checkedPoint.z});

            let flag1 = (agentCentroidDist - 2 * RADIUS) < activate_dist; // censor distance range
            // let flag1 = d < 5; // censor distance range
            let flag2 = (degreeBetween(follower_ug, followed_ud) < 30); // censor angle range
            let flag3 = (degreeBetween(follower_ug, followed_ug) > 90); // to solve face to face condition

            if (agentCentroidDist < minDistance && flag1 && flag2 &&!flag3) {
                minDistance = agentCentroidDist;
                closest = checkedPoint;
            }


        }
        return closest;
    }

    function findLeader(){
        sceneEntities.forEach(function (item){

            let followedAgent = closestSeeAgent(item, sceneEntities, d2 + item.variance);

            if(item.simEnd){
                followedAgent = null;
            }

            if (followedAgent && followedAgent.simEnd){
                followedAgent = null;
            }

            if (mode !==3 && item.x < -11){
                followedAgent = null;
            }

            item.waitAgent = followedAgent;

        });
    }

     function seek (item, position) {
        let force = new THREE.Vector3(0, 0, 0);
        let currentVelocity = new THREE.Vector3(item.vx, 0, item.vz);
        let currentPosition = new THREE.Vector3(item.x, 0, item.z);

        let desiredVelocity = position.clone().sub(currentPosition);
        desiredVelocity.normalize().setLength(0.8).sub(currentVelocity);
        force.add(desiredVelocity);

        return force;
    }

    function separation(currentAgent, entities, obsEntities, separationRadius = 2, maxSeparation = 0.8) {
        let force = new THREE.Vector3(0, 0, 0);
        let neighborCount = 0

        for (let i = 0; i < entities.length; i++) {
            if ((entities[i].index !== currentAgent.index) && (entities[i].agent.position.distanceTo(currentAgent.agent.position) <= separationRadius)) {
                let delta = separationRadius - entities[i].agent.position.distanceTo(currentAgent.agent.position);
                force.add(entities[i].agent.position.clone().sub(currentAgent.agent.position).normalize().negate().multiplyScalar(delta* 1.2));
                neighborCount++;
            }
        }

        for (let i = 0; i < obsEntities.length; i++) {
            if ( (obsEntities[i].position.distanceTo(currentAgent.agent.position) <= separationRadius)) {
                let delta = separationRadius - obsEntities[i].position.distanceTo(currentAgent.agent.position);
                force.add(obsEntities[i].position.clone().sub(currentAgent.agent.position).normalize().negate().multiplyScalar(delta* 1.2));

                neighborCount++;
            }
        }

        // if (neighborCount !== 0) {
        //     force.divideScalar(neighborCount)
        //     force.negate();
        // }
        // force.normalize();
        // force.multiplyScalar(maxSeparation);

        return force;
    }

  /*  -----------------------  */


  const WALLSIZE = WORLDUNIT;
  const AGENTSIZE = RADIUS * 2; 
  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM =3;

  // agentVelocityPlanner();
  agentVelocityPlannerV2(sceneEntities);
  //   agentVelocityPlannerV3();
  // agentVelocityPlannerV4(sceneEntities);

  sceneEntities.forEach(function (item) {
    item.px = item.x + timestep*item.vx; 
    item.pz = item.z + timestep*item.vz; 
    item.py = item.y + timestep*item.vy;
  });


  let pbdIters = 0;
  let agent_a, agent_b, desDistance, i,j, idx = 0;


    // distance keeping
    //     sceneEntities.forEach(function (item){
    //         keepDistance(item, sceneEntities, item.minVariance);
    //     });

    // i=0;
    // while(i<sceneEntities.length)
    // {
    //
    //     j=i+1;
    //
    //     while(j<sceneEntities.length)
    //     {
    //
    //
    //         keepDistanceConstraint(sceneEntities[i],sceneEntities[j], 0.5);
    //
    //         j+=1;
    //     }
    //     i+=1
    // }


    // sceneEntities.forEach(function (item){
    //     let deltaPosition = separation(item, sceneEntities, obstacleEntities, 2.5, 1.2);
    //     item.px = item.px + timestep * deltaPosition.x ;
    //     item.pz = item.pz + timestep * deltaPosition.z ;
    //     // item.py = item.y + timestep*deltaPosition.vy;
    // });


    // found proper leader for each agent
    findLeader();

    // execute following constraint
    sceneEntities.forEach(function (item){
      followingV3(item);
    });

    // i=0;
    // while(i<sceneEntities.length)
    // {
    //
    //     let exitsDist = [];
    //     for (let k =0;k<opens.length;k++){
    //         const exitPath = opens[k];
    //         // const dist = projectionDistanceV2(exitPath.dir, sceneEntities[i]);
    //         const dist = Math.abs(sceneEntities[i].z - exitPath.z);
    //         exitsDist.push(dist);
    //     }
    //
    //     sceneEntities[i].segDist = exitsDist;
    //
    //
    //     let minIndex = exitsDist.indexOf(Math.min(...exitsDist));
    //     let minPath = opens[minIndex];
    //
    //     let zForceDir;
    //
    //     if(minPath.z < sceneEntities[i].z){
    //         zForceDir = -1;
    //     }else if(minPath.z > sceneEntities[i].z){
    //         zForceDir = 1;
    //
    //     }else {
    //         zForceDir = 0;
    //
    //     }
    //
    //
    //     let zForce = Math.abs(sceneEntities[i].z - minPath.z);
    //     let forcePosition = {x:sceneEntities[i].x, z:sceneEntities[i].z + zForceDir * zForce};
    //
    //     let md = 1;
    //     // j=i+1;
    //     //
    //     // while(j<sceneEntities.length)
    //     // {
    //     //
    //     //     const agentCentroidDist = distance(forcePosition.x, forcePosition.z, sceneEntities[j].x, sceneEntities[j].z );
    //     //     const AgentDist = agentCentroidDist - AGENTSIZE;
    //     //
    //     //     if(AgentDist<0){
    //     //         md = 0;
    //     //         break;
    //     //     }
    //     //
    //     //
    //     //     j+=1;
    //     // }
    //
    //     if(sceneEntities[i].x < -11 || sceneEntities[i].waitAgent === null){
    //         md = 0;
    //     }
    //
    //     sceneEntities[i].pz +=  timestep * zForceDir * 0.8 * md;
    //
    //     i+=1
    // }





  while(pbdIters<ITERNUM)
  {
      // idx = 0;
      // while(idx < world.distanceConstraints.length)
      // {
      //     // desDistance = world.distanceConstraints[idx].distance;
      //     agent_a = sceneEntities[world.distanceConstraints[idx].idx_a]
      //     agent_b = sceneEntities[world.distanceConstraints[idx].idx_b]
      //     distanceConstraint(agent_a,agent_b, 0.2);
      //     idx+=1;
      // }







      // i=0;
      // while(i<sceneEntities.length)
      // {
      //
      //     j=i+1;
      //
      //     while(j<sceneEntities.length)
      //     {
      //
      //
      //         keepDistanceConstraint(sceneEntities[i],sceneEntities[j], 0.5);
      //
      //         j+=1;
      //     }
      //     i+=1
      // }

      i=0;
      while(i<sceneEntities.length)
      {

          j=i+1;

          while(j<sceneEntities.length)
          {



                // following(sceneEntities[i],sceneEntities[j]);
                // followingV2(sceneEntities[i], sceneEntities[j]);
                collisionConstraint(sceneEntities[i],sceneEntities[j]);

                j+=1;
          }
          i+=1
      }

      i=0;
      while(i<sceneEntities.length)
      {
          j=0;
          while(j<obstacleEntities.length)
          {
              collisionConstraintWithWall(sceneEntities[i],obstacleEntities[j], i, j)
              j+=1;
          }
          i+=1
      }



    pbdIters+=1;
  }


  sceneEntities.forEach(function (item) {






      item.vx = (item.px-item.x)/timestep;
      item.vz = (item.pz-item.z)/timestep;
      item.vy = (item.py-item.y)/timestep;

      item.vm = Math.sqrt(item.vx * item.vx + item.vz * item.vz);
      // console.log(item.vm);
      item.x = item.px;
      item.z = item.pz;
      item.y = item.py;


      // if(item.simpPath){
      //     const closetSeg = findClosestPoints(item.simpPath, [item.x, item.z])
      //     item.closetSegment = closetSeg;
      //     // projectionDistance
      //
      //     const id1 = getIndexByPoint(item.simpPath, closetSeg[0]);
      //     const id2 = getIndexByPoint(item.simpPath, closetSeg[1]);
      //
      //     let projDist;
      //     if( id1 < id2){
      //         projDist = projectionDistance(closetSeg[0], closetSeg[1], {x:item.x, z:item.z});
      //     }else if(id2 < id1){
      //         projDist = projectionDistance(closetSeg[1], closetSeg[0], {x:item.x, z:item.z});
      //     }else {
      //         console.log("Equals Problem.");
      //         projDist = Infinity;
      //     }
      //
      //     if(item.waitAgent===null){
      //         item.outTrack = projDist > 0.5;
      //     }else {
      //         item.outTrack = false;
      //
      //     }
      //
      //
      // }




    if(mode !==3){
        if(item.x < -world.x/2)
        {
            item.x = -world.x/2;
        }
        else if(item.x > world.x/2)
        {
            item.x = world.x/2;
        }


        if(item.z < -world.z/2)
        {
            item.z = -world.z/2;
        }
        else if(item.z > world.z/2)
        {
            item.z= world.z/2;
        }
    }else {

        if(item.x < -world.x/2)
        {
            item.x = world.x/2;
            item.z = item.sz;
        }
        else if(item.x > world.x/2)
        {
            item.x = -world.x/2;
            item.z = item.sz;

        }

    }



  });


}

function projectionDistanceV2(AB, C){
    // Define the 2D vector AB
    // const AB = { x: B.x - A.x, z: B.z - A.z };

    // Define the 2D point C
    // const C = { x: 1, y: 2 };

    // Calculate the shortest projected length of C onto AB
    const AC = { x: C.x, z: C.z }; // Vector from (0,0) to C
    const ABLength = 1; // Length of AB
    const ABNormalized = { x: AB.x / ABLength, z: AB.z / ABLength }; // Unit vector of AB
    const projectionLength = (AC.x * ABNormalized.x + AC.z * ABNormalized.z); // Dot product of AC and ABNormalized

    // The shortest projected length of C onto AB is the projection length
    // console.log(projectionLength);
    return projectionLength;
}

function projectionDistance(A, B, C){
    // Define the 2D vector AB
    const AB = { x: B.x - A.x, z: B.z - A.z };

    // Define the 2D point C
    // const C = { x: 1, y: 2 };

    // Calculate the shortest projected length of C onto AB
    const AC = { x: C.x - A.x, z: C.z - A.z }; // Vector from (0,0) to C
    const ABLength = Math.sqrt(AB.x * AB.x + AB.z * AB.z); // Length of AB
    const ABNormalized = { x: AB.x / ABLength, z: AB.z / ABLength }; // Unit vector of AB
    const projectionLength = (AC.x * ABNormalized.x + AC.z * ABNormalized.z); // Dot product of AC and ABNormalized

    // The shortest projected length of C onto AB is the projection length
    // console.log(projectionLength);
    return projectionLength;
}


function getIndexByPoint(points, desiredPoint) {
    for (let i = 0; i < points.length; i++) {
        if (points[i].x === desiredPoint.x && points[i].z === desiredPoint.z) {
            return i; // Return the index if the point is found
        }
    }
    return -1; // Return -1 if the point is not found
}

function distanceToParallelVectors(point, vectors) {

    let dists = [];
    for (let i = 0; i < vectors.length; i++) {
        // Define the current vector
        let v = vectors[i];

        // Calculate unit vector perpendicular to V
        let vPerp = [-v[1], v[0]];
        let vPerpLength = Math.sqrt(vPerp[0] * vPerp[0] + vPerp[1] * vPerp[1]);
        vPerp = [vPerp[0] / vPerpLength, vPerp[1] / vPerpLength];

        // Calculate perpendicular distance to V
        let distToV = Math.abs((point[0] - v[0]) * vPerp[0] + (point[1] - v[1]) * vPerp[1]);
        dists.push(distToV);

    }

    // Return minimum distance
    return dists;
}
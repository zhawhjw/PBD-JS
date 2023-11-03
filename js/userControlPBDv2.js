import * as THREE from 'three';

export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS, sceneEntities, obstacleEntities, world, WORLDUNIT, mode, field, opens=[]) {



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

    function getVectorMagnitude(vector){
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    function getUnitVector(vector){
        // Define the 2D vector
        // const vector = { x: 3, y: 4 }; // Example vector

        // Calculate the magnitude (length) of the vector
        const magnitude = getVectorMagnitude(vector);

        // Calculate the unit vector
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
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



        const activate_dist = follower.minVariance + 1.5;

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

        let expected_goal = {x: -50, z: 0}

        const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );
        const collisonAgentSize =  AGENTSIZE;

        const AgentDist = agentCentroidDist - collisonAgentSize;

        // const agent_i_goal_distance = distance(agent_i.px, agent_i.pz, expected_goal.x, expected_goal.z );
        // const agent_j_goal_distance = distance(agent_j.px, agent_j.pz, expected_goal.x, expected_goal.z );
        const agent_i_goal_distance = distance(agent_i.px, agent_i.pz, agent_i.goal_x, agent_i.goal_z );
        const agent_j_goal_distance = distance(agent_j.px, agent_j.pz, agent_j.goal_x, agent_j.goal_z );


        const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist;
        const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;


        let agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;
        let agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;

        let scalor = 0.5;

        // if(agentCentroidDist - collisonAgentSize < 0) {
        //
        //     if (agent_i_goal_distance > agent_j_goal_distance) {
        //         agent_i.px += agent_i_scaler * dir_x * scalor;
        //         agent_i.pz += agent_i_scaler * dir_z * scalor;
        //
        //     } else if (agent_i_goal_distance < agent_j_goal_distance) {
        //         agent_j.px += -agent_j_scaler * dir_x * scalor;
        //         agent_j.pz += -agent_j_scaler * dir_z * scalor;
        //
        //     }else {
        //         agent_i.px += agent_i_scaler * dir_x ;
        //         agent_i.pz += agent_i_scaler * dir_z;
        //         agent_j.px += -agent_j_scaler * dir_x;
        //         agent_j.pz += -agent_j_scaler * dir_z;
        //     }
        //
        //
        //
        // }

        if(agentCentroidDist - collisonAgentSize < 0) {

            // if (agent_i_goal_distance > agent_j_goal_distance) {
            //     agent_i_scaler = agent_i_scaler * 2;
            //
            // } else if (agent_i_goal_distance < agent_j_goal_distance) {
            //     agent_j_scaler = agent_j_scaler * 2;
            //
            // }

            agent_i.px += agent_i_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z;
            agent_j.px += -agent_j_scaler * dir_x;
            agent_j.pz += -agent_j_scaler * dir_z;

        }




    }

    function collisionConstraintWithWall(agent_i,wall_j_object, i, j)
    {
        if(agent_i.index === 13){
            // console.log();
        }
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
            agent_i.pz += agent_i_scaler * dir_z + wall_j_scaler * dir_z;

        }


    }



    // function agentVelocityPlanner()  {
    //   sceneEntities.forEach(function (agent_i) {
    //     const distToGoal = distance(agent_i.x, agent_i.z,
    //                       agent_i.goal_x, agent_i.goal_z );
    //     if(distToGoal > RADIUS)
    //     {
    //       const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
    //       const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
    //       agent_i.vx = agent_i.v_pref * dir_x;
    //       agent_i.vz = agent_i.v_pref * dir_z;
    //     }
    //     agent_i.vx = 0.9999*agent_i.vx;
    //     agent_i.vz = 0.9999*agent_i.vz;
    //   });
    //
    // }
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


    function isAgentInFront(agentA, agentB, direction) {
        const difference = agentB.clone().sub(agentA);
        const angle = difference.angleTo(direction);
        return angle < Math.PI / 3; // Adjust this angle to control the "field of view" for agents.
    }

    function isAgentInFront180(agentA, agentB, direction) {
        const difference = agentB.clone().sub(agentA);
        const angle = difference.angleTo(direction);
        return angle < Math.PI / 2; // Adjust this angle to control the "field of view" for agents.
    }

    function isAgentInFront90(agentA, agentB, direction) {
        const difference = agentB.clone().sub(agentA);
        const angle = difference.angleTo(direction);
        return angle < Math.PI / 4; // Adjust this angle to control the "field of view" for agents.
    }

    function isAgentInFront30(agentA, agentB, direction) {
        const difference = agentB.clone().sub(agentA);
        const angle = difference.angleTo(direction);
        return angle < Math.PI / 12; // Adjust this angle to control the "field of view" for agents.
    }

    function rotateVector(vec, D, dir) {
        const rad = D * Math.PI / 180; // Convert angle to radians

        let cosTheta = Math.cos(rad);
        let sinTheta = Math.sin(rad);

        if (dir === 'clockwise') {
            return {
                x: vec.x * cosTheta + vec.z * sinTheta,
                z: -vec.x * sinTheta + vec.z * cosTheta
            };
        } else if (dir === 'counter-clockwise') {
            return {
                x: vec.x * cosTheta - vec.z * sinTheta,
                z: vec.x * sinTheta + vec.z * cosTheta
            };
        } else {
            throw new Error("Invalid rotation direction. Use 'clockwise' or 'counter-clockwise'.");
        }
    }



    function closestSeeAgent(point, points) {
        let closest = null;
        let minDistance = Infinity;
        // const activate_dist =   point.variance;
        const activate_dist =   0.5;

        for (let i = 0; i < points.length; i++) {
            const checkedPoint = points[i];

            if(point.index === checkedPoint.index){
                continue;
            }

            if(checkedPoint.simEnd){
                continue;
            }


            if(mode===3 && checkedPoint.group_id !== point.group_id){
                continue;
            }

            if(mode===3 && (point.v_pref - checkedPoint.v_pref >= 0.1) ){
                continue;
            }

            const agentCentroidDist = distance(point.x, point.z, checkedPoint.x, checkedPoint.z);
            const dir = {x: checkedPoint.x - point.x, y:checkedPoint.z - point.z};
            const followed_ud = getUnitVector(dir);
            const follower_uv = getUnitVector({x: point.vx, y:point.vz});
            const followed_uv = getUnitVector({x: checkedPoint.vx, y:checkedPoint.vz});

            const follower_ug = getUnitVector({x: point.goal_x - point.x, y:point.goal_z - point.z});
            const followed_ug = getUnitVector({x: checkedPoint.goal_x - checkedPoint.x, y:checkedPoint.goal_z - checkedPoint.z});

            const follower_position = new THREE.Vector3( point.x, 0, point.z );
            const checkedPoint_position = new THREE.Vector3( checkedPoint.x, 0, checkedPoint.z );

            const follower_dir = new THREE.Vector3( point.vx, 0, point.vz );
            const direction = follower_dir.normalize();

            let flag1 = (agentCentroidDist - 2 * RADIUS) < activate_dist; // censor distance range

            // let flag2 = (degreeBetween(follower_ug, followed_ud) < 30); // censor angle range
            // let flag3 = (degreeBetween(follower_ug, followed_ug) > 100); // to solve face to face condition
            let flag2 = isAgentInFront(follower_position, checkedPoint_position, direction)
            let flag3 = false;
            if ((agentCentroidDist < minDistance) && flag1 && flag2 && !flag3) {
                minDistance = agentCentroidDist;
                closest = checkedPoint;
            }


        }
        return closest;
    }

    function smoothKernel(radius, dist){
        let distNorm = normalize(0, 2 * RADIUS, radius - dist);

        let v = Math.max(0, distNorm);
        return v * v * v;
    }

    function calculateDensity(position, agents){
        let density = 0;

        for (let i =0; i<agents.length;i++){
            let agent = agents[i];
            let dist = distance(position.x, position.z, agent.x, agent.z);

            // if (dist > 4 * RADIUS){
            //     continue
            // }

            let influence = smoothKernel(4 * RADIUS, dist);
            density += influence;

        }

        density /= agents.length;

        return density;

    }

    function maxSpeedAgent(item, agents) {
        // MAX(w_v |Vj| + w_d */(0.001+ | p_ij |)
        let leader = null;
        let maxSpeed = -1;
        let cachedAgents = [];

        for (let i = 0; i < agents.length; i++) {
            const checkedAgent = agents[i];

            if(item.index === checkedAgent.index){
                continue;
            }

            if(checkedAgent.simEnd){
                continue;
            }

            if(mode===3 && checkedAgent.group_id !== item.group_id){
                continue;
            }

            const agentCentroidDist = distance(item.x, item.z, checkedAgent.x, checkedAgent.z);
            const follower_position = new THREE.Vector3( item.x, 0, item.z );
            const checkedPoint_position = new THREE.Vector3( checkedAgent.x, 0, checkedAgent.z );
            const follower_dir = new THREE.Vector3( item.vx, 0, item.vz );
            const direction = follower_dir.normalize();

            const checkedAgentDir = new THREE.Vector3( checkedAgent.vx, 0, checkedAgent.vz );


            let flag1 = (agentCentroidDist - 2 * RADIUS) < 4 * RADIUS; // censor distance range
            let flag2 = isAgentInFront180(follower_position, checkedPoint_position, direction)

            if(flag1 && flag2){
                let agentSpeed = getVectorMagnitude(checkedAgentDir);
                if (agentSpeed > maxSpeed){
                    leader = checkedAgent;
                    cachedAgents.push(leader);
                    maxSpeed = agentSpeed;

                }
            }

        }

        item.cachedAgents = cachedAgents;

        return leader;
    }

    function pickAgent(item, agents) {
        // MAX(w_v |Vj| + w_d */(0.001+ | p_ij |)
        let leader = null;

        let speedWeight = 0.2;
        let distWeight = 0.8;

        let maxReward = -1;

        let cachedAgents = [];
        let cachedSurroundAgents = [];

        for (let i = 0; i < agents.length; i++) {
            const checkedAgent = agents[i];

            if(item.index === checkedAgent.index){
                continue;
            }

            if(checkedAgent.simEnd){
                continue;
            }

            if(mode===3 && checkedAgent.group_id !== item.group_id){
                continue;
            }

            const agentCentroidDist = distance(item.x, item.z, checkedAgent.x, checkedAgent.z);

            // out of vision range
            if (agentCentroidDist > 4 * RADIUS){
                continue
            }


            cachedSurroundAgents.push(checkedAgent);

            const follower_position = new THREE.Vector3( item.x, 0, item.z );
            const checkedPoint_position = new THREE.Vector3( checkedAgent.x, 0, checkedAgent.z );
            const follower_dir = new THREE.Vector3( -1, 0, 0 );
            const direction = follower_dir.normalize();

            let flag2 = isAgentInFront90(follower_position, checkedPoint_position, direction)

            // not in front of 90 degree of vision
            if (!flag2){
                continue
            }

            let leaderVelocity = checkedAgent.vm;

            let reward = speedWeight * leaderVelocity + distWeight * (1 / (agentCentroidDist + 0.001))

            if(reward > maxReward){
                leader = checkedAgent;
                maxReward = reward;
                cachedAgents.push(checkedAgent);
            }

        }

        item.cachedAgents = cachedAgents;
        item.cachedSurroundAgents = cachedSurroundAgents;
        return leader;
    }

    function findLeader(){
        sceneEntities.forEach(function (item){

            let followedAgent = closestSeeAgent(item, sceneEntities);


            //
            // if(item.simEnd){
            //     followedAgent = null;
            // }
            //
            // if (followedAgent && followedAgent.simEnd){
            //     followedAgent = null;
            // }

            // if(followedAgent && followedAgent.x >= item.x){
            //     followedAgent = null;
            // }

            if (mode !==3 && mode !==4 && item.x < -11){
                followedAgent = null;
            }

            // let min = 0;
            // let max = 1;
            // let timerMax = 30;
            // let randomFloatInRange = (Math.random() * (max - min) + min).toFixed(1);
            //
            // if(randomFloatInRange <= 0.1){
            //
            //     if(item.noFollowingTimer <= -1){
            //         item.noFollowingTimer = timerMax;
            //     }
            // }
            //
            // if(item.noFollowingTimer > -1){
            //     item.noFollowingTimer -= 1
            //     followedAgent = null;
            // }




            item.waitAgent = followedAgent;
            if(item.waitAgent){
                // item.px = item.waitAgent.x;
                // item.pz = item.waitAgent.z;

                let distToGoal = distance(item.x, item.z, item.waitAgent.x, item.waitAgent.z );
                if(distToGoal<0.1){
                    distToGoal = 0.1;
                }
                const dir_x = (item.waitAgent.x - item.x)/distToGoal;
                const dir_z = (item.waitAgent.z - item.z)/distToGoal;

                item.px = item.x + timestep * item.v_pref * dir_x;
                item.pz = item.z + timestep * item.v_pref * dir_z;

            }


        });
    }

    function followingV3(agent_i){

        let followedAgent = closestSeeAgent(agent_i, sceneEntities);

        if(agent_i.simEnd){
            followedAgent = null;
        }

        if (followedAgent && followedAgent.simEnd){
            followedAgent = null;
        }

        if (mode !==3 && mode !==4 && agent_i.x < -11){
            followedAgent = null;
        }


        let min = 0;
        let max = 1;
        let timerMax = 80;
        let randomFloatInRange = (Math.random() * (max - min) + min).toFixed(1);
        let probability = 0.5

        if(randomFloatInRange <= probability){

            if(agent_i.noFollowingTimer <= -1){
                agent_i.noFollowingTimer = timerMax;
            }
        }

        if(agent_i.noFollowingTimer > -1){
            agent_i.noFollowingTimer -= 1
            followedAgent = null;
        }

        agent_i.waitAgent = followedAgent;

        // you go first
        if(agent_i.waitAgent !== null && agent_i.waitAgent.index === agent_i.index ){
            agent_i.waitAgent = null;
        }


        if(agent_i.waitAgent){

            let distToGoal = distance(agent_i.x, agent_i.z, agent_i.waitAgent.x, agent_i.waitAgent.z );

            if(distToGoal<0.1){
                distToGoal = 0.1;
            }
            const dir_x = (agent_i.waitAgent.x - agent_i.x)/distToGoal;
            const dir_z = (agent_i.waitAgent.z - agent_i.z)/distToGoal;

            agent_i.v_pref = agent_i.waitAgent.v_pref;

            agent_i.px = agent_i.x + timestep * agent_i.v_pref * dir_x;
            agent_i.pz = agent_i.z + timestep * agent_i.v_pref * dir_z;

            // distance shrink
            const activate_dist = agent_i.minVariance + agent_i.variance;
            const agentCentroidDist = distance(agent_i.x, agent_i.z, agent_i.waitAgent.x, agent_i.waitAgent.z );
            let delta =  (agentCentroidDist - 2 * RADIUS * 1.1 - 0.2);

            let scalar = normalize(agent_i.minVariance, activate_dist, delta);
            agent_i.px = agent_i.x + (agent_i.px - agent_i.x) *  scalar;
            agent_i.pz = agent_i.z + (agent_i.pz - agent_i.z) *  scalar;

            // let zeroTimer = 30;
            // if (scalar <= 0){
            //     // console.log("Hit 0");
            //     agent_i.freezeTimer = zeroTimer;
            // }

            // if (agent_i.freezeTimer >= -1){
            //
            //
            //     agent_i.px = agent_i.x;
            //     agent_i.pz = agent_i.z;
            //
            //     agent_i.freezeTimer -= 1;
            //
            // }else {
            //     agent_i.px = agent_i.x + (agent_i.px - agent_i.x) *  scalar;
            //     agent_i.pz = agent_i.z + (agent_i.pz - agent_i.z) *  scalar;
            // }



        }



    }

    function followingV4(agent_i){

        // if(agent_i.noFollowingTimer > -1){
        //     return;
        // }

        agent_i.waitAgent = maxSpeedAgent(agent_i, sceneEntities);

        // you go first
        if(agent_i.waitAgent !== null && agent_i.waitAgent.index === agent_i.index ){
            agent_i.waitAgent = null;
        }


        const agentDir = new THREE.Vector3( agent_i.vx, 0, agent_i.vz );
        const dirNorm = agentDir.normalize();

        if(agent_i.waitAgent){


            let distToGoal = distance(agent_i.x, agent_i.z, agent_i.waitAgent.x, agent_i.waitAgent.z );

            if(distToGoal<0.1){
                distToGoal = 0.1;
            }
            const dir_x = (agent_i.waitAgent.x - agent_i.x)/distToGoal;
            const dir_z = (agent_i.waitAgent.z - agent_i.z)/distToGoal;

            agent_i.v_pref = agent_i.waitAgent.v_pref;

            agent_i.px = agent_i.x + timestep * agent_i.v_pref * dir_x;
            agent_i.pz = agent_i.z + timestep * agent_i.v_pref * dir_z;

            // distance shrink
            const activate_dist = agent_i.minVariance + agent_i.variance;
            const agentCentroidDist = distance(agent_i.x, agent_i.z, agent_i.waitAgent.x, agent_i.waitAgent.z );
            let delta =  (agentCentroidDist - 2 * RADIUS);

            let MAX = delta / agentCentroidDist;

            // let scalar = normalize(agent_i.minVariance, activate_dist, delta);
            let scalar = getRandomFloat(0, MAX, 1);

            agent_i.px = agent_i.x + (agent_i.px - agent_i.x) * 0.5;
            agent_i.pz = agent_i.z + (agent_i.pz - agent_i.z) *  0.5;

            let emptyDirs = []

            for (let i =0;i<3;i++){
                let clockDirNorm =  rotateVector(dirNorm, 15 + i * 30, "clockwise");
                let cClockDirNorm =  rotateVector(dirNorm, 15 + i * 30, "counter-clockwise");

                let clock = false;
                let cClock = false;

                for (let k =0; k<agent_i.cachedAgents.length;k++){
                    let cachedAgent = agent_i.cachedAgents[k];

                    const agent_i_position = new THREE.Vector3( agent_i.x, 0, agent_i.z );
                    const cachedAgent_position = new THREE.Vector3( cachedAgent.x, 0, cachedAgent.z );

                    let flag2 = isAgentInFront30(agent_i_position, cachedAgent_position, new THREE.Vector3( clockDirNorm.x, 0, clockDirNorm.z ));
                    let flag3 = isAgentInFront30(agent_i_position, cachedAgent_position, new THREE.Vector3( cClockDirNorm.x, 0, cClockDirNorm.z ))

                    clock = clock || !flag2;
                    cClock = cClock || !flag3;

                }

                if(clock){
                    emptyDirs.push(clockDirNorm);
                }

                if(cClock){
                    emptyDirs.push(cClockDirNorm);
                }

            }

            const magnitude1 = Math.sqrt(agent_i.vx * agent_i.vx + agent_i.vz * agent_i.vz);

            if(emptyDirs.length > 0 &&  magnitude1 < agent_i.v_pref * 0.5){
                agent_i.waitAgent = null;
                agent_i.emptyDirs = emptyDirs;


                let ps =[];
                for (let i =0;i<emptyDirs.length;i++){
                    let dir = emptyDirs[i];
                    const dir_x = dir.x;
                    const dir_z = dir.z;
                    let px = agent_i.x + timestep * agent_i.v_pref  * dir_x;
                    let pz = agent_i.z + timestep * agent_i.v_pref * dir_z;
                    ps.push({x:px, z:pz});
                }

                let emptyPositions = sortByDistance(ps, agent_i.scenarioGoal);


                agent_i.px = emptyPositions[0].x;
                agent_i.pz = emptyPositions[0].z;
                //
                // agent_i.noFollowingTimer = timerMax;
            }




        }



    }


    function getEmptySpaceVectors(baseVector, baseAngle){
        let candidates = [];
        // let baseAngle = 15;
        let num = 180 / baseAngle;

        for (let i = 0;i<num;i++){
            let angle = baseAngle + baseAngle * i;
            let vec = rotateVector(baseVector, angle, "clockwise");
            candidates.push(vec)
        }

        return candidates;
    }

    function followingV5(agent_i, iter=1, k = 0.9){

        const estStep = 0.1;
        let stepVectors = [
            {x: 0, z: 1},
            {x:-1, z: 1},
            {x:-1, z: 0},
            {x:-1, z:-1},
            {x:0,  z:-1}
        ];

        // stepVectors = getEmptySpaceVectors({x: 0, z:1}, 15);


        let stepDensities = [

        ];

        agent_i.waitAgent = pickAgent(agent_i, sceneEntities);

        // you go first
        if(agent_i.waitAgent !== null && agent_i.waitAgent.index === agent_i.index ){
            agent_i.waitAgent = null;
        }

        let currentDensity = calculateDensity({x:agent_i.x, z:agent_i.z}, agent_i.cachedSurroundAgents)

        for (let i = 0; i<stepVectors.length;i++){
            let stepVector = stepVectors[i];
            let sampledX = agent_i.x + stepVector.x * estStep;
            let sampledZ = agent_i.z + stepVector.z * estStep;

            let stepDensity = calculateDensity({x:sampledX, z:sampledZ}, agent_i.cachedSurroundAgents)

            stepDensities.push(stepDensity - currentDensity);

        }


        let kPrime = 1.0 - Math.pow((1.0 - k), (1.0 / iter));

        if(
            agent_i.waitAgent &&
            // agent_i.vm > 0.5 * agent_i.v_pref
            agent_i.waitAgent.vm - agent_i.v_pref < 0.1 &&
            Math.min(...stepDensities) >= 0

        ){
            const correctedDir = new THREE.Vector3( agent_i.waitAgent.x - agent_i.x, 0, agent_i.waitAgent.z - agent_i.z );
            const correctedDirNorm = correctedDir.normalize();

            let dist = distance(agent_i.x, agent_i.z, agent_i.waitAgent.x, agent_i.waitAgent.z);

            let scalar = smoothKernel(4 * RADIUS, dist);
            let correctedVm = agent_i.vm - scalar * agent_i.vm;
            // 1. color: green -> blue high v -> low v
            // 2. need to focus only on predicted position
            // 3. following is not just go to behind that person but can keep the distance with that leader while direction remains same
            // 4. need to change the position of agents: use blue noise, try to mimic the one in paper Realistic Following then create something simpler
            // 5. implement the Realistic Following behavior (create new script alone)
            // FROM BOTTOM to TOP
            agent_i.px = agent_i.x + kPrime * correctedDirNorm.x * correctedVm * timestep;
            agent_i.pz = agent_i.z + kPrime * correctedDirNorm.z * correctedVm * timestep;

        }else {
            agent_i.waitAgent = null;
            let velocity;

            if(Math.min(...stepDensities) <0){
                let targetDensity = Math.min(...stepDensities);
                let index = stepDensities.indexOf(targetDensity);
                velocity = stepVectors[index];

            }else{
                velocity = agent_i.scenarioVec;

            }

            let smoothVelocity = velocity;

            agent_i.px =  agent_i.x + kPrime * smoothVelocity.x * agent_i.v_pref * timestep;
            agent_i.pz =  agent_i.z + kPrime * smoothVelocity.z * agent_i.v_pref * timestep;
        }




    }

    function weightedInterpolation(vec1, vec2, w1, w2) {
        // Calculate the interpolated values
        let x = (vec1.x * w1 + vec2.x * w2) / (w1 + w2);
        let z = (vec1.z * w1 + vec2.z * w2) / (w1 + w2);

        // Return the result as a new vector
        return { x: x, z: z };
    }

    function sortByDistance(vecArray, refVec) {
        return vecArray.slice().sort((a, b) => {
            // Calculate squared distances to avoid using Math.sqrt() for performance reasons
            const distSqA = (a.x - refVec.x) ** 2 + (a.z - refVec.z) ** 2;
            const distSqB = (b.x - refVec.x) ** 2 + (b.z - refVec.z) ** 2;

            return distSqA - distSqB;
        });
    }


    function getRandomFloat(min, max, decimals) {
        const str = (Math.random() * (max - min) + min).toFixed(decimals);

        return parseFloat(str);
    }
    function convertWorld2Grid(world_position){


        let nth_row = Math.ceil(world_position.x / (WORLDUNIT * 2));
        let nth_column = Math.ceil(world_position.z / (WORLDUNIT * 2));

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


    function agentPlanner(agent_i){
        if (!agent_i.path){

            let distToGoal = distance(agent_i.x, agent_i.z, agent_i.fGoal_x, agent_i.fGoal_z );

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


            if(mode===3 && agent_i.simEnd === true){
                let distToGoal = distance(agent_i.x, agent_i.z, agent_i.goal_x, agent_i.goal_z );
                agent_i.simEnd = false;
                agent_i.modifier = 1;

                if(agent_i.x < 0) {
                    agent_i.x = world.x / 2;
                    agent_i.z = agent_i.sz;
                }
                else if(agent_i.x > 0)
                {
                    agent_i.x = -world.x/2;
                    agent_i.z = agent_i.sz;

                }

                const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z - agent_i.z)/distToGoal;
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
        let distToGoal = distance(agent_i.x, agent_i.z,
            t.x, t.z );

        if(distToGoal<0.1){
            distToGoal = 0.1;
        }



        if(isOverlapping({x:agent_i.x, y:agent_i.z, radius: agent_i.radius}, {x: t.x, y:t.z, side: 0.25 }))
        {
            agent_i.path_index ++;

        }else{
            agent_i.goal_x = t.x;
            agent_i.goal_z = t.z;

            const dir_x = (t.x - agent_i.x)/distToGoal;
            const dir_z = (t.z - agent_i.z)/distToGoal;
            agent_i.vx = agent_i.v_pref * dir_x;
            agent_i.vz = agent_i.v_pref * dir_z;

        }



        // for goal arrow helpler
        if (agent_i.path_index > agent_i.key_index){
            let nexit = agent_i.exit;
            agent_i.key_index = nexit.shift();
            if (!agent_i.key_index){
                agent_i.key_index = agent_i.path.length-1;
            }
            agent_i.exit = nexit;
        }
    }

    function agentVelocityPlannerV2(sceneEntities)  {

        // for(let i = 0; i<sceneEntities.length;i++)
        sceneEntities.forEach(function (agent_i) {

            agentPlanner(agent_i);


        });

    }

    function agentVelocityPlannerV3(){
        // plannerMode = 3;



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

    function agentVelocityPlannerV4(){
        sceneEntities.forEach(function (item){

            let actual_position = {
                x: item.x + world.x / 2,
                y: item.y,
                z: item.z + world.z / 2,
            }

            let [r, c] = convertWorld2Grid(actual_position);


            if(r>world.x/2 - 1){
                r = world.x/2 - 1;
            }
            if(c>world.z/2 - 1){
                c = world.z/2 - 1;
            }

            if(r<0){
                r = 0;
            }
            if(c<0){
                c = 0;
            }

            let velocity = field[r][c].vec;

            const dir_x = velocity.x;
            const dir_z = velocity.z;
            item.vx = item.v_pref * dir_x;
            item.vz = item.v_pref * dir_z;
            // item.vx = 0.8 * dir_x;
            // item.vz = 0.8 * dir_z;

            item.currentR = r;
            item.currentC = c;
            item.flowVec = velocity;



        });
    }

    function agentVelocityPlannerV5(){
        sceneEntities.forEach(function (item){

            let velocity = item.scenarioVec;

            const dir_x = velocity.x;
            const dir_z = velocity.z;
            item.vx = item.vm * dir_x;
            item.vz = item.vm * dir_z;


        });
    }

    function haveSameSign(num1, num2) {
        // Check if both numbers are positive or both are negative
        return (num1 > 0 && num2 > 0) || (num1 < 0 && num2 < 0);
    }

    function coordinateCorrection(r, c){
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

        return [r, c]

    }

    // function searchCandidateTiles(flowFieldDir, r, c){
    //
    //     let xDir = flowFieldDir[0];
    //     let yDir = flowFieldDir[1];
    //
    //     let candidates = [];
    //
    //     let nr;
    //     let nc;
    //
    //     if (xDir > 0 && yDir === 0){
    //         // x
    //         // |
    //         //ooo
    //         [nr, nc] = coordinateCorrection(r-1, c);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c-1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c+1);
    //         candidates.push([nr, nc]);
    //
    //     }else if (xDir === 0 && yDir < 0) {
    //         // o
    //         // o - x
    //         // o
    //         [nr, nc] = coordinateCorrection(r+1, c-1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r, c-1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c-1);
    //         candidates.push([nr, nc]);
    //     }else if (xDir === 0 && yDir > 0) {
    //         //     o
    //         // x - o
    //         //     o
    //         [nr, nc] = coordinateCorrection(r+1, c+1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r, c+1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c+1);
    //         candidates.push([nr, nc]);
    //     }else if (xDir > 0 && yDir > 0) {
    //         // x   o
    //         //   \
    //         // o   o
    //         [nr, nc] = coordinateCorrection(r-1, c);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c+1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r, c+1);
    //         candidates.push([nr, nc]);
    //     }else if (xDir < 0 && yDir < 0) {
    //         // o   x
    //         //   /
    //         // o   o
    //         [nr, nc] = coordinateCorrection(r-1, c);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c-1);
    //         candidates.push([nr, nc]);
    //
    //         [nr, nc] = coordinateCorrection(r-1, c);
    //         candidates.push([nr, nc]);
    //     }else {
    //         // other conditions should not exist
    //         // do nothing
    //
    //         nr = r;
    //         nc = c;
    //
    //     }
    //
    //
    //     return candidates
    //
    // }

    function filterCandidates(candidatesList, targetTile){



        for(let i =0;i<candidatesList.length;i++){
            // candidatesList[i]
        }

    }

    function filterArrayByDistance(points, currentPosition, goalPosition) {
        const distanceBetweenAB = distance(currentPosition.x, currentPosition.y, goalPosition.z, goalPosition.z);

        return points.filter(point => {
            const distanceToPointFromB = distance(point.x, point.z, goalPosition.x, goalPosition.z);
            return distanceToPointFromB < distanceBetweenAB;
        });
    }

    function normalizeVector2D(v) {
        const magnitude = Math.sqrt(v.x * v.x + v.z * v.z);

        // Prevent division by zero by returning the original vector if its magnitude is zero
        if (magnitude === 0) return v;

        return {
            x: v.x / magnitude,
            z: v.z / magnitude
        };
    }

    /*  -----------------------  */


    const WALLSIZE = WORLDUNIT;
    const AGENTSIZE = RADIUS * 2;
    const epsilon = 0.0001;
    const timestep = 0.03;
    const ITERNUM =3;
    const KSI = 0.01;
    let timerMax = 70;

    sceneEntities.forEach(function (item){
        item.prev_vx = item.vx;
        item.prev_vy = item.vy;
        item.prev_vz = item.vz;

    });


    // agentVelocityPlannerV2(sceneEntities);
    // agentVelocityPlannerV4(sceneEntities);

    agentVelocityPlannerV5(sceneEntities);

    sceneEntities.forEach(function (item) {

        // let x_sign = haveSameSign(item.prev_vx, item.vx);
        // let z_sign = haveSameSign(item.prev_vx, item.vx);
        //
        // if (!x_sign) item.prev_vx = 0;
        // if (!z_sign) item.prev_vz = 0;

        // need to be revised
        item.vx = KSI* item.vx + (1-KSI) * item.prev_vx
        item.vz = KSI* item.vz + (1-KSI) * item.prev_vz

        item.px = item.x + timestep*item.vx;
        item.pz = item.z + timestep*item.vz;
        item.py = item.y + timestep*item.vy;

    });

    let pbdIters = 0;
    let agent_a, agent_b, desDistance, i, j, idx = 0;


    // found proper leader for each agent
    // findLeader();

    let stiffnessFactor = 0.7;
    // sceneEntities.forEach(function (item){
    //
    //      followingV5(item, 1, stiffnessFactor);
    // });

    while(pbdIters<ITERNUM)
    {
        i=0;
        while(i<sceneEntities.length)
        {
            followingV5(sceneEntities[i], ITERNUM, stiffnessFactor);
            i+=1
        }
        pbdIters+=1;
    }



    i=0;
    while(i<sceneEntities.length)
    {
        j=i+1;

        while(j<sceneEntities.length)
        {


            // collisionAvoidance(sceneEntities[i],sceneEntities[j]);
            collisionConstraint(sceneEntities[i],sceneEntities[j]);
            j+=1;
        }
        i+=1
    }


    pbdIters = 0;
    while(pbdIters<ITERNUM)
    {

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


        // if(mode !==3){
        //     if(item.x < -world.x/2)
        //     {
        //         item.x = -world.x/2;
        //     }
        //     else if(item.x > world.x/2)
        //     {
        //         item.x = world.x/2;
        //     }
        //
        //
        //     if(item.z < -world.z/2)
        //     {
        //         item.z = -world.z/2;
        //     }
        //     else if(item.z > world.z/2)
        //     {
        //         item.z= world.z/2;
        //     }
        // }else {
        //
        //     if(item.group_id === 1) {
        //
        //         if(item.fGoal_x <= -55){
        //             if (item.x <= -55) {
        //                 item.x = world.x / 2;
        //                 item.z = item.sz;
        //             }
        //         }else {
        //             if (item.x <= item.fGoal_x) {
        //                 item.x = world.x / 2;
        //                 item.z = item.sz;
        //             }
        //         }
        //
        //
        //
        //     }else if(item.group_id === 2){
        //         if(item.fGoal_x >= 55){
        //             if (item.x >= 55) {
        //                 item.x = -world.x / 2;
        //                 item.z = item.sz;
        //             }
        //         }else {
        //             if (item.x >= item.fGoal_x) {
        //                 item.x = -world.x / 2;
        //                 item.z = item.sz;
        //             }
        //         }
        //
        //
        //
        //
        //     }
        //
        //
        // }



    });

    function getNextTiles(flowFieldDir, r, c){

        let xDir = flowFieldDir.x;
        let yDir = flowFieldDir.z;

        let candidates = [];

        let nr;
        let nc;

        if (xDir > 0 && yDir === 0){
            // x
            // |
            // o

            [nr, nc] = coordinateCorrection(r-1, c);
            // candidates.push([nr, nc]);

            // [nr, nc] = coordinateCorrection(r-1, c-1);
            // candidates.push([nr, nc]);
            //
            // [nr, nc] = coordinateCorrection(r-1, c+1);
            // candidates.push([nr, nc]);

        }else if (xDir === 0 && yDir < 0) {
            //
            // o - x
            //

            // [nr, nc] = coordinateCorrection(r+1, c-1);
            // candidates.push([nr, nc]);
            //
            [nr, nc] = coordinateCorrection(r, c-1);
            // candidates.push([nr, nc]);
            //
            // [nr, nc] = coordinateCorrection(r-1, c-1);
            // candidates.push([nr, nc]);

        }else if (xDir === 0 && yDir > 0) {
            //
            // x - o
            //

            // [nr, nc] = coordinateCorrection(r+1, c+1);
            // candidates.push([nr, nc]);
            //
            [nr, nc] = coordinateCorrection(r, c+1);
            // candidates.push([nr, nc]);
            //
            // [nr, nc] = coordinateCorrection(r-1, c+1);
            // candidates.push([nr, nc]);

        }else if (xDir > 0 && yDir > 0) {
            // x
            //   \
            //     o

            // [nr, nc] = coordinateCorrection(r-1, c);
            // candidates.push([nr, nc]);

            [nr, nc] = coordinateCorrection(r-1, c+1);
            // candidates.push([nr, nc]);

            // [nr, nc] = coordinateCorrection(r, c+1);
            // candidates.push([nr, nc]);
        }else if (xDir < 0 && yDir < 0) {
            //     x
            //   /
            // o

            // [nr, nc] = coordinateCorrection(r-1, c);
            // candidates.push([nr, nc]);

            [nr, nc] = coordinateCorrection(r-1, c-1);
            // candidates.push([nr, nc]);

            // [nr, nc] = coordinateCorrection(r-1, c);
            // candidates.push([nr, nc]);

        }else {
            // other conditions should not exist
            // do nothing

            nr = r;
            nc = c;

        }


        return [nr, nc]

    }

    function getRevisedDir(flowFieldDir, exit, item){

        let rDir = {x:0, z:0};

        let xDir = flowFieldDir[0];
        let yDir = flowFieldDir[1];

        if (xDir > 0 && yDir === 0){
            // x
            // |
            //ooo


            rDir = {x:0, z: item.z - exit.z };
            rDir = normalizeVector2D(rDir);


        }else if (xDir === 0 && yDir < 0) {
            // o
            // o - x
            // o

            rDir = {x:1, z: 0 };


        }else if (xDir === 0 && yDir > 0) {
            //     o
            // x - o
            //     o

            rDir = {x:1, z: 0 };


        }else if (xDir > 0 && yDir > 0) {
            // x   o
            //   \
            // o   o

            rDir = {x:-1, z: -1 };



        }else if (xDir < 0 && yDir < 0) {
            // o   x
            //   /
            // o   o

            rDir = {x:1, z: 1 };


        }else {
            // other conditions should not exist
            // do nothing




        }


        return rDir

    }

    function fillGap(item){

        let actual_position = {
            x: item.x + world.x / 2,
            y: item.y,
            z: item.z + world.z / 2,

        }

        let [r, c] = convertWorld2Grid(actual_position);


        item.nowPosition = [r, c]

        // find next candidate tiles
        let nr, nc;

        // let candidates = searchCandidateTiles(current_vec, r, c);
        // let filterCandidates = filterCandidates(candidates,  opens[0]);

        let current_vec = field[r][c].vec;
        let nextCoordinate = getNextTiles(current_vec, r, c);
        nr = nextCoordinate[0];
        nc = nextCoordinate[1];
        [nr, nc] = coordinateCorrection(nr, nc);
        let nextTile = field[nr][nc];

        if (nextTile.cost <= 1){
            item.nextPosition = [nr, nc];
            return;
        }

        let revisedVector = getRevisedDir(current_vec, opens[0], item);
        let revisedCoordinate = getNextTiles(revisedVector, r, c);
        let rr = revisedCoordinate[0];
        let rc = revisedCoordinate[1];
        [rr, rc] = coordinateCorrection(rr, rc);
        let revisedTile = field[rr][rc];

        if (revisedTile.cost <= 1){
            item.nextPosition = [rr, rc];

            const dir_x = revisedVector.x;
            const dir_z = revisedVector.z;
            item.vx = item.v_pref * dir_x;
            item.vz = item.v_pref * dir_z;


        }else {

            const dir_x = 0;
            const dir_z = 0;
            item.vx = item.v_pref * dir_x;
            item.vz = item.v_pref * dir_z;

        }

        // let exit = opens[0];
        // const dir2exit = new THREE.Vector3( exit.x - item.x , 0, exit.z - item.z );
        // const dir2exitNorm = dir2exit.normalize();
        // const agentB2exit = distance(agentB.px, agentB.pz, exit.x, exit.z );




        // if(r < 1){
        //     item.nextPosition = null;
        //     return;
        // }

        // let candidates = [];
        // let nr, nc;
        // //  x
        // //  ]
        // // ooo
        // [nr, nc] = coordinateCorrection(r-1, c);
        // let desired_tile1 = field[nr][nc];
        // candidates.push(desired_tile1);
        //
        // [nr, nc] = coordinateCorrection(r-1, c-1);
        // let desired_tile2 = field[nr][nc];
        // candidates.push(desired_tile2);
        //
        // [nr, nc] = coordinateCorrection(r-1, c+1);
        // let desired_tile3 = field[nr][nc];
        // candidates.push(desired_tile3);





        // let filtered = filterArrayByDistance(candidates, field[r][c], opens[0])
        // if(filtered < 1){
        //     item.nextPosition = null;
        //     return;
        // }
        // let nextTile = filtered[0];
        //
        //
        //
        // item.nextPosition = [nextTile.r, nextTile.c]
        //
        // if(nextTile.cost  > 1){
        //     return;
        // }
        //
        // item.waitAgent = null;
        //
        // let distToGoal = distance(item.x, item.z, nextTile.x, nextTile.z );
        //
        // if (distToGoal < 0.01){
        //     distToGoal = 0.01;
        // }
        //
        // const dir_x = (nextTile.x- item.x)/distToGoal;
        // const dir_z = (nextTile.z- item.z)/distToGoal;
        //
        // item.vx = item.v_pref * dir_x;
        // item.vz = item.v_pref * dir_z;
        //
        // item.px = item.x + timestep*item.vx;
        // item.pz = item.z + timestep*item.vz;
        //
        // item.nextTarget = [item.px, item.pz]


    }




}


function haveDifferentSigns(a, b) {
    return (a > 0 && b < 0) || (a < 0 && b > 0);
}
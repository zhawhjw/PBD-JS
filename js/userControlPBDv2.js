

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





    function closestSeeAgent(point, points) {
        let closest = null;
        let minDistance = Infinity;
        const activate_dist =   point.variance;

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
            const follower_ug = getUnitVector({x: point.goal_x - point.x, y:point.goal_z - point.z});
            const followed_ug = getUnitVector({x: checkedPoint.goal_x - checkedPoint.x, y:checkedPoint.goal_z - checkedPoint.z});

            let flag1 = (agentCentroidDist - 2 * RADIUS) < activate_dist; // censor distance range
            // let flag1 = d < 5; // censor distance range
            let flag2 = (degreeBetween(follower_ug, followed_ud) < 30); // censor angle range
            let flag3 = (degreeBetween(follower_ug, followed_ug) > 100); // to solve face to face condition
            // let flag3 = false;
            // let flag4 = (degreeBetween(follower_ug, followed_ug) < 30);
            // let flag3 = (degreeBetween(follower_ug, followed_ug) < 60 ); // to solve face to face condition
            if (agentCentroidDist < minDistance && flag1 && flag2 && !flag3) {
                minDistance = agentCentroidDist;
                closest = checkedPoint;
            }


        }
        return closest;
    }

    function findLeader(){
        sceneEntities.forEach(function (item){

            let followedAgent = closestSeeAgent(item, sceneEntities);



            if(item.simEnd){
                followedAgent = null;
            }

            if (followedAgent && followedAgent.simEnd){
                followedAgent = null;
            }

            // if(followedAgent && followedAgent.x >= item.x){
            //     followedAgent = null;
            // }

            if (mode !==3 && mode !==4 && item.x < -11){
                followedAgent = null;
            }

            let min = 0;
            let max = 1;
            let timerMax = 30;
            let randomFloatInRange = (Math.random() * (max - min) + min).toFixed(1);

            if(randomFloatInRange <= 0.1){

                if(item.noFollowingTimer <= -1){
                    item.noFollowingTimer = timerMax;
                }
            }

            if(item.noFollowingTimer > -1){
                item.noFollowingTimer -= 1
                followedAgent = null;
            }

            // if(item.exVec.x !== 0 || item.exVec.z !== 0){
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
        let timerMax = 50;
        let randomFloatInRange = (Math.random() * (max - min) + min).toFixed(1);
        let probability = 0.3

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

            item.currentR = r;
            item.currentC = c;
            item.flowVec = velocity;



        });
    }

    function haveSameSign(num1, num2) {
        // Check if both numbers are positive or both are negative
        return (num1 > 0 && num2 > 0) || (num1 < 0 && num2 < 0);
    }

    /*  -----------------------  */


    const WALLSIZE = WORLDUNIT;
    const AGENTSIZE = RADIUS * 2;
    const epsilon = 0.0001;
    const timestep = 0.03;
    const ITERNUM =3;
    const KSI = 0.02;


    sceneEntities.forEach(function (item){
        item.prev_vx = item.vx;
        item.prev_vy = item.vy;
        item.prev_vz = item.vz;

    });


    // agentVelocityPlannerV2(sceneEntities);
    agentVelocityPlannerV4(sceneEntities);

    sceneEntities.forEach(function (item) {

        // let x_sign = haveSameSign(item.prev_vx, item.vx);
        // let z_sign = haveSameSign(item.prev_vx, item.vx);
        //
        // if (!x_sign) item.prev_vx = 0;
        // if (!z_sign) item.prev_vz = 0;

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
    sceneEntities.forEach(function (item){
        followingV3(item);
    });

    while(pbdIters<ITERNUM)
    {

        i=0;
        while(i<sceneEntities.length)
        {



            j=i+1;

            while(j<sceneEntities.length)
            {

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

            if(item.group_id === 1) {

                if(item.fGoal_x <= -55){
                    if (item.x <= -55) {
                        item.x = world.x / 2;
                        item.z = item.sz;
                    }
                }else {
                    if (item.x <= item.fGoal_x) {
                        item.x = world.x / 2;
                        item.z = item.sz;
                    }
                }



            }else if(item.group_id === 2){
                if(item.fGoal_x >= 55){
                    if (item.x >= 55) {
                        item.x = -world.x / 2;
                        item.z = item.sz;
                    }
                }else {
                    if (item.x >= item.fGoal_x) {
                        item.x = -world.x / 2;
                        item.z = item.sz;
                    }
                }




            }
            // }else {
            //     if(item.x >= 60)
            //     {
            //         item.x = -60;
            //         item.z = item.sz;
            //     }
            // }



        }



    });


}


function haveDifferentSigns(a, b) {
    return (a > 0 && b < 0) || (a < 0 && b > 0);
}
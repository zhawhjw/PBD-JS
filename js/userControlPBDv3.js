import * as THREE from 'three';

export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS, sceneEntities, obstacleEntities, world, WORLDUNIT, mode, field, opens=[], customParam) {


    function collisionConstraint(agent_i,agent_j)
    {


        const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );
        const collisonAgentSize =  AGENTSIZE;

        const AgentDist = agentCentroidDist - collisonAgentSize;


        const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist;
        const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;


        let agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;
        let agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * AgentDist;

        if(agentCentroidDist - collisonAgentSize < 0) {


            agent_i.px += agent_i_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z;
            agent_j.px += -agent_j_scaler * dir_x;
            agent_j.pz += -agent_j_scaler * dir_z;

        }




    }

    function collisionConstraintWithWall(agent_i,wall_j_object)
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





    function getConstant(){
        let constant = 1;
        constant = 5; // 6.2 Macroscopic evaluation
        return constant;
    }

    function getTau(){
        let tau = 1;
        tau = 0.1 // 6.2 Macroscopic evaluation
        return tau
    }

    function getGamma(){
        let gamma = 1;
        gamma = -0.514 // 6.1 Microscopic Calibration (4)
        return gamma
    }

    function getXDist(a, b){
        return distance(a.x, 0, b.x, 0);

    }

    function getDist(a, b){
        return distance(a.x, a.z, b.x, b.z);
    }

    function getDensity(agent){
        // default case means no follower to leader, so the density to target is a small number
        let density = 0.0001;

        if(agent.waitAgent){

            // let dist = getDist(agent, agent.waitAgent);
            let dist = getXDist(agent, agent.waitAgent);

            density = 1 / (dist + 0.001) ;

        }

        return density;
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

    function findPerpendicularPoints(vector, point, distance) {

        const magnitude = Math.sqrt(vector.x * vector.x + vector.z * vector.z);

        // Calculate the multiplier for the distance to get the offset
        const t = distance / magnitude;

        // Calculate the coordinates of the two points
        const point1 = {
            x: point.x - t * vector.z,
            z: point.z + t * vector.x
        };
        const point2 = {
            x: point.x + t * vector.z,
            z: point.z - t * vector.x
        };


        // Return both points
        return [point1, point2];
    }





    function getVectorMagnitude(vector){
        return Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    }



    function kernel(dist, yMax, minBuffer, maxBuffer){
        let v;

        if (dist < minBuffer){
            v = 0;
        }else if(dist > maxBuffer){
            v = yMax;
        }else {
            let slope = yMax / (maxBuffer - minBuffer);
            let bias = slope * minBuffer;

            v = slope * dist - bias;
        }

        return v;
    }

    function kernel2(dist, yMax, minBuffer, maxBuffer){
        let v;

        if (dist < minBuffer){
            v = yMax;
        }else if(dist > maxBuffer){
            v = 0;
        }else {
            let slope = - yMax / (maxBuffer - minBuffer);
            let bias = - slope * maxBuffer;

            v = slope * dist + bias;
        }

        return v;
    }

    function calculateAlignmentSteering(agent, agentGroups) {

        let averageHeading = { x: 0, z: 0 };

        if (agentGroups.length === 0) {
            return averageHeading;
        }


        for (let i = 0; i < agentGroups.length; i++) {
            averageHeading.x += agentGroups[i].vx;
            averageHeading.z += agentGroups[i].vz;
        }

        averageHeading.x /= agentGroups.length;
        averageHeading.z /= agentGroups.length;


        let magnitude = Math.sqrt(averageHeading.x * averageHeading.x + averageHeading.z * averageHeading.z);
        averageHeading.x /= magnitude;
        averageHeading.z /= magnitude;



        return averageHeading;
    }


    // =======================//
    // For Realistic Following//
    //========================//

    function getUnitVector(vector){
        // Calculate the magnitude (length) of the vector
        let magnitude = getVectorMagnitude(vector);

        if (magnitude === 0){
            magnitude = 1;
        }
        // Calculate the unit vector
        return {
            x: vector.x / magnitude,
            z: vector.z / magnitude
        };
    }

    function angleBtwnVecs(vecA, vecB, angleThreshold) {
        const angle = vecA.angleTo(vecB);
        return angle < angleThreshold; // Adjust this angle to control the "field of view" for agents.
    }


    function findPotentialLeaders(item, agents){
        let candidates = [];

        for (let i =0;i<agents.length;i++){

            if(item.index === agents[i].index){
                continue;
            }

            let followerUnitVec = getUnitVector({x:item.vx, z:item.vz});
            let leadingUnitVec = getUnitVector({x:agents[i].vx, z:agents[i].vz});

            let followerVec;
            let leadingVec;
            // need to check if the vector is zero
            if (followerUnitVec.x === 0 && followerUnitVec.z === 0){
                followerVec = new THREE.Vector3( item.scenarioVec.x, 0, item.scenarioVec.z );
            }else {
                followerVec = new THREE.Vector3( followerUnitVec.x, 0, followerUnitVec.z );
            }

            if (leadingUnitVec.x === 0 && leadingUnitVec.z === 0){
                leadingVec = new THREE.Vector3( agents[i].scenarioVec.x, 0, agents[i].scenarioVec.z );
            }else {
                leadingVec = new THREE.Vector3( leadingUnitVec.x, 0, leadingUnitVec.z );
            }


            let delta_p_x = WALKINGDIR * (agents[i].x - item.x); // notice here the order is matter
            let delta_p_y = Math.abs(item.z - agents[i].z); // while here order is ignored

            //  a_v < e_a_f
            let condition1 = angleBtwnVecs(followerVec, leadingVec, EPSILON_a_f);
            // 0 < delta_p_x < e_p_x. This should be a distance vector (has direction)
            let condition2 = (delta_p_x > 0 ) && (delta_p_x < EPSILON_p_x);
            // let condition2 = (delta_p_x > 0 );

            // delta_p_y < r1 + r2
            let condition3 = delta_p_y < EPSILON_y;

            if(condition1 && condition2 && condition3){
                candidates.push(agents[i]);
            }

        }



        return candidates;
    }

    function realisticFollowing(item, agents){

        let potentialLeaders = findPotentialLeaders(item, agents);
        let followingConditions = potentialLeaders.length > 0;

        let acceleration;
        let delta_v_x ;

        if(followingConditions){

            // 3.1.1 find nearest
            let leader = null;
            // This will be used to calculate acceleration
            let minimum_delta_p_x = 999999;
            for (let i =0; i<potentialLeaders.length;i++){
                let delta_p_x = WALKINGDIR * (potentialLeaders[i].x - item.x); // order
                if(delta_p_x<minimum_delta_p_x){
                    minimum_delta_p_x = delta_p_x;
                    leader = potentialLeaders[i];
                }
            }

            item.waitAgent = leader


            if(item.reqPreVel && leader.reqPreVel){
                delta_v_x =  WALKINGDIR * (item.reqPreVel - leader.reqPreVel);

            }else {
                delta_v_x =  WALKINGDIR * (item.prev_vx - leader.prev_vx);
            }
            acceleration = 0.75 * delta_v_x / Math.pow(minimum_delta_p_x, 0.01);

        }

        // acceleration = C * delta_v_x / Math.pow(minimum_delta_p_x, GAMMA);

        //
        else {
            // if no leader find,t can fulfill its preferred speed
            // notice that this is  ithe special case for loop hallway walking simulation
            // in reality, the leader will not be teleported to another side of hallway
            // console.log("Trigger");
            acceleration = 0.1* WALKINGDIR * (item.v_pref - Math.abs(item.prev_vx)) / timestep

        }

        // reserved for 3.12 "Towards more behaviours in crowd simulation"
        // why max() here is -x is our walking direction
        // acceleration = Math.max(acceleration, accelerationCA);

        return acceleration;
    }


    /*  -----------------------  */


    const WALLSIZE = WORLDUNIT;
    const AGENTSIZE = RADIUS * 2;
    const epsilon = 0.0001;
    const ITERNUM =3;
    const KSI = 0.01;

    // delta_t in paper "Towards more behaviours in crowd simulation" is 0.1
    // TAU is 0.1 in paper "Realistic following behaviors for crowd simulation"
    // 0.1/0.1 = 1, so simply use pre_vx and pre_v to record in accordance with 3.1.2 in paper "Towards more behaviours in crowd simulation"
    // TAU and C are tied together, they are 0.1 and 1.3 respectively
    const timestep = 0.1;
    let TAU = 0.2;
    // use for getting the velocity in n frames before current frame
    let preFrame = TAU / timestep;
    let C = 5;
    let GAMMA = -0.514;
    // agent walking direction in original paper is x
    // in our case is -x, so need a correction factor
    let WALKINGDIR = -1;


    // "Towards more behaviours in crowd simulation"
    // The condition activates the following mechanism
    // 4.1 Following Behavior Result
    const EPSILON_a_f = Math.PI / 6;
    // original setting is 1.5 respect to 0.3 radius. We scale this threshold by (RADIUS / 0.3)
    // const EPSILON_p_x = 1.5 * (RADIUS / 0.3);
    const EPSILON_p_x = 2.8 * (RADIUS / 0.3);

    // refer to r1 + r2 in paper, which is the radius addition from two agents
    const EPSILON_y = 2 * RADIUS

    // make sure the looping starts from the head of agent flow, otherwise the following model won't work properly
    // sceneEntities.sort((a, b) => a.x - b.x);

    // default action if no constrain exists
    agentVelocityPlannerV5();



    // record the -tau agent speed
    sceneEntities.forEach(function (item) {

        if(item.cachedVelocity.length >= preFrame){
            item.reqPreVel = item.cachedVelocity.shift();
        }

        item.cachedVelocity.push(item.vx)

        item.prev_vx = item.vx;
        item.prev_vz = item.vz;
    });

    sceneEntities.forEach(function (item){

        // get relative speed
        let a = realisticFollowing(item, sceneEntities);
        // debug purpose
        let lead = item.waitAgent;

        item.vx = item.prev_vx + a * timestep;
        // one-d condition does not have a on z-axis
        item.vz = item.prev_vz;


    });



    sceneEntities.forEach(function (item) {

        // need to be revised
        // item.vx = KSI* item.vx + (1-KSI) * item.prev_vx
        // item.vz = KSI* item.vz + (1-KSI) * item.prev_vz

        item.px = item.x + timestep*item.vx;
        item.pz = item.z + timestep*item.vz;


    });



    let pbdIters = 0;
    let agent_a, agent_b, desDistance, i, j, idx = 0;

    i=0;
    while(i<sceneEntities.length)
    {
        j=i+1;

        while(j<sceneEntities.length)
        {
            // collisionConstraint(sceneEntities[i],sceneEntities[j]);
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

    // update and for recording purpose
    sceneEntities.forEach(function (item) {

        item.vx = (item.px-item.x)/timestep;
        item.vz = (item.pz-item.z)/timestep;


        item.vm = Math.sqrt(item.vx * item.vx + item.vz * item.vz);

        if (item.x <= -69  ) {
        // if (item.index ===0  ) {

            if(customParam.stop){

                if(item.move){
                    item.backupVm = item.vm;
                    item.vm = 0;
                    item.move = false;
                }else {
                    item.vm = 0;
                    item.move = false;

                }


            }else {

                if(!item.move){
                    // item.vm = item.backupVm;
                    item.vm = realisticFollowing(item,sceneEntities) * timestep;
                    item.px = item.x + timestep*item.vm;
                    // item.pz = item.z + timestep*item.vz;

                    item.move = true;
                }

                item.x = item.px;
                item.z = item.pz;


            }

        }else {
            item.x = item.px;
            item.z = item.pz;

        }






    });


    customParam.globalTimestamp += 1;
}


import * as THREE from 'three';

export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS, sceneEntities, obstacleEntities, world, WORLDUNIT, mode, field, opens=[]) {


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

    function isAgentInFront90(agentA, agentB, direction) {
        const difference = agentB.clone().sub(agentA);
        const angle = difference.angleTo(direction);
        return angle < Math.PI / 4; // Adjust this angle to control the "field of view" for agents.
    }

    function pickAgent(item, agents) {

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
            const follower_dir = new THREE.Vector3( item.vx, 0, item.vz );
            const direction = follower_dir.normalize();

            let flag2 = isAgentInFront90(follower_position, checkedPoint_position, direction)

            // not in front of 90 degree of vision
            if (!flag2){
                continue
            }

            let leaderVelocity = checkedAgent.vm;

            let reward = speedWeight * leaderVelocity + distWeight * (1 / (agentCentroidDist + 0.001))

            if(reward > maxReward ){

                // prevent deadlock
                if(checkedAgent.waitAgent && checkedAgent.waitAgent.index !== item.index){
                    continue
                }

                leader = checkedAgent;
                maxReward = reward;
                cachedAgents.push(checkedAgent);
            }

        }

        item.cachedAgents = cachedAgents;
        item.cachedSurroundAgents = cachedSurroundAgents;
        return leader;
    }

    function getConstant(){
        let constant = 1;
        constant = 1.3; // 6.2 Macroscopic evaluation
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

    function getRelativeSpeed(agent){

        let relative = 0;

        if(agent.waitAgent){

            let leader_vm = agent.waitAgent.vm;
            let follower_vm = agent.vm;

            if(follower_vm > leader_vm){

                relative = follower_vm - leader_vm;
            }

        }

        return relative;
    }

    /*  -----------------------  */


    const WALLSIZE = WORLDUNIT;
    const AGENTSIZE = RADIUS * 2;
    const epsilon = 0.0001;
    const timestep = 0.03;
    const ITERNUM =3;
    const KSI = 0.01;

    let C = getConstant();
    // let TAU = getTau();
    let GAMMA = getGamma();


    // find leader
    sceneEntities.forEach(function (item){
        item.waitAgent = pickAgent(item, sceneEntities);
    })


    sceneEntities.forEach(function (item){
        item.prev_vx = item.vx;
        item.prev_vy = item.vy;
        item.prev_vz = item.vz;

        // get relative speed
        let relative_vx = getRelativeSpeed(item);
        let relative_vz = 0; // according to the video, there is no vz

        let ax = C * relative_vx * Math.pow(getDensity(item), GAMMA);
        let az = C * relative_vz * Math.pow(getDensity(item), GAMMA);

        item.vx = item.prev_vx + ax * timestep;
        item.vz = item.prev_vz + az * timestep;


    });

    sceneEntities.forEach(function (item) {

        // need to be revised
        // item.vx = KSI* item.vx + (1-KSI) * item.prev_vx
        // item.vz = KSI* item.vz + (1-KSI) * item.prev_vz

        item.px = item.x + timestep*item.vx;
        item.pz = item.z + timestep*item.vz;
        item.py = item.y + timestep*item.vy;

    });

    let pbdIters = 0;
    let agent_a, agent_b, desDistance, i, j, idx = 0;

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

    });

}


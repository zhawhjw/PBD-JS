export function distance(x1, y1, x2, y2) {
      return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS,sceneEntities,obstacleEntities, world) {


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

  function collisionConstraint(agent_i,agent_j)
  {
    const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );
    const agentDist = agentCentroidDist - AGENTSIZE;
    const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist; 
    const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;

    const agent_i_goal_distance = distance(agent_i.px, agent_i.pz, agent_i.goal_x, agent_i.goal_z );
    const agent_j_goal_distance = distance(agent_j.px, agent_j.pz, agent_j.goal_x, agent_j.goal_z );


    const agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * agentDist
    const agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * agentDist 
    if(agentDist < 0)
    {
        // if agent i has the collision with the agent j, one has the smaller distance to the goal should gain 2x
        // weight on adjusted position for giving space to another agent to navigate to its goal
        if (agent_i_goal_distance >  agent_j_goal_distance){

            // const alpha = agent_i_goal_distance/agent_j_goal_distance;

            agent_i.px += agent_i_scaler * dir_x
            agent_i.pz += agent_i_scaler * dir_z
            agent_j.px += - agent_j_scaler * 2 * dir_x
            agent_j.pz += - agent_j_scaler * 2 * dir_z

        }else if(agent_i_goal_distance <  agent_j_goal_distance){

            // const alpha = agent_j_goal_distance/agent_i_goal_distance;


            agent_i.px += agent_i_scaler  * 2 * dir_x
            agent_i.pz += agent_i_scaler  * 2 * dir_z
            agent_j.px += - agent_j_scaler * dir_x
            agent_j.pz += - agent_j_scaler * dir_z

        }else {
            agent_i.px += agent_i_scaler * dir_x
            agent_i.pz += agent_i_scaler * dir_z
            agent_j.px += - agent_j_scaler * dir_x
            agent_j.pz += - agent_j_scaler * dir_z

        }


    } 
  }

    function collisionConstraintWithWall(agent_i,wall_i_object)
    {

        const wall_i = wall_i_object.userData;
        const wall_invmass = 0.5;

        const agentCentroidDist = distance(agent_i.px, agent_i.pz,
            wall_i.x, wall_i.z );
        const agentDist = agentCentroidDist - AGENTSIZE;
        const dir_x = (wall_i.x- agent_i.px)/agentCentroidDist;
        const dir_z = (wall_i.z- agent_i.pz)/agentCentroidDist;
        const agent_i_scaler = agent_i.invmass/(agent_i.invmass + wall_invmass) * agentDist
        const wall_i_scaler = wall_invmass /(agent_i.invmass + wall_invmass) * agentDist
        if(agentDist < 0)
        {
            agent_i.px += agent_i_scaler * dir_x + wall_i_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z + wall_i_scaler * dir_z;

        }
    }



  function agentVelocityPlanner()  {
    sceneEntities.forEach(function (agent_i) {
      const distToGoal = distance(agent_i.x, agent_i.z, 
                        agent_i.goal_x, agent_i.goal_z );
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

  function agentVelocityPlannerV2()  {
    sceneEntities.forEach(function (agent_i) {

        if (agent_i.path ===null){

            const distToGoal = distance(agent_i.x, agent_i.z, agent_i.goal_x, agent_i.goal_z );

            if(distToGoal < 0.1)
            {
                agent_i.vx = 0;
                agent_i.vz = 0;

            }else {
                const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
                agent_i.vx = agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.v_pref * dir_z;

            }


            return;
        }

        if (agent_i.path_index >= agent_i.path.length){


            const a_star_dest =  agent_i.path[agent_i.path_index - 1];

            agent_i.goal_x = a_star_dest.x;
            agent_i.goal_z = a_star_dest.z;

            agent_i.path = null;
            agent_i.path_index = 0;

            return;
        }

        let t = agent_i.path[agent_i.path_index];

        const distToGoal = distance(agent_i.x, agent_i.z,
            t.x, t.z );
        // distToGoal > 0.1


        if(distToGoal < Math.sqrt(RADIUS*2))
        {
            agent_i.path_index += 1;
        }else {

            const dir_x = (t.x - agent_i.x)/distToGoal;
            const dir_z = (t.z - agent_i.z)/distToGoal;
            agent_i.vx = agent_i.v_pref * dir_x;
            agent_i.vz = agent_i.v_pref * dir_z;

        }

        // agent_i.vx = 0.9999*agent_i.vx;
        // agent_i.vz = 0.9999*agent_i.vz;
    });

    }

  /*  -----------------------  */



  const AGENTSIZE = RADIUS * 2; 
  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM =3;

  // agentVelocityPlanner();
  agentVelocityPlannerV2();

  sceneEntities.forEach(function (item) {
    item.px = item.x + timestep*item.vx; 
    item.pz = item.z + timestep*item.vz; 
    item.py = item.y + timestep*item.vy;
  });


  let pbdIters = 0;
  var agent_a, agent_b, desDistance, i,j, idx = 0;

  while(pbdIters<ITERNUM)
  {
      // idx = 0;
      // while(idx < world.distanceConstraints.length)
      // {
      //     desDistance = world.distanceConstraints[idx].distance;
      //     agent_a = sceneEntities[world.distanceConstraints[idx].idx_a]
      //     agent_b = sceneEntities[world.distanceConstraints[idx].idx_b]
      //     distanceConstraint(agent_a,agent_b, desDistance);
      //     idx+=1;
      // }

      i=0;
      while(i<sceneEntities.length)
      {
          j=i+1;
          while(j<sceneEntities.length)
          {
            collisionConstraint(sceneEntities[i],sceneEntities[j])
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
              collisionConstraintWithWall(sceneEntities[i],obstacleEntities[j])
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

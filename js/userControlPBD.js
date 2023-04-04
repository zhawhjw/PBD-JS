import * as THREE from 'three';

export function distance(x1, y1, x2, y2) {
      return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS,sceneEntities,obstacleEntities, world, wallEntities, WORLDUNIT) {


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
    function seeThrough(startTile, endTile){

        const ray = new THREE.Raycaster();



        // Starting and ending coordinates of the ray
        const startCoord = new THREE.Vector3(startTile.x, startTile.y, startTile.z);
        const endCoord = new THREE.Vector3(endTile.x, endTile.y, endTile.z);

        const distance = startCoord.distanceTo(endCoord); // Maximum distance to check

        // const range = new THREE.Box3().setFromCenterAndSize(startCoord, boxSize);
        // Set the ray's position to the starting coordinate

        ray.set(startCoord, endCoord.clone().sub(startCoord).normalize());



        // Check for intersection with objects in the scene
        const intersects = ray.intersectObjects(obstacleEntities, false);

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

    function agentAhead(agent, goal){
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
        const startCoord = new THREE.Vector3(agent.x, agent.y, agent.z);
        const endCoord = new THREE.Vector3(goal.x, goal.y, goal.z);

        const distance = startCoord.distanceTo(endCoord); // Maximum distance to check

        // const range = new THREE.Box3().setFromCenterAndSize(startCoord, boxSize);
        // Set the ray's position to the starting coordinate

        ray.set(startCoord, endCoord.clone().sub(startCoord).normalize());



        // Check for intersection with objects in the scene
        const intersects = ray.intersectObjects(sceneEntities, false);

        // Filter the intersections to only include objects between the two coordinates
        const filteredIntersects = intersects.filter((intersection) => {
            return intersection.distance <= distance && intersection.distance > 0

        });

        return filteredIntersects.length <= 0;

    }

  function collisionConstraint(agent_i,agent_j)
  {
    const d = 0.2;
    const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );
    // const agentDist = agentCentroidDist - AGENTSIZE - 2*d;
    const agentDist = agentCentroidDist - AGENTSIZE;

    const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist;
    const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;

    const agent_i_goal_distance = distance(agent_i.px, agent_i.pz, agent_i.goal_x, agent_i.goal_z );
    const agent_j_goal_distance = distance(agent_j.px, agent_j.pz, agent_j.goal_x, agent_j.goal_z );

    // const dir_x_i_goal = (agent_i.goal_x- agent_i.x)/agent_i_goal_distance;
    // const dir_z_i_goal = (agent_i.goal_z- agent_i.z)/agent_i_goal_distance;
    // const dir_x_j_goal = (agent_j.goal_x- agent_j.x)/agent_j_goal_distance;
    // const dir_z_j_goal = (agent_j.goal_z- agent_j.z)/agent_j_goal_distance;

    let agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;
    let agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;

    if(agentCentroidDist - AGENTSIZE < 0) {

        // const flag_i = agentAhead({x:agent_i.x, y:agent_i.y, z:agent_i.z,}, {x:agent_i.goal_x, y:agent_i.goal_y, z:agent_i.goal_z} );
        // const flag_j = agentAhead({x:agent_j.x, y:agent_j.y, z:agent_j.z,}, {x:agent_j.goal_x, y:agent_j.goal_y, z:agent_j.goal_z} );


        agent_i.correction = true;
        agent_j.correction = true;


        // if agent i has the collision with the agent j, one has the smaller distance to the goal should gain 2x
        // weight on adjusted position for giving space to another agent to navigate to its goal
        if (agent_i_goal_distance > agent_j_goal_distance) {
            agent_j_scaler = agent_j_scaler * 3;

        } else if (agent_i_goal_distance < agent_j_goal_distance) {
            agent_i_scaler = agent_i_scaler * 3;
        }

        if (true) {
            agent_i.px += agent_i_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z;
        }

        if (true) {
            agent_j.px += -agent_j_scaler * dir_x;
            agent_j.pz += -agent_j_scaler * dir_z;
        }

    }else {
        agent_i.correction = false;
        agent_j.correction = false;
    }
    // else if(agentCentroidDist - AGENTSIZE >= 0.4){
    //     agent_i.correction = false;
    //     agent_j.correction = false;
    //
    // }




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
            agent_i.collidewall[j] = true;
            agent_i.px += agent_i_scaler * dir_x + wall_j_scaler * dir_x;
            agent_i.pz += agent_i_scaler * dir_z + wall_j_scaler * dir_z;

        }else {
            agent_i.collidewall[j] = false;
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

    function isInside(point, square) {
        // Check if the x-coordinate of the point is inside the square
        const isXInside = point.x > square.x && point.x < square.x + square.side;

        // Check if the y-coordinate of the point is inside the square
        const isYInside = point.y > square.y && point.y < square.y + square.side;

        // Return true if both coordinates are inside the square, false otherwise
        return isXInside && isYInside;
    }

    function lineIntersectsSquare(p1, p2, square) {
        // Define the coordinates of the square's corners
        var topLeft = { x: square.x, y: square.y };
        var topRight = { x: square.x + square.side, y: square.y };
        var bottomLeft = { x: square.x, y: square.y + square.side };
        var bottomRight = { x: square.x + square.side, y: square.y + square.side };

        // Test if the line intersects any of the square's sides
        if (lineIntersectsLine(p1, p2, topLeft, topRight) ||
            lineIntersectsLine(p1, p2, topRight, bottomRight) ||
            lineIntersectsLine(p1, p2, bottomRight, bottomLeft) ||
            lineIntersectsLine(p1, p2, bottomLeft, topLeft)) {
            return true;
        } else {
            return false;
        }
    }

    function lineIntersectsLine(a1, a2, b1, b2) {
        // Calculate the slope and y-intercept of each line segment
        var slopeA = (a2.y - a1.y) / (a2.x - a1.x);
        var yInterceptA = a1.y - slopeA * a1.x;
        var slopeB = (b2.y - b1.y) / (b2.x - b1.x);
        var yInterceptB = b1.y - slopeB * b1.x;

        // Calculate the x-coordinate of the intersection point
        var x = (yInterceptB - yInterceptA) / (slopeA - slopeB);

        // Check if the intersection point is within the bounds of both line segments
        if ((x >= a1.x && x <= a2.x) || (x >= a2.x && x <= a1.x)) {
            if ((x >= b1.x && x <= b2.x) || (x >= b2.x && x <= b1.x)) {
                return true;
            }
        }

        return false;
    }


  function agentVelocityPlannerV2(walls)  {

      // for(let i = 0; i<sceneEntities.length;i++)
    sceneEntities.forEach(function (agent_i) {

        if (agent_i.path ===null){

            const distToGoal = distance(agent_i.x, agent_i.z, agent_i.goal_x, agent_i.goal_z );

            if(distToGoal < 0.1)
            {
                agent_i.vx = 0;
                agent_i.vz = 0;

                agent_i.simEnd = true;

            }else {
                const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal;
                const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
                agent_i.vx = agent_i.v_pref * dir_x;
                agent_i.vz = agent_i.v_pref * dir_z;

            }


            return;
        }

        if (agent_i.path_index >= agent_i.path.length){


            // const a_star_dest =  agent_i.path[agent_i.path_index - 1];
            //
            // agent_i.goal_x = a_star_dest.x;
            // agent_i.goal_z = a_star_dest.z;

            agent_i.path = null;
            agent_i.path_index = 0;

            return;
        }

        if (agent_i.index === 13){
            // console.log();
        }

        // react detection
        let t = agent_i.path[agent_i.path_index];

        if(agent_i.path_index >= agent_i.path.length - 1){
            t = {x:agent_i.goal_x, z:agent_i.goal_z}
        }

        // let flag = false;

        // walls.forEach(function (wall_index, wall) {
        //     flag = flag || lineIntersectsSquare({x: agent_i.x, y:agent_i.z}, {x: t.x, y:t.z}, {x: wall.x, y:wall.z});
        //
        // })

        // flag = agent_i.collidewall.includes(true) && agent_i.correction;


        const distToGoal = distance(agent_i.x, agent_i.z,
            t.x, t.z );




        if(  isOverlapping({x:agent_i.x, y:agent_i.z, radius: agent_i.radius}, {x: t.x, y:t.z, side: 0.25 }))
        {
            agent_i.path_index ++;
        }else{

            // if(agent_i.vx === 0 && agent_i.vz === 0 && !agent_i.correction && agent_i.collidewall.includes(true)){
            //     // agent_i.path_index--;
            //     console.log(agent_i.index);
            // }

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


  const WALLSIZE = WORLDUNIT;
  const AGENTSIZE = RADIUS * 2; 
  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM =3;

  // agentVelocityPlanner();
  agentVelocityPlannerV2(wallEntities);

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
      //     // desDistance = world.distanceConstraints[idx].distance;
      //     agent_a = sceneEntities[world.distanceConstraints[idx].idx_a]
      //     agent_b = sceneEntities[world.distanceConstraints[idx].idx_b]
      //     distanceConstraint(agent_a,agent_b, 0.2);
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
              collisionConstraintWithWall(sceneEntities[i],obstacleEntities[j], i, j)
              j+=1;
          }
          i+=1
      }

      // i=0;
      // while(i<sceneEntities.length)
      // {
      //     j=i+1;
      //     while(j<sceneEntities.length)
      //     {
      //         collisionConstraint(sceneEntities[i],sceneEntities[j])
      //         j+=1;
      //     }
      //     i+=1
      // }



    pbdIters+=1;
  }


  sceneEntities.forEach(function (item) {

      if(item.index === 13){
          // console.log()
      }

      item.vx = (item.px-item.x)/timestep;
      item.vz = (item.pz-item.z)/timestep;
      item.vy = (item.py-item.y)/timestep;

      if(item.vx < 0.0001  && item.vz < 0.0001){
          // agent_i.path_index--;
          // console.log(item.index);
      }


      item.x = item.px;
      item.z = item.pz;
      item.y = item.py;

    // if (item.correction){
    //     item.vx = (item.px-item.x)/timestep * 0.1;
    //     item.vz = (item.pz-item.z)/timestep * 0.1;
    //     item.vy = (item.py-item.y)/timestep ;
    //
    //     item.x = item.px * 0.1;
    //     item.z = item.pz * 0.1;
    //     item.y = item.py;
    //
    //
    // }else {
    //
    // }
    //








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

import * as THREE from 'three';

export function distance(x1, y1, x2, y2) {
      return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS,sceneEntities,obstacleEntities, world, wallEntities, WORLDUNIT, matrix) {

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
    const d2 = 0.3;

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

    function following(agent_i, agent_j){

        if (agent_j.simEnd === true){
            agent_j.waitAgent = null;
            return;
        }

        const agentCentroidDist = distance(agent_i.px, agent_i.pz, agent_j.px, agent_j.pz );
        // const agent_i_v = {x: agent_i.vx, y:agent_i.vz};
        const agent_j_v = {x: agent_j.vx, y:agent_j.vz};

        // const agent_i_uv = getUnitVector(agent_i_v);
        const agent_j_uv = getUnitVector(agent_j_v);

        // const dir_i2j = {x: agent_j.px- agent_i.px, y:agent_j.pz- agent_i.pz};
        const dir_j2i = {x: agent_i.px - agent_j.px, y:agent_i.pz - agent_j.pz};

        const flag1 = (agent_j.move === true);
        const flag2 = ((agentCentroidDist - 2 * RADIUS) < d2);
        const flag3 = (degreeBetween(agent_j_uv, dir_j2i) < 30);

        const flag4 = (agent_j.move === false);
        const flag5 = ((agentCentroidDist - 2 * RADIUS) > (d1 + d2));
        const flag6 = (agent_j.waitAgent === agent_i.index);

        if (agent_i.index === 49 && agent_j.index === 60  || (agent_i.index === 60 && agent_j.index === 49)){

            if (agent_j.px === agent_j.x || agent_j.pz === agent_j.z){
                console.log("hit1");
            }

            if (agent_i.px === agent_i.x || agent_i.pz === agent_i.z){
                console.log("hit2");
            }

        }

        if (!agent_j.move){
            agent_j.px = agent_j.x;
            agent_j.pz = agent_j.z;
        }


        if ( flag1 && flag2 && flag3){
            agent_j.move = false;
            agent_j.pbx = agent_j.px;
            agent_j.pbz = agent_j.pz;
            agent_j.waitAgent = agent_i.index;

        }

        // if reactive
        if ( (flag4 && flag5 && flag6)){
            agent_j.move = true;
            agent_j.px = agent_j.pbx;
            agent_j.pz = agent_j.pbz;
            agent_j.waitAgent = null;
        }

        const flag7 = (agent_j.waitAgent === agent_i.index) && (agent_i.waitAgent === agent_j.index);
        // const flag8 = (agent_i.simEnd);

        // if deadlock


        // if i reaches goal
        // if ( flag6 && flag8 ){
        //     agent_j.move = true;
        //     agent_j.px = agent_j.pbx;
        //     agent_j.pz = agent_j.pbz;
        //     agent_j.waitAgent = null;
        // }



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

        if (agent_i_goal_distance > agent_j_goal_distance) {
            agent_j_scaler = agent_j_scaler * 2;

        } else if (agent_i_goal_distance < agent_j_goal_distance) {
            agent_i_scaler = agent_i_scaler * 2;
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

        }else {
            // agent_i.collidewall[j] = false;
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


  function agentVelocityPlannerV2()  {

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


            agent_i.path = null;
            agent_i.path_index = 0;

            return;
        }

        // if (agent_i.index === 13){
        //     // console.log();
        // }

        // react detection

        const goal = agent_i.path[agent_i.path_index];

        let t = {x:goal[0], z:goal[1]};
        if(agent_i.path_index >= agent_i.path.length - 1){
            t = {x:agent_i.goal_x, z:agent_i.goal_z}
        }

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


            // following(sceneEntities[i],sceneEntities[j]);


            collisionConstraint(sceneEntities[i],sceneEntities[j], i, j, matrix)
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

        // console.log(item);
        // item.agent.material = new THREE.MeshLambertMaterial({
        //     color: 0x000000
        // });





        // item.agent.material = new THREE.MeshLambertMaterial({
        //         color: 0xff0000
        // });





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

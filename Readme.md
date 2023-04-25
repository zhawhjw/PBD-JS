# Crowd Simulation with PBD in Javascript



## How to use

1. Run the following in your terminal, command line or shell:
```python
python server.py
```
2. A localhost http link will be printed. Copy-paste popped up and open it in your browser
4. On the opened webpage, select "Pre-config Agents" to open the simulation.
5. You will see the simulation.

## Functionality

1. Dist2Start: Distance from agent group center of mass to wall opening.
2. Dist2Goal: Distance from the wall opening to the goal positions.
3. Opening Size: Wall gap between rooms.
4. Agent Number: number of agent locomoting in this scene.
5. Random Seed: randomness control over the initial distribution of the agents
6. Starts running experiments in batch, by varying random seed. After each experiment, a json containing scenario data will be downloaded. 

Each change in the settings will trigger a restart of the simulation.


## Extras

```
sampling_points.py
```
This script creates the agent start positions via Gaussian Sampling and goal positions in a column-liked shape.
It generates the csv file "agent_sampling_scenario.csv" to contains above information. It also generates a figure to preview the shape of start positions.

```
create_json_config.py
```
It takes "agent_sampling_scenario.csv" as the input and transform it to a JS script (position.js) with a JSON array. The generated file will be placed under the ./js folder.

```
convert2UMANS.py
```
Using the download button in simulation you get a "simulation.json" contains frame data of all agent positions. This script transforms this JSON data to the desired UMANS format, "sampling_xx_agent_AStar.csv". 

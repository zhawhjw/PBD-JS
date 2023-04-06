# Crowd Simulation with PBD in Javascript



## How to use

1. Run following command at first
```python
Python server.py
```
2. There will be a localhost http link popped up and open it
3. On the opened webpage, click the link (one of top twos, anyone is ok) to open the simulation.
4. Right click within the simulated world. You will see the navigation started.


## Functionality

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
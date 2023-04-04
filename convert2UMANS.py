import json
import pandas as pd

if __name__ == "__main__":

    f = open("simulation.json")

    data = json.load(f)

    dataframe = pd.DataFrame()

    AGENTS = [agent['id'] for agent in data[0]['agents']]
    # print(AGENTS)
    dataframe['agentID'] = AGENTS

    for idx, fr in enumerate(data):
        frame_index = fr['frame']
        agents = fr['agents']

        fr_xs = []
        fr_ys = []

        for agent in agents:
            fr_xs.append(agent['x'])
            fr_ys.append(agent['y'])

        dataframe[str(idx) + "_x"] = fr_xs
        dataframe[str(idx) + "_y"] = fr_ys

        # print(agents)

    dataframe.to_csv("sampling_" + str(len(AGENTS)) + "_agent_AStar.csv", header=False, index=False)
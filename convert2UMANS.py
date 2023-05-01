import json
import pandas as pd
import os

from warnings import simplefilter
simplefilter(action="ignore", category=pd.errors.PerformanceWarning)

input_path = "downloads/"
output_path = "converts/"

if __name__ == "__main__":


    for root, dirs, files in os.walk(input_path, topdown=True):

        for f in files:

            rf = open(root + "/" + f)

            data = json.load(rf)

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
                    fr_ys.append(agent['z'])

                dataframe[str(idx) + "_x"] = fr_xs
                dataframe[str(idx) + "_y"] = fr_ys

                # print(agents)

            dataframe.to_csv(output_path + "/" + f.split(".")[0] + ".csv", header=False, index=False)
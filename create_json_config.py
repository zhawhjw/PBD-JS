import csv
import json

if __name__ == "__main__":
    # Open the CSV file for reading
    with open('agent_sampling_scenario.csv', 'r') as csvfile:
        reader = csv.reader(csvfile)
        # Read the positions and goals for each agent
        positions = list(map(float, next(reader)))
        goals = list(map(float, next(reader)))

    # Transform the data to the desired format
    data = []
    num_agents = len(positions) // 2
    for i in range(num_agents):
        agent_data = {
            'agent_id': i + 1,
            'x': positions[i * 2],
            'y': positions[i * 2 + 1],
            'gx': goals[i * 2],
            'gy': goals[i * 2 + 1]
        }
        data.append(agent_data)

#     Write the data to a JSON file
#     with open('positions.json', 'w') as jsonfile:
#         json.dump(data, jsonfile)

    json_data = json.dumps(data)

    function_name = "agentConfig"
    filename = "positions.js"
    # Create the JavaScript function code
    js_code = f"export function {function_name}() {{\n  return {json_data};\n}}"

    # Write the code to the JavaScript file
    with open('js/' + filename, 'w') as js_file:
        js_file.write(js_code)

import math

import numpy
import matplotlib.pyplot as plt
import random

import numpy as np

import pandas as pd

from matplotlib import rcParams
from warnings import simplefilter

simplefilter(action="ignore", category=pd.errors.PerformanceWarning)


# Returns theta in [-pi/2, 3pi/2]
def generate_theta(a, b):
    u = random.random() / 4.0
    theta = numpy.arctan(b / a * numpy.tan(2 * numpy.pi * u))

    v = random.random()
    if v < 0.25:
        return theta
    elif v < 0.5:
        return numpy.pi - theta
    elif v < 0.75:
        return numpy.pi + theta
    else:
        return -theta


def radius(a, b, theta):
    return a * b / numpy.sqrt((b * numpy.cos(theta)) ** 2 + (a * numpy.sin(theta)) ** 2)


def random_point(a, b):
    random_theta = generate_theta(a, b)
    max_radius = radius(a, b, random_theta)
    random_radius = max_radius * numpy.sqrt(random.random())

    return numpy.array([
        random_radius * numpy.cos(random_theta),
        random_radius * numpy.sin(random_theta)
    ])


def get_magnitude(vector, a):
    if a > 0:
        return a * math.sqrt(sum(((element / a) ** 2) for element in vector))
    else:
        return math.sqrt(sum((element ** 2) for element in vector))


def collision_constraint(x1, y1, x2, y2, ):
    correction_x1 = 0.0
    correction_y1 = 0.0
    correction_x2 = 0.0
    correction_y2 = 0.0

    diff = [x1 - x2, y1 - y2]
    alpha = max(diff)
    magnitude = get_magnitude(diff, alpha)
    if magnitude < particle_distance:
        dist = abs(particle_distance - magnitude)
        unit_direct = np.array(diff) / magnitude
        d = dist * unit_direct * 0.5
        correction_x1 = d[0]
        correction_y1 = d[1]
        correction_x2 = -d[0]
        correction_y2 = -d[1]
    return correction_x1, correction_y1, correction_x2, correction_y2


def convertWorld2Grid(world_position):
    nth_row = math.ceil(world_position.x / UNIT)
    nth_column = math.ceil(world_position.z / UNIT)

    if nth_row == 0:
        nth_row = 1

    if nth_column == 0:
        nth_column = 1

    r = nth_row - 1
    c = nth_column - 1

    return [r, c]


def convertGrid2World(r, c):
    object_position = {
        'x': start_point['x'] + UNIT / 2 + r * UNIT,
        'y': 1,
        'z': start_point['z'] + UNIT / 2 + c * UNIT,
    }

    return [object_position['x'], object_position['z']]


if __name__ == "__main__":
    # world size should be consistent in JS code
    world = {
        'x': 100,
        'y': 100
    }
    # real 3d world point to start make grid
    start_point = {
        'x': 0 - world['x'] / 2,
        'y': 0,
        'z': 0 - world['y'] / 2,
    }
    # size of grid = UNIT X UNIT, should be consistent in JS code
    UNIT = 1 * 2

    # which grid (indexed by row x column) is the center of opening
    # picked from JS obstacle configuration
    opening = [
        [20, 23],
        [20, 24],
        [20, 25],
        [20, 26],
    ]
    opening = np.array(opening)
    opens = opening[:, 1]
    # print(opens)
    mx = 20

    if len(opens) == 2:
        real_x1, real_y1 = convertGrid2World(mx, opens[0])
        real_x2, real_y2 = convertGrid2World(mx, opens[1])
        real_x, real_y = (real_x1 + real_x2) / 2, (real_y1 + real_y2) / 2

    elif len(opens) % 2 != 0:
        mid = len(opens) // 2
        middle = opens[mid]
        real_x, real_y = convertGrid2World(mx, middle)

    else:
        mid1 = len(opens) // 2
        mid2 = len(opens) // 2 + 1
        real_x1, real_y1 = convertGrid2World(mx, opens[mid1])
        real_x2, real_y2 = convertGrid2World(mx, opens[mid2])
        real_x, real_y = (real_x1 + real_x2) / 2, (real_y1 + real_y2) / 2

    print("{} {}".format(real_x, real_y))

    w = 10
    h = 45
    r = 0.4
    particle_distance = r * 2
    epsilon = 0.4
    num_points = 40

    start_x_shift = 25
    goal_x_shift = 20

    # following data

    goal_x = 0 + goal_x_shift

    points = np.array([random_point(w, h) for _ in range(num_points)])

    for idx1, p1 in enumerate(points):
        for idx2, p2 in enumerate(points):

            if idx1 == idx2:
                continue

            dx1, dy1, dx2, dy2 = collision_constraint(p1[0], p1[1], p2[0], p2[1])

            p1[0] += dx1
            p1[1] += dy1

            p2[0] += dx2
            p2[1] += dy2

            points[idx1] = p1
            points[idx2] = p2

    points = [[x - start_x_shift, y] for x, y in points]
    points = np.array(points)

    goals = [[goal_x, real_y - idx * (particle_distance + epsilon)] for idx, (x, y) in enumerate(points)]


    center_y_of_goals = (goals[0][1] + goals[-1][1]) / 2

    delta = abs(real_y - center_y_of_goals)
    goals = [[x, y + delta] for _, (x, y) in enumerate(goals)]

    print("Max Y: {}, Min Y: {}".format(max(np.array(goals)[:, 1]), min(np.array(goals)[:, 1])))

    # goals = [[goal_x, max(points[:, 1]) - idx * (particle_distance + epsilon)] for idx, (x, y) in enumerate(points)]

    indice = [i for i in range(len(goals))]

    new_frame = pd.DataFrame()

    for i, s, g in zip(indice, points, goals):
        x, y = s
        gx, gy = g

        new_frame[str(i) + "_x"] = [x, gx]
        new_frame[str(i) + "_y"] = [y, gy]

    #
    # new_frame["x"] = [x for x, y in points]
    # new_frame["y"] = [y for x, y in points]
    #
    # new_frame["gx"] = [x for x, y in goals]
    # new_frame["gy"] = [y for x, y in goals]

    new_frame.to_csv("agent_sampling_scenario.csv", index=False, header=False)

    plt.scatter(points[:, 0], points[:, 1])

    plt.ylim(-h + np.mean(points[:, 1]), h + np.mean(points[:, 1]))
    plt.xlim(-h + np.mean(points[:, 0]), h + np.mean(points[:, 0]))

    plt.show()

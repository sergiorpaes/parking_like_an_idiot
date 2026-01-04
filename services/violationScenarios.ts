export interface ViolationScenario {
    id: string;
    name: string;
    description: string;
    points: number;
}

export const VIOLATION_SCENARIOS: ViolationScenario[] = [
    {
        id: 'double_parked',
        name: 'Double Trouble',
        description: 'Vehicle is parked parallel to another parked vehicle, blocking it in.',
        points: 100
    },
    {
        id: 'blocking_driveway',
        name: 'Driveway Blocker',
        description: 'Vehicle is blocking a driveway, garage, or entrance.',
        points: 80
    },
    {
        id: 'sidewalk',
        name: 'Sidewalk Surfer',
        description: 'Vehicle is parked on the sidewalk, pavement, or pedestrian path.',
        points: 120
    },
    {
        id: 'handicap',
        name: 'Access Denied',
        description: 'Vehicle is parked in a handicap spot without a visible permit.',
        points: 150
    },
    {
        id: 'bad_angle',
        name: 'Geometry Fail',
        description: 'Vehicle is parked at a significant angle, crossing lines, or taking up multiple spots.',
        points: 50
    },
    {
        id: 'fire_hydrant',
        name: 'Hydrant Hater',
        description: 'Vehicle is blocking a fire hydrant or emergency zone.',
        points: 150
    },
    {
        id: 'crosswalk',
        name: 'Crosswalk Crusher',
        description: 'Vehicle is parked on or blocking a pedestrian crosswalk.',
        points: 130
    },
    {
        id: 'hatched_zone',
        name: 'Zone Ignorer',
        description: 'Vehicle is parked on diagonal hatched signal lines or painted safety zones.',
        points: 110
    },
    {
        id: 'intersection',
        name: 'Corner Cutter',
        description: 'Vehicle is parked too close to an intersection or on a corner, reducing visibility.',
        points: 90
    },
    {
        id: 'bus_stop',
        name: 'Bus Stop Block',
        description: 'Vehicle is parked in a designated bus stop zone.',
        points: 100
    },
    {
        id: 'bike_lane',
        name: 'Bike Lane Bandit',
        description: 'Vehicle is obstructing a designated bicycle lane.',
        points: 110
    }
];

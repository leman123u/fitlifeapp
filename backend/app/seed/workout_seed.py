"""Sample workouts: 3 plans per gym type (18 total)."""

from __future__ import annotations

import logging
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Stored lowercase for consistent filtering
WORKOUTS_SEED: list[dict[str, Any]] = [
    # --- Bodybuilding ---
    {
        "name": "Hypertrophy Push",
        "gym_type": "bodybuilding",
        "difficulty": "intermediate",
        "duration_minutes": 65,
        "exercises": [
            {
                "name": "Barbell Bench Press",
                "sets": 4,
                "reps": 8,
                "rest_seconds": 120,
                "description": "Retract scapula, controlled eccentric, touch chest lightly.",
                "muscle_group": "chest",
            },
            {
                "name": "Incline Dumbbell Press",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 90,
                "description": "30° incline, full ROM without bouncing off chest.",
                "muscle_group": "chest",
            },
            {
                "name": "Cable Fly (high-to-low)",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 60,
                "description": "Slight bend in elbows, squeeze at sternum height.",
                "muscle_group": "chest",
            },
            {
                "name": "Overhead Triceps Rope Extension",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 60,
                "description": "Elbows fixed, split rope at bottom for extra triceps long head.",
                "muscle_group": "triceps",
            },
        ],
    },
    {
        "name": "Back & Biceps Thickness",
        "gym_type": "bodybuilding",
        "difficulty": "advanced",
        "duration_minutes": 75,
        "exercises": [
            {
                "name": "Conventional Deadlift",
                "sets": 4,
                "reps": 5,
                "rest_seconds": 180,
                "description": "Hinge pattern, neutral spine, bar close to shins.",
                "muscle_group": "posterior_chain",
            },
            {
                "name": "Chest-Supported Row",
                "sets": 4,
                "reps": 10,
                "rest_seconds": 90,
                "description": "Pad supports chest; pull elbows back, pause at peak.",
                "muscle_group": "back",
            },
            {
                "name": "Lat Pulldown (wide grip)",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 75,
                "description": "Lean slightly back, drive elbows to pockets.",
                "muscle_group": "lats",
            },
            {
                "name": "EZ-Bar Preacher Curl",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 60,
                "description": "No swing; full extension without hyperextending elbows.",
                "muscle_group": "biceps",
            },
        ],
    },
    {
        "name": "Leg Hypertrophy",
        "gym_type": "bodybuilding",
        "difficulty": "intermediate",
        "duration_minutes": 70,
        "exercises": [
            {
                "name": "Back Squat",
                "sets": 4,
                "reps": 8,
                "rest_seconds": 150,
                "description": "Break parallel, knees track over toes, brace core.",
                "muscle_group": "quads",
            },
            {
                "name": "Romanian Deadlift",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 120,
                "description": "Soft knee bend, push hips back, feel hamstring stretch.",
                "muscle_group": "hamstrings",
            },
            {
                "name": "Leg Press",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 90,
                "description": "Feet mid-platform; avoid locking knees hard at top.",
                "muscle_group": "quads",
            },
            {
                "name": "Standing Calf Raise",
                "sets": 4,
                "reps": 15,
                "rest_seconds": 45,
                "description": "Pause at bottom stretch, explosive concentric.",
                "muscle_group": "calves",
            },
        ],
    },
    # --- CrossFit ---
    {
        "name": "Barbell Metcon",
        "gym_type": "crossfit",
        "difficulty": "intermediate",
        "duration_minutes": 35,
        "exercises": [
            {
                "name": "Thruster",
                "sets": 5,
                "reps": 10,
                "rest_seconds": 60,
                "description": "Front squat to overhead in one motion; hip drive finishes press.",
                "muscle_group": "full_body",
            },
            {
                "name": "Pull-Up",
                "sets": 5,
                "reps": 8,
                "rest_seconds": 60,
                "description": "Full dead hang to chin over bar; scale with band as needed.",
                "muscle_group": "back",
            },
            {
                "name": "Box Jump",
                "sets": 5,
                "reps": 12,
                "rest_seconds": 45,
                "description": "Soft landing, stand tall at top, step down for control.",
                "muscle_group": "legs",
            },
        ],
    },
    {
        "name": "Olympic Lifting Skill",
        "gym_type": "crossfit",
        "difficulty": "advanced",
        "duration_minutes": 55,
        "exercises": [
            {
                "name": "Power Clean",
                "sets": 6,
                "reps": 2,
                "rest_seconds": 120,
                "description": "Triple extension, receive in quarter squat, elbows fast.",
                "muscle_group": "full_body",
            },
            {
                "name": "Push Jerk",
                "sets": 5,
                "reps": 3,
                "rest_seconds": 120,
                "description": "Dip straight down, drive bar off shoulders, split or squat under.",
                "muscle_group": "shoulders",
            },
            {
                "name": "Front Squat",
                "sets": 4,
                "reps": 5,
                "rest_seconds": 120,
                "description": "Elbows high, torso upright, depth below parallel.",
                "muscle_group": "quads",
            },
        ],
    },
    {
        "name": "Chipper Endurance",
        "gym_type": "crossfit",
        "difficulty": "intermediate",
        "duration_minutes": 40,
        "exercises": [
            {
                "name": "Row (calories)",
                "sets": 1,
                "reps": 30,
                "rest_seconds": 0,
                "description": "Treat reps as target calories on the rower for this block.",
                "muscle_group": "conditioning",
            },
            {
                "name": "Kettlebell Swing",
                "sets": 4,
                "reps": 20,
                "rest_seconds": 45,
                "description": "Hinge, not squat; bell floats to shoulder height.",
                "muscle_group": "posterior_chain",
            },
            {
                "name": "Wall Ball",
                "sets": 4,
                "reps": 25,
                "rest_seconds": 45,
                "description": "Full squat, throw to target 10 ft, catch and cycle.",
                "muscle_group": "legs",
            },
        ],
    },
    # --- Yoga ---
    {
        "name": "Vinyasa Power Flow",
        "gym_type": "yoga",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {
                "name": "Sun Salutation B (series)",
                "sets": 3,
                "reps": 5,
                "rest_seconds": 30,
                "description": "Link breath to movement; chair, warrior I, chaturanga flow.",
                "muscle_group": "full_body",
            },
            {
                "name": "Warrior III to Half Moon",
                "sets": 2,
                "reps": 8,
                "rest_seconds": 45,
                "description": "Hip square, long spine; use block under hand if needed.",
                "muscle_group": "glutes",
            },
            {
                "name": "Forearm Plank Hold",
                "sets": 3,
                "reps": 0,
                "rest_seconds": 40,
                "description": "Hold 40s; ribs down, gaze slightly forward.",
                "muscle_group": "core",
            },
        ],
    },
    {
        "name": "Hatha Strength & Mobility",
        "gym_type": "yoga",
        "difficulty": "beginner",
        "duration_minutes": 45,
        "exercises": [
            {
                "name": "Chair Pose (Utkatasana)",
                "sets": 3,
                "reps": 6,
                "rest_seconds": 30,
                "description": "Weight in heels, arms alongside ears, sit deeper each breath.",
                "muscle_group": "quads",
            },
            {
                "name": "Bridge Pose (Setu Bandhasana)",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 40,
                "description": "Press feet, lift hips, squeeze glutes at top.",
                "muscle_group": "glutes",
            },
            {
                "name": "Seated Forward Fold",
                "sets": 2,
                "reps": 8,
                "rest_seconds": 45,
                "description": "Lengthen spine before folding; micro-bend knees if hamstrings tight.",
                "muscle_group": "hamstrings",
            },
        ],
    },
    {
        "name": "Yin Hips & Lower Back",
        "gym_type": "yoga",
        "difficulty": "beginner",
        "duration_minutes": 40,
        "exercises": [
            {
                "name": "Pigeon Pose (each side)",
                "sets": 2,
                "reps": 4,
                "rest_seconds": 120,
                "description": "Hold 2–3 min/side; square hips, fold only if knee happy.",
                "muscle_group": "hips",
            },
            {
                "name": "Reclined Butterfly",
                "sets": 1,
                "reps": 4,
                "rest_seconds": 180,
                "description": "Bolster under spine; soles together, knees fall wide.",
                "muscle_group": "hips",
            },
            {
                "name": "Supine Twist",
                "sets": 2,
                "reps": 6,
                "rest_seconds": 60,
                "description": "Knees to chest, drop across body; both shoulders grounded.",
                "muscle_group": "spine",
            },
        ],
    },
    # --- Home ---
    {
        "name": "Dumbbell Full Body Circuit",
        "gym_type": "home",
        "difficulty": "beginner",
        "duration_minutes": 35,
        "exercises": [
            {
                "name": "Goblet Squat",
                "sets": 4,
                "reps": 12,
                "rest_seconds": 60,
                "description": "Single DB at chest; elbows inside knees at bottom.",
                "muscle_group": "quads",
            },
            {
                "name": "Single-Arm Row",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 45,
                "description": "Bench or couch support; pack shoulder, row to hip.",
                "muscle_group": "back",
            },
            {
                "name": "Floor Press",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 60,
                "description": "Elbows 45°, pause 1s off floor each rep.",
                "muscle_group": "chest",
            },
        ],
    },
    {
        "name": "Band & Core Burn",
        "gym_type": "home",
        "difficulty": "intermediate",
        "duration_minutes": 30,
        "exercises": [
            {
                "name": "Banded Good Morning",
                "sets": 3,
                "reps": 15,
                "rest_seconds": 45,
                "description": "Band under feet, over traps; hinge hips, feel hamstrings.",
                "muscle_group": "hamstrings",
            },
            {
                "name": "Pallof Press",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 40,
                "description": "Per side; resist rotation, hands travel forward from sternum.",
                "muscle_group": "core",
            },
            {
                "name": "Banded Face Pull",
                "sets": 3,
                "reps": 15,
                "rest_seconds": 40,
                "description": "Pull to face height, external rotation at end range.",
                "muscle_group": "rear_delts",
            },
        ],
    },
    {
        "name": "Bodyweight HIIT Ladder",
        "gym_type": "home",
        "difficulty": "intermediate",
        "duration_minutes": 25,
        "exercises": [
            {
                "name": "Burpee",
                "sets": 5,
                "reps": 8,
                "rest_seconds": 30,
                "description": "Chest to floor optional; jump at top for intensity.",
                "muscle_group": "full_body",
            },
            {
                "name": "Reverse Lunge",
                "sets": 4,
                "reps": 10,
                "rest_seconds": 30,
                "description": "Alternating; vertical torso, back knee nearly touches.",
                "muscle_group": "legs",
            },
            {
                "name": "Push-Up",
                "sets": 4,
                "reps": 12,
                "rest_seconds": 35,
                "description": "Body line rigid; full ROM, scale on knees if needed.",
                "muscle_group": "chest",
            },
        ],
    },
    # --- Calisthenics ---
    {
        "name": "Push Progression",
        "gym_type": "calisthenics",
        "difficulty": "intermediate",
        "duration_minutes": 45,
        "exercises": [
            {
                "name": "Parallel Bar Dip",
                "sets": 4,
                "reps": 8,
                "rest_seconds": 90,
                "description": "Lean slightly forward for chest bias; full depth.",
                "muscle_group": "chest",
            },
            {
                "name": "Pike Push-Up",
                "sets": 3,
                "reps": 10,
                "rest_seconds": 75,
                "description": "Hips high, head toward floor — shoulder emphasis.",
                "muscle_group": "shoulders",
            },
            {
                "name": "Ring Push-Up",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 60,
                "description": "Turn rings out at top; keep straps stable.",
                "muscle_group": "chest",
            },
        ],
    },
    {
        "name": "Pull & Core Skills",
        "gym_type": "calisthenics",
        "difficulty": "advanced",
        "duration_minutes": 50,
        "exercises": [
            {
                "name": "Weighted Pull-Up",
                "sets": 5,
                "reps": 5,
                "rest_seconds": 120,
                "description": "Add small load; chin clears bar, controlled lower.",
                "muscle_group": "lats",
            },
            {
                "name": "Front Lever Tuck Hold",
                "sets": 4,
                "reps": 0,
                "rest_seconds": 60,
                "description": "Hold 10–15s; depress scapula, hollow body.",
                "muscle_group": "core",
            },
            {
                "name": "Hanging Leg Raise",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 60,
                "description": "Posterior pelvic tilt; no swing.",
                "muscle_group": "core",
            },
        ],
    },
    {
        "name": "Legs & Pistol Prep",
        "gym_type": "calisthenics",
        "difficulty": "intermediate",
        "duration_minutes": 40,
        "exercises": [
            {
                "name": "Assisted Pistol Squat",
                "sets": 3,
                "reps": 8,
                "rest_seconds": 90,
                "description": "Ring or TRX for balance; sit back on one leg.",
                "muscle_group": "quads",
            },
            {
                "name": "Nordic Hamstring Curl (eccentric)",
                "sets": 3,
                "reps": 5,
                "rest_seconds": 90,
                "description": "Kneel, lower slowly, push up with hands as needed.",
                "muscle_group": "hamstrings",
            },
            {
                "name": "Calf Raise (single leg)",
                "sets": 3,
                "reps": 15,
                "rest_seconds": 45,
                "description": "Slow eccentric 3s; pause at bottom stretch.",
                "muscle_group": "calves",
            },
        ],
    },
    # --- Swimming ---
    {
        "name": "Freestyle Aerobic Base",
        "gym_type": "swimming",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {
                "name": "400m Freestyle Warm-Up",
                "sets": 1,
                "reps": 400,
                "rest_seconds": 60,
                "description": "Easy pace; focus on exhaling underwater and high elbow catch.",
                "muscle_group": "conditioning",
            },
            {
                "name": "8×100m Freestyle @ CSS",
                "sets": 8,
                "reps": 100,
                "rest_seconds": 20,
                "description": "Critical swim speed pace; hold form when breathing bilaterally.",
                "muscle_group": "conditioning",
            },
            {
                "name": "200m Cool-Down Mixed Stroke",
                "sets": 1,
                "reps": 200,
                "rest_seconds": 0,
                "description": "Very easy; include backstroke or breast for variety.",
                "muscle_group": "recovery",
            },
        ],
    },
    {
        "name": "Sprint & Power Sets",
        "gym_type": "swimming",
        "difficulty": "advanced",
        "duration_minutes": 45,
        "exercises": [
            {
                "name": "15m Sprint × Block Start",
                "sets": 8,
                "reps": 15,
                "rest_seconds": 120,
                "description": "Explode off wall or blocks; streamline to breakout.",
                "muscle_group": "full_body",
            },
            {
                "name": "50m Freestyle @ 90% effort",
                "sets": 6,
                "reps": 50,
                "rest_seconds": 90,
                "description": "Race turnover; six-beat kick optional.",
                "muscle_group": "conditioning",
            },
            {
                "name": "Vertical Kick (streamline)",
                "sets": 4,
                "reps": 30,
                "rest_seconds": 45,
                "description": "30s hard kick in deep water, hands locked overhead.",
                "muscle_group": "legs",
            },
        ],
    },
    {
        "name": "IM Technique & Drills",
        "gym_type": "swimming",
        "difficulty": "beginner",
        "duration_minutes": 55,
        "exercises": [
            {
                "name": "Drill: Single-Arm Freestyle",
                "sets": 4,
                "reps": 25,
                "rest_seconds": 30,
                "description": "25m per arm; inactive arm extended, work rotation.",
                "muscle_group": "technique",
            },
            {
                "name": "100m Individual Medley",
                "sets": 4,
                "reps": 100,
                "rest_seconds": 60,
                "description": "25 fly / 25 back / 25 breast / 25 free — easy to moderate.",
                "muscle_group": "full_body",
            },
            {
                "name": "Pull Buoy Freestyle",
                "sets": 3,
                "reps": 100,
                "rest_seconds": 45,
                "description": "Isolate pull; minimize hip sway, high elbow.",
                "muscle_group": "back",
            },
        ],
    },
]


async def seed_workouts_if_empty(db: AsyncIOMotorDatabase) -> int:
    """Insert seed workouts once if the collection is empty. Returns inserted count."""
    coll = db["workouts"]
    n = await coll.count_documents({})
    if n > 0:
        logger.info("Workouts collection already seeded (%s docs), skipping", n)
        return 0
    result = await coll.insert_many(WORKOUTS_SEED)
    inserted = len(result.inserted_ids)
    logger.info("Seeded %s workout plans", inserted)
    return inserted

"""Seed diet plans: 6 calorie tiers × 3 goal types (18 plans)."""

from __future__ import annotations

import logging
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

CALORIE_TIERS = (1200, 1500, 1800, 2000, 2500, 3000)


def _m(cal: float, p_pct: float, c_pct: float, f_pct: float) -> dict[str, float]:
    """Macro grams from calorie split (percent of kcal from each macro)."""
    return {
        "protein": round((cal * p_pct / 100) / 4, 1),
        "carbs": round((cal * c_pct / 100) / 4, 1),
        "fat": round((cal * f_pct / 100) / 9, 1),
    }


def _meal(
    title: str,
    prep: int,
    ingredients: list[str],
    notes: str = "",
) -> dict[str, Any]:
    return {
        "title": title,
        "prep_minutes": prep,
        "ingredients": ingredients,
        "notes": notes,
    }


def _plan_doc(cal: int, goal: str, name: str, meals: dict[str, Any], macros: dict[str, float]) -> dict[str, Any]:
    return {
        "name": name,
        "calorie_goal": cal,
        "goal_type": goal,
        "meals": meals,
        "macros": macros,
    }


def _weight_loss_meals(cal: int) -> dict[str, Any]:
    s = max(0.6, cal / 2000)
    return {
        "breakfast": _meal(
            "Protein yogurt & berries",
            8,
            [
                f"{int(170 * s)}g 0% Greek yogurt",
                f"{int(80 * s)}g mixed berries",
                f"{int(15 * s)}g sliced almonds",
                "1 tsp honey",
                "Cinnamon",
            ],
            "Layer yogurt and berries; top with almonds.",
        ),
        "lunch": _meal(
            "Grilled chicken garden salad",
            22,
            [
                f"{int(140 * s)}g grilled chicken breast",
                "4 cups mixed greens",
                f"{int(80 * s)}g cherry tomatoes",
                "1/2 cucumber",
                "2 tbsp light vinaigrette",
                "30g feta",
            ],
            "Slice chicken warm over greens; dress lightly.",
        ),
        "dinner": _meal(
            "Baked cod with roasted vegetables",
            28,
            [
                f"{int(150 * s)}g cod fillet",
                "1 tsp olive oil, lemon",
                f"{int(200 * s)}g zucchini & bell pepper",
                f"{int(80 * s)}g cooked quinoa",
            ],
            "Bake cod 200°C 12–15 min; roast veg on same tray.",
        ),
        "snack_1": _meal(
            "Apple & cottage cheese",
            4,
            [
                f"{int(120 * s)}g low-fat cottage cheese",
                "1 medium apple, sliced",
                "Pinch cinnamon",
            ],
        ),
        "snack_2": _meal(
            "Veggie sticks & hummus",
            5,
            [
                f"{int(45 * s)}g hummus",
                "Carrot & celery sticks",
                "10 cherry tomatoes",
            ],
        ),
    }


def _muscle_gain_meals(cal: int) -> dict[str, Any]:
    s = max(0.65, cal / 2500)
    return {
        "breakfast": _meal(
            "Oatmeal bulk bowl",
            12,
            [
                f"{int(70 * s)}g rolled oats (dry)",
                "250ml milk or soy milk",
                "1 banana, sliced",
                f"{int(30 * s)}g peanut butter",
                "1 scoop whey protein (optional)",
            ],
            "Cook oats in milk; stir in PB and banana after heat.",
        ),
        "lunch": _meal(
            "Turkey & rice power plate",
            25,
            [
                f"{int(180 * s)}g lean ground turkey",
                f"{int(200 * s)}g cooked jasmine rice",
                "1 cup broccoli, steamed",
                "Low-sodium taco seasoning, 1 tsp olive oil",
            ],
        ),
        "dinner": _meal(
            "Steak, sweet potato & greens",
            35,
            [
                f"{int(200 * s)}g sirloin steak",
                f"{int(250 * s)}g baked sweet potato",
                "2 cups sautéed spinach (garlic)",
            ],
            "Rest steak 5 min before slicing.",
        ),
        "snack_1": _meal(
            "Chocolate protein shake",
            3,
            [
                "1 scoop whey protein",
                "300ml milk",
                "1/2 banana",
                "Ice",
            ],
        ),
        "snack_2": _meal(
            "Rice cakes & avocado",
            6,
            [
                "2 plain rice cakes",
                f"{int(70 * s)}g avocado",
                "Salt, chili flakes",
            ],
        ),
    }


def _maintenance_meals(cal: int) -> dict[str, Any]:
    s = max(0.65, cal / 2000)
    return {
        "breakfast": _meal(
            "Veg omelette & wholegrain toast",
            18,
            [
                "2 whole eggs + 2 egg whites",
                "Peppers, onion, spinach",
                f"{int(60 * s)}g wholegrain bread",
                "1 tsp butter",
            ],
        ),
        "lunch": _meal(
            "Mediterranean tuna bowl",
            15,
            [
                f"{int(150 * s)}g canned tuna in water",
                f"{int(120 * s)}g cooked chickpeas",
                "Cucumber, tomato, parsley",
                "1 tbsp olive oil & lemon",
                f"{int(80 * s)}g cooked couscous",
            ],
        ),
        "dinner": _meal(
            "Chicken stir-fry & brown rice",
            24,
            [
                f"{int(160 * s)}g chicken thigh, cubed",
                "Mixed stir-fry veg 300g",
                "2 tsp soy sauce, ginger, garlic",
                f"{int(180 * s)}g cooked brown rice",
                "1 tsp sesame oil",
            ],
        ),
        "snack_1": _meal(
            "Trail mix portion",
            2,
            [
                f"{int(35 * s)}g almonds",
                f"{int(25 * s)}g dried cranberries",
                "10g dark chocolate chips",
            ],
        ),
        "snack_2": _meal(
            "Greek yogurt & granola",
            5,
            [
                f"{int(150 * s)}g Greek yogurt",
                f"{int(35 * s)}g granola",
                "50g blueberries",
            ],
        ),
    }


def _build_all_plans() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for cal in CALORIE_TIERS:
        # Weight loss — higher protein emphasis
        wl_macros = _m(cal, 35, 35, 30)
        out.append(
            _plan_doc(
                cal,
                "weight_loss",
                f"Lean Cut — {cal} kcal (fat loss)",
                _weight_loss_meals(cal),
                wl_macros,
            )
        )
        # Muscle gain
        mg_macros = _m(cal, 30, 45, 25)
        out.append(
            _plan_doc(
                cal,
                "muscle_gain",
                f"Strength Fuel — {cal} kcal (muscle gain)",
                _muscle_gain_meals(cal),
                mg_macros,
            )
        )
        # Maintenance
        mn_macros = _m(cal, 30, 40, 30)
        out.append(
            _plan_doc(
                cal,
                "maintenance",
                f"Balance Plate — {cal} kcal (maintenance)",
                _maintenance_meals(cal),
                mn_macros,
            )
        )
    return out


DIET_PLANS_SEED: list[dict[str, Any]] = _build_all_plans()


async def seed_diet_plans_if_empty(db: AsyncIOMotorDatabase) -> int:
    coll = db["diet_plans"]
    n = await coll.count_documents({})
    if n > 0:
        logger.info("Diet plans already seeded (%s docs), skipping", n)
        return 0
    result = await coll.insert_many(DIET_PLANS_SEED)
    inserted = len(result.inserted_ids)
    logger.info("Seeded %s diet plans", inserted)
    return inserted

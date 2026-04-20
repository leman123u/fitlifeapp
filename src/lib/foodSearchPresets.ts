/** Quick-add foods for the nutrition search modal (client-side demo data). */
export type FoodPreset = {
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export const FOOD_PRESETS: FoodPreset[] = [
  { name: 'Chicken breast (100g cooked)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { name: 'Salmon fillet (100g)', calories: 206, protein_g: 22, carbs_g: 0, fat_g: 12 },
  { name: 'Egg (large)', calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3 },
  { name: 'Greek yogurt 0% (200g)', calories: 110, protein_g: 20, carbs_g: 8, fat_g: 0 },
  { name: 'Oatmeal cooked (1 cup)', calories: 166, protein_g: 6, carbs_g: 28, fat_g: 3.6 },
  { name: 'Banana (medium)', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 },
  { name: 'Brown rice cooked (1 cup)', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8 },
  { name: 'Sweet potato (medium baked)', calories: 103, protein_g: 2.3, carbs_g: 24, fat_g: 0.1 },
  { name: 'Whole wheat bread (1 slice)', calories: 81, protein_g: 4, carbs_g: 14, fat_g: 1.1 },
  { name: 'Avocado (half)', calories: 160, protein_g: 2, carbs_g: 8.5, fat_g: 14.7 },
  { name: 'Almonds (28g / 1oz)', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14 },
  { name: 'Protein shake (30g powder + water)', calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5 },
  { name: 'Cottage cheese low-fat (1 cup)', calories: 183, protein_g: 28, carbs_g: 11, fat_g: 5 },
  { name: 'Turkey breast slices (100g)', calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1 },
  { name: 'Tuna canned in water (100g)', calories: 116, protein_g: 26, carbs_g: 0, fat_g: 0.8 },
  { name: 'Apple (medium)', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3 },
  { name: 'Broccoli steamed (1 cup)', calories: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6 },
  { name: 'Pasta cooked (1 cup)', calories: 221, protein_g: 8.1, carbs_g: 43, fat_g: 1.3 },
  { name: 'Lean ground beef (100g cooked)', calories: 250, protein_g: 26, carbs_g: 0, fat_g: 15 },
  { name: 'Whey protein bar', calories: 200, protein_g: 20, carbs_g: 22, fat_g: 6 },
  { name: 'Mixed salad + vinaigrette', calories: 120, protein_g: 4, carbs_g: 10, fat_g: 8 },
  { name: 'Peanut butter (2 tbsp)', calories: 190, protein_g: 8, carbs_g: 6, fat_g: 16 },
  { name: 'Blueberries (1 cup)', calories: 84, protein_g: 1.1, carbs_g: 21, fat_g: 0.5 },
  { name: 'Cheddar cheese (28g)', calories: 113, protein_g: 7, carbs_g: 0.4, fat_g: 9 },
  { name: 'Black beans cooked (1 cup)', calories: 227, protein_g: 15, carbs_g: 41, fat_g: 1 },
]

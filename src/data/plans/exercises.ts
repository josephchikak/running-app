export interface ExerciseDefinition {
  id: string
  name: string
  instruction: string
  easierVariation: string
  equipment: 'none' | 'band' | 'step'
}

export const exerciseCatalog: ExerciseDefinition[] = [
  {
    id: 'chair-squat',
    name: 'Chair squat',
    instruction: 'Sit your hips back toward a chair, keep your knees tracking over your toes, then stand tall.',
    easierVariation: 'Use a higher chair and lightly push through your hands to stand.',
    equipment: 'none'
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    instruction: 'Step back softly, lower with a tall chest, then drive through the front foot to return.',
    easierVariation: 'Hold a wall and shorten the range of motion.',
    equipment: 'none'
  },
  {
    id: 'single-leg-calf-raise',
    name: 'Single-leg calf raise',
    instruction: 'Rise slowly onto the ball of one foot, pause, and lower under control.',
    easierVariation: 'Use both feet and hold a wall for balance.',
    equipment: 'none'
  },
  {
    id: 'glute-bridge',
    name: 'Glute bridge',
    instruction: 'Press through your feet, squeeze your glutes, and lift your hips without arching your back.',
    easierVariation: 'Lift only as high as you can while keeping your ribs relaxed.',
    equipment: 'none'
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    instruction: 'Keep your lower back gently grounded as you extend the opposite arm and leg.',
    easierVariation: 'Move only one heel at a time and keep both arms still.',
    equipment: 'none'
  },
  {
    id: 'side-plank',
    name: 'Side plank',
    instruction: 'Stack your shoulders and hips, brace your trunk, and hold a straight line.',
    easierVariation: 'Keep your lower knee on the floor.',
    equipment: 'none'
  },
  {
    id: 'bird-dog',
    name: 'Bird dog',
    instruction: 'Reach the opposite arm and leg long while keeping your hips square and still.',
    easierVariation: 'Extend only one arm or one leg at a time.',
    equipment: 'none'
  },
  {
    id: 'step-down',
    name: 'Controlled step-down',
    instruction: 'Lower one heel toward the floor while the standing knee tracks over the middle toes.',
    easierVariation: 'Use a lower step or tap the heel closer to the step.',
    equipment: 'step'
  },
  {
    id: 'band-side-step',
    name: 'Band side step',
    instruction: 'Keep gentle band tension and take small side steps without letting your knees collapse inward.',
    easierVariation: 'Remove the band and use a shallower knee bend.',
    equipment: 'band'
  },
  {
    id: 'hamstring-walkout',
    name: 'Hamstring walkout',
    instruction: 'From a bridge, take small heel steps away and back while keeping your hips controlled.',
    easierVariation: 'Hold a two-foot glute bridge instead.',
    equipment: 'none'
  }
]

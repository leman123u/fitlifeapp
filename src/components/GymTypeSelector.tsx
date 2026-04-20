const GYM_TYPES = [
  'Bodybuilding',
  'CrossFit',
  'Yoga',
  'Home',
  'Calisthenics',
] as const

type Props = {
  value: string
  onChange: (value: string) => void
}

export function GymTypeSelector({ value, onChange }: Props) {
  return (
    <div className="gym-type-selector" role="group" aria-label="Gym type">
      {GYM_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={value === type ? 'chip active' : 'chip'}
          onClick={() => onChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

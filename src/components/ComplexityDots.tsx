type Props = { value: 1 | 2 | 3 | 4 | 5; label?: boolean }

export default function ComplexityDots({ value, label = false }: Props) {
  return (
    <div className="flex items-center gap-2" title={`Complexity: ${value} / 5`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`block w-2 h-2 rounded-full ${
              i < value ? 'bg-accent-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs text-slate-400">complexity</span>
      )}
    </div>
  )
}

interface StatCardProps {
  value: string;
  label: string;
  isHighlighted?: boolean;
}

export default function StatCard({ value, label, isHighlighted = false }: StatCardProps) {
  const wrapper = isHighlighted
    ? 'border-2 border-vblue bg-gradient-to-br from-blue-50/40 to-white'
    : 'border border-gray-300 bg-gray-50';

  return (
    <div
      className={`${wrapper} relative rounded-xl p-8 md:p-10 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-within:shadow-lg focus-within:-translate-y-0.5`}
      tabIndex={0}
    >
      {/* subtle accent bar on top when highlighted */}
      {isHighlighted && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-vblue/70" />
      )}

      <div className={`mb-2 text-5xl font-normal tracking-tight ${isHighlighted ? 'text-vblue' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-gray-900 font-normal">{label}</div>
    </div>
  );
}
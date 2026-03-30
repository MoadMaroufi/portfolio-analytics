type Props = {
  label: string;
  value: string;
  description: string;
};

// A simple card to display one metric with a label and tooltip-style description
export default function MetricCard({ label, value, description }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-gray-500 text-xs mt-2">{description}</p>
    </div>
  );
}

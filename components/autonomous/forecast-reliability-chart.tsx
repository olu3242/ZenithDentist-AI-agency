export function ForecastReliabilityChart() {
  const values = [72, 76, 81, 79, 84, 87, 86, 89];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Forecast Reliability</h2>
      <div className="mt-5 grid h-48 grid-cols-8 items-end gap-2 border-b border-line">
        {values.map((value, index) => (
          <div key={index} className="rounded-t bg-blue" style={{ height: `${value * 1.8}px` }} />
        ))}
      </div>
    </section>
  );
}

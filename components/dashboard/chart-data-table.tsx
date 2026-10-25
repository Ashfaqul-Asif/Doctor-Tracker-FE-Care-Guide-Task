/**
 * The accessible equivalent of a chart.
 *
 * Recharts renders an SVG that conveys nothing to a screen reader, so every chart in
 * this app ships the same numbers as a real table, visually hidden. This is the
 * difference between a chart being decorative and the data being available to everyone.
 */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: [string, string];
  rows: Array<[string, number | string]>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{columns[0]}</th>
          <th scope="col">{columns[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

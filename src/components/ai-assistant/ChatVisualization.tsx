import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

export interface Visualization {
    type: 'bar' | 'pie' | 'table';
    title: string;
    /** bar/pie: array of objects. table: array of string[] rows. */
    data: Array<Record<string, unknown> | string[]>;
    /** table column headers */
    columns?: string[];
    /** bar chart config */
    config?: { xKey?: string; bars?: string[] };
}

const COLORS = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const BAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function barTooltipFormatter(value: unknown, name: string) {
    if (typeof value !== 'number') return [String(value), name];
    // heuristic: if value looks like a % (<=200) format as %, else as currency
    return value <= 200 ? [`${value}%`, name] : [fmtBRL(value), name];
}

function PieViz({ viz }: { viz: Visualization }) {
    const data = viz.data as Array<{ name: string; value: number; color?: string }>;
    return (
        <ResponsiveContainer width="100%" height={230}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => fmtBRL(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

function BarViz({ viz }: { viz: Visualization }) {
    const bars = viz.config?.bars ?? ['value'];
    const xKey = viz.config?.xKey ?? 'name';
    return (
        <ResponsiveContainer width="100%" height={230}>
            <BarChart
                data={viz.data as Record<string, unknown>[]}
                margin={{ top: 5, right: 10, left: 0, bottom: 45 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={barTooltipFormatter} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {bars.map((bar, i) => (
                    <Bar
                        key={bar}
                        dataKey={bar}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

function TableViz({ viz }: { viz: Visualization }) {
    return (
        <div className="overflow-x-auto">
            <table className="text-xs w-full">
                <thead>
                    <tr>
                        {(viz.columns ?? []).map((col) => (
                            <th
                                key={col}
                                className="text-left px-2 py-1.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(viz.data as string[][]).map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/60' : ''}>
                            {row.map((cell, j) => (
                                <td key={j} className="px-2 py-1.5 text-gray-700 dark:text-gray-300">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ChatVisualization({ viz }: { viz: Visualization }) {
    return (
        <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                {viz.title}
            </p>
            {viz.type === 'pie' && <PieViz viz={viz} />}
            {viz.type === 'bar' && <BarViz viz={viz} />}
            {viz.type === 'table' && <TableViz viz={viz} />}
        </div>
    );
}

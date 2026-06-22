import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { groupByCategory } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import type { FinancialItem } from '../../types';

const palette = ['#00E5FF', '#CBD5E1', '#94A3B8', '#64748B', '#37D67A', '#FBBF24', '#F87171', '#F8FAFC'];
const tooltipStyle = { background: '#121518', border: '1px solid rgba(91, 105, 120, 0.28)', borderRadius: 8 };

export function CategoryChart({ items }: { items: FinancialItem[] }) {
  const data = Object.entries(groupByCategory(items)).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeDebtChart({ currentIncome, expectedIncome, committedTotal }: { currentIncome: number; expectedIncome: number; committedTotal: number }) {
  const data = [
    { name: 'Recibidos', ingresos: currentIncome, compromisos: committedTotal },
    { name: 'Por recibir', ingresos: expectedIncome, compromisos: committedTotal },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" tickFormatter={(value) => formatCurrency(Number(value))} width={92} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="ingresos" fill="#00E5FF" radius={[5, 5, 0, 0]} />
          <Bar dataKey="compromisos" fill="#94A3B8" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

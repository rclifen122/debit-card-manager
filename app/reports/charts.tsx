"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/format'

type Monthly = { month: string; credit: number; debit: number }
type Item = { category: string; total: number }

type ChartsProps = {
  monthly: Monthly[]
  categories: Item[]
}

export default function Charts({ monthly, categories }: ChartsProps) {
  const totalExpense = categories.reduce((a, b) => a + Number(b.total || 0), 0)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 font-medium">Monthly Summary</h3>
        {monthly.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="credit" stroke="#16a34a" name="Income" />
                <Line type="monotone" dataKey="debit" stroke="#dc2626" name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-medium">Expense by Category</h3>
        {categories.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category" outerRadius={90}>
                  {categories.map((_, idx) => (
                    <Cell key={idx} fill={["#60a5fa","#f472b6","#34d399","#f59e0b","#f87171","#a78bfa"][idx % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
        {!!categories.length && (
          <div className="mt-3 flex items-center justify-between text-sm font-medium">
            <div>Total</div>
            <div className="text-red-700">{formatCurrency(totalExpense)}</div>
          </div>
        )}
      </Card>
    </div>
  )
}
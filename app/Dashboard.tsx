'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const CRYPTOS = [
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'ripple', name: 'XRP' },
  { id: 'cardano', name: 'ADA' },
  { id: 'stellar', name: 'XLM' },
  { id: 'pepe', name: 'PEPE' },
  { id: 'maga', name: 'TRUMP' },
  { id: 'sui', name: 'SUI' },
  { id: 'shiba-inu', name: 'SHIBA' }
];

const timeframes = [
  { label: '1D', value: '1' },
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' }
];

function calculateMACD(data) {
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    return data.reduce((acc, val, i) => {
      if (i === 0) acc.push(val);
      else acc.push(val * k + acc[i - 1] * (1 - k));
      return acc;
    }, []);
  };

  const ema12 = ema(data, 12);
  const ema26 = ema(data, 26);
  const macdLine = ema12.map((val, i) => val - ema26[i] || 0);
  const signalLine = ema(macdLine, 9);
  return { macdLine, signalLine };
}

function calculateBollinger(data, period = 20) {
  const bands = data.map((_, i) => {
    if (i < period) return { upper: null, lower: null };
    const slice = data.slice(i - period, i);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / period);
    return {
      upper: avg + 2 * std,
      lower: avg - 2 * std
    };
  });
  return bands;
}

export default function Dashboard() {
  const [cryptoId, setCryptoId] = useState('bitcoin');
  const [prices, setPrices] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState('30');
  const [macd, setMacd] = useState([]);
  const [signal, setSignal] = useState([]);
  const [bollinger, setBollinger] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${timeframe}`
      );
      const data = await res.json();
      const newPrices = data.prices.map((p: any) => p[1]);
      const newLabels = data.prices.map((p: any) =>
        new Date(p[0]).toLocaleDateString()
      );
      setPrices(newPrices);
      setLabels(newLabels);

      const { macdLine, signalLine } = calculateMACD(newPrices);
      setMacd(macdLine);
      setSignal(signalLine);
      setBollinger(calculateBollinger(newPrices));
    }

    fetchData();
  }, [cryptoId, timeframe]);

  return (
    <div className='min-h-screen bg-black text-yellow-400 p-4'>
      <h1 className='text-3xl font-bold mb-4'>📊 Dashboard Cripto</h1>
      <div className='flex gap-4 mb-6'>
        <select
          className='bg-zinc-800 text-yellow-400 p-2 rounded'
          value={cryptoId}
          onChange={(e) => setCryptoId(e.target.value)}
        >
          {CRYPTOS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className='bg-zinc-800 text-yellow-400 p-2 rounded'
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          {timeframes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className='bg-zinc-900 p-4 rounded'>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Precio (USD)',
                data: prices,
                borderColor: '#fcd535',
                backgroundColor: 'rgba(252, 213, 53, 0.1)',
                tension: 0.4
              },
              {
                label: 'MACD',
                data: macd,
                borderColor: '#00ffcc',
                tension: 0.2
              },
              {
                label: 'Signal',
                data: signal,
                borderColor: '#ff66cc',
                tension: 0.2
              },
              {
                label: 'Bollinger Upper',
                data: bollinger.map(b => b.upper),
                borderColor: '#8888ff',
                borderDash: [4, 4],
                tension: 0.2
              },
              {
                label: 'Bollinger Lower',
                data: bollinger.map(b => b.lower),
                borderColor: '#8888ff',
                borderDash: [4, 4],
                tension: 0.2
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { labels: { color: '#fcd535' } },
              tooltip: {
                backgroundColor: '#222',
                titleColor: '#fcd535',
                bodyColor: '#fff'
              }
            },
            scales: {
              x: { ticks: { color: '#fcd535' }, grid: { color: '#222' } },
              y: { ticks: { color: '#fcd535' }, grid: { color: '#222' } }
            }
          }}
        />
      </div>
    </div>
  );
}
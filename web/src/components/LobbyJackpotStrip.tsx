import { useEffect, useRef, useState } from 'react'
import { getCurrencyIconUrl } from '../lib/currencyIcons'
import type { ActiveWallet } from '../wallet/walletContext'
import './LobbyJackpotStrip.css'

function formatAmount(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

const TICK_MS = 3000
const SCRAMBLE_STEPS = 8
const SCRAMBLE_STEP_MS = 50

type Triple = readonly [number, number, number]

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** 示範用：每輪小額遞增，大／中／小 JP 幅度不同 */
function withIncrement(from: number, i: 0 | 1 | 2): number {
  const ranges: readonly [number, number][] = [
    [80, 4800],
    [18, 420],
    [2, 88],
  ]
  const [lo, hi] = ranges[i]
  return from + randomInt(lo, hi)
}

function clampPositive(n: number): number {
  return Math.max(0, Math.round(n))
}

/** scramble 幀：越接近最後一幀，亂度越小 */
function scrambleFrame(from: Triple, to: Triple, step: number): [number, number, number] {
  const t = 1 - (step + 1) / (SCRAMBLE_STEPS - 1)
  const out: [number, number, number] = [0, 0, 0]
  for (let j = 0; j < 3; j++) {
    const baseWiggle = Math.max(12, to[j] * 0.0006 + Math.abs(to[j] - from[j]) * 0.4)
    const wiggle = t * t * baseWiggle
    out[j] = clampPositive(to[j] + (Math.random() - 0.5) * 2 * wiggle)
  }
  return out
}

type Props = {
  wallet: ActiveWallet
  /** 三格金額，順序 JACKPOT 1~3 */
  amounts: readonly [number, number, number]
}

export function LobbyJackpotStrip({ wallet, amounts }: Props) {
  const coinSrc = getCurrencyIconUrl(wallet)
  const [values, setValues] = useState<Triple>(() => [amounts[0], amounts[1], amounts[2]])
  const [scrambling, setScrambling] = useState(false)
  const valuesRef = useRef<Triple>(values)
  const abortedRef = useRef(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setValues([amounts[0], amounts[1], amounts[2]])
  }, [amounts])

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    abortedRef.current = false

    const clearScrambleTimeouts = () => {
      for (const id of timeoutsRef.current) {
        clearTimeout(id)
      }
      timeoutsRef.current = []
    }

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id)
        fn()
      }, delay)
      timeoutsRef.current.push(id)
    }

    const runScramble = (from: Triple, to: Triple) => {
      if (abortedRef.current) return
      setScrambling(true)
      for (let step = 0; step < SCRAMBLE_STEPS - 1; step++) {
        const atStep = step
        schedule(() => {
          if (abortedRef.current) return
          setValues(scrambleFrame(from, to, atStep))
        }, step * SCRAMBLE_STEP_MS)
      }
      schedule(() => {
        if (abortedRef.current) return
        setValues([to[0], to[1], to[2]])
        setScrambling(false)
      }, (SCRAMBLE_STEPS - 1) * SCRAMBLE_STEP_MS)
    }

    const onTick = () => {
      if (abortedRef.current) return
      clearScrambleTimeouts()
      setScrambling(false)
      const from: Triple = valuesRef.current
      const to: [number, number, number] = [
        withIncrement(from[0], 0),
        withIncrement(from[1], 1),
        withIncrement(from[2], 2),
      ]
      runScramble(from, to)
    }

    const intervalId = setInterval(onTick, TICK_MS)
    return () => {
      abortedRef.current = true
      clearInterval(intervalId)
      clearScrambleTimeouts()
    }
  }, [])

  return (
    <div
      className="lobby-jackpot-strip"
      aria-label="Progressive jackpots (live figures refresh periodically)"
    >
      <div className="lobby-jackpot-strip__cluster" role="list" aria-hidden>
        {values.map((amount, i) => {
          return (
            <div
              key={i}
              className="lobby-jackpot-strip__cell"
              role="listitem"
            >
              <div className="lobby-jackpot-strip__title">
                <span className="lobby-jackpot-strip__word">JACKPOT</span>
                <span
                  className={
                    'lobby-jackpot-strip__index' +
                    (i === 0 ? ' is-one' : i === 1 ? ' is-two' : ' is-three')
                  }
                  aria-hidden
                >
                  {i + 1}
                </span>
              </div>
              <div className="lobby-jackpot-strip__amount-row">
                <img
                  className="lobby-jackpot-strip__coin"
                  src={coinSrc}
                  alt=""
                  width={19}
                  height={19}
                  decoding="async"
                />
                <span
                  className={
                    'lobby-jackpot-strip__amount' + (scrambling ? ' is-scrambling' : '')
                  }
                >
                  {formatAmount(amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

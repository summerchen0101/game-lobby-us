import { useContext } from 'react'
import { GameShellContext, type GameShellContextValue } from './game-shell-context'

export function useGameShell(): GameShellContextValue {
  const v = useContext(GameShellContext)
  if (!v) throw new Error('useGameShell must be used within GameShellProvider')
  return v
}

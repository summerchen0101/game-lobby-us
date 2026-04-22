import { createContext } from 'react'

export type OpenShellOptions = {
  url: string
  widthPercent?: number
  heightPercent?: number
  /** 金流頁，iframe 的 allow 與舊 Unity 外殼一致 */
  isPayment?: boolean
  openInNewWindow?: boolean
}

export type GameShellContextValue = {
  open: (o: OpenShellOptions) => void
  close: () => void
  isOpen: boolean
}

export const GameShellContext = createContext<GameShellContextValue | null>(null)

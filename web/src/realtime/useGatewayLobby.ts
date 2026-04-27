import { useContext } from 'react'
import { GatewayLobbyContext, type GatewayLobbyContextValue } from './gatewayLobbyContext'

export function useGatewayLobby(): GatewayLobbyContextValue {
  const ctx = useContext(GatewayLobbyContext)
  if (!ctx) {
    throw new Error('useGatewayLobby must be used within GatewayLobbyProvider')
  }
  return ctx
}

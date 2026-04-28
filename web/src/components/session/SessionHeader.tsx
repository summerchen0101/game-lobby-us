import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useAlert } from "../alert/alertContext";
import { getProfileAvatarById } from "../../features/lobby/profileAvatars";
import { useProfileAvatarId } from "../../features/lobby/profileAvatarStorage";
import {
  getCurrencyIconUrl,
  getCurrencyTextIconUrl,
} from "../../lib/currencyIcons";
import { GATEWAY_API_WALLET_USE } from "../../realtime/gatewayApi";
import { isGatewaySuccessCode } from "../../realtime/gatewayWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { encodeWalletUseRequestBytes } from "../../realtime/walletLobbyWire";
import { getWalletDisplay } from "../../wallet/formatWalletAmount";
import type { ActiveWallet } from "../../wallet/walletContext";
import { useWallet } from "../../wallet/walletContext";
import "./SessionChrome.css";

const BRAND_LOGO = "/images/brand/brand-logo.webp";

export function SessionHeader() {
  const { user } = useAuth();
  const { show } = useAlert();
  const { requestRef } = useGatewayLobby();
  const { avatarId } = useProfileAvatarId();
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [walletSwitchBusy, setWalletSwitchBusy] = useState(false);
  const { activeWallet, setActiveWallet } = useWallet();
  const { label, amount } = getWalletDisplay(user ?? undefined, activeWallet);

  const initial = (
    user?.displayName?.trim()?.[0] ??
    user?.id?.[0] ??
    "?"
  ).toUpperCase();

  const picked = getProfileAvatarById(avatarId);
  const showAvatarImage = Boolean(picked && !avatarImgFailed);

  useEffect(() => {
    setAvatarImgFailed(false);
  }, [avatarId]);

  async function toggleWallet() {
    const next: ActiveWallet = activeWallet === "GC" ? "SC" : "GC";
    const req = requestRef.current;
    if (!req) {
      setActiveWallet(next);
      return;
    }
    setWalletSwitchBusy(true);
    try {
      const data = encodeWalletUseRequestBytes(next);
      const r = await req({
        type: GATEWAY_API_WALLET_USE,
        data,
        debugLabel: "WALLET_USE",
      });
      if (!isGatewaySuccessCode(String(r.code ?? ""))) {
        throw new Error(
          r.errMessage?.trim() ||
            `Wallet switch failed (${String(r.code ?? "")})`,
        );
      }
      setActiveWallet(next);
    } catch (e) {
      show(e instanceof Error ? e.message : "Could not switch wallet", {
        variant: "error",
      });
    } finally {
      setWalletSwitchBusy(false);
    }
  }

  return (
    <header className="session-header" data-active-wallet={activeWallet}>
      <div className="session-header__inner">
        <div className="session-header__left">
          <img
            src={BRAND_LOGO}
            alt=""
            className="session-header__logo"
            width={44}
            height={44}
            decoding="async"
          />
          <Link
            to="/profile"
            className={
              "session-header__avatar" +
              (showAvatarImage ? " session-header__avatar--has-image" : "")
            }
            aria-label="Open profile">
            {showAvatarImage && picked ? (
              <img
                className="session-header__avatar-img"
                src={picked.imageSrc}
                alt=""
                onError={() => setAvatarImgFailed(true)}
                decoding="async"
              />
            ) : (
              initial
            )}
          </Link>
        </div>
        <div className="session-header__center">
          <div className="session-header__pill" title="Wallet balance">
            <span className="session-header__pill-label">
              <img
                src={getCurrencyTextIconUrl(activeWallet)}
                alt=""
                className="session-header__pill-label-img"
                width={30}
                height={30}
              />
              <span className="session-header__pill-label-sr">{label}</span>
            </span>
            <span className="session-header__pill-amount">{amount}</span>
            <Link
              to="/shop"
              className="session-header__pill-plus"
              aria-label="Open shop to add coins">
              <Plus
                className="session-header__pill-plus-icon"
                strokeWidth={2.4}
                aria-hidden
              />
            </Link>
          </div>
        </div>
        <div className="session-header__right">
          <button
            type="button"
            className="session-header__wallet-track"
            role="switch"
            aria-checked={activeWallet === "SC"}
            aria-label="Switch between gold coins and sweepstakes coins"
            disabled={walletSwitchBusy}
            onClick={() => void toggleWallet()}>
            <span
              className={
                "session-header__wallet-thumb" +
                (activeWallet === "SC" ? " is-sc" : " is-gc")
              }>
              <img
                src={getCurrencyIconUrl(activeWallet)}
                alt=""
                className="session-header__wallet-thumb-img"
                width={20}
                height={20}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return media || iosStandalone;
}

function isIos() {
  if (typeof navigator === "undefined") return false;

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
      setShowIosHelp(false);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <Link
        className={clsx(
          "x-btn x-btn-primary",
          size === "lg" ? "min-h-12 px-6 text-[16px]" : "",
          className,
        )}
        href="/app"
      >
        Open Covered
      </Link>
    );
  }

  async function install() {
    if (deferred) {
      setBusy(true);
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;

        if (choice.outcome === "accepted") {
          setInstalled(true);
        }
        setDeferred(null);
      } finally {
        setBusy(false);
      }

      return;
    }

    if (ios) {
      setShowIosHelp(true);
    }
  }

  return (
    <div className={clsx("flex w-full flex-col items-stretch gap-3", className)}>
      <button
        className={clsx(
          "x-btn x-btn-primary w-full",
          size === "lg" ? "min-h-12 px-6 text-[16px]" : "",
        )}
        disabled={busy}
        type="button"
        onClick={() => void install()}
      >
        {busy ? "Installing…" : ios ? "Install on iPhone" : "Install Covered"}
      </button>

      {!deferred && !ios ? (
        <p className="text-center text-[13px] leading-5 text-[#71767b]">
          Use Chrome or Edge. When the browser is ready, tap Install Covered.
          Already installed?{" "}
          <Link className="font-bold text-[#1d9bf0] hover:underline" href="/app">
            Open Covered
          </Link>
        </p>
      ) : null}

      {showIosHelp ? (
        <ol className="space-y-2 rounded-2xl border border-[#2f3336] bg-[#080808] px-4 py-3 text-left text-[14px] leading-5 text-[#e7e9ea]">
          <li>
            1. Tap the <span className="font-bold">Share</span> button in Safari
          </li>
          <li>
            2. Scroll and tap{" "}
            <span className="font-bold">Add to Home Screen</span>
          </li>
          <li>
            3. Tap <span className="font-bold">Add</span> — Covered installs on
            your device
          </li>
        </ol>
      ) : null}
    </div>
  );
}

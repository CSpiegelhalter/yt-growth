"use client";

import { useState, useRef, useCallback, memo } from "react";
import Image from "next/image";
import { useOutsideDismiss } from "./hooks/useOutsideDismiss";
import type { Channel } from "./hooks/useChannels";
import s from "../Header.module.css";

type ChannelSelectorProps = {
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | undefined;
  channelLimit: number;
  onSelectChannel: (id: string) => void;
  onUpgradeNeeded: () => void;
};

/**
 * Channel selector dropdown.
 * Manages only its own open/close state; channel data comes from props.
 */
export const ChannelSelector = memo(function ChannelSelector({
  channels,
  activeChannelId,
  activeChannel,
  channelLimit,
  onSelectChannel,
  onUpgradeNeeded,
}: ChannelSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => setDropdownOpen(false), []);

  useOutsideDismiss({
    open: dropdownOpen,
    refs: [containerRef],
    onDismiss: handleDismiss,
  });

  const handleToggle = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (channelId: string) => {
      setDropdownOpen(false);
      onSelectChannel(channelId);
    },
    [onSelectChannel]
  );

  const handleAddChannel = useCallback(() => {
    setDropdownOpen(false);
    // If under limit, we allow navigation to the add flow via the <a> tag
    // If at limit, trigger upgrade modal
    if (channels.length >= channelLimit) {
      onUpgradeNeeded();
    }
  }, [channels.length, channelLimit, onUpgradeNeeded]);

  if (channels.length === 0) return null;

  const canAddChannel = channels.length < channelLimit;

  return (
    <div ref={containerRef} className={s.channelSelector}>
      <button
        className={s.channelBtn}
        onClick={handleToggle}
        aria-expanded={dropdownOpen}
        aria-label="Select channel"
        type="button"
      >
        {activeChannel?.thumbnailUrl ? (
          <Image
            src={activeChannel.thumbnailUrl}
            alt={`${activeChannel.title ?? "Selected channel"} avatar`}
            width={24}
            height={24}
            className={s.channelThumb}
            sizes="24px"
          />
        ) : (
          <div className={s.channelThumbPlaceholder}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
            </svg>
          </div>
        )}
        <span className={s.channelName}>
          {activeChannel?.title ?? "Select Channel"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={dropdownOpen ? s.chevronUp : ""}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className={s.channelDropdown}>
          {channels.map((channel) => (
            <button
              key={channel.channel_id}
              className={`${s.channelOption} ${
                channel.channel_id === activeChannelId
                  ? s.channelOptionActive
                  : ""
              }`}
              onClick={() => handleSelect(channel.channel_id)}
              type="button"
            >
              {channel.thumbnailUrl ? (
                <Image
                  src={channel.thumbnailUrl}
                  alt={`${channel.title ?? "YouTube channel"} avatar`}
                  width={32}
                  height={32}
                  className={s.channelOptionThumb}
                  sizes="32px"
                />
              ) : (
                <div className={s.channelOptionThumbPlaceholder} />
              )}
              <span className={s.channelOptionName}>
                {channel.title ?? "Untitled Channel"}
              </span>
              {channel.channel_id === activeChannelId && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={s.checkIcon}
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
          {canAddChannel ? (
            // IMPORTANT: Use a plain <a> (hard navigation) for API redirect endpoints.
            // Using next/link here triggers a client-side navigation/prefetch attempt that can
            // briefly throw a navigation/fetch error before the browser follows the redirect
            // to accounts.google.com.
            <a
              href="/api/integrations/google/start"
              className={s.addChannelLink}
              onClick={() => setDropdownOpen(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Channel
            </a>
          ) : (
            <button
              className={s.addChannelLink}
              onClick={handleAddChannel}
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Channel
            </button>
          )}
        </div>
      )}
    </div>
  );
});

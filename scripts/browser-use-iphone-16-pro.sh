#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:3001}"
LEFT=40
TOP=80
WINDOW_WIDTH=478
WINDOW_HEIGHT=1040

browser-use close >/dev/null 2>&1 || true
browser-use --headed open "$URL" >/dev/null
sleep 2

osascript <<APPLESCRIPT
on resizeWindow(appName, leftPos, topPos, widthPx, heightPx)
  try
    tell application appName
      activate
      if (count of windows) is 0 then
        return false
      end if
      set bounds of front window to {leftPos, topPos, leftPos + widthPx, topPos + heightPx}
      return true
    end tell
  on error
    return false
  end try
end resizeWindow

if resizeWindow("Google Chrome", ${LEFT}, ${TOP}, ${WINDOW_WIDTH}, ${WINDOW_HEIGHT}) then
  return
end if

if resizeWindow("Google Chrome for Testing", ${LEFT}, ${TOP}, ${WINDOW_WIDTH}, ${WINDOW_HEIGHT}) then
  return
end if

if resizeWindow("Chromium", ${LEFT}, ${TOP}, ${WINDOW_WIDTH}, ${WINDOW_HEIGHT}) then
  return
end if

if resizeWindow("Brave Browser", ${LEFT}, ${TOP}, ${WINDOW_WIDTH}, ${WINDOW_HEIGHT}) then
  return
end if

error "Could not find a browser window to resize for browser-use"
APPLESCRIPT

sleep 1
browser-use eval 'JSON.stringify({innerWidth: window.innerWidth, innerHeight: window.innerHeight, href: location.href})'

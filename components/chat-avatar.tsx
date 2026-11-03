import Image from "next/image"
import { Avatar, Style } from "@dicebear/core"
import gaze from "@dicebear/styles/gaze.json"

import { cn } from "@/lib/utils"

const style = new Style(gaze)

type ChatAvatarProps = {
  seed: string
  animated?: boolean
  className?: string
}

export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = new Avatar(style, {
    seed,
    animationVariant: [animated ? "medium" : "none"],
  }).toDataUri()

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn("size-8 rounded-full", className)}
    />
  )
}

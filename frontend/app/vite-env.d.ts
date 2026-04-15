/// <reference types="vite/client" />

declare module "*.svg" {
  const src: string
  export default src
}

declare module "*.svg?react" {
  import type { ComponentType, SVGProps } from "react"
  const ReactComponent: ComponentType<
    SVGProps<SVGSVGElement> & { title?: string; className?: string }
  >
  export default ReactComponent
}

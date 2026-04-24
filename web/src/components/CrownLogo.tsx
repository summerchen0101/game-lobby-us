type Props = {
  className?: string
  width?: number
  /** Logo mark only (no extra wrapper) */
  'aria-hidden'?: boolean
}

/** Simplified two-tone mark aligned with crown-theme (gold / mint). */
export function CrownLogo({ className, width = 72, ...rest }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 64"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        fill="#e6c040"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M42.3471 27.0398C38.1085 21.133 31.1823 17.2852 23.3573 17.2852C10.4574 17.2852 0 27.7426 0 40.6425C0 53.5423 10.4574 63.9997 23.3573 63.9997C31.1988 63.9997 38.1378 60.1356 42.374 54.2077C40.0425 50.2107 38.7068 45.5617 38.7068 40.6007C38.7068 35.6588 40.0323 31.0264 42.3471 27.0398Z"
      />
      <path
        fill="#22c55e"
        d="M66.0643 63.9997C78.9642 63.9997 89.4216 53.5423 89.4216 40.6425C89.4216 27.7426 78.9642 17.2852 66.0643 17.2852C53.1645 17.2852 42.707 27.7426 42.707 40.6425C42.707 53.5423 53.1645 63.9997 66.0643 63.9997Z"
      />
    </svg>
  )
}

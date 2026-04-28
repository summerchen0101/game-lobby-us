import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

type ModalWrap = 'input' | 'password'

export type AuthClearableInputWrapProps = {
  variant: 'page' | 'modal'
  /** For modal password rows that use `.auth-modal__password-wrap`. */
  modalWrap?: ModalWrap
  value: string
  onClear: () => void
  clearAriaLabel: string
  suffix?: ReactNode
  children: ReactElement
}

function joinClassNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function AuthClearableInputWrap({
  variant,
  modalWrap = 'input',
  value,
  onClear,
  clearAriaLabel,
  suffix,
  children,
}: AuthClearableInputWrapProps) {
  if (!isValidElement(children)) {
    return children
  }

  const hasClear = value.length > 0
  const hasSuffix = Boolean(suffix)

  const pageWrap = joinClassNames(
    'auth-form__input-wrap',
    hasClear && 'auth-form__input-wrap--has-clear',
    hasSuffix && 'auth-form__input-wrap--has-suffix',
  )

  const modalOuter =
    modalWrap === 'password' ? 'auth-modal__password-wrap' : 'auth-modal__input-wrap'

  const modalWrapClass = joinClassNames(
    modalOuter,
    hasClear && `${modalOuter}--has-clear`,
    hasSuffix && `${modalOuter}--has-suffix`,
  )

  const wrapClass = variant === 'page' ? pageWrap : modalWrapClass

  const clearBtnClass =
    variant === 'page' ? 'auth-form__clear-btn' : 'auth-modal__clear-btn'

  const child = children as ReactElement<{ className?: string }>
  const inputClassExtra =
    variant === 'page'
      ? joinClassNames(hasClear && 'auth-form__input--has-clear', hasSuffix && 'auth-form__input--has-suffix')
      : joinClassNames(
          hasClear && 'auth-modal__input--has-clear',
          hasSuffix && 'auth-modal__input--has-suffix',
        )

  const mergedChild = cloneElement(child, {
    className: joinClassNames(child.props.className, inputClassExtra),
  })

  return (
    <div className={wrapClass}>
      {mergedChild}
      {hasClear ? (
        <button type="button" className={clearBtnClass} onClick={onClear} aria-label={clearAriaLabel}>
          ×
        </button>
      ) : null}
      {suffix}
    </div>
  )
}

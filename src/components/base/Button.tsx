// components/base/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/style'

/**
 * appearance: solid / outline
 * tone:
 *  - primary  -> 使用 --btn-primary-* / --btn-outline-* 變數（主題感知）
 *  - white/black/orange -> 指定固定色（不跟主題換）
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[10px] px-4 select-none fw-m track--15 ' +
    'transition-[transform,opacity,background-color,box-shadow,border-color,color] duration-150 ease-out ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ' +
    'active:scale-[0.98]',
  {
    variants: {
      appearance: {
        solid: '',
        outline: 'bg-transparent border',
      },
      tone: {
        primary: '', // 下面用 compoundVariants 決定最終樣式
        white: '',
        black: '',
        orange: '',
      },
      size: {
        sm: 'h-9 lh-18',
        md: 'h-10 lh-20',
        lg: 'h-12 lh-24',
      },
      text: {
        xs: 'tx-12',
        md: 'tx-16',
        lg: 'tx-18',
      },
      block: { true: 'w-full' },
    },
    compoundVariants: [
      /** solid */
      {
        appearance: 'solid',
        tone: 'primary',
        class:
          // 主題感知（你的 global.css 內已定義）
          'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] ' +
          'hover:bg-[var(--btn-primary-bg-hover)]',
      },
      {
        appearance: 'solid',
        tone: 'white',
        class:
          'bg-[var(--color-white)] text-[var(--color-black)] ' +
          'hover:opacity-95 border border-border/40 dark:border-border/60',
      },
      {
        appearance: 'solid',
        tone: 'black',
        class: 'bg-[var(--color-black)] text-[var(--color-white)] hover:opacity-95',
      },
      {
        appearance: 'solid',
        tone: 'orange',
        class:
          'bg-[var(--color-orange-500)] text-[var(--color-white)] hover:opacity-95 ' +
          'shadow-[0_0_0_1px_rgba(0,0,0,0.04)]',
      },

      /** outline */
      {
        appearance: 'outline',
        tone: 'primary',
        class:
          // 主題感知 outline（你在 global.css 已定義 dark/ light）
          'text-[var(--btn-outline-fg)] border-[var(--btn-outline-border)] ' +
          'hover:bg-[var(--btn-outline-bg-hover)]',
      },
      {
        appearance: 'outline',
        tone: 'white',
        class: 'text-[var(--color-white)] border-[var(--color-white)]/90 hover:bg-white/5',
      },
      {
        appearance: 'outline',
        tone: 'black',
        class: 'text-[var(--color-black)] border-[var(--color-black)]/90 hover:bg-black/5',
      },
      {
        appearance: 'outline',
        tone: 'orange',
        class:
          'text-[var(--color-orange-500)] border-[var(--color-orange-500)] hover:bg-[color-mix(in_oklab,var(--color-orange-500)_10%,transparent)]',
      },
    ],
    defaultVariants: {
      appearance: 'solid',
      tone: 'primary',
      size: 'md',
      text: 'md',
    },
  }
)

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode
}

export function Button({
  children,
  className,
  appearance,
  tone,
  size,
  text,
  block,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        buttonVariants({ appearance, tone, size, text, block }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

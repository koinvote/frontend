// components/base/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/style'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[10px] px-4 select-none fw-m track--15 ' +
    'transition-[transform,opacity,background-color,box-shadow] duration-150 ease-out ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-orange-500)] ' +
    'active:scale-[0.98]',
  {
    variants: {
      variant: {
        white:
          'bg-[var(--color-white)] text-[var(--color-black)] ' +
          'hover:opacity-95 dark:hover:opacity-95 ' +
          'border border-[color:var(--color-border)]/40 dark:border-[color:var(--color-border)]/60',
        black:
          'bg-[var(--color-black)] text-[var(--color-white)] ' +
          'hover:opacity-95 dark:hover:opacity-95',
        orange:
          'bg-[var(--color-orange-500)] text-[var(--color-white)] ' +
          'hover:opacity-95 dark:hover:opacity-95 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]',
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
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'white',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode
}

/** example
 * <Button variant="white">White</Button>
 * <Button variant="black" size="lg" block>Black Full</Button>
 * <Button variant="orange" className="rounded-2xl px-6">Orange Custom</Button>
 */
export function Button({
  children,
  className,
  variant,
  size,
  block,
  text,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size, text, block }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

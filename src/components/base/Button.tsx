import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

import { cn } from '@/utils/style'

const buttonVariants = cva('rounded-[8px] text-primary', {
  variants: {
    type: {
      default: '',
      primary: 'bg-btn-primary text-primary-reverse hover:bg-btn-primary-hover',
      secondary: 'bg-btn-secondary text-primary-reverse hover:bg-btn-secondary-hover',
      tertiary: 'bg-btn-tertiary text-primary-reverse hover:bg-btn-tertiary-hover',
      outline: 'bg-panel-white border-[1px] border-gray300',
      danger: 'bg-error text-primary-reverse',
      warning: 'bg-error/10 text-error',
      link: '',
    },
    size: {
      md: 't-sb px-4 py-3',
      sm: 't-xs px-3 py-2',
    },
    block: {
      true: 'w-full',
    },
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
  compoundVariants: [
    {
      type: 'primary',
      disabled: true,
      class: 'bg-btn-primary/50 text-primary-reverse/50',
    },
    {
      type: 'secondary',
      disabled: true,
      class: 'bg-btn-secondary/50 text-primary-reverse/50',
    },
    {
      type: 'tertiary',
      disabled: true,
      class: 'bg-btn-tertiary/50 text-primary-reverse/50',
    },
    {
      type: 'danger',
      disabled: true,
      class: 'bg-error/50 text-primary-reverse/50',
    },
    {
      type: 'warning',
      disabled: true,
      class: 'bg-error/5 text-error/50',
    },
    {
      type: 'outline',
      disabled: true,
      class: 'text-tertiary/50 border-gray300/50',
    },
    {
      type: 'default',
      disabled: true,
      class: 'bg-panel-gray-100/50 text-primary/50',
    },
    {
      type: 'link',
      disabled: true,
      class: 'opacity-40',
    },
  ],
  defaultVariants: {
    type: 'default',
    size: 'md',
    block: false,
  },
})

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children?: ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => any
}

export function Button({ children, type, size, className, block, disabled, onClick }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ type, size, block, disabled }), className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

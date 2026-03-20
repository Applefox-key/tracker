import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        paddingClasses[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div {...props} className={['mb-4', className].join(' ')}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3 {...props} className={['text-lg font-semibold text-gray-900', className].join(' ')}>
      {children}
    </h3>
  )
}

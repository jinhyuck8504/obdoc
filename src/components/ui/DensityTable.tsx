import React from 'react'
import { cn } from '@/lib/utils'
import { useDensity } from '@/contexts/DensityContext'

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DensityTable = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density, ...props }, ref) => {
    const { density: contextDensity, getDensityClass } = useDensity()
    const activeDensity = density || contextDensity

    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm',
            getDensityClass('table'),
            `table-${activeDensity}`,
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
DensityTable.displayName = 'DensityTable'

const DensityTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
DensityTableHeader.displayName = 'DensityTableHeader'

const DensityTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
DensityTableBody.displayName = 'DensityTableBody'

const DensityTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
DensityTableFooter.displayName = 'DensityTableFooter'

const DensityTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
))
DensityTableRow.displayName = 'DensityTableRow'

const DensityTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { getDensityClass } = useDensity()
  
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        getDensityClass('table-cell'),
        className
      )}
      {...props}
    />
  )
})
DensityTableHead.displayName = 'DensityTableHead'

const DensityTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { getDensityClass } = useDensity()
  
  return (
    <td
      ref={ref}
      className={cn(
        'align-middle [&:has([role=checkbox])]:pr-0',
        getDensityClass('table-cell'),
        className
      )}
      {...props}
    />
  )
})
DensityTableCell.displayName = 'DensityTableCell'

const DensityTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
DensityTableCaption.displayName = 'DensityTableCaption'

export {
  DensityTable,
  DensityTableHeader,
  DensityTableBody,
  DensityTableFooter,
  DensityTableHead,
  DensityTableRow,
  DensityTableCell,
  DensityTableCaption,
}
'use client'

import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, ArrowLeft02Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void 
  maxVisiblePages?: number
  showPageNumbers?: boolean
  className?: string
}

interface PaginationWithInfoProps extends Omit<PaginationProps, 'onPageChange'> {
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void 
  showInfo?: boolean
}

const Pagination = ({ currentPage, totalPages, onPageChange, maxVisiblePages = 5, showPageNumbers = true, className }: PaginationProps) => {
  if (totalPages <= 1) return null

  // Calculate visible page range
  const getVisiblePages = (): number[] => {
    const halfVisible = Math.floor(maxVisiblePages / 2)
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    const pages: number[] = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  const visiblePages = getVisiblePages()

  // Create button click handler
  const handlePageClick = (page: number) => {
    onPageChange(page)
  }

  return (
    <nav 
      className={cn('flex items-center justify-center space-x-1', className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
      </button>

      {/* First Page */}
      {showPageNumbers && visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => handlePageClick(1)}
            className={cn(
              'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
              currentPage === 1
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="px-2">
              <HugeiconsIcon icon={MoreHorizontalIcon}  className="w-4 h-4 text-gray-400" />
            </span>
          )}
        </>
      )}

      {/* Visible Page Numbers */}
      {showPageNumbers && visiblePages.map((page: number) => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          className={cn(
            'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
            currentPage === page
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Last Page */}
      {showPageNumbers && visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2">
              <HugeiconsIcon icon={MoreHorizontalIcon}  className="w-4 h-4 text-gray-400" />
            </span>
          )}
          <button
            onClick={() => handlePageClick(totalPages)}
            className={cn(
              'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
              currentPage === totalPages
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <HugeiconsIcon icon={ArrowRight02Icon}  className="w-4 h-4" />
      </button>
    </nav>
  )
}

export const PaginationWithInfo = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, showInfo = true, ...props }: PaginationWithInfoProps) => {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {showInfo && totalItems > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold">{startItem}-{endItem}</span> of{' '}
          <span className="font-semibold">{totalItems.toLocaleString()}</span> items
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        {...props}
      />
    </div>
  )
}

export default Pagination
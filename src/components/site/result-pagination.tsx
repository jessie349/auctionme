import { Button } from '@/components/ui/button'

export function ResultPagination({
  page,
  hasMore,
  onPage,
}: {
  page: number
  hasMore: boolean
  onPage: (page: number) => void
}) {
  if (page === 1 && !hasMore) return null
  return (
    <nav
      aria-label="Result pages"
      className="mt-8 flex items-center justify-between gap-4 border-t pt-5"
    >
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {page}
      </span>
      <Button
        variant="outline"
        disabled={!hasMore || page >= 10000}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}

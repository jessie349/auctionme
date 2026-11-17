import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Gavel, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuctionCard } from '@/components/site/auction-card'
import { EmptyState } from '@/components/site/empty-state'
import { ResultPagination } from '@/components/site/result-pagination'
import { NativeSelect } from '@/components/site/native-select'
import {
  AUCTION_STATUSES,
  CATEGORIES,
  CONDITIONS,
  COUNTRIES,
  STATUS_LABELS,
  listAuctionPage,
  type AuctionQuery,
} from '@/lib/marketplace'

const VIEWS = [
  { value: 'all', label: 'All auctions' },
  { value: 'timed', label: 'Traditional' },
  { value: 'live', label: 'Live auctions' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ending-soon', label: 'Ending soon' },
  { value: 'featured', label: 'Featured' },
] as const

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ending-soon', label: 'Ending soonest' },
  { value: 'highest-bid', label: 'Highest bid' },
  { value: 'lowest-start', label: 'Lowest starting price' },
] as const

/** Narrow a mapped array of literals to the tuple type z.enum expects. */
function tuple<T extends string>(values: T[]) {
  return values as [T, ...T[]]
}

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
  view: z
    .enum(tuple(VIEWS.map((v) => v.value)))
    .optional()
    .catch(undefined),
  q: z.string().max(120).optional().catch(undefined),
  category: z
    .enum(tuple(CATEGORIES.map((c) => c.slug)))
    .optional()
    .catch(undefined),
  country: z
    .enum(tuple(COUNTRIES.map((c) => c.code)))
    .optional()
    .catch(undefined),
  location: z.string().max(80).optional().catch(undefined),
  condition: z
    .enum(tuple(CONDITIONS.map((c) => c.value)))
    .optional()
    .catch(undefined),
  status: z.enum(AUCTION_STATUSES).optional().catch(undefined),
  minPrice: z.coerce
    .number()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER / 100)
    .optional()
    .catch(undefined),
  maxPrice: z.coerce
    .number()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER / 100)
    .optional()
    .catch(undefined),
  sort: z
    .enum(tuple(SORTS.map((s) => s.value)))
    .optional()
    .catch(undefined),
})

type Search = z.infer<typeof searchSchema>

/** Statuses buyers can filter by — drafts and pending listings are never public. */
const PUBLIC_STATUSES = AUCTION_STATUSES.filter(
  (s) => s !== 'draft' && s !== 'pending_approval',
)

export const Route = createFileRoute('/auctions')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAuctionPage(deps as AuctionQuery),
  head: () => ({ meta: [{ title: 'Browse auctions — AuctionMe' }] }),
  component: AuctionsPage,
})

function AuctionsPage() {
  const { items: auctions, page, hasMore } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/auctions' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const view = search.view ?? 'all'
  const activeView = VIEWS.find((v) => v.value === view)!

  const update = (patch: Partial<Search>) =>
    navigate({
      search: (prev) => {
        const next = { ...prev, page: undefined, ...patch }
        for (const k of Object.keys(next) as (keyof Search)[]) {
          if (next[k] === '' || next[k] === undefined) delete next[k]
        }
        return next
      },
      replace: true,
    })

  const filterCount = (
    [
      'category',
      'country',
      'location',
      'condition',
      'status',
      'minPrice',
      'maxPrice',
    ] as const
  ).filter((k) => search[k] !== undefined).length

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          Discover
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{activeView.label}</h1>
      </header>

      <nav
        aria-label="Discovery views"
        className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            to="/auctions"
            search={(prev) => ({
              ...prev,
              page: undefined,
              view: v.value === 'all' ? undefined : v.value,
            })}
            className={
              v.value === view
                ? 'shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
                : 'shrink-0 rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'
            }
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <form
        role="search"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get('q')
          update({ q: typeof q === 'string' ? q : undefined })
        }}
      >
        <Label htmlFor="q" className="sr-only">
          Search products, sellers or categories
        </Label>
        <Input
          id="q"
          name="q"
          key={search.q ?? ''}
          defaultValue={search.q ?? ''}
          placeholder="Search products, sellers or categories"
          className="h-11 flex-1 bg-card"
        />
        <div className="flex gap-2">
          <Button type="submit" className="h-11 flex-1 sm:flex-none">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal /> Filters
            {filterCount ? ` (${filterCount})` : ''}
          </Button>
        </div>
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside
          id="filters"
          className={`${filtersOpen ? 'block' : 'hidden'} space-y-5 rounded-2xl border bg-card p-5 lg:block lg:self-start`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold tracking-normal">
              Filters
            </h2>
            {filterCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  update({
                    category: undefined,
                    country: undefined,
                    location: undefined,
                    condition: undefined,
                    status: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })
                }
              >
                <X /> Clear
              </Button>
            )}
          </div>
          <Field label="Category" id="f-category">
            <NativeSelect
              id="f-category"
              value={search.category ?? ''}
              onChange={(e) =>
                update({
                  category: (e.target.value || undefined) as Search['category'],
                })
              }
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Country" id="f-country">
            <NativeSelect
              id="f-country"
              value={search.country ?? ''}
              onChange={(e) =>
                update({
                  country: (e.target.value || undefined) as Search['country'],
                })
              }
            >
              <option value="">Any country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="City or region" id="f-location">
            <Input
              id="f-location"
              key={search.location ?? ''}
              defaultValue={search.location ?? ''}
              placeholder="e.g. Lagos"
              onBlur={(e) => update({ location: e.target.value || undefined })}
            />
          </Field>
          <Field label="Condition" id="f-condition">
            <NativeSelect
              id="f-condition"
              value={search.condition ?? ''}
              onChange={(e) =>
                update({
                  condition: (e.target.value ||
                    undefined) as Search['condition'],
                })
              }
            >
              <option value="">Any condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Auction status" id="f-status">
            <NativeSelect
              id="f-status"
              value={search.status ?? ''}
              onChange={(e) =>
                update({
                  status: (e.target.value || undefined) as Search['status'],
                })
              }
            >
              <option value="">Any status</option>
              {PUBLIC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Price</legend>
            <div className="flex items-center gap-2">
              <Input
                aria-label="Minimum price"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="Min"
                key={`min-${search.minPrice ?? ''}`}
                defaultValue={search.minPrice ?? ''}
                onBlur={(e) =>
                  update({
                    minPrice: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
              <span className="text-muted-foreground">–</span>
              <Input
                aria-label="Maximum price"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="Max"
                key={`max-${search.maxPrice ?? ''}`}
                defaultValue={search.maxPrice ?? ''}
                onBlur={(e) =>
                  update({
                    maxPrice: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </fieldset>
        </aside>

        <section aria-label="Results">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {auctions.length} {auctions.length === 1 ? 'auction' : 'auctions'}{' '}
              on this page
              {search.q ? ` matching “${search.q}”` : ''}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm text-muted-foreground">
                Sort
              </Label>
              <NativeSelect
                id="sort"
                className="w-48"
                value={search.sort ?? 'newest'}
                onChange={(e) =>
                  update({ sort: e.target.value as Search['sort'] })
                }
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {auctions.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {auctions.map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Gavel}
              title={
                page > 1
                  ? 'No more auctions on this page'
                  : search.q || filterCount
                    ? 'No auctions match your search'
                    : 'No approved auctions yet'
              }
              description={
                page > 1
                  ? 'Use Previous to return to earlier results.'
                  : search.q || filterCount
                    ? 'Try removing a filter or searching for something broader.'
                    : 'Listings appear here once they are approved by moderators. Sellers can start preparing listings today.'
              }
              action={
                <>
                  {(search.q || filterCount > 0) && (
                    <Button variant="outline" asChild>
                      <Link to="/auctions" search={{ view: search.view }}>
                        Clear search
                      </Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to="/sell">Create a listing</Link>
                  </Button>
                </>
              }
            />
          )}
          <ResultPagination
            page={page}
            hasMore={hasMore}
            onPage={(next) => {
              void update({ page: next })
            }}
          />
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ImagePlus, Info, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AuctionCard } from '@/components/site/auction-card'
import { NativeSelect } from '@/components/site/native-select'
import {
  CATEGORIES,
  CONDITIONS,
  COUNTRIES,
  CURRENCIES,
  SHIPPING_OPTIONS,
  formatMoney,
  type Auction,
} from '@/lib/marketplace'

export const Route = createFileRoute('/sell')({
  head: () => ({ meta: [{ title: 'Create a listing — AuctionMe' }] }),
  component: SellPage,
})

const MAX_IMAGES = 10
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const money = z.coerce
  .number({ error: 'Enter an amount.' })
  .positive('Must be greater than zero.')
  .max(100_000_000, 'Amount is too large.')

const listingSchema = z
  .object({
    title: z.string().trim().min(8, 'Use at least 8 characters.').max(120),
    description: z
      .string()
      .trim()
      .min(40, 'Describe the item in at least 40 characters.')
      .max(5000),
    category: z.string().min(1, 'Choose a category.'),
    condition: z.string().min(1, 'Choose a condition.'),
    format: z.enum(['timed', 'live']),
    currency: z.string().min(1),
    startingPrice: money,
    minIncrement: money,
    reservePrice: z
      .union([z.literal(''), z.coerce.number().positive()])
      .optional(),
    quantity: z.coerce.number().int().min(1).max(999),
    city: z.string().trim().min(2, 'Enter the item location.').max(80),
    country: z.string().min(1, 'Choose a country.'),
    shipping: z.array(z.string()).min(1, 'Choose at least one option.'),
    startsAt: z.string().min(1, 'Choose a start time.'),
    endsAt: z.string().min(1, 'Choose an end time.'),
  })
  .superRefine((v, ctx) => {
    const start = Date.parse(v.startsAt)
    const end = Date.parse(v.endsAt)
    if (start && start < Date.now() - 60_000)
      ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'Start time must be in the future.' })
    if (start && end && end - start < 60 * 60 * 1000)
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Auctions must run for at least 1 hour.' })
    if (start && end && end - start > 30 * 24 * 60 * 60 * 1000)
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Auctions can run for up to 30 days.' })
    if (typeof v.reservePrice === 'number' && v.reservePrice < v.startingPrice)
      ctx.addIssue({ code: 'custom', path: ['reservePrice'], message: 'Reserve must be at least the starting price.' })
  })

type ListingInput = z.input<typeof listingSchema>
type ListingValues = z.output<typeof listingSchema>

interface Photo {
  id: string
  url: string
  name: string
}

function SellPage() {
  const form = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      condition: '',
      format: 'timed',
      currency: 'USD',
      startingPrice: '',
      minIncrement: '',
      reservePrice: '',
      quantity: 1,
      city: '',
      country: '',
      shipping: [],
      startsAt: '',
      endsAt: '',
    },
    mode: 'onTouched',
  })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState<ListingValues | null>(null)

  // Revoke local preview URLs only when the page unmounts.
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  )

  const values = useWatch({ control: form.control })

  const preview: Auction = useMemo(
    () => ({
      id: 'preview',
      title: values.title ?? '',
      category: (values.category || 'other') as Auction['category'],
      condition: (values.condition || 'new') as Auction['condition'],
      format: values.format ?? 'timed',
      status: 'draft',
      currency: (values.currency || 'USD') as Auction['currency'],
      startingPrice: Number(values.startingPrice) || 0,
      currentBid: null,
      bidCount: 0,
      minIncrement: Number(values.minIncrement) || 0,
      hasReserve: Number(values.reservePrice) > 0,
      reserveMet: false,
      startsAt: values.startsAt ?? '',
      endsAt: values.endsAt || '',
      imageUrl: photos[0]?.url ?? null,
      location: {
        city: values.city ?? '',
        country: (values.country || 'US') as Auction['location']['country'],
      },
      seller: { username: 'You', verified: false },
      featured: false,
      createdAt: '',
    }),
    [values, photos],
  )

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    setPhotoError(null)
    const next: Photo[] = []
    for (const file of Array.from(files)) {
      if (!IMAGE_TYPES.includes(file.type)) {
        setPhotoError(`${file.name}: use JPEG, PNG or WebP.`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setPhotoError(`${file.name}: images must be 10 MB or smaller.`)
        continue
      }
      next.push({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name })
    }
    const room = MAX_IMAGES - photos.length
    if (next.length > room) {
      setPhotoError(`You can add up to ${MAX_IMAGES} photos.`)
      next.slice(room).forEach((p) => URL.revokeObjectURL(p.url))
    }
    setPhotos([...photos, ...next.slice(0, room)])
  }

  const onReview = form.handleSubmit((v) => {
    if (photos.length === 0) {
      setPhotoError('Add at least one photo of the actual item.')
      return
    }
    setReviewed(v)
    requestAnimationFrame(() =>
      document.getElementById('review')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  })

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          Seller studio
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Create a listing</h1>
        <p className="mt-3 text-muted-foreground">
          Describe your item, set your auction rules and check the preview.
          Every listing is reviewed by a moderator before it goes public.
        </p>
      </header>

      <Alert className="mt-6">
        <Info aria-hidden="true" />
        <AlertTitle>Seller accounts are opening soon</AlertTitle>
        <AlertDescription>
          You can prepare and check a listing here now. Submitting it for
          approval needs a verified seller account, which opens with account
          sign-up. Nothing on this page is uploaded or saved yet.
        </AlertDescription>
      </Alert>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <Form {...form}>
          <form onSubmit={onReview} noValidate className="space-y-8">
            <Section title="Item details">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1968 Omega Speedmaster ref. 145.012" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Provenance, condition details, what's included, known flaws…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          <option value="">Select…</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          <option value="">Select…</option>
                          {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>

            <Section title="Photos" description={`Up to ${MAX_IMAGES} photos of the actual item. JPEG, PNG or WebP, 10 MB max each. The first photo is the cover.`}>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {photos.map((p, i) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-secondary">
                    <img src={p.url} alt={p.name} className="size-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(p.url)
                        setPhotos((prev) => prev.filter((x) => x.id !== p.id))
                      }}
                      className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-card text-xs text-muted-foreground hover:border-accent focus-within:ring-[3px] focus-within:ring-ring/50">
                    <ImagePlus className="size-5" aria-hidden="true" />
                    Add photos
                    <input
                      type="file"
                      accept={IMAGE_TYPES.join(',')}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        addPhotos(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
              {photoError && <p role="alert" className="text-sm text-destructive">{photoError}</p>}
            </Section>

            <Section title="Auction rules">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction format</FormLabel>
                    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                      {[
                        { v: 'timed', t: 'Timed auction', d: 'Runs between your start and end time.' },
                        { v: 'live', t: 'Live auction', d: 'Sold on camera during a live event. Needs a verified seller.' },
                      ].map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          role="radio"
                          aria-checked={field.value === o.v}
                          onClick={() => field.onChange(o.v)}
                          className={`rounded-xl border p-4 text-left transition-colors motion-reduce:transition-none ${field.value === o.v ? 'border-primary bg-secondary ring-1 ring-primary' : 'bg-card hover:border-accent'}`}
                        >
                          <span className="block font-semibold">{o.t}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{o.d}</span>
                        </button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <MoneyField form={form} name="startingPrice" label="Starting price" />
                <MoneyField form={form} name="minIncrement" label="Minimum bid increment" description="Each new bid must beat the current bid by at least this much." />
                <MoneyField form={form} name="reservePrice" label="Reserve price (optional)" description="Hidden from buyers. The item sells only if bidding reaches it." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField form={form} name="startsAt" label="Auction starts" />
                <DateField form={form} name="endsAt" label="Auction ends" description="If a valid bid arrives in the final minutes, the auction is extended so other bidders can respond." />
              </div>
            </Section>

            <Section title="Location & shipping" description="Only your city and country are shown publicly. Your full address is never shown.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input autoComplete="address-level2" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          <option value="">Select…</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping options</FormLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SHIPPING_OPTIONS.map((o) => {
                        const checked = field.value?.includes(o.value)
                        return (
                          <label key={o.value} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) =>
                                field.onChange(
                                  c
                                    ? [...(field.value ?? []), o.value]
                                    : (field.value ?? []).filter((x) => x !== o.value),
                                )
                              }
                            />
                            {o.label}
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <div className="flex flex-wrap items-center gap-3 border-t pt-6">
              <Button type="submit" size="lg">Review listing</Button>
              <p className="text-sm text-muted-foreground">
                Checks every field and shows a summary before you submit.
              </p>
            </div>
          </form>
        </Form>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Live preview</p>
          <AuctionCard auction={preview} preview />
          {preview.minIncrement > 0 && (
            <p className="text-sm text-muted-foreground">
              The first bid must be at least{' '}
              <strong className="text-foreground">{formatMoney(preview.startingPrice, preview.currency)}</strong>
              , and each bid after that at least{' '}
              <strong className="text-foreground">{formatMoney(preview.minIncrement, preview.currency)}</strong>{' '}
              higher.
            </p>
          )}
        </aside>
      </div>

      {reviewed && (
        <section id="review" className="mt-12 scroll-mt-24 rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 size-6 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-semibold">Your listing is ready to submit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every field passed our checks. Once you have a verified seller
                account, you can submit it for moderator approval. It has not
                been saved or published.
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Summary k="Title" v={reviewed.title} />
            <Summary k="Format" v={reviewed.format === 'live' ? 'Live auction' : 'Timed auction'} />
            <Summary k="Starting price" v={formatMoney(reviewed.startingPrice, reviewed.currency as Auction['currency'])} />
            <Summary k="Increment" v={formatMoney(reviewed.minIncrement, reviewed.currency as Auction['currency'])} />
            <Summary k="Reserve" v={typeof reviewed.reservePrice === 'number' ? formatMoney(reviewed.reservePrice, reviewed.currency as Auction['currency']) : 'None'} />
            <Summary k="Photos" v={`${photos.length}`} />
            <Summary k="Starts" v={new Date(reviewed.startsAt).toLocaleString()} />
            <Summary k="Ends" v={new Date(reviewed.endsAt).toLocaleString()} />
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            Times are shown in your time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). AuctionMe's servers decide when an auction actually opens and closes.
          </p>
        </section>
      )}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </fieldset>
  )
}

type SellForm = ReturnType<typeof useForm<ListingInput, unknown, ListingValues>>

function MoneyField({ form, name, label, description }: { form: SellForm; name: 'startingPrice' | 'minIncrement' | 'reservePrice'; label: string; description?: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} value={(field.value as string | number | undefined) ?? ''} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function DateField({ form, name, label, description }: { form: SellForm; name: 'startsAt' | 'endsAt'; label: string; description?: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="datetime-local" {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-semibold break-words">{v}</dd>
    </div>
  )
}

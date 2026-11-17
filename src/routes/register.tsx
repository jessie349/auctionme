import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AuthShell } from '@/components/site/auth-shell'
import { NativeSelect } from '@/components/site/native-select'
import { COUNTRIES } from '@/lib/marketplace'

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Create account — AuctionMe' }] }),
  component: RegisterPage,
})

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.email('Enter a valid email address.'),
  country: z.string().min(1, 'Choose your country.'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9 ()-]{6,18}$/, 'Enter a valid phone number without the country code.'),
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .regex(/[A-Za-z]/, 'Include a letter.')
    .regex(/[0-9]/, 'Include a number.'),
  terms: z
    .boolean()
    .refine((v) => v, 'You must accept the terms to continue.'),
})

type Values = z.input<typeof schema>

function RegisterPage() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      country: '',
      phone: '',
      password: '',
      terms: false,
    },
    mode: 'onTouched',
  })
  const country = useWatch({ control: form.control, name: 'country' })
  const dial = COUNTRIES.find((c) => c.code === country)?.dial

  return (
    <AuthShell
      title="Create your account"
      subtitle="Buy and sell with one account. Sellers verify their identity before going live."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormDescription>We'll send a verification link here.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <NativeSelect autoComplete="country" {...field}>
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
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 bg-secondary px-3 text-sm text-muted-foreground">
                      {dial ?? '+'}
                    </span>
                    <FormControl>
                      <Input type="tel" autoComplete="tel-national" className="rounded-l-none" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 10 characters, with a letter and a number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(c) => field.onChange(c === true)}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormLabel className="leading-snug font-normal">
                    I accept the AuctionMe terms and conditions and privacy policy.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled>
            Create account — opening soon
          </Button>
        </form>
      </Form>
    </AuthShell>
  )
}

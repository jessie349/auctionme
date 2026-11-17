import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AuthShell } from '@/components/site/auth-shell'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Sign in — AuctionMe' }] }),
  component: LoginPage,
})

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

function LoginPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track your bids, watchlist and orders."
      footer={
        <>
          New to AuctionMe?{' '}
          <Link to="/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Password reset opens together with sign-in.
          </p>
          <Button type="submit" className="w-full" size="lg" disabled>
            Sign in — opening soon
          </Button>
        </form>
      </Form>
    </AuthShell>
  )
}

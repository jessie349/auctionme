import { Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/** Two-column frame shared by sign-in and registration. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <div className="hidden overflow-hidden rounded-3xl bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-end">
        <img
          src="/.netlify/images?url=/img/hero-gavel.png&w=900&fm=webp"
          alt=""
          className="h-72 w-full object-cover object-[60%_center]"
          loading="lazy"
        />
        <div className="p-10">
          <p className="font-display text-3xl font-semibold">
            Discover. Bid. <span className="text-accent italic">Win.</span>
          </p>
          <p className="mt-3 text-primary-foreground/75">
            One account for buying and selling, with verified sellers, checked
            bids and payments confirmed by the payment provider.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md lg:py-6">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <Alert className="mt-6">
          <Lock aria-hidden="true" />
          <AlertTitle>Account services are being connected</AlertTitle>
          <AlertDescription>
            Sign-up and sign-in open once secure authentication and email
            verification are live. The form checks your details but does not
            send or store them yet.
          </AlertDescription>
        </Alert>
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}

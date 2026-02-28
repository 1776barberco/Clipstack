import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Terms of Service - TipJars',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="TipJars" width={32} height={32} />
            <span className="text-xl font-bold">TipJars</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-4 text-sm text-muted-foreground">Last updated: February 28, 2026</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using TipJars (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>TipJars is a budgeting application designed for barbers, stylists, cosmetologists, nail techs, lash artists, tattoo artists, and other independent professionals. The Service helps you track income, manage expenses, and organize your finances using a jar-based budgeting system.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>You must be at least 18 years old to use the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. User Data</h2>
            <p>You retain ownership of all data you enter into TipJars. By using the Service, you grant us a limited license to store, process, and display your data solely for the purpose of providing the Service to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to other users&apos; data.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Use automated tools to scrape or access the Service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Financial Disclaimer</h2>
            <p>TipJars is a budgeting <strong>tool</strong>, not a financial advisor. The Service does not provide financial, tax, or legal advice. Budget allocations, tax estimates, and stability scores are for informational purposes only. Consult a qualified professional for financial or tax advice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Service Availability</h2>
            <p>We strive to keep TipJars available at all times, but we do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or circumstances beyond our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
            <p>TipJars is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to financial losses based on information displayed in the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Account Termination</h2>
            <p>You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:apeltekci@gmail.com" className="text-primary underline">apeltekci@gmail.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

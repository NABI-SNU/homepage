import type { Metadata } from 'next'

import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ContactPage as ContactPageGlobal } from '@/payload-types'

export default async function ContactPage() {
  const contactPageData = await getCachedGlobal('contactPage', 1)()
  const contactPage = contactPageData as ContactPageGlobal

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">{contactPage.tagline}</p>
        <h1 className="page-title-lg">{contactPage.title}</h1>
      </section>

      <section className="container section-gap grid gap-8 md:grid-cols-[1fr_2fr]">
        <aside className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">{contactPage.supportTitle}</h2>
          <div className="mt-4 space-y-4">
            {(contactPage.supportItems || []).map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </aside>
        <form
          className="rounded-2xl border border-border bg-card p-6"
          action={contactPage.formAction}
          method="post"
        >
          <h2 className="text-2xl font-semibold">{contactPage.formTitle}</h2>
          {contactPage.formSubtitle && (
            <p className="mt-2 text-muted-foreground">{contactPage.formSubtitle}</p>
          )}

          <div className="mt-6 grid gap-4">
            <input
              required
              name="name"
              placeholder="Name"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              type="text"
            />
            <input
              required
              name="subject"
              placeholder="Subject"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              type="text"
            />
            <input
              required
              name="email"
              placeholder="Email"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              type="email"
            />
            <textarea
              required
              name="message"
              placeholder="Message"
              className="min-h-40 rounded-xl border border-border bg-background px-4 py-3 text-sm"
            />
          </div>

          {contactPage.disclaimer && (
            <p className="mt-4 text-xs text-muted-foreground">{contactPage.disclaimer}</p>
          )}

          <button
            className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm text-background"
            type="submit"
          >
            Send Message
          </button>
          {contactPage.formDescription && (
            <p className="mt-3 text-sm text-muted-foreground">{contactPage.formDescription}</p>
          )}
        </form>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the NABI Labs or send us your inquiries.',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto py-20 px-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2 text-white">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: September 7, 2026</p>

      <div className="space-y-6 text-slate-400">
        <p>This policy explains what Scannit Inc. (&quot;Scannit,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects through this website, why, and who we share it with. Questions or requests: <a href="mailto:privacy@scannit.io" className="text-[#06b6d4] hover:underline">privacy@scannit.io</a>.</p>

        <h2 className="text-xl font-semibold text-white mt-8">1. What We Collect</h2>
        <p>This website does not have user accounts and does not take payments. We collect:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Your email address</strong>, when you submit it to join the waitlist or receive updates.</li>
          <li><strong>Your approximate country</strong>, determined on our server from your connection at the moment you submit a form. We do not store your IP address alongside it.</li>
          <li><strong>Standard web server logs</strong> kept by our hosting provider, which include IP address, browser user agent, and request timestamps.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">2. What We Do Not Collect</h2>
        <p>We do not collect names, postal addresses, payment details, or account credentials through this website. We do not use advertising cookies, analytics cookies, or cross-site tracking.</p>

        <h2 className="text-xl font-semibold text-white mt-8">3. How We Use It</h2>
        <p>We use your email address to contact you about the Scannit network, including letting you know if and when network participation opens. We use server logs to operate, secure, and debug the site.</p>

        <h2 className="text-xl font-semibold text-white mt-8">4. Service Providers</h2>
        <p>We share personal information only with providers that help us run this site, and only for that purpose. All are located in the United States:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Make.com</strong> — receives form submissions and handles our email workflow.</li>
          <li><strong>Vercel</strong> — website hosting and server logs.</li>
          <li><strong>Upstash</strong> — hosted Redis used for operational data.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">5. We Do Not Sell Your Information</h2>
        <p>We do not sell personal information, and we do not share it for cross-context behavioral advertising or targeted advertising.</p>

        <h2 className="text-xl font-semibold text-white mt-8">6. How Long We Keep It</h2>
        <p>We keep your email address until you unsubscribe or ask us to delete it. Server logs are retained by our hosting provider on their standard schedule.</p>

        <h2 className="text-xl font-semibold text-white mt-8">7. Your Choices and Rights</h2>
        <p>Every email we send includes an unsubscribe link. You can also email <a href="mailto:privacy@scannit.io" className="text-[#06b6d4] hover:underline">privacy@scannit.io</a> at any time to access, correct, or delete the information we hold about you, or to receive a copy of it.</p>
        <p>Residents of California, Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, and other states with comprehensive privacy laws have these rights under those laws. We will not treat you differently for exercising them. If we decline a request, we will tell you why and how to appeal.</p>

        <h2 className="text-xl font-semibold text-white mt-8">8. Do Not Track</h2>
        <p>We do not respond to Do Not Track browser signals, because we do not track visitors across other websites.</p>

        <h2 className="text-xl font-semibold text-white mt-8">9. Children</h2>
        <p>This website is not directed to children under 13, and we do not knowingly collect their personal information. If you believe a child has submitted information to us, email us and we will delete it.</p>

        <h2 className="text-xl font-semibold text-white mt-8">10. Visitors Outside the United States</h2>
        <p>Scannit Inc. is a United States company and the providers listed above process data in the United States. If you submit your email from outside the US, it will be transferred to and stored in the US.</p>

        <h2 className="text-xl font-semibold text-white mt-8">11. Changes</h2>
        <p>If we change this policy we will post the updated version on this page and change the date above.</p>
      </div>
    </main>
  );
}

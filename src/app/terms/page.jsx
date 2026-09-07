export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto py-20 px-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2 text-white">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: September 7, 2026</p>

      <div className="space-y-6 text-slate-400">
        <p>These Terms govern your use of this website, operated by Scannit Inc. (&quot;Scannit,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using the site you agree to them. If you do not agree, please do not use the site.</p>

        <h2 className="text-xl font-semibold text-white mt-8">1. What This Website Is</h2>
        <p>This website is informational. It describes what Scannit does as a business: we buy and operate bare-metal NVIDIA GPU hardware and lease it to enterprise AI teams.</p>

        <h2 className="text-xl font-semibold text-white mt-8">2. Nothing Here Is an Offer</h2>
        <p>Nothing on this website is an offer to sell or a solicitation of an offer to buy any security, investment, or financial product, and nothing on it is investment, financial, legal, or tax advice. No participation program is currently open, no terms or prices have been set, and no money is being accepted. Joining a waitlist creates no entitlement, no reservation, no purchase, and no commitment on either side.</p>

        <h2 className="text-xl font-semibold text-white mt-8">3. Market Rate Information</h2>
        <p>Rate figures shown on this website are listing prices observed on third-party GPU marketplaces, provided for general information. They are not Scannit revenue, not Scannit earnings, and not a projection or forecast of any return. They may be delayed, incomplete, or inaccurate, and they are not a quote or an offer of any price by Scannit.</p>

        <h2 className="text-xl font-semibold text-white mt-8">4. Compute Services</h2>
        <p>Any actual lease of GPU compute is arranged separately and governed by a written agreement between Scannit and the customer. Those agreements, not these Terms, define pricing, service levels, and support.</p>

        <h2 className="text-xl font-semibold text-white mt-8">5. Acceptable Use</h2>
        <p>You agree to use this website and any Scannit compute services only for lawful purposes. Prohibited activities include, but are not limited to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Generating, hosting, or distributing malicious software, ransomware, or botnet infrastructure.</li>
          <li>Denial-of-service attacks or interference with networks or systems.</li>
          <li>Generating or hosting unlawful content, including content that incites violence or terrorism.</li>
          <li>Unauthorized scanning or exploitation of network resources.</li>
          <li>Violation of export control or sanctions laws.</li>
          <li>Automated collection from this website that burdens or disrupts it.</li>
        </ul>
        <p>We may suspend or terminate access for any violation.</p>

        <h2 className="text-xl font-semibold text-white mt-8">6. Third-Party Names</h2>
        <p>We name third-party platforms and hardware manufacturers on this website to describe factually where compute workloads may route and what hardware we operate. Those names and marks belong to their owners. Naming them does not imply any partnership, sponsorship, endorsement, or preferred status.</p>

        <h2 className="text-xl font-semibold text-white mt-8">7. No Warranty</h2>
        <p>This website is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, express or implied. We do not warrant that the information on it is accurate, complete, or current.</p>

        <h2 className="text-xl font-semibold text-white mt-8">8. Limitation of Liability</h2>
        <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SCANNIT WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, REVENUES, CUSTOMERS, OPPORTUNITIES, GOODWILL, USE, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>

        <h2 className="text-xl font-semibold text-white mt-8">9. Governing Law</h2>
        <p>These Terms are governed by the laws of the State of Delaware, without regard to its conflict-of-laws rules. The state and federal courts located in Delaware have exclusive jurisdiction over any dispute arising out of them.</p>

        <h2 className="text-xl font-semibold text-white mt-8">10. Changes</h2>
        <p>We may update these Terms. The current version is always posted on this page with the date it took effect.</p>

        <h2 className="text-xl font-semibold text-white mt-8">11. Contact</h2>
        <p>Questions about these Terms: <a href="mailto:privacy@scannit.io" className="text-[#06b6d4] hover:underline">privacy@scannit.io</a>.</p>
      </div>
    </main>
  );
}

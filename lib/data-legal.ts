// ============================================================
// FlexMed v2 — Legal Pages Data
// All legal page content lives here — no hardcoded text in components
// ============================================================

import type { LegalPage } from './types'

export const LEGAL_PAGES: Record<string, LegalPage> = {
  disclaimer: {
    slug: 'disclaimer',
    title: 'Research Disclaimer',
    lastUpdated: '[DATE REQUIRED]',
    content: `
**Important — Read Before Proceeding**

All peptides cataloged on this site are sold exclusively for **in vitro laboratory research purposes** and **preclinical investigation** within established research institutions. They have not been evaluated by the Food and Drug Administration (FDA) or any comparable regulatory authority for use in humans, animals, diagnostics, food, or any therapeutic application.

**By accessing this site, you confirm that:**

- You are a qualified researcher operating within a licensed research institution, or an authorized representative of such an institution.
- Any peptides you acquire will be used solely for controlled, in vitro, or preclinical research in accordance with applicable local, state, and federal regulations.
- You understand and agree that peptides cataloged here carry no medical, therapeutic, nutritional, or consumer-use claims.
- You accept full responsibility for verifying the legal status of the peptides you wish to acquire within your jurisdiction before any purchase or use.

**No Medical Claims**

Nothing on this site — including product descriptions, research summaries, nomenclature, or associated materials — constitutes or implies a medical claim, diagnostic claim, or therapeutic recommendation of any kind. Product catalog entries are for identification and reference purposes only.

**No Dosage or Administration Instructions**

No information on this site provides, suggests, or implies dosage, administration route, reconstitution instructions, or use protocols. All such information in a research context must be obtained from validated scientific literature and your institution's own review processes.

**Batch Documentation**

Every effort is made to ensure the accuracy of batch-specific documentation, including Certificate of Analysis (CoA) records. However, FlexMed makes no representation that published CoAs constitute complete specification conformance, and all data should be reviewed and verified by the purchasing institution.

**Accuracy of Information**

Peptide descriptions and nomenclature on this site are provided for research-reference purposes only. FlexMed does not guarantee the completeness or accuracy of external scientific references or third-party databases. Researchers are responsible for verifying peptide identity and specifications against primary sources.

**Limitation of Liability**

FlexMed and its affiliates accept no liability for any damages arising from the use or misuse of peptides acquired through this catalog. All peptides are used entirely at the research institution's own risk and under the supervision of qualified research personnel.

*For questions regarding this disclaimer, contact: [INSTITUTIONAL EMAIL REQUIRED]*
    `.trim(),
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: '[DATE REQUIRED]',
    content: `
**Overview**

FlexMed ("we," "our," or "FlexMed") is committed to protecting the privacy of researchers and research organizations that interact with our catalog and purchasing systems. This policy describes the information we collect, how we use it, and your rights regarding that information.

**Information We Collect**

We collect information you provide directly when you contact FlexMed or place an order:

- Research organization, lab, or affiliation name
- Contact name, professional email address, and telephone number
- Research application or project description (if provided)
- Website usage data collected automatically (see below)

We do not collect payment information. All financial transactions are processed through separate, dedicated payment providers.

**How We Use Information**

Information collected is used exclusively to:

- Process and respond to catalog and documentation requests
- Evaluate order eligibility and compliance requirements
- Manage account and communication preferences
- Improve our catalog and research-support tools

We do not sell, rent, or share your information with third parties for marketing purposes.

**Data Retention**

Account and purchasing records are retained for a minimum of **[RETENTION PERIOD REQUIRED]** years in accordance with applicable financial record-keeping and regulatory requirements.

**Cookies and Usage Data**

We collect limited website usage data including pages visited, browser type, and referral source. This data is used solely to understand how researchers navigate our catalog and improve the site experience. No personal identifying information is collected through cookies.

**Information Sharing**

We share information with trusted service providers who assist in operating our site and purchasing systems — solely under data processing agreements that restrict their use of the data. We do not otherwise share personal information with third parties without your consent, except as required by applicable law.

**Your Rights**

You have the right to:

- Request a copy of any personal information we hold about you
- Request correction of inaccurate information
- Request deletion of your information, subject to legal retention requirements
- Opt out of non-essential communications at any time

To exercise any of these rights, contact us at: **flexmedpeptides@gmail.com**

**Data Security**

We implement industry-standard security measures to protect personal information from unauthorized access, alteration, or destruction. No data transmission over the internet can be guaranteed 100% secure, and we cannot ensure the security of information you transmit to us.

**International Transfers**

If you are accessing this site from outside [BUSINESS LOCATION REQUIRED], please note that your information may be transferred to and processed in [COUNTRY] where FlexMed operates. By submitting your information, you consent to such transfer and processing.

**Policy Changes**

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "last updated" date. We encourage you to review this policy periodically.

**Contact**

For privacy-related inquiries, contact: **flexmedpeptides@gmail.com**
    `.trim(),
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    lastUpdated: '[DATE REQUIRED]',
    content: `
**Agreement**

These Terms of Service ("Terms") govern your use of the FlexMed catalog website and any purchase placed through this site. By accessing this site, you agree to be bound by these Terms in full.

**Eligibility**

Products cataloged on FlexMed are sold exclusively to:

- Research institutions (universities, hospitals, independent research organizations)
- Preclinical contract research organizations (CROs)
- Independent researchers operating in compliance with applicable laws

By placing a purchase, you confirm that your acquisition and use of any peptides will comply with all applicable local, state, and federal regulations.

**Products and Intended Use**

All FlexMed products are sold exclusively for in vitro and preclinical research purposes. They have not been evaluated by the FDA or any comparable regulatory authority for human or animal use, diagnostic purposes, food use, or therapeutic application.

Nothing on this site constitutes or implies a medical claim, therapeutic recommendation, dosage protocol, or administration instruction of any kind.

**Pricing**

Pricing and shipping details are presented through the purchasing flow on this site and may be updated as inventory changes.

**Orders and Fulfillment**

Order acceptance occurs upon written confirmation from FlexMed. Lead times and availability are estimated and subject to change. FlexMed is not liable for delays caused by third-party laboratories, shipping carriers, or regulatory holdups outside its control.

**Shipping and Risk Transfer**

FlexMed does not ship internationally. Risk of loss or damage transfers to the purchasing party upon delivery to the carrier. FlexMed is not responsible for peptides once they have been accepted by the carrier.

**Returns and Claims**

Due to the nature of research peptides, returns are accepted only under the following conditions:

1. The product was received damaged or in compromised condition.
2. The delivered Certificate of Analysis (CoA) does not match the specifications of the ordered product.

Sealed products that have been opened, reconstituted, or partially used are **not eligible** for return. Claims must be submitted within **48 hours** of receipt with photographic evidence where applicable.

To submit a claim, contact: **flexmedpeptides@gmail.com**

**Limitation of Liability**

FlexMed shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of any product acquired through this catalog. The total liability of FlexMed for any claim shall not exceed the amount paid for the specific product giving rise to that claim.

All products are used entirely at the purchasing party's own risk and under the supervision of qualified research personnel.

**Compliance**

The purchasing party is solely responsible for ensuring that the acquisition, storage, handling, and disposal of all peptides comply with applicable policies, local laws, and research regulations.

**Governing Law**

These Terms shall be governed by the laws of the State of **[STATE REQUIRED]**, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the courts of **[STATE REQUIRED]**.

**Amendments**

FlexMed reserves the right to amend these Terms at any time. Material changes will be communicated via the email address associated with your account, if one exists. Continued use of this site following notice of amendments constitutes acceptance of the revised Terms.

**Contact**

For questions regarding these Terms, contact: **flexmedpeptides@gmail.com**
    `.trim(),
  },
}

export const LEGAL_SLUGS = ['disclaimer', 'privacy', 'terms']

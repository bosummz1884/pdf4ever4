import { Button } from "@ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img
                src="/70x70logo.png"
                alt="PDF4EVER Logo"
                className="h-10 w-10"
              />

              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                PDF4EVER
              </span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Effective Date: December 6, 2024
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              Welcome to PDF4EVER. These Terms of Service ("Terms") constitute a
              legally binding agreement between you ("User," "you," or "your")
              and PDF4EVER ("Company," "we," "our," or "us") regarding your use
              of our PDF editing web application and related services
              (collectively, the "Service"). By accessing or using our Service,
              you agree to be bound by these Terms and our Privacy Policy, which
              is incorporated herein by reference.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use our
              Service. These Terms are governed by the laws of the State of
              Missouri and applicable federal laws of the United States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p>
              PDF4EVER provides a web-based PDF editing platform that allows
              users to edit, annotate, merge, split, and manipulate PDF
              documents entirely within their web browser. Our Service operates
              on a privacy-first principle where all document processing occurs
              client-side, ensuring that your files never leave your device.
            </p>

            <h3 className="text-xl font-medium mb-3">2.1 Service Features</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>PDF text editing and formatting</li>
              <li>Digital signature capabilities</li>
              <li>Form filling and completion</li>
              <li>OCR (Optical Character Recognition) text extraction</li>
              <li>Page merging and splitting</li>
              <li>Annotation tools and markup</li>
              <li>Font matching and text detection</li>
              <li>Invoice generation and document templates</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              2.2 Privacy-First Architecture
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
              <p>
                <strong>Important:</strong> All PDF processing occurs locally in
                your web browser. We do not upload, store, or retain any PDF
                files or document content on our servers. This ensures complete
                privacy and security of your documents.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. User Accounts and Registration
            </h2>

            <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
            <p>
              To access certain features of our Service, you must create a user
              account. You may register using:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email address and password</li>
              <li>Google OAuth authentication</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              3.2 Account Responsibilities
            </h3>
            <p>You are responsible for:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Providing accurate and complete registration information</li>
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>
                Immediately notifying us of any unauthorized use of your account
              </li>
              <li>
                Using strong passwords that meet our security requirements
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              3.3 Account Termination
            </h3>
            <p>
              You may terminate your account at any time. We reserve the right
              to suspend or terminate accounts that violate these Terms or
              engage in prohibited activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Acceptable Use Policy
            </h2>

            <h3 className="text-xl font-medium mb-3">4.1 Permitted Uses</h3>
            <p>You may use our Service for lawful purposes, including:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Personal document editing and management</li>
              <li>Business document processing and workflow</li>
              <li>Educational and academic document preparation</li>
              <li>Legal document review and editing (non-attorney users)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              4.2 Prohibited Uses
            </h3>
            <p>You agree not to use our Service to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                Process documents containing illegal content or activities
              </li>
              <li>
                Violate any applicable laws, regulations, or third-party rights
              </li>
              <li>Distribute malware, viruses, or other harmful code</li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users' accounts
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract source code
              </li>
              <li>Use automated scripts or bots to access the Service</li>
              <li>Interfere with or disrupt the Service's functionality</li>
              <li>Create fraudulent or misleading documents</li>
              <li>
                Process documents containing personal information of others
                without consent
              </li>
              <li>Violate intellectual property rights of third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property Rights
            </h2>

            <h3 className="text-xl font-medium mb-3">
              5.1 Our Intellectual Property
            </h3>
            <p>
              The Service, including its software, design, text, graphics,
              logos, and other content, is owned by PDF4EVER and is protected by
              intellectual property laws. You are granted a limited,
              non-exclusive, non-transferable license to use the Service for its
              intended purpose.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">5.2 Your Content</h3>
            <p>
              You retain all rights to the documents and content you process
              through our Service. Since we do not store your files, we do not
              claim any ownership rights to your content. You are solely
              responsible for ensuring you have the right to process any
              documents you upload to the Service.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">
              5.3 Feedback and Suggestions
            </h3>
            <p>
              Any feedback, suggestions, or ideas you provide to us regarding
              the Service may be used by us without any obligation to compensate
              you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Privacy and Data Protection
            </h2>
            <p>
              Your privacy is fundamental to our Service. We encourage you to
              review our Privacy Policy, which explains our data collection,
              use, and protection practices. Key privacy principles include:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>No storage of your PDF files or document content</li>
              <li>Client-side processing to ensure document privacy</li>
              <li>Minimal data collection for account functionality only</li>
              <li>
                No sharing of personal information with third parties for
                marketing purposes
              </li>
              <li>Strong security measures to protect account information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Service Availability and Modifications
            </h2>

            <h3 className="text-xl font-medium mb-3">
              7.1 Service Availability
            </h3>
            <p>
              We strive to maintain continuous Service availability but cannot
              guarantee uninterrupted access. The Service may be temporarily
              unavailable due to maintenance, updates, or technical issues.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">
              7.2 Service Modifications
            </h3>
            <p>
              We reserve the right to modify, update, or discontinue features of
              the Service at any time. We will provide reasonable notice of
              material changes that affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Disclaimers and Limitations of Liability
            </h2>

            <h3 className="text-xl font-medium mb-3">
              8.1 Service Disclaimers
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
                NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3 mt-6">
              8.2 Limitation of Liability
            </h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PDF4EVER SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS
              OF PROFITS, OR BUSINESS INTERRUPTION.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR
              RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT
              YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">
              8.3 Missouri Law Compliance
            </h3>
            <p>
              Some jurisdictions do not allow the exclusion of certain
              warranties or limitation of liability. In such cases, our
              liability will be limited to the maximum extent permitted by
              Missouri state law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless PDF4EVER, its
              officers, directors, employees, and agents from and against any
              claims, damages, losses, costs, and expenses (including reasonable
              attorneys' fees) arising out of or relating to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable laws or regulations</li>
              <li>Your infringement of any third-party rights</li>
              <li>Content you process through the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Governing Law and Dispute Resolution
            </h2>

            <h3 className="text-xl font-medium mb-3">10.1 Governing Law</h3>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of the State of Missouri, without regard to its conflict of
              law principles. Any disputes shall be resolved in the state or
              federal courts located in Missouri.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">
              10.2 Dispute Resolution
            </h3>
            <p>
              Before filing any legal claim, you agree to first contact us to
              attempt to resolve the dispute informally. We will work in good
              faith to resolve any issues through direct communication.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">
              10.3 Class Action Waiver
            </h3>
            <p>
              You agree that any dispute resolution proceedings will be
              conducted only on an individual basis and not in a class,
              consolidated, or representative action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon
              termination:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Your access to the Service will be immediately suspended</li>
              <li>
                Your account information may be deleted in accordance with our
                Privacy Policy
              </li>
              <li>
                Provisions that should survive termination will remain in effect
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time to reflect changes in
              our Service, legal requirements, or business practices. Material
              changes will be communicated through:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email notification to registered users</li>
              <li>Prominent notice on our website</li>
              <li>In-app notifications</li>
            </ul>
            <p>
              Continued use of the Service after changes take effect constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid, the remaining provisions will continue in full force and
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              14. Entire Agreement
            </h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and PDF4EVER regarding the Service
              and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              15. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <p>
                <strong>Email:</strong> legal@pdf4ever.com
              </p>
              <p>
                <strong>Support:</strong> support@pdf4ever.com
              </p>
              <p>
                <strong>Mailing Address:</strong>
              </p>
              <p>
                PDF4EVER Legal Department
                <br />
                [Your Business Address]
                <br />
                [City], Missouri [ZIP Code]
                <br />
                United States
              </p>
            </div>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500 mt-8">
            <h3 className="font-semibold text-lg mb-2">
              Questions or Concerns?
            </h3>
            <p>
              We're committed to transparency and user satisfaction. If you have
              any questions about these Terms or need clarification on any
              provision, please don't hesitate to contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

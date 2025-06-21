import { Button } from "@ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Effective Date: December 6, 2024
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              PDF4EVER ("we," "our," or "us") is committed to protecting your
              privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our PDF editing web
              application and services (the "Service"). This policy complies
              with applicable federal laws and the laws of the State of
              Missouri.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Our Privacy-First Commitment
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-lg mb-2">
                Zero File Storage Policy
              </h3>
              <p>
                <strong>
                  We do not store, save, or retain any PDF files or documents
                  you process through our Service.
                </strong>{" "}
                All PDF editing, processing, and manipulation occurs entirely
                within your web browser using client-side technology. Your files
                never leave your device or are transmitted to our servers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. Information We Collect
            </h2>

            <h3 className="text-xl font-medium mb-3">
              3.1 Personal Information
            </h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                Email address (required for account creation and communication)
              </li>
              <li>First and last name (for account personalization)</li>
              <li>Password (securely hashed and encrypted)</li>
              <li>
                Profile information from OAuth providers (Google) if you choose
                to sign in via these services
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              3.2 Usage Information
            </h3>
            <p>
              We automatically collect certain information when you use our
              Service:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                Device information (browser type, operating system, device
                identifiers)
              </li>
              <li>
                Usage analytics (pages visited, features used, time spent on
                Service)
              </li>
              <li>
                IP address and location data (for security and fraud prevention)
              </li>
              <li>
                Log files and technical data (for debugging and service
                improvement)
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              3.3 Cookies and Tracking Technologies
            </h3>
            <p>We use cookies and similar technologies for:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Authentication and session management</li>
              <li>User preferences and settings</li>
              <li>Security features and fraud prevention</li>
              <li>Analytics and service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. How We Use Your Information
            </h2>
            <p>
              We use collected information solely for the following purposes:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Service Provision:</strong> To provide, maintain, and
                improve our PDF editing services
              </li>
              <li>
                <strong>Account Management:</strong> To create and manage your
                user account
              </li>
              <li>
                <strong>Authentication:</strong> To verify your identity and
                secure your account
              </li>
              <li>
                <strong>Communication:</strong> To send important updates,
                security alerts, and support messages
              </li>
              <li>
                <strong>Security:</strong> To detect, prevent, and address
                technical issues and security threats
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws and regulations
              </li>
              <li>
                <strong>Service Improvement:</strong> To analyze usage patterns
                and improve our Service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Information Sharing and Disclosure
            </h2>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500 mb-6">
              <h3 className="font-semibold text-lg mb-2">
                No Third-Party Data Sharing
              </h3>
              <p>
                <strong>
                  We do not sell, rent, trade, or otherwise share your personal
                  information with third parties for their marketing or
                  commercial purposes.
                </strong>{" "}
                Your data is used exclusively for the functioning of our
                Service.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3">
              Limited Disclosure Circumstances
            </h3>
            <p>
              We may disclose your information only in the following limited
              circumstances:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Legal Requirements:</strong> When required by law, court
                order, or government request
              </li>
              <li>
                <strong>Safety and Security:</strong> To protect the rights,
                property, or safety of PDF4EVER, our users, or the public
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets (with user notification)
              </li>
              <li>
                <strong>Consent:</strong> When you have given explicit consent
                for specific sharing
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Service Providers</h3>
            <p>
              We may share information with trusted service providers who assist
              us in operating our Service, including:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Supabase (database and authentication services)</li>
              <li>Google (OAuth authentication services)</li>
              <li>Hosting and infrastructure providers</li>
            </ul>
            <p className="mt-3">
              These providers are contractually bound to protect your
              information and use it only for the specified purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p>
              We implement comprehensive security measures to protect your
              information:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Encryption:</strong> All data transmission uses
                industry-standard SSL/TLS encryption
              </li>
              <li>
                <strong>Password Security:</strong> Passwords are hashed using
                bcrypt with salt
              </li>
              <li>
                <strong>Access Controls:</strong> Strict access controls and
                authentication requirements
              </li>
              <li>
                <strong>Regular Audits:</strong> Regular security assessments
                and vulnerability testing
              </li>
              <li>
                <strong>Data Minimization:</strong> We collect and retain only
                necessary information
              </li>
              <li>
                <strong>Secure Infrastructure:</strong> Use of reputable cloud
                providers with robust security measures
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Your Rights and Choices
            </h2>
            <p>
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Access:</strong> Request access to your personal
                information
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                associated data
              </li>
              <li>
                <strong>Portability:</strong> Request a copy of your data in a
                portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from promotional
                communications
              </li>
              <li>
                <strong>Cookie Control:</strong> Manage cookie preferences
                through your browser settings
              </li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at privacy@pdf4ever.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p>We retain your information for the following periods:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Until you delete your
                account or request deletion
              </li>
              <li>
                <strong>Usage Data:</strong> Up to 2 years for analytics and
                service improvement
              </li>
              <li>
                <strong>Legal Compliance:</strong> As required by applicable
                laws and regulations
              </li>
              <li>
                <strong>Security Logs:</strong> Up to 1 year for security and
                fraud prevention
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Children's Privacy
            </h2>
            <p>
              Our Service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected personal information
              from a child under 13, we will take steps to delete such
              information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. International Users
            </h2>
            <p>
              Our Service is operated from the United States. If you are
              accessing our Service from outside the United States, please be
              aware that your information may be transferred to, stored, and
              processed in the United States where our servers are located and
              our central database is operated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new Privacy
              Policy on this page and updating the "Effective Date" at the top.
              We encourage you to review this Privacy Policy periodically for
              any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Contact Information
            </h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy
              practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <p>
                <strong>Email:</strong> privacy@pdf4ever.com
              </p>
              <p>
                <strong>Mailing Address:</strong>
              </p>
              <p>
                PDF4EVER Privacy Team
                <br />
                [Your Business Address]
                <br />
                [City], Missouri [ZIP Code]
                <br />
                United States
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              13. Missouri-Specific Rights
            </h2>
            <p>
              As a resident of Missouri, you may have additional rights under
              Missouri state law. We comply with all applicable Missouri data
              protection requirements, including proper notification procedures
              for data breaches and adherence to Missouri's consumer protection
              laws.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

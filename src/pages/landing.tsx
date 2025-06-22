import { useState } from "react";
import { Button } from "@ui/button";
import { SignupDialog } from "@components/SignupDialog";
import { LoginDialog } from "@components/LoginDialog";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@ui/card";
import {
  FileText,
  Shield,
  Users,
  Zap,
  Download,
  Edit3,
  Lock,
} from "lucide-react";

export default function Landing() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { login } = useAuth();

  const handleAuthSuccess = (user: any, token: string) => {
    login(user, token);
  };

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* No duplicate header - using main header instead */}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span style={{ color: "#005aff" }}>Edit PDFs</span>{" "}
            <span style={{ color: "#ff3900" }}>with Complete Privacy</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Professional PDF editing tools that work entirely in your browser.
            Your files never leave your device - guaranteed privacy protection.
          </p>
          {/* Remove duplicate call-to-action buttons - using header buttons instead */}
        </div>
      </section>

      {/* Why PDF4EVER Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose PDF4EVER?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Complete Privacy</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All processing happens locally. We never store your files on our
                servers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Data Respect</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your personal information is never shared with third parties. We
                protect your privacy above all.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Edit3 className="h-12 w-12 text-orange-500 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced editing, annotations, signatures, OCR, and form filling
                capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No uploads, no waiting. Start editing immediately in your
                browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Mission - Why We Built This */}
      <section className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">
              Why We Built <span style={{ color: "#005aff" }}>PDF4</span>
              <span style={{ color: "#ff3900" }}>EVER</span>
            </h2>
            <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed space-y-6">
              <p>
                <strong>
                  When you "buy" something today, you hardly own half of what
                  you purchase.
                </strong>
                Most companies have switched to subscription-based payments that
                drain your wallet month after month, or offer "free" trials
                designed to gouge you when you forget to cancel.
              </p>
              <p>
                I've been there too - waking up to overdraft fees because some
                service I forgot about decided to charge my account. There has
                to be a better way.
              </p>
              <p>
                <strong>
                  That's why PDF4EVER offers a simple one-time purchase that
                  includes all future upgrades forever.
                </strong>{" "}
                No hidden fees, no upgrade charges, no subscription traps - just
                honest software ownership.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg mt-8">
                <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">
                  Our Promise
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">
                      💰 One-Time Payment
                    </h4>
                    <p>
                      Pay once, own it forever. Includes all future upgrades and
                      features at no additional cost.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">
                      🎯 Watch Ads for Credits
                    </h4>
                    <p>
                      Can't afford the full price? Watch ads and earn credits.
                      Your time has value.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">
                      🛡️ No Data Harvesting
                    </h4>
                    <p>
                      We don't sell your data, track your behavior, or profit
                      from your privacy.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">
                      ✊ Fair Business Model
                    </h4>
                    <p>
                      Honest pricing for honest people. No tricks, no traps, no
                      exploitation.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-8">
                PDF4EVER is built for people who believe you should actually own
                what you buy.
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mt-8">
                <p className="text-lg">
                  <strong>
                    Can't afford the one-time payment but still need to use the
                    service?
                  </strong>{" "}
                  I've been there too! I dislike ads as much as everyone else
                  but we have a rewarded ads section that allows you to earn
                  usage for watching ads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Text editing and formatting",
              "Digital signatures",
              "Form filling",
              "OCR text extraction",
              "Page merging and splitting",
              "Annotation tools",
              "Font matching",
              "Invoice generation",
              "Watermark removal",
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />

          <h2 className="text-3xl font-bold mb-4">Your Privacy is Sacred</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We believe your documents should remain yours. That's why PDF4EVER
            processes everything locally in your browser. No file uploads, no
            cloud storage, no data collection. Just pure, secure PDF editing.
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div>✓ No file uploads</div>
            <div>✓ No cloud storage</div>
            <div>✓ No tracking</div>
            <div>✓ 100% local processing</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: "#005aff" }} className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to Start Editing?
          </h2>
          <p className="text-xl mb-8 text-white opacity-90">
            Join thousands of users who trust PDF4EVER for secure document
            editing.
          </p>
          <Button
            size="lg"
            onClick={() => setShowSignup(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 border-2 border-white"
            style={{ backgroundColor: "white", color: "#005aff" }}
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/70x70logo.png" alt="PDF4EVER Logo" className="h-8 w-8" />

            <span className="text-xl font-bold">
              <span style={{ color: "#005aff" }}>PDF4</span>
              <span style={{ color: "#ff3900" }}>EVER</span>
            </span>
          </div>
          <div className="flex justify-center space-x-6 mb-4 text-sm">
            <a
              href="/privacy-policy"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
          <p className="text-gray-400">
            © 2024 PDF4EVER. Privacy-first PDF editing for everyone.
          </p>
        </div>
      </footer>

      {/* Auth Dialogs */}
      <SignupDialog
        open={showSignup}
        onOpenChange={setShowSignup}
        onSuccess={handleAuthSuccess}
      />

      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={handleAuthSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  );
}

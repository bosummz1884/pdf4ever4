import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    // Redirect to checkout page
    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-3 h-3 mr-1" />
            Limited Time Offer
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            PDF4EVER
            <span className="text-primary"> Lifetime Access</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay once, own forever. Get lifetime access to the most advanced PDF
            editor with all future updates included.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-16">
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Lifetime Access</CardTitle>
              <CardDescription className="text-lg">
                One payment, forever yours
              </CardDescription>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-4xl font-bold">$50</span>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground line-through">
                    $197
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    75% OFF
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  "Complete PDF Editor Suite",
                  "Text Editing & Formatting",
                  "Digital Signatures",
                  "Form Filling & OCR",
                  "Document Management",
                  "Unlimited PDF Processing",
                  "All Future Updates",
                  "Priority Support",
                  "Commercial License",
                  "No Monthly Fees Ever",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isLoading ? "Processing..." : "Get Lifetime Access Now"}
              </Button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Secure payment powered by Stripe. 30-day money-back guarantee.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-2">Advanced PDF Tools</h3>
            <p className="text-sm text-muted-foreground">
              Complete suite of professional PDF editing capabilities
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Process PDFs instantly with browser-based technology
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold mb-2">Lifetime Updates</h3>
            <p className="text-sm text-muted-foreground">
              Get every new feature and improvement automatically
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                What does "lifetime access" mean?
              </h3>
              <p className="text-sm text-muted-foreground">
                Pay once and use PDF4EVER forever. You'll receive all future
                updates, new features, and improvements at no additional cost.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Is there a money-back guarantee?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! We offer a 30-day money-back guarantee. If you're not
                satisfied, we'll refund your purchase, no questions asked.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Can I use this for commercial purposes?
              </h3>
              <p className="text-sm text-muted-foreground">
                Absolutely! Your lifetime license includes commercial usage
                rights for business and professional use.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <Link href="/">
            <Button variant="outline">← Back to PDF Editor</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

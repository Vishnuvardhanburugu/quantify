import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail } from "lucide-react";

const faqs = [
  {
    q: "What is Quantify?",
    a: "Quantify is an AI-powered quantitative trading platform that helps retail traders track performance, journal trades, and receive personalized insights from a local LLM.",
  },
  {
    q: "How does the AI assistant work?",
    a: "Our AI assistant runs locally on your machine using Ollama (LLaMA 3). It analyzes your portfolio, win rate, and trading patterns to provide tailored advice — all without sending data to external servers.",
  },
  {
    q: "What markets does Quantify support?",
    a: "Currently, Quantify focuses on the Indian stock market (NSE) with real-time data powered by Yahoo Finance API. We plan to expand to more markets in the future.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. All AI processing happens locally on your machine. Your trading data is stored securely with JWT-based authentication and is never shared with third parties.",
  },
  {
    q: "How do I get started?",
    a: "Simply sign up for a free account using your Google account, set up your portfolio, and start logging trades. The AI assistant will begin learning your patterns automatically.",
  },
  {
    q: "What is the 'Nudge' system?",
    a: "Inspired by behavioral finance principles, our Nudge system warns you in real-time if it detects patterns like panic selling, over-trading, or trades that deviate from your risk profile.",
  },
];

const Support = () => {
  return (
    <div>
      <section className="section-padding text-center">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          How can we help you?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Find answers to common questions or reach out to our team.
        </p>
      </section>

      <section className="container max-w-2xl pb-16">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 rounded-lg border border-border bg-secondary/30 p-8 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h3 className="font-semibold text-foreground">Still need help?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Reach out to us at{" "}
            <a href="mailto:support@quantify.app" className="text-primary hover:underline">
              support@quantify.app
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Support;

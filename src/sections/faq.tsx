import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Faq = () => {
  return (
    <section id="faq" className=" py-40 w-full container px-0">
      <div className="w-full md:max-w-2xl mx-auto flex flex-col items-center">
        <div className=" inline-flex bg-white border rounded-full shadow-md items-center justify-center py-2 px-6 w-fit mb-6">
          <p className=" text-lg">FAQ</p>
        </div>
        <h2 className=" text-5xl md:text-7xl max-w-3xl font-medium text-center mt-6 mx-auto">
          Questions teams ask before turning Radar on
        </h2>
        <Accordion
          type="single"
          defaultValue="item-1"
          collapsible
          className="w-full gap-2 flex flex-col mt-10"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Does Radar answer without approved sources?
            </AccordionTrigger>
            <AccordionContent>
              No. Answer and proof cards require approved source citations. If
              the evidence is missing, Radar should ask for clarification, mark
              the response as needing confirmation, or escalate.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              What does the rep see during a call?
            </AccordionTrigger>
            <AccordionContent>
              The live surface is intentionally small: a capture indicator and a
              slim drawer with one cited guidance card when help is available.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What belongs in Knowledge Studio?</AccordionTrigger>
            <AccordionContent>
              Approved documents, policies, playbooks, source owners, freshness
              checks, replay tests, gaps, analytics, settings, and audit history.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Can Radar run before APIs are configured?</AccordionTrigger>
            <AccordionContent>
              The UI can show setup, empty, loading, and error states. Production
              guidance should stay disabled until live capture, retrieval, and
              source approval are configured.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>
              How does Radar handle uncertain technical questions?
            </AccordionTrigger>
            <AccordionContent>
              It keeps uncertainty visible. Depending on the evidence and policy
              state, a card can answer, ask, request confirmation, or escalate.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>
              Is this page using real customer data?
            </AccordionTrigger>
            <AccordionContent>
              No. Product-like surfaces on this page are empty or
              not-configured states so the UI does not imply connected
              production data.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default Faq;

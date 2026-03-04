"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { saveAiInteraction, escalateHelpRequest } from "@/lib/actions/help-requests";
import { SendIcon, Loader2Icon, XIcon, AlertTriangleIcon, BotIcon, UserIcon } from "lucide-react";

type StepContext = {
  stepId: string;
  stepText: string;
  stepNumber: number;
};

type ChatPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStepContext: StepContext | null;
  executionId: string;
  processId: string;
  processTitle: string;
  sopText: string;
};

export function ChatPanel({ open, onOpenChange, initialStepContext, executionId, processId, processTitle, sopText }: ChatPanelProps) {
  const t = useTranslations("Chat");
  const te = useTranslations("Errors");
  const locale = useLocale();

  const [input, setInput] = useState("");
  const [activeStep, setActiveStep] = useState<StepContext | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationNote, setEscalationNote] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeStepRef = useRef<StepContext | null>(null);
  const stepContextMap = useRef<Map<string, StepContext>>(new Map());
  const savedMessageIds = useRef<Set<string>>(new Set());
  const helpRequestIdMap = useRef<Map<string, string>>(new Map());

  // Keep ref in sync with state
  activeStepRef.current = activeStep;

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        sopText,
        processTitle,
        executionId,
        activeStepNumber: activeStepRef.current?.stepNumber,
        activeStepText: activeStepRef.current?.stepText,
        locale,
      }),
    }),
  });

  // Set step context when opened from a specific step
  useEffect(() => {
    if (open && initialStepContext) {
      setActiveStep(initialStepContext);
    }
  }, [open, initialStepContext]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Focus textarea when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-save AI interactions when response completes
  useEffect(() => {
    if (status !== "ready" || messages.length < 2) return;

    const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAiMsg || savedMessageIds.current.has(lastAiMsg.id)) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    savedMessageIds.current.add(lastAiMsg.id);

    const question = lastUserMsg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");
    const aiResponse = lastAiMsg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");

    const stepCtx = stepContextMap.current.get(lastUserMsg.id);

    saveAiInteraction({
      executionId,
      checklistStepId: stepCtx?.stepId ?? null,
      processId,
      question,
      aiResponse,
    }).then((result) => {
      if (result.helpRequestId) {
        helpRequestIdMap.current.set(lastAiMsg.id, result.helpRequestId);
      }
    });
  }, [status, messages, executionId, processId]);

  const isLoading = status === "submitted" || status === "streaming";

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    // Store step context for this message before sending
    const tempId = `temp-${Date.now()}`;
    if (activeStep) {
      stepContextMap.current.set(tempId, activeStep);
    }

    sendMessage({ text });
    setInput("");
    setActiveStep(null);
  }

  // After messages update, map temp IDs to real message IDs
  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        // Transfer temp step contexts to real message IDs
        for (const [tempId, ctx] of stepContextMap.current.entries()) {
          if (tempId.startsWith("temp-")) {
            stepContextMap.current.set(lastUserMsg.id, ctx);
            stepContextMap.current.delete(tempId);
            break;
          }
        }
      }
    }
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleEscalate() {
    if (messages.length < 2) return;

    setEscalating(true);
    const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant");
    const helpRequestId = lastAiMsg ? helpRequestIdMap.current.get(lastAiMsg.id) : null;

    if (helpRequestId) {
      await escalateHelpRequest(helpRequestId, escalationNote.trim() || te("noHelpRequest"));
      setEscalated(true);
    }
    setEscalating(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg p-0 h-dvh">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("subtitle", { processTitle })}</SheetDescription>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-muted text-muted-foreground">
                <BotIcon className="size-4" />
              </div>
              <div className="inline-block rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                <p className="text-sm text-muted-foreground">{t("welcome")}</p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const stepCtx = stepContextMap.current.get(message.id);
            const textContent = message.parts
              .filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("");

            return (
              <div key={message.id} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isUser ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                </div>
                <div className={`flex-1 min-w-0 space-y-1 ${isUser ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
                    {stepCtx && isUser && (
                      <Badge variant="secondary" className="text-xs">
                        {t("stepBadge", { number: stepCtx.stepNumber })}
                      </Badge>
                    )}
                    <span className="text-xs font-medium">{isUser ? t("you") : t("assistant")}</span>
                    {stepCtx && !isUser && (
                      <Badge variant="secondary" className="text-xs">
                        {t("stepBadge", { number: stepCtx.stepNumber })}
                      </Badge>
                    )}
                  </div>
                  {isUser ? (
                    <div className="inline-block rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2">
                      <p className="text-sm whitespace-pre-wrap text-left">{textContent}</p>
                    </div>
                  ) : (
                    <div className="inline-block rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-left">
                      <MarkdownRenderer content={textContent} className="text-sm" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex items-start gap-3">
              <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-muted text-muted-foreground">
                <BotIcon className="size-4" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-sm">{t("thinking")}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertDescription>{t("errorOccurred")}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Escalation */}
        {messages.length >= 2 && !escalated && (
          <div className="px-4">
            {!showEscalation ? (
              <Button variant="ghost" size="sm" onClick={() => setShowEscalation(true)} className="text-muted-foreground w-full">
                <AlertTriangleIcon className="size-4 mr-2" />
                {t("escalateToManager")}
              </Button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border">
                <Textarea
                  value={escalationNote}
                  onChange={(e) => setEscalationNote(e.target.value)}
                  placeholder={t("escalationNotePlaceholder")}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleEscalate} disabled={escalating} className="flex-1">
                    {escalating ? (
                      <>
                        <Loader2Icon className="size-4 mr-2 animate-spin" />
                        {t("escalating")}
                      </>
                    ) : (
                      t("escalate")
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowEscalation(false)}>
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {escalated && (
          <div className="px-4">
            <Alert>
              <AlertDescription>{t("escalated")}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step context badge */}
        {activeStep && (
          <div className="px-4 flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              {t("askingAboutStep", { number: activeStep.stepNumber })}
              <button onClick={() => setActiveStep(null)} className="ml-1 hover:text-foreground">
                <XIcon className="size-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("inputPlaceholder")}
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0">
              {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

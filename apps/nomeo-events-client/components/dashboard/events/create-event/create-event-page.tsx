"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/hooks/use-events";
import { BasicInfoStep } from "./basic-info-step";
import { DateTimeStep } from "./date-time-step";
import { LocationStep } from "./location-step";
import { TicketsStep } from "./ticket-step";
import { AgeRequirementStep } from "./age-requirement-step";
import { SpeakersStep } from "./speaker-step";
import { MediaStep } from "./media-step";
import { AdvancedSettingsStep } from "./advance-setting-step";
import { SummaryStep } from "./summary-step";
import {
  EventCategory,
  EventMode,
  getDefaultMode,
  isVirtualMode,
  PlanType,
} from "@/types/create-event-type";
import { EventTabs } from "../event-tabs";

// ─── Schema ───────────────────────────────────────────────────────────────────

const physicalLocationSchema = z.object({
  venue: z.string().min(1, "Venue is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  notes: z.string().optional(),
  googleMapsLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  platform: z.string().optional(),
  streamUrl: z.string().optional(),
});

const virtualLocationSchema = z.object({
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  googleMapsLink: z.string().optional(),
  platform: z.string().min(1, "Platform is required (e.g. Zoom, Google Meet)"),
  streamUrl: z.string().url("Must be a valid stream/meeting URL").optional().or(z.literal("")),
});

const hybridLocationSchema = z.object({
  venue: z.string().min(1, "Venue is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  notes: z.string().optional(),
  googleMapsLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  platform: z.string().optional(),
  streamUrl: z.string().url("Must be a valid stream/meeting URL").optional().or(z.literal("")),
});

const eventFormSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    shortDescription: z.string().max(200, "Short description cannot exceed 200 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    category: z.string().min(1, "Category is required"),
    type: z.string().min(1, "Event type is required"),
    eventMode: z.enum(["physical", "virtual", "hybrid"]).default("physical"),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
    timezone: z.string().default("UTC"),
    location: z.object({
      venue: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      notes: z.string().optional(),
      googleMapsLink: z.string().optional(),
      platform: z.string().optional(),
      streamUrl: z.string().optional(),
    }),
    totalSeats: z.number().min(1, "Total seats must be at least 1"),
    waitlistEnabled: z.boolean().default(false),
    plans: z
      .array(
        z.object({
          type: z.string().min(1, "Plan type is required"),
          name: z.string().min(1, "Plan name is required"),
          price: z.number().min(0, "Price cannot be negative"),
          currency: z.string().default("NGN"),
          benefits: z.array(z.string()),
          maxSeats: z.number().optional().nullable(),
          earlyBirdDeadline: z.date().optional().nullable(),
        })
      )
      .min(1, "At least one ticket plan is required"),
    ageRequirement: z.object({
      required: z.boolean().default(false),
      minAge: z.number().min(0).max(120).optional().nullable(),
      maxAge: z.number().min(0).max(120).optional().nullable(),
      allowedAgeGroups: z.array(z.string()).optional(),
      requiresParentalConsent: z.boolean().default(false),
      parentalConsentMessage: z.string().optional(),
      ageVerificationRequired: z.boolean().default(false),
      ageVerificationMethod: z
        .enum(["id_check", "self_declaration", "guardian_confirmation"])
        .default("self_declaration"),
    }),
    speakers: z.array(
      z.object({
        name: z.string().min(1, "Speaker name is required"),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        bio: z.string().optional(),
        company: z.string().optional(),
      })
    ),
    banner: z
      .object({ secure_url: z.string(), public_id: z.string() })
      .optional()
      .nullable(),
    registrationDeadline: z.date().optional().nullable(),
    isPublic: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const mode = data.eventMode;
    const loc = data.location;
    if (mode === "virtual") {
      const result = virtualLocationSchema.safeParse(loc);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ["location", ...issue.path] });
        });
      }
    } else if (mode === "physical" || mode === "hybrid") {
      const schema = mode === "physical" ? physicalLocationSchema : hybridLocationSchema;
      const result = schema.safeParse(loc);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ["location", ...issue.path] });
        });
      }
    }
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate > data.startDate,
    { message: "End date must be after start date", path: ["endDate"] }
  );

type EventFormData = z.infer<typeof eventFormSchema>;

// ─── Steps ────────────────────────────────────────────────────────────────────

const ALL_STEPS = [
  { id: "basic",    title: "Basic Information", description: "Event title, description, and category",  component: BasicInfoStep        },
  { id: "datetime", title: "Date & Time",        description: "When your event takes place",             component: DateTimeStep         },
  { id: "location", title: "Location",           description: "Where your event will be held",           component: LocationStep         },
  { id: "tickets",  title: "Tickets & Pricing",  description: "Ticket plans and pricing",                component: TicketsStep          },
  { id: "age",      title: "Age Requirements",   description: "Age restrictions and verification",       component: AgeRequirementStep   },
  { id: "speakers", title: "Speakers",           description: "Event speakers and presenters",           component: SpeakersStep         },
  { id: "media",    title: "Media",              description: "Banner and promotional images",           component: MediaStep            },
  { id: "advanced", title: "Advanced Settings",  description: "Registration, visibility, and SEO",       component: AdvancedSettingsStep },
  { id: "summary",  title: "Summary",            description: "Review your event before publishing",     component: SummaryStep          },
];

const STEP_VALIDATION: Record<string, (keyof EventFormData)[]> = {
  basic:    ["title", "shortDescription", "description", "category", "type"],
  datetime: ["startDate", "endDate"],
  location: ["location"],
  tickets:  ["totalSeats", "plans"],
  age:      [],
  speakers: [],
  media:    [],
  advanced: [],
  summary:  [],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();
  const { useCreateEvent } = useEvents();
  const createEvent = useCreateEvent();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      category: EventCategory.WEBINAR,
      type: "",
      eventMode: getDefaultMode(EventCategory.WEBINAR),
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: {
        venue: "", address: "", city: "", country: "Nigeria",
        notes: "", googleMapsLink: "", platform: "", streamUrl: "",
      },
      totalSeats: 100,
      waitlistEnabled: false,
      plans: [{
        type: PlanType.REGULAR,
        name: "Regular Ticket",
        price: 0,
        currency: "USD",
        benefits: ["General admission"],
        maxSeats: null,
        earlyBirdDeadline: null,
      }],
      ageRequirement: {
        required: false,
        minAge: null,
        maxAge: null,
        allowedAgeGroups: [],
        requiresParentalConsent: false,
        parentalConsentMessage: "",
        ageVerificationRequired: false,
        ageVerificationMethod: "self_declaration",
      },
      speakers: [],
      banner: null,
      isPublic: true,
      requiresApproval: false,
      tags: [],
      featured: false,
      registrationDeadline: null,
      seoTitle: "",
      seoDescription: "",
    },
  });

  const { watch, setValue } = form;

  const watchedCategory = watch("category");
  useEffect(() => {
    setValue("eventMode", getDefaultMode(watchedCategory as EventCategory));
  }, [watchedCategory, setValue]);

  const eventMode = watch("eventMode") as EventMode;
  const isSummaryStep = currentStep === ALL_STEPS.length - 1;

  // ── Explicit submit — only ever called by the Create Event button onClick ──
  const handleCreateEvent = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    setIsSubmitting(true);

    try {
      await createEvent.mutateAsync({
        ...data,
        plans: data.plans.map((p) => ({
          ...p,
          maxSeats: p.maxSeats ?? undefined,
          earlyBirdDeadline: p.earlyBirdDeadline ?? undefined,
        })),
        ageRequirement: {
          ...data.ageRequirement,
          minAge: data.ageRequirement.minAge ?? undefined,
          maxAge: data.ageRequirement.maxAge ?? undefined,
        },
        registrationDeadline: data.registrationDeadline ?? undefined,
        banner: data.banner ?? undefined,
      } as any);
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const nextStep = async () => {
    const stepId = ALL_STEPS[currentStep].id;
    const fields = STEP_VALIDATION[stepId] ?? [];

    const fieldsToValidate: (keyof EventFormData)[] =
      stepId === "location" && isVirtualMode(eventMode) ? [] : fields;

    const isValid =
      fieldsToValidate.length === 0 || (await form.trigger(fieldsToValidate));

    if (isValid && currentStep < ALL_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const StepComponent = ALL_STEPS[currentStep].component;

  const isLocationStep = ALL_STEPS[currentStep].id === "location";
  const stepTitle = isLocationStep && isVirtualMode(eventMode) ? "Online Details" : ALL_STEPS[currentStep].title;
  const stepDescription = isLocationStep && isVirtualMode(eventMode)
    ? "Platform and meeting link for your online event"
    : ALL_STEPS[currentStep].description;

  return (
    <>
      <EventTabs/>
      <div className="container mx-auto pb-6">
        <div className="mb-6">
          <div className="flex items-center gap-6 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Event
            </h1>
          </div>
        </div>

        <FormProvider {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >

            {/* Progress steps */}
            <div className="mb-8">
              {/* Step label header — shows current step info on mobile/tablet */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    Step {currentStep + 1} of {ALL_STEPS.length}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {ALL_STEPS[currentStep].id === "location" && isVirtualMode(eventMode)
                      ? "Online Details"
                      : ALL_STEPS[currentStep].id === "summary"
                      ? "Review Changes"      // use "Review & Create" on the create page
                      : ALL_STEPS[currentStep].title}
                  </p>
                </div>
                {/* Next step preview */}
                {currentStep < ALL_STEPS.length - 1 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Next</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {ALL_STEPS[currentStep + 1].id === "location" && isVirtualMode(eventMode)
                        ? "Online Details"
                        : ALL_STEPS[currentStep + 1].title}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${((currentStep + 1) / ALL_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Step dots — mobile & tablet */}
              <div className="flex items-center justify-between lg:hidden">
                {ALL_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); goToStep(index); }}
                    disabled={index > currentStep}
                    aria-label={step.title}
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      // Size: current step is bigger
                      index === currentStep ? "w-8 h-8" : "w-6 h-6",
                      // Colors
                      index < currentStep
                        ? "bg-green-500 text-white cursor-pointer"
                        : index === currentStep
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {index < currentStep ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                    {/* Connector line between dots */}
                    {index < ALL_STEPS.length - 1 && (
                      <span
                        className={cn(
                          "absolute left-full top-1/2 -translate-y-1/2 h-px transition-all duration-300",
                          // Width fills gap between dots — adjust based on step count
                          "w-[calc((100vw-4rem)/9-1.5rem)] max-w-8",
                          index < currentStep ? "bg-green-400" : "bg-muted"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Step pills — desktop only (lg+) */}
              <div className="hidden lg:flex items-center justify-between">
                {ALL_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium transition-colors",
                      index <= currentStep ? "cursor-pointer" : "cursor-not-allowed",
                      index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    )}
                    onClick={(e) => { e.preventDefault(); goToStep(index); }}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all duration-200",
                        index < currentStep
                          ? "bg-green-500 text-white"
                          : index === currentStep
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep
                        ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3" />
                        : <span>{index + 1}</span>}
                    </div>
                    <span className="whitespace-nowrap text-xs">
                      {step.id === "location" && isVirtualMode(eventMode)
                        ? "Online Details"
                        : step.id === "summary"
                        ? "Review Changes"
                        : step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>{stepTitle}</CardTitle>
                <CardDescription>{stepDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <StepComponent />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 lg:h-11 h-10"
              >
                Previous
              </Button>

              {isSummaryStep ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateEvent}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11"
                >
                  {isSubmitting ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                      Creating Event...
                    </>
                  ) : "Create Event"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11"
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}
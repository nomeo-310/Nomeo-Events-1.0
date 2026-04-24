"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, CheckmarkCircle02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/hooks/use-events";
import { EventCategory, EventMode, getDefaultMode, isVirtualMode, PlanType } from "@/types/create-event-type";
import { BasicInfoStep } from "./basic-info-step";
import { DateTimeStep } from "./date-time-step";
import { LocationStep } from "./location-step";
import { TicketsStep } from "./ticket-step";
import { AgeRequirementStep } from "./age-requirement-step";
import { SpeakersStep } from "./speaker-step";
import { MediaStep } from "./media-step";
import { AdvancedSettingsStep } from "./advance-setting-step";
import { SummaryStep } from "./summary-step";
import { EventTabs } from "../event-tabs";


// ─── Schema (identical to create) ────────────────────────────────────────────

const physicalLocationSchema = z.object({
  venue:          z.string().min(1, "Venue is required"),
  address:        z.string().min(1, "Address is required"),
  city:           z.string().min(1, "City is required"),
  country:        z.string().min(1, "Country is required"),
  notes:          z.string().optional(),
  googleMapsLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  platform:       z.string().optional(),
  streamUrl:      z.string().optional(),
});

const virtualLocationSchema = z.object({
  venue:          z.string().optional(),
  address:        z.string().optional(),
  city:           z.string().optional(),
  country:        z.string().optional(),
  notes:          z.string().optional(),
  googleMapsLink: z.string().optional(),
  platform:       z.string().min(1, "Platform is required (e.g. Zoom, Google Meet)"),
  streamUrl:      z.string().url("Must be a valid stream/meeting URL").optional().or(z.literal("")),
});

const hybridLocationSchema = z.object({
  venue:          z.string().min(1, "Venue is required"),
  address:        z.string().min(1, "Address is required"),
  city:           z.string().min(1, "City is required"),
  country:        z.string().min(1, "Country is required"),
  notes:          z.string().optional(),
  googleMapsLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  platform:       z.string().optional(),
  streamUrl:      z.string().url("Must be a valid stream/meeting URL").optional().or(z.literal("")),
});

const eventFormSchema = z
  .object({
    title:            z.string().min(3, "Title must be at least 3 characters").max(200),
    shortDescription: z.string().max(200, "Short description cannot exceed 200 characters"),
    description:      z.string().min(20, "Description must be at least 20 characters"),
    category:         z.string().min(1, "Category is required"),
    type:             z.string().min(1, "Event type is required"),
    eventMode:        z.enum(["physical", "virtual", "hybrid"]).default("physical"),
    startDate:        z.date({ message: "Start date is required" }),
    endDate:          z.date({ message: "End date is required" }),
    timezone:         z.string().default("UTC"),
    location: z.object({
      venue:          z.string().optional(),
      address:        z.string().optional(),
      city:           z.string().optional(),
      country:        z.string().optional(),
      notes:          z.string().optional(),
      googleMapsLink: z.string().optional(),
      platform:       z.string().optional(),
      streamUrl:      z.string().optional(),
    }),
    totalSeats:      z.number().min(1, "Total seats must be at least 1"),
    waitlistEnabled: z.boolean().default(false),
    plans: z.array(
      z.object({
        type:             z.string().min(1, "Plan type is required"),
        name:             z.string().min(1, "Plan name is required"),
        price:            z.number().min(0, "Price cannot be negative"),
        currency:         z.string().default("NGN"),
        benefits:         z.array(z.string()),
        maxSeats:         z.number().optional().nullable(),
        earlyBirdDeadline: z.date().optional().nullable(),
      })
    ).min(1, "At least one ticket plan is required"),
    ageRequirement: z.object({
      required:               z.boolean().default(false),
      minAge:                 z.number().min(0).max(120).optional().nullable(),
      maxAge:                 z.number().min(0).max(120).optional().nullable(),
      allowedAgeGroups:       z.array(z.string()).optional(),
      requiresParentalConsent: z.boolean().default(false),
      parentalConsentMessage: z.string().optional(),
      ageVerificationRequired: z.boolean().default(false),
      ageVerificationMethod:  z.enum(["id_check", "self_declaration", "guardian_confirmation"]).default("self_declaration"),
    }),
    speakers: z.array(
      z.object({
        name:    z.string().min(1, "Speaker name is required"),
        email:   z.string().email("Invalid email").optional().or(z.literal("")),
        bio:     z.string().optional(),
        company: z.string().optional(),
      })
    ),
    banner:               z.object({ secure_url: z.string(), public_id: z.string() }).optional().nullable(),
    registrationDeadline: z.date().optional().nullable(),
    isPublic:             z.boolean().default(true),
    requiresApproval:     z.boolean().default(false),
    tags:                 z.array(z.string()),
    featured:             z.boolean().default(false),
    seoTitle:             z.string().optional(),
    seoDescription:       z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const mode = data.eventMode;
    const loc  = data.location;
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
  { id: "summary",  title: "Review Changes",     description: "Review your changes before saving",       component: SummaryStep          },
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

// ─── Loader skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="container mx-auto py-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 mb-8" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full w-8" />
        ))}
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-8" />
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();

  const eventId = params.id as string;

  const { useGetEvent, useUpdateEvent } = useEvents();
  const { data: eventData, isLoading: eventLoading, isError } = useGetEvent(eventId);
  
  const updateEvent = useUpdateEvent();

  const [currentStep,  setCurrentStep]  = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [populated,    setPopulated]    = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      title:            "",
      description:      "",
      shortDescription: "",
      category:         EventCategory.WEBINAR,
      type:             "",
      eventMode:        getDefaultMode(EventCategory.WEBINAR),
      startDate:        new Date(),
      endDate:          new Date(Date.now() + 3600000),
      timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: {
        venue: "", address: "", city: "", country: "",
        notes: "", googleMapsLink: "", platform: "", streamUrl: "",
      },
      totalSeats:      100,
      waitlistEnabled: false,
      plans: [{
        type:             PlanType.REGULAR,
        name:             "Regular Ticket",
        price:            0,
        currency:         "USD",
        benefits:         ["General admission"],
        maxSeats:         null,
        earlyBirdDeadline: null,
      }],
      ageRequirement: {
        required:                false,
        minAge:                  null,
        maxAge:                  null,
        allowedAgeGroups:        [],
        requiresParentalConsent: false,
        parentalConsentMessage:  "",
        ageVerificationRequired: false,
        ageVerificationMethod:   "self_declaration",
      },
      speakers:             [],
      banner:               null,
      isPublic:             true,
      requiresApproval:     false,
      tags:                 [],
      featured:             false,
      registrationDeadline: null,
      seoTitle:             "",
      seoDescription:       "",
    },
  });

  const { watch, setValue } = form;
  const eventMode = watch("eventMode") as EventMode;

  // ── Populate form once event data arrives ──────────────────────────────────
  useEffect(() => {
    if (!eventData || populated) return;

    const e = eventData;

    // Detect eventMode from location data
    const hasVenue    = !!(e.location?.venue);
    const hasPlatform = !!(e.location as any)?.platform;
    const detectedMode: EventMode = hasVenue && hasPlatform ? "hybrid" : hasPlatform ? "virtual" : "physical";

    form.reset({
      title:            e.title            ?? "",
      description:      e.description      ?? "",
      shortDescription: (e as any).shortDescription ?? "",
      category:         e.category         ?? EventCategory.WEBINAR,
      type:             e.type             ?? "",
      eventMode:        detectedMode,
      startDate:        e.startDate        ? new Date(e.startDate) : new Date(),
      endDate:          e.endDate          ? new Date(e.endDate)   : new Date(Date.now() + 3600000),
      timezone:         (e as any).timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: {
        venue:          e.location?.venue           ?? "",
        address:        e.location?.address         ?? "",
        city:           e.location?.city            ?? "",
        country:        e.location?.country         ?? "",
        notes:          e.location?.notes           ?? "",
        googleMapsLink: e.location?.googleMapsLink  ?? "",
        platform:       (e.location as any)?.platform  ?? "",
        streamUrl:      (e.location as any)?.streamUrl  ?? "",
      },
      totalSeats:      e.totalSeats      ?? 100,
      waitlistEnabled: (e as any).waitlistEnabled ?? false,
      plans: e.plans?.length
        ? e.plans.map((p) => ({
            type:             p.type     ?? PlanType.REGULAR,
            name:             p.name     ?? "",
            price:            p.price    ?? 0,
            currency:         p.currency ?? "USD",
            benefits:         p.benefits ?? [],
            maxSeats:         (p as any).maxSeats          ?? null,
            earlyBirdDeadline: p.earlyBirdDeadline
              ? new Date(p.earlyBirdDeadline)
              : null,
          }))
        : [{
            type:             PlanType.REGULAR,
            name:             "Regular Ticket",
            price:            0,
            currency:         "USD",
            benefits:         [],
            maxSeats:         null,
            earlyBirdDeadline: null,
          }],
      ageRequirement: {
        required:                (e as any).ageRequirement?.required                ?? false,
        minAge:                  (e as any).ageRequirement?.minAge                  ?? null,
        maxAge:                  (e as any).ageRequirement?.maxAge                  ?? null,
        allowedAgeGroups:        (e as any).ageRequirement?.allowedAgeGroups        ?? [],
        requiresParentalConsent: (e as any).ageRequirement?.requiresParentalConsent ?? false,
        parentalConsentMessage:  (e as any).ageRequirement?.parentalConsentMessage  ?? "",
        ageVerificationRequired: (e as any).ageRequirement?.ageVerificationRequired ?? false,
        ageVerificationMethod:   (e as any).ageRequirement?.ageVerificationMethod   ?? "self_declaration",
      },
      speakers: (e as any).speakers?.length
        ? (e as any).speakers.map((s: any) => ({
            name:    s.name    ?? "",
            email:   s.email   ?? "",
            bio:     s.bio     ?? "",
            company: s.company ?? "",
          }))
        : [],
      banner:               e.banner   ?? null,
      registrationDeadline: (e as any).registrationDeadline
        ? new Date((e as any).registrationDeadline)
        : null,
      isPublic:         e.isPublic         ?? true,
      requiresApproval: (e as any).requiresApproval ?? false,
      tags:             (e as any).tags    ?? [],
      featured:         e.featured         ?? false,
      seoTitle:         (e as any).seoTitle        ?? "",
      seoDescription:   (e as any).seoDescription  ?? "",
    });

    setPopulated(true);
  }, [eventData, populated, form]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleUpdateEvent = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    setIsSubmitting(true);

    try {
      await updateEvent.mutateAsync({
        eventId,
        eventData: {
          ...data,
          plans: data.plans.map((p) => ({
            ...p,
            maxSeats:          p.maxSeats          ?? undefined,
            earlyBirdDeadline: p.earlyBirdDeadline ?? undefined,
          })),
          ageRequirement: {
            ...data.ageRequirement,
            minAge: data.ageRequirement.minAge ?? undefined,
            maxAge: data.ageRequirement.maxAge ?? undefined,
          },
          registrationDeadline: data.registrationDeadline ?? undefined,
          banner:               data.banner               ?? undefined,
        } as any,
      });
      router.push(`/dashboard/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
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

  // ── Loading / error states ─────────────────────────────────────────────────
  if (eventLoading) return <PageSkeleton />;

  if (isError || !eventData) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Event not found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This event could not be loaded. It may have been deleted.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/events")}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const StepComponent   = ALL_STEPS[currentStep].component;
  const isSummaryStep   = currentStep === ALL_STEPS.length - 1;
  const isLocationStep  = ALL_STEPS[currentStep].id === "location";
  const stepTitle       = isLocationStep && isVirtualMode(eventMode) ? "Online Details"                              : ALL_STEPS[currentStep].title;
  const stepDescription = isLocationStep && isVirtualMode(eventMode) ? "Platform and meeting link for your online event" : ALL_STEPS[currentStep].description;

  return (
    <>
      <EventTabs />
      <div className="container mx-auto pb-6">
        {/* Page title */}
        <div className="mb-6">
          <div className="flex items-center gap-6 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Event
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {eventData.title}
          </p>
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

            {/* Step content */}
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
                  onClick={handleUpdateEvent}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11"
                >
                  {isSubmitting ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : "Save Changes"}
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
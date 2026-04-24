// Shared enums and types — import from here in all step components

export enum EventCategory {
  WEBINAR = 'webinar',
  SEMINAR = 'seminar',
  ENTERTAINMENT = 'entertainment',
  FILM_SHOW = 'film_show',
  SCIENCE_TECH = 'science_tech',
  SCHOOL_ACTIVITIES = 'school_activities',
  SPIRITUALITY = 'spirituality',
  FASHION = 'fashion',
  BUSINESS = 'business',
  SPORTS = 'sports',
  HEALTH_WELLNESS = 'health_wellness',
  ART_CULTURE = 'art_culture',
  FOOD_DRINK = 'food_drink',
  NETWORKING = 'networking',
  CHARITY = 'charity'
}

export const EventTypesByCategory: Record<EventCategory, string[]> = {
  [EventCategory.WEBINAR]: ['workshop','panel_discussion','keynote','training','product_demo','q_and_a','masterclass'],
  [EventCategory.SEMINAR]: ['academic','professional','business','educational','conference','symposium','leadership_summit'],
  [EventCategory.ENTERTAINMENT]: ['concert','show','listening_party','festival','comedy_show','theater','movie_screening','live_performance','stand_up_comedy','magic_show'],
  [EventCategory.FILM_SHOW]: ['movie_premiere','film_festival','documentary_screening','short_film_showcase','directors_cut','animated_film','film_awards','marathon_screening'],
  [EventCategory.SCIENCE_TECH]: ['tech_conference','hackathon','coding_workshop','robotics_competition','science_fair','product_launch','ai_summit','blockchain_event','space_exhibition','innovation_lab'],
  [EventCategory.SCHOOL_ACTIVITIES]: ['graduation','sports_day','science_exhibition','cultural_fest','alumni_meet','parent_teacher_meeting','orientation','field_trip','debate_competition','quiz_competition','career_guidance','art_competition'],
  [EventCategory.SPIRITUALITY]: ['worship_service','praise_program','prayer_meeting','meditation_retreat','bible_study','spiritual_retreat','gospel_concert','crusade','fasting_program','yoga_retreat','faith_conference','devotional_gathering'],
  [EventCategory.FASHION]: ['fashion_show','fashion_week','designer_showcase','model_castings','fashion_exhibition','style_workshop','trunk_show','fashion_awards','couture_show','vintage_fair'],
  [EventCategory.BUSINESS]: ['business_networking','entrepreneurship_summit','startup_pitch','trade_show','corporate_training','business_forum','investor_meetup','sales_workshop','marketing_summit','leadership_retreat'],
  [EventCategory.SPORTS]: ['football_match','basketball_game','tennis_tournament','marathon','fitness_competition','esports_tournament','sports_clinic','athletics_meet','swimming_championship','martial_arts_tournament'],
  [EventCategory.HEALTH_WELLNESS]: ['wellness_workshop','health_seminar','fitness_challenge','yoga_session','mental_health_forum','nutrition_workshop','medical_camp','health_expo','charity_run'],
  [EventCategory.ART_CULTURE]: ['art_exhibition','cultural_festival','paint_and_sip','photography_exhibit','craft_fair','dance_performance','music_festival','poetry_reading','book_launch'],
  [EventCategory.FOOD_DRINK]: ['food_festival','wine_tasting','cooking_class','restaurant_week','brewery_tour','farmers_market','food_truck_festival','chef_competition'],
  [EventCategory.NETWORKING]: ['business_networking','professional_mixer','industry_meetup','job_fair','speed_networking','alumni_networking'],
  [EventCategory.CHARITY]: ['fundraising_gala','charity_run','donation_drive','benefit_concert','volunteer_day','awareness_campaign'],
};

// ─── Event mode ───────────────────────────────────────────────────────────────

export type EventMode = "physical" | "virtual" | "hybrid";

// Categories that are ALWAYS fully online — no physical venue is collected.
export const VIRTUAL_CATEGORIES = new Set<EventCategory>([
  EventCategory.WEBINAR,
]);

// Categories that can be physical OR virtual — the user picks via a toggle.
// If the user picks "virtual", physical location fields are hidden/optional.
export const HYBRID_CATEGORIES = new Set<EventCategory>([
  EventCategory.SEMINAR,
  EventCategory.SCIENCE_TECH,
  EventCategory.NETWORKING,
  EventCategory.BUSINESS,
]);

/** Returns the default mode for a given category. */
export function getDefaultMode(category: EventCategory): EventMode {
  if (VIRTUAL_CATEGORIES.has(category)) return "virtual";
  if (HYBRID_CATEGORIES.has(category)) return "hybrid";
  return "physical";
}

/** True when a physical venue/address is NOT required. */
export function isVirtualMode(mode: EventMode): boolean {
  return mode === "virtual";
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled'
}

export enum PlanType {
  REGULAR = 'regular',
  VIP = 'vip',
  PREMIUM = 'premium',
  GROUP = 'group',
  EARLY_BIRD = 'early_bird',
  STUDENT = 'student',
  CORPORATE = 'corporate'
}
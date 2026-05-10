// Clarifying questions for keyword templates

export const CLARIFYING_QUESTIONS: Record<string, {
  question: string;
  options: { label: string; value: string }[];
}> = {
  vehicle: {
    question: "What type of vehicle?",
    options: [
      { label: "🚗 Petrol / Diesel", value: "petrol" },
      { label: "⚡ Electric (EV)", value: "electric" },
      { label: "🏍️ Bike / Scooter", value: "bike" },
      { label: "🚗🏍️ Multiple", value: "multiple" },
    ]
  },
  car: {
    question: "Petrol, diesel, or electric?",
    options: [
      { label: "⛽ Petrol", value: "petrol" },
      { label: "🛢️ Diesel", value: "diesel" },
      { label: "⚡ Electric", value: "electric" },
    ]
  },
  groceries: {
    question: "How do you usually eat?",
    options: [
      { label: "🥗 Vegetarian", value: "vegetarian" },
      { label: "🥩 Non-vegetarian", value: "nonveg" },
      { label: "🌱 Vegan", value: "vegan" },
    ]
  },
  pet: {
    question: "What kind of pet?",
    options: [
      { label: "🐶 Dog", value: "dog" },
      { label: "🐱 Cat", value: "cat" },
      { label: "🐠 Fish", value: "fish" },
      { label: "🐦 Bird", value: "bird" },
      { label: "🐾 Other", value: "other" },
    ]
  },
  dog: {
    question: "How old is your dog?",
    options: [
      { label: "🐶 Puppy (under 1yr)", value: "puppy" },
      { label: "🐕 Adult", value: "adult" },
      { label: "🦴 Senior (7yr+)", value: "senior" },
    ]
  },
  cat: {
    question: "Indoor or outdoor cat?",
    options: [
      { label: "🏠 Indoor only", value: "indoor" },
      { label: "🌿 Goes outside", value: "outdoor" },
    ]
  },
  baby: {
    question: "How old is your baby?",
    options: [
      { label: "👶 0-6 months", value: "newborn" },
      { label: "🍼 6-12 months", value: "infant" },
      { label: "🧒 1-3 years", value: "toddler" },
      { label: "👦 3-6 years", value: "preschool" },
    ]
  },
  plant: {
    question: "Where are your plants?",
    options: [
      { label: "🏠 Indoor", value: "indoor" },
      { label: "🌿 Balcony / terrace", value: "balcony" },
      { label: "🌳 Garden / outdoor", value: "outdoor" },
      { label: "🌵 Mix of both", value: "mixed" },
    ]
  },
  garden: {
    question: "What kind of garden?",
    options: [
      { label: "🌸 Flowers / ornamental", value: "flowers" },
      { label: "🥕 Vegetables / herbs", value: "vegetables" },
      { label: "🌴 Mixed", value: "mixed" },
    ]
  },
  business: {
    question: "What kind of work?",
    options: [
      { label: "💻 Freelancer", value: "freelancer" },
      { label: "🏢 Small business", value: "small_business" },
      { label: "🚀 Startup founder", value: "startup" },
      { label: "📱 Creator / influencer", value: "creator" },
    ]
  },
  travel: {
    question: "What kind of travel?",
    options: [
      { label: "✈️ Upcoming trip", value: "upcoming" },
      { label: "🗺️ Frequent traveller", value: "frequent" },
      { label: "🏕️ Weekend getaways", value: "weekend" },
    ]
  },
};

// Returns null if no clarification needed for this keyword
export function getClarifyingQuestion(keyword: string) {
  const normalised = keyword.toLowerCase().trim();
  return CLARIFYING_QUESTIONS[normalised] || null;
}
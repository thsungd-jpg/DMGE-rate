import { FLYER_DESIGN_SIZES, FLYER_PRINT_SIZES, POSTER_DESIGN_SIZES, POSTER_PRINT_SIZES } from "./printSizes.js";

// More crafts for the Quote page: new fields, and extra roles for three existing ones. Same shape as src/processed_roles.json, plus per role `keywords`
// (extra words people search with) and per model an optional `hours` (about how many hours one unit takes a working freelancer; it only feeds the
// "From my goal" rate, where the user can always change it).
//
// Every `base` is a STARTING POINT, a typical US freelance rate for someone with a few years of paid work, rounded. It is not market data: the app says so
// next to the number, the user adjusts it, and where the US Bureau of Labor Statistics has a matching occupation the Rate step shows a sourced check
// (src/data/wageAnchors.js). `scripts/check-roles.mjs` warns when a time-based starting rate is below what employees in that job earn per hour.
//
// Names are permanent: saved jobs and templates find a role and model by name, so never rename or remove one here.
// A model is [type, unit, base, hours?, extras?]. extras: { sizes } (see ./printSizes.js: the rate is for the base size and scales with the one chosen) and
// { qty } (how many a quote starts with, for products sold by the hundred, like flyers).
const role = (name, keywords, models, materials = []) => ({
  name,
  keywords,
  models: models.map(([type, unit, base, hours, extras]) => ({ type, unit, base, ...(hours ? { hours } : {}), ...(extras || {}) })),
  materials: materials.map(([n, cost]) => ({ name: n, cost })),
});

/** New fields, in the order they appear (after the existing ones). */
export const NEW_FIELDS = {
  "Creator Economy": {
    roles: [
      role("YouTuber / Video Creator", ["youtube", "youtuber", "vlogger", "channel", "video creator"], [
        ["Sponsored Integration (60-90 sec)", "per video", 400, 3],
        ["Dedicated Sponsored Video", "per video", 1500, 20],
        ["Video Production for a Brand", "per video", 800, 12],
        ["Ad Revenue (CPM)", "per 1,000 views", 4],
        ["Channel Management Retainer", "per month", 1500, 25],
      ]),
      role("Twitch / Livestreamer", ["streamer", "twitch", "live stream", "kick", "gaming"], [
        ["Sponsored Stream (2-3 hrs)", "per stream", 300, 3],
        ["Guest Spot / Co-Stream", "per hour", 50],
        ["Subathon / Event Stream", "per event", 1000, 12],
        ["Overlay & Alerts Package", "per package", 150, 4],
      ]),
      role("UGC Creator", ["ugc", "user generated content", "tiktok shop", "creator for brands", "product videos"], [
        ["UGC Video (30-60 sec)", "per video", 150, 3],
        ["UGC Photo Set", "per set", 100, 2],
        ["UGC Bundle (3 videos)", "per bundle", 400, 8],
        ["Usage / Whitelisting (30 days)", "per month", 200],
      ]),
      role("Short-Form Video Creator", ["tiktok", "reels", "shorts", "instagram", "influencer"], [
        ["Sponsored Post", "per post", 250, 3],
        ["Series of 4 Posts", "per series", 800, 12],
        ["Editing for Brands", "per video", 75, 1.5],
        ["Monthly Content Package (12 posts)", "per month", 1800, 36],
      ]),
      role("Newsletter Writer / Blogger", ["newsletter", "substack", "blog", "blogger", "writer"], [
        ["Sponsored Newsletter Slot", "per issue", 300, 2],
        ["Sponsored Blog Post", "per post", 350, 4],
        ["Guest Article", "per article", 200, 4],
        ["Affiliate Commission", "% of sales", 10],
        ["Newsletter Ghostwriting (monthly)", "per month", 800, 16],
      ]),
      role("Podcast Host", ["podcast", "podcaster", "host", "show"], [
        ["Host Fee (branded show)", "per episode", 300, 5],
        ["Sponsored Read (CPM)", "per 1,000 downloads", 18],
        ["Guest Appearance", "per appearance", 100, 2],
        ["Show Retainer", "per month", 1200, 20],
      ]),
      role("Community Manager", ["community", "discord", "moderator", "moderation", "forum"], [
        ["Monthly Retainer", "per month", 1000, 25],
        ["Moderation / Support", "per hour", 25],
        ["Launch Community Setup", "per project", 500, 10],
      ]),
      role("Brand Ambassador", ["ambassador", "affiliate", "promoter", "brand deal"], [
        ["Monthly Ambassador Fee", "per month", 500, 8],
        ["Event Appearance", "per event", 300, 4],
        ["Multi-Post Campaign", "per campaign", 1200, 15],
      ]),
    ],
  },

  "Design And UX": {
    roles: [
      role("UI / UX Designer", ["ui", "ux", "user experience", "interface", "figma", "product design", "app design"], [
        ["Hourly Rate", "per hour", 60],
        ["Design Sprint (1 week)", "per sprint", 3000, 40],
        ["Wireframes & Clickable Prototype", "per project", 2500, 40],
        ["UX Audit", "per audit", 800, 12],
        ["Monthly Retainer", "per month", 4000, 70],
      ]),
      role("Product Designer", ["product", "industrial design", "prototype", "cad", "physical product"], [
        ["Hourly Rate", "per hour", 65],
        ["Day Rate", "per day", 520],
        ["Feature Design", "per project", 3000, 45],
        ["Concept Sketches (set of 5)", "per set", 500, 8],
      ]),
      role("Web Designer", ["website", "web", "wix", "squarespace", "webflow", "landing page", "wordpress"], [
        ["Hourly Rate", "per hour", 50],
        ["Landing Page", "per page", 600, 10],
        ["Website (5-10 pages)", "per project", 3000, 50],
        ["Template Customisation", "per project", 800, 14],
        ["Monthly Care Plan", "per month", 150, 3],
      ]),
      role("Brand Identity Designer", ["logo", "branding", "brand", "identity", "visual identity"], [
        ["Logo Package", "per project", 800, 14],
        ["Full Brand Identity", "per project", 3500, 50],
        ["Brand Guidelines", "per project", 1200, 20],
        ["Hourly Rate", "per hour", 60],
        ["Retainer", "per month", 1500, 25],
      ]),
      role("Packaging Designer", ["packaging", "label", "dieline", "box design", "product packaging"], [
        ["Packaging Concept", "per project", 1500, 24],
        ["Per SKU Variation", "per SKU", 250, 4],
        ["Dieline & Print-Ready Files", "per project", 600, 10],
        ["Hourly Rate", "per hour", 60],
      ]),
      role("Presentation / Pitch Deck Designer", ["deck", "slides", "powerpoint", "keynote", "presentation", "pitch"], [
        ["Per Slide", "per slide", 40, 0.75],
        ["Pitch Deck (15-20 slides)", "per deck", 1200, 20],
        ["Template System", "per project", 1800, 30],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Lettering / Type Designer", ["lettering", "typography", "font", "type", "hand lettering"], [
        ["Custom Lettering (logo)", "per piece", 400, 8],
        ["Font Family (custom)", "per project", 5000, 100],
        ["Hourly Rate", "per hour", 50],
        ["Font Licence", "per licence", 100],
      ]),
    ],
  },

  "Games And 3D": {
    roles: [
      role("3D Artist / Modeler", ["3d", "blender", "modeling", "maya", "zbrush", "render", "cgi"], [
        ["Hourly Rate", "per hour", 55],
        ["Game-Ready Hero Asset", "per asset", 400, 8],
        ["Environment Prop", "per prop", 150, 3],
        ["Product Render Set (3 views)", "per set", 450, 8],
        ["Character Model", "per character", 1500, 30],
      ]),
      role("Game Artist (2D / Pixel)", ["pixel art", "sprite", "game art", "2d", "tileset"], [
        ["Character Sprite Sheet", "per character", 300, 6],
        ["Tileset", "per tileset", 400, 8],
        ["UI Kit", "per project", 1200, 24],
        ["Hourly Rate", "per hour", 45],
        ["Key Art / Store Capsule", "per piece", 400, 8],
      ]),
      role("Level Designer", ["level", "map", "unity", "unreal", "game designer", "blockout"], [
        ["Level (blockout + polish)", "per level", 800, 16],
        ["Hourly Rate", "per hour", 55],
        ["Monthly Contract", "per month", 3500, 100],
      ]),
      role("Game Audio / Sound Designer", ["game audio", "sfx", "sound effects", "wwise", "fmod", "sound"], [
        ["SFX Pack", "per pack", 500, 10],
        ["Single Sound Effect", "per sound", 25, 0.5],
        ["Music Loop", "per track", 200, 4],
        ["Hourly Rate", "per hour", 55],
        ["Audio Implementation", "per day", 450],
      ]),
      role("Technical Artist", ["tech art", "shader", "vfx", "rigging", "pipeline"], [
        ["Day Rate", "per day", 500],
        ["Shader / VFX Effect", "per effect", 300, 6],
        ["Hourly Rate", "per hour", 65],
      ]),
      role("AR / VR Developer", ["ar", "vr", "xr", "augmented reality", "virtual reality", "unity", "snapchat lens", "filter"], [
        ["Hourly Rate", "per hour", 75],
        ["AR Filter / Lens", "per filter", 600, 10],
        ["Prototype", "per project", 6000, 80],
        ["Monthly Contract", "per month", 6000, 100],
      ]),
    ],
  },

  "Audio And Voice": {
    roles: [
      role("Audiobook Narrator", ["audiobook", "narrator", "acx", "reading", "voice"], [
        ["Per Finished Hour", "per finished hour", 200, 6],
        ["Multi-Character Narration", "per finished hour", 300, 8],
        ["Royalty Share (ACX)", "% of royalties", 20],
        ["Proofing / Retakes", "per hour", 45],
      ]),
      role("Podcast Editor", ["podcast", "audio editor", "editing", "episode"], [
        ["Edit per Episode (30-60 min)", "per episode", 90, 2],
        ["Full Production (edit, mix, show notes)", "per episode", 180, 4],
        ["Monthly Retainer (4 episodes)", "per month", 480, 8],
        ["Hourly Rate", "per hour", 40],
      ]),
      role("Sound Designer / Foley", ["foley", "sound design", "post audio", "sfx", "film sound"], [
        ["Per Minute of Picture", "per minute", 120, 3],
        ["Day Rate", "per day", 400],
        ["Hourly Rate", "per hour", 55],
        ["Project Flat Fee", "per project", 2500, 40],
      ]),
      role("Audio Branding / Jingle Writer", ["jingle", "sonic logo", "audio logo", "branding", "commercial music"], [
        ["Sonic Logo", "per project", 1500, 20],
        ["Jingle (30-60 sec)", "per jingle", 800, 12],
        ["Podcast Intro / Outro", "per package", 300, 5],
      ]),
      role("Transcription & Captioning", ["transcription", "captions", "subtitles", "srt", "transcriber"], [
        ["Transcription", "per minute of audio", 1.5, 0.07],
        ["Captions (SRT file)", "per minute of video", 2.5, 0.1],
        ["Subtitle Translation", "per minute of video", 6, 0.2],
        ["Hourly Rate", "per hour", 25],
      ]),
    ],
  },

  "Writing And Publishing": {
    roles: [
      role("Copywriter", ["copy", "marketing copy", "ads", "sales page", "email", "content writer"], [
        ["Hourly Rate", "per hour", 55],
        ["Landing Page Copy", "per page", 500, 8],
        ["Email Sequence (5 emails)", "per sequence", 750, 12],
        ["Brand Voice Guide", "per project", 1500, 24],
        ["Monthly Retainer", "per month", 2500, 40],
      ]),
      role("Editor / Proofreader", ["edit", "proofread", "copy edit", "manuscript", "line edit"], [
        ["Proofreading", "per word", 0.03, 0.0008],
        ["Copyediting", "per word", 0.045, 0.0011],
        ["Developmental Edit", "per word", 0.07, 0.0016],
        ["Hourly Rate", "per hour", 45],
      ]),
      role("Translator / Interpreter", ["translation", "translator", "interpreter", "language", "bilingual", "localization"], [
        ["Translation", "per word", 0.12, 0.004],
        ["Hourly Interpreting", "per hour", 60],
        ["Conference Day Rate", "per day", 600],
        ["Certified Document", "per page", 40, 0.75],
      ]),
      role("Technical Writer", ["documentation", "docs", "api docs", "manuals", "knowledge base"], [
        ["Hourly Rate", "per hour", 60],
        ["Per Page", "per page", 90, 1.5],
        ["Documentation Project", "per project", 4000, 60],
        ["Monthly Retainer", "per month", 3000, 45],
      ]),
      role("Ghostwriter", ["ghost", "memoir", "book", "thought leadership", "ghostwriting"], [
        ["Per Word", "per word", 0.25, 0.005],
        ["Book (50-60k words)", "per project", 12000, 250],
        ["Article / Thought Leadership", "per article", 500, 6],
        ["Hourly Rate", "per hour", 70],
      ]),
      role("Author / Book", ["author", "novelist", "book", "writer", "advance", "royalties", "publishing"], [
        ["Advance (trade book)", "per book", 10000, 500],
        ["Royalty Rate", "% of sales", 10],
        ["Speaking Fee", "per event", 1500, 6],
        ["Workshop / Class", "per session", 300, 4],
      ]),
      role("Grant Writer", ["grants", "nonprofit", "funding", "proposal", "fundraising"], [
        ["Per Proposal", "per proposal", 1500, 20],
        ["Hourly Rate", "per hour", 65],
        ["Monthly Retainer", "per month", 2000, 30],
      ]),
      role("Speechwriter", ["speech", "talk", "keynote writer", "executive", "remarks"], [
        ["Per Speech (5-10 min)", "per speech", 800, 8],
        ["Executive Package", "per project", 3000, 30],
        ["Hourly Rate", "per hour", 90],
      ]),
    ],
  },

  "Makers And Crafts": {
    roles: [
      role("Ceramicist / Potter", ["ceramics", "pottery", "clay", "potter", "mugs", "kiln"], [
        ["Commissioned Piece", "per piece", 120, 4],
        ["Dinnerware Set (4 place settings)", "per set", 400, 16],
        ["Wholesale Piece", "per piece", 35, 1.5],
        ["Workshop / Class", "per person", 60],
        ["Studio Hourly (custom work)", "per hour", 40],
      ], [["Clay (25 lb bag)", 35], ["Glaze (pint)", 25], ["Kiln firing (per load share)", 20]]),
      role("Jeweler", ["jewelry", "jeweller", "rings", "silversmith", "goldsmith", "necklace"], [
        ["Custom Piece (silver)", "per piece", 250, 6],
        ["Custom Piece (gold)", "per piece", 900, 10],
        ["Repair / Resize", "per job", 60, 1],
        ["Wedding Band", "per pair", 700, 10],
        ["Hourly Bench Rate", "per hour", 60],
      ], [["Sterling silver (sheet or wire)", 45], ["Gemstone (each)", 40]]),
      role("Woodworker / Furniture Maker", ["woodworking", "carpenter", "furniture", "cabinet", "joinery", "custom furniture"], [
        ["Small Custom Piece", "per piece", 600, 16],
        ["Large Commission", "per piece", 2500, 60],
        ["Hourly Shop Rate", "per hour", 60],
        ["Install Day", "per day", 400],
      ], [["Hardwood (board foot)", 9], ["Finish / oil (quart)", 28]]),
      role("Textile / Fiber Artist", ["knit", "crochet", "weaving", "quilting", "fiber", "textile", "sewing", "embroidery"], [
        ["Knit / Crochet Piece", "per piece", 120, 5],
        ["Woven Wall Hanging", "per piece", 300, 10],
        ["Custom Quilt", "per piece", 600, 25],
        ["Workshop", "per person", 45],
        ["Hourly Rate", "per hour", 30],
      ], [["Yarn (skein)", 12], ["Fabric (yard)", 14]]),
      role("Leatherworker", ["leather", "wallets", "bags", "belts", "saddlery"], [
        ["Small Goods (wallet, cardholder)", "per piece", 120, 3],
        ["Custom Bag", "per piece", 450, 12],
        ["Repair", "per job", 50, 1],
        ["Hourly Rate", "per hour", 40],
      ], [["Leather (sq ft)", 9], ["Hardware set", 12]]),
      role("Printmaker / Screen Printer", ["screen printing", "prints", "merch", "silkscreen", "linocut", "risograph", "t-shirts"], [
        ["Print Edition", "per print", 45, 1],
        ["Custom Merch Run", "per item", 9, 0.1],
        ["Screen Setup", "per screen", 25, 0.5],
        ["Studio Hourly", "per hour", 45],
      ], [["Ink (quart)", 30], ["Screen and emulsion", 25]]),
      role("Candle & Soap Maker", ["candles", "soap", "bath", "wholesale", "skincare", "favors"], [
        ["Wholesale Candle", "per piece", 9, 0.3],
        ["Custom Batch (12)", "per batch", 120, 3],
        ["Event Favors", "per piece", 4, 0.15],
        ["Workshop", "per person", 55],
      ], [["Soy wax (lb)", 6], ["Fragrance oil (oz)", 3], ["Jar with lid (each)", 2]]),
      role("Glass Artist", ["glass", "stained glass", "glassblowing", "fused glass"], [
        ["Commissioned Piece", "per piece", 250, 6],
        ["Stained Glass Panel", "per sq ft", 120, 3],
        ["Class", "per person", 85],
        ["Hourly Rate", "per hour", 55],
      ]),
    ],
  },

  "Body Art And Beauty": {
    roles: [
      role("Tattoo Artist", ["tattoo", "ink", "tattooist", "flash", "body art"], [
        ["Shop Minimum", "per tattoo", 100, 1],
        ["Hourly Rate", "per hour", 150],
        ["Half Day (4 hours)", "per session", 550, 4],
        ["Full Day", "per day", 1000, 7],
        ["Custom Flash Design", "per design", 60, 1.5],
      ], [["Cartridge needle", 4], ["Aftercare kit", 8]]),
      role("Piercer", ["piercing", "body piercing", "jewelry", "ear piercing"], [
        ["Piercing Service", "per piercing", 50, 0.5],
        ["Jewelry", "per piece", 45],
        ["Party / Event", "per hour", 90],
      ]),
      role("Henna Artist", ["henna", "mehndi", "bridal henna"], [
        ["Bridal Henna", "per event", 250, 4],
        ["Party Henna", "per hour", 85],
        ["Single Design", "per design", 20, 0.3],
        ["Workshop", "per person", 40],
      ]),
      role("Lash / Brow Artist", ["lashes", "lash extensions", "brows", "microblading", "lamination"], [
        ["Classic Lash Set", "per set", 120, 2],
        ["Volume Lash Set", "per set", 170, 2.5],
        ["Lash Fill", "per fill", 70, 1],
        ["Brow Lamination", "per service", 80, 1],
      ]),
    ],
  },

  "Architecture And Interiors": {
    roles: [
      role("Interior Designer", ["interior design", "decorator", "decorating", "home", "room design", "e-design"], [
        ["Design Consultation", "per hour", 100],
        ["Room Design Package", "per room", 1200, 20],
        ["Full Service Design", "per hour", 125],
        ["E-Design Mood Board", "per room", 350, 6],
        ["Percent of Project Cost", "% of project cost", 15],
      ]),
      role("Home Stager", ["staging", "real estate", "stager", "home staging"], [
        ["Consultation", "per consult", 200, 2],
        ["Staging (per room)", "per room", 400, 8],
        ["Full Home Staging", "per project", 2500, 40],
        ["Furniture Rental", "per month", 800],
      ]),
      role("Landscape Designer", ["garden", "landscape", "yard", "plants", "outdoor design"], [
        ["Garden Concept Plan", "per plan", 900, 12],
        ["Hourly Rate", "per hour", 75],
        ["Full Landscape Plan", "per project", 3500, 45],
        ["Site Visit", "per visit", 150, 2],
      ]),
      role("Architectural Visualizer", ["render", "rendering", "archviz", "3d visualization", "walkthrough"], [
        ["Interior Render", "per image", 250, 5],
        ["Exterior Render", "per image", 400, 8],
        ["Walkthrough Animation", "per minute", 1500, 30],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Architect / Drafter", ["architect", "drafting", "cad", "blueprints", "plans", "permit drawings"], [
        ["Hourly Drafting", "per hour", 55],
        ["Hourly (Licensed Architect)", "per hour", 140],
        ["Permit Drawings", "per project", 2500, 40],
        ["Percent of Construction Cost", "% of project cost", 8],
      ]),
    ],
  },

  "Weddings And Events Design": {
    roles: [
      role("Wedding Planner", ["wedding", "planner", "coordinator", "day-of coordinator", "event planner"], [
        ["Full Planning", "per wedding", 4500, 120],
        ["Partial Planning", "per wedding", 2500, 60],
        ["Month-Of Coordination", "per wedding", 1200, 25],
        ["Day-Of Coordinator", "per hour", 60],
        ["Percent of Budget", "% of budget", 15],
      ]),
      role("Florist / Floral Designer", ["flowers", "floral", "bouquet", "florist", "arrangements"], [
        ["Bridal Bouquet", "per bouquet", 150, 2],
        ["Centerpiece", "per piece", 65, 1],
        ["Ceremony Arch", "per piece", 450, 6],
        ["Full Event Florals", "per event", 2500, 30],
        ["Delivery & Setup", "per event", 150, 3],
      ], [["Stems (bunch)", 12], ["Wire, tape and foam kit", 15]]),
      role("Event Decor Stylist", ["event styling", "decor", "rentals", "backdrop", "tablescape"], [
        ["Day Rate", "per day", 500],
        ["Table Setting", "per table", 45, 0.75],
        ["Full Event Styling", "per event", 2000, 25],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Calligrapher", ["calligraphy", "envelopes", "invitations", "place cards", "hand lettering"], [
        ["Envelope Addressing", "per envelope", 4, 0.1],
        ["Place Cards", "per card", 2.5, 0.07],
        ["Custom Signage", "per piece", 120, 2],
        ["Invitation Suite Design", "per suite", 900, 16],
        ["Hourly Rate", "per hour", 50],
      ]),
      role("Wedding Officiant", ["officiant", "celebrant", "ceremony", "elopement", "vows"], [
        ["Basic Ceremony", "per ceremony", 350, 5],
        ["Custom Ceremony + Rehearsal", "per ceremony", 700, 10],
        ["Elopement", "per ceremony", 250, 3],
      ]),
    ],
  },

  "Photo And Video Services": {
    roles: [
      role("Wedding Photographer", ["wedding", "engagement", "elopement", "photographer", "bridal"], [
        ["Elopement / Micro (2-3 hrs)", "per event", 1200, 8],
        ["Half Day (4 hours)", "per event", 2000, 14],
        ["Full Day (8 hours)", "per event", 3500, 22],
        ["Second Shooter", "per day", 400],
        ["Album", "per album", 450, 4],
        ["Engagement Session", "per session", 450, 5],
      ]),
      role("Real Estate Photographer", ["real estate", "property", "listing", "mls", "interiors", "airbnb"], [
        ["Per Listing (up to 25 photos)", "per listing", 175, 2.5],
        ["Listing + Video", "per listing", 350, 5],
        ["Twilight Add-on", "per listing", 100, 1],
        ["Drone Add-on", "per listing", 75, 1],
      ]),
      role("Product Photographer", ["product", "ecommerce", "amazon", "white background", "still life", "catalog"], [
        ["White Background Image", "per image", 35, 0.5],
        ["Lifestyle Image", "per image", 120, 1.5],
        ["Studio Day Rate", "per day", 900],
        ["Hourly Rate", "per hour", 75],
      ]),
      role("Drone Pilot", ["drone", "aerial", "part 107", "uav", "aerial photography"], [
        ["Hourly Rate", "per hour", 120],
        ["Half Day", "per session", 450, 4],
        ["Real Estate / Inspection Flight", "per job", 250, 2.5],
        ["Cinematic Shoot Day", "per day", 1100],
      ]),
      role("Photo Retoucher", ["retouching", "photoshop", "editing", "restoration", "lightroom"], [
        ["Basic Retouch", "per image", 8, 0.15],
        ["Beauty / High-End Retouch", "per image", 45, 0.75],
        ["Batch Editing", "per image", 1.5, 0.03],
        ["Photo Restoration", "per image", 60, 1],
        ["Hourly Rate", "per hour", 50],
      ]),
      role("Video Editor (YouTube / Social)", ["video editing", "premiere", "final cut", "davinci", "editor", "youtube editor"], [
        ["Short-Form Video", "per video", 60, 1.5],
        ["YouTube Video (8-12 min)", "per video", 250, 6],
        ["Monthly Package (8 videos)", "per month", 1600, 40],
        ["Podcast Clips", "per clip", 25, 0.5],
        ["Hourly Rate", "per hour", 45],
      ]),
    ],
  },

  "Graphic Design And Visual Communication": {
    roles: [
      role("Logo Designer", ["logo", "logomark", "wordmark", "brand mark", "logo design", "monogram", "emblem"], [
        ["Logo Starter (1-2 concepts)", "per logo", 350, 6],
        ["Logo Package (3 concepts, revisions, files)", "per logo", 900, 14],
        ["Logo + Mini Brand Guide", "per project", 2200, 32],
        ["Logo Refresh / Redesign", "per project", 600, 10],
        ["Hourly Rate", "per hour", 65],
      ]),
      role("Brand Guidelines / Visual Identity Designer", ["brand guidelines", "style guide", "brand book", "visual identity", "brand system", "brand standards", "rebrand"], [
        ["Brand Guidelines (10-20 pages)", "per project", 2800, 40],
        ["Full Visual Identity System", "per project", 6500, 90],
        ["Brand Toolkit (templates + assets)", "per project", 1800, 28],
        ["Hourly Rate", "per hour", 75],
      ]),
      role("Art Director", ["art director", "art direction", "creative lead", "campaign visuals", "shoot direction", "visual direction"], [
        ["Day Rate", "per day", 800],
        ["Hourly Rate", "per hour", 100],
        ["Campaign Art Direction", "per project", 5000, 50],
        ["Photo / Video Shoot Direction", "per day", 1000],
        ["Monthly Retainer", "per month", 4000, 40],
      ]),
      role("Creative Director (Freelance)", ["creative director", "cd", "concept lead", "campaign concept", "creative lead", "head of creative"], [
        ["Day Rate", "per day", 1200],
        ["Hourly Rate", "per hour", 150],
        ["Campaign Concept & Direction", "per project", 8000, 60],
        ["Creative Strategy Sprint (1 week)", "per week", 5000],
        ["Monthly Retainer", "per month", 6000, 40],
      ]),
      role("Editorial / Layout Designer", ["layout", "magazine", "editorial", "indesign", "annual report", "book interior", "newsletter", "report design", "publication"], [
        ["Per Page (editorial layout)", "per page", 55, 1],
        ["Magazine / Report Spread", "per spread", 110, 2],
        ["Annual / Corporate Report (24 pages)", "per project", 3200, 50],
        ["Book Interior (text only)", "per book", 700, 12],
        ["Hourly Rate", "per hour", 60],
      ]),
      role("Book Cover Designer", ["book cover", "cover design", "ebook", "kindle", "paperback", "jacket", "author", "self publishing"], [
        ["eBook Cover", "per cover", 350, 6],
        ["Print Wrap (front, spine, back)", "per cover", 650, 10],
        ["Series Cover Package (3 books)", "per series", 1500, 24],
        ["Pre-Made Cover (customised)", "per cover", 140, 2],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Social Media Graphic Designer", ["social graphics", "instagram", "carousel", "templates", "canva", "social media design", "stories", "social posts"], [
        ["Single Post / Story", "per graphic", 40, 0.75],
        ["Carousel (5-8 slides)", "per carousel", 160, 3],
        ["Template Pack (10 editable templates)", "per pack", 450, 8],
        ["Monthly Content Package (12 graphics)", "per month", 500, 9],
        ["Hourly Rate", "per hour", 50],
      ]),
      role("Thumbnail & Channel Art Designer", ["youtube thumbnail", "thumbnail", "channel art", "banner", "overlay", "stream overlay", "twitch", "end screen"], [
        ["Single Thumbnail", "per thumbnail", 40, 0.75],
        ["Thumbnail Bundle (8 a month)", "per month", 280, 6],
        ["Channel Art Kit (banner, avatar, end screens)", "per kit", 220, 4],
        ["Stream Overlay Package", "per package", 350, 6],
      ]),
      role("Poster / Flyer / Event Designer", ["poster", "flyer", "gig poster", "event graphics", "concert", "festival", "handbill", "key art"], [
        ["Poster", "per poster", 180, 3, { sizes: POSTER_DESIGN_SIZES }],
        ["Flyer (front and back)", "per flyer", 110, 2, { sizes: FLYER_DESIGN_SIZES }],
        ["Event Graphics Pack (poster, social, signage)", "per event", 600, 10],
        ["Festival / Series Key Art", "per project", 1400, 22],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Infographic / Information Designer", ["infographic", "infographics", "charts", "visualization", "report graphics", "information design", "diagram", "explainer graphic"], [
        ["Single Infographic", "per infographic", 500, 8],
        ["Chart / Data Visual Set (5 visuals)", "per set", 650, 10],
        ["Interactive / Animated Infographic", "per project", 2200, 32],
        ["Report Visual System", "per project", 3000, 45],
        ["Hourly Rate", "per hour", 70],
      ]),
      role("Digital Ad / Banner Designer", ["banner ads", "display ads", "ad creative", "google ads", "social ads", "ad sizes", "web banners", "creative for ads"], [
        ["Static Ad Set (5 sizes)", "per set", 320, 5],
        ["Animated Banner Set (5 sizes)", "per set", 750, 12],
        ["Social Ad Creative Pack (6 variations)", "per pack", 420, 7],
        ["Monthly Ad Creative Retainer", "per month", 1800, 30],
        ["Hourly Rate", "per hour", 60],
      ]),
      role("Signage / Wayfinding Designer", ["signage", "wayfinding", "environmental graphics", "window graphics", "vehicle wrap", "storefront", "billboard", "outdoor"], [
        ["Sign Design (single)", "per sign", 250, 4],
        ["Wayfinding System (building)", "per project", 6000, 80],
        ["Vehicle Wrap Design", "per vehicle", 650, 10],
        ["Storefront / Window Graphics", "per project", 900, 14],
        ["Hourly Rate", "per hour", 80],
      ]),
      role("Exhibit / Trade Show Designer", ["exhibit", "trade show", "booth", "display", "pop up", "retail display", "museum", "expo"], [
        ["Booth Graphics (10x10)", "per booth", 900, 14],
        ["Booth Concept & Layout", "per project", 2500, 36],
        ["Retail Display / Pop-up Design", "per project", 1800, 26],
        ["Hourly Rate", "per hour", 80],
      ]),
      role("Brand Motion Designer (Logo Animation / Social)", ["logo animation", "motion graphics", "animated logo", "lottie", "reels", "bumper", "ident", "after effects"], [
        ["Logo Animation", "per animation", 400, 6],
        ["Animated Social Post (10-15 sec)", "per post", 180, 3],
        ["Explainer Motion (60 sec)", "per video", 2400, 36],
        ["Title / Lower-Third Package", "per package", 500, 8],
        ["Hourly Rate", "per hour", 80],
      ]),
      role("Icon / Sticker / Merch Designer", ["icons", "icon set", "sticker", "stickers", "merch", "t-shirt", "apparel graphics", "enamel pin", "patch"], [
        ["Custom Icon Set (12 icons)", "per set", 650, 10],
        ["Sticker Sheet / Pack (6 designs)", "per pack", 500, 8],
        ["T-Shirt / Apparel Graphic", "per design", 160, 3],
        ["Merch Collection (5 designs)", "per collection", 700, 12],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Pattern / Surface Designer", ["pattern", "surface design", "repeat", "textile print", "wallpaper", "wrapping paper", "seamless", "licensing"], [
        ["Seamless Pattern", "per pattern", 250, 5],
        ["Pattern Collection (6 patterns)", "per collection", 1200, 24],
        ["Custom Print for a Brand", "per project", 1800, 30],
        ["Licensing Royalty", "% of sales", 6],
        ["Hourly Rate", "per hour", 60],
      ]),
      role("Stationery / Greeting Card Designer", ["invitation", "stationery", "greeting card", "wedding invitation", "save the date", "card design", "paper goods", "announcement"], [
        ["Invitation Suite (invite, RSVP, details)", "per suite", 550, 9],
        ["Greeting Card Design", "per card", 220, 4],
        ["Custom Stationery Set", "per set", 450, 8],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Menu / Restaurant Graphics Designer", ["menu", "restaurant branding", "food packaging", "menu board", "cafe", "bar menu", "table tent"], [
        ["Menu Design", "per menu", 350, 6],
        ["Menu + Mini Brand Kit", "per project", 1800, 28],
        ["Seasonal Menu Update", "per update", 120, 2],
        ["Hourly Rate", "per hour", 55],
      ]),
      role("Mascot / Character Designer", ["mascot", "character design", "brand character", "cartoon", "sports mascot", "character sheet"], [
        ["Mascot Design (concepts + final)", "per mascot", 900, 16],
        ["Character Sheet (poses + expressions)", "per character", 600, 10],
        ["Mascot Pose Pack (6 poses)", "per pack", 450, 8],
        ["Hourly Rate", "per hour", 60],
      ]),
      role("Print Production / Prepress Artist", ["prepress", "print ready", "preflight", "color separation", "die line", "production artist", "mechanicals", "print production"], [
        ["Print-Ready File Prep", "per file", 60, 1],
        ["Packaging / Label Production Artwork", "per SKU", 90, 1.5],
        ["Press Check / Proofing Day", "per day", 450],
        ["Hourly Rate", "per hour", 55],
      ]),
    ],
  },

  "Print Services": {
    roles: [
      role("Flyer Printing", ["flyer", "flyers", "print run", "leaflet", "handout", "print shop", "digital print", "offset", "brochure", "printing"], [
        ["Digital Print Run (single-sided)", "per flyer", 0.45, null, { sizes: FLYER_PRINT_SIZES, qty: 250 }],
        ["Double-Sided Print Run", "per flyer", 0.7, null, { sizes: FLYER_PRINT_SIZES, qty: 250 }],
        ["Offset Print Run (1,000+)", "per flyer", 0.12, null, { sizes: FLYER_PRINT_SIZES, qty: 1000 }],
        ["Print Setup & Proofing", "per job", 40],
      ]),
      role("Poster Printing (Large Format)", ["poster", "posters", "poster print", "large format", "plotter", "print shop", "banner", "foam board", "lamination", "printing"], [
        ["Poster Print (satin / matte)", "per poster", 18, null, { sizes: POSTER_PRINT_SIZES, qty: 5 }],
        ["Laminated / Mounted Poster", "per poster", 34, null, { sizes: POSTER_PRINT_SIZES, qty: 5 }],
        ["Rush Print (same day)", "per poster", 30, null, { sizes: POSTER_PRINT_SIZES, qty: 3 }],
        ["Print Setup & Colour Proof", "per job", 35],
      ]),
      role("Art Print / Poster Print Seller", ["art print", "poster print", "prints", "giclee", "fine art print", "limited edition", "print sales", "wall art", "editions", "framed print"], [
        ["Open Edition Print", "per print", 35, null, { sizes: POSTER_PRINT_SIZES, qty: 10 }],
        ["Signed Limited Edition Print", "per print", 85, null, { sizes: POSTER_PRINT_SIZES, qty: 10 }],
        ["Framed Print", "per print", 140, null, { sizes: POSTER_PRINT_SIZES, qty: 2 }],
        ["Print Set (3 prints)", "per set", 90, null, { sizes: POSTER_PRINT_SIZES, qty: 5 }],
      ]),
      role("Flyer & Poster Distribution", ["distribution", "flyering", "street team", "handing out", "door to door", "poster posting", "wheatpasting", "promo team", "leafleting"], [
        ["Hand-Out Shift (4 hours)", "per 4-hr shift", 120, 4],
        ["Poster Posting Route (up to 50 sites)", "per route", 180, 5],
        ["Door-to-Door Drop (1,000 flyers)", "per 1,000 flyers", 220, 10, { qty: 1 }],
        ["Hourly Rate", "per hour", 22],
      ]),
    ],
  },

  "Marketing And Advertising": {
    roles: [
      role("Marketing Strategist / Consultant", ["marketing", "strategy", "consultant", "go to market", "gtm", "marketing plan", "advisor"], [
        ["Hourly Rate", "per hour", 110],
        ["Marketing Audit", "per audit", 1800, 16],
        ["Marketing Plan (90 days)", "per project", 3500, 30],
        ["Strategy Workshop (half day)", "per workshop", 1500, 8],
        ["Monthly Advisory Retainer", "per month", 3000, 20],
      ]),
      role("Fractional CMO", ["cmo", "chief marketing officer", "fractional", "head of marketing", "marketing lead", "interim"], [
        ["Monthly Retainer (part time)", "per month", 6000, 40],
        ["Day Rate", "per day", 1200],
        ["Hourly Rate", "per hour", 175],
      ]),
      role("Brand Strategist", ["brand strategy", "positioning", "messaging", "brand platform", "naming", "tone of voice"], [
        ["Brand Strategy Project", "per project", 5000, 60],
        ["Positioning Workshop", "per workshop", 1800, 10],
        ["Messaging Framework", "per project", 2200, 24],
        ["Hourly Rate", "per hour", 100],
      ]),
      role("SEO Specialist", ["seo", "search engine", "keywords", "organic traffic", "backlinks", "technical seo", "google ranking"], [
        ["Hourly Rate", "per hour", 85],
        ["SEO Audit", "per audit", 1200, 15],
        ["Keyword Research & Plan", "per project", 600, 8],
        ["Monthly SEO Retainer", "per month", 1500, 15],
        ["On-Page Optimisation", "per page", 120, 1.5],
      ]),
      role("Paid Ads Manager (PPC / Paid Social)", ["ppc", "google ads", "facebook ads", "meta ads", "paid social", "ad spend", "paid media", "tiktok ads", "advertising"], [
        ["Management Fee (share of ad spend)", "% of ad spend", 12],
        ["Monthly Management Fee", "per month", 1500, 15],
        ["Ad Account Setup", "per project", 800, 10],
        ["Ad Creative Set (3 variations)", "per set", 250, 3],
        ["Hourly Rate", "per hour", 85],
      ]),
      role("Email Marketing Specialist", ["email", "newsletter", "klaviyo", "mailchimp", "flows", "drip", "email campaign", "lifecycle"], [
        ["Single Email / Newsletter", "per email", 150, 2],
        ["Welcome Flow (5 emails)", "per flow", 900, 12],
        ["Monthly Retainer (4 sends)", "per month", 1200, 14],
        ["List & Deliverability Audit", "per audit", 600, 6],
        ["Hourly Rate", "per hour", 70],
      ]),
      role("Content Marketing Strategist", ["content marketing", "content strategy", "blog", "content calendar", "editorial", "thought leadership", "inbound"], [
        ["Content Strategy & Calendar", "per project", 2200, 24],
        ["Blog Post (1,000 words)", "per post", 350, 4],
        ["Monthly Content Retainer", "per month", 2500, 30],
        ["Hourly Rate", "per hour", 75],
      ]),
      role("Influencer Marketing Manager", ["influencer", "creator partnerships", "ugc campaign", "sponsorships", "creator outreach", "brand deals"], [
        ["Campaign Management", "per campaign", 1500, 20],
        ["Creator Sourcing & Outreach", "per creator", 150, 2],
        ["Monthly Retainer", "per month", 2500, 30],
        ["Management Fee (share of creator budget)", "% of campaign budget", 15],
      ]),
      role("PR Specialist / Publicist", ["pr", "public relations", "publicist", "press release", "media relations", "press", "journalists"], [
        ["Monthly PR Retainer", "per month", 3000, 30],
        ["Press Release (write and distribute)", "per release", 450, 4],
        ["Media Pitch Campaign", "per campaign", 2000, 25],
        ["Hourly Rate", "per hour", 90],
      ]),
      role("Growth Marketer / CRO Specialist", ["growth", "conversion", "cro", "a/b test", "funnel", "landing page optimisation", "experiments", "growth hacking"], [
        ["Hourly Rate", "per hour", 100],
        ["A/B Test (design, run, report)", "per test", 700, 8],
        ["Conversion Audit", "per audit", 1800, 20],
        ["Monthly Growth Retainer", "per month", 3500, 35],
      ]),
      role("Marketing Analyst", ["analytics", "ga4", "reporting", "dashboard", "attribution", "data", "tracking", "looker"], [
        ["Analytics & Tracking Setup", "per project", 1500, 20],
        ["Monthly Performance Report", "per report", 600, 6],
        ["Dashboard Build", "per dashboard", 1200, 14],
        ["Hourly Rate", "per hour", 80],
      ]),
      role("Marketing Automation / CRM Specialist", ["automation", "crm", "hubspot", "salesforce", "zapier", "lead nurturing", "marketing ops", "workflows"], [
        ["Platform Setup & Migration", "per project", 2500, 30],
        ["Workflow Build", "per workflow", 400, 5],
        ["Monthly Management", "per month", 1500, 16],
        ["Hourly Rate", "per hour", 95],
      ]),
      role("Product Marketing / Launch Manager", ["product marketing", "launch", "product launch", "positioning", "go to market", "pmm", "release"], [
        ["Launch Plan & Execution", "per launch", 3500, 35],
        ["Messaging & Positioning", "per project", 2000, 20],
        ["Monthly Retainer", "per month", 4000, 40],
        ["Hourly Rate", "per hour", 100],
      ]),
      role("Affiliate / Partnerships Manager", ["affiliate", "partnerships", "partner program", "referral", "commission", "reseller"], [
        ["Commission (share of sales)", "% of sales", 10],
        ["Program Setup", "per project", 2000, 25],
        ["Monthly Management Fee", "per month", 2000, 20],
        ["Hourly Rate", "per hour", 80],
      ]),
      role("Media Buyer / Planner", ["media buyer", "media planner", "media buying", "ad buying", "programmatic", "ad placement", "media plan", "tv radio"], [
        ["Media Buying Fee", "% of ad spend", 12],
        ["Media Plan", "per plan", 1200, 14],
        ["Monthly Retainer", "per month", 2000, 24],
        ["Hourly Rate", "per hour", 85],
      ]),
      role("Advertising Copywriter / Creative Concept", ["ad copy", "advertising copywriter", "tagline", "slogan", "ad concept", "script", "headline", "billboard copy", "campaign idea"], [
        ["Campaign Concept & Taglines", "per campaign", 1200, 14],
        ["Ad Script (30-60 sec)", "per script", 450, 5],
        ["Headline / Slogan Set (10 options)", "per set", 300, 4],
        ["Outdoor / Print Ad Copy", "per ad", 250, 3],
        ["Hourly Rate", "per hour", 85],
      ]),
      role("Direct Response / Funnel Copywriter", ["direct response", "sales page", "funnel", "launch emails", "vsl", "sales letter", "conversion copy", "landing page copy"], [
        ["Sales Page", "per page", 1800, 20],
        ["Email Launch Sequence (7 emails)", "per sequence", 2500, 28],
        ["Video Sales Letter Script", "per script", 2000, 22],
        ["Performance Bonus", "% of sales", 5],
        ["Hourly Rate", "per hour", 95],
      ]),
      role("Brand Naming / Verbal Identity Writer", ["naming", "brand name", "name generation", "tagline", "brand voice", "messaging", "verbal identity", "tone of voice"], [
        ["Naming Project (shortlist + checks)", "per project", 3000, 30],
        ["Tagline / Positioning Statement", "per project", 750, 8],
        ["Brand Voice & Messaging Guide", "per project", 2500, 28],
        ["Hourly Rate", "per hour", 90],
      ]),
      role("Video Ad Producer / Creative", ["video ad", "commercial", "ad spot", "tv spot", "social video ad", "ugc ad", "pre roll", "ad production"], [
        ["Short Video Ad (15-30 sec)", "per ad", 1500, 20],
        ["UGC-Style Ad Batch (5 variations)", "per batch", 900, 14],
        ["Full Commercial Spot (60 sec)", "per spot", 6000, 70],
        ["Day Rate", "per day", 700],
      ]),
      role("Customer Research Specialist", ["customer research", "survey", "market research", "interviews", "audience research", "focus group", "persona", "voice of customer"], [
        ["Survey Project (design, run, report)", "per project", 2500, 28],
        ["Customer Interview", "per interview", 150, 2],
        ["Research Report & Personas", "per project", 3500, 40],
        ["Hourly Rate", "per hour", 90],
      ]),
      role("Agency Account Manager / Executive", ["account manager", "account executive", "client services", "account director", "agency", "client manager", "project manager"], [
        ["Monthly Account Management", "per month", 1800, 25],
        ["Campaign Coordination", "per campaign", 1200, 16],
        ["Hourly Rate", "per hour", 65],
      ]),
    ],
  },
};

/** More roles for fields that already exist (added after the roles they have). */
export const EXTRA_ROLES = {
  "Tech And Digital": [
    role("Mobile App Developer", ["ios", "android", "app", "flutter", "react native", "swift", "mobile"], [
      ["Hourly Rate", "per hour", 70],
      ["MVP App", "per project", 15000, 200],
      ["Monthly Retainer", "per month", 5000, 70],
      ["Day Rate", "per day", 600],
    ]),
    role("Front-End Developer", ["frontend", "react", "javascript", "css", "html", "web developer"], [
      ["Hourly Rate", "per hour", 60],
      ["Component Library", "per project", 4000, 60],
      ["Landing Page Build", "per page", 800, 12],
      ["Monthly Retainer", "per month", 3000, 50],
    ]),
    role("Shopify / No-Code Developer", ["shopify", "wix", "webflow", "squarespace", "bubble", "no code", "wordpress"], [
      ["Hourly Rate", "per hour", 55],
      ["Store Setup", "per project", 2500, 40],
      ["Theme Customisation", "per project", 1200, 20],
      ["Monthly Support", "per month", 300, 5],
    ]),
    role("Creative Coder / Interactive Artist", ["creative coding", "generative art", "installation", "p5", "touchdesigner", "interactive"], [
      ["Hourly Rate", "per hour", 75],
      ["Installation Piece", "per project", 5000, 80],
      ["Generative Art Commission", "per piece", 1200, 20],
    ]),
    role("Data Visualization Designer", ["data viz", "dashboard", "infographic", "charts", "data"], [
      ["Hourly Rate", "per hour", 65],
      ["Dashboard", "per project", 3500, 50],
      ["Infographic", "per piece", 600, 10],
    ]),
  ],
  "Education And Coaching": [
    role("Online Course Creator", ["course", "udemy", "teachable", "online class", "curriculum", "instructional design"], [
      ["Course Build", "per course", 4000, 80],
      ["Per Lesson Video", "per lesson", 250, 4],
      ["Hourly Rate", "per hour", 70],
      ["Revenue Share", "% of sales", 30],
    ]),
    role("Tutor", ["tutoring", "lessons", "test prep", "homework", "teacher"], [
      ["Private Lesson", "per hour", 45],
      ["Group Session", "per session", 25],
      ["Test Prep Package", "per package", 600, 12],
    ]),
    role("Fitness / Wellness Coach", ["fitness", "personal trainer", "yoga", "wellness", "coach", "nutrition", "pilates"], [
      ["Private Session", "per hour", 70],
      ["Group Class", "per class", 18],
      ["Monthly Coaching", "per month", 300, 5],
      ["Online Program", "per program", 250, 8],
    ]),
    role("Public Speaker / Workshop Facilitator", ["speaker", "keynote", "workshop", "facilitator", "talk", "training"], [
      ["Keynote", "per event", 3000, 15],
      ["Workshop (full day)", "per day", 2000],
      ["Virtual Talk", "per event", 800, 6],
    ]),
    role("Art Teacher", ["art class", "painting lessons", "drawing lessons", "art instructor", "kids art"], [
      ["Private Lesson", "per hour", 50],
      ["Group Class", "per class", 25],
      ["Workshop", "per person", 55],
    ]),
  ],
  "Culinary Arts": [
    role("Baker / Cake Designer", ["baker", "cakes", "pastry", "cupcakes", "desserts", "bakery", "wedding cake"], [
      ["Custom Cake (6 inch)", "per cake", 75, 3],
      ["Wedding Cake", "per cake", 450, 10],
      ["Cupcakes", "per dozen", 42, 1.5],
      ["Cookie Favors", "per dozen", 36, 2],
    ], [["Fondant (lb)", 8], ["Cake board and box", 6]]),
    role("Recipe Developer", ["recipes", "cookbook", "food writer", "test kitchen", "food blogger"], [
      ["Per Recipe", "per recipe", 150, 4],
      ["Brand Collaboration", "per project", 1500, 20],
      ["Hourly Rate", "per hour", 60],
    ]),
    role("Food Stylist", ["food styling", "food photography", "props", "culinary stylist"], [
      ["Day Rate", "per day", 700],
      ["Half Day", "per session", 400, 4],
      ["Per Dish", "per dish", 60, 1],
    ]),
    role("Bartender / Mixologist", ["bartending", "cocktails", "mixology", "drinks", "bar", "bartender"], [
      ["Event Bartending", "per hour", 45],
      ["Cocktail Menu Design", "per project", 500, 8],
      ["Private Class", "per person", 65],
    ]),
  ],
};

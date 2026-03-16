import type {
  Exercise,
  WorkoutCategory,
  WorkoutDifficulty,
  WorkoutExerciseTemplate,
  WorkoutFormat,
  WorkoutTemplate,
} from "../models/workout";

type VariantGroup =
  | "squat"
  | "unilateral"
  | "hinge"
  | "glute"
  | "press_loaded"
  | "push_bodyweight"
  | "vertical_press"
  | "pull_vertical"
  | "pull_horizontal"
  | "biceps"
  | "triceps"
  | "shoulder_isolation"
  | "core_static"
  | "core_dynamic"
  | "hiit"
  | "cardio"
  | "mobility"
  | "recovery"
  | "sport"
  | "calves"
  | "carry";

interface SeedExercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  musclePrimary: string[];
  muscleSecondary: string[];
  equipment: string[];
  difficulty: WorkoutDifficulty;
  animationKey: string;
  met: number;
  variantGroup: VariantGroup;
  coachingCues?: string[];
}

interface VariantSpec {
  buildName: (seed: SeedExercise) => string;
  when?: (seed: SeedExercise) => boolean;
  equipmentAdd?: string[];
  equipmentOverride?: string[];
  difficultyShift?: -1 | 0 | 1;
  metDelta?: number;
  coachingCue?: string;
  muscleSecondaryAdd?: string[];
}

type EquipmentProfile = "bodyweight" | "dumbbell" | "barbell" | "gym" | "recovery";

interface WorkoutArchetypeVariant {
  difficulty: WorkoutDifficulty;
  profile: EquipmentProfile;
  durationMinutes: number;
  format: WorkoutFormat;
  suffix: string;
  featured?: boolean;
}

interface WorkoutArchetype {
  id: string;
  name: string;
  category: WorkoutCategory;
  focusMuscles: string[];
  patterns: string[];
  benefits: string[];
  variants: WorkoutArchetypeVariant[];
  goalTags: string[];
  coverQuote: string;
  coachNotes: string[];
}

const WORKOUT_CATALOG_CREATED_AT = "2026-03-15T00:00:00.000Z";
const DIFFICULTY_ORDER: WorkoutDifficulty[] = ["beginner", "intermediate", "advanced"];

const MOVEMENT_PATTERN_BY_GROUP: Record<VariantGroup, string> = {
  squat: "squat",
  unilateral: "single-leg strength",
  hinge: "hinge",
  glute: "hip extension",
  press_loaded: "horizontal push",
  push_bodyweight: "horizontal push",
  vertical_press: "vertical push",
  pull_vertical: "vertical pull",
  pull_horizontal: "row",
  biceps: "elbow flexion",
  triceps: "elbow extension",
  shoulder_isolation: "shoulder control",
  core_static: "anti-extension",
  core_dynamic: "trunk flexion and rotation",
  hiit: "metabolic conditioning",
  cardio: "aerobic conditioning",
  mobility: "mobility",
  recovery: "tissue recovery",
  sport: "athletic power",
  calves: "ankle stiffness",
  carry: "loaded carry",
};

const GROUP_GOAL_TAGS: Record<VariantGroup, string[]> = {
  squat: ["build_muscle", "power", "lower_body_strength"],
  unilateral: ["joint_control", "athletic_balance", "lower_body_strength"],
  hinge: ["posterior_chain", "power", "strength"],
  glute: ["glute_strength", "hip_power", "posture"],
  press_loaded: ["upper_body_strength", "hypertrophy", "pressing_power"],
  push_bodyweight: ["upper_body_endurance", "bodyweight_strength", "core_control"],
  vertical_press: ["shoulder_strength", "pressing_power", "upper_body_strength"],
  pull_vertical: ["back_strength", "grip_strength", "posture"],
  pull_horizontal: ["posture", "back_strength", "scapular_control"],
  biceps: ["arm_hypertrophy", "grip_strength", "elbow_control"],
  triceps: ["lockout_strength", "arm_hypertrophy", "press_support"],
  shoulder_isolation: ["shoulder_health", "hypertrophy", "scapular_control"],
  core_static: ["spine_stability", "bracing", "injury_resilience"],
  core_dynamic: ["core_strength", "rotation_control", "hip_flexor_strength"],
  hiit: ["fat_loss", "conditioning", "work_capacity"],
  cardio: ["endurance", "heart_health", "aerobic_capacity"],
  mobility: ["range_of_motion", "movement_quality", "recovery"],
  recovery: ["recovery", "tissue_quality", "readiness"],
  sport: ["explosiveness", "speed", "athleticism"],
  calves: ["ankle_stiffness", "jumping_power", "running_economy"],
  carry: ["grip_strength", "trunk_stability", "real_world_strength"],
};

const GROUP_SET_IMPACT: Record<VariantGroup, string> = {
  squat:
    "Repeated squat sets improve motor-unit recruitment through the quads and glutes, while the trunk learns to stabilize load through hip and knee flexion.",
  unilateral:
    "Single-leg set volume increases hip stability, foot control, and femur tracking so each side produces force without compensation.",
  hinge:
    "Hinge work improves posterior-chain tension, hamstring tolerance, and hip-drive mechanics that transfer into sprinting and lifting power.",
  glute:
    "Every set reinforces hip extension strength and pelvic control, which can reduce overreliance on the lower back during hard efforts.",
  press_loaded:
    "Moderate-to-heavy pressing sets build mechanical tension in the chest, deltoids, and triceps while refining shoulder stability under load.",
  push_bodyweight:
    "Bodyweight pressing sets build muscular endurance, scapular control, and trunk stiffness without needing large external load.",
  vertical_press:
    "Overhead pressing sets strengthen upward rotation, triceps drive, and rib-to-pelvis stacking needed for efficient overhead mechanics.",
  pull_vertical:
    "Vertical pulling sets strengthen the lats, grip, and scapular depression patterns that balance pressing-heavy programs.",
  pull_horizontal:
    "Horizontal pulling sets build mid-back volume and posterior shoulder support that improve posture and pressing balance.",
  biceps:
    "Direct arm sets increase elbow-flexor tissue capacity and local hypertrophy while limiting whole-body fatigue.",
  triceps:
    "Direct triceps work strengthens lockout mechanics and improves pressing endurance near end range.",
  shoulder_isolation:
    "Isolation sets build local shoulder tolerance so the joint can handle larger training volumes with cleaner mechanics.",
  core_static:
    "Timed bracing sets improve trunk stiffness and pressure management, which protects technique under fatigue.",
  core_dynamic:
    "Controlled trunk repetitions improve abdominal coordination, hip control, and rotational awareness through repeated quality reps.",
  hiit:
    "Interval density here increases lactate tolerance and repeat-effort capacity while keeping the session short and potent.",
  cardio:
    "Steady aerobic volume improves cardiac output, peripheral oxygen delivery, and recovery between harder bouts.",
  mobility:
    "Mobility sets open usable range and improve joint positioning so strength work can happen in cleaner lines.",
  recovery:
    "Recovery sets reduce stiffness, improve blood flow, and help the nervous system downshift after harder work.",
  sport:
    "Explosive sets improve rate of force development, landing quality, and elastic return for better athletic transfer.",
  calves:
    "Calf-focused sets improve ankle stiffness, spring, and lower-leg tolerance for running and jump mechanics.",
  carry:
    "Loaded carries train full-body tension, gait integrity, and grip endurance over time rather than through isolated reps.",
};

const GROUP_BENEFIT_SNIPPETS: Record<VariantGroup, string[]> = {
  squat: [
    "Raises force production through the hips and knees for stronger squatting and jumping mechanics.",
    "Improves lower-limb deceleration so the knees and ankles handle landing stress more cleanly.",
    "Builds trunk stiffness so leg drive transfers into cleaner, safer movement.",
  ],
  unilateral: [
    "Improves side-to-side stability and exposes asymmetries before they become overload patterns.",
    "Strengthens hip and knee control during gait, stair work, and sport change-of-direction.",
    "Teaches each leg to own force without compensating through the lower back.",
  ],
  hinge: [
    "Loads the posterior chain to improve hip drive, sprint mechanics, and lifting resilience.",
    "Builds hamstring and glute capacity that protects the pelvis and lower back under load.",
    "Improves force absorption through the backside so the body can produce power repeatedly.",
  ],
  glute: [
    "Improves hip extension strength for sprinting, climbing, and pelvic control.",
    "Targets the glutes directly to support posture and unload the lumbar spine during training.",
    "Builds glute endurance that helps stabilize the femur during repeated knee flexion work.",
  ],
  press_loaded: [
    "Improves pressing strength through the chest, shoulders, and triceps for stronger upper-body output.",
    "Builds scapular control and pressing path consistency under external load.",
    "Supports hypertrophy by keeping mechanical tension high across the pressing muscles.",
  ],
  push_bodyweight: [
    "Builds upper-body stamina while forcing the trunk to resist extension and rotation.",
    "Improves closed-chain shoulder control, which is useful for robust pressing mechanics.",
    "Creates scalable strength work when heavy equipment is unavailable.",
  ],
  vertical_press: [
    "Strengthens overhead mechanics and shoulder upward rotation under load.",
    "Builds triceps and deltoid capacity that carries into pressing, throwing, and contact tolerance.",
    "Improves ribcage-to-pelvis stacking so overhead work stays efficient and safer.",
  ],
  pull_vertical: [
    "Improves lat strength and scapular depression for stronger pulling and better shoulder balance.",
    "Builds grip and upper-back endurance that supports posture and climbing patterns.",
    "Offsets high volumes of pressing by strengthening the tissues that retract and depress the shoulder girdle.",
  ],
  pull_horizontal: [
    "Builds the mid-back and rear shoulder to improve posture under desk and device-heavy lifestyles.",
    "Strengthens scapular retraction and thoracic support for more stable pressing mechanics.",
    "Improves rowing strength that carries into pulling and general upper-body durability.",
  ],
  biceps: [
    "Builds elbow flexor strength and forearm control that support pulling and grip tasks.",
    "Improves tendon tolerance around the elbow through controlled flexion volume.",
    "Adds focused hypertrophy work without excessive systemic fatigue.",
  ],
  triceps: [
    "Improves elbow lockout strength so pressing patterns finish with more authority.",
    "Builds tendon capacity around the elbow when volume is managed cleanly.",
    "Supports chest and shoulder pressing by strengthening the final range of extension.",
  ],
  shoulder_isolation: [
    "Improves shoulder tissue balance by strengthening smaller stabilizers around the joint.",
    "Supports healthier scapular mechanics for long-term overhead tolerance.",
    "Adds local hypertrophy without forcing heavy spinal loading.",
  ],
  core_static: [
    "Improves spinal stiffness and force transfer so bigger lifts feel more stable.",
    "Builds anti-extension and anti-lateral flexion endurance around the trunk.",
    "Reinforces breath-driven bracing that protects the lumbar spine under fatigue.",
  ],
  core_dynamic: [
    "Improves trunk control through flexion, rotation, and lower-ab driven movement.",
    "Builds coordination between the pelvis, ribs, and hip flexors for cleaner movement mechanics.",
    "Adds direct core volume that supports sprinting, lifting, and change-of-direction skills.",
  ],
  hiit: [
    "Raises work capacity and oxygen demand quickly for efficient conditioning sessions.",
    "Improves repeated-effort tolerance that carries into sport, circuits, and fat-loss blocks.",
    "Builds metabolic stress without requiring long training windows.",
  ],
  cardio: [
    "Improves aerobic efficiency, stroke volume, and recovery between hard efforts.",
    "Builds sustainable endurance that supports longer sessions and faster recovery.",
    "Improves energy-system development while keeping session intensity controllable.",
  ],
  mobility: [
    "Improves joint range so strength work can happen through cleaner positions.",
    "Reduces stiffness around common restriction zones such as hips, thoracic spine, and ankles.",
    "Improves movement quality and prepares tissues for loading.",
  ],
  recovery: [
    "Improves tissue tolerance and reduces local stiffness after hard training blocks.",
    "Supports blood flow and downregulation to help the body recover between sessions.",
    "Creates lower-intensity movement that helps readiness without adding more fatigue.",
  ],
  sport: [
    "Improves rate of force development for sprinting, cutting, and jump performance.",
    "Builds elastic stiffness and landing quality under athletic speeds.",
    "Sharpens reactive movement patterns that improve sport transfer.",
  ],
  calves: [
    "Improves ankle stiffness for better sprint mechanics, skipping, and jump takeoff.",
    "Builds calf capacity that helps absorb repeated foot contacts during running and jumping.",
    "Improves foot and ankle durability under high-volume lower-body work.",
  ],
  carry: [
    "Builds grip, trunk stiffness, and gait integrity under load.",
    "Improves real-world strength transfer by teaching the body to own weight while moving.",
    "Trains shoulder packing and pelvic control without complex technique demands.",
  ],
};

const GROUP_MEDICAL_SNIPPETS: Record<VariantGroup, string[]> = {
  squat: [
    "Reduce depth or load if knee pain rises as flexion increases.",
    "Keep the ribcage stacked over the pelvis to avoid dumping stress into the lumbar spine.",
    "Stop if pain feels sharp, unstable, or changes gait afterward.",
  ],
  unilateral: [
    "Use external support if balance loss turns the set into ankle or knee collapse.",
    "Shorten the stride if front-knee pressure rises beyond mild, manageable effort.",
    "Avoid forcing deep ranges if previous hip or groin irritation is active.",
  ],
  hinge: [
    "Maintain a neutral spine and hinge from the hips rather than chasing range with the low back.",
    "Lower the load if hamstring pulling becomes sharp rather than muscular.",
    "Use blocks or a reduced range if low-back symptoms are provoked near the floor.",
  ],
  glute: [
    "Keep the pelvis neutral instead of arching hard through the lower back at lockout.",
    "Reduce range or load if anterior hip pinching appears near the top of the rep.",
    "Pause if hamstring cramping replaces glute effort consistently.",
  ],
  press_loaded: [
    "Keep the shoulder blades set and the wrist stacked so the shoulder is not drifting forward.",
    "Reduce load if pressing causes sharp anterior shoulder pain or hand numbness.",
    "Use a shorter range if shoulder irritation rises near the bottom position.",
  ],
  push_bodyweight: [
    "Elevate the hands if wrists or shoulders cannot tolerate the floor position yet.",
    "Avoid excessive lumbar sway by bracing before every rep.",
    "Stop if elbow pain becomes sharp or form changes to avoid the painful range.",
  ],
  vertical_press: [
    "Press in a pain-free range if overhead mobility is limited or previous shoulder irritation is active.",
    "Stack ribs down so the load stays on the shoulder complex rather than the lower back.",
    "Use half-kneeling or seated versions if balance or spinal extension becomes excessive.",
  ],
  pull_vertical: [
    "Avoid shrugging into the ears if the neck or upper trap region is already irritated.",
    "Use assistance if elbow, shoulder, or grip symptoms degrade pulling quality early.",
    "Stay just shy of the painful range if overhead shoulder sensitivity is present.",
  ],
  pull_horizontal: [
    "Do not lead the rep with lumbar extension when the mid-back should be doing the work.",
    "Use support if previous low-back symptoms flare during unsupported rows.",
    "Keep the shoulder blade moving cleanly rather than wrenching through the elbow.",
  ],
  biceps: [
    "Keep the wrist neutral if forearm or medial elbow symptoms are already present.",
    "Reduce swinging so the elbow flexors, not the lower back, take the load.",
    "Use slower eccentrics and lighter loads if tendon sensitivity is active.",
  ],
  triceps: [
    "Avoid deep elbow flexion if triceps tendon or elbow irritation is active.",
    "Keep the upper arm stable to avoid turning the set into shoulder strain.",
    "Reduce range if overhead positions aggravate the shoulder capsule.",
  ],
  shoulder_isolation: [
    "Keep the shoulder centered instead of yanking through compensatory neck tension.",
    "Use a lighter load if movement quality changes before the target tissue is challenged.",
    "Avoid painful ranges beyond roughly shoulder height if symptoms are active.",
  ],
  core_static: [
    "Brace without holding a breath too long if blood pressure control is a concern.",
    "Reduce lever length if the low back cannot stay neutral.",
    "Stop if numbness, radiating pain, or breath restriction becomes excessive.",
  ],
  core_dynamic: [
    "Move from the trunk, not from cervical pulling or hip snapping.",
    "Shorten the range if hip flexors dominate more than the abdominal wall.",
    "Use slower reps if the lower back lifts off the floor repeatedly.",
  ],
  hiit: [
    "Scale impact and cadence if joints cannot absorb the landing volume cleanly.",
    "Extend rest or reduce interval density if dizziness or chest discomfort appears.",
    "Choose low-impact options when returning from tendon or bone-stress issues.",
  ],
  cardio: [
    "Increase pace gradually if you are returning from illness or detraining.",
    "Use talk-test pacing if heart-rate spikes feel disproportionate early.",
    "Stop and seek medical guidance for chest pain, faintness, or unusual shortness of breath.",
  ],
  mobility: [
    "Stretch to tolerance, not pain; joint pinching is a stop signal, not a goal.",
    "Use controlled breathing so range improves without aggressive forcing.",
    "Move out of any position that causes numbness, tingling, or instability.",
  ],
  recovery: [
    "Recovery work should downshift the system, not create new soreness or joint pain.",
    "Use lighter pressure around sensitive bony landmarks and tendons.",
    "Stop if bruising, numbness, or lingering irritation follows the session.",
  ],
  sport: [
    "Prioritize landing control before chasing maximal height or distance.",
    "Reduce volume if Achilles, patellar tendon, or shin symptoms are active.",
    "Use full recovery between explosive sets when quality drops sharply.",
  ],
  calves: [
    "Reduce range if Achilles or plantar fascia symptoms rise sharply.",
    "Pause at the top and lower under control to avoid bouncing through irritated tissue.",
    "Use support if balance loss changes foot pressure dramatically.",
  ],
  carry: [
    "Keep the ribcage stacked and avoid side bending under fatigue.",
    "Use a lighter load if grip failure forces shoulder shrugging or trunk twisting.",
    "Stop if numbness or nerve-like symptoms travel into the hand or arm.",
  ],
};

const GROUP_PROGRESSIONS: Record<VariantGroup, string[]> = {
  squat: ["Increase load 2.5-5% once depth and bracing stay crisp.", "Progress to a paused or explosive squat variation."],
  unilateral: ["Add load only after both sides stay equally stable.", "Progress to longer ranges or more reactive single-leg variations."],
  hinge: ["Add load gradually as spinal position stays unchanged.", "Progress to dead-stop or extended-range hinge work."],
  glute: ["Increase pause duration at lockout before chasing more load.", "Progress to single-leg or band-resisted versions."],
  press_loaded: ["Add small load jumps once the bar path stays consistent.", "Progress to slower eccentrics or closer-grip strength work."],
  push_bodyweight: ["Lower the hand elevation or add load as reps become easy.", "Progress to explosive or unilateral-biased patterns."],
  vertical_press: ["Move from seated to standing to overhead stability demands.", "Progress to single-arm or half-kneeling overhead work."],
  pull_vertical: ["Reduce assistance or add external load over time.", "Progress to longer pauses or chest-to-bar intent."],
  pull_horizontal: ["Increase support challenge or load while scapular motion stays clean.", "Progress to single-arm or dead-stop rows."],
  biceps: ["Add load only if the elbow stays quiet and stable.", "Progress to slower eccentrics or extended-range curls."],
  triceps: ["Increase cable or dumbbell load in small steps.", "Progress toward longer-range or overhead triceps work."],
  shoulder_isolation: ["Increase volume before large load jumps.", "Progress to longer pauses or lean-away mechanics."],
  core_static: ["Lengthen the lever before adding load.", "Progress to staggered, weighted, or unstable holds."],
  core_dynamic: ["Slow the eccentric before adding reps.", "Progress to longer ranges or weighted versions."],
  hiit: ["Increase work density before adding impact.", "Progress to more reactive or more explosive interval formats."],
  cardio: ["Add time or pace gradually, not both at once.", "Progress from steady work toward interval surges."],
  mobility: ["Own the range with calm breathing before going deeper.", "Progress to loaded mobility once positions stay clean."],
  recovery: ["Increase time only while the work still feels restorative.", "Progress from passive release to active mobility."],
  sport: ["Land perfectly before chasing bigger output.", "Progress to more reactive or single-leg power variations."],
  calves: ["Increase pause or deficit before loading heavily.", "Progress to single-leg or explosive contacts."],
  carry: ["Increase distance before large weight jumps.", "Progress to offset, overhead, or marching carries."],
};

const GROUP_REGRESSIONS: Record<VariantGroup, string[]> = {
  squat: ["Reduce load and keep depth in the pain-free range.", "Use a box or support to standardize the bottom position."],
  unilateral: ["Use hand support or shorten range until balance is owned.", "Reduce load and focus on smooth front-knee tracking."],
  hinge: ["Raise the start position or shorten the range.", "Reduce load and slow the lowering phase."],
  glute: ["Use bodyweight only and shorten lockout range if needed.", "Keep the ribcage down and lower the load."],
  press_loaded: ["Move to dumbbells, floor press, or a shorter range.", "Lower the load and keep the shoulder blade set."],
  push_bodyweight: ["Elevate the hands or reduce total reps.", "Use slower reps instead of harder leverage."],
  vertical_press: ["Use seated or half-kneeling support.", "Shorten the range to the pain-free arc."],
  pull_vertical: ["Use band assistance or lat-pulldown options.", "Reduce total reps and hold the top only briefly."],
  pull_horizontal: ["Use chest support or lighter load.", "Slow the tempo and reduce range if spinal control slips."],
  biceps: ["Use lighter load and stricter control.", "Choose hammer or neutral-grip options for irritated elbows."],
  triceps: ["Reduce range near deep elbow flexion.", "Use cable support and lighter resistance."],
  shoulder_isolation: ["Use lighter loads and stop slightly below symptom-provoking angles.", "Choose supported or seated options."],
  core_static: ["Shorten lever length or reduce time.", "Use elevated surfaces to make bracing more manageable."],
  core_dynamic: ["Shorten the range and slow the rep.", "Bend the knees or use alternating limbs."],
  hiit: ["Lower impact or use work-to-rest intervals with more recovery.", "Choose fewer rounds and submaximal pace."],
  cardio: ["Reduce pace and use shorter blocks.", "Switch to low-impact machines or walking."],
  mobility: ["Use smaller ranges with long exhales.", "Support the position with a wall or prop."],
  recovery: ["Use lighter pressure or shorter exposure.", "Swap to breathing-led mobility if tissue pressure is too much."],
  sport: ["Reduce jump height or distance and stick landings.", "Use bilateral before unilateral power."],
  calves: ["Use bodyweight and supported balance.", "Shorten the range near symptomatic end positions."],
  carry: ["Lower the load and shorten the walk.", "Use bilateral carries before offset or overhead versions."],
};

const GROUP_QUOTES: Record<VariantGroup, string[]> = {
  squat: ["Drive the floor away and own the rep.", "Strong legs change the whole session.", "Depth with control beats ego every time."],
  unilateral: ["Balance is strength made visible.", "Own one side, then own both.", "Stability first, speed second."],
  hinge: ["Power starts at the hips.", "Pull with intent, finish with control.", "Posterior-chain strength is built rep by rep."],
  glute: ["Squeeze with purpose and the rest follows.", "Hip drive changes how you move everywhere else.", "Lockout is earned, not thrown away."],
  press_loaded: ["Press with intent and keep the bar honest.", "Strong shoulders start with stacked positions.", "Power loves precision."],
  push_bodyweight: ["Bodyweight done well is never easy.", "Earn every rep through tension.", "Smooth reps build real strength."],
  vertical_press: ["Reach tall without losing your stack.", "Own the overhead line.", "Strength overhead begins with control below."],
  pull_vertical: ["Pull the elbows where you want to go.", "The back finishes what the arms start.", "Strong posture is trained, not wished for."],
  pull_horizontal: ["Squeeze the mid-back and keep the chest proud.", "Rows teach posture under pressure.", "Pull clean and the shoulders stay grateful."],
  biceps: ["Strict reps build serious arms.", "Control the lowering phase and growth follows.", "Small muscles still deserve big discipline."],
  triceps: ["Finish strong through full extension.", "Lockout power comes from patient volume.", "Tension, control, repeat."],
  shoulder_isolation: ["Small muscles decide whether big lifts stay healthy.", "Shoulder detail work is long-game training.", "Precision beats swinging."],
  core_static: ["Brace first and the whole body listens.", "Stillness under tension is a skill.", "A strong trunk makes every lift cleaner."],
  core_dynamic: ["Move the trunk, not the ego.", "Control the center and the limbs move better.", "Quality core reps travel into everything else."],
  hiit: ["Short session, full intent.", "Stay sharp when it burns.", "Conditioning rewards the athlete who keeps form."],
  cardio: ["Steady work builds a bigger engine.", "Endurance is patience under effort.", "Breathe, settle, keep moving."],
  mobility: ["Own the range you ask for.", "Mobility is strength meeting patience.", "Calm breathing makes deeper positions possible."],
  recovery: ["Recovery is training, not an afterthought.", "Downshift well so you can push again.", "The comeback rep starts in recovery."],
  sport: ["Explode, stick, repeat.", "Power is useless without control on the landing.", "Athleticism grows in crisp reps."],
  calves: ["Spring comes from disciplined contacts.", "Strong ankles change how every step feels.", "Finish tall and lower slow."],
  carry: ["Walk proud under the load.", "Strong posture is portable strength.", "Own the weight and the route."],
};

const MUSCLE_ROLE_LABELS: Record<string, string> = {
  quads: "knee extension and deceleration",
  glutes: "hip extension and pelvic control",
  hamstrings: "hip drive and posterior-chain braking",
  core: "trunk stiffness and force transfer",
  lower_back: "spinal support and anti-flexion control",
  chest: "horizontal pressing force",
  shoulders: "shoulder girdle stability",
  front_delts: "shoulder flexion and pressing support",
  side_delts: "abduction strength and shoulder shape",
  rear_delts: "posterior shoulder balance",
  upper_chest: "clavicular pressing support",
  triceps: "elbow extension and press finish",
  biceps: "elbow flexion and pulling assistance",
  brachialis: "elbow flexion strength",
  forearms: "grip and wrist control",
  lats: "shoulder extension and scapular depression",
  rhomboids: "scapular retraction and posture",
  traps: "scapular upward rotation and neck-to-shoulder support",
  rotator_cuff: "glenohumeral centering",
  obliques: "rotation control and lateral stability",
  transverse_abdominis: "deep bracing pressure",
  upper_abs: "trunk flexion control",
  lower_abs: "pelvic control under leg motion",
  hip_flexors: "leg drive and anterior hip control",
  calves: "ankle stiffness and propulsion",
  adductors: "groin control and frontal-plane stability",
  coordination: "timing and rhythm",
  it_band: "lateral tissue tolerance",
  outer_quads: "lateral quad support",
  inner_chest: "short-range pressing tension",
  back: "upper-back pulling support",
  legs: "lower-limb force output",
  arms: "upper-limb support",
  thoracic_spine: "rotation and extension support",
  feet: "foot tripod and ground contact",
  full_body: "whole-body force sharing",
};

const PROFILE_EQUIPMENT: Record<EquipmentProfile, string[]> = {
  bodyweight: [],
  dumbbell: ["dumbbells", "bench", "jump_rope", "pullup_bar", "resistance_band"],
  barbell: ["barbell", "rack", "bench", "dumbbells", "pullup_bar", "resistance_band"],
  gym: [
    "barbell",
    "rack",
    "bench",
    "dumbbells",
    "pullup_bar",
    "cable",
    "parallel_bars",
    "leg_press",
    "leg_curl",
    "treadmill",
    "rowing_machine",
    "cycle_machine",
    "medicine_ball",
    "plyo_box",
    "ab_wheel",
    "jump_rope",
    "foam_roller",
    "battle_ropes",
    "assault_bike",
    "resistance_band",
    "trap_bar",
    "kettlebell",
  ],
  recovery: ["foam_roller", "bench", "wall", "resistance_band"],
};
const SEED_EXERCISES: SeedExercise[] = [
  { id: "ex_001", name: "Barbell Back Squat", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings", "core", "lower_back"], equipment: ["barbell", "rack"], difficulty: "intermediate", animationKey: "squat", met: 6.0, variantGroup: "squat", coachingCues: ["Brace before each rep.", "Drive through the mid-foot."] },
  { id: "ex_002", name: "Front Squat", category: "strength", musclePrimary: ["quads", "core"], muscleSecondary: ["glutes", "back"], equipment: ["barbell", "rack"], difficulty: "intermediate", animationKey: "squat", met: 6.2, variantGroup: "squat", coachingCues: ["Elbows high, chest tall."] },
  { id: "ex_003", name: "Goblet Squat", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["core"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "squat", met: 5.0, variantGroup: "squat" },
  { id: "ex_004", name: "Air Squat", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["core"], equipment: [], difficulty: "beginner", animationKey: "squat", met: 4.0, variantGroup: "squat" },
  { id: "ex_005", name: "Sumo Squat", category: "strength", musclePrimary: ["glutes", "quads", "adductors"], muscleSecondary: ["core"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "squat", met: 5.0, variantGroup: "squat" },
  { id: "ex_006", name: "Romanian Deadlift", category: "strength", musclePrimary: ["hamstrings", "glutes"], muscleSecondary: ["lower_back", "core"], equipment: ["barbell"], difficulty: "intermediate", animationKey: "deadlift", met: 5.5, variantGroup: "hinge", coachingCues: ["Push hips back.", "Keep the bar close."] },
  { id: "ex_007", name: "Conventional Deadlift", category: "strength", musclePrimary: ["hamstrings", "glutes", "lower_back"], muscleSecondary: ["quads", "traps", "core"], equipment: ["barbell"], difficulty: "advanced", animationKey: "deadlift", met: 7.0, variantGroup: "hinge" },
  { id: "ex_008", name: "Trap Bar Deadlift", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings", "traps", "core"], equipment: ["trap_bar"], difficulty: "intermediate", animationKey: "deadlift", met: 6.0, variantGroup: "hinge" },
  { id: "ex_009", name: "Kettlebell Swing", category: "hiit", musclePrimary: ["glutes", "hamstrings"], muscleSecondary: ["core", "lats"], equipment: ["kettlebell"], difficulty: "intermediate", animationKey: "hipThrust", met: 8.5, variantGroup: "hinge" },
  { id: "ex_010", name: "Barbell Hip Thrust", category: "strength", musclePrimary: ["glutes"], muscleSecondary: ["hamstrings", "core"], equipment: ["barbell", "bench"], difficulty: "intermediate", animationKey: "hipThrust", met: 5.0, variantGroup: "glute" },
  { id: "ex_011", name: "Glute Bridge", category: "strength", musclePrimary: ["glutes"], muscleSecondary: ["hamstrings"], equipment: [], difficulty: "beginner", animationKey: "hipThrust", met: 3.5, variantGroup: "glute" },
  { id: "ex_012", name: "Frog Pump", category: "strength", musclePrimary: ["glutes"], muscleSecondary: ["core"], equipment: [], difficulty: "beginner", animationKey: "hipThrust", met: 3.2, variantGroup: "glute" },
  { id: "ex_013", name: "Forward Lunge", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings", "calves", "core"], equipment: [], difficulty: "beginner", animationKey: "lunge", met: 4.5, variantGroup: "unilateral" },
  { id: "ex_014", name: "Reverse Lunge", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings", "core"], equipment: [], difficulty: "beginner", animationKey: "lunge", met: 4.5, variantGroup: "unilateral" },
  { id: "ex_015", name: "Walking Lunge", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["calves", "core"], equipment: ["dumbbells"], difficulty: "intermediate", animationKey: "lunge", met: 5.2, variantGroup: "unilateral" },
  { id: "ex_016", name: "Bulgarian Split Squat", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings", "core"], equipment: ["dumbbells", "bench"], difficulty: "intermediate", animationKey: "lunge", met: 5.5, variantGroup: "unilateral" },
  { id: "ex_017", name: "Leg Press", category: "strength", musclePrimary: ["quads", "glutes"], muscleSecondary: ["hamstrings"], equipment: ["leg_press"], difficulty: "beginner", animationKey: "squat", met: 5.0, variantGroup: "squat" },
  { id: "ex_018", name: "Leg Curl", category: "strength", musclePrimary: ["hamstrings"], muscleSecondary: ["calves"], equipment: ["leg_curl"], difficulty: "beginner", animationKey: "deadlift", met: 3.5, variantGroup: "hinge" },
  { id: "ex_019", name: "Box Step-up", category: "sport", musclePrimary: ["quads", "glutes"], muscleSecondary: ["calves", "core"], equipment: ["plyo_box"], difficulty: "beginner", animationKey: "lunge", met: 5.5, variantGroup: "unilateral" },
  { id: "ex_020", name: "Standing Calf Raise", category: "strength", musclePrimary: ["calves"], muscleSecondary: ["feet"], equipment: [], difficulty: "beginner", animationKey: "calfRaise", met: 3.0, variantGroup: "calves" },
  { id: "ex_021", name: "Wall Sit", category: "strength", musclePrimary: ["quads"], muscleSecondary: ["glutes", "core"], equipment: [], difficulty: "beginner", animationKey: "squat", met: 4.0, variantGroup: "squat" },

  { id: "ex_022", name: "Barbell Bench Press", category: "strength", musclePrimary: ["chest"], muscleSecondary: ["triceps", "front_delts"], equipment: ["barbell", "bench"], difficulty: "intermediate", animationKey: "benchPress", met: 5.5, variantGroup: "press_loaded" },
  { id: "ex_023", name: "Dumbbell Bench Press", category: "strength", musclePrimary: ["chest"], muscleSecondary: ["triceps", "front_delts"], equipment: ["dumbbells", "bench"], difficulty: "beginner", animationKey: "benchPress", met: 5.0, variantGroup: "press_loaded" },
  { id: "ex_024", name: "Incline Dumbbell Press", category: "strength", musclePrimary: ["upper_chest"], muscleSecondary: ["front_delts", "triceps"], equipment: ["dumbbells", "bench"], difficulty: "beginner", animationKey: "benchPress", met: 5.0, variantGroup: "press_loaded" },
  { id: "ex_025", name: "Overhead Barbell Press", category: "strength", musclePrimary: ["front_delts", "side_delts"], muscleSecondary: ["triceps", "upper_chest", "core"], equipment: ["barbell"], difficulty: "intermediate", animationKey: "shoulderPress", met: 5.5, variantGroup: "vertical_press" },
  { id: "ex_026", name: "Dumbbell Shoulder Press", category: "strength", musclePrimary: ["front_delts"], muscleSecondary: ["triceps", "side_delts"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "shoulderPress", met: 5.0, variantGroup: "vertical_press" },
  { id: "ex_027", name: "Arnold Press", category: "strength", musclePrimary: ["front_delts", "side_delts"], muscleSecondary: ["triceps", "upper_chest"], equipment: ["dumbbells"], difficulty: "intermediate", animationKey: "shoulderPress", met: 5.2, variantGroup: "vertical_press" },
  { id: "ex_028", name: "Pull-up", category: "strength", musclePrimary: ["lats", "biceps"], muscleSecondary: ["rhomboids", "rear_delts"], equipment: ["pullup_bar"], difficulty: "intermediate", animationKey: "pullup", met: 8.0, variantGroup: "pull_vertical" },
  { id: "ex_029", name: "Chin-up", category: "strength", musclePrimary: ["biceps", "lats"], muscleSecondary: ["rhomboids"], equipment: ["pullup_bar"], difficulty: "intermediate", animationKey: "pullup", met: 7.5, variantGroup: "pull_vertical" },
  { id: "ex_030", name: "Assisted Pull-up", category: "strength", musclePrimary: ["lats", "biceps"], muscleSecondary: ["rhomboids"], equipment: ["pullup_bar", "resistance_band"], difficulty: "beginner", animationKey: "pullup", met: 6.0, variantGroup: "pull_vertical" },
  { id: "ex_031", name: "Lat Pulldown", category: "strength", musclePrimary: ["lats"], muscleSecondary: ["biceps", "rear_delts"], equipment: ["cable"], difficulty: "beginner", animationKey: "pullup", met: 4.8, variantGroup: "pull_vertical" },
  { id: "ex_032", name: "Inverted Row", category: "strength", musclePrimary: ["lats", "rhomboids"], muscleSecondary: ["biceps", "rear_delts"], equipment: ["barbell", "rack"], difficulty: "beginner", animationKey: "pullup", met: 5.5, variantGroup: "pull_horizontal" },
  { id: "ex_033", name: "Seated Cable Row", category: "strength", musclePrimary: ["back", "rhomboids"], muscleSecondary: ["biceps", "rear_delts"], equipment: ["cable"], difficulty: "beginner", animationKey: "pullup", met: 4.6, variantGroup: "pull_horizontal" },
  { id: "ex_034", name: "Dumbbell Row", category: "strength", musclePrimary: ["lats", "back"], muscleSecondary: ["biceps", "core"], equipment: ["dumbbells", "bench"], difficulty: "beginner", animationKey: "pullup", met: 4.8, variantGroup: "pull_horizontal" },
  { id: "ex_035", name: "Chest-Supported Row", category: "strength", musclePrimary: ["back", "rhomboids"], muscleSecondary: ["biceps", "rear_delts"], equipment: ["dumbbells", "bench"], difficulty: "beginner", animationKey: "pullup", met: 4.7, variantGroup: "pull_horizontal" },
  { id: "ex_036", name: "Barbell Bicep Curl", category: "strength", musclePrimary: ["biceps"], muscleSecondary: ["forearms"], equipment: ["barbell"], difficulty: "beginner", animationKey: "bicepCurl", met: 3.5, variantGroup: "biceps" },
  { id: "ex_037", name: "Dumbbell Bicep Curl", category: "strength", musclePrimary: ["biceps"], muscleSecondary: ["forearms"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "bicepCurl", met: 3.5, variantGroup: "biceps" },
  { id: "ex_038", name: "Hammer Curl", category: "strength", musclePrimary: ["biceps", "brachialis"], muscleSecondary: ["forearms"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "bicepCurl", met: 3.5, variantGroup: "biceps" },
  { id: "ex_039", name: "Cable Triceps Pressdown", category: "strength", musclePrimary: ["triceps"], muscleSecondary: ["front_delts"], equipment: ["cable"], difficulty: "beginner", animationKey: "tricepDip", met: 3.6, variantGroup: "triceps" },
  { id: "ex_040", name: "Overhead Triceps Extension", category: "strength", musclePrimary: ["triceps"], muscleSecondary: ["core"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "tricepDip", met: 3.6, variantGroup: "triceps" },
  { id: "ex_041", name: "Tricep Dip", category: "strength", musclePrimary: ["triceps"], muscleSecondary: ["chest", "front_delts"], equipment: ["bench"], difficulty: "beginner", animationKey: "tricepDip", met: 4.5, variantGroup: "push_bodyweight" },
  { id: "ex_042", name: "Parallel Bar Dip", category: "strength", musclePrimary: ["triceps", "chest"], muscleSecondary: ["front_delts"], equipment: ["parallel_bars"], difficulty: "intermediate", animationKey: "tricepDip", met: 6.0, variantGroup: "push_bodyweight" },
  { id: "ex_043", name: "Lateral Raise", category: "strength", musclePrimary: ["side_delts"], muscleSecondary: ["traps"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "lateralRaise", met: 3.0, variantGroup: "shoulder_isolation" },
  { id: "ex_044", name: "Front Raise", category: "strength", musclePrimary: ["front_delts"], muscleSecondary: ["core"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "lateralRaise", met: 3.0, variantGroup: "shoulder_isolation" },
  { id: "ex_045", name: "Face Pull", category: "strength", musclePrimary: ["rear_delts", "rhomboids"], muscleSecondary: ["rotator_cuff"], equipment: ["cable"], difficulty: "beginner", animationKey: "lateralRaise", met: 3.5, variantGroup: "shoulder_isolation" },
  { id: "ex_046", name: "Push-up", category: "strength", musclePrimary: ["chest", "triceps"], muscleSecondary: ["front_delts", "core"], equipment: [], difficulty: "beginner", animationKey: "pushup", met: 5.5, variantGroup: "push_bodyweight" },
  { id: "ex_047", name: "Wide Push-up", category: "strength", musclePrimary: ["chest"], muscleSecondary: ["triceps", "front_delts"], equipment: [], difficulty: "beginner", animationKey: "pushup", met: 5.5, variantGroup: "push_bodyweight" },
  { id: "ex_048", name: "Diamond Push-up", category: "strength", musclePrimary: ["triceps", "inner_chest"], muscleSecondary: ["core"], equipment: [], difficulty: "intermediate", animationKey: "pushup", met: 6.0, variantGroup: "push_bodyweight" },
  { id: "ex_049", name: "Pike Push-up", category: "strength", musclePrimary: ["front_delts"], muscleSecondary: ["triceps"], equipment: [], difficulty: "beginner", animationKey: "pushup", met: 5.0, variantGroup: "push_bodyweight" },

  { id: "ex_050", name: "Plank", category: "core", musclePrimary: ["core", "transverse_abdominis"], muscleSecondary: ["shoulders", "glutes"], equipment: [], difficulty: "beginner", animationKey: "plank", met: 3.5, variantGroup: "core_static" },
  { id: "ex_051", name: "Side Plank", category: "core", musclePrimary: ["obliques", "core"], muscleSecondary: ["glutes", "shoulders"], equipment: [], difficulty: "beginner", animationKey: "plank", met: 3.5, variantGroup: "core_static" },
  { id: "ex_052", name: "Hollow Body Hold", category: "core", musclePrimary: ["core", "lower_abs"], muscleSecondary: ["hip_flexors"], equipment: [], difficulty: "intermediate", animationKey: "plank", met: 3.8, variantGroup: "core_static" },
  { id: "ex_053", name: "Copenhagen Plank", category: "core", musclePrimary: ["obliques", "adductors"], muscleSecondary: ["core", "shoulders"], equipment: ["bench"], difficulty: "intermediate", animationKey: "plank", met: 4.0, variantGroup: "core_static" },
  { id: "ex_054", name: "Crunch", category: "core", musclePrimary: ["upper_abs"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "crunch", met: 3.5, variantGroup: "core_dynamic" },
  { id: "ex_055", name: "Bicycle Crunch", category: "core", musclePrimary: ["obliques", "upper_abs"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "crunch", met: 4.5, variantGroup: "core_dynamic" },
  { id: "ex_056", name: "Lying Leg Raise", category: "core", musclePrimary: ["lower_abs", "hip_flexors"], muscleSecondary: ["core"], equipment: [], difficulty: "beginner", animationKey: "legRaise", met: 4.0, variantGroup: "core_dynamic" },
  { id: "ex_057", name: "Hanging Leg Raise", category: "core", musclePrimary: ["lower_abs", "hip_flexors"], muscleSecondary: ["lats", "core"], equipment: ["pullup_bar"], difficulty: "intermediate", animationKey: "legRaise", met: 5.5, variantGroup: "core_dynamic" },
  { id: "ex_058", name: "Russian Twist", category: "core", musclePrimary: ["obliques"], muscleSecondary: ["core"], equipment: [], difficulty: "beginner", animationKey: "russianTwist", met: 4.0, variantGroup: "core_dynamic" },
  { id: "ex_059", name: "Ab Wheel Rollout", category: "core", musclePrimary: ["core", "transverse_abdominis"], muscleSecondary: ["lats", "shoulders"], equipment: ["ab_wheel"], difficulty: "intermediate", animationKey: "plank", met: 5.0, variantGroup: "core_dynamic" },
  { id: "ex_060", name: "Dead Bug", category: "core", musclePrimary: ["core", "transverse_abdominis"], muscleSecondary: ["hip_flexors"], equipment: [], difficulty: "beginner", animationKey: "legRaise", met: 3.0, variantGroup: "core_dynamic" },
  { id: "ex_061", name: "Bird Dog", category: "core", musclePrimary: ["core"], muscleSecondary: ["glutes", "shoulders"], equipment: [], difficulty: "beginner", animationKey: "legRaise", met: 2.8, variantGroup: "core_dynamic" },
  { id: "ex_062", name: "Bear Crawl", category: "hiit", musclePrimary: ["core", "shoulders"], muscleSecondary: ["quads", "hip_flexors"], equipment: [], difficulty: "intermediate", animationKey: "mountainClimber", met: 6.5, variantGroup: "hiit" },

  { id: "ex_063", name: "Burpee", category: "hiit", musclePrimary: ["full_body"], muscleSecondary: ["core"], equipment: [], difficulty: "intermediate", animationKey: "burpee", met: 10.0, variantGroup: "hiit" },
  { id: "ex_064", name: "Jumping Jack", category: "cardio", musclePrimary: ["full_body"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "jumpingJack", met: 7.0, variantGroup: "cardio" },
  { id: "ex_065", name: "High Knees", category: "cardio", musclePrimary: ["hip_flexors", "calves"], muscleSecondary: ["core"], equipment: [], difficulty: "beginner", animationKey: "highKnees", met: 8.0, variantGroup: "cardio" },
  { id: "ex_066", name: "Mountain Climber", category: "hiit", musclePrimary: ["core", "hip_flexors"], muscleSecondary: ["shoulders", "quads"], equipment: [], difficulty: "beginner", animationKey: "mountainClimber", met: 8.0, variantGroup: "hiit" },
  { id: "ex_067", name: "Box Jump", category: "hiit", musclePrimary: ["quads", "glutes"], muscleSecondary: ["calves", "core"], equipment: ["plyo_box"], difficulty: "intermediate", animationKey: "squat", met: 10.0, variantGroup: "sport" },
  { id: "ex_068", name: "Jump Squat", category: "hiit", musclePrimary: ["quads", "glutes"], muscleSecondary: ["calves", "core"], equipment: [], difficulty: "intermediate", animationKey: "squat", met: 9.0, variantGroup: "hiit" },
  { id: "ex_069", name: "Sprint (Treadmill)", category: "cardio", musclePrimary: ["quads", "hamstrings"], muscleSecondary: ["glutes", "calves", "core"], equipment: ["treadmill"], difficulty: "intermediate", animationKey: "highKnees", met: 14.0, variantGroup: "cardio" },
  { id: "ex_070", name: "Rowing Machine", category: "cardio", musclePrimary: ["back", "legs"], muscleSecondary: ["core", "arms"], equipment: ["rowing_machine"], difficulty: "beginner", animationKey: "pullup", met: 7.0, variantGroup: "cardio" },
  { id: "ex_071", name: "Cycling", category: "cardio", musclePrimary: ["quads", "hamstrings"], muscleSecondary: ["calves", "glutes"], equipment: ["cycle_machine"], difficulty: "beginner", animationKey: "squat", met: 8.0, variantGroup: "cardio" },
  { id: "ex_072", name: "Jump Rope", category: "cardio", musclePrimary: ["calves", "shoulders"], muscleSecondary: ["core", "coordination"], equipment: ["jump_rope"], difficulty: "beginner", animationKey: "jumpingJack", met: 12.0, variantGroup: "cardio" },
  { id: "ex_073", name: "Treadmill Incline Walk", category: "cardio", musclePrimary: ["glutes", "calves"], muscleSecondary: ["hamstrings", "core"], equipment: ["treadmill"], difficulty: "beginner", animationKey: "highKnees", met: 6.0, variantGroup: "cardio" },
  { id: "ex_074", name: "Assault Bike Sprint", category: "hiit", musclePrimary: ["full_body"], muscleSecondary: ["core"], equipment: ["assault_bike"], difficulty: "intermediate", animationKey: "highKnees", met: 12.5, variantGroup: "hiit" },
  { id: "ex_075", name: "Battle Rope Wave", category: "hiit", musclePrimary: ["shoulders", "core"], muscleSecondary: ["arms", "calves"], equipment: ["battle_ropes"], difficulty: "intermediate", animationKey: "shoulderPress", met: 10.5, variantGroup: "hiit" },

  { id: "ex_076", name: "Hip Flexor Stretch", category: "flexibility", musclePrimary: ["hip_flexors"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "hipFlexorStretch", met: 2.0, variantGroup: "mobility" },
  { id: "ex_077", name: "Hamstring Stretch", category: "flexibility", musclePrimary: ["hamstrings"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "deadlift", met: 2.0, variantGroup: "mobility" },
  { id: "ex_078", name: "Pigeon Pose", category: "flexibility", musclePrimary: ["glutes", "hip_flexors"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "lunge", met: 2.0, variantGroup: "mobility" },
  { id: "ex_079", name: "Child's Pose", category: "flexibility", musclePrimary: ["lower_back", "lats"], muscleSecondary: [], equipment: [], difficulty: "beginner", animationKey: "plank", met: 1.5, variantGroup: "mobility" },
  { id: "ex_080", name: "World's Greatest Stretch", category: "flexibility", musclePrimary: ["hip_flexors", "hamstrings"], muscleSecondary: ["glutes", "thoracic_spine"], equipment: [], difficulty: "beginner", animationKey: "lunge", met: 2.1, variantGroup: "mobility" },
  { id: "ex_081", name: "Thoracic Open Book", category: "flexibility", musclePrimary: ["thoracic_spine"], muscleSecondary: ["shoulders"], equipment: [], difficulty: "beginner", animationKey: "plank", met: 1.8, variantGroup: "mobility" },
  { id: "ex_082", name: "Adductor Rockback", category: "flexibility", musclePrimary: ["adductors"], muscleSecondary: ["glutes"], equipment: [], difficulty: "beginner", animationKey: "lunge", met: 1.8, variantGroup: "mobility" },
  { id: "ex_083", name: "Ankle Mobility Rock", category: "flexibility", musclePrimary: ["calves"], muscleSecondary: ["feet"], equipment: [], difficulty: "beginner", animationKey: "calfRaise", met: 1.8, variantGroup: "mobility" },
  { id: "ex_084", name: "Foam Roll Quads", category: "recovery", musclePrimary: ["quads"], muscleSecondary: [], equipment: ["foam_roller"], difficulty: "beginner", animationKey: "plank", met: 2.5, variantGroup: "recovery" },
  { id: "ex_085", name: "Foam Roll IT Band", category: "recovery", musclePrimary: ["it_band"], muscleSecondary: ["outer_quads"], equipment: ["foam_roller"], difficulty: "beginner", animationKey: "plank", met: 2.5, variantGroup: "recovery" },

  { id: "ex_086", name: "Broad Jump", category: "sport", musclePrimary: ["quads", "glutes", "calves"], muscleSecondary: ["core"], equipment: [], difficulty: "intermediate", animationKey: "squat", met: 9.0, variantGroup: "sport" },
  { id: "ex_087", name: "Lateral Bound", category: "sport", musclePrimary: ["glutes", "adductors"], muscleSecondary: ["calves", "core"], equipment: [], difficulty: "intermediate", animationKey: "jumpingJack", met: 8.0, variantGroup: "sport" },
  { id: "ex_088", name: "Medicine Ball Slam", category: "sport", musclePrimary: ["core", "shoulders"], muscleSecondary: ["triceps", "lats"], equipment: ["medicine_ball"], difficulty: "intermediate", animationKey: "shoulderPress", met: 8.5, variantGroup: "sport" },
  { id: "ex_089", name: "Skater Hop", category: "sport", musclePrimary: ["glutes", "quads"], muscleSecondary: ["adductors", "core"], equipment: [], difficulty: "intermediate", animationKey: "jumpingJack", met: 8.2, variantGroup: "sport" },
  { id: "ex_090", name: "Farmer Carry", category: "sport", musclePrimary: ["forearms", "core"], muscleSecondary: ["shoulders", "glutes"], equipment: ["dumbbells"], difficulty: "beginner", animationKey: "lunge", met: 6.0, variantGroup: "carry" },
];
const VARIANT_LIBRARY: Record<VariantGroup, VariantSpec[]> = {
  squat: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Use a three-second lowering phase." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Hold the bottom position for one clean breath." }),
    prefixVariant("Pulse", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Stay in tension through the middle range." }),
    prefixVariant("Heel-Elevated", { metDelta: 0.2, coachingCue: "Keep the knees traveling cleanly over the toes." }),
    prefixVariant("Extended-Range", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Own the bottom without losing trunk position." }),
    prefixVariant("Explosive", { metDelta: 0.7, difficultyShift: 1, coachingCue: "Drive up hard while landing every rep under control." }),
    prefixVariant("Isometric", { metDelta: 0.2, coachingCue: "Freeze the hardest position before finishing the rep." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Return halfway up, then descend again before standing." }),
    suffixVariant("To Box", { equipmentAdd: ["bench"], metDelta: 0.2, coachingCue: "Tap the box lightly without collapsing onto it." }),
    suffixVariant("With Reach", { metDelta: 0.2, coachingCue: "Reach long to keep the upper back and core engaged." }),
    prefixVariant("Offset", { when: (seed) => seed.equipment.length === 0 || equipmentHas(seed, "dumbbells"), metDelta: 0.3, coachingCue: "Fight rotation as the load pulls you off center." }),
    prefixVariant("Staggered", { metDelta: 0.2, coachingCue: "Let the front foot stay dominant while the rear foot assists." }),
  ],
  unilateral: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Lower slowly and own the front-leg load." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Pause at the bottom to organize balance." }),
    prefixVariant("Pulse", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Stay in tension and avoid bouncing through the knee." }),
    prefixVariant("Front-Foot-Elevated", { equipmentAdd: ["bench"], metDelta: 0.3, coachingCue: "Use the extra range without losing pelvic control." }),
    prefixVariant("Rear-Foot-Elevated", { equipmentAdd: ["bench"], metDelta: 0.4, difficultyShift: 1, coachingCue: "Keep the torso quiet and the front foot rooted." }),
    prefixVariant("Offset", { equipmentAdd: ["dumbbells"], metDelta: 0.2, coachingCue: "Brace against rotation while the load stays asymmetrical." }),
    prefixVariant("Contralateral", { equipmentAdd: ["dumbbells"], metDelta: 0.2, coachingCue: "Hold the load opposite the working leg for extra hip stability demand." }),
    prefixVariant("Ipsilateral", { equipmentAdd: ["dumbbells"], metDelta: 0.2, coachingCue: "Own the same-side load without collapsing inward." }),
    suffixVariant("With Knee Drive", { metDelta: 0.3, coachingCue: "Finish tall through the standing hip." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the extra half rep to build control." }),
    suffixVariant("With Reach", { metDelta: 0.2, coachingCue: "Reach forward without losing front-foot pressure." }),
    prefixVariant("Explosive", { metDelta: 0.6, difficultyShift: 1, coachingCue: "Push away from the floor fast, then own the landing." }),
  ],
  hinge: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Lower in three counts and keep tension in the hamstrings." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Pause just off the shin or knee to own the hardest line." }),
    prefixVariant("Dead-Stop", { metDelta: 0.3, coachingCue: "Reset every rep so position stays honest." }),
    prefixVariant("Deficit", { equipmentAdd: ["bench"], metDelta: 0.4, difficultyShift: 1, coachingCue: "Keep the hinge pattern clean through the longer range." }),
    prefixVariant("Staggered", { metDelta: 0.3, coachingCue: "Bias the front leg and keep the hips square." }),
    prefixVariant("Suitcase", { equipmentAdd: ["dumbbells"], metDelta: 0.3, coachingCue: "Brace hard so the trunk resists side bending." }),
    prefixVariant("Snatch-Grip", { when: (seed) => equipmentHas(seed, "barbell"), metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the wider grip to light up the upper back." }),
    prefixVariant("Band-Resisted", { equipmentAdd: ["resistance_band"], metDelta: 0.4, coachingCue: "Stay aggressive through lockout as resistance climbs." }),
    suffixVariant("With Iso Hold", { metDelta: 0.2, coachingCue: "Freeze in the loaded stretch without rounding." }),
    suffixVariant("With Reach", { metDelta: 0.2, coachingCue: "Reach the hips back farther while keeping the spine long." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the half rep to extend time under tension." }),
    prefixVariant("Explosive", { metDelta: 0.7, difficultyShift: 1, coachingCue: "Snap the hips through but keep the ribs stacked." }),
  ],
  glute: [
    prefixVariant("Tempo", { metDelta: 0.2, coachingCue: "Lift smooth, lower slower, and keep the pelvis neutral." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Hold full glute squeeze at lockout for two beats." }),
    prefixVariant("Banded", { equipmentAdd: ["resistance_band"], metDelta: 0.2, coachingCue: "Drive the knees out to keep glutes engaged." }),
    prefixVariant("Single-Leg", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Keep the pelvis level as one side works harder." }),
    prefixVariant("Frog", { metDelta: 0.2, coachingCue: "Use the foot position to bias the glutes through short-range burn." }),
    prefixVariant("Elevated", { equipmentAdd: ["bench"], metDelta: 0.3, coachingCue: "Use the extra range without dumping into the lower back." }),
    prefixVariant("Pulse", { metDelta: 0.3, coachingCue: "Stay in the top third and keep the glutes lit up." }),
    prefixVariant("Explosive", { metDelta: 0.5, difficultyShift: 1, coachingCue: "Drive through the heels and snap up with intent." }),
    suffixVariant("With March", { metDelta: 0.3, coachingCue: "Keep the pelvis steady as the legs alternate." }),
    suffixVariant("With Abduction", { equipmentAdd: ["resistance_band"], metDelta: 0.2, coachingCue: "Open the knees without losing full foot pressure." }),
    suffixVariant("With Iso Hold", { metDelta: 0.2, coachingCue: "Own the top position under full glute tension." }),
    suffixVariant("With Reach", { metDelta: 0.1, coachingCue: "Reach long through the arms to keep the ribcage quiet." }),
  ],
  press_loaded: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Take three counts down and stay packed." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Pause off the chest or floor without relaxing." }),
    prefixVariant("Neutral-Grip", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.1, coachingCue: "Keep the elbows slightly tucked." }),
    prefixVariant("Alternating", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.2, coachingCue: "One side stays locked while the other presses." }),
    prefixVariant("Single-Arm", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.3, difficultyShift: 1, coachingCue: "Brace against rotation as you press." }),
    prefixVariant("Close-Grip", { metDelta: 0.2, coachingCue: "Keep the forearms vertical and finish through triceps." }),
    prefixVariant("Incline", { when: (seed) => equipmentHas(seed, "bench"), metDelta: 0.2, coachingCue: "Drive up without shrugging forward." }),
    prefixVariant("Decline", { when: (seed) => equipmentHas(seed, "bench"), metDelta: 0.2, coachingCue: "Stay anchored and control the descent." }),
    prefixVariant("Dead-Stop", { metDelta: 0.3, coachingCue: "Reset tension on every rep instead of bouncing." }),
    prefixVariant("Floor", { when: (seed) => equipmentHas(seed, "dumbbells") || equipmentHas(seed, "barbell"), metDelta: 0.1, coachingCue: "Let the floor limit the range while you keep tension." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the extra half rep to extend pressing tension." }),
    prefixVariant("Spoto", { when: (seed) => seed.name.toLowerCase().includes("bench"), metDelta: 0.3, difficultyShift: 1, coachingCue: "Hover just above the chest and own the pause." }),
  ],
  push_bodyweight: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Take three counts down and keep the body rigid." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Hover just above the floor without losing tension." }),
    prefixVariant("Incline", { equipmentAdd: ["bench"], metDelta: -0.2, difficultyShift: -1, coachingCue: "Use the elevation to keep shoulder mechanics clean." }),
    prefixVariant("Decline", { equipmentAdd: ["bench"], metDelta: 0.3, difficultyShift: 1, coachingCue: "Keep the ribs down as the leverage gets harder." }),
    prefixVariant("Hand-Release", { metDelta: 0.2, coachingCue: "Reset each rep from a dead stop." }),
    prefixVariant("Spiderman", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Drive the knee up while the trunk stays square." }),
    prefixVariant("Close-Grip", { metDelta: 0.2, coachingCue: "Keep the elbows close and finish through triceps." }),
    prefixVariant("Explosive", { metDelta: 0.6, difficultyShift: 1, coachingCue: "Push the floor away hard and land soft." }),
    suffixVariant("With Shoulder Tap", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Minimize hip sway between taps." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Stay long through the spine on the extra half rep." }),
    prefixVariant("Archer", { metDelta: 0.5, difficultyShift: 1, coachingCue: "Bias one arm while the other assists smoothly." }),
    prefixVariant("Weighted", { equipmentAdd: ["weight_plate"], metDelta: 0.5, difficultyShift: 1, coachingCue: "Brace hard so the extra load does not sag the trunk." }),
  ],
  vertical_press: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Own the lowering phase without flaring the ribs." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Pause at forehead height and stay stacked." }),
    prefixVariant("Neutral-Grip", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.1, coachingCue: "Let the shoulders rotate more freely." }),
    prefixVariant("Single-Arm", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.3, difficultyShift: 1, coachingCue: "Fight trunk rotation as one side presses." }),
    prefixVariant("Alternating", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.2, coachingCue: "One bell stays parked while the other moves." }),
    prefixVariant("Seated", { equipmentAdd: ["bench"], metDelta: 0.1, coachingCue: "Remove momentum and keep the ribs quiet." }),
    prefixVariant("Standing", { metDelta: 0.2, coachingCue: "Glutes tight, ribs down, press straight up." }),
    prefixVariant("Half-Kneeling", { metDelta: 0.2, coachingCue: "Use the kneeling stance to own pelvic control." }),
    prefixVariant("Arnold", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.2, coachingCue: "Rotate smoothly and keep tension all the way up." }),
    prefixVariant("Landmine", { equipmentAdd: ["barbell"], metDelta: 0.2, coachingCue: "Press on the arc without shrugging." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the half rep to extend shoulder time under tension." }),
  ],
  pull_vertical: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Lower under full control and keep the shoulders away from the ears." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Hold the top without craning the neck." }),
    prefixVariant("Wide-Grip", { metDelta: 0.2, coachingCue: "Think elbows wide but ribs down." }),
    prefixVariant("Neutral-Grip", { metDelta: 0.1, coachingCue: "Pull elbows toward the ribs on a clean path." }),
    prefixVariant("Weighted", { equipmentAdd: ["weight_plate"], metDelta: 0.5, difficultyShift: 1, coachingCue: "Stay tight through the trunk as load increases." }),
    prefixVariant("Banded", { equipmentAdd: ["resistance_band"], metDelta: -0.1, difficultyShift: -1, coachingCue: "Use assistance without turning the rep sloppy." }),
    prefixVariant("Chest-to-Bar", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Drive the chest high while keeping the ribs controlled." }),
    prefixVariant("Scapular", { metDelta: -0.2, difficultyShift: -1, coachingCue: "Move only through the shoulder blades." }),
    prefixVariant("Towel", { equipmentAdd: ["towel"], metDelta: 0.3, coachingCue: "Crush the grip and keep the shoulders packed." }),
    prefixVariant("Isometric", { metDelta: 0.2, coachingCue: "Hold the sticking point without losing shoulder position." }),
    prefixVariant("Commando", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Keep the torso close and alternate sides cleanly." }),
  ],
  pull_horizontal: [
    prefixVariant("Tempo", { metDelta: 0.3, coachingCue: "Pull smooth, lower slower, and finish by squeezing the mid-back." }),
    prefixVariant("Paused", { metDelta: 0.2, coachingCue: "Pause at full retraction without shrugging." }),
    prefixVariant("Chest-Supported", { equipmentAdd: ["bench"], metDelta: 0.1, coachingCue: "Let the pad remove momentum from the rep." }),
    prefixVariant("Single-Arm", { when: (seed) => equipmentHas(seed, "dumbbells") || equipmentHas(seed, "cable"), metDelta: 0.2, coachingCue: "Pull through the elbow and resist trunk twist." }),
    prefixVariant("Alternating", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.2, coachingCue: "Keep one side stable while the other rows." }),
    prefixVariant("Wide-Grip", { metDelta: 0.2, coachingCue: "Finish by spreading the chest and squeezing rear shoulders." }),
    prefixVariant("Narrow-Grip", { metDelta: 0.1, coachingCue: "Keep elbows tucked and lower ribs quiet." }),
    prefixVariant("Dead-Stop", { metDelta: 0.3, coachingCue: "Reset every rep from the hang or support." }),
    prefixVariant("Seal", { equipmentAdd: ["bench"], metDelta: 0.2, coachingCue: "Stay pinned and remove lower-back help." }),
    prefixVariant("Meadows", { equipmentAdd: ["barbell"], metDelta: 0.3, coachingCue: "Pull long through the lat and keep the hips stable." }),
    suffixVariant("With Reach", { metDelta: 0.1, coachingCue: "Reach at the bottom to let the shoulder blade protract fully." }),
    prefixVariant("Banded", { equipmentAdd: ["resistance_band"], metDelta: 0.1, coachingCue: "Accelerate the squeeze as resistance rises." }),
  ],
  biceps: [
    prefixVariant("Tempo", { metDelta: 0.2, coachingCue: "Lower slowly and keep the elbow quiet." }),
    prefixVariant("Paused", { metDelta: 0.1, coachingCue: "Pause at the top without leaning back." }),
    prefixVariant("Alternating", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.1, coachingCue: "Keep one arm stable while the other works." }),
    prefixVariant("Cross-Body", { when: (seed) => equipmentHas(seed, "dumbbells"), metDelta: 0.1, coachingCue: "Drive across the torso without shoulder roll." }),
    prefixVariant("Concentration", { equipmentAdd: ["bench"], metDelta: 0.1, coachingCue: "Pin the elbow and remove momentum." }),
    prefixVariant("Bayesian", { equipmentAdd: ["cable"], metDelta: 0.2, coachingCue: "Keep tension high in the stretched position." }),
    prefixVariant("Offset", { equipmentAdd: ["dumbbells"], metDelta: 0.1, coachingCue: "Brace the trunk while load distribution changes." }),
    suffixVariant("With 21s", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Use partials plus full reps without losing position." }),
    prefixVariant("Isometric", { metDelta: 0.1, coachingCue: "Hold the mid-range and keep the wrist neutral." }),
    prefixVariant("Reverse-Grip", { metDelta: 0.1, coachingCue: "Let the forearms work without folding at the wrist." }),
    prefixVariant("Drag", { metDelta: 0.1, coachingCue: "Slide the implement up close to the torso." }),
  ],
  triceps: [
    prefixVariant("Tempo", { metDelta: 0.2, coachingCue: "Own the lowering phase and keep the upper arm still." }),
    prefixVariant("Paused", { metDelta: 0.1, coachingCue: "Pause in full extension before returning." }),
    prefixVariant("Single-Arm", { metDelta: 0.2, coachingCue: "Keep the shoulder quiet while one arm works." }),
    prefixVariant("Cross-Body", { when: (seed) => seed.name.toLowerCase().includes("extension"), metDelta: 0.1, coachingCue: "Press across the body without hiking the shoulder." }),
    prefixVariant("Cable", { equipmentAdd: ["cable"], metDelta: 0.1, coachingCue: "Keep tension on the rope or bar through the full path." }),
    prefixVariant("Rope", { equipmentAdd: ["cable"], metDelta: 0.1, coachingCue: "Separate the ends only as far as the shoulder stays packed." }),
    prefixVariant("Overhead", { metDelta: 0.2, coachingCue: "Stay stacked so the ribs do not flare." }),
    suffixVariant("With Iso Hold", { metDelta: 0.1, coachingCue: "Hold full extension and squeeze hard." }),
    suffixVariant("With 1.5 Reps", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Use the half rep to extend triceps tension." }),
    prefixVariant("Kickback", { equipmentAdd: ["dumbbells"], metDelta: 0.1, coachingCue: "Keep the elbow high and fixed." }),
    prefixVariant("Close-Grip", { metDelta: 0.1, coachingCue: "Tuck the elbows and finish strong." }),
  ],
  shoulder_isolation: [
    prefixVariant("Tempo", { metDelta: 0.1, coachingCue: "Lead with the elbows and lower under control." }),
    prefixVariant("Paused", { metDelta: 0.1, coachingCue: "Pause near peak height without shrugging." }),
    prefixVariant("Partial-To-Full", { metDelta: 0.2, coachingCue: "Use short reps first, then finish with clean full range." }),
    prefixVariant("Lean-Away", { metDelta: 0.2, difficultyShift: 1, coachingCue: "Use the angle to increase the bottom-range challenge." }),
    prefixVariant("Seated", { equipmentAdd: ["bench"], metDelta: 0.1, coachingCue: "Remove momentum and keep the ribs quiet." }),
    prefixVariant("Standing", { metDelta: 0.1, coachingCue: "Soft knees, tall posture, strict motion." }),
    prefixVariant("Alternating", { metDelta: 0.1, coachingCue: "One side works while the other holds position." }),
    prefixVariant("Mechanical Drop", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Shift leverage only after strict reps slow down." }),
    prefixVariant("Scaption", { metDelta: 0.1, coachingCue: "Lift slightly forward of the body for shoulder-friendly range." }),
    suffixVariant("With Iso Hold", { metDelta: 0.1, coachingCue: "Own the top for one full breath." }),
  ],
  core_static: [
    prefixVariant("Weighted", { equipmentAdd: ["weight_plate"], metDelta: 0.3, difficultyShift: 1, coachingCue: "Keep the trunk neutral despite the added load." }),
    prefixVariant("Tempo", { metDelta: 0.1, coachingCue: "Breathe behind the brace instead of rushing." }),
    prefixVariant("Long-Lever", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Reach long through the limbs without losing the ribs." }),
    prefixVariant("Bear", { metDelta: 0.2, coachingCue: "Float the knees and keep the spine steady." }),
    prefixVariant("Reach", { metDelta: 0.2, coachingCue: "Reach one arm or leg slowly without shifting." }),
    prefixVariant("Alternating-Lift", { metDelta: 0.2, coachingCue: "Own each lift without pelvic sway." }),
    prefixVariant("Staggered", { metDelta: 0.1, coachingCue: "Use the offset stance to challenge anti-rotation." }),
    prefixVariant("RKC", { metDelta: 0.2, coachingCue: "Pull elbows and toes toward each other to crank up tension." }),
    prefixVariant("Elevated", { equipmentAdd: ["bench"], metDelta: -0.1, difficultyShift: -1, coachingCue: "Use height to keep the brace manageable." }),
    prefixVariant("Body-Saw", { equipmentAdd: ["sliders"], metDelta: 0.3, difficultyShift: 1, coachingCue: "Glide only as far as the trunk stays solid." }),
  ],
  core_dynamic: [
    prefixVariant("Tempo", { metDelta: 0.1, coachingCue: "Move slower than you want and keep the low back quiet." }),
    prefixVariant("Paused", { metDelta: 0.1, coachingCue: "Pause where the abs have to work hardest." }),
    prefixVariant("Weighted", { equipmentAdd: ["weight_plate"], metDelta: 0.2, difficultyShift: 1, coachingCue: "Add load only if the trunk position stays clean." }),
    prefixVariant("Cross-Body", { metDelta: 0.2, coachingCue: "Rotate from the ribcage rather than the neck." }),
    prefixVariant("Hollow", { metDelta: 0.2, coachingCue: "Posteriorly tilt the pelvis and keep the ribs down." }),
    suffixVariant("With Iso Hold", { metDelta: 0.1, coachingCue: "Freeze the hardest point before completing the rep." }),
    prefixVariant("Slow-Eccentric", { metDelta: 0.2, coachingCue: "Lower under control and resist gravity." }),
    prefixVariant("Alternating", { metDelta: 0.1, coachingCue: "Use alternating limbs to keep the trunk stable." }),
    prefixVariant("Pulse", { metDelta: 0.2, coachingCue: "Stay in the loaded mid-range without momentum." }),
    prefixVariant("Extended-Range", { metDelta: 0.2, difficultyShift: 1, coachingCue: "Use the extra reach only while spinal position stays solid." }),
  ],
  hiit: [
    prefixVariant("Power", { metDelta: 0.5, difficultyShift: 1, coachingCue: "Treat every work interval like a sprint with clean mechanics." }),
    prefixVariant("Tempo", { metDelta: 0.2, coachingCue: "Stay smooth so the pace holds across the set." }),
    prefixVariant("Low-Impact", { metDelta: -0.3, difficultyShift: -1, coachingCue: "Keep the heart rate up without pounding the joints." }),
    prefixVariant("Reactive", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Respond quickly while keeping positions organized." }),
    prefixVariant("Ladder", { metDelta: 0.2, coachingCue: "Let the interval length rise without losing form." }),
    prefixVariant("Endurance", { metDelta: 0.2, coachingCue: "Leave a little room early so the last round stays sharp." }),
    prefixVariant("Sprint", { metDelta: 0.5, difficultyShift: 1, coachingCue: "Go hard, recover enough, then repeat with intent." }),
    prefixVariant("Lateral", { metDelta: 0.2, coachingCue: "Stay athletic through side-to-side changes." }),
    prefixVariant("Athlete's", { metDelta: 0.3, coachingCue: "Move like a drill, not a survival session." }),
    prefixVariant("Contrast", { metDelta: 0.3, coachingCue: "Alternate fast efforts and strong positions cleanly." }),
  ],
  cardio: [
    prefixVariant("Tempo", { metDelta: 0.2, coachingCue: "Find a pace you can repeat without posture breaking down." }),
    prefixVariant("Endurance", { metDelta: 0.2, coachingCue: "Stay smooth and keep the breath under control." }),
    prefixVariant("Interval", { metDelta: 0.3, coachingCue: "Push the work block, then let the recovery set the next rep up." }),
    prefixVariant("Steady-State", { metDelta: -0.1, difficultyShift: -1, coachingCue: "Settle into repeatable rhythm rather than chasing spikes." }),
    prefixVariant("Ladder", { metDelta: 0.2, coachingCue: "Let the pace rise in steps, not chaos." }),
    prefixVariant("Power", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Drive harder through each contact or pull." }),
    prefixVariant("Recovery", { metDelta: -0.2, difficultyShift: -1, coachingCue: "Keep blood moving without forcing the pace." }),
    prefixVariant("Incline", { when: (seed) => equipmentHas(seed, "treadmill"), metDelta: 0.3, coachingCue: "Lean slightly forward from the ankles, not the hips." }),
    prefixVariant("Cadence", { metDelta: 0.1, coachingCue: "Use quick, clean contacts instead of overstriding." }),
    prefixVariant("Surge", { metDelta: 0.3, coachingCue: "Insert short speed bursts while the form stays composed." }),
  ],
  mobility: [
    prefixVariant("Dynamic", { metDelta: 0.1, coachingCue: "Move in and out of the range with calm control." }),
    prefixVariant("Assisted", { equipmentAdd: ["resistance_band"], metDelta: 0.1, coachingCue: "Use support to own a cleaner line, not to yank deeper." }),
    prefixVariant("Loaded", { equipmentAdd: ["dumbbells"], metDelta: 0.2, difficultyShift: 1, coachingCue: "Own the position under light load and full control." }),
    prefixVariant("Wall-Supported", { equipmentAdd: ["wall"], metDelta: -0.1, difficultyShift: -1, coachingCue: "Use support to organize the shape before adding range." }),
    prefixVariant("Rotation", { metDelta: 0.1, coachingCue: "Rotate where you want mobility, not where you compensate." }),
    prefixVariant("Pulse", { metDelta: 0.1, coachingCue: "Use short, easy pulses around the edge of the range." }),
    prefixVariant("Breath-Led", { metDelta: -0.1, coachingCue: "Exhale into the range and let tension drop." }),
    prefixVariant("Contract-Relax", { metDelta: 0.1, coachingCue: "Create light tension first, then move deeper with the exhale." }),
  ],
  recovery: [
    prefixVariant("Slow", { metDelta: -0.1, coachingCue: "Let the tissue relax rather than forcing pressure." }),
    prefixVariant("Targeted", { metDelta: 0.1, coachingCue: "Stay on the intended tissue instead of rolling everywhere." }),
    prefixVariant("Breath-Led", { metDelta: -0.1, coachingCue: "Use long exhales to let tone drop." }),
    prefixVariant("Supported", { equipmentAdd: ["bench"], metDelta: -0.1, coachingCue: "Use props so the body can actually relax." }),
    prefixVariant("Reset", { metDelta: 0.0, coachingCue: "Treat this as tissue quality work, not conditioning." }),
    prefixVariant("Decompression", { metDelta: -0.1, coachingCue: "Move slowly enough for the nervous system to downshift." }),
    prefixVariant("Release", { metDelta: 0.0, coachingCue: "Stay on the line of tissue until pressure feels workable." }),
    prefixVariant("Extended", { metDelta: 0.1, coachingCue: "Use more time only while the work still feels restorative." }),
  ],
  sport: [
    prefixVariant("Reactive", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Respond quickly but finish every landing clean." }),
    prefixVariant("Rotational", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Turn through the hips and trunk, not the knees." }),
    prefixVariant("Power", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Max effort on the concentric, soft control on the landing." }),
    prefixVariant("Stick-Landing", { metDelta: 0.2, coachingCue: "Own the finish before the next rep starts." }),
    prefixVariant("Sprint-Start", { metDelta: 0.3, coachingCue: "Explode from the first push without losing shin angle." }),
    prefixVariant("Single-Leg", { metDelta: 0.4, difficultyShift: 1, coachingCue: "Use the unilateral demand to sharpen hip and ankle control." }),
    prefixVariant("Contrast", { metDelta: 0.3, coachingCue: "Alternate power and control without letting quality drop." }),
    prefixVariant("Lateral", { metDelta: 0.2, coachingCue: "Push wide and absorb the landing cleanly." }),
    prefixVariant("Rebound", { metDelta: 0.3, coachingCue: "Use the floor contact like a spring, not a crash." }),
    prefixVariant("Vertical", { metDelta: 0.3, coachingCue: "Project up fast and land even faster under control." }),
  ],
  calves: [
    prefixVariant("Tempo", { metDelta: 0.1, coachingCue: "Lower slowly and keep full foot pressure." }),
    prefixVariant("Paused", { metDelta: 0.1, coachingCue: "Hold the top for one second every rep." }),
    prefixVariant("Single-Leg", { metDelta: 0.2, difficultyShift: 1, coachingCue: "Own one ankle at a time without rolling the foot." }),
    prefixVariant("Explosive", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Drive tall quickly and lower under control." }),
    prefixVariant("Seated", { equipmentAdd: ["bench"], metDelta: 0.1, coachingCue: "Let the bent knee bias the soleus cleanly." }),
    prefixVariant("Deficit", { equipmentAdd: ["bench"], metDelta: 0.2, coachingCue: "Use the longer range without bouncing off the bottom." }),
    prefixVariant("Pulse", { metDelta: 0.2, coachingCue: "Stay in the upper range and keep the calf loaded." }),
    prefixVariant("Isometric", { metDelta: 0.1, coachingCue: "Freeze the top and breathe behind the tension." }),
    prefixVariant("Toe-In", { metDelta: 0.1, coachingCue: "Keep the movement smooth; do not torque the knees." }),
    prefixVariant("Toe-Out", { metDelta: 0.1, coachingCue: "Use the angle lightly and stay balanced over the foot." }),
  ],
  carry: [
    prefixVariant("Heavy", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Walk tall and do not let the load fold the ribs." }),
    prefixVariant("Suitcase", { metDelta: 0.2, coachingCue: "Fight side bend on every step." }),
    prefixVariant("Marching", { metDelta: 0.2, coachingCue: "Lift each knee without shifting the pelvis." }),
    prefixVariant("Overhead", { metDelta: 0.3, difficultyShift: 1, coachingCue: "Stack the arm and keep the ribs quiet." }),
    prefixVariant("Front-Rack", { metDelta: 0.2, coachingCue: "Keep the elbows slightly forward and trunk braced." }),
    prefixVariant("Offset", { metDelta: 0.2, coachingCue: "Own asymmetry without twisting." }),
    prefixVariant("Tempo", { metDelta: 0.1, coachingCue: "Use deliberate steps and full foot pressure." }),
    prefixVariant("Lateral", { metDelta: 0.2, coachingCue: "Stay square as you move side to side." }),
    prefixVariant("Endurance", { metDelta: 0.1, coachingCue: "Hold posture for the full walk, not just the first steps." }),
    prefixVariant("Power", { metDelta: 0.2, coachingCue: "Move with purpose but keep the line clean." }),
  ],
};
const WORKOUT_ARCHETYPES: WorkoutArchetype[] = [
  {
    id: "lower_body_power",
    name: "Lower Body Power",
    category: "strength",
    focusMuscles: ["quads", "glutes", "hamstrings", "core"],
    patterns: ["squat", "hinge", "single-leg strength", "hip extension", "ankle stiffness", "anti-extension"],
    benefits: ["Explosive lower-body strength", "Hip and knee control", "Posterior-chain force transfer"],
    goalTags: ["build_muscle", "power", "athletic_performance"],
    coverQuote: "Build force from the floor up.",
    coachNotes: ["Stay tall through the trunk.", "Use full-foot pressure on every lower-body rep.", "Earn speed through control first."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 26, format: "circuit", suffix: "Home Base" },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 38, format: "sets_reps", suffix: "Dumbbell Drive", featured: true },
      { difficulty: "advanced", profile: "barbell", durationMinutes: 48, format: "sets_reps", suffix: "Barbell Forge" },
    ],
  },
  {
    id: "upper_push_volume",
    name: "Upper Push Volume",
    category: "strength",
    focusMuscles: ["chest", "front_delts", "triceps", "side_delts"],
    patterns: ["horizontal push", "vertical push", "shoulder control", "elbow extension", "anti-extension"],
    benefits: ["Pressing hypertrophy", "Shoulder balance", "Triceps lockout strength"],
    goalTags: ["upper_body_strength", "build_muscle", "pressing_power"],
    coverQuote: "Press clean. Press proud.",
    coachNotes: ["Keep the ribs stacked.", "Let the shoulder blade move, not the neck.", "Tempo beats momentum."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 24, format: "circuit", suffix: "Bodyweight Pump" },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 36, format: "sets_reps", suffix: "Press Session", featured: true },
      { difficulty: "advanced", profile: "barbell", durationMinutes: 46, format: "superset", suffix: "Power Stack" },
    ],
  },
  {
    id: "pull_strength_matrix",
    name: "Pull Strength Matrix",
    category: "strength",
    focusMuscles: ["lats", "back", "rhomboids", "biceps"],
    patterns: ["vertical pull", "row", "elbow flexion", "shoulder control", "anti-extension"],
    benefits: ["Upper-back density", "Grip and elbow strength", "Posture support"],
    goalTags: ["back_strength", "posture", "upper_body_strength"],
    coverQuote: "Own the squeeze behind the body.",
    coachNotes: ["Lead with the elbows.", "Keep the neck long.", "Let the back finish the rep."],
    variants: [
      { difficulty: "beginner", profile: "dumbbell", durationMinutes: 28, format: "sets_reps", suffix: "Home Pull" },
      { difficulty: "intermediate", profile: "gym", durationMinutes: 40, format: "sets_reps", suffix: "Back Builder", featured: true },
      { difficulty: "advanced", profile: "barbell", durationMinutes: 50, format: "superset", suffix: "Strength Matrix" },
    ],
  },
  {
    id: "core_control",
    name: "Core Control",
    category: "core",
    focusMuscles: ["core", "obliques", "transverse_abdominis", "lower_abs"],
    patterns: ["anti-extension", "trunk flexion and rotation", "anti-extension", "trunk flexion and rotation", "anti-extension"],
    benefits: ["Bracing strength", "Lower-ab control", "Spine resilience"],
    goalTags: ["core_strength", "spine_stability", "injury_resilience"],
    coverQuote: "A stronger center sharpens everything else.",
    coachNotes: ["Breathe behind the brace.", "Move from the trunk, not the neck.", "Keep the pelvis organized."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 20, format: "circuit", suffix: "Reset 20", featured: true },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 26, format: "circuit", suffix: "Loaded Control" },
      { difficulty: "advanced", profile: "gym", durationMinutes: 30, format: "emom", suffix: "Anti-Extension Lab" },
    ],
  },
  {
    id: "hiit_blast",
    name: "HIIT Blast",
    category: "hiit",
    focusMuscles: ["full_body", "core", "calves", "quads"],
    patterns: ["metabolic conditioning", "metabolic conditioning", "aerobic conditioning", "metabolic conditioning", "athletic power"],
    benefits: ["Short high-output conditioning", "Repeat-effort capacity", "Fast calorie burn"],
    goalTags: ["fat_loss", "conditioning", "work_capacity"],
    coverQuote: "Short work. Serious intent.",
    coachNotes: ["Keep the intervals sharp.", "Land quietly.", "Stop the round before form falls apart."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 16, format: "tabata", suffix: "Starter" },
      { difficulty: "intermediate", profile: "bodyweight", durationMinutes: 18, format: "tabata", suffix: "Blast", featured: true },
      { difficulty: "advanced", profile: "gym", durationMinutes: 24, format: "emom", suffix: "Engine Room" },
    ],
  },
  {
    id: "cardio_engine",
    name: "Cardio Engine",
    category: "cardio",
    focusMuscles: ["calves", "quads", "hamstrings", "core"],
    patterns: ["aerobic conditioning", "aerobic conditioning", "aerobic conditioning", "metabolic conditioning"],
    benefits: ["Aerobic base", "Better recovery between hard efforts", "Heart-health support"],
    goalTags: ["endurance", "heart_health", "conditioning"],
    coverQuote: "Build the engine that carries the week.",
    coachNotes: ["Find rhythm early.", "Relax the shoulders.", "Let the pace rise only if posture stays clean."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 22, format: "for_time", suffix: "Move More" },
      { difficulty: "intermediate", profile: "gym", durationMinutes: 32, format: "for_time", suffix: "Rush", featured: true },
      { difficulty: "advanced", profile: "gym", durationMinutes: 40, format: "running", suffix: "Threshold Builder" },
    ],
  },
  {
    id: "recovery_reset",
    name: "Recovery Reset",
    category: "recovery",
    focusMuscles: ["hip_flexors", "glutes", "hamstrings", "lower_back"],
    patterns: ["mobility", "mobility", "mobility", "tissue recovery", "tissue recovery"],
    benefits: ["Lower stiffness", "Faster downshift", "Improve next-session readiness"],
    goalTags: ["recovery", "mobility", "readiness"],
    coverQuote: "Recover on purpose so tomorrow moves better.",
    coachNotes: ["Breathe slower than you think you need.", "Nothing here should feel like punishment.", "Leave the session looser, not drained."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 18, format: "timed", suffix: "No Gear" },
      { difficulty: "intermediate", profile: "recovery", durationMinutes: 24, format: "timed", suffix: "Reset", featured: true },
      { difficulty: "advanced", profile: "recovery", durationMinutes: 28, format: "timed", suffix: "Restore Plus" },
    ],
  },
  {
    id: "sport_explosive",
    name: "Sport Explosive Power",
    category: "sport",
    focusMuscles: ["glutes", "quads", "calves", "core"],
    patterns: ["athletic power", "athletic power", "athletic power", "single-leg strength", "metabolic conditioning"],
    benefits: ["Rate of force development", "Landing control", "Reactive power"],
    goalTags: ["athleticism", "speed", "explosiveness"],
    coverQuote: "Explode with control or it does not count.",
    coachNotes: ["Full recovery between explosive sets.", "Stick the landing.", "Quality first, height second."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 24, format: "circuit", suffix: "Field Base" },
      { difficulty: "intermediate", profile: "gym", durationMinutes: 34, format: "circuit", suffix: "Explosive Power", featured: true },
      { difficulty: "advanced", profile: "gym", durationMinutes: 42, format: "superset", suffix: "Reactive Force" },
    ],
  },
  {
    id: "glute_builder",
    name: "Glute Builder",
    category: "strength",
    focusMuscles: ["glutes", "hamstrings", "core"],
    patterns: ["hip extension", "single-leg strength", "hinge", "ankle stiffness", "anti-extension"],
    benefits: ["Glute growth", "Hip stability", "Posterior-chain support"],
    goalTags: ["glute_strength", "build_muscle", "posture"],
    coverQuote: "Strong hips change how everything else feels.",
    coachNotes: ["Finish with the glutes, not the low back.", "Own single-leg control.", "Use the pause at lockout."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 24, format: "circuit", suffix: "Foundation" },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 34, format: "sets_reps", suffix: "Drive", featured: true },
      { difficulty: "advanced", profile: "barbell", durationMinutes: 44, format: "sets_reps", suffix: "Forge" },
    ],
  },
  {
    id: "shoulder_armor",
    name: "Shoulder Armor",
    category: "strength",
    focusMuscles: ["front_delts", "side_delts", "rear_delts", "rotator_cuff"],
    patterns: ["vertical push", "shoulder control", "shoulder control", "horizontal push", "anti-extension"],
    benefits: ["Better shoulder balance", "Pressing support", "Long-term joint tolerance"],
    goalTags: ["shoulder_strength", "shoulder_health", "hypertrophy"],
    coverQuote: "Healthy shoulders earn heavy work.",
    coachNotes: ["Keep the neck relaxed.", "Let the scapula move cleanly.", "Chase quality over weight here."],
    variants: [
      { difficulty: "beginner", profile: "dumbbell", durationMinutes: 24, format: "circuit", suffix: "Starter" },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 32, format: "superset", suffix: "Armor", featured: true },
      { difficulty: "advanced", profile: "gym", durationMinutes: 40, format: "superset", suffix: "Stability Stack" },
    ],
  },
  {
    id: "beginner_foundation",
    name: "Beginner Foundation",
    category: "strength",
    focusMuscles: ["quads", "chest", "glutes", "core"],
    patterns: ["squat", "horizontal push", "single-leg strength", "vertical push", "anti-extension"],
    benefits: ["Movement confidence", "Total-body strength base", "Lower-risk learning volume"],
    goalTags: ["general_fitness", "beginner_strength", "movement_quality"],
    coverQuote: "Own the basics and the future opens up.",
    coachNotes: ["Choose the version you can repeat well.", "Every clean rep is progress.", "Leave one or two reps in the tank."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 22, format: "circuit", suffix: "Bodyweight" },
      { difficulty: "beginner", profile: "dumbbell", durationMinutes: 30, format: "sets_reps", suffix: "Dumbbell Base", featured: true },
      { difficulty: "intermediate", profile: "dumbbell", durationMinutes: 36, format: "sets_reps", suffix: "Next Step" },
    ],
  },
  {
    id: "mobility_flow",
    name: "Mobility Flow",
    category: "flexibility",
    focusMuscles: ["hip_flexors", "hamstrings", "glutes", "calves"],
    patterns: ["mobility", "mobility", "mobility", "mobility", "anti-extension"],
    benefits: ["Better range of motion", "Cleaner lifting positions", "Lower stiffness"],
    goalTags: ["mobility", "recovery", "movement_quality"],
    coverQuote: "Range you can control is range you can use.",
    coachNotes: ["Never force a pinching joint.", "Use the exhale to unlock range.", "Let positions feel cleaner, not harder."],
    variants: [
      { difficulty: "beginner", profile: "bodyweight", durationMinutes: 16, format: "timed", suffix: "Quick Flow" },
      { difficulty: "intermediate", profile: "bodyweight", durationMinutes: 22, format: "timed", suffix: "Daily Flow", featured: true },
      { difficulty: "advanced", profile: "recovery", durationMinutes: 28, format: "timed", suffix: "Loaded Flow" },
    ],
  },
];

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function clampMet(value: number) {
  return Math.max(1.5, Math.round(value * 10) / 10);
}

function shiftDifficulty(current: WorkoutDifficulty, shift: -1 | 0 | 1 = 0): WorkoutDifficulty {
  const index = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, Math.max(0, index + shift))];
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickByHash<T>(items: T[], key: string) {
  return items[hashString(key) % items.length] ?? items[0];
}

function formatMuscleList(muscles: string[]) {
  if (muscles.length === 0) {
    return "whole-body support";
  }
  return muscles.map(titleCase).join(", ");
}

function describeMuscles(muscles: string[]) {
  if (muscles.length === 0) {
    return "global stabilizers";
  }
  return muscles
    .slice(0, 3)
    .map((muscle) => `${titleCase(muscle)} for ${MUSCLE_ROLE_LABELS[muscle] ?? "movement support"}`)
    .join("; ");
}

function buildDescription(seed: SeedExercise) {
  const equipmentLabel = seed.equipment.length > 0 ? seed.equipment.map(titleCase).join(", ") : "bodyweight";
  return `${seed.name} is a ${seed.category} exercise built around ${MOVEMENT_PATTERN_BY_GROUP[seed.variantGroup]}. It emphasizes ${formatMuscleList(seed.musclePrimary)} while ${formatMuscleList(seed.muscleSecondary)} stabilize the pattern. This variation fits ${equipmentLabel} training and is useful when the goal is ${GROUP_GOAL_TAGS[seed.variantGroup].slice(0, 2).join(" plus ")}.`;
}

function buildAnatomyFocus(seed: SeedExercise) {
  return `Primary driver: ${describeMuscles(seed.musclePrimary)}. Secondary support: ${describeMuscles(seed.muscleSecondary)}. Anatomically, the set teaches the body to produce force through ${MOVEMENT_PATTERN_BY_GROUP[seed.variantGroup]} without leaking tension through weaker links.`;
}

function buildBenefits(seed: SeedExercise) {
  return unique([
    ...(GROUP_BENEFIT_SNIPPETS[seed.variantGroup] ?? []).slice(0, 2),
    `Directly challenges ${formatMuscleList(seed.musclePrimary)} with a ${seed.difficulty} difficulty demand.`,
  ]).slice(0, 3);
}

function buildMedicalConsiderations(seed: SeedExercise) {
  return (GROUP_MEDICAL_SNIPPETS[seed.variantGroup] ?? []).slice(0, 3);
}

function buildMotivationQuote(seed: SeedExercise) {
  return pickByHash(GROUP_QUOTES[seed.variantGroup] ?? ["Stay sharp and keep moving."], seed.name);
}

function buildProgressions(seed: SeedExercise) {
  return (GROUP_PROGRESSIONS[seed.variantGroup] ?? []).slice(0, 2);
}

function buildRegressions(seed: SeedExercise) {
  return (GROUP_REGRESSIONS[seed.variantGroup] ?? []).slice(0, 2);
}

function buildExercise(seed: SeedExercise, isVariant: boolean): Exercise {
  return {
    id: seed.id,
    name: seed.name,
    isVariant,
    category: seed.category,
    musclePrimary: seed.musclePrimary,
    muscleSecondary: seed.muscleSecondary,
    equipment: seed.equipment,
    difficulty: seed.difficulty,
    animationKey: seed.animationKey,
    met: seed.met,
    coachingCues: unique(seed.coachingCues ?? []).slice(0, 4),
    description: buildDescription(seed),
    movementPattern: MOVEMENT_PATTERN_BY_GROUP[seed.variantGroup],
    anatomyFocus: buildAnatomyFocus(seed),
    benefits: buildBenefits(seed),
    setImpact: GROUP_SET_IMPACT[seed.variantGroup],
    medicalConsiderations: buildMedicalConsiderations(seed),
    progressions: buildProgressions(seed),
    regressions: buildRegressions(seed),
    motivationQuote: buildMotivationQuote(seed),
    goalTags: unique([seed.category, ...seed.musclePrimary, ...GROUP_GOAL_TAGS[seed.variantGroup]]),
  };
}

function prefixVariant(
  prefix: string,
  options: Omit<VariantSpec, "buildName"> = {},
): VariantSpec {
  return {
    ...options,
    buildName: (seed) => `${prefix} ${seed.name}`,
  };
}

function suffixVariant(
  suffix: string,
  options: Omit<VariantSpec, "buildName"> = {},
): VariantSpec {
  return {
    ...options,
    buildName: (seed) => `${seed.name} ${suffix}`,
  };
}

function equipmentHas(seed: SeedExercise, item: string) {
  return seed.equipment.includes(item);
}

function buildVariant(seed: SeedExercise, spec: VariantSpec): SeedExercise {
  return {
    ...seed,
    id: `${seed.id}_${slugify(spec.buildName(seed))}`,
    name: spec.buildName(seed),
    equipment: unique(spec.equipmentOverride ?? [...seed.equipment, ...(spec.equipmentAdd ?? [])]),
    difficulty: shiftDifficulty(seed.difficulty, spec.difficultyShift ?? 0),
    met: clampMet(seed.met + (spec.metDelta ?? 0)),
    muscleSecondary: unique([...seed.muscleSecondary, ...(spec.muscleSecondaryAdd ?? [])]),
    coachingCues: unique([...(seed.coachingCues ?? []), ...(spec.coachingCue ? [spec.coachingCue] : [])]),
  };
}

const generatedExercises: Exercise[] = [];
const seenExerciseNames = new Set<string>();

for (const seed of SEED_EXERCISES) {
  if (!seenExerciseNames.has(seed.name.toLowerCase())) {
    generatedExercises.push(buildExercise(seed, false));
    seenExerciseNames.add(seed.name.toLowerCase());
  }

  for (const variantSpec of VARIANT_LIBRARY[seed.variantGroup]) {
    if (variantSpec.when && !variantSpec.when(seed)) {
      continue;
    }

    const variant = buildVariant(seed, variantSpec);
    const normalized = variant.name.toLowerCase();
    if (seenExerciseNames.has(normalized)) {
      continue;
    }

    generatedExercises.push(buildExercise(variant, true));
    seenExerciseNames.add(normalized);
  }
}

const EXERCISE_LIBRARY = generatedExercises.sort((left, right) => left.name.localeCompare(right.name));
const EXERCISE_BY_NAME = new Map(EXERCISE_LIBRARY.map((exercise) => [exercise.name.toLowerCase(), exercise]));

function isDifficultyCompatible(exercise: Exercise, difficulty: WorkoutDifficulty) {
  return DIFFICULTY_ORDER.indexOf(exercise.difficulty) <= DIFFICULTY_ORDER.indexOf(difficulty);
}

function isEquipmentCompatible(exercise: Exercise, profile: EquipmentProfile) {
  const available = PROFILE_EQUIPMENT[profile];
  return exercise.equipment.every((item) => available.includes(item));
}

function scoreExerciseCandidate(
  exercise: Exercise,
  focusMuscles: string[],
  pattern: string,
  difficulty: WorkoutDifficulty,
  profile: EquipmentProfile,
) {
  let score = 0;
  if (exercise.movementPattern === pattern) {
    score += 4;
  }
  score += exercise.musclePrimary.filter((muscle) => focusMuscles.includes(muscle)).length * 2;
  score += exercise.muscleSecondary.filter((muscle) => focusMuscles.includes(muscle)).length;
  score += isDifficultyCompatible(exercise, difficulty) ? 2 : -2;
  score += isEquipmentCompatible(exercise, profile) ? 2 : -4;
  score += exercise.isVariant ? 0.5 : 1.5;
  return score;
}

function pickExercise(
  focusMuscles: string[],
  pattern: string,
  difficulty: WorkoutDifficulty,
  profile: EquipmentProfile,
  excludeIds: Set<string>,
) {
  const candidate = EXERCISE_LIBRARY
    .filter((exercise) => !excludeIds.has(exercise.id))
    .filter((exercise) => isEquipmentCompatible(exercise, profile))
    .sort((left, right) => {
      const rightScore = scoreExerciseCandidate(right, focusMuscles, pattern, difficulty, profile);
      const leftScore = scoreExerciseCandidate(left, focusMuscles, pattern, difficulty, profile);
      return rightScore - leftScore;
    })
    .find((exercise) => exercise.movementPattern === pattern || scoreExerciseCandidate(exercise, focusMuscles, pattern, difficulty, profile) >= 3);

  if (!candidate) {
    throw new Error(`Unable to build workout. Missing candidate for pattern "${pattern}" and profile "${profile}".`);
  }

  excludeIds.add(candidate.id);
  return candidate;
}

function buildStimulusNote(exercise: Exercise, sets: number, reps: string, restSeconds: number) {
  const primary = formatMuscleList(exercise.musclePrimary);
  return `${sets} sets of ${reps} with ${restSeconds}s rest keep ${primary} under enough tension to improve ${exercise.goalTags.slice(0, 2).join(" and ")} while preserving technique quality.`;
}

function buildWorkoutExercise(
  exercise: Exercise,
  sets: number,
  reps: string,
  restSeconds: number,
  order: number,
  suggestedLoad?: string,
): WorkoutExerciseTemplate {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets,
    reps,
    restSeconds,
    order,
    animationKey: exercise.animationKey,
    cue: exercise.coachingCues[0],
    suggestedLoad,
    stimulusNote: buildStimulusNote(exercise, sets, reps, restSeconds),
  };
}

function getScheme(pattern: string, difficulty: WorkoutDifficulty, category: WorkoutCategory) {
  if (category === "cardio") {
    return {
      sets: difficulty === "advanced" ? 6 : difficulty === "intermediate" ? 5 : 4,
      reps: difficulty === "advanced" ? "75s" : "60s",
      restSeconds: difficulty === "advanced" ? 30 : 45,
    };
  }

  if (category === "hiit" || pattern === "metabolic conditioning") {
    return {
      sets: difficulty === "advanced" ? 5 : 4,
      reps: difficulty === "advanced" ? "40s" : "30s",
      restSeconds: difficulty === "advanced" ? 15 : 20,
    };
  }

  if (category === "recovery" || category === "flexibility" || pattern === "mobility" || pattern === "tissue recovery") {
    return {
      sets: 2,
      reps: "45s",
      restSeconds: 15,
    };
  }

  if (pattern === "anti-extension" || pattern === "trunk flexion and rotation") {
    return {
      sets: difficulty === "advanced" ? 4 : 3,
      reps: difficulty === "advanced" ? "12-15" : "10-12",
      restSeconds: 30,
    };
  }

  return {
    sets: difficulty === "advanced" ? 4 : 3,
    reps: difficulty === "advanced" ? "6-8" : difficulty === "intermediate" ? "8-10" : "10-12",
    restSeconds: difficulty === "advanced" ? 90 : 60,
  };
}

function calculateCalories(exercises: WorkoutExerciseTemplate[]) {
  const totalMet = exercises.reduce((sum, item) => sum + (EXERCISE_BY_NAME.get(item.exerciseName.toLowerCase())?.met ?? 4), 0);
  return Math.round(totalMet * 6.5);
}

function buildWorkout(archetype: WorkoutArchetype, variant: WorkoutArchetypeVariant): WorkoutTemplate {
  const usedIds = new Set<string>();
  const exercises = archetype.patterns.map((pattern, index) => {
    const exercise = pickExercise(archetype.focusMuscles, pattern, variant.difficulty, variant.profile, usedIds);
    const scheme = getScheme(pattern, variant.difficulty, archetype.category);
    const suggestedLoad =
      archetype.category === "strength" && exercise.category === "strength"
        ? variant.difficulty === "advanced"
          ? "70-85% effort"
          : variant.difficulty === "intermediate"
            ? "RPE 7-8"
            : "RPE 6-7"
        : undefined;

    return buildWorkoutExercise(exercise, scheme.sets, scheme.reps, scheme.restSeconds, index + 1, suggestedLoad);
  });

  const workoutBenefits = unique([
    ...archetype.benefits,
    ...exercises.flatMap((exercise) => EXERCISE_BY_NAME.get(exercise.exerciseName.toLowerCase())?.benefits ?? []),
  ]).slice(0, 4);
  const workoutMedical = unique(
    exercises.flatMap((exercise) => EXERCISE_BY_NAME.get(exercise.exerciseName.toLowerCase())?.medicalConsiderations ?? []),
  ).slice(0, 4);
  const workoutCoachNotes = unique([
    ...archetype.coachNotes,
    ...exercises.flatMap((exercise) => EXERCISE_BY_NAME.get(exercise.exerciseName.toLowerCase())?.coachingCues ?? []),
  ]).slice(0, 4);

  return {
    id: `${archetype.id}_${slugify(variant.suffix)}`,
    name: `${archetype.name}: ${variant.suffix}`,
    description: `${archetype.name} is a ${variant.durationMinutes}-minute ${variant.difficulty} ${archetype.category} session designed around ${formatMuscleList(archetype.focusMuscles)}. It uses ${variant.profile} constraints to keep the plan realistic while the exercise order layers strength, control, and motivation from first set to last.`,
    category: archetype.category,
    format: variant.format,
    difficulty: variant.difficulty,
    durationMinutes: variant.durationMinutes,
    caloriesEstimate: calculateCalories(exercises),
    muscleGroups: archetype.focusMuscles,
    equipment: unique(exercises.flatMap((exercise) => EXERCISE_BY_NAME.get(exercise.exerciseName.toLowerCase())?.equipment ?? [])),
    exercises,
    rating: Number((4.4 + ((hashString(archetype.id + variant.suffix) % 6) * 0.1)).toFixed(1)),
    timesCompleted: 400 + (hashString(archetype.id + variant.profile + variant.difficulty) % 1800),
    createdAt: WORKOUT_CATALOG_CREATED_AT,
    anatomySummary: `This session mainly drives ${formatMuscleList(archetype.focusMuscles)}. The order is deliberate: early exercises build force, middle slots add tissue-specific volume, and the closing work improves trunk control or conditioning so the user leaves stronger without sloppy fatigue.`,
    intensitySummary:
      variant.difficulty === "advanced"
        ? "High neural and muscular demand. Keep 1-2 reps in reserve on heavy sets and protect technical quality."
        : variant.difficulty === "intermediate"
          ? "Moderate-to-high effort. The work should feel challenging but repeatable across the session."
          : "Moderate effort focused on clean positions, confidence, and recoverable volume.",
    benefits: workoutBenefits,
    medicalConsiderations: workoutMedical,
    coachNotes: workoutCoachNotes,
    recoveryNotes: [
      "Hydrate and take a five-minute downshift walk after the session if heart rate ran high.",
      "Use easy mobility on the main focus tissues within 6-12 hours if stiffness builds.",
      "Progress the next session only when soreness does not change movement quality.",
    ],
    motivationQuote: `${archetype.coverQuote} ${pickByHash(["Stay patient and sharp.", "Quality reps win the day.", "Finish with the same intent you started with."], archetype.id + variant.suffix)}`,
    goalTags: unique([archetype.category, variant.profile, ...archetype.goalTags, ...archetype.focusMuscles]),
    isFeatured: variant.featured,
  };
}

const WORKOUT_TEMPLATES = WORKOUT_ARCHETYPES.flatMap((archetype) => archetype.variants.map((variant) => buildWorkout(archetype, variant)));

const WORKOUT_CATALOG_SUMMARY = {
  exerciseCount: EXERCISE_LIBRARY.length,
  workoutCount: WORKOUT_TEMPLATES.length,
  featuredWorkoutCount: WORKOUT_TEMPLATES.filter((workout) => workout.isFeatured).length,
};

export { EXERCISE_LIBRARY, EXERCISE_BY_NAME, WORKOUT_TEMPLATES, WORKOUT_CATALOG_SUMMARY };

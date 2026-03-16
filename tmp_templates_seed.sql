insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Lower Body Power',
  'Athletic lower-body strength session built for power output, controlled depth, and posterior-chain force.',
  'strength',
  'sets_reps',
  'intermediate',
  45,
  450,
  '{"quads","glutes","hamstrings","core"}'::text[],
  '{"barbell","rack","bench"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Back Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Back Squat') limit 1),'sets',4,'reps','8-10','rest_seconds',90,'order',1,'cue','Chest tall, knees track over toes','modification',null,'suggested_load','60-80% 1RM'),
    jsonb_build_object('exercise_name','Romanian Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Romanian Deadlift') limit 1),'sets',4,'reps','8','rest_seconds',90,'order',2,'cue','Hinge at the hips, keep spine neutral','modification',null,'suggested_load','55-75% 1RM'),
    jsonb_build_object('exercise_name','Forward Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Forward Lunge') limit 1),'sets',3,'reps','10/leg','rest_seconds',60,'order',3,'cue','Step long and stay balanced','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Hip Thrust','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Hip Thrust') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',4,'cue','Drive through heels, full lockout','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Standing Calf Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Standing Calf Raise') limit 1),'sets',3,'reps','15','rest_seconds',45,'order',5,'cue','Pause one second at the top','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','45s','rest_seconds',30,'order',6,'cue','Brace the core, hips level','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.8,
  842,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Upper Push Volume',
  'Chest, shoulders, and triceps hypertrophy with progressive pressing volume and controlled tempo.',
  'strength',
  'sets_reps',
  'intermediate',
  42,
  390,
  '{"chest","shoulders","arms"}'::text[],
  '{"barbell","bench","dumbbells"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bench Press') limit 1),'sets',4,'reps','8','rest_seconds',90,'order',1,'cue','Control descent, explode up','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Shoulder Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Shoulder Press') limit 1),'sets',3,'reps','10','rest_seconds',75,'order',2,'cue','Stack ribs down under the bar','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Push-up','exercise_id',(select id from public.exercises where lower(name)=lower('Push-up') limit 1),'sets',3,'reps','AMRAP','rest_seconds',60,'order',3,'cue','Keep body rigid as one line','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lateral Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Lateral Raise') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',4,'cue','Lift with elbows, not wrists','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Tricep Dip','exercise_id',(select id from public.exercises where lower(name)=lower('Tricep Dip') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',5,'cue','Shoulders down, elbows tucked','modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.7,
  623,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Back And Pull Strength',
  'Posterior-chain and upper-back pulling session to improve strength and posture under load.',
  'strength',
  'sets_reps',
  'intermediate',
  44,
  410,
  '{"back","arms","core"}'::text[],
  '{"barbell","rack","pullup_bar"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Conventional Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Conventional Deadlift') limit 1),'sets',4,'reps','5','rest_seconds',120,'order',1,'cue','Push floor away, keep lats tight','modification',null,'suggested_load','70-85% 1RM'),
    jsonb_build_object('exercise_name','Pull-up','exercise_id',(select id from public.exercises where lower(name)=lower('Pull-up') limit 1),'sets',4,'reps','6-8','rest_seconds',90,'order',2,'cue','Pull elbows to pockets','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Inverted Row','exercise_id',(select id from public.exercises where lower(name)=lower('Inverted Row') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',3,'cue','Pause at the top','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Bicep Curl','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bicep Curl') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',4,'cue','Keep elbows fixed','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Face Pull','exercise_id',(select id from public.exercises where lower(name)=lower('Face Pull') limit 1),'sets',3,'reps','15','rest_seconds',45,'order',5,'cue','Lead with elbows, squeeze rear delts','modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.6,
  401,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Core Control 20',
  '20-minute core stability circuit targeting anti-extension, rotation, and lower-ab strength.',
  'core',
  'circuit',
  'beginner',
  20,
  190,
  '{"core","full_body"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','45s','rest_seconds',20,'order',1,'cue','Press forearms down and brace','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Side Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Side Plank') limit 1),'sets',3,'reps','30s/side','rest_seconds',20,'order',2,'cue','Keep hips stacked','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Russian Twist','exercise_id',(select id from public.exercises where lower(name)=lower('Russian Twist') limit 1),'sets',3,'reps','20','rest_seconds',20,'order',3,'cue','Rotate from ribcage','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lying Leg Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Lying Leg Raise') limit 1),'sets',3,'reps','12','rest_seconds',30,'order',4,'cue','Lower slowly with control','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dead Bug','exercise_id',(select id from public.exercises where lower(name)=lower('Dead Bug') limit 1),'sets',3,'reps','10/side','rest_seconds',20,'order',5,'cue','Keep low back glued to floor','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.5,
  1248,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'HIIT Blast 15',
  'High-intensity intervals for conditioning and calorie burn in under 15 minutes.',
  'hiit',
  'tabata',
  'intermediate',
  15,
  230,
  '{"full_body","core","calves"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Burpee','exercise_id',(select id from public.exercises where lower(name)=lower('Burpee') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',1,'cue','Land soft and stay explosive','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Mountain Climber','exercise_id',(select id from public.exercises where lower(name)=lower('Mountain Climber') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',2,'cue','Drive knees fast, shoulders over wrists','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','High Knees','exercise_id',(select id from public.exercises where lower(name)=lower('High Knees') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',3,'cue','Tall posture, quick contacts','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jumping Jack','exercise_id',(select id from public.exercises where lower(name)=lower('Jumping Jack') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',4,'cue','Snap arms and feet in sync','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.7,
  1602,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'No Equipment Quick 12',
  'Fast bodyweight finisher for busy days with no gear and minimal setup.',
  'strength',
  'circuit',
  'beginner',
  12,
  145,
  '{"full_body","core","quads"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Air Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Air Squat') limit 1),'sets',3,'reps','15','rest_seconds',20,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Push-up','exercise_id',(select id from public.exercises where lower(name)=lower('Push-up') limit 1),'sets',3,'reps','10','rest_seconds',20,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Forward Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Forward Lunge') limit 1),'sets',3,'reps','10/leg','rest_seconds',20,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','30s','rest_seconds',20,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jumping Jack','exercise_id',(select id from public.exercises where lower(name)=lower('Jumping Jack') limit 1),'sets',3,'reps','30s','rest_seconds',20,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.4,
  2201,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Recovery Reset',
  'Low-impact mobility and tissue reset to reduce stiffness and promote recovery.',
  'recovery',
  'timed',
  'beginner',
  22,
  90,
  '{"glutes","hamstrings","core"}'::text[],
  '{"foam_roller"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Hip Flexor Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hip Flexor Stretch') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Hamstring Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hamstring Stretch') limit 1),'sets',2,'reps','45s','rest_seconds',20,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Pigeon Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Pigeon Pose') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Child''s Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Child''s Pose') limit 1),'sets',2,'reps','60s','rest_seconds',20,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Foam Roll Quads','exercise_id',(select id from public.exercises where lower(name)=lower('Foam Roll Quads') limit 1),'sets',2,'reps','60s','rest_seconds',20,'order',5,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Foam Roll IT Band','exercise_id',(select id from public.exercises where lower(name)=lower('Foam Roll IT Band') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',6,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.9,
  918,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Cardio Rush',
  'Steady cardio block with rising pace to keep heart rate in the training zone.',
  'cardio',
  'for_time',
  'beginner',
  30,
  320,
  '{"full_body","calves","quads"}'::text[],
  '{"treadmill"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Sprint (Treadmill)','exercise_id',(select id from public.exercises where lower(name)=lower('Sprint (Treadmill)') limit 1),'sets',5,'reps','90s','rest_seconds',60,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','High Knees','exercise_id',(select id from public.exercises where lower(name)=lower('High Knees') limit 1),'sets',4,'reps','45s','rest_seconds',30,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jump Rope','exercise_id',(select id from public.exercises where lower(name)=lower('Jump Rope') limit 1),'sets',4,'reps','60s','rest_seconds',30,'order',3,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.3,
  557,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Sport Explosive Power',
  'Plyometric sport prep for acceleration, lateral force, and reactive jump quality.',
  'sport',
  'circuit',
  'intermediate',
  35,
  360,
  '{"quads","glutes","calves","core"}'::text[],
  '{"plyo_box","medicine_ball"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Box Step-up','exercise_id',(select id from public.exercises where lower(name)=lower('Box Step-up') limit 1),'sets',3,'reps','10/leg','rest_seconds',45,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Broad Jump','exercise_id',(select id from public.exercises where lower(name)=lower('Broad Jump') limit 1),'sets',4,'reps','6','rest_seconds',60,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lateral Bound','exercise_id',(select id from public.exercises where lower(name)=lower('Lateral Bound') limit 1),'sets',4,'reps','8/side','rest_seconds',45,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Medicine Ball Slam','exercise_id',(select id from public.exercises where lower(name)=lower('Medicine Ball Slam') limit 1),'sets',4,'reps','10','rest_seconds',45,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jump Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Jump Squat') limit 1),'sets',3,'reps','10','rest_seconds',45,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.8,
  384,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Beginner Foundation',
  'Entry-level full-body strength workout focused on pattern quality and confidence.',
  'strength',
  'sets_reps',
  'beginner',
  32,
  260,
  '{"full_body","core","glutes"}'::text[],
  '{"dumbbells"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Goblet Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Goblet Squat') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Bench Press') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Shoulder Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Shoulder Press') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Reverse Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Reverse Lunge') limit 1),'sets',3,'reps','8/leg','rest_seconds',45,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Bicep Curl','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Bicep Curl') limit 1),'sets',2,'reps','12','rest_seconds',45,'order',5,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',2,'reps','30s','rest_seconds',30,'order',6,'cue',null,'modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.9,
  1467,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Beast Mode Strength',
  'Advanced heavy lifting split with lower volume but high intensity for strength peaks.',
  'strength',
  'sets_reps',
  'advanced',
  55,
  520,
  '{"full_body","back","quads"}'::text[],
  '{"barbell","rack","bench","pullup_bar"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Back Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Back Squat') limit 1),'sets',5,'reps','5','rest_seconds',120,'order',1,'cue',null,'modification',null,'suggested_load','75-88% 1RM'),
    jsonb_build_object('exercise_name','Conventional Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Conventional Deadlift') limit 1),'sets',4,'reps','4','rest_seconds',150,'order',2,'cue',null,'modification',null,'suggested_load','80-90% 1RM'),
    jsonb_build_object('exercise_name','Barbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bench Press') limit 1),'sets',5,'reps','5','rest_seconds',120,'order',3,'cue',null,'modification',null,'suggested_load','75-85% 1RM'),
    jsonb_build_object('exercise_name','Pull-up','exercise_id',(select id from public.exercises where lower(name)=lower('Pull-up') limit 1),'sets',4,'reps','AMRAP','rest_seconds',90,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Hip Thrust','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Hip Thrust') limit 1),'sets',3,'reps','8','rest_seconds',90,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.6,
  288,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Flexibility Flow',
  'Mobility and stretch flow to improve hip opening, thoracic movement, and downregulation.',
  'flexibility',
  'timed',
  'beginner',
  18,
  70,
  '{"hamstrings","glutes","core"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Hip Flexor Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hip Flexor Stretch') limit 1),'sets',2,'reps','40s/side','rest_seconds',15,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Hamstring Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hamstring Stretch') limit 1),'sets',2,'reps','40s','rest_seconds',15,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Pigeon Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Pigeon Pose') limit 1),'sets',2,'reps','40s/side','rest_seconds',15,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Child''s Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Child''s Pose') limit 1),'sets',2,'reps','60s','rest_seconds',15,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Side Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Side Plank') limit 1),'sets',2,'reps','30s/side','rest_seconds',15,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.5,
  733,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

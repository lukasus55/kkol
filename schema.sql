-- public.players definition

-- Drop table

-- DROP TABLE public.players;

CREATE TABLE public.players (
	id varchar(50) NOT NULL,
	displayed_name varchar(100) NOT NULL,
	password_hash text NOT NULL,
	email varchar(255) NULL,
	"role" varchar(50) DEFAULT 'player'::character varying NULL,
	last_login timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	is_active bool DEFAULT true NULL,
	last_pfp_change timestamptz NULL,
	last_name_change timestamptz NULL,
	pfp_base64 text NULL,
	CONSTRAINT players_email_key UNIQUE (email),
	CONSTRAINT players_pkey PRIMARY KEY (id)
);


-- public.tournaments definition

-- Drop table

-- DROP TABLE public.tournaments;

CREATE TABLE public.tournaments (
	id varchar(50) NOT NULL,
	displayed_name varchar(100) NOT NULL,
	page_exists bool DEFAULT false NULL,
	page_url varchar(255) NULL,
	finished bool DEFAULT false NULL,
	displayed_date varchar(50) NULL,
	tier varchar(10) DEFAULT 'C'::character varying NULL,
	end_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT tournaments_pkey PRIMARY KEY (id)
);


-- public.events definition

-- Drop table

-- DROP TABLE public.events;

CREATE TABLE public.events (
	id serial4 NOT NULL,
	tournament_id text NULL,
	creator_id text NULL,
	event_date timestamptz NOT NULL,
	"name" text NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	is_major bool DEFAULT false NULL,
	end_date timestamptz NULL,
	CONSTRAINT events_pkey PRIMARY KEY (id),
	CONSTRAINT events_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.players(id) ON DELETE SET NULL,
	CONSTRAINT events_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE
);


-- public.gd_levels definition

-- Drop table

-- DROP TABLE public.gd_levels;

CREATE TABLE public.gd_levels (
	id int4 NOT NULL,
	tournament_id varchar(50) NULL,
	"name" varchar(100) NULL,
	difficulty varchar(50) NULL,
	finished bool DEFAULT false NULL,
	CONSTRAINT gd_levels_pkey PRIMARY KEY (id),
	CONSTRAINT gd_levels_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);


-- public.gd_scores definition

-- Drop table

-- DROP TABLE public.gd_scores;

CREATE TABLE public.gd_scores (
	level_id int4 NOT NULL,
	player_id varchar(50) NOT NULL,
	"position" int4 NULL,
	score int4 NULL,
	CONSTRAINT gd_scores_pkey PRIMARY KEY (level_id, player_id),
	CONSTRAINT gd_scores_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.gd_levels(id),
	CONSTRAINT gd_scores_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);


-- public.polls definition

-- Drop table

-- DROP TABLE public.polls;

CREATE TABLE public.polls (
	id uuid NOT NULL,
	tournament_id varchar(50) NOT NULL,
	"name" text NOT NULL,
	create_default_options bool DEFAULT false NOT NULL,
	rights_level int2 DEFAULT 1 NOT NULL,
	start_date timestamptz(0) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	end_date timestamptz(0) DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval) NOT NULL,
	creator_id varchar(50) NULL,
	CONSTRAINT polls_pkey PRIMARY KEY (id),
	CONSTRAINT polls_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public.players(id) ON DELETE SET NULL,
	CONSTRAINT polls_tournament_id_foreign FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE
);


-- public.questions definition

-- Drop table

-- DROP TABLE public.questions;

CREATE TABLE public.questions (
	id uuid NOT NULL,
	poll_id uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	multiple_choice bool DEFAULT false NOT NULL,
	creator_id varchar(50) NULL,
	added_on timestamptz(0) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	sort_order int4 NOT NULL,
	page_url varchar(255) NULL,
	CONSTRAINT questions_id_poll_unique UNIQUE (id, poll_id),
	CONSTRAINT questions_pkey PRIMARY KEY (id),
	CONSTRAINT unique_poll_sort_order UNIQUE (poll_id, sort_order),
	CONSTRAINT questions_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public.players(id) ON DELETE SET NULL,
	CONSTRAINT questions_poll_id_foreign FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE
);


-- public.results definition

-- Drop table

-- DROP TABLE public.results;

CREATE TABLE public.results (
	tournament_id varchar(50) NOT NULL,
	player_id varchar(50) NOT NULL,
	attended bool DEFAULT true NULL,
	finished bool DEFAULT true NULL,
	"position" int4 NULL,
	total_points float8 NULL,
	CONSTRAINT results_pkey PRIMARY KEY (tournament_id, player_id),
	CONSTRAINT results_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE,
	CONSTRAINT results_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);


-- public.tournament_organizers definition

-- Drop table

-- DROP TABLE public.tournament_organizers;

CREATE TABLE public.tournament_organizers (
	tournament_id varchar(50) NOT NULL,
	player_id varchar(50) NOT NULL,
	"role" varchar(20) NOT NULL,
	CONSTRAINT tournament_organizers_pkey PRIMARY KEY (tournament_id, player_id),
	CONSTRAINT tournament_organizers_role_check CHECK (((role)::text = ANY (ARRAY[('owner'::character varying)::text, ('manager'::character varying)::text]))),
	CONSTRAINT tournament_organizers_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE,
	CONSTRAINT tournament_organizers_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE
);


-- public.event_results definition

-- Drop table

-- DROP TABLE public.event_results;

CREATE TABLE public.event_results (
	id serial4 NOT NULL,
	event_id int4 NOT NULL,
	player_id varchar(255) NOT NULL,
	points numeric(10, 2) NULL,
	"position" int4 NULL,
	CONSTRAINT event_results_event_id_player_id_key UNIQUE (event_id, player_id),
	CONSTRAINT event_results_pkey PRIMARY KEY (id),
	CONSTRAINT event_results_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE
);


-- public."options" definition

-- Drop table

-- DROP TABLE public."options";

CREATE TABLE public."options" (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	question_id uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT options_pkey PRIMARY KEY (id),
	CONSTRAINT options_question_id_foreign FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);


-- public.poll_default_options definition

-- Drop table

-- DROP TABLE public.poll_default_options;

CREATE TABLE public.poll_default_options (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	poll_id uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	hex varchar(10) NOT NULL,
	CONSTRAINT poll_default_options_pkey PRIMARY KEY (id),
	CONSTRAINT poll_default_options_poll_id_foreign FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE
);


-- public.poll_labels definition

-- Drop table

-- DROP TABLE public.poll_labels;

CREATE TABLE public.poll_labels (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	poll_id uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	hex varchar(10) NOT NULL,
	description text NULL,
	CONSTRAINT labels_id_poll_unique UNIQUE (id, poll_id),
	CONSTRAINT poll_labels_pkey PRIMARY KEY (id),
	CONSTRAINT poll_labels_poll_id_foreign FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE
);


-- public.questions_poll_labels definition

-- Drop table

-- DROP TABLE public.questions_poll_labels;

CREATE TABLE public.questions_poll_labels (
	question_id uuid NOT NULL,
	label_id int8 NOT NULL,
	poll_id uuid NOT NULL,
	CONSTRAINT questions_poll_labels_pkey PRIMARY KEY (question_id, label_id),
	CONSTRAINT fk_label_match FOREIGN KEY (label_id,poll_id) REFERENCES public.poll_labels(id,poll_id) ON DELETE CASCADE,
	CONSTRAINT fk_question_match FOREIGN KEY (question_id,poll_id) REFERENCES public.questions(id,poll_id) ON DELETE CASCADE,
	CONSTRAINT questions_poll_labels_label_id_foreign FOREIGN KEY (label_id) REFERENCES public.poll_labels(id) ON DELETE CASCADE,
	CONSTRAINT questions_poll_labels_question_id_foreign FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);


-- public.checked_answers definition

-- Drop table

-- DROP TABLE public.checked_answers;

CREATE TABLE public.checked_answers (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	option_id int8 NOT NULL,
	player_id varchar(50) NOT NULL,
	CONSTRAINT checked_answers_pkey PRIMARY KEY (id),
	CONSTRAINT checked_answers_unique_vote UNIQUE (option_id, player_id),
	CONSTRAINT checked_answers_option_id_foreign FOREIGN KEY (option_id) REFERENCES public."options"(id) ON DELETE CASCADE,
	CONSTRAINT checked_answers_player_id_foreign FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE
);
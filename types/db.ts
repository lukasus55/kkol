export interface Player {
    id: string;
    displayed_name: string;
    password_hash: string;
    email?: string | null;
    role?: string | null;
    last_login?: Date | string | null;
    created_at?: Date | string | null;
    is_active?: boolean | null;
    last_pfp_change?: Date | string | null;
    last_name_change?: Date | string | null;
    pfp_base64?: string | null;
}

export interface Tournament {
    id: string;
    displayed_name: string;
    page_exists: boolean;
    page_url?: string | null;
    finished: boolean;
    start_date?: Date | string | null;
    end_date?: Date | string | null;
    displayed_date?: string | null;
    tier?: string | null;
}

export interface Event {
    id: number;
    tournament_id?: string | null;
    creator_id?: string | null;
    event_date: Date | string;
    name: string;
    created_at?: Date | string | null;
    is_major?: boolean | null;
    end_date?: Date | string | null;
}

export interface EventResult {
    id: number;
    event_id: number;
    player_id: string;
    points?: number | string | null;
    position?: number | null;
}

export interface GdLevel {
    id: number;
    tournament_id?: string | null;
    name?: string | null;
    difficulty?: string | null;
    finished?: boolean | null;
}

export interface GdScore {
    level_id: number;
    player_id: string;
    position?: number | null;
    score?: number | null;
}

export interface Poll {
    id: string;
    tournament_id: string;
    name: string;
    create_default_options: boolean;
    rights_level: number;
    start_date: Date | string;
    end_date: Date | string;
    creator_id?: string | null;
}

export interface Question {
    id: string;
    poll_id: string;
    name: string;
    multiple_choice: boolean;
    creator_id?: string | null;
    added_on: Date | string;
    sort_order: number;
    page_url?: string | null;
}

export interface Option {
    id: number | string;
    question_id: string;
    name: string;
}

export interface PollDefaultOption {
    id: number | string;
    poll_id: string;
    name: string;
    sort_order: number;
}

export interface PollLabel {
    id: number | string;
    poll_id: string;
    name: string;
    hex: string;
    description?: string | null;
}

export interface QuestionPollLabel {
    question_id: string;
    label_id: number | string;
    poll_id: string;
}

export interface CheckedAnswer {
    id: number | string;
    option_id: number | string;
    player_id: string;
}

export interface Result {
    tournament_id: string;
    player_id: string;
    attended?: boolean | null;
    finished?: boolean | null;
    position?: number | null;
    total_points?: number | null;
}

export interface TournamentOrganizer {
    tournament_id: string;
    player_id: string;
    role: 'owner' | 'manager' | string;
}

export interface AvailabilityDefault {
    id: string;
    player_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    status: 'available' | 'maybe' | 'unavailable' | string;
}

export interface AvailabilityOverride {
    id: string;
    player_id: string;
    specific_date: Date | string;
    start_time: string;
    end_time: string;
    status: 'available' | 'maybe' | 'unavailable' | string;
}

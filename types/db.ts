export interface Player {
    id: string;
    displayed_name: string;
    pfp_base64?: string;
    global_role: string;
}

export interface Tournament {
    id: string;
    displayed_name: string;
    page_exists: boolean;
    page_url: string;
    finished: boolean;
    start_date: string;
    end_date: string;
    displayed_date: string;
    tier: string;
}

export interface Poll {
    id: string;
    tournament_id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    rights_level: number;
}

export interface Question {
    id: string;
    poll_id: string;
    name: string;
    multiple_choice: boolean;
    sort_order: number;
}

export interface Option {
    id: string;
    question_id: string;
    name: string;
    sort_order: number;
}

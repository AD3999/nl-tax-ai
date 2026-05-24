import { client } from "./client";

export interface IBField {
  field_code: string;
  box: number;
  section_nl: string;
  section_en: string;
  official_label_nl: string;
  plain_question_nl: string;
  plain_question_en: string;
  plain_question_fa: string;
  help_text_nl: string;
  help_text_en: string;
  help_text_fa: string;
  input_type: "currency_amount" | "boolean" | "percentage";
  required_for: string[];
  user_types: string[];
  rule_ids: string[];
  source_url: string;
  common_mistakes: string[];
  ai_follow_up_questions: string[];
}

export const fetchIBFields = (userType?: string): Promise<IBField[]> =>
  client
    .get<IBField[]>("/tax/ib/fields/", { params: userType ? { user_type: userType } : {} })
    .then((r) => r.data);

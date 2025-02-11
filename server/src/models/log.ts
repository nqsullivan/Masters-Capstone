export interface Log {
  id: string;
  timestamp: Date;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
}

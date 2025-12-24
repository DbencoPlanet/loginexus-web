export interface Shipment {
  id: string;
  tracking_number: string;
  status:
    | "NEW"
    | "QUOTED"
    | "BOOKED"
    | "DISPATCHED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED";
  total_weight: number;
  price_quoted?: number;
  created_at: string;
  // We can add stops/items later if needed for the list view
}

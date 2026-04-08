export type UserRole =
  | "CUSTOMER"
  | "HOTEL_ADMIN"
  | "HOTEL_STAFF"
  | "SUPER_ADMIN"
  | "RECEPTION"
  | "CASHIER"
  | "HOUSEKEEPING";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "CHECKED_IN" | "COMPLETED";

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  city: string;
  address: string;
  neighborhood?: string | null;
  stars: number;
  rating: number;
  coverImage?: string | null;
  amenities?: string | null;
  active?: boolean;
  rooms?: Room[];
}

export interface Room {
  id: number;
  hotelId: number;
  name: string;
  code: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  description?: string | null;
  amenities?: string | null;
  status: RoomStatus;
  active: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username?: string | null;
  document?: string | null;
  phone?: string | null;
  role: UserRole;
  status?: string;
  hotel: Pick<Hotel, "id" | "name" | "slug"> | null;
}

export interface Session {
  token: string;
  user: User;
}

export interface Booking {
  id: number;
  reference: string;
  hotelId: number;
  roomId: number;
  customerId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string | null;
  hotel: Hotel;
  room: Room;
}

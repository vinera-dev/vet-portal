export const typeDefs = `
  scalar Date
  scalar LocalDateTime

  enum ServiceType {
    CONSULTATION
    VACCINATION
    GROOMING
    EXAM
  }

  enum AppointmentStatus {
    SCHEDULED
    CANCELLED
  }

  enum ErrorCode {
    NOT_FOUND
    SLOT_UNAVAILABLE
    INVALID_STATUS
    PAST_SLOT
    OUTSIDE_BUSINESS_HOURS
    VALIDATION_ERROR
    UPSTREAM_UNAVAILABLE
    UPSTREAM_ERROR
  }

  type Clinic {
    name: String!
    opensAt: String!
    closesAt: String!
    slotMinutes: Int!
  }

  type Slot {
    start: LocalDateTime!
    time: String!
  }

  type Appointment {
    id: ID!
    tutorName: String!
    petName: String!
    service: ServiceType!
    start: LocalDateTime!
    status: AppointmentStatus!
  }

  input BookAppointmentInput {
    tutorName: String!
    petName: String!
    service: ServiceType!
    start: LocalDateTime!
  }

  type Query {
    clinic: Clinic!
    slots(day: Date!): [Slot!]!
    appointment(id: ID!): Appointment!
  }

  type Mutation {
    bookAppointment(input: BookAppointmentInput!): Appointment!
    rescheduleAppointment(id: ID!, newStart: LocalDateTime!): Appointment!
    cancelAppointment(id: ID!): Appointment!
  }
`;

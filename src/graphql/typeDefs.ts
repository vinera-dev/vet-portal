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
  }

  type Mutation {
    bookAppointment(input: BookAppointmentInput!): Appointment!
  }
`;

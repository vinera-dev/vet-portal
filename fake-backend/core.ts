export interface FakeRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface FakeResponse {
  status: number;
  body: unknown;
}

export interface FakeBackendOptions {
  now?: () => Date;
  chatFailure?: () => boolean;
}

interface StoredAppointment {
  id: string;
  tutor_name: string;
  pet_name: string;
  service: string;
  start: string;
  status: "scheduled" | "cancelled";
}

interface ChatSession {
  messages: string[];
}

type Lookup = { item: StoredAppointment } | { error: FakeResponse };

const SERVICES = ["consulta", "vacina", "banho_tosa", "exame"];
const OPENING_MINUTES = 8 * 60;
const CLOSING_MINUTES = 18 * 60;
const SLOT_MINUTES = 30;
const SUNDAY = 0;
const EMERGENCY_WORDS = ["emergency", "emergencia", "emergência", "poison", "veneno", "convuls"];

const EMERGENCY_MESSAGE =
  "Isso pode ser uma emergência. Não espere por agendamento: ligue agora para a recepção no (11) 4000-0000 e leve o animal à clínica imediatamente. Estou encaminhando seu caso para a equipe humana.";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localIso(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseLocal(value: string): { day: string; iso: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute, second = "00"] = match;
  return {
    day: `${year}-${month}-${day}`,
    iso: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
  };
}

function weekday(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).getUTCDay();
}

function validationError(field: string, message: string): FakeResponse {
  return {
    status: 422,
    body: { detail: [{ loc: ["body", field], msg: message, type: "value_error" }] },
  };
}

function schedulingError(status: number, code: string, message: string): FakeResponse {
  return { status, body: { detail: { code, message } } };
}

export function createFakeBackend(options: FakeBackendOptions = {}) {
  const now = options.now ?? (() => new Date());
  const appointments = new Map<string, StoredAppointment>();
  const sessions = new Map<string, ChatSession>();
  let sequence = 0;

  function bookedStarts(): Set<string> {
    return new Set(
      [...appointments.values()]
        .filter((item) => item.status === "scheduled")
        .map((item) => item.start),
    );
  }

  function daySlots(day: string): string[] {
    const slots: string[] = [];
    for (let minutes = OPENING_MINUTES; minutes < CLOSING_MINUTES; minutes += SLOT_MINUTES) {
      slots.push(`${day}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`);
    }
    return slots;
  }

  function availableSlots(day: string): string[] {
    if (weekday(day) === SUNDAY) {
      return [];
    }
    const booked = bookedStarts();
    const current = localIso(now());
    return daySlots(day).filter((slot) => slot > current && !booked.has(slot));
  }

  function checkBookable(start: unknown): { iso: string } | { error: FakeResponse } {
    const parsed = typeof start === "string" ? parseLocal(start) : null;
    if (!parsed) {
      return { error: validationError("start", "Input should be a valid datetime") };
    }
    if (parsed.iso <= localIso(now())) {
      return { error: schedulingError(422, "past_slot", "O horário escolhido já passou.") };
    }
    if (weekday(parsed.day) === SUNDAY || !daySlots(parsed.day).includes(parsed.iso)) {
      return {
        error: schedulingError(
          422,
          "outside_business_hours",
          "Atendemos de segunda a sábado, das 08:00 às 18:00, em horários de 30 minutos.",
        ),
      };
    }
    if (bookedStarts().has(parsed.iso)) {
      return { error: schedulingError(409, "slot_unavailable", "Esse horário já está ocupado.") };
    }
    return { iso: parsed.iso };
  }

  function findScheduled(id: string): Lookup {
    const item = appointments.get(id);
    if (!item) {
      return { error: schedulingError(404, "not_found", "Agendamento não encontrado.") };
    }
    if (item.status !== "scheduled") {
      return { error: schedulingError(409, "invalid_status", "O agendamento não está ativo.") };
    }
    return { item };
  }

  function book(body: unknown): FakeResponse {
    const input = (body ?? {}) as Record<string, unknown>;
    for (const field of ["tutor_name", "pet_name"]) {
      const value = input[field];
      if (typeof value !== "string" || value.length < 1 || value.length > 120) {
        return validationError(field, "String should have at least 1 character");
      }
    }
    if (typeof input.service !== "string" || !SERVICES.includes(input.service)) {
      return validationError("service", "Input should be a valid service");
    }
    const checked = checkBookable(input.start);
    if ("error" in checked) {
      return checked.error;
    }
    sequence += 1;
    const item: StoredAppointment = {
      id: `apt-${String(sequence).padStart(4, "0")}`,
      tutor_name: input.tutor_name as string,
      pet_name: input.pet_name as string,
      service: input.service,
      start: checked.iso,
      status: "scheduled",
    };
    appointments.set(item.id, item);
    return { status: 201, body: item };
  }

  function reschedule(id: string, body: unknown): FakeResponse {
    const found = findScheduled(id);
    if ("error" in found) {
      return found.error;
    }
    const checked = checkBookable(((body ?? {}) as Record<string, unknown>).new_start);
    if ("error" in checked) {
      return checked.error;
    }
    found.item.start = checked.iso;
    return { status: 200, body: found.item };
  }

  function cancel(id: string): FakeResponse {
    const found = findScheduled(id);
    if ("error" in found) {
      return found.error;
    }
    found.item.status = "cancelled";
    return { status: 200, body: found.item };
  }

  function chat(body: unknown): FakeResponse {
    const input = (body ?? {}) as Record<string, unknown>;
    if (typeof input.message !== "string" || input.message.length < 1) {
      return validationError("message", "String should have at least 1 character");
    }
    if (options.chatFailure?.()) {
      return { status: 503, body: { detail: "Service unavailable" } };
    }
    const requested = typeof input.session_id === "string" ? input.session_id : null;
    const sessionId = requested ?? `session-${sessions.size + 1}`;
    const session = sessions.get(sessionId) ?? { messages: [] };
    session.messages.push(input.message);
    sessions.set(sessionId, session);
    const text = input.message.toLowerCase();

    if (EMERGENCY_WORDS.some((word) => text.includes(word))) {
      return {
        status: 200,
        body: {
          session_id: sessionId,
          reply: EMERGENCY_MESSAGE,
          intent: "emergency",
          escalated: true,
          grounded: null,
          sources: [],
          tool_calls: [],
        },
      };
    }
    if (text.includes("vacina") || text.includes("vaccin")) {
      return {
        status: 200,
        body: {
          session_id: sessionId,
          reply:
            "Aplicamos vacinas de segunda a sábado. A vacina múltipla é anual e a antirrábica também.",
          intent: "faq",
          escalated: false,
          grounded: true,
          sources: [
            { source: "faq/vacinas.md", title: "Vacinas", score: 0.91 },
            { source: "faq/horarios.md", title: "Horários", score: 0.62 },
          ],
          tool_calls: [],
        },
      };
    }
    return {
      status: 200,
      body: {
        session_id: sessionId,
        reply: `Mensagem ${session.messages.length} desta conversa: ${session.messages.join(" | ")}`,
        intent: "smalltalk",
        escalated: false,
        grounded: null,
        sources: [],
        tool_calls: [],
      },
    };
  }

  function handle(request: FakeRequest): FakeResponse {
    const method = request.method.toUpperCase();
    const path = request.path.replace(/\/+$/, "");
    if (method === "GET" && path === "/appointments/slots") {
      const day = request.query.get("day");
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        return validationError("day", "Input should be a valid date");
      }
      return { status: 200, body: availableSlots(day) };
    }
    if (method === "POST" && path === "/appointments") {
      return book(request.body);
    }
    const match = /^\/appointments\/([^/]+)$/.exec(path);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (method === "GET") {
        const item = appointments.get(id);
        return item
          ? { status: 200, body: item }
          : schedulingError(404, "not_found", "Agendamento não encontrado.");
      }
      if (method === "PATCH") {
        return reschedule(id, request.body);
      }
      if (method === "DELETE") {
        return cancel(id);
      }
    }
    if (method === "POST" && path === "/agent/chat") {
      return chat(request.body);
    }
    return { status: 404, body: { detail: "Not Found" } };
  }

  function reset(): void {
    appointments.clear();
    sessions.clear();
    sequence = 0;
  }

  return { handle, reset, appointments };
}

export type FakeBackend = ReturnType<typeof createFakeBackend>;

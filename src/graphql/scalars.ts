import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { isValidDate, normalizeLocalDateTime } from "@/lib/datetime";

function stringValue(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new GraphQLError(`${name} must be a string`);
  }
  return value;
}

export const DateScalar = new GraphQLScalarType<string, string>({
  name: "Date",
  serialize: (value) => stringValue(value, "Date"),
  parseValue: (value) => {
    const text = stringValue(value, "Date");
    if (!isValidDate(text)) {
      throw new GraphQLError("Date must be a valid YYYY-MM-DD value");
    }
    return text;
  },
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.STRING || !isValidDate(ast.value)) {
      throw new GraphQLError("Date must be a valid YYYY-MM-DD value");
    }
    return ast.value;
  },
});

export const LocalDateTimeScalar = new GraphQLScalarType<string, string>({
  name: "LocalDateTime",
  serialize: (value) => stringValue(value, "LocalDateTime"),
  parseValue: (value) => {
    const normalized = normalizeLocalDateTime(stringValue(value, "LocalDateTime"));
    if (!normalized) {
      throw new GraphQLError("LocalDateTime must be a valid YYYY-MM-DDTHH:mm[:ss] value");
    }
    return normalized;
  },
  parseLiteral: (ast) => {
    const normalized = ast.kind === Kind.STRING ? normalizeLocalDateTime(ast.value) : null;
    if (!normalized) {
      throw new GraphQLError("LocalDateTime must be a valid YYYY-MM-DDTHH:mm[:ss] value");
    }
    return normalized;
  },
});

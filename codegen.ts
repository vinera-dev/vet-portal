import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/typeDefs.ts",
  documents: ["src/graphql/operations/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "schema.graphql": {
      plugins: ["schema-ast"],
    },
    "src/gql/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        contextType: "@/graphql/context#GraphqlContext",
        scalars: { Date: "string", LocalDateTime: "string" },
      },
    },
    "src/gql/operations.ts": {
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        scalars: { Date: "string", LocalDateTime: "string" },
      },
    },
  },
};

export default config;
